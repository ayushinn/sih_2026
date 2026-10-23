import {
  Alert,
  ApiError,
  Application,
  AuditEntry,
  Checklist,
  DocumentMeta,
  Finding,
  Job,
  Page,
  Role,
  User,
  Verification,
} from '../types';
import {
  DEMO_USERS,
  INITIAL_ALERTS,
  INITIAL_APPLICATIONS,
  INITIAL_AUDIT_LOG,
  INITIAL_CHECKLISTS,
  INITIAL_DOCUMENTS,
  INITIAL_FINDINGS,
  INITIAL_VERIFICATIONS,
  JOBS_STORE,
} from './data';

// In-memory mock session state
let currentSessionUser: User | null = DEMO_USERS['applicant@demo.test'];

// In-memory mutable clones of data
let applications: Application[] = [...INITIAL_APPLICATIONS];
let documents: DocumentMeta[] = [...INITIAL_DOCUMENTS];
let findings: Finding[] = [...INITIAL_FINDINGS];
let verifications: Verification[] = [...INITIAL_VERIFICATIONS];
let alerts: Alert[] = [...INITIAL_ALERTS];
let checklists: Checklist[] = [...INITIAL_CHECKLISTS];
let auditLog: AuditEntry[] = [...INITIAL_AUDIT_LOG];

function makeError(
  code: string,
  message: string,
  status = 400,
  errors?: { field: string; message: string }[]
): ApiError & { _status: number } {
  return {
    code,
    message,
    request_id: `req_mock_${Date.now().toString(36)}`,
    errors,
    _status: status,
  };
}

