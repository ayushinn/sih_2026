# THERMORA Frontend PRD — AICTE Document Validation Platform

**SIH26261 · Version 1.0 · Companion to THERMORA Backend PRD v1.0**

**Frontend stack:** React, TypeScript, Vite, React Router, TanStack Query, React Hook Form, Zod, and a component system such as Tailwind CSS + shadcn/ui.  
**Backend:** FastAPI REST API, PostgreSQL + pgvector, Redis jobs, ML service, and ReportLab PDF reports.  
**Primary integration rule:** The backend's generated OpenAPI schema is the source of truth for routes, request/response types, and status codes. Do not independently invent API fields in the frontend.

---

## 1. Product purpose

Build a responsive, accessible frontend for THERMORA, an AI-assisted AICTE document validation and scrutiny platform. It lets applicants submit and rectify applications, officers review evidence-backed findings and record decisions, verifiers confirm issuing-authority results, administrators manage users and checklists, and auditors read audit records.

AI output is **decision support only**. The frontend must never automatically reject an application or present an AI result as a final regulatory decision. Only an authorised officer can record the final decision.

## 2. Goals and success criteria

- A user can sign in and is routed to the correct workspace for their role.
- An applicant can create an application, upload supported documents, submit it, run or view a pre-check, rectify permitted items, and track status.
- A validation job can be shown as queued/running/completed/failed based on the actual backend response; the UI does not fake successful completion.
- Findings show severity, reason, evidence reference, relevant document/field, confidence when supplied, and review status.
- Officers can review findings with required notes and record final decisions only through authorised backend endpoints.
- Verifiers can view verification outcomes and manually confirm only when permitted.
- Every list has loading, empty, error, and pagination states.
- API types are generated from FastAPI OpenAPI and checked in CI to prevent frontend/backend contract drift.
- No sensitive records are exposed across institution boundaries; backend authorisation remains authoritative.

## 3. User roles and access

Use `GET /auth/me` after login/refresh to determine the authenticated user's `id`, `role`, and institution context. Do not trust a role or institution sent by the browser as authority.

| Role | Frontend capabilities |
|---|---|
| `applicant` | View own applications; create an application; upload documents; submit; view pre-check findings and alerts; rectify while permitted; download available reports |
| `officer` | View scrutiny queue; filter and open applications; review evidence and findings; accept/dismiss findings with mandatory notes; record final decisions; view/download reports |
| `verifier` | View assigned/available verification work as provided by backend; initiate document verification; review results; manually confirm when permitted; record inspection needs if supported by backend |
| `admin` | Manage users and roles; manage versioned checklists/rules where API support exists; inspect audit records; **cannot record regulatory decisions** |
| `auditor` | Read-only access to permitted audit records and reports |

**Access rules**
- Hide navigation and actions that the role cannot use, but treat this only as UX. The backend must enforce every permission.
- If an endpoint returns `401`, handle session expiry and re-authentication. If it returns `403`, show an access-denied state. A `404` may mean the record does not exist or is not visible to the user; do not reveal hidden record details.
- Never offer an applicant a control to set their own role, institution ID, final decision, or officer review fields.
- Do not render admin or officer-only actions for other roles, including through direct URL navigation.

## 4. Information architecture and frontend routes

Suggested client routes (these are **frontend routes**, not backend API endpoints):

| Route | Purpose | Access |
|---|---|---|
| `/login` | Sign-in | Public |
| `/app` | Role-aware landing page / summary | Authenticated |
| `/applications` | Application list | Applicant; permitted staff roles |
| `/applications/new` | Create application and choose category | Applicant |
| `/applications/:applicationId` | Application details, documents, status, findings | Authorised roles |
| `/applications/:applicationId/upload` | Upload documents | Applicant, if state permits |
| `/applications/:applicationId/rectify` | Replace documents/edit allowed fields | Applicant, if state permits |
| `/applications/:applicationId/review` | Evidence and finding review | Officer |
| `/officer/queue` | Scrutiny queue with filters | Officer |
| `/verifications` | Verification work/results | Verifier |
| `/alerts` | Alerts and acknowledgement | Authenticated |
| `/reports/:applicationId` | Report summary and PDF access | Authorised roles |
| `/admin/users` | User management | Admin |
| `/admin/checklists` | Checklist/rule management | Admin |
| `/audit` | Append-only audit log viewer | Admin, auditor |
| `/403` | Access denied | Authenticated |
| `*` | Not found | Any |

