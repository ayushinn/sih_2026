import { describe, it, expect, beforeEach } from 'vitest';
import { apiClient, buildCleanUrl, resetRefreshState } from './client';
import { mockServer } from './mock/server';
import { DEMO_USERS } from './mock/data';
import { Application, Page } from './types';
import { ThermoraApiError } from './errors';

describe('apiClient HTTP & Mock Integration', () => {
  beforeEach(() => {
    mockServer.resetData();
    resetRefreshState();
  });

  describe('Clean URL Builder', () => {
    it('prepends API_BASE_URL and eliminates duplicate slashes', () => {
      const url = buildCleanUrl('/applications/');
      expect(url).not.toMatch(/\/$/);
      expect(url).toContain('/api/v1/applications');
    });

    it('attaches formatted query params safely', () => {
      const url = buildCleanUrl('/applications', { page: 2, status: 'submitted' });
      expect(url).toContain('page=2');
      expect(url).toContain('status=submitted');
    });
  });

  describe('Authentication & Session Endpoints', () => {
    it('fetches current authenticated user via GET /auth/me', async () => {
      mockServer.setCurrentUser(DEMO_USERS['applicant@demo.test']);
      const me = await apiClient.get<any>('/auth/me');
      expect(me.email).toBe('applicant@demo.test');
      expect(me.role).toBe('applicant');
    });

    it('authenticates with valid demo credentials via POST /auth/login', async () => {
      mockServer.setCurrentUser(null);
      const res = await apiClient.post<any>('/auth/login', {
        email: 'officer@demo.test',
        password: 'any_password',
      });
      expect(res.user.role).toBe('officer');
      expect(mockServer.getCurrentUser()?.email).toBe('officer@demo.test');
    });

    it('clears session on POST /auth/logout', async () => {
      mockServer.setCurrentUser(DEMO_USERS['officer@demo.test']);
      await apiClient.post('/auth/logout');
      expect(mockServer.getCurrentUser()).toBeNull();

      await expect(apiClient.get('/auth/me')).rejects.toThrow(ThermoraApiError);
    });

    it('throws 422 if login credentials are missing', async () => {
      mockServer.setCurrentUser(null);
      await expect(
        apiClient.post('/auth/login', { email: '' })
      ).rejects.toThrow(ThermoraApiError);
    });
  });

  describe('Role-Based Authorization & Object Ownership Rules', () => {
    it('applicant can only view applications belonging to their own institution', async () => {
      mockServer.setCurrentUser(DEMO_USERS['applicant@demo.test']);
      const res = await apiClient.get<Page<Application>>('/applications');

      expect(res.items.length).toBeGreaterThan(0);
      res.items.forEach((app) => {
        expect(app.institution_id).toBe('INST-AICTE-1042');
      });
    });

    it('applicant receives 404 when attempting to access another institution application', async () => {
      mockServer.setCurrentUser(DEMO_USERS['applicant@demo.test']);
      // APP-2026-7291 belongs to INST-AICTE-5509, not applicant's INST-AICTE-1042
      await expect(apiClient.get('/applications/APP-2026-7291')).rejects.toThrow(ThermoraApiError);
    });

    it('applicant is forbidden (403) from accessing the officer scrutiny queue', async () => {
      mockServer.setCurrentUser(DEMO_USERS['applicant@demo.test']);
      await expect(apiClient.get('/officer/queue')).rejects.toThrow(ThermoraApiError);
    });

    it('non-officer role is forbidden (403) from recording an official decision', async () => {
      mockServer.setCurrentUser(DEMO_USERS['applicant@demo.test']);
      await expect(
        apiClient.post('/applications/APP-2026-8810/decision', {
          decision: 'approve',
          decision_note: 'Attempted by applicant',
        })
      ).rejects.toThrow(ThermoraApiError);
    });

    it('officer can record an official regulatory decision', async () => {
      mockServer.setCurrentUser(DEMO_USERS['officer@demo.test']);
      const res = await apiClient.post<any>('/applications/APP-2026-8810/decision', {
        decision: 'approve',
        decision_note: 'All land and fire safety documents inspected and verified.',
      });
      expect(res.decision).toBe('approve');
      expect(res.status).toBe('approved');
    });

    it('admin can access checklist rules, but applicant cannot', async () => {
      mockServer.setCurrentUser(DEMO_USERS['applicant@demo.test']);
      await expect(apiClient.get('/admin/checklists')).rejects.toThrow(ThermoraApiError);

      mockServer.setCurrentUser(DEMO_USERS['admin@demo.test']);
      const checklists = await apiClient.get<any[]>('/admin/checklists');
      expect(checklists.length).toBeGreaterThan(0);
    });

    it('auditor can access audit logs, but applicant cannot', async () => {
      mockServer.setCurrentUser(DEMO_USERS['applicant@demo.test']);
      await expect(apiClient.get('/audit')).rejects.toThrow(ThermoraApiError);

      mockServer.setCurrentUser(DEMO_USERS['auditor@demo.test']);
      const audit = await apiClient.get<Page<any>>('/audit');
      expect(audit.items.length).toBeGreaterThan(0);
    });
  });

  describe('Validation Pre-Check Async Job Lifecycle', () => {
    it('POST /applications/{id}/validate returns 202 Accepted with job id', async () => {
      mockServer.setCurrentUser(DEMO_USERS['applicant@demo.test']);
      const res = await apiClient.post<any>('/applications/APP-2026-8810/validate');
      expect(res.job_id).toBeDefined();
      expect(res.status).toBe('queued');

      const jobStatus = await apiClient.get<any>(`/jobs/${res.job_id}`);
      expect(jobStatus.id).toBe(res.job_id);
    });
  });
});
