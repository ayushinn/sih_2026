/**
 * Static content for DOCKEXPERT Public Landing Page
 * Honesty rule: No invented metrics, testimonials, or benchmark claims.
 */

export const HERO_SENTENCES = [
  'Documents, checked.',
  'Evidence, not guesswork.',
  'AI advises. Officials decide.',
] as const;

export const HERO_SUBTITLE =
  'A trusted decision-support platform for institutional document validation. Helping institutions fix gaps before submission, and officers scrutinize with evidence.';

export const STATEMENT_HEADLINE_PART_1 = 'We help institutions fix the gaps before they submit, ';
export const STATEMENT_HEADLINE_PART_2 = 'and help officers see the evidence first.';

export const MARQUEE_WORDS = [
  'MISSING',
  'EXPIRED',
  'INCONSISTENT',
  'ALTERED',
  'DUPLICATE',
] as const;

export const WORKFLOW_STEPS = [
  {
    step: 1,
    title: 'Institution Uploads Document Package',
    desc: 'Applicant uploads digital certificates for fire safety, land, faculty roster, and society registration in PDF, JPG, or PNG format.',
  },
  {
    step: 2,
    title: 'Async Validation Job Enqueued (HTTP 202)',
    desc: 'Backend returns a tracked job identifier; client polls with backoff until background OCR and verification concludes.',
  },
  {
    step: 3,
    title: 'OCR & Layout Analysis Extracts Metadata',
    desc: 'Spatial text extraction identifies validity dates, sanctioned intake numbers, land survey plots, and building areas.',
  },
  {
    step: 4,
    title: 'Rule Engine Evaluates Compliance Norms & Expiry',
    desc: 'Cross-references statutory regulatory guidelines and approval norms. Flags high-severity expiry and ratio deviations.',
  },
  {
    step: 5,
    title: 'Evidence-Linked Advisory Findings Generated',
    desc: 'Surfaces findings with model confidence, exact page and coordinate bounding references, and regulatory clause citations.',
  },
  {
    step: 6,
    title: 'Authorised Officer Reviews & Records Decision',
    desc: 'Officer reviews side-by-side evidence, enters mandatory statutory justification notes, and certifies regulatory outcome.',
  },
] as const;

export interface CapabilityItem {
  id: string;
  menu: string;
  title: string;
  desc: string;
  details: string;
}

export const CAPABILITY_ITEMS: CapabilityItem[] = [
  {
    id: 'validation',
    menu: 'VALIDATION',
    title: 'Pre-Submission Checklist Validation',
    desc: 'Institutions receive instant feedback against versioned regulatory approval rules before final submission.',
    details: 'Rules check land requirements, statutory affidavits, building clearances, and faculty cadre ratios.',
  },
  {
    id: 'missing-expired',
    menu: 'MISSING AND EXPIRED',
    title: 'Automated Expiry & Incompletion Detection',
    desc: 'Flags fire safety clearances, society renewals, and accreditation certificates that expire before or during the academic cycle.',
    details: 'Never converts missing data into a pass. Highlights exact paragraph references and expiry dates.',
  },
  {
    id: 'anomalies',
    menu: 'ANOMALY INDICATORS',
    title: 'Preliminary Anomaly & Inconsistency Flags',
    desc: 'Surfaces font mismatches, altered resolution artifacts, and cross-document figure discrepancies for human inspection.',
    details: 'Flagged strictly as preliminary indicators requiring human verification, never as conclusive findings.',
  },
  {
    id: 'issuer-verification',
    menu: 'ISSUER VERIFICATION',
    title: 'Cross-Authority Registry Verification',
    desc: 'Queries issuing authorities via digital APIs and registries, displaying verified, mismatch, or source unavailable states.',
    details: 'Six exact statuses supported: verified, failed, inconclusive, pending, manual_required, exempt.',
  },
  {
    id: 'infrastructure',
    menu: 'INFRASTRUCTURE EVIDENCE',
    title: 'CAD & Floor Plan Evidence Mapping',
    desc: 'Extracts instructional area, administrative space, and safety circulation from submitted architectural floor plans.',
    details: 'Bounding boxes are drawn only when provided by verified geometric coordinates from the pipeline.',
  },
  {
    id: 'officer-dashboard',
    menu: 'OFFICER DASHBOARD',
    title: 'Authorised Scrutiny & Decision Support',
    desc: 'Empowers scrutiny officers with evidence side-by-side with findings, requiring mandatory notes for every decision.',
    details: 'Regulatory decisions remain strictly in the hands of authorised officials.',
  },
];

export interface RoleRow {
  side: string;
  role: string;
  desc: string;
  path: string;
}

export const ROLES_LIST: RoleRow[] = [
  {
    side: 'APPLICANT SIDE',
    role: 'Applicant Institution',
    desc: 'Upload institution documents, run pre-check validation, rectify flagged issues, and track application status.',
    path: '/login',
  },
  {
    side: 'SCRUTINY SIDE',
    role: 'Scrutiny Officer',
    desc: 'Review scrutiny queue, examine bounding-box evidence, accept or dismiss findings, and record statutory decisions.',
    path: '/login',
  },
  {
    side: 'VERIFICATION SIDE',
    role: 'Verification & Inspection Team',
    desc: 'Verify certificates against external portals and conduct manual verifier confirmation workflows.',
    path: '/login',
  },
  {
    side: 'SYSTEM SIDE',
    role: 'Administrator',
    desc: 'Maintain versioned handbook checklists, configure rules, and manage user roles without decision power.',
    path: '/login',
  },
  {
    side: 'REGULATORY SIDE',
    role: 'Auditor',
    desc: 'Inspect the tamper-evident, append-only immutable audit trail and compliance verification records.',
    path: '/login',
  },
];

