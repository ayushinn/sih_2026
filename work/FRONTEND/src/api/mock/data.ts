import {
  Alert,
  Application,
  AuditEntry,
  Checklist,
  DocumentMeta,
  Finding,
  Job,
  User,
  Verification,
} from '../types';

export const DEMO_USERS: Record<string, User> = {
  'applicant@demo.test': {
    id: 'usr_app_01',
    email: 'applicant@demo.test',
    name: 'Prof. Rajesh Sharma',
    role: 'applicant',
    institution_id: 'INST-AICTE-1042',
  },
  'officer@demo.test': {
    id: 'usr_off_01',
    email: 'officer@demo.test',
    name: 'Dr. Sunita Deshmukh',
    role: 'officer',
    institution_id: 'AICTE-HQ-WEST',
  },
  'verifier@demo.test': {
    id: 'usr_ver_01',
    email: 'verifier@demo.test',
    name: 'Vikram Adhikari',
    role: 'verifier',
    institution_id: 'VERIF-ZONE-02',
  },
  'admin@demo.test': {
    id: 'usr_adm_01',
    email: 'admin@demo.test',
    name: 'S. K. Ramanathan',
    role: 'admin',
    institution_id: 'AICTE-SYSADMIN',
  },
  'auditor@demo.test': {
    id: 'usr_aud_01',
    email: 'auditor@demo.test',
    name: 'Meera Sen',
    role: 'auditor',
    institution_id: 'CAG-AUDIT-CELL',
  },
};

export const INITIAL_APPLICATIONS: Application[] = [
  {
    id: 'APP-2026-8810',
    institution_id: 'INST-AICTE-1042',
    category: 'Education Sector: Technical Degree (Engineering & Technology)',
    status: 'under_scrutiny',
    created_at: '2026-10-18T09:30:00Z',
    submitted_at: '2026-10-19T14:20:00Z',
    open_findings_count: 2,
    highest_severity: 'high',
  },
  {
    id: 'APP-2026-9044',
    institution_id: 'INST-AICTE-1042',
    category: 'Education Sector: University Affiliation & Faculty Rosters',
    status: 'rectification_requested',
    created_at: '2026-10-12T11:00:00Z',
    submitted_at: '2026-10-14T16:45:00Z',
    open_findings_count: 1,
    highest_severity: 'medium',
  },
  {
    id: 'APP-2026-3120',
    institution_id: 'INST-AICTE-1042',
    category: 'Campus Infrastructure: Land Scrutiny & Municipal Fire Safety NOC',
    status: 'under_scrutiny',
    created_at: '2026-10-16T10:00:00Z',
    submitted_at: '2026-10-17T11:30:00Z',
    open_findings_count: 2,
    highest_severity: 'high',
  },
  {
    id: 'APP-2026-1188',
    institution_id: 'INST-AICTE-1042',
    category: 'Legal Compliance: Societies Act 1860 & Notarised Trust Deed',
    status: 'submitted',
    created_at: '2026-10-21T09:00:00Z',
    submitted_at: '2026-10-21T15:00:00Z',
    open_findings_count: 0,
    highest_severity: 'low',
  },
  {
    id: 'APP-2026-5542',
    institution_id: 'INST-AICTE-1042',
    category: 'Real Estate: 30-Year Non-Encumbrance & Land Title Scrutiny',
    status: 'under_scrutiny',
    created_at: '2026-10-20T14:00:00Z',
    submitted_at: '2026-10-21T16:30:00Z',
    open_findings_count: 1,
    highest_severity: 'medium',
  },
  {
    id: 'APP-2026-7291',
    institution_id: 'INST-AICTE-5509',
    category: 'Campus Infrastructure: Built-up Area FSI & Structural Certificate',
    status: 'submitted',
    created_at: '2026-10-20T08:15:00Z',
    submitted_at: '2026-10-21T10:00:00Z',
    open_findings_count: 0,
    highest_severity: 'low',
  },
];

