# THERMORA Frontend Integration Guide

This guide describes how to connect the standalone THERMORA frontend to the real FastAPI backend service, the current API contract mapping, open integration decisions, and mocked functionality.

---

## 1. Five-Step Connect Procedure

Connecting this frontend to your live FastAPI backend requires zero code changes:

1. **Verify Backend Health & Readiness:**
   Ensure your FastAPI backend is running (typically on `http://localhost:8000`). Confirm it exposes `/healthz`, `/readyz`, and `/openapi.json`.
   ```bash
   npm run smoke
   ```
   If all three checks pass, proceed to Step 2.

2. **Update Environment Variables:**
   Copy `.env.example` to `.env` (or set the variables in your local shell):
   ```env
   VITE_USE_MOCK=false
   VITE_API_BASE_URL=/api/v1
   VITE_PROXY_TARGET=http://localhost:8000
   ```
   Setting `VITE_USE_MOCK=false` disables the in-memory mock engine. All requests will route through `src/api/client.ts` using real `fetch` calls with `credentials: "include"`.

3. **Generate Real API Types:**
   Synchronise the frontend TypeScript interfaces directly with your backend OpenAPI schema:
   ```bash
   npm run gen:api
   ```
   This reads `${OPENAPI_URL:-http://localhost:8000/openapi.json}` and writes `src/api/generated/schema.d.ts`. Never edit generated files by hand.

4. **Verify CORS & Cookie Configuration:**
   Ensure your FastAPI backend CORS configuration explicitly permits:
   - `allow_origins`: `["http://localhost:3000"]` (or your staging/production frontend URL)
   - `allow_credentials`: `True`
   - Cookies: `httpOnly=True`, `samesite="lax"` (or `"none"` if cross-site over HTTPS), `secure=True` (in production).
   *Note: Never use `allow_origins=["*"]` when credentials are included.*

5. **Start Dev Server or Deploy Container:**
   - **Local Development:**
     ```bash
     npm run dev
     ```
     The Vite dev server will start on `http://localhost:3000` and proxy `/api/*` to `http://localhost:8000`.
   - **Docker / Production:**
     ```bash
     docker compose -f docker-compose.yml -f docker-compose.frontend.yml up -d
     ```
     Nginx will serve the static bundle on port 3000 and reverse-proxy `/api/` to `http://backend:8000`.

---

## 2. Component Contract Table: Component | Endpoint | Type | Fields Used

| Component / Feature | Endpoint | Type / Schema | Fields Used |
|---|---|---|---|
| `LoginForm` | `POST /auth/login` | Login Request / Response | `email`, `password` |
| `AppShell` / `UserMenu` | `GET /auth/me` | `User` | `id`, `email`, `role`, `institution_id` |
| `AppShell` / `Logout` | `POST /auth/logout` | Empty response | None (clears auth cookies) |
| `ApplicationList` | `GET /applications` | `Page<Application>` | `id`, `category`, `status`, `created_at`, `submitted_at`, `institution_id` |
| `ApplicationCreate` | `POST /applications` | `Application` | `category`, `institution_id` |
| `ApplicationDetail` | `GET /applications/{id}` | `Application` | `id`, `category`, `status`, `created_at`, `submitted_at` |
| `DocumentDropzone` | `POST /applications/{id}/documents` | `DocumentMeta` | `id`, `application_id`, `doc_type`, `sha256`, `uploaded_at`, `filename` |
| `DocumentViewer` | `GET /documents/{id}` | `DocumentMeta` | `id`, `filename`, `doc_type`, `uploaded_at` |
| `ValidationRunner` | `POST /applications/{id}/validate` | `Job` (202 Accepted) | `id`, `status` |
| `JobProgress` | `GET /jobs/{id}` | `Job` | `id`, `status`, `error` |
| `FindingsList` | `GET /applications/{id}/findings` | `Page<Finding>` / `Finding[]` | `id`, `document_id`, `field`, `rule_id`, `rule_version`, `reason`, `evidence_ref`, `severity`, `confidence`, `status`, `review_note` |
| `OfficerQueue` | `GET /officer/queue` | `Page<Application>` | `id`, `institution_id`, `category`, `status`, `created_at`, `open_findings_count`, `highest_severity` |
| `FindingReviewModal` | `POST /findings/{id}/review` | `Finding` | `action` (accept/dismiss), `review_note` (mandatory) |
| `ConfirmDecisionDialog` | `POST /applications/{id}/decision` | Decision Response | `application_id`, `decision` (approve / return_for_rectification / reject), `decision_note` |
| `VerifierWorklist` | `POST /documents/{id}/verify` | `Verification` | `id`, `document_id`, `method`, `source`, `status`, `compared`, `checked_at` |
| `ManualConfirmPanel` | `POST /verifications/{id}/manual-confirm` | `Verification` | `verification_id`, `notes`, `status` |
| `AlertsList` | `GET /alerts` | `Page<Alert>` | `id`, `type`, `object_ref`, `created_at`, `acked_at` |
| `AlertItem` | `POST /alerts/{id}/ack` | `Alert` | `id`, `acked_at` |
| `ReportViewer` | `GET /applications/{id}/report` | Report JSON | `application_id`, `summary`, `status`, `generated_at`, `findings_summary` |
| `ReportDownload` | `GET /applications/{id}/report.pdf` | PDF Binary stream | Content-Disposition, raw blob |
| `ChecklistEditor` | `GET /admin/checklists` | `Checklist[]` | `id`, `category`, `version`, `active`, `rules` |
| `AuditStream` | `GET /audit` | `Page<AuditEntry>` | `id`, `actor_id`, `role`, `action`, `object_ref`, `summary`, `request_id`, `created_at` |

