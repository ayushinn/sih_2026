/**
 * Provisional TypeScript types for THERMORA.
 * Source: FRONTEND_CONTEXT_ONLY.md § 8.2 and FRONTEND_PRD_FOR_AGENT.md.
 *
 * NOTE: These are provisional placeholders until 'npm run gen:api' generates
 * the production schema from the running FastAPI backend's OpenAPI definition
 * into src/api/generated/schema.d.ts.
 */

export type * from './generated/schema';

export type Role = 'applicant' | 'officer' | 'verifier' | 'admin' | 'auditor';

export interface User {
  id: string;
  email: string;
  role: Role;
  institution_id?: string;
  name?: string;
}

export interface ApiError {
  code: string;
  message: string;
  request_id: string;
  errors?: { field: string; message: string }[];
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface Application {
  id: string;
  institution_id: string;
  category: string;
  status: string; // backend-defined; do not hard-code a state machine in UI
  created_at: string;
  submitted_at?: string;
  open_findings_count?: number;
  highest_severity?: string;
}

export interface DocumentMeta {
  id: string;
  application_id: string;
  doc_type: string;
  sha256?: string;
  uploaded_at: string;
  filename?: string;
}

export type JobStatus = 'queued' | 'running' | 'completed' | 'failed';

export interface Job {
  id: string;
  status: JobStatus;
  error?: string;
}

export type Severity = 'low' | 'medium' | 'high';

export interface Finding {
  id: string;
  application_id: string;
  document_id?: string;
  field?: string;
  rule_id?: string;
  rule_version?: string;
  reason: string;
  evidence_ref?: string;
  evidence_page?: number;
  evidence_bbox?: [number, number, number, number]; // [ymin, xmin, ymax, xmax] normalized 0-1
  severity: Severity | string;
  confidence?: number;
  status: string;
  manual_review_required?: boolean;
  reviewed_by?: string;
  review_note?: string;
  created_at: string;
}

export type VerificationStatus =
  | 'verified'
  | 'failed'
  | 'inconclusive'
  | 'pending'
  | 'manual_required'
  | 'exempt'
  | 'mismatch_detected'
  | 'expired'
  | 'verification_pending'
  | 'source_unavailable'
  | 'manual_review_required';

export interface Verification {
  id: string;
  document_id: string;
  method: string;
  source: string;
  status: VerificationStatus;
  compared?: Record<string, unknown>;
  checked_at: string;
}

export interface Alert {
  id: string;
  type: string;
  object_ref?: string;
  message?: string;
  created_at: string;
  acked_at?: string;
}

export interface AuditEntry {
  id: string;
  actor_id: string;
  role: Role | string;
  action: string;
  object_ref?: string;
  summary?: unknown;
  request_id?: string;
  created_at: string;
}

export interface Checklist {
  id: string;
  category: string;
  version: number;
  active: boolean;
  rules: Rule[];
}

export interface Rule {
  id: string;
  rule_type: string;
  params?: unknown;
  source_ref?: string;
  severity?: string;
}

/**
 * Open item: Officer decision options.
 * TODO: Confirm final enum values with backend team.
 */
export const DECISION_OPTIONS = [
  { value: 'approve', label: 'Approve Application' },
  { value: 'return_for_rectification', label: 'Return for Rectification' },
  { value: 'reject', label: 'Reject Application' },
] as const;

export type DecisionType = (typeof DECISION_OPTIONS)[number]['value'];
