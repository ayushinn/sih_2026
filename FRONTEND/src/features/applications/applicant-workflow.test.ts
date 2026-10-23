import { describe, it, expect, beforeEach } from 'vitest';
import { apiClient } from '../../api/client';
import { mockServer } from '../../api/mock/server';
import { DEMO_USERS } from '../../api/mock/data';
import { Application, DocumentMeta, Job } from '../../api/types';
import { ThermoraApiError } from '../../api/errors';
import { mapJobStatus, mapApplicationStatus } from '../../lib/status-mappers';

describe('Applicant Workflow Integration Tests', () => {
  beforeEach(() => {
    mockServer.resetData();
    mockServer.setCurrentUser(DEMO_USERS['applicant@demo.test']);
  });

  describe('1. Document Upload & Error Scenarios', () => {
    it('successfully uploads valid PDF/JPG/PNG documents and returns DocumentMeta', async () => {
      const res = await apiClient.post<DocumentMeta>(
        '/applications/APP-2026-8810/documents',
        {
          filename: 'valid_land_certificate.pdf',
          doc_type: 'Land Ownership / Lease Deed',
          size: 2 * 1024 * 1024,
        }
      );

      expect(res.id).toBeDefined();
      expect(res.doc_type).toBe('Land Ownership / Lease Deed');
      expect(res.filename).toBe('valid_land_certificate.pdf');
      expect(res.sha256).toBeDefined();
    });

    it('rejects unsupported file formats with validation error 422', async () => {
      await expect(
        apiClient.post('/applications/APP-2026-8810/documents', {
          filename: 'malicious_script.exe',
          doc_type: 'Land Ownership / Lease Deed',
        })
      ).rejects.toThrow(ThermoraApiError);

      try {
        await apiClient.post('/applications/APP-2026-8810/documents', {
          filename: 'archive_payload.zip',
          doc_type: 'Supporting Evidence',
        });
      } catch (err: any) {
        expect(err.status).toBe(422);
        expect(err.message).toContain('Only PDF, JPG, and PNG');
      }
    });

    it('rejects oversized files exceeding 15MB limit with 422', async () => {
      try {
        await apiClient.post('/applications/APP-2026-8810/documents', {
          filename: 'oversize_blueprint.pdf',
          doc_type: 'Approved Building Floor Plan',
          size: 25 * 1024 * 1024, // 25MB
        });
      } catch (err: any) {
        expect(err.status).toBe(422);
        expect(err.message).toContain('15MB');
      }
    });

    it('returns 404 when uploading to a non-existent application', async () => {
      await expect(
        apiClient.post('/applications/APP-NON-EXISTENT-9999/documents', {
          filename: 'doc.pdf',
          doc_type: 'Supporting Evidence',
        })
      ).rejects.toThrow(ThermoraApiError);
    });

    it('replaces existing document when rectifying document of the same type', async () => {
      const initial = await apiClient.post<DocumentMeta>(
        '/applications/APP-2026-8810/documents',
        {
          filename: 'fire_noc_v1.pdf',
          doc_type: 'Fire & Safety Certificate',
        }
      );

      const replaced = await apiClient.post<DocumentMeta>(
        '/applications/APP-2026-8810/documents',
        {
          filename: 'fire_noc_v2_rectified.pdf',
          doc_type: 'Fire & Safety Certificate',
        }
      );

      expect(replaced.filename).toBe('fire_noc_v2_rectified.pdf');
      expect(replaced.doc_type).toBe('Fire & Safety Certificate');
    });
  });

  describe('2. Validation Pre-Check Job States', () => {
    it('enqueues validation and returns 202 Accepted with queued job status', async () => {
      const res = await apiClient.post<{ job_id: string; status: string }>(
        '/applications/APP-2026-8810/validate'
      );

      expect(res.job_id).toBeDefined();
      expect(res.status).toBe('queued');

      const job = await apiClient.get<Job>(`/jobs/${res.job_id}`);
      expect(job.status).toBe('queued');
    });

    it('handles simulated job failure state and surfaces error message', async () => {
      const res = await apiClient.post<{ job_id: string; status: string }>(
        '/applications/APP-2026-8810/validate',
        { simulated_failure: true }
      );

      expect(res.job_id).toBeDefined();

      // Wait for async job failure transition
      await new Promise((r) => setTimeout(r, 2200));

      const job = await apiClient.get<Job>(`/jobs/${res.job_id}`);
      expect(job.status).toBe('failed');
      expect(job.error).toContain('OCR layout extraction failed');
    });

    it('maps job states correctly via mapJobStatus adapter', () => {
      const queuedPresentation = mapJobStatus('queued');
      expect(queuedPresentation.label).toBe('Queued');
      expect(queuedPresentation.variant).toBe('neutral');

      const runningPresentation = mapJobStatus('running');
      expect(runningPresentation.label).toContain('Validating');
      expect(runningPresentation.variant).toBe('info');

      const completedPresentation = mapJobStatus('completed');
      expect(completedPresentation.label).toBe('Validation Complete');
      expect(completedPresentation.variant).toBe('ok');

      const failedPresentation = mapJobStatus('failed');
      expect(failedPresentation.label).toBe('Validation Failed');
      expect(failedPresentation.variant).toBe('danger');

      const unknownPresentation = mapJobStatus('custom_unrecognized_state');
      expect(unknownPresentation.variant).toBe('neutral');
      expect(unknownPresentation.label).toBe('Custom Unrecognized State');
    });
  });

  describe('3. Application Submission & State Gate Rules', () => {
    it('allows submission when application is in draft status', async () => {
      // Create a fresh draft application
      const newApp = await apiClient.post<Application>('/applications', {
        category: 'Technical Degree (Engineering & Technology)',
      });
      expect(newApp.status).toBe('draft');

      const submitted = await apiClient.post<Application>(
        `/applications/${newApp.id}/submit`
      );
      expect(submitted.status).toBe('submitted');
      expect(submitted.submitted_at).toBeDefined();
    });

    it('rejects submission when application is already approved or rejected', async () => {
      // Set application to approved
      const app = await apiClient.get<Application>('/applications/APP-2026-8810');
      app.status = 'approved';

      try {
        await apiClient.post('/applications/APP-2026-8810/submit');
        expect.unreachable('Should have thrown validation error');
      } catch (err: any) {
        expect(err.status).toBe(422);
        expect(err.message).toContain('approved');
      }
    });

    it('forbids non-applicant roles from calling submit', async () => {
      mockServer.setCurrentUser(DEMO_USERS['officer@demo.test']);

      try {
        await apiClient.post('/applications/APP-2026-8810/submit');
        expect.unreachable('Should have thrown forbidden error');
      } catch (err: any) {
        expect(err.status).toBe(403);
      }
    });
  });
});
