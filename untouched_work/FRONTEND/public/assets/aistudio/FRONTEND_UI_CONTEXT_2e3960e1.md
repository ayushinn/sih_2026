# THERMORA Frontend UI and Integration Context

Project: AICTE Document Validation Platform · SIH26261 · Team THERMORA
Use together with: FRONTEND_PRD_FOR_AGENT.md (behaviour), BACKEND_PRD_FOR_AGENT.md (API), FRONTEND_CONTEXT_ONLY.md (rules, roles, routes, types).

Precedence if two documents disagree: backend OpenAPI > FRONTEND_PRD_FOR_AGENT.md > this file.

Governing principle: **AI advises. Evidence supports. Authorised officials decide. Every action is traceable.**

---

## 1. What each reference is used for

- **VERIFAI / DOCKEXPERT spec: content context only.** It tells us what kind of product this is (landing page, then Applicant, Officer and Audit workspaces; evidence viewer; decision modal; audit stream). **Nothing of its design is used**: no layout, colours, card style, badges or copy.
- **Agency portfolio video (WA0002): the only design reference.** Everything about look, layout rhythm, typography and motion comes from it (section 2).
- **Content source of truth:** the SIH26261 problem statement, the team deck and the PRDs.

### 1.1 Not copied
- No brand names, logos, photos, copy or images from either reference.
- No numbers or claims from the VERIFAI spec: no "99.4% accuracy", "10,400 institutes", "ISO 27001", "MeitY empanelled", star ratings, testimonials or institution logos. THERMORA has no measured results yet. Never invent benchmark results.
- No Legal, Real Estate or Retail pages. AICTE only.
- No simulated "blockchain hash" or "legally binding" wording. THERMORA uses an append-only audit log with a hash chain; decisions are recorded by an authorised officer.
- No risk score such as "High 89" unless the backend provides a priority or severity field.
- No `/?tab=officer` style tabs for protected areas. Use real routes with route guards.

---

## 2. Visual language (from video WA0002)

### 2.1 What the reference looks like
- **Hero:** pure black. Giant white centred sentence that changes by itself ("Design, tech & some magic" then "design solutions"). Small image tiles float around it at different sizes. A horizontal strip of rounded image tiles scrolls underneath.
- **Statement section:** solid electric blue, very large white headline. The last part of the sentence is in a lighter tint of the same blue.
- **Marquee section:** off-white page with giant faint repeating uppercase words in the background (like "EDITORIAL / EXPERIMENT"), and one rounded dark media card in the centre.
- **Portfolio section:** full-bleed dark panel with a centred title and a pill button ("Know more"). A tiny vertical text menu sits on the left edge.
- **Team section:** black, a huge faint word behind the title ("THE TEAM"), a centred heading, a short paragraph on the right. Then rows separated by hairlines: tiny uppercase role on the left, a large centred name, tiny link on the right. After that a four-column grid of small names with tiny role labels.
- **Testimonial section:** off-white, large centred statement ("Few words from our clients..."), one small white rounded review card floating beside it.
- **Footer:** black band on top, off-white below. Tiny monospace nav row (HOME, WORKS, ABOUT, SERVICES, CONTACT), tiny address left and copyright right, then a giant black wordmark across the full width, small links under it.
- **Cursor:** a small custom dot that follows the mouse.

### 2.2 Two modes, one system
- **Public landing (cinematic):** all of the above, translated to THERMORA content (section 3).
- **Workspaces after login (calm):** same fonts, tokens, hairlines, pills and big page titles, but no scroll theatrics. Officers read tables and documents all day, so motion is minimal.

### 2.3 Design tokens
Define once as CSS variables and map in the Tailwind config. Changing the look must never require touching feature code.

| Token | Value | Use |
|---|---|---|
| `--ink` | `#0B0B0C` | black sections, text on light |
| `--paper` | `#FBFBF6` | off-white sections |
| `--brand` | `#2B6CC4` | the solid blue statement section, primary pill buttons |
| `--brand-soft` | lighter tint of `--brand` | second half of statement headlines |
| `--brand-deep` | `#0E2F66` | headings on light |
| `--ok` | `#2EA653` | verified |
| `--warn` | `#F28B2B` | expiring, attention |
| `--info` | `#7B57C2` | verification |
| `--danger` | `#E4475A` | high severity, errors |
| `--muted` | `#5C6779` | secondary text on light |
| `--line` | white at 12 percent on dark, `--brand-deep` at 12 percent on light | hairlines |
| tints | `#EAF2FC` `#E9F7EE` `#FEF2E6` `#F0EBFA` `#FDEDEF` | status chips only |

The reference blue is replaced by the AICTE deck blue so the product matches the team deck. Status colours are used only on status chips.

