# THERMORA Frontend Context (for Google AI Studio)

Project: AICTE Document Validation Platform · SIH26261 · Team THERMORA
Source documents: FRONTEND, BACKEND, ML and SECURITY PRDs, AGENT.md and the approved SIH deck.

Governing principle: **AI advises. Evidence supports. Authorised officials decide. Every action is traceable.**

---

## 1. Product in one paragraph

THERMORA is a decision-support platform for AICTE application scrutiny. Applicant institutions upload documents and get an evidence-linked pre-check report before submitting. AICTE officers review findings, issuer-verification results and evidence, then record the final decision. Verifiers confirm documents with issuing authorities. Admins manage users and checklists. Auditors read the append-only audit trail.

## 2. Frontend stack

- React 18 + TypeScript (strict) + Vite
- React Router (client routes)
- TanStack Query (server state, polling, cache invalidation)
- React Hook Form + Zod (forms)
- Tailwind CSS (+ shadcn/ui style components if available)
- Vitest + React Testing Library (unit/component), MSW (API mocks), Playwright (end to end, later)
- No Streamlit in the frontend. Streamlit is only for the ML team's internal evaluation demo.

## 3. Non-negotiable rules

1. The frontend is **not** a security boundary. Hiding a button is UX only. The backend enforces everything.
2. AI output is advisory. Never auto-approve, auto-reject, or show an AI result as a final decision.
3. Only the `officer` role sees the final-decision action. Admin, applicant, verifier and auditor never do.
4. Never fabricate success: no fake "verified", no fake "report ready", no fake job completion. Show what the (mock) API returned.
5. Never convert missing data into a "pass".
6. Never invent API routes or response fields. Use the endpoint list in section 8. Anything not listed is "blocked" and must be shown as a clearly labelled mock.
7. Never store tokens or passwords in `localStorage`, `sessionStorage`, URLs or logs. (Real backend uses httpOnly cookies. Frontend JS never reads tokens.)
8. Render all backend text (document names, finding reasons, issuer responses, handbook text) as plain escaped text. No `dangerouslySetInnerHTML`.
9. Status is never shown by colour alone. Always include text (and an icon).
10. No secrets in `VITE_*` variables.
11. An unavailable issuer does not mean a document is fraudulent. Wording must stay neutral.
12. Anomaly or forgery indicators are "preliminary indicators requiring human verification", not proof.

## 4. Roles and access

After login call `GET /auth/me`. Use only its `role` and institution. Never trust a role from a form field or URL.

| Role | What the UI offers |
|---|---|
| `applicant` | Own applications: create, upload, run pre-check, view findings, rectify (when permitted), submit, track status, alerts, download available report |
| `officer` | Scrutiny queue with filters, evidence review, accept/dismiss findings (note required), record final decision, view/download report |
| `verifier` | Run document verification, view results, manual-confirm when permitted |
| `admin` | Manage users/roles, manage versioned checklists/rules, read audit log. **Cannot record decisions** |
| `auditor` | Read-only audit log and reports |

Route guard behaviour:
- Not logged in → `/login`.
- Logged in but wrong role → `/403` (do not render the page at all).
- Unknown route → 404 page.

## 5. Client routes

| Route | Purpose | Access |
|---|---|---|
| `/login` | Sign in | Public |
| `/app` | Role-aware home | Authenticated |
| `/applications` | List | Applicant, staff roles |
| `/applications/new` | Create, choose category | Applicant |
| `/applications/:applicationId` | Details: overview, documents, findings, verification, report | Authorised roles |
| `/applications/:applicationId/upload` | Upload documents | Applicant, if state permits |
| `/applications/:applicationId/rectify` | Replace documents / edit allowed fields | Applicant, if state permits |
| `/applications/:applicationId/review` | Evidence and finding review | Officer |
| `/officer/queue` | Scrutiny queue | Officer |
| `/verifications` | Verification work and results | Verifier |
| `/alerts` | Alerts and acknowledge | Authenticated |
| `/reports/:applicationId` | Report summary and PDF | Authorised roles |
| `/admin/users` | Users and roles | Admin |
| `/admin/checklists` | Checklists and rules | Admin |
| `/audit` | Audit log viewer (read-only) | Admin, auditor |
| `/401` `/403` `/500` `*` | Error pages | See section 10 |