export const WORKSPACE_MODULES = [
  { name: 'Alerts', desc: 'Real-time notifications on rectification deadlines and pre-check status' },
  { name: 'Reports', desc: 'Advisory summaries and downloadable binary scrutiny PDF records' },
  { name: 'Audit Trail', desc: 'Cryptographically hashed append-only stream of all regulatory actions' },
  { name: 'Checklists', desc: 'Versioned compliance handbook rule definitions and severities' },
] as const;

export interface SafeguardCard {
  id: string;
  title: string;
  body: string;
}

export const SAFEGUARDS: SafeguardCard[] = [
  {
    id: 'SG-EDU',
    title: 'Education Sector Verification',
    body: 'Academic degrees, university affiliation charters, faculty cadre lists, and mark-sheets verified against official portals.',
  },
  {
    id: 'SG-INFRA',
    title: 'Campus Infrastructure & Land Scrutiny',
    body: 'Land titles, built-up area FSI, municipal building plans, and Fire NOC clearances cross-matched against public records.',
  },
  {
    id: 'SG-LEGAL',
    title: 'Legal & Statutory Compliance Validation',
    body: 'Trust deeds, Society Act registrations, notarial affidavits, and statutory bylaws validated with registry sources.',
  },
  {
    id: 'SG-REAL',
    title: 'Real Estate & Title Verification',
    body: 'Sale deeds, 30-year encumbrance certificates, RERA approvals, and land revenue mutation extracts scrutinized.',
  },
  {
    id: 'SG-AUDIT',
    title: 'Traceable Audit Trail',
    body: 'Every document upload, pre-check execution and officer decision is logged in an append-only hash sequence. Nothing is overwritten.',
  },
  {
    id: 'SG-AI',
    title: 'AI is Advisory Only',
    body: 'AI flags discrepancies and links evidence. It never approves or rejects. Authorised officials make every decision.',
  },
];

export const SAMPLE_TILES = [
  { name: 'Affidavit of Land Use', status: 'Verified', tint: 'bg-tint-ok text-ok border-ok/30' },
  { name: 'Fire Safety NOC', status: 'Expired', tint: 'bg-tint-warn text-warn border-warn/30' },
  { name: 'Approved Building Floor Plan', status: 'Mismatch detected', tint: 'bg-tint-danger text-danger border-danger/30' },
  { name: 'Faculty Cadre Matrix', status: 'Flagged', tint: 'bg-tint-warn text-warn border-warn/30' },
  { name: 'Accreditation Certificate', status: 'Verified', tint: 'bg-tint-ok text-ok border-ok/30' },
  { name: 'Pollution Control Board Clearance', status: 'Exempt', tint: 'bg-muted/10 text-muted border-muted/20' },
  { name: 'Society Registration Deed', status: 'Could not check source', tint: 'bg-white/10 text-white/70 border-white/20' },
] as const;

export interface EcosystemIntegration {
  id: string;
  name: string;
  category: string;
  description: string;
  badge: string;
  iconType: 'n8n' | 'make' | 'digilocker' | 'zapier' | 'aws' | 'esign' | 'webhook' | 'slack';
}

export const ECOSYSTEM_INTEGRATIONS: EcosystemIntegration[] = [
  {
    id: 'n8n',
    name: 'n8n Workflow Automation',
    category: 'Node-Based Orchestration',
    description: 'Trigger autonomous document verification nodes and receive audit callbacks directly in self-hosted n8n pipelines.',
    badge: 'Native Node Ready',
    iconType: 'n8n',
  },
  {
    id: 'make',
    name: 'Make.com (Integromat)',
    category: 'Scenario Automation',
    description: 'Connect verification jobs with 1,500+ apps, chain multi-stage approvals, and auto-dispatch signed evaluation reports.',
    badge: 'Instant Scenario Trigger',
    iconType: 'make',
  },
  {
    id: 'digilocker',
    name: 'DigiLocker / NAD Vault',
    category: 'Govt Certificate Issuer',
    description: 'Direct cryptographic retrieval and authentic issuer-level verification of academic degrees, marksheets & land deeds.',
    badge: 'Official API v2',
    iconType: 'digilocker',
  },
  {
    id: 'zapier',
    name: 'Zapier Cloud Trigger',
    category: '5,000+ App Connectors',
    description: 'Instant event hooks on document submission, rule engine findings, and final regulatory approval decisions.',
    badge: 'Instant Event Trigger',
    iconType: 'zapier',
  },
  {
    id: 'aws',
    name: 'Amazon S3 & Cloud Vaults',
    category: 'Secure Object Storage',
    description: 'Server-side KMS encrypted bucket ingestion with SHA-256 hash preservation and asynchronous OCR pre-checks.',
    badge: 'KMS Encrypted',
    iconType: 'aws',
  },
  {
    id: 'esign',
    name: 'Aadhaar e-Sign & DSC',
    category: 'PKI Digital Signatures',
    description: 'Validates PKI cryptographic signatures, Certifying Authority (CA) root chains, and official timestamp certificates.',
    badge: 'PKI / e-Sign Valid',
    iconType: 'esign',
  },
  {
    id: 'webhook',
    name: 'REST & GraphQL Webhooks',
    category: 'Developer API Pipeline',
    description: 'High-throughput async event callbacks (HTTP 200/202) for real-time ERP, SIS, and core regulatory system sync.',
    badge: 'Sub-50ms Latency',
    iconType: 'webhook',
  },
  {
    id: 'slack',
    name: 'Slack & Teams Dispatch',
    category: 'Enterprise Incident Alerts',
    description: 'Broadcast high-severity findings, document expiry alerts, and fraud detections directly to officer response channels.',
    badge: 'Real-time Webhook',
    iconType: 'slack',
  },
];