### 2.4 Typography
- Display: a clean grotesk sans (Inter or system sans), very large and tight. Use `clamp()` from about 2.5rem on phones to 7rem on desktop. Weight 500 to 600. Headlines are sentence-case.
- Body: same family, 16px minimum; 70 percent white on dark, `--muted` on light.
- Micro labels, menus, footer links: monospace, 11 to 12px, uppercase, wide letter spacing.
- Giant faint background words: same display font at 12 to 20 vw, 6 to 8 percent opacity.
- Tabular figures in tables.

### 2.5 Layout vocabulary (reuse everywhere)
- Hairline rows (label left, big text centre, small action right) instead of heavy card grids.
- Pill buttons (fully rounded). One primary style, one outline style.
- Rounded media cards with large radius.
- Generous whitespace, one idea per section.
- Small vertical or horizontal mono menus for in-section navigation.
- Status chips are small pills with text and icon.

### 2.6 Motion rules
- Allowed: auto-changing hero sentence, floating tiles, slow marquee, scroll fade-and-rise, parallax on giant faint words, custom cursor dot, route fade.
- Everything respects `prefers-reduced-motion` (static fallback). The cursor dot is desktop only and off for touch and reduced motion.
- Motion never carries meaning alone. A status change always changes text too.
- Workspaces: skeleton loaders and short fades only.
- Use CSS and `IntersectionObserver` first. Add an animation library only if a section truly needs it.

### 2.7 Imagery
- No stock photos. The floating tiles and the tile strip are **synthetic document tiles** drawn by components: paper-like cards with blurred placeholder lines and a small status chip (Verified, Expired, Flagged, Missing).
- Every sample is labelled "Sample, synthetic data".

### 2.8 Accessibility
- WCAG 2.2 AA contrast, including white text on `--brand`.
- Status uses text plus icon plus colour.
- Keyboard navigation, visible focus ring, skip link, semantic headings, labelled forms, accessible dialogs.
- Floating tiles, marquee and giant faint words are decorative (`aria-hidden`) and pause on hover and with reduced motion.

---

## 3. Public landing page (route `/`)

Static content. **Calls no business API.** Optional: a footer indicator using `GET /healthz`; if it fails the page still renders.

| # | Section (reference counterpart) | Content for THERMORA |
|---|---|---|
| 1 | Navbar (small, transparent over black) | Wordmark THERMORA, mono links: WORKFLOW, CAPABILITIES, ROLES, SAFEGUARDS, and a pill "Sign in" |
| 2 | Hero (black, floating tiles, changing sentence) | Centred giant sentence cycling between: "Documents, checked." / "Evidence, not guesswork." / "AI advises. Officials decide." Floating synthetic document tiles with status chips. Small line: "Smart India Hackathon 2026 · SIH26261" |
| 3 | Tile strip (rounded image strip) | Scrolling strip of synthetic document tiles with typical AICTE application documents as labels: affidavit, NOC, accreditation certificate, faculty record, floor plan. Chips show Verified, Expired, Flagged, Missing as samples |
| 4 | Statement (solid blue) | "We help institutions fix the gaps before they submit, and help officers see the evidence first." Second half in `--brand-soft` |
| 5 | Marquee + media card (faint giant words, rounded dark card) | Background words: MISSING · EXPIRED · INCONSISTENT · ALTERED · DUPLICATE. Centre card: the 10-step workflow from the deck as an auto-playing animation on a synthetic sample (an expired certificate). Click to pause. Label "Sample, synthetic data" |
| 6 | Capabilities (full-bleed dark panel, vertical mono menu, pill button) | Left mono menu: VALIDATION, MISSING AND EXPIRED, ANOMALY INDICATORS, ISSUER VERIFICATION, INFRASTRUCTURE EVIDENCE, OFFICER DASHBOARD. Selecting an item changes the large title and a two-line description. Pill "Know more" opens a short explanation (for issuer verification it lists the six statuses) |
| 7 | Roles (black "team" section, giant faint word ROLES, hairline rows) | Rows: tiny label (APPLICANT SIDE or AICTE SIDE), large role name, tiny "Enter" link to `/login`. Rows: Applicant institution, AICTE scrutiny officer, Verification and inspection team, Administrator, Auditor. Below it a four-column grid of small items: Alerts, Reports, Audit trail, Checklists |
| 8 | Safeguards ("few words" section, off-white) | Large centred statement "Safeguards, in a few words." Beside it small white rounded cards, each with one safeguard from the problem statement: role-based authorised access; explainable, evidence-linked flags; AI output is decision support only; final decisions stay with the competent authority; every action is logged. Cards have no names or photos and are not styled as quotes from people |
| 9 | Footer (black band, off-white, mono nav, giant wordmark) | Mono nav row, small line "Prototype for SIH26261, built with synthetic and anonymised data", copyright, giant black THERMORA wordmark. No fake compliance badges |