---

## 3. Open Decisions Requiring Backend Confirmation

The following 12 items from the context files require final backend confirmation. Per integration safety rules, no fake assumptions are made; unconfirmed items are marked as pending backend specification:

1. **OpenAPI Path Prefix:** Confirmation whether the live FastAPI OpenAPI paths already include `/api/v1` or if `/api/v1` is mounted at the root router. (Frontend prepends `VITE_API_BASE_URL` without trailing slashes).
2. **Exact Decision Enum Values:** Official regulatory decision strings (provisional: `approve`, `return_for_rectification`, `reject`).
3. **List Pagination Envelope:** Whether all lists follow `{ items: T[], total, page, page_size }` or plain arrays (handled transparently by `normalizePage()`).
4. **Token Refresh Strategy:** Whether `/auth/refresh` rotates refresh tokens and whether it is called proactively or strictly on 401 response intercept.
5. **Upload Response Payload:** Whether `POST /applications/{id}/documents` returns the created `DocumentMeta`, an asynchronous extraction `job_id`, or both.
6. **Rectification Transition Rules:** How the backend signals which documents are allowed to be replaced and what application states allow editing.
7. **Decision History Endpoint:** Whether past officer decisions / revisions have a dedicated timeline endpoint or live on the application object.
8. **Verifier Queue Schema:** Whether a dedicated `GET /verifications/queue` will be provided or if verifiers inspect assigned documents via application detail.
9. **Official Report Delivery:** Whether `GET /applications/{id}/report.pdf` streams raw bytes directly or redirects to a short-lived signed S3/GCS bucket URL.
10. **Issuer Verification Integrations:** Which external issuing authorities (e.g., DigiLocker, University portals, State Boards) are real in this phase vs stubbed.
11. **Alert & Audit Query Parameters:** Exact supported filter params (`severity`, `unread`, `date_from`, `date_to`).
12. **Same-Origin vs Cross-Origin Cookies:** Production reverse proxying (same-origin recommended via Nginx) vs cross-domain CORS cookies.

---

## 4. Current Mock Implementation Inventory (`src/api/mock/`)

When `VITE_USE_MOCK=true`, the built-in mock engine simulates:
- **Authentication & Roles:**
  - `applicant@demo.test` (Applicant institution role)
  - `officer@demo.test` (AICTE scrutiny officer role)
  - `verifier@demo.test` (Document verification officer role)
  - `admin@demo.test` (System administrator role)
  - `auditor@demo.test` (Regulatory auditor role)
- **Validation Job State Machine:**
  - `POST /applications/{id}/validate` returns HTTP 202 with `job_id`.
  - Asynchronous background progression: `queued` (1-2s) → `running` (2-4s) → `completed`.
- **Pre-seeded Synthetic Data:**
  - Sample AICTE applications across Technical Institutions, Polytechs, and New Institutes.
  - Evidence-linked findings with bounding box references and severity ratings.
  - Issuer verification outcomes (Verified, Mismatch detected, Source unavailable).
- **Error Simulation:**
  - Predictable error response envelope: `{ code, message, request_id, errors }`.
  - Handling for 400, 401, 403, 404, 422, 429, and 500 error scenarios.
- **Visual Indicator:**
  - High-visibility banner `"DEMO MODE: synthetic data"` is rendered across all pages when mock mode is enabled.
