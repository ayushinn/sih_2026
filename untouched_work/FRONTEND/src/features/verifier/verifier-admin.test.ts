import { describe, it, expect, beforeEach } from 'vitest';
import { mockServer } from '../../api/mock/server';
import { DEMO_USERS } from '../../api/mock/data';
import { ThermoraApiError } from '../../api/errors';
import { verificationQueries } from '../../api/queries/verifications';
import { adminQueries } from '../../api/queries/admin';
import { officerQueries } from '../../api/queries/officer';
import { auditQueries } from '../../api/queries/audit';
import { mapVerificationStatus, formatRawStatus } from '../../lib/status-mappers';
import { isRouteAllowed } from '../../lib/permissions';
import { VerificationStatus } from '../../api/types';

describe('Step 5: Verifier Workspace, Admin Governance, and Audit Stream Tests', () => {
  beforeEach(() => {
    mockServer.resetData();
  });

  describe('1. Six Exact Statutory Verification Statuses', () => {
    const statutoryStatuses: { status: VerificationStatus; expectedLabel: string; expectedVariant: string }[] = [
      { status: 'verified', expectedLabel: 'Verified', expectedVariant: 'ok' },
      { status: 'failed', expectedLabel: 'Failed', expectedVariant: 'danger' },
      { status: 'inconclusive', expectedLabel: 'Inconclusive', expectedVariant: 'neutral' },
      { status: 'pending', expectedLabel: 'Verification pending', expectedVariant: 'info' },
      { status: 'manual_required', expectedLabel: 'Manual review required', expectedVariant: 'warn' },
      { status: 'exempt', expectedLabel: 'Exempt', expectedVariant: 'neutral' },
    ];

    statutoryStatuses.forEach(({ status, expectedLabel, expectedVariant }) => {
      it(`maps exact statutory status '${status}' to '${expectedLabel}' with variant '${expectedVariant}'`, () => {
        const pres = mapVerificationStatus(status);
        expect(pres).toBeDefined();
        expect(pres.label).toBe(expectedLabel);
        expect(pres.variant).toBe(expectedVariant);
        expect(pres.badgeClass).toBeDefined();
        expect(pres.badgeClass.length).toBeGreaterThan(0);
      });
    });

    it('successfully retrieves verification list containing the six statutory statuses from the API', async () => {
      mockServer.setCurrentUser(DEMO_USERS['verifier@demo.test']);
      const list = await verificationQueries.getVerifications();

      expect(list).toBeDefined();
      expect(Array.isArray(list)).toBe(true);
      expect(list.length).toBeGreaterThanOrEqual(6);

      const statusesInDb = list.map((v) => v.status);
      expect(statusesInDb).toContain('verified');
      expect(statusesInDb).toContain('failed');
      expect(statusesInDb).toContain('inconclusive');
      expect(statusesInDb).toContain('pending');
      expect(statusesInDb).toContain('manual_required');
      expect(statusesInDb).toContain('exempt');

      // Verify each item includes required fields: source, timestamp, compared fields
      list.forEach((v) => {
        expect(v.id).toBeDefined();
        expect(v.document_id).toBeDefined();
        expect(v.source).toBeDefined();
        expect(v.source.length).toBeGreaterThan(0);
        expect(v.checked_at).toBeDefined();
        expect(new Date(v.checked_at).getTime()).not.toBeNaN();
        expect(v.compared).toBeDefined();
      });
    });
  });

  describe('2. Unknown Status Safety', () => {
    it('gracefully handles arbitrary unknown status string without throwing or crashing', () => {
      const unknownStatuses = [
        'unrecognized_custom_status_xyz',
        'EXTERNAL_SYSTEM_SYNC_99',
        'partially_valid_maybe',
        'weird--format_status',
        '',
      ];

      unknownStatuses.forEach((raw) => {
        expect(() => mapVerificationStatus(raw)).not.toThrow();
        const pres = mapVerificationStatus(raw);
        expect(pres).toBeDefined();
        expect(pres.variant).toBe('neutral');
        expect(pres.badgeClass).toContain('bg-muted/10');
        expect(pres.label).toBeDefined();
      });
    });

    it('safely handles null and undefined inputs', () => {
      expect(() => mapVerificationStatus(undefined)).not.toThrow();
      const pres = mapVerificationStatus(undefined as any);
      expect(pres.variant).toBe('neutral');
      expect(pres.label).toBe('Unknown');
    });

    it('formats raw status strings into readable title case', () => {
      expect(formatRawStatus('third_party_timeout')).toBe('Third Party Timeout');
      expect(formatRawStatus('registry-down')).toBe('Registry Down');
      expect(formatRawStatus('')).toBe('Unknown');
    });
  });

  describe('3. Strict Separation of Powers: Admin Has NO Decision Control', () => {
    beforeEach(() => {
      mockServer.setCurrentUser(DEMO_USERS['admin@demo.test']);
    });

    it('strictly forbids admin from recording application decisions with 403 Forbidden', async () => {
      const payload = {
        decision: 'approve' as const,
        decision_note: 'Attempted decision by system administrator',
      };

      await expect(
        officerQueries.recordDecision('APP-2026-8810', payload)
      ).rejects.toThrow(ThermoraApiError);

      try {
        await officerQueries.recordDecision('APP-2026-8810', payload);
        expect.unreachable('Admin must never be allowed to record scrutiny decisions');
      } catch (err: any) {
        expect(err.status).toBe(403);
        expect(err.code).toBe('forbidden_role');
        expect(err.message).toContain('Only authorised scrutiny officers');
      }
    });

    it('strictly forbids admin from accessing officer scrutiny queue with 403', async () => {
      await expect(officerQueries.getQueue()).rejects.toThrow(ThermoraApiError);
      try {
        await officerQueries.getQueue();
      } catch (err: any) {
        expect(err.status).toBe(403);
        expect(err.code).toBe('forbidden_role');
      }
    });

    it('confirms permission matrix disallows admin from officer queue route', () => {
      expect(isRouteAllowed('admin', '/officer/queue')).toBe(false);
      expect(isRouteAllowed('admin', '/admin/checklists')).toBe(true);
      expect(isRouteAllowed('admin', '/admin/users')).toBe(true);
    });
  });

  describe('4. Manual Confirm Path', () => {
    it('permits verifier to manually confirm a pending or failed verification', async () => {
      mockServer.setCurrentUser(DEMO_USERS['verifier@demo.test']);

      const targetId = 'ver-8810-02'; // initially failed
      const result = await verificationQueries.manualConfirm(targetId, {
        notes: 'Inspected physical NOC issued by Fire Directorate. Validated original seal.',
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(targetId);
      expect(result.status).toBe('verified');
      expect(result.compared?.manual_confirmation_notes).toContain('Fire Directorate');
      expect(result.compared?.confirmed_by).toBe('usr_ver_01');
    });

    it('forbids non-verifiers (e.g. applicant, auditor) from performing manual confirmation', async () => {
      // Test applicant
      mockServer.setCurrentUser(DEMO_USERS['applicant@demo.test']);
      await expect(
        verificationQueries.manualConfirm('ver-8810-02', { notes: 'Applicant self-confirm attempt' })
      ).rejects.toThrow(ThermoraApiError);

      try {
        await verificationQueries.manualConfirm('ver-8810-02', { notes: 'Applicant self-confirm' });
      } catch (err: any) {
        expect(err.status).toBe(403);
        expect(err.code).toBe('forbidden_role');
      }

      // Test auditor
      mockServer.setCurrentUser(DEMO_USERS['auditor@demo.test']);
      await expect(
        verificationQueries.manualConfirm('ver-8810-02', { notes: 'Auditor confirm attempt' })
      ).rejects.toThrow(ThermoraApiError);
    });
  });

  describe('5. Admin Checklists & Users Specifications', () => {
    beforeEach(() => {
      mockServer.setCurrentUser(DEMO_USERS['admin@demo.test']);
    });

    it('returns checklists with version number, active state flag, and statutory source references', async () => {
      const checklists = await adminQueries.getChecklists();
      expect(checklists).toBeDefined();
      expect(checklists.length).toBeGreaterThanOrEqual(1);

      const chk = checklists[0];
      expect(typeof chk.version).toBe('number');
      expect(typeof chk.active).toBe('boolean');
      expect(Array.isArray(chk.rules)).toBe(true);
      expect(chk.rules.length).toBeGreaterThanOrEqual(1);

      // Verify each rule carries statutory source reference and severity
      chk.rules.forEach((r) => {
        expect(r.id).toBeDefined();
        expect(r.rule_type).toBeDefined();
        expect(r.source_ref).toBeDefined();
        expect(r.source_ref?.length).toBeGreaterThan(0);
        expect(r.severity).toBeDefined();
      });
    });

    it('allows admin to toggle active state of a checklist', async () => {
      const chk = (await adminQueries.getChecklists())[0];
      const initialActive = chk.active;

      const updated = await adminQueries.updateChecklist(chk.id, { active: !initialActive });
      expect(updated.active).toBe(!initialActive);
    });

    it('allows admin to list users and manage user roles', async () => {
      const users = await adminQueries.getUsers();
      expect(users.length).toBeGreaterThanOrEqual(5);

      const target = users.find((u) => u.email === 'applicant@demo.test');
      expect(target).toBeDefined();

      const updated = await adminQueries.updateUserRole(target!.id, 'applicant');
      expect(updated.role).toBe('applicant');
    });
  });

  describe('6. Read-Only Audit Stream Safety', () => {
    it('permits admin and auditor to inspect audit entries', async () => {
      mockServer.setCurrentUser(DEMO_USERS['admin@demo.test']);
      const res = await auditQueries.getAuditLogs();
      expect(res.items.length).toBeGreaterThanOrEqual(2);

      const entry = res.items[0];
      expect(entry.id).toBeDefined();
      expect(entry.actor_id).toBeDefined();
      expect(entry.role).toBeDefined();
      expect(entry.action).toBeDefined();
      expect(entry.created_at).toBeDefined();
    });

    it('forbids applicant role from viewing the audit log', async () => {
      mockServer.setCurrentUser(DEMO_USERS['applicant@demo.test']);
      await expect(auditQueries.getAuditLogs()).rejects.toThrow(ThermoraApiError);
    });
  });
});