export const INITIAL_DOCUMENTS: DocumentMeta[] = [
  {
    id: 'doc-land-8810',
    application_id: 'APP-2026-8810',
    doc_type: 'Land Ownership / Lease Deed',
    filename: 'apex_land_deed_2026.pdf',
    sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    uploaded_at: '2026-10-18T10:12:00Z',
  },
  {
    id: 'doc-fire-8810',
    application_id: 'APP-2026-8810',
    doc_type: 'Fire & Safety Certificate',
    filename: 'fire_safety_noc_dated_2023.pdf',
    sha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
    uploaded_at: '2026-10-18T10:15:00Z',
  },
  {
    id: 'doc-fac-8810',
    application_id: 'APP-2026-8810',
    doc_type: 'Faculty Cadre & Salary Declaration',
    filename: 'faculty_cadre_form16_summary.pdf',
    sha256: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
    uploaded_at: '2026-10-18T10:22:00Z',
  },
  {
    id: 'doc-plan-8810',
    application_id: 'APP-2026-8810',
    doc_type: 'Approved Building Floor Plan',
    filename: 'master_campus_floorplan_v2.pdf',
    sha256: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
    uploaded_at: '2026-10-18T10:30:00Z',
  },
];

export const INITIAL_FINDINGS: Finding[] = [
  {
    id: 'fnd-8810-01',
    application_id: 'APP-2026-8810',
    document_id: 'doc-fire-8810',
    field: 'validity_expiry_date',
    rule_id: 'AICTE-2026-NOC-FIRE',
    rule_version: 'v2.1',
    reason: 'Document expiry date indicates certificate expired on 31-Aug-2025. Mandatory valid NOC required.',
    evidence_ref: 'Page 1, Paragraph 3: "Valid for 12 months up to August 31, 2025"',
    evidence_page: 1,
    evidence_bbox: [0.22, 0.12, 0.38, 0.88], // [ymin, xmin, ymax, xmax] normalized 0-1
    severity: 'high',
    confidence: 0.96,
    status: 'open',
    manual_review_required: true,
    created_at: '2026-10-19T14:22:10Z',
  },
  {
    id: 'fnd-8810-02',
    application_id: 'APP-2026-8810',
    document_id: 'doc-fac-8810',
    field: 'assistant_prof_cadre_ratio',
    rule_id: 'AICTE-2026-FAC-RATIO',
    rule_version: 'v1.4',
    reason: 'Calculated cadre ratio of 1:2:7 deviates from standard handbook norms (1:2:6). Verification note needed.',
    evidence_ref: 'Page 4, Table 2.B (Faculty count vs sanctioned intake matrix)',
    // Note: No evidence_bbox provided for fnd-8810-02; viewer will show text-only reference
    severity: 'medium',
    confidence: 0.89,
    status: 'open',
    manual_review_required: false,
    created_at: '2026-10-19T14:22:15Z',
  },
];