## 6. Core user journeys

### 6.1 Applicant (matches deck slide 2, user side)
Login → create application (choose category; explain it selects the checklist) → upload PDF/JPG/PNG → run pre-check → see findings grouped by severity and document → rectify / replace documents → submit → track status and alerts.

Steps in the UI:
1. `POST /applications`, then `POST /applications/{id}/documents` (multipart, one request per file, with progress and per-file result).
2. `POST /applications/{id}/validate` returns `202` plus a job id. Poll `GET /jobs/{id}` with backoff until a terminal state. Stop polling on unmount.
3. `GET /applications/{id}/findings`. Show reason, evidence, severity, confidence (if given), review status.
4. Rectify only when the backend allows it. Do not invent a state machine in the client.
5. `POST /applications/{id}/submit`.
6. Never claim final approval or rejection unless the API returns a recorded officer decision.

### 6.2 Officer (deck slide 2, admin side)
Queue (`GET /officer/queue`) → open application → inspect documents, findings, verification results, evidence → accept/dismiss each finding with a mandatory note (`POST /findings/{id}/review`) → record final decision (`POST /applications/{id}/decision`) behind a confirmation dialog → open report.

The UI must not infer a decision from severity, confidence or "no findings".

### 6.3 Verifier
Pick a document → `POST /documents/{id}/verify` → show the exact status, source, timestamp, compared fields → if source unavailable or inconclusive show "manual confirmation may be required" → `POST /verifications/{id}/manual-confirm` only when permitted.

### 6.4 Admin and auditor
Admin: users (`GET/POST /admin/users`, `PATCH /admin/users/{id}/role`), checklists (`GET/POST /admin/checklists`, `PUT /admin/checklists/{id}`). Audit viewer for admin and auditor is read-only: no edit or delete controls anywhere.

## 7. Screen requirements (short form)

- **Login:** labelled email and password, loading state, invalid-credentials, lockout / rate-limit message, network error. After login call `/auth/me` and route by role.
- **Home:** only data the role may see. Do not invent metrics. If counts are not in the API, label them as "on this page".
- **Application list/detail:** paginated, filters only where the API supports them. Three separate concepts must never be mixed: application status, finding status, verification status.
- **Upload:** file picker for PDF/JPG/PNG. Client checks are convenience only. Show name, size, state, retry, backend error. Never build file paths from file names. Revoke preview object URLs.
- **Pre-check and findings:** real job state only. Finding card shows severity, status, document, field, rule (id and version), reason, evidence reference, confidence, created time, review note.
- **Officer review:** evidence beside the finding. Mandatory note. Final decision needs explicit confirmation showing the application id and the exact decision. Disable the button while pending. No optimistic update for decisions.
- **Reports:** summary from `GET /applications/{id}/report`; PDF from `GET /applications/{id}/report.pdf`. Never generate a client-side PDF that could be mistaken for the signed official report.
- **Alerts:** list and acknowledge. Link to an application only if the user can view it.
- **Checklist and audit screens:** show version, active state and source reference when returned. Audit rows: actor, role, action, object reference, summary, request id, timestamp.
- **Every list:** loading, empty, error and pagination states.

## 8. API contract (provisional until OpenAPI is available)

Base path: `/api/v1` (set via `VITE_API_BASE_URL`). Call exact routes, no trailing slashes, no reliance on redirects.

| Feature | Endpoint |
|---|---|
| Login / refresh / logout / me | `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me` |
| Applications | `POST /applications`, `GET /applications`, `GET /applications/{id}`, `PATCH /applications/{id}`, `POST /applications/{id}/submit` |
| Documents | `POST /applications/{id}/documents`, `GET /documents/{id}`, `GET /documents/{id}/file` |
| Validation | `POST /applications/{id}/validate` (202 + job id), `GET /jobs/{id}` |
| Reports | `GET /applications/{id}/report`, `GET /applications/{id}/report.pdf` |
| Findings | `GET /applications/{id}/findings`, `GET /findings/{id}`, `POST /findings/{id}/review` |
| Verification | `POST /documents/{id}/verify`, `GET /verifications/{id}`, `POST /verifications/{id}/manual-confirm` |
| Officer | `GET /officer/queue`, `POST /applications/{id}/decision` |
| Alerts | `GET /alerts`, `POST /alerts/{id}/ack` |
| Audit | `GET /audit` |
| Admin | `GET/POST /admin/checklists`, `PUT /admin/checklists/{id}`, `GET/POST /admin/users`, `PATCH /admin/users/{id}/role` |
| Health | `GET /healthz`, `GET /readyz` |