The route list may be adjusted to the final design, but API paths and schemas must follow OpenAPI exactly.

## 5. Core user journeys

### 5.1 Applicant: create, upload, pre-check, rectify, submit

1. Sign in.
2. Open Applications and select **New Application**.
3. Choose a category. Explain that category determines the applicable checklist.
4. Save the application using `POST /applications`.
5. Upload PDF, JPG, or PNG documents using `POST /applications/{id}/documents` as multipart form data.
6. Show each upload's progress, result, and any validation error. Do not assume a file is accepted until the API confirms it.
7. Run pre-check using `POST /applications/{id}/validate`; display the returned job ID and poll `GET /jobs/{id}` until a terminal state, using sensible backoff and stopping on unmount or navigation.
8. Display findings returned by `GET /applications/{id}/findings`, grouped by severity and document. Explain missing, incomplete, expired, inconsistent, or low-confidence items using the backend's returned reason and evidence.
9. Allow correction or document replacement only when the application state permits it. Do not invent a state machine in the client; use backend status and validation errors.
10. Submit using `POST /applications/{id}/submit` when the application is ready.
11. Show the latest status, alerts, and any available report. Never claim a final approval/rejection unless the backend provides a recorded officer decision.

### 5.2 Officer: queue, review evidence, decide

1. Open `/officer/queue`, backed by `GET /officer/queue`.
2. Filter using supported query parameters for status, severity, category, and age. Confirm exact parameter names from OpenAPI.
3. Open an application and inspect documents, extracted fields if exposed, findings, verification results, and evidence references.
4. Accept or dismiss a finding using `POST /findings/{id}/review`; require a non-empty review note in the UI.
5. Record a final decision using `POST /applications/{id}/decision`. Show a confirmation dialog with the application identifier and the exact decision being submitted.
6. Display the result only after the backend confirms it. Provide report access via `GET /applications/{id}/report` and `GET /applications/{id}/report.pdf` where authorised.

The UI must not infer a decision from severity, confidence, or the absence of findings. Do not provide this action to applicants, verifiers, admins, or auditors.

### 5.3 Verifier: verify document

1. Open the verification workspace.
2. Select an authorised document and trigger `POST /documents/{id}/verify`.
3. Display the exact backend status: `verified`, `mismatch_detected`, `expired`, `verification_pending`, `source_unavailable`, or `manual_review_required`.
4. Show source, timestamp, compared fields, and any explanation returned by the backend.
5. If the source is unavailable or inconclusive, explain that manual confirmation may be required; do not label it as verified.
6. Use `POST /verifications/{id}/manual-confirm` only for an authorised verifier and only when the UI has the required evidence and backend permits the transition.

### 5.4 Admin and auditor

- Admin user management uses `GET/POST /admin/users` and `PATCH /admin/users/{id}/role`.
- Checklist management uses `GET/POST /admin/checklists` and `PUT /admin/checklists/{id}`. Confirm the exact payload schema from OpenAPI; the backend PRD describes versioned configurable checklists/rules.
- Audit viewer uses `GET /audit`, with pagination and available filters.
- Auditor views are read-only. No edit/delete controls for audit events.
- Admin cannot record regulatory decisions.

## 6. Screen-level requirements

### 6.1 Login

- Email and password fields with accessible labels.
- Submit state, invalid-credentials state, rate-limit/lockout message, network error, and disabled/loading button.
- Never store passwords in local storage or session storage.
- Backend session design specifies access and refresh tokens in `httpOnly`, `Secure`, `SameSite` cookies. Frontend JavaScript must not read or persist those tokens.
- After login, call `GET /auth/me` and route based on returned role. Do not rely on a role value supplied by the login form.

