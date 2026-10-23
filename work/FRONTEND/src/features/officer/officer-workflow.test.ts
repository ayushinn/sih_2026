import { describe, it, expect, beforeEach } from 'vitest';
import { apiClient } from '../../api/client';
import { mockServer } from '../../api/mock/server';
import { DEMO_USERS, INITIAL_APPLICATIONS } from '../../api/mock/data';
import { ThermoraApiError } from '../../api/errors';
import { officerQueries, DecisionPayload } from '../../api/queries/officer';
import { findingQueries } from '../../api/queries/findings';
import { reportQueries } from '../../api/queries/reports';
import { isRouteAllowed } from '../../lib/permissions';

describe('Officer Workflow & Scrutiny Review Test Suite', () => {
  beforeEach(() => {
    mockServer.resetData();
  });

  describe('1. Role Authorization: Non-officers never have access to decision controls', () => {
    const nonOfficerRoles = [
      { email: 'applicant@demo.test', role: 'applicant' },
      { email: 'verifier@demo.test', role: 'verifier' },
      { email: 'admin@demo.test', role: 'admin' },
      { email: 'auditor@demo.test', role: 'auditor' },
    ] as const;

    nonOfficerRoles.forEach(({ email, role }) => {
      it(`blocks role '${role}' from accessing scrutiny queue endpoint with 403 Forbidden`, async () => {
        mockServer.setCurrentUser(DEMO_USERS[email]);

        await expect(officerQueries.getQueue()).rejects.toThrow(ThermoraApiError);
        try {
          await officerQueries.getQueue();
        } catch (err: any) {
          expect(err.status).toBe(403);
          expect(err.code).toBe('forbidden_role');
        }
      });

      it(`strictly denies role '${role}' from recording scrutiny decisions with 403 Forbidden`, async () => {
        mockServer.setCurrentUser(DEMO_USERS[email]);

        const payload: DecisionPayload = {
          decision: 'approve',
          decision_note: 'Attempted decision by unauthorized role',
        };

        await expect(
          officerQueries.recordDecision('APP-2026-8810', payload)
        ).rejects.toThrow(ThermoraApiError);

        try {
          await officerQueries.recordDecision('APP-2026-8810', payload);
        } catch (err: any) {
          expect(err.status).toBe(403);
          expect(err.code).toBe('forbidden_role');
          expect(err.message).toContain('Only authorised scrutiny officers');
        }
      });
    });

    it('permits authorized officer (officer@demo.test) to load queue and record decision', async () => {
      mockServer.setCurrentUser(DEMO_USERS['officer@demo.test']);

      const queueRes = await officerQueries.getQueue();
      expect(queueRes).toBeDefined();
      expect(queueRes.items.length).toBeGreaterThanOrEqual(1);

      const decisionRes = await officerQueries.recordDecision('APP-2026-8810', {
        decision: 'approve',
        decision_note: 'All APH statutory land and safety norms verified by regional officer.',
      });

      expect(decisionRes.application_id).toBe('APP-2026-8810');
      expect(decisionRes.decision).toBe('approve');
      expect(decisionRes.status).toBe('approved');
    });

    it('validates permission route helper strictly denies non-officers from officer queue', () => {
      expect(isRouteAllowed('applicant', '/officer/queue')).toBe(false);
      expect(isRouteAllowed('verifier', '/officer/queue')).toBe(false);
      expect(isRouteAllowed('admin', '/officer/queue')).toBe(false);
      expect(isRouteAllowed('auditor', '/officer/queue')).toBe(false);
      expect(isRouteAllowed('officer', '/officer/queue')).toBe(true);
    });
  });

  describe('2. Mandatory Regulatory Notes Requirement', () => {
    beforeEach(() => {
      mockServer.setCurrentUser(DEMO_USERS['officer@demo.test']);
    });

    it('rejects finding review when review_note is empty or whitespace with 422 validation error', async () => {
      // Empty string
      await expect(
        findingQueries.reviewFinding('fnd-8810-01', {
          action: 'accept',
          review_note: '',
        })
      ).rejects.toThrow(ThermoraApiError);

      // Whitespace only
      try {
        await findingQueries.reviewFinding('fnd-8810-01', {
          action: 'dismiss',
          review_note: '    ',
        });
        expect.unreachable('Should have failed with 422');
      } catch (err: any) {
        expect(err.status).toBe(422);
        expect(err.code).toBe('validation_error');
        expect(err.message).toContain('review note is mandatory');
      }
    });

    it('accepts finding review when valid non-empty statutory note is provided', async () => {
      const updated = await findingQueries.reviewFinding('fnd-8810-01', {
        action: 'accept',
        review_note: 'Verified expired fire NOC on page 1 para 3. Rectification required under APH 2026 clause 4.1.',
      });

      expect(updated.status).toBe('accepted');
      expect(updated.review_note).toContain('APH 2026 clause 4.1');
      expect(updated.reviewed_by).toBe('usr_off_01');
    });

    it('rejects final application decision when decision_note is empty or whitespace with 422', async () => {
      // Empty note
      await expect(
        officerQueries.recordDecision('APP-2026-8810', {
          decision: 'approve',
          decision_note: '',
        })
      ).rejects.toThrow(ThermoraApiError);

      // Whitespace only note
      try {
        await officerQueries.recordDecision('APP-2026-8810', {
          decision: 'reject',
          decision_note: '   \n\t  ',
        });
        expect.unreachable('Should have failed with 422');
      } catch (err: any) {
        expect(err.status).toBe(422);
        expect(err.code).toBe('validation_error');
        expect(err.message.toLowerCase()).toContain('mandatory justification note required');
      }
    });

    it('accepts final decision with non-empty justification note', async () => {
      const res = await officerQueries.recordDecision('APP-2026-8810', {
        decision: 'return_for_rectification',
        decision_note: 'Returned for updating Fire Safety Certificate and correcting faculty cadre ratios.',
      });

      expect(res.decision).toBe('return_for_rectification');
      expect(res.status).toBe('rectification_requested');
    });
  });

  describe('3. Double-Click / Concurrent Double Submit Protection', () => {
    beforeEach(() => {
      mockServer.setCurrentUser(DEMO_USERS['officer@demo.test']);
    });

    it('protects against duplicate decision recording via client lock simulator', async () => {
      let isSubmitting = false;
      let submitCallCount = 0;

      const submitDecisionWithGuard = async (payload: DecisionPayload) => {
        if (isSubmitting) {
          // Block duplicate concurrent trigger
          return null;
        }
        isSubmitting = true;
        try {
          submitCallCount++;
          return await officerQueries.recordDecision('APP-2026-8810', payload);
        } finally {
          isSubmitting = false;
        }
      };

      const payload: DecisionPayload = {
        decision: 'approve',
        decision_note: 'Regulatory scrutiny concluded with approval.',
      };

      // Trigger two concurrent clicks
      const [firstResult, secondResult] = await Promise.all([
        submitDecisionWithGuard(payload),
        submitDecisionWithGuard(payload),
      ]);

      // One call executes, the duplicate is blocked
      expect(submitCallCount).toBe(1);
      expect(firstResult).not.toBeNull();
      expect(secondResult).toBeNull();
      expect(firstResult?.status).toBe('approved');
    });
  });

  describe('4. Scrutiny Report & PDF Delivery', () => {
    beforeEach(() => {
      mockServer.setCurrentUser(DEMO_USERS['officer@demo.test']);
    });

    it('fetches report summary with advisory disclaimer', async () => {
      const rep = await reportQueries.getReport('APP-2026-8810');
      expect(rep.application_id).toBe('APP-2026-8810');
      expect(rep.status).toBeDefined();
      expect(rep.findings_count).toBeGreaterThanOrEqual(1);
      expect(rep.advisory_disclaimer).toContain('advisory');
    });

    it('fetches binary PDF report stream', async () => {
      const blob = await reportQueries.getReportPdf('APP-2026-8810');
      expect(blob).toBeDefined();
      expect(blob.type).toBe('application/pdf');
    });
  });

  describe('5. Evidence Bounding Box Coordinate Rules', () => {
    it('verifies bounding box rule: fnd-8810-01 has page and box, fnd-8810-02 has text-only citation', async () => {
      mockServer.setCurrentUser(DEMO_USERS['officer@demo.test']);

      const findings = await findingQueries.getFindings('APP-2026-8810');
      const fndWithBBox = findings.find((f) => f.id === 'fnd-8810-01');
      const fndWithoutBBox = findings.find((f) => f.id === 'fnd-8810-02');

      // Rule check: Bounding box drawn only when page and box exist
      expect(fndWithBBox?.evidence_page).toBe(1);
      expect(fndWithBBox?.evidence_bbox).toEqual([0.22, 0.12, 0.38, 0.88]);

      // Second finding: No bounding box coordinates
      expect(fndWithoutBBox?.evidence_bbox).toBeUndefined();
      expect(fndWithoutBBox?.evidence_ref).toBeDefined();
    });
  });
});