export const INITIAL_VERIFICATIONS: Verification[] = [
  {
    id: 'ver-8810-01',
    document_id: 'doc-land-8810',
    method: 'Digital Registry Lookup',
    source: 'State Land Records & Revenue Portal (Bhoomi)',
    status: 'verified',
    compared: {
      survey_number: 'Match (42/1B)',
      registered_owner: 'Match (Apex Educational Trust)',
      encumbrance_status: 'Free of encumbrance',
    },
    checked_at: '2026-10-19T14:25:00Z',
  },
  {
    id: 'ver-8810-02',
    document_id: 'doc-fire-8810',
    method: 'State Safety Portal Query',
    source: 'Fire & Emergency Services Portal',
    status: 'failed',
    compared: {
      noc_id: 'FIRE-2023-WB-9912',
      registered_expiry: '2025-08-31',
      renewal_filed: 'No renewal record found',
    },
    checked_at: '2026-10-19T14:26:00Z',
  },
  {
    id: 'ver-8810-03',
    document_id: 'doc-plan-8810',
    method: 'Municipal Archive Verification',
    source: 'Urban Development Authority (UDD)',
    status: 'inconclusive',
    compared: {
      reason: 'Regional registry API currently undergoing scheduled migration',
      retry_allowed: true,
    },
    checked_at: '2026-10-19T14:27:00Z',
  },
  {
    id: 'ver-8810-04',
    document_id: 'doc-tax-8810',
    method: 'Direct Tax Assessment Verification',
    source: 'Income Tax Department (e-Filing API)',
    status: 'pending',
    compared: {
      pan_tan: 'AAAAA0000A',
      queue_position: 'In queue for batch reconciliation',
    },
    checked_at: '2026-10-19T14:28:00Z',
  },
  {
    id: 'ver-8810-05',
    document_id: 'doc-affil-8810',
    method: 'Affiliation Directorate Cross-Check',
    source: 'State Technical University Registrar',
    status: 'manual_required',
    compared: {
      university_code: 'WB-UT-009',
      provisional_order_no: 'PO/2026/881',
      verification_note: 'Physical seal verification required by regional scrutinizer',
    },
    checked_at: '2026-10-19T14:29:00Z',
  },
  {
    id: 'ver-8810-06',
    document_id: 'doc-env-8810',
    method: 'Pollution Control Exemption Schedule',
    source: 'State Pollution Control Board (SPCB)',
    status: 'exempt',
    compared: {
      exemption_category: 'Non-polluting Educational Establishment (Green Category)',
      gazette_order: 'SO-1998/SPCB-EN-09',
    },
    checked_at: '2026-10-19T14:30:00Z',
  },
];

export const INITIAL_ALERTS: Alert[] = [
  {
    id: 'alt-01',
    type: 'rectification_due',
    object_ref: 'APP-2026-9044',
    message: 'Rectification deadline approaching: Submit missing financial audit report within 4 days.',
    created_at: '2026-10-21T09:00:00Z',
  },
  {
    id: 'alt-02',
    type: 'finding_flagged',
    object_ref: 'APP-2026-8810',
    message: 'Pre-check completed with 2 findings flagged for document review.',
    created_at: '2026-10-19T14:23:00Z',
  },
];

export const INITIAL_CHECKLISTS: Checklist[] = [
  {
    id: 'chk-tech-deg-2026',
    category: 'Technical Degree (Engineering & Technology)',
    version: 1,
    active: true,
    rules: [
      {
        id: 'REG-2026-LND-01',
        rule_type: 'land_area_minimum',
        source_ref: 'Statutory Handbook 2026-27 Chapter 1, Section 1.3',
        severity: 'high',
      },
      {
        id: 'REG-2026-NOC-FIRE',
        rule_type: 'fire_safety_validity',
        source_ref: 'Statutory Handbook 2026-27 Chapter 2, Clause 2.1',
        severity: 'high',
      },
      {
        id: 'REG-2026-FAC-RATIO',
        rule_type: 'cadre_ratio_check',
        source_ref: 'Statutory Handbook 2026-27 Appendix 7, Table 7.1',
        severity: 'medium',
      },
    ],
  },
];

export const INITIAL_AUDIT_LOG: AuditEntry[] = [
  {
    id: 'aud-001',
    actor_id: 'usr_app_01',
    role: 'applicant',
    action: 'application.create',
    object_ref: 'APP-2026-8810',
    summary: 'Created new Technical Degree application',
    request_id: 'req_init_001',
    created_at: '2026-10-18T09:30:00Z',
  },
  {
    id: 'aud-002',
    actor_id: 'usr_app_01',
    role: 'applicant',
    action: 'application.submit',
    object_ref: 'APP-2026-8810',
    summary: 'Submitted application for regulatory scrutiny',
    request_id: 'req_init_002',
    created_at: '2026-10-19T14:20:00Z',
  },
];

export const JOBS_STORE: Map<string, Job> = new Map();