### 8.1 Error envelope and status handling

Every error: `{ code, message, request_id, errors?: [{ field, message }] }`.

| HTTP | UI behaviour |
|---|---|
| 400 | Safe, actionable message |
| 401 | Try refresh once if appropriate; otherwise clear in-memory user and go to login. **No refresh loops** |
| 403 | Access-denied page. Do not retry |
| 404 | "Not found or unavailable". Do not reveal whether a protected record belongs to someone else |
| 422 | Map `errors` to form fields plus a summary |
| 429 | Explain rate limit; allow retry after the server-given interval |
| 5xx / network | Recoverable error with request id. Never fake success |

Backend error codes that should map to dedicated messages: `not_authenticated`, `token_expired`, `forbidden_role`, `forbidden_object`.

### 8.2 Provisional TypeScript types

Put these in `src/api/types.ts`. They are **placeholders** that mirror the PRDs. They will be replaced by types generated from the real OpenAPI file. Any unknown enum value must render safely as its raw text.

```ts
export type Role = 'applicant' | 'officer' | 'verifier' | 'admin' | 'auditor';

export interface User { id: string; email: string; role: Role; institution_id?: string }

export interface ApiError {
  code: string; message: string; request_id: string;
  errors?: { field: string; message: string }[];
}

export interface Page<T> { items: T[]; total: number; page: number; page_size: number } // provisional

export interface Application {
  id: string; institution_id: string; category: string;
  status: string;            // backend-defined; do not hard-code a state machine
  created_at: string; submitted_at?: string;
}

export interface DocumentMeta {
  id: string; application_id: string; doc_type: string;
  sha256?: string; uploaded_at: string; filename?: string;
}

export type JobStatus = 'queued' | 'running' | 'completed' | 'failed'; // map in ONE adapter
export interface Job { id: string; status: JobStatus; error?: string }

export type Severity = 'low' | 'medium' | 'high';   // provisional; render unknown values safely
export interface Finding {
  id: string; application_id: string; document_id?: string; field?: string;
  rule_id?: string; rule_version?: string;
  reason: string; evidence_ref?: string; severity: Severity | string;
  confidence?: number; status: string;
  manual_review_required?: boolean;
  reviewed_by?: string; review_note?: string; created_at: string;
}

export type VerificationStatus =
  | 'verified' | 'mismatch_detected' | 'expired'
  | 'verification_pending' | 'source_unavailable' | 'manual_review_required';

export interface Verification {
  id: string; document_id: string; method: string; source: string;
  status: VerificationStatus; compared?: Record<string, unknown>;
  checked_at: string;
}

export interface Alert { id: string; type: string; object_ref?: string; created_at: string; acked_at?: string }

export interface AuditEntry {
  id: string; actor_id: string; role: Role | string; action: string;
  object_ref?: string; summary?: unknown; request_id?: string; created_at: string;
}

export interface Checklist { id: string; category: string; version: number; active: boolean; rules: Rule[] }
export interface Rule { id: string; rule_type: string; params?: unknown; source_ref?: string; severity?: string }
```

Open item: officer decision values. Until confirmed, define them in one constant `DECISION_OPTIONS` marked `TODO: confirm with backend`. For the mock use: `approve`, `return_for_rectification`, `reject`.

## 9. Domain components to build

