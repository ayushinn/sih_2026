# THERMORA Frontend — AICTE Document Validation Platform

> **Governing Principle:** AI advises. Evidence supports. Authorised officials decide. Every action is traceable.

THERMORA is an AI-assisted decision-support platform for AICTE application scrutiny. This web frontend provides role-based workspaces for **Applicant Institutions**, **AICTE Scrutiny Officers**, **Verification Officers**, **System Administrators**, and **Auditors**.

---

## ⚡ Quick Start

### 1. Installation
```bash
npm install
```

### 2. Run in Demo Mode (Zero Backend Setup Needed)
The repository is pre-configured to run with an in-memory mock engine using synthetic data:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Connect to Real FastAPI Backend
1. Start your FastAPI backend on `http://localhost:8000`.
2. Check connectivity with the smoke test:
   ```bash
   npm run smoke
   ```
3. Update `.env` (or copy from `.env.example`):
   ```env
   VITE_USE_MOCK=false
   VITE_API_BASE_URL=/api/v1
   VITE_PROXY_TARGET=http://localhost:8000
   ```
4. Generate up-to-date TypeScript types from your OpenAPI schema:
   ```bash
   npm run gen:api
   ```
5. Restart the dev server: `npm run dev`.

---

## 👥 Demo Accounts (Mock Mode Only)

In mock mode (`VITE_USE_MOCK=true`), sign in using any of the following accounts with **any non-empty password**:

| Email | Role | Accessible Workspaces |
|---|---|---|
| `applicant@demo.test` | Applicant Institution | Application creation, document upload, pre-check runner, rectification, submission tracking |
| `officer@demo.test` | AICTE Scrutiny Officer | Scrutiny queue, evidence review, finding review (accept/dismiss), final decision recording |
| `verifier@demo.test` | Verification Officer | Document issuer verification, mismatch analysis, manual confirmation |
| `admin@demo.test` | Administrator | User & role management, versioned checklist rules, audit trail (no decision rights) |
| `auditor@demo.test` | Auditor | Read-only append-only audit trail and compliance reports |

---

## 🛠 Available Scripts

- `npm run dev`: Starts the Vite development server on port 3000 with proxying to `VITE_PROXY_TARGET`.
- `npm run build`: Compiles strict TypeScript and builds the production static bundle into `dist/`.
- `npm run preview`: Locally previews the production build.
- `npm run typecheck`: Runs `tsc --noEmit` across all TypeScript code.
- `npm run lint`: Validates types and catches syntax issues.
- `npm run test`: Executes unit and component tests with Vitest.
- `npm run gen:api`: Generates `src/api/generated/schema.d.ts` from the running FastAPI backend's `/openapi.json`.
- `npm run smoke`: Performs a quick health and readiness probe on the configured backend (`/healthz`, `/readyz`, `/openapi.json`).

---

## 🐳 Docker Deployment

A production-ready multi-stage `Dockerfile` and `nginx.conf` are included:

```bash
# Build and run with Docker
docker build -t thermora-frontend .
docker run -p 3000:80 thermora-frontend

# Or run via Docker Compose with your backend service
docker compose -f docker-compose.yml -f docker-compose.frontend.yml up -d
```

Nginx serves the React SPA with HTML5 routing fallback and proxies all `/api/` traffic to `http://backend:8000`.

---

## 🔒 Security & Architectural Rules

- **Zero Client Secrets:** No backend API keys or secrets in `VITE_*` variables.
- **Cookie Authentication:** Real mode sends cookies with `credentials: "include"`. Tokens and passwords are never stored in `localStorage`, `sessionStorage`, URLs, or logs.
- **Single HTTP Gateway:** All network requests pass exclusively through `src/api/client.ts`. Feature components never call `fetch` or access environment variables directly.
- **Honesty First:** AI outputs are advisory. Regulatory decisions can only be submitted by authorised AICTE officers. No fake verifications or invented compliance claims.