### 6.2 Role-aware home/dashboard

Show only information the user is allowed to access. Examples:
- Applicant: own applications by status, recent alerts, incomplete items, and continue-application actions.
- Officer: queue totals and pending reviews if the API provides those counts; otherwise derive only from permitted, paginated data and label counts accurately.
- Verifier: pending verifications if available from backend endpoints.
- Admin: user/checklist shortcuts and audit access.
- Auditor: read-only audit/report shortcuts.

Do not invent dashboard metrics or call endpoints that are not in OpenAPI.

### 6.3 Application list and detail

- Search/filter/sort only where supported by API.
- Paginated list with page size limits aligned to backend.
- Status label, category, relevant timestamps, and permitted actions.
- Detail view with sections/tabs for overview, documents, findings, verification, activity/audit if exposed, and report.
- Distinguish an application status from a finding status and a verification status.
- Handle deleted, inaccessible, stale, or changed records without leaking data.

### 6.4 Document upload

- Accept PDF, JPG, PNG in the picker; client-side file checks are for convenience only.
- Show file name, size, upload state, retry where safe, and backend error.
- Do not trust extension or MIME type as security validation; backend checks magic bytes, size, hash, and storage.
- Do not construct a storage path from a user-provided file name.
- Download/view files only through authorised `GET /documents/{id}/file` behaviour or a short-lived link returned by the backend.
- Revoke object URLs created for local previews when no longer needed.
- Avoid logging file contents or personal data to the browser console or analytics.

### 6.5 Pre-check job and findings

- Show job state using actual `GET /jobs/{id}` data.
- Support queued/running/succeeded/failed only if these states are in the actual job schema; map the backend's real values in a single typed adapter.
- On network failure, show that status could not be refreshed; do not display a fabricated success.
- Finding card fields, when supplied: severity, status, document, field, rule, reason, evidence reference, confidence, created time, review note.
- Display low-confidence results as requiring manual review when backend flags them so.
- Do not convert missing data into a “pass”.

### 6.6 Officer review and decision

- Evidence must be accessible beside the related finding.
- Accept/dismiss requires a mandatory note.
- Final decision action has explicit confirmation and a clear irreversible/high-impact warning if appropriate.
- Disable duplicate submissions while a request is pending; handle retries without accidental duplicate decisions.
- Display the server-confirmed decision and timestamp/actor only if returned by the API.
- AI findings remain advisory until reviewed by an authorised officer.

### 6.7 Reports

- Render report summary from `GET /applications/{id}/report`.
- Download/open PDF through `GET /applications/{id}/report.pdf`, respecting cookies and content disposition.
- Show loading, unavailable, and permission-denied states.
- Do not create a client-generated PDF that could be mistaken for the official signed report.
- Label the official report as available only after the backend confirms it.

### 6.8 Alerts

- Use `GET /alerts` and `POST /alerts/{id}/ack`.
- Support unread/acknowledged states if returned by API.
- Alert categories may include missing information, expired documents, pending source verification, suspected anomalies, and unresolved items.
- Link to the relevant application/document only when the user is authorised to view it.

### 6.9 Checklist and audit screens

- Checklist forms must reflect the schema returned by OpenAPI and preserve version/source references.
- Clearly show active/version state when returned by the backend.
- Audit entries are read-only and should display actor, role, action, object reference, summary, request ID, and timestamp when available.
- Never offer edit/delete operations on audit entries.

## 7. Backend API integration contract

Base API path: `/api/v1`. Exact base URL is environment configuration. The endpoint inventory below comes from the backend PRD; exact schemas, query parameters, and response types must be generated from the running FastAPI OpenAPI document.