Honesty rule: no metric appears unless it was measured on the prototype. Until then show only the **names** of the metrics that will be measured (extraction accuracy, validation accuracy, anomaly-detection performance, source-verification rate, verification time, alert timeliness, manual effort saved).

---

## 4. Application shell and workspaces (calm mode, same design language)

Look: `--paper` background by default, `--ink` text, big page titles in the display font, hairline-separated lists and tables, mono micro labels, pill buttons, small rounded containers only where grouping is needed. An optional dark theme uses `--ink` with the same tokens.

Shell parts:
- Left rail with mono uppercase role-aware items, top bar (search where supported, alerts count from `GET /alerts`, user menu with role label, logout).
- Large page title with a hairline under it.
- Persistent line: "AI findings are advisory. Officials make the final decision."
- A `DEMO` ribbon whenever mock data is active.

### 4.1 Page to route to API map

| Page | Route | Role | Main endpoints | Key components |
|---|---|---|---|---|
| Login | `/login` | public | `POST /auth/login`, then `GET /auth/me` | `LoginForm` |
| Applicant home | `/app` | applicant | `GET /applications`, `GET /alerts` | `ProgressSummary`, `ApplicationRows`, `AlertList` |
| New application | `/applications/new` | applicant | `POST /applications` | `CategoryPicker`, `ChecklistPreview` |
| Application detail | `/applications/:id` | authorised roles | `GET /applications/{id}`, `GET /applications/{id}/findings`, `GET /documents/{id}` | `DocumentRows`, `FindingCard`, `VerificationBadge` |
| Upload / rectify | `/applications/:id/upload`, `/rectify` | applicant | `POST /applications/{id}/documents`, `POST /applications/{id}/validate`, `GET /jobs/{id}`, `PATCH /applications/{id}`, `POST /applications/{id}/submit` | `FileDropzone`, `JobProgress` |
| Officer queue | `/officer/queue` | officer | `GET /officer/queue` | `QueueRows` (filters from OpenAPI) |
| Evidence review | `/applications/:id/review` | officer | findings, documents, verifications, `POST /findings/{id}/review`, `POST /applications/{id}/decision` | `EvidenceViewer`, `FindingCard`, `ConfirmDecisionDialog` |
| Verification | `/verifications` | verifier | `POST /documents/{id}/verify`, `GET /verifications/{id}`, `POST /verifications/{id}/manual-confirm` | `VerificationBadge`, `ManualConfirmPanel` |
| Alerts | `/alerts` | all | `GET /alerts`, `POST /alerts/{id}/ack` | `AlertList` |
| Report | `/reports/:id` | authorised roles | `GET /applications/{id}/report`, `GET /applications/{id}/report.pdf` | `ReportSummary` |
| Admin | `/admin/users`, `/admin/checklists` | admin | `/admin/*` | `UserRows`, `ChecklistEditor` |
| Audit | `/audit` | admin, auditor | `GET /audit` | `AuditStream` (read-only) |
| Errors | `/401` `/403` `/500` `*` | any | none | error pages |

### 4.2 Applicant workspace
- **Progress summary:** counts of documents by state, derived only from findings and document data returned by the API. Do not show a "percent complete" unless the API gives one; if derived, label it "documents with no open findings".
- **Document rows:** one hairline row per required document from the active checklist: name, size, upload time, extraction confidence (if provided), open findings, status chip.
- **Expandable extraction panel:** OCR fields with confidence and source page. Label: "Extracted by AI, not verified".
- **Upload and rectify:** drag and drop for PDF, JPG, PNG with per-file progress and errors; replace a flagged document; re-run the pre-check.
- **Submit:** enabled only when the backend says the application can be submitted.

### 4.3 Officer workspace
- **Queue:** ranked by the severity or priority the API returns. Columns: institution, category, open findings, highest severity, age, status.
- **Evidence viewer (two panes):** left, findings list with severity chip, rule id and version, reason, handbook reference when provided, review state. Right, document viewer. When evidence includes a page and a 0 to 1 bounding box, draw the box; otherwise show the evidence reference text. Never draw a box the API did not give. Selecting a finding highlights its region and the reverse.
- **Finding review:** accept or dismiss, note required.
- **Decision dialog:** shows application id and decision, requires a note, blocks double submit, waits for server confirmation. Decision values are provisional until the backend confirms them. Only the officer role ever sees this control.