function delay(ms = 60): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const mockServer = {
  getCurrentUser(): User | null {
    return currentSessionUser;
  },

  setCurrentUser(user: User | null) {
    currentSessionUser = user;
  },

  resetData() {
    currentSessionUser = DEMO_USERS['applicant@demo.test'];
    applications = JSON.parse(JSON.stringify(INITIAL_APPLICATIONS));
    documents = JSON.parse(JSON.stringify(INITIAL_DOCUMENTS));
    findings = JSON.parse(JSON.stringify(INITIAL_FINDINGS));
    verifications = JSON.parse(JSON.stringify(INITIAL_VERIFICATIONS));
    alerts = JSON.parse(JSON.stringify(INITIAL_ALERTS));
    checklists = JSON.parse(JSON.stringify(INITIAL_CHECKLISTS));
    auditLog = JSON.parse(JSON.stringify(INITIAL_AUDIT_LOG));
    JOBS_STORE.clear();
  },

  async handleRequest<T>(method: string, path: string, body?: any): Promise<T> {
    await delay();
    const cleanPath = path.replace(/^\/api\/v1/, '').replace(/\/$/, '') || '/';
    const user = currentSessionUser;

    // --- Simulated test errors ---
    if (cleanPath.startsWith('/test-error/429')) {
      throw makeError('rate_limit_exceeded', 'Rate limit exceeded. Please wait 60 seconds.', 429);
    }
    if (cleanPath.startsWith('/test-error/500')) {
      throw makeError('internal_server_error', 'An unexpected database error occurred.', 500);
    }

    // --- Health & Readiness ---
    if (cleanPath === '/healthz' || cleanPath === '/readyz') {
      return { status: 'ok', mock: true, timestamp: new Date().toISOString() } as T;
    }

    // --- Authentication ---
    if (method === 'POST' && cleanPath === '/auth/login') {
      const { email, password } = body || {};
      if (!email || !password) {
        throw makeError('validation_error', 'Email and password are required.', 422, [
          { field: 'email', message: !email ? 'Email is required' : '' },
          { field: 'password', message: !password ? 'Password is required' : '' },
        ]);
      }

      const foundUser = DEMO_USERS[email.toLowerCase().trim()];
      if (!foundUser) {
        throw makeError(
          'invalid_credentials',
          'Invalid credentials. In demo mode, use one of: applicant@demo.test, officer@demo.test, verifier@demo.test, admin@demo.test, auditor@demo.test with any non-empty password.',
          401
        );
      }

      currentSessionUser = foundUser;
      auditLog.unshift({
        id: `aud-${Date.now()}`,
        actor_id: foundUser.id,
        role: foundUser.role,
        action: 'auth.login',
        summary: `User ${foundUser.email} signed in (role: ${foundUser.role})`,
        request_id: `req_${Date.now()}`,
        created_at: new Date().toISOString(),
      });
      return { message: 'Logged in successfully', user: foundUser } as T;
    }

    if (method === 'POST' && cleanPath === '/auth/logout') {
      currentSessionUser = null;
      return { message: 'Logged out successfully' } as T;
    }

    if (method === 'POST' && cleanPath === '/auth/refresh') {
      if (!currentSessionUser) {
        throw makeError('token_expired', 'Session expired', 401);
      }
      return { status: 'refreshed' } as T;
    }

    if (method === 'GET' && cleanPath === '/auth/me') {
      if (!currentSessionUser) {
        throw makeError('not_authenticated', 'Not authenticated', 401);
      }
      return currentSessionUser as T;
    }

    // --- All routes below require an authenticated session ---
    if (!user) {
      throw makeError('not_authenticated', 'Authentication required', 401);
    }

    // --- Applications ---
    if (method === 'GET' && cleanPath === '/applications') {
      let filtered = [...applications];
      // Object-level ownership check: applicants only view applications belonging to their institution
      if (user.role === 'applicant') {
        filtered = filtered.filter((a) => a.institution_id === user.institution_id);
      }
      const pageResult: Page<Application> = {
        items: filtered,
        total: filtered.length,
        page: 1,
        page_size: 20,
      };
      return pageResult as T;
    }

    if (method === 'POST' && cleanPath === '/applications') {
      if (user.role !== 'applicant') {
        throw makeError('forbidden_role', 'Only applicants may create new applications.', 403);
      }
      const { category } = body || {};
      if (!category) {
        throw makeError('validation_error', 'Application category is required.', 422, [
          { field: 'category', message: 'Category must be selected' },
        ]);
      }

      const newApp: Application = {
        id: `APP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        institution_id: user.institution_id || 'INST-AICTE-1042',
        category,
        status: 'draft',
        created_at: new Date().toISOString(),
        open_findings_count: 0,
        highest_severity: 'low',
      };
      applications.unshift(newApp);
      return newApp as T;
    }

    const appMatch = cleanPath.match(/^\/applications\/([^/]+)$/);
    if (appMatch) {
      const appId = appMatch[1];
      const found = applications.find((a) => a.id === appId);
      if (!found) {
        throw makeError('not_found', 'Application not found or unavailable.', 404);
      }

      if (method === 'GET') {
        // Do not leak record existence if applicant attempts to inspect an outside institution's application
        if (user.role === 'applicant' && found.institution_id !== user.institution_id) {
          throw makeError('forbidden_object', 'Application not found or unavailable.', 404);
        }
        return found as T;
      }

      if (method === 'PATCH') {
        if (user.role !== 'applicant') {
          throw makeError('forbidden_role', 'Only applicants may edit application fields.', 403);
        }
        Object.assign(found, body || {});
        return found as T;
      }
    }

    // --- Submit Application ---
    const submitMatch = cleanPath.match(/^\/applications\/([^/]+)\/submit$/);
    if (method === 'POST' && submitMatch) {
      const appId = submitMatch[1];
      const found = applications.find((a) => a.id === appId);
      if (!found) throw makeError('not_found', 'Application not found', 404);

      if (user.role !== 'applicant') {
        throw makeError('forbidden_role', 'Only applicants can submit applications.', 403);
      }

      // Check application state: cannot submit if already approved/rejected or under_scrutiny
      if (found.status === 'approved' || found.status === 'rejected') {
        throw makeError(
          'invalid_state',
          `Application cannot be submitted in '${found.status}' status. Decision has already been recorded.`,
          422
        );
      }

      found.status = 'submitted';
      found.submitted_at = new Date().toISOString();
      return found as T;
    }

    // --- Documents & Upload with validation ---
    const docsMatch = cleanPath.match(/^\/applications\/([^/]+)\/documents$/);
    if (method === 'GET' && docsMatch) {
      const appId = docsMatch[1];
      const appDocs = documents.filter((d) => d.application_id === appId);
      return appDocs as T;
    }

    if (method === 'POST' && docsMatch) {
      const appId = docsMatch[1];
      const found = applications.find((a) => a.id === appId);
      if (!found) throw makeError('not_found', 'Application not found', 404);

      // Extract filename and check extension
      let filename = 'document.pdf';
      let docType = 'Supporting Document';
      let fileSize = 1024 * 1024;

      if (body instanceof FormData) {
        const file = body.get('file') as File | null;
        if (file) {
          filename = file.name;
          fileSize = file.size;
        }
        docType = (body.get('doc_type') as string) || docType;
      } else if (body && typeof body === 'object') {
        filename = body.filename || filename;
        docType = body.doc_type || docType;
        fileSize = body.size || fileSize;
      }

      // Validate allowed file extensions (PDF, JPG, PNG)
      const allowedExt = /\.(pdf|jpg|jpeg|png)$/i;
      if (!allowedExt.test(filename)) {
        throw makeError(
          'validation_error',
          'Unsupported file format. Only PDF, JPG, and PNG documents are accepted.',
          422,
          [{ field: 'file', message: 'Only PDF, JPG, and PNG documents are allowed.' }]
        );
      }

      // Validate file size limit (15MB)
      if (fileSize > 15 * 1024 * 1024 || filename.includes('oversize')) {
        throw makeError(
          'validation_error',
          'Document file size exceeds the 15MB limit.',
          422,
          [{ field: 'file', message: 'File exceeds 15MB limit.' }]
        );
      }

      // Simulate replace if document of same doc_type exists
      const existingDocIdx = documents.findIndex(
        (d) => d.application_id === appId && d.doc_type === docType
      );

      const newDoc: DocumentMeta = {
        id: `doc-${Date.now()}`,
        application_id: appId,
        doc_type: docType,
        filename,
        sha256: 'mock_sha256_' + Math.random().toString(16).slice(2),
        uploaded_at: new Date().toISOString(),
      };

      if (existingDocIdx >= 0) {
        // Replace existing document
        documents[existingDocIdx] = newDoc;
      } else {
        documents.unshift(newDoc);
      }

      return newDoc as T;
    }

    const docFileMatch = cleanPath.match(/^\/documents\/([^/]+)\/file$/);
    if (method === 'GET' && docFileMatch) {
      const doc = documents.find((d) => d.id === docFileMatch[1]);
      if (!doc) throw makeError('not_found', 'Document file not found', 404);
      const mockBlob = new Blob(['%PDF-1.4 Mock synthetic document payload'], {
        type: 'application/pdf',
      });
      return mockBlob as unknown as T;
    }

    const docMatch = cleanPath.match(/^\/documents\/([^/]+)$/);
    if (method === 'GET' && docMatch) {
      const doc = documents.find((d) => d.id === docMatch[1]);
      if (!doc) throw makeError('not_found', 'Document not found', 404);
      return doc as T;
    }

    // --- Validation Pre-Check Runner (202 Accepted + Job Polling) ---
    const validateMatch = cleanPath.match(/^\/applications\/([^/]+)\/validate$/);
    if (method === 'POST' && validateMatch) {
      const appId = validateMatch[1];
      const jobId = `job-${Date.now()}`;
      const shouldFail = Boolean(body?.simulated_failure || path.includes('fail=true'));

      const job: Job = { id: jobId, status: 'queued' };
      JOBS_STORE.set(jobId, job);

      // Async progression: queued -> running (800ms) -> completed or failed (2000ms)
      setTimeout(() => {
        const j = JOBS_STORE.get(jobId);
        if (j) j.status = 'running';
      }, 800);

      setTimeout(() => {
        const j = JOBS_STORE.get(jobId);
        if (j) {
          if (shouldFail) {
            j.status = 'failed';
            j.error = 'OCR layout extraction failed: Corrupted digital signature stream';
          } else {
            j.status = 'completed';
          }
        }
      }, 2000);

      return { job_id: jobId, status: 'queued' } as T;
    }

    const jobMatch = cleanPath.match(/^\/jobs\/([^/]+)$/);
    if (method === 'GET' && jobMatch) {
      const job = JOBS_STORE.get(jobMatch[1]);
      if (!job) throw makeError('not_found', 'Job not found', 404);
      return job as T;
    }

    // --- Findings ---
    const findingsMatch = cleanPath.match(/^\/applications\/([^/]+)\/findings$/);
    if (method === 'GET' && findingsMatch) {
      const appId = findingsMatch[1];
      const res = findings.filter((f) => f.application_id === appId);
      return res as T;
    }

    const findingSingleMatch = cleanPath.match(/^\/findings\/([^/]+)$/);
    if (method === 'GET' && findingSingleMatch) {
      const findingId = findingSingleMatch[1];
      const f = findings.find((item) => item.id === findingId);
      if (!f) throw makeError('not_found', 'Finding not found', 404);
      return f as T;
    }

    const findingReviewMatch = cleanPath.match(/^\/findings\/([^/]+)\/review$/);
    if (method === 'POST' && findingReviewMatch) {
      if (user.role !== 'officer') {
        throw makeError('forbidden_role', 'Only scrutiny officers may review findings.', 403);
      }
      const findingId = findingReviewMatch[1];
      const f = findings.find((item) => item.id === findingId);
      if (!f) throw makeError('not_found', 'Finding not found', 404);

      const { action, review_note } = body || {};
      if (!review_note || !review_note.trim()) {
        throw makeError('validation_error', 'A non-empty review note is mandatory.', 422, [
          { field: 'review_note', message: 'Review note is mandatory' },
        ]);
      }
      f.status = action === 'dismiss' ? 'dismissed' : 'accepted';
      f.review_note = review_note;
      f.reviewed_by = user.id;
      return f as T;
    }

    // --- Officer Queue & Decisions ---
    if (method === 'GET' && cleanPath === '/officer/queue') {
      if (user.role !== 'officer') {
        throw makeError('forbidden_role', 'Scrutiny queue is reserved for authorised scrutiny officers.', 403);
      }
      const queueApps = applications.filter(
        (a) => a.status === 'under_scrutiny' || a.status === 'submitted'
      );
      return {
        items: queueApps,
        total: queueApps.length,
        page: 1,
        page_size: 20,
      } as T;
    }

    const decisionMatch = cleanPath.match(/^\/applications\/([^/]+)\/decision$/);
    if (method === 'POST' && decisionMatch) {
      // Non-negotiable rule: ONLY officer can record final decision!
      if (user.role !== 'officer') {
        throw makeError(
          'forbidden_role',
          'Only authorised scrutiny officers can record regulatory decisions. Decision action denied.',
          403
        );
      }
      const appId = decisionMatch[1];
      const found = applications.find((a) => a.id === appId);
      if (!found) throw makeError('not_found', 'Application not found', 404);

      const { decision, decision_note } = body || {};
      if (!decision || !decision_note || !decision_note.trim()) {
        throw makeError('validation_error', 'Decision option and mandatory justification note required.', 422);
      }

      if (decision === 'approve') found.status = 'approved';
      else if (decision === 'return_for_rectification') found.status = 'rectification_requested';
      else if (decision === 'reject') found.status = 'rejected';

      auditLog.unshift({
        id: `aud-${Date.now()}`,
        actor_id: user.id,
        role: user.role,
        action: 'application.decision',
        object_ref: appId,
        summary: `Officer recorded decision: ${decision}. Note: ${decision_note}`,
        request_id: `req_${Date.now()}`,
        created_at: new Date().toISOString(),
      });

      return {
        application_id: appId,
        status: found.status,
        decision,
        recorded_at: new Date().toISOString(),
        recorded_by: user.id,
      } as T;
    }

    // --- Verifications ---
    if (cleanPath === '/verifications') {
      if (user.role !== 'verifier' && user.role !== 'officer' && user.role !== 'admin') {
        throw makeError('forbidden_role', 'Verification workspace restricted.', 403);
      }
      return verifications as T;
    }

    const singleVerifMatch = cleanPath.match(/^\/verifications\/([^/]+)$/);
    if (method === 'GET' && singleVerifMatch) {
      const ver = verifications.find((v) => v.id === singleVerifMatch[1]);
      if (!ver) throw makeError('not_found', 'Verification record not found', 404);
      return ver as T;
    }

    const verifyDocMatch = cleanPath.match(/^\/documents\/([^/]+)\/verify$/);
    if (method === 'POST' && verifyDocMatch) {
      if (user.role !== 'verifier' && user.role !== 'officer') {
        throw makeError('forbidden_role', 'Permission denied.', 403);
      }
      const docId = verifyDocMatch[1];
      const newVer: Verification = {
        id: `ver-${Date.now()}`,
        document_id: docId,
        method: 'Digital Registry Query',
        source: 'Empanelled Regulatory Authority Portal',
        status: 'verified',
        checked_at: new Date().toISOString(),
      };
      verifications.unshift(newVer);
      return newVer as T;
    }

    const manualConfirmMatch = cleanPath.match(/^\/verifications\/([^/]+)\/manual-confirm$/);
    if (method === 'POST' && manualConfirmMatch) {
      if (user.role !== 'verifier') {
        throw makeError('forbidden_role', 'Only verifiers may record manual confirmations.', 403);
      }
      const verId = manualConfirmMatch[1];
      const ver = verifications.find((v) => v.id === verId);
      if (!ver) throw makeError('not_found', 'Verification record not found', 404);
      ver.status = 'verified';
      if (!ver.compared) ver.compared = {};
      if (body?.notes) {
        ver.compared.manual_confirmation_notes = body.notes;
      }
      ver.compared.confirmed_by = user.id;
      ver.compared.confirmed_at = new Date().toISOString();

      auditLog.unshift({
        id: `aud-${Date.now()}`,
        actor_id: user.id,
        role: user.role,
        action: 'verification.manual_confirm',
        object_ref: verId,
        summary: `Verifier recorded manual confirmation${body?.notes ? `: ${body.notes}` : ''}`,
        request_id: `req_${Date.now()}`,
        created_at: new Date().toISOString(),
      });

      return ver as T;
    }

    // --- Alerts ---
    if (method === 'GET' && cleanPath === '/alerts') {
      return {
        items: alerts,
        total: alerts.length,
        page: 1,
        page_size: 20,
      } as T;
    }

    const ackMatch = cleanPath.match(/^\/alerts\/([^/]+)\/ack$/);
    if (method === 'POST' && ackMatch) {
      const alert = alerts.find((a) => a.id === ackMatch[1]);
      if (alert) alert.acked_at = new Date().toISOString();
      return (alert || {}) as T;
    }

    // --- Reports ---
    const reportPdfMatch = cleanPath.match(/^\/applications\/([^/]+)\/report\.pdf$/);
    if (method === 'GET' && reportPdfMatch) {
      const appId = reportPdfMatch[1];
      const app = applications.find((a) => a.id === appId);
      if (!app) throw makeError('not_found', 'Application report not found', 404);
      const mockPdfBlob = new Blob(['%PDF-1.4 Official Regulatory Scrutiny Report Payload'], {
        type: 'application/pdf',
      });
      return mockPdfBlob as unknown as T;
    }

    const reportMatch = cleanPath.match(/^\/applications\/([^/]+)\/report$/);
    if (method === 'GET' && reportMatch) {
      const appId = reportMatch[1];
      const app = applications.find((a) => a.id === appId);
      if (!app) throw makeError('not_found', 'Application report not found', 404);
      return {
        application_id: appId,
        institution_id: app.institution_id,
        status: app.status,
        findings_count: findings.filter((f) => f.application_id === appId).length,
        generated_at: new Date().toISOString(),
        advisory_disclaimer: 'AI findings are advisory. Officials make the final decision.',
      } as T;
    }

    // --- Audit Log ---
    if (method === 'GET' && cleanPath === '/audit') {
      if (user.role !== 'admin' && user.role !== 'auditor') {
        throw makeError('forbidden_role', 'Audit log access restricted to Admin and Auditor roles.', 403);
      }
      return {
        items: auditLog,
        total: auditLog.length,
        page: 1,
        page_size: 20,
      } as T;
    }

    // --- Admin Checklists & Users ---
    if (method === 'GET' && cleanPath === '/admin/checklists') {
      if (user.role !== 'admin') throw makeError('forbidden_role', 'Admin required', 403);
      return checklists as T;
    }

    if (method === 'POST' && cleanPath === '/admin/checklists') {
      if (user.role !== 'admin') throw makeError('forbidden_role', 'Admin required', 403);
      const newChk: Checklist = {
        id: `chk-custom-${Date.now()}`,
        category: body?.category || 'Custom Category',
        version: 1,
        active: true,
        rules: body?.rules || [],
      };
      checklists.unshift(newChk);
      return newChk as T;
    }

    const updateChecklistMatch = cleanPath.match(/^\/admin\/checklists\/([^/]+)$/);
    if (method === 'PUT' && updateChecklistMatch) {
      if (user.role !== 'admin') throw makeError('forbidden_role', 'Admin required', 403);
      const chk = checklists.find((c) => c.id === updateChecklistMatch[1]);
      if (!chk) throw makeError('not_found', 'Checklist not found', 404);
      Object.assign(chk, body || {});
      return chk as T;
    }

    if (method === 'GET' && cleanPath === '/admin/users') {
      if (user.role !== 'admin') throw makeError('forbidden_role', 'Admin required', 403);
      return Object.values(DEMO_USERS) as T;
    }

    const updateRoleMatch = cleanPath.match(/^\/admin\/users\/([^/]+)\/role$/);
    if (method === 'PATCH' && updateRoleMatch) {
      if (user.role !== 'admin') throw makeError('forbidden_role', 'Admin required', 403);
      const targetUser = Object.values(DEMO_USERS).find((u) => u.id === updateRoleMatch[1]);
      if (!targetUser) throw makeError('not_found', 'User not found', 404);
      if (body?.role) targetUser.role = body.role as Role;
      return targetUser as T;
    }

    // Fallback 404 for unmapped endpoint
    throw makeError('endpoint_not_found', `Mock endpoint ${method} ${cleanPath} not found`, 404);
  },
};