| Feature | Method and endpoint |
|---|---|
| Login | `POST /auth/login` |
| Refresh session | `POST /auth/refresh` |
| Logout | `POST /auth/logout` |
| Current user | `GET /auth/me` |
| Applications | `POST /applications`, `GET /applications`, `GET /applications/{id}`, `PATCH /applications/{id}`, `POST /applications/{id}/submit` |
| Upload document | `POST /applications/{id}/documents` |
| Document metadata/file | `GET /documents/{id}`, `GET /documents/{id}/file` |
| Run validation | `POST /applications/{id}/validate` |
| Job status | `GET /jobs/{id}` |
| Reports | `GET /applications/{id}/report`, `GET /applications/{id}/report.pdf` |
| Findings | `GET /applications/{id}/findings`, `GET /findings/{id}`, `POST /findings/{id}/review` |
| Verification | `POST /documents/{id}/verify`, `GET /verifications/{id}`, `POST /verifications/{id}/manual-confirm` |
| Officer queue/decision | `GET /officer/queue`, `POST /applications/{id}/decision` |
| Alerts | `GET /alerts`, `POST /alerts/{id}/ack` |
| Audit | `GET /audit` |
| Admin checklists | `GET /admin/checklists`, `POST /admin/checklists`, `PUT /admin/checklists/{id}` |
| Admin users | `GET /admin/users`, `POST /admin/users`, `PATCH /admin/users/{id}/role` |
| Health/readiness | `GET /healthz`, `GET /readyz` |

All endpoints are relative to `/api/v1` unless the deployed OpenAPI specifies otherwise. The backend PRD defines `202 Accepted` plus a job ID for validation enqueueing. Do not assume validation completes within the initial request.

### 7.1 Error handling

The backend's standard error envelope is described as:

- `code`
- `message`
- `request_id`
- optional field errors

Use generated types if the OpenAPI schema defines this envelope. Map responses consistently:

| HTTP status | Frontend behaviour |
|---|---|
| `400` | Show safe, actionable request error if returned by API |
| `401` | Attempt the agreed refresh flow once if appropriate; otherwise clear client auth state and route to login |
| `403` | Show access denied; do not repeatedly retry |
| `404` | Show not found/unavailable without revealing whether a protected record belongs to another user |
| `422` | Map field errors to the relevant form and show a general validation summary |
| `429` | Explain rate limiting and allow retry after the server-provided interval if available |
| `5xx` / network failure | Show recoverable error and request ID if available; never silently fake success |

Do not implement an infinite refresh loop. On refresh failure, clear in-memory user state and return to login.

### 7.2 Cookie, CORS, and local development

- Configure the HTTP client to send cookies (`credentials: "include"` / equivalent).
- Backend CORS must allow the exact frontend origin and credentials; do not use wildcard origins with credentialed requests.
- Use one `VITE_API_BASE_URL` per environment, documented in `.env.example`.
- In local development, prefer a Vite proxy such as `/api` to the backend. Configure the proxy target in Vite; do not hard-code localhost throughout components.
- If frontend and backend are on different sites in production, confirm cookie `SameSite` and `Secure` configuration with deployment. Do not work around cookie restrictions by storing tokens in browser storage.
- Disable trailing-slash assumptions: call the exact routes generated from OpenAPI, with no reliance on redirects.

## 8. Type-safe API client and contract generation

**Required integration approach: generate TypeScript types/client from FastAPI OpenAPI.** Do not hand-maintain duplicate endpoint definitions.

Suggested setup:
1. Backend exposes its OpenAPI JSON in development/CI.
2. Frontend downloads or receives the schema from a versioned build artifact.
3. Generate TypeScript types/client using `openapi-typescript` and a fetch wrapper, or a compatible OpenAPI client generator agreed by both teams.
4. Keep generated code in a dedicated folder such as `src/api/generated/`; never edit it manually.
5. Build fails if generated changes are missing or the frontend uses invalid schemas/routes.
6. Add contract checks in CI and integration tests against the backend.
7. Pin compatible API/client versions for each demo release.

Suggested command pattern (adapt to actual repository scripts and OpenAPI URL):

```bash
# Example only: use the actual backend host and schema path agreed by the team.
npx openapi-typescript http://localhost:8000/openapi.json -o src/api/generated/schema.d.ts
```