### 4.4 Verifier, admin, auditor
- Verifier: result rows with exact status, source, timestamp and compared fields; unavailable or inconclusive shows the manual-confirmation path.
- Admin: users and checklists; checklist editor shows version, active state and handbook source reference. Admin has no decision control.
- Auditor and audit page: chronological stream with filters and search only if the API supports them; show request id and hash fields if returned. No edit, no delete.

---

## 5. Integration seams

The earlier phase failed because routes, base URL, start order and field names did not match. This structure prevents that.

### 5.1 Layers (one direction only)

```text
pages / features  →  feature hooks  →  api/queries  →  api/client  →  [ real HTTP | mock adapter ]
```

- Pages and components never call `fetch`, never build URLs, never read env variables.
- Feature hooks (`useFindings`, `useDecision`, `useJob`) wrap TanStack Query and return view models.
- `api/queries/*` is the only place that names endpoints, one function per endpoint in the backend inventory.
- `api/client.ts` is the only place that does HTTP: base URL, `credentials: "include"`, error envelope parsing, one 401 refresh, request id capture.
- The adapter switch (real or mock) keeps the same signatures and types.

### 5.2 Single sources of truth

| Concern | File |
|---|---|
| Base URL and flags | `src/lib/env.ts` (`VITE_API_BASE_URL`, `VITE_USE_MOCK`) |
| API types | `src/api/generated/schema.d.ts` from OpenAPI (placeholder `src/api/types.ts` until then) |
| Backend value to display mapping | `src/lib/status-mappers.ts` |
| Role to route permissions | `src/lib/permissions.ts` (route guards and navigation both use it) |
| Design tokens | `src/styles/tokens.css` and Tailwind config |
| Error envelope handling | `src/api/errors.ts` |
| Landing copy | `src/content/landing.ts` (static, no API) |

### 5.3 Rules that keep integration easy
1. If a field is not in the API types, the UI does not render it. If the design needs it, add it to the open items.
2. Every unknown enum value renders as raw text in a neutral chip. The UI never crashes on a new backend value.
3. All list endpoints share one `Page<T>` handler and one pagination component.
4. Forms use Zod schemas and map `422` field errors by field name.
5. Client routes live in `router.tsx`; API paths live only in `api/queries`.
6. No trailing-slash routes, no reliance on redirects. Check whether OpenAPI paths already include `/api/v1` before prefixing.
7. All backend text is rendered as plain text.
8. Landing code is isolated in `src/features/landing` and can be replaced without touching any workspace.
9. Mock data lives in `src/api/mock` and is excluded from the production build.
10. Each component that shows backend data has a one-line header comment naming its endpoint and type.

### 5.4 Suggested structure

```text
src/
  app/            router.tsx, providers.tsx, App.tsx
  api/            client.ts, errors.ts, types.ts | generated/, queries/, mock/
  features/
    landing/      sections/ (Hero, TileStrip, Statement, MarqueeCard, Capabilities, RoleRows, Safeguards, GiantFooter)
    auth/  applications/  validation/  officer/  verifier/  reports/  alerts/  admin/  audit/
  components/
    layout/ (Shell, Rail, Topbar)   feedback/ (ErrorPages, Skeletons)
    data-display/ (Rows, StatusChip, Page)   documents/ (FileDropzone, DocumentViewer)
    findings/ (FindingCard, EvidenceViewer, AdvisoryBanner)
  lib/            env.ts, permissions.ts, status-mappers.ts
  styles/         tokens.css
  content/        landing.ts
```

### 5.5 Contract table
Keep a table in the README: component, endpoint, type name, fields used. During hand-off, check it against the generated OpenAPI types. A missing field shows up there first.

---

## 6. Content and wording rules
- Say "flag", "indicator", "possible", "needs review". Never state "fake", "forged" or "fraud" as a conclusion.
- Never show a confidence number alone; add "model confidence, not proof".
- Never show "approved" or "rejected" unless the API returned a recorded officer decision.
- Verification chip labels are fixed: Verified, Mismatch detected, Expired, Verification pending, Source unavailable, Manual review required. For unavailable use the neutral line "Could not be checked at the source".
- Mark every sample as "Sample, synthetic data".

---

## 7. Open items
1. Confirm the blue (deck blue is the default) and the display font (Inter is the default; check licence if another font is chosen).
2. Does risk or priority come from the API? If not, sort the queue by severity only.
3. Does the backend pass evidence page and bounding-box fields through from the ML service?
4. All items in section 14 of FRONTEND_CONTEXT_ONLY.md (enums, pagination, refresh flow, upload response, report delivery).

**Rule for unresolved items:** do not invent an endpoint or silently guess a schema. Mark the screen or action as blocked, or use a clearly labelled mock.