- `AdvisoryBanner`: "AI findings are advisory. Officials make the final decision." Shown on findings, review and report screens.
- `StatusBadge` (application), `FindingStatusBadge`, `VerificationBadge`, `SeverityBadge`: text + icon + colour. Unknown values show raw text.
- `FindingCard`: severity, reason, document/field, rule id and version, evidence reference, confidence, review state and note. Low-confidence or `manual_review_required` shows "Manual review required".
- `EvidencePanel`: shows the evidence reference next to the finding. When page/box evidence is available it highlights the region on the document preview (ML evidence uses page and bounding box with 0–1 coordinates). Never display a confidence number without the label "model confidence, not proof".
- `JobProgress`: reflects the real job state with polling and backoff.
- `ConfirmDecisionDialog`: shows application id, decision, requires explicit confirm, blocks double submit.
- `RoleGuard`, `RequireAuth`, `PermissionGate` (UX only).
- `DataTable` with loading, empty, error, pagination; becomes stacked cards on narrow screens.
- `FileDropzone` with progress and per-file error.
- Error pages: `Unauthorized401`, `Forbidden403`, `NotFound404`, `ServerError500`, `OfflineBanner`.

## 10. Error pages (the earlier 403 problem)

- **403 page:** "You do not have access to this page." Show the user's role, a button back to their home, and the request id if present. No retry button.
- **401 behaviour:** session-expired message, then login, then return to the page they wanted (store only the path, never data).
- **404 page:** neutral text; no hint whether a record exists.
- **500 / network page:** retry button, request id, no stack traces.
- Add a global React error boundary and a `/readyz` check indicator for developers (hidden in production).
- Write tests that every role hitting every forbidden route lands on 403, and that a direct URL to another user's application shows 404 or 403 without data.

## 11. Design system

Use the AICTE deck palette:

| Token | Hex | Use |
|---|---|---|
| navy | `#0E2F66` | headings, primary text accents |
| blue | `#2B6CC4` | primary actions, applicant side |
| green | `#2EA653` | success, officer/admin accents |
| orange | `#F28B2B` | warnings, attention |
| purple | `#7B57C2` | verification, secondary accents |
| red | `#E4475A` | errors, high severity |
| ink | `#1E2633` | body text |
| grey | `#5C6779` | secondary text |
| tints | `#EAF2FC` `#E9F7EE` `#FEF2E6` `#F0EBFA` `#FDEDEF` | card backgrounds |

Style: calm institutional dashboard, evidence-first layouts, readable tables, white background, rounded cards, Calibri-like or Inter/system font. Avoid decorative gradients and heavy animation.

Accessibility: WCAG 2.2 AA where practical, keyboard navigation, visible focus, semantic headings, labelled controls, accessible dialogs, screen-reader announcements for upload and job status, responsive from phone to laptop.

## 12. State and data rules

- TanStack Query for all server data. Invalidate application, finding, queue, alert and report queries after mutations.
- Keep the authenticated user in memory only. Derive permissions from `/auth/me`.
- Poll jobs with backoff and stop on terminal state, unmount or navigation.
- No optimistic updates for decisions, verification or review.
- Show timestamps in local format; keep the raw server timestamp available (tooltip) for audit context.
- Never put passwords, tokens, document contents or personal data in URLs, logs or analytics.

## 13. Security and privacy (frontend side)

- Escape all text. No raw HTML from the backend.
- Validate and restrict external links. Do not open untrusted URLs from documents or issuer responses.
- Do not log file contents or personal data to the console.
- Use only synthetic data in AI Studio.
- Hosting layer sets CSP and security headers; the frontend must work without inline scripts where possible.
- Do not offer applicants any control for role, institution, decision or review fields.

## 14. Open decisions to confirm with the backend owner

1. Deployed OpenAPI URL and whether paths include `/api/v1`.
2. Exact enums: application, job, finding statuses, severity values, decision values.
3. Query parameters and pagination envelope for each list.
4. Refresh flow: automatic or after 401; refresh-token rotation.
5. Upload response: document object, job, or both; max file size; timeout.
6. How rectification fields and allowed transitions are exposed.
7. Whether there is a decision-history endpoint.
8. How verifiers get their work list (no dedicated queue endpoint in the backend PRD).
9. Report PDF: streamed bytes or short-lived signed link.
10. Which issuer integrations are real in the demo and which are mocked.
11. Whether alert counts, unread filters and audit filters exist.
12. Same-origin reverse proxy or cross-origin cookies.

**Rule for unresolved items:** do not invent an endpoint or silently guess a schema. Mark the screen or action as blocked, or use a clearly labelled mock.