If the backend is mounted under `/api/v1`, verify whether OpenAPI paths already include that prefix before adding it in the client. Avoid double-prefix bugs.

## 9. Suggested frontend project structure

```text
frontend/
  src/
    app/
      App.tsx
      router.tsx
      providers.tsx
    api/
      client.ts
      errors.ts
      generated/
      queries/
        auth.ts
        applications.ts
        documents.ts
        validation.ts
        findings.ts
        verifications.ts
        reports.ts
        alerts.ts
        admin.ts
        audit.ts
    components/
      layout/
      navigation/
      forms/
      feedback/
      data-display/
      documents/
      findings/
    features/
      auth/
      dashboard/
      applications/
      validation/
      officer/
      verifier/
      reports/
      alerts/
      admin/
      audit/
    hooks/
    lib/
      env.ts
      permissions.ts
      status-mappers.ts
      validation.ts
    types/
    styles/
  tests/
  .env.example
  package.json
  vite.config.ts
  tsconfig.json
```

Feature folders may be reorganised, but API calls should live in the shared API/query layer rather than being scattered through page components.

## 10. Frontend state and data rules

- Use TanStack Query (or equivalent) for server state, caching, invalidation, retries, and request cancellation.
- Use React Hook Form + Zod (or equivalent) for form state and client-side validation.
- Keep authenticated user information in memory and derive role permissions from `GET /auth/me`.
- Do not treat client-side state as authoritative for ownership, status, permissions, or decisions.
- Invalidate/refetch relevant application, finding, queue, alert, and report queries after successful mutations.
- Poll jobs at a reasonable interval with backoff; stop polling when complete, failed, the view unmounts, or the user leaves the page.
- Avoid optimistic updates for high-impact actions such as final decisions unless explicitly approved and reconciled with server confirmation.
- Display timestamps in a consistent local format while preserving the original server timestamp for debugging/audit context.
- Never place passwords, tokens, full document contents, or sensitive personal data in URLs, analytics, or logs.

## 11. Design system and accessibility

- Use a consistent, professional institutional dashboard style: clear hierarchy, restrained colour, readable tables, visible status labels, and evidence-first layouts.
- Status must not be communicated by colour alone; include text and accessible labels.
- Support keyboard navigation, visible focus, semantic headings, labelled form controls, accessible dialogs, and screen-reader announcements for upload/job status.
- Provide responsive layouts for laptop/tablet/mobile; tables may become stacked cards on narrow screens.
- Confirm before consequential actions and make destructive or final actions visually distinct without relying only on colour.
- Ensure contrast meets WCAG 2.2 AA targets where practical.
- Avoid displaying raw stack traces or internal server errors to users.

## 12. Security and privacy requirements

- Frontend is not a security boundary. All object-level and function-level authorisation must be enforced by the backend.
- No access/refresh tokens in localStorage, sessionStorage, URLs, or logs.
- Do not render raw HTML from backend fields. Escape text and sanitise any explicitly supported rich text.
- Restrict external links and avoid opening untrusted URLs returned from documents or issuer sources without validation.
- Use HTTPS in deployed environments.
- Do not place secrets in `VITE_*` variables; Vite exposes them to the browser bundle.
- Configure Content Security Policy and security headers at the hosting/reverse-proxy layer with the backend/deployment team.
- Treat document names, extracted fields, finding reasons, handbook content, and issuer responses as untrusted text.
- Avoid collecting unnecessary personal data in analytics. Use synthetic/anonymised data in demos.
- Keep file preview/download access aligned with backend authorisation and short-lived links.
- Show that AI findings are advisory and that low-confidence outcomes require manual review where the backend indicates this.

## 13. Testing plan

### Unit/component tests
- Role-based navigation and route guards.
- Form validation and field-error mapping.
- Application and finding status display.
- Verification status mapping, including unavailable/manual-review states.
- Loading, empty, error, and retry states.
- Preventing non-officer users from seeing decision actions.

### API/contract tests
- Generated client matches backend OpenAPI.
- Login, refresh, logout, and `/auth/me`.
- Multipart upload with valid and invalid file types/sizes.
- Validation returns a job ID and UI follows job status.
- Findings and report retrieval.
- Error envelope and handling for `401`, `403`, `404`, `422`, `429`, and `5xx`.
- Cookie credentials and CORS in browser-based tests.
- No duplicate `/api/v1` prefix or trailing-slash redirects.

### End-to-end journeys
1. Applicant logs in → creates application → uploads document → runs stub validation → sees finding → rectifies/resubmits.
2. Officer logs in → sees queue item → reviews finding with note → records decision → opens report.
3. Verifier runs a verification → sees a pending or unavailable result → follows the manual-review path.
4. Admin updates a checklist/user where authorised; auditor views audit records read-only.
5. User A cannot access User B's application by changing an ID in the URL.
6. Expired session, rate limit, backend unavailable, and failed validation jobs display safe recovery states.

Use synthetic test data. Do not run tests against real applicant documents or production accounts.

## 14. Delivery milestones

### M1 — Connected walking skeleton
- Vite/React/TypeScript app, shared layout, login, `/auth/me`, role-aware routing.
- Applications list/create, one document upload, fake/stub validation supported by backend, finding display, officer queue.
- Docker Compose local run, `.env.example`, API proxy, health/readiness visibility.
- CI builds frontend and verifies generated OpenAPI types.

### M2 — Applicant workflow
- Application details, document management, submit/rectify states, job polling, findings, alerts.
- Error/empty/loading states and responsive layouts.

### M3 — Staff workflow
- Officer evidence review, required notes, final decision flow, verifier workflow, report/PDF access.
- Admin checklist/user screens and read-only audit screen as supported by API.

### M4 — Hardening and demo readiness
- Accessibility review, browser-level cookie/CORS checks, E2E role matrix, contract tests.
- Security review, dependency scan, removal of debug routes/mock data, production environment configuration.
- Fresh-clone demo instructions and verified end-to-end walkthrough.

## 15. Definition of done

- Every implemented screen is connected to a real backend endpoint or is explicitly labelled as a temporary mock.
- API routes, payloads, status enums, and error schemas match the generated OpenAPI contract.
- No role can use the UI to perform an action that the backend should deny; backend tests still enforce this independently.
- Applicant upload → validation job → finding → officer review/decision → report flow passes end-to-end using synthetic data.
- Session cookies, CORS, and API base URL work in the target browser and Docker setup.
- Loading, empty, permission, validation, rate-limit, network, and server-error states are covered.
- No client-side fabricated final decision, verification success, or official report.
- Project starts from documented setup instructions with no secrets committed.

## 16. Open integration decisions

Confirm these with the backend owner before implementation:
1. The exact deployed OpenAPI URL and whether `/api/v1` is included in each generated path.
2. Exact schemas for application statuses, validation job statuses, finding statuses, decisions, and all request/response bodies.
3. Exact supported query parameters and pagination envelope for every list endpoint.
4. Whether `/auth/refresh` is called automatically by the client or only after a `401`, and how refresh-token rotation is handled.
5. Whether file upload returns a document object, a task/job, or both; maximum file size and upload timeout.
6. How applicant-allowed rectification fields and valid status transitions are exposed.
7. Exact officer decision values and response fields; whether a separate decision-history endpoint exists.
8. How verifier assignments are listed, since the backend endpoint inventory does not specify a dedicated verification queue endpoint.
9. Whether reports are streamed as PDF bytes or returned via a short-lived signed link.
10. Which issuer integrations are real in the demo versus mocked, and which checklist/handbook data can be shown.
11. Whether alert counts/unread filters and audit filters are available in the API.
12. Whether the deployment uses same-origin reverse proxying or cross-origin cookies.

**Rule for unresolved items:** do not invent a backend endpoint or silently guess a schema. Mark the screen/action as blocked or use a clearly labelled mock until the API owner confirms the contract.
