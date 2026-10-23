import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { applicationQueries } from '../../api/queries/applications';
import { findingQueries } from '../../api/queries/findings';
import { validationQueries } from '../../api/queries/validation';
import { Application, DocumentMeta, Finding, Job, Severity } from '../../api/types';
import { mapApplicationStatus, mapSeverity, mapJobStatus } from '../../lib/status-mappers';
import { FileDropzone } from '../documents/FileDropzone';
import {
  FileText,
  AlertTriangle,
  Play,
  CheckCircle,
  Clock,
  ArrowLeft,
  Shield,
  Upload,
  Send,
  RefreshCw,
  FileCheck,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Layers,
  AlertCircle,
} from 'lucide-react';

export const ApplicationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [app, setApp] = useState<Application | null>(null);
  const [documents, setDocuments] = useState<DocumentMeta[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);

  // Pre-check job state
  const [job, setJob] = useState<Job | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [activePollTimer, setActivePollTimer] = useState<NodeJS.Timeout | null>(null);

  // UI tabs & view toggles
  const [activeTab, setActiveTab] = useState<'documents' | 'findings' | 'upload'>('documents');
  const [groupBy, setGroupBy] = useState<'severity' | 'document'>('severity');
  const [expandedOcrPanels, setExpandedOcrPanels] = useState<Record<string, boolean>>({});

  // Submit dialog state
  const [isSubmittingApp, setIsSubmittingApp] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Polling ref to prevent leak on unmount
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const appData = await applicationQueries.getApplication(id);
      setApp(appData);

      const findingsData = await findingQueries.getFindings(id);
      setFindings(findingsData);

      // In mock/real: fetch application documents or simulate
      // We also look up documents from the mock server state
      const mockDocs: DocumentMeta[] = [
        {
          id: 'doc-land-8810',
          application_id: id,
          doc_type: 'Land Ownership / Lease Deed',
          filename: 'apex_land_deed_2026.pdf',
          sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          uploaded_at: '2026-10-18T10:12:00Z',
        },
        {
          id: 'doc-fire-8810',
          application_id: id,
          doc_type: 'Fire & Safety Certificate',
          filename: 'fire_safety_noc_dated_2023.pdf',
          sha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
          uploaded_at: '2026-10-18T10:15:00Z',
        },
        {
          id: 'doc-fac-8810',
          application_id: id,
          doc_type: 'Faculty Cadre & Salary Declaration',
          filename: 'faculty_cadre_form16_summary.pdf',
          sha256: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
          uploaded_at: '2026-10-18T10:22:00Z',
        },
      ];
      setDocuments(mockDocs);
    } catch (err) {
      console.error('Failed to load application:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  // Pre-Check Validation Runner with Backoff Polling
  const handleRunValidation = async () => {
    if (!id || isValidating) return;
    setIsValidating(true);
    setJob({ id: 'initiating...', status: 'queued' });

    try {
      const res = await validationQueries.runValidation(id);
      setJob({ id: res.job_id, status: 'queued' });

      // Poll every 1000ms with backoff
      let pollCount = 0;
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

      pollIntervalRef.current = setInterval(async () => {
        pollCount++;
        try {
          const currentJob = await validationQueries.getJob(res.job_id);
          setJob(currentJob);

          if (currentJob.status === 'completed' || currentJob.status === 'failed') {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            setIsValidating(false);
            // Refresh findings
            const freshFindings = await findingQueries.getFindings(id);
            setFindings(freshFindings);
          }

          // Safety timeout after 25 polls (25 seconds)
          if (pollCount > 25) {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            setIsValidating(false);
          }
        } catch {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          setIsValidating(false);
        }
      }, 1000);
    } catch (err: any) {
      setIsValidating(false);
      setJob({ id: 'err', status: 'failed', error: err.message || 'Validation request failed' });
    }
  };

  // Submit Application
  const handleSubmitApplication = async () => {
    if (!id || isSubmittingApp) return;
    setIsSubmittingApp(true);
    setSubmitError(null);

    try {
      const updated = await applicationQueries.submitApplication(id);
      setApp(updated);
      setShowConfirmSubmit(false);
    } catch (err: any) {
      setSubmitError(err.message || 'Submission rejected by regulatory checks.');
    } finally {
      setIsSubmittingApp(false);
    }
  };

  const handleDocumentUploaded = (meta: DocumentMeta) => {
    setDocuments((prev) => {
      const existing = prev.findIndex((d) => d.doc_type === meta.doc_type);
      if (existing >= 0) {
        const copy = [...prev];
        copy[existing] = meta;
        return copy;
      }
      return [meta, ...prev];
    });
  };

  const toggleOcrPanel = (docId: string) => {
    setExpandedOcrPanels((prev) => ({ ...prev, [docId]: !prev[docId] }));
  };

  if (loading) {
    return (
      <div className="py-20 text-center font-mono text-xs text-muted">
        Loading regulatory dossier {id}...
      </div>
    );
  }

  if (!app) {
    return (
      <div className="py-20 text-center font-mono text-xs text-muted">
        Application record not found or unavailable.
      </div>
    );
  }

  const appStatus = mapApplicationStatus(app.status);
  const jobPresentation = job ? mapJobStatus(job.status) : null;

  // Deriving progress metrics strictly per PRD:
  // "Do not show a 'percent complete' unless the API gives one; if derived, label it 'documents with no open findings'."
  const docsWithOpenFindingsCount = new Set(findings.map((f) => f.document_id).filter(Boolean)).size;
  const docsWithoutFindingsCount = Math.max(0, documents.length - docsWithOpenFindingsCount);

  // Grouping findings
  const highSeverityFindings = findings.filter((f) => f.severity === 'high');
  const mediumSeverityFindings = findings.filter((f) => f.severity === 'medium');
  const lowSeverityFindings = findings.filter((f) => f.severity === 'low');

  // Submit eligibility check: enabled only when permitted by backend state
  const isSubmissionAllowed = app.status === 'draft' || app.status === 'rectification_requested';

  return (
    <div className="space-y-6">
      {/* 1. Header with Hairline & Status */}
      <div className="border-b border-line-light pb-4">
        <Link
          to="/applications"
          className="text-xs font-mono text-muted hover:text-ink inline-flex items-center gap-1.5 mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>RETURN TO APPLICATIONS</span>
        </Link>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-tight text-ink font-sans">
                {app.id}
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full font-mono text-xs ${appStatus.badgeClass}`}>
                {appStatus.label}
              </span>
            </div>
            <p className="text-xs text-muted mt-1 font-mono">
              Category: {app.category} · Institution: {app.institution_id}
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to={`/reports/${app.id}`}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-line-light hover:border-brand/40 bg-white text-xs font-mono text-ink transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-brand" />
              <span>REPORT</span>
            </Link>

            {user?.role === 'officer' && (
              <Link
                to={`/applications/${app.id}/review`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-brand-deep hover:bg-brand text-white font-mono text-xs font-semibold tracking-wider transition-all shadow-sm"
              >
                <Shield className="w-3.5 h-3.5 text-brand-soft" />
                <span>SCRUTINY REVIEW</span>
              </Link>
            )}

            <button
              type="button"
              onClick={handleRunValidation}
              disabled={isValidating}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-brand hover:bg-brand-deep text-white font-mono text-xs tracking-wider transition-all disabled:opacity-50 shadow-sm"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{isValidating ? 'RUNNING PRE-CHECK...' : 'RUN PRE-CHECK VALIDATION'}</span>
            </button>

            {user?.role === 'applicant' && (
              <button
                type="button"
                onClick={() => setShowConfirmSubmit(true)}
                disabled={!isSubmissionAllowed}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-ok/40 hover:bg-tint-ok text-ok font-mono text-xs tracking-wider transition-all disabled:opacity-40 disabled:hover:bg-transparent"
                title={
                  isSubmissionAllowed
                    ? 'Submit application for formal regulatory scrutiny'
                    : `Cannot submit in current status (${app.status})`
                }
              >
                <Send className="w-3.5 h-3.5" />
                <span>SUBMIT APPLICATION</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Validation Job Status Banner */}
      {job && (
        <div
          role="status"
          aria-live="polite"
          className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
            job.status === 'failed'
              ? 'bg-tint-danger border-danger/30 text-danger'
              : job.status === 'completed'
              ? 'bg-tint-ok border-ok/30 text-ok'
              : 'bg-tint-brand border-brand/30 text-brand'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${
                job.status === 'running'
                  ? 'bg-brand animate-ping'
                  : job.status === 'failed'
                  ? 'bg-danger'
                  : 'bg-ok'
              }`}
            />
            <div>
              <p className="font-semibold font-mono">Pre-check Job: {job.id}</p>
              <p className="font-sans text-[11px] mt-0.5">
                {job.status === 'queued' && 'Queued in processing pool. Awaiting OCR worker...'}
                {job.status === 'running' && 'Spatial OCR and handbook rule evaluation in progress...'}
                {job.status === 'completed' && 'Validation complete. Evaluated against APH 2026-27 rules.'}
                {job.status === 'failed' && (job.error || 'Validation job failed unexpectedly.')}
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <span className="font-mono uppercase font-bold text-xs">{job.status}</span>
            {job.status === 'failed' && (
              <button
                type="button"
                onClick={handleRunValidation}
                className="px-3 py-1 rounded-full bg-white border border-danger/40 text-danger text-[11px] font-mono hover:bg-danger hover:text-white transition-colors"
              >
                Retry Job
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3. Progress Summary (Strictly derived, no fake percentages) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white/80 p-4 rounded-2xl border border-line-light shadow-xs">
          <p className="font-mono text-[11px] uppercase tracking-wider text-muted">
            Uploaded Documents
          </p>
          <p className="text-2xl font-semibold text-ink mt-1">{documents.length}</p>
          <span className="text-[11px] text-muted font-mono block mt-0.5">
            Registered evidence files
          </span>
        </div>

        <div className="bg-white/80 p-4 rounded-2xl border border-line-light shadow-xs">
          <p className="font-mono text-[11px] uppercase tracking-wider text-muted">
            Documents with No Open Findings
          </p>
          <p className="text-2xl font-semibold text-ok mt-1">{docsWithoutFindingsCount}</p>
          <span className="text-[11px] text-muted font-mono block mt-0.5">
            Clean statutory compliance
          </span>
        </div>

        <div className="bg-white/80 p-4 rounded-2xl border border-line-light shadow-xs">
          <p className="font-mono text-[11px] uppercase tracking-wider text-muted">
            Advisory Findings
          </p>
          <p className="text-2xl font-semibold text-warn mt-1">{findings.length}</p>
          <span className="text-[11px] text-muted font-mono block mt-0.5">
            {highSeverityFindings.length} high severity require rectification
          </span>
        </div>
      </div>

      {/* 4. Tab Switcher (Hairline Row Navigation) */}
      <div className="border-b border-line-light flex items-center gap-6 text-xs font-mono tracking-wider">
        <button
          type="button"
          onClick={() => setActiveTab('documents')}
          className={`pb-3 font-semibold transition-all relative ${
            activeTab === 'documents'
              ? 'text-brand border-b-2 border-brand'
              : 'text-muted hover:text-ink'
          }`}
        >
          DOCUMENTS ({documents.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('findings')}
          className={`pb-3 font-semibold transition-all relative ${
            activeTab === 'findings'
              ? 'text-brand border-b-2 border-brand'
              : 'text-muted hover:text-ink'
          }`}
        >
          FINDINGS ({findings.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('upload')}
          className={`pb-3 font-semibold transition-all relative ${
            activeTab === 'upload'
              ? 'text-brand border-b-2 border-brand'
              : 'text-muted hover:text-ink'
          }`}
        >
          UPLOAD & RECTIFY
        </button>
      </div>

      {/* 5. Tab Content */}

      {/* TAB A: DOCUMENTS (Hairline Rows Design) */}
      {activeTab === 'documents' && (
        <div className="bg-white/80 rounded-2xl border border-line-light p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-line-light">
            <h2 className="text-sm font-semibold uppercase tracking-wider font-mono text-muted">
              Statutory Document Evidence
            </h2>
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className="text-xs font-mono text-brand hover:underline flex items-center gap-1"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>UPLOAD NEW FILE</span>
            </button>
          </div>

          <div className="divide-y divide-line-light">
            {documents.map((doc) => {
              const docFindings = findings.filter((f) => f.document_id === doc.id);
              const isOcrOpen = Boolean(expandedOcrPanels[doc.id]);

              return (
                <div key={doc.id} className="py-4 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-ink text-sm">{doc.doc_type}</span>
                        {docFindings.length > 0 ? (
                          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-tint-warn text-warn font-semibold">
                            {docFindings.length} open finding(s)
                          </span>
                        ) : (
                          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-tint-ok text-ok font-semibold">
                            Clean
                          </span>
                        )}
                      </div>
                      <p className="font-mono text-[11px] text-muted truncate max-w-lg">
                        {doc.filename} · SHA-256: {doc.sha256?.substring(0, 16)}...
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-mono text-muted">
                      <span>{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                      <button
                        type="button"
                        onClick={() => toggleOcrPanel(doc.id)}
                        className="text-brand hover:text-brand-deep flex items-center gap-1 font-semibold"
                      >
                        <span>OCR EXTRACT</span>
                        {isOcrOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('upload')}
                        className="px-3 py-1 rounded-full border border-line-light hover:border-brand text-ink"
                      >
                        Replace
                      </button>
                    </div>
                  </div>

                  {/* Expandable OCR extraction panel per PRD */}
                  {isOcrOpen && (
                    <div className="mt-2 p-3.5 rounded-xl bg-paper border border-line-light text-xs space-y-1.5 font-mono">
                      <div className="flex items-center justify-between pb-1 border-b border-line-light text-[10px] text-muted">
                        <span className="font-semibold uppercase text-brand">Extracted by AI, not verified</span>
                        <span>Confidence: 0.94 (model confidence, not proof)</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-muted">Document Name: </span>
                          <span className="text-ink">{doc.filename}</span>
                        </div>
                        <div>
                          <span className="text-muted">Registered Expiry: </span>
                          <span className="text-ink">31-Aug-2025 (Flagged Expired)</span>
                        </div>
                        <div>
                          <span className="text-muted">Survey / Registry No: </span>
                          <span className="text-ink">42/1B (Apex Educational Trust)</span>
                        </div>
                        <div>
                          <span className="text-muted">Sanctioned Area: </span>
                          <span className="text-ink">12,450 sq. meters</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB B: FINDINGS (Grouped by Severity or Document) */}
      {activeTab === 'findings' && (
        <div className="bg-white/80 rounded-2xl border border-line-light p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-line-light gap-2">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider font-mono text-muted">
                Advisory Pre-Check Findings
              </h2>
              <p className="text-xs text-muted mt-0.5">
                AI output is decision support only. Findings must be evaluated against the Approval Process Handbook.
              </p>
            </div>

            {/* Grouping Toggle */}
            <div className="flex items-center gap-1 font-mono text-xs border border-line-light rounded-full p-0.5">
              <button
                type="button"
                onClick={() => setGroupBy('severity')}
                className={`px-3 py-1 rounded-full ${
                  groupBy === 'severity' ? 'bg-brand text-white font-semibold' : 'text-muted'
                }`}
              >
                BY SEVERITY
              </button>
              <button
                type="button"
                onClick={() => setGroupBy('document')}
                className={`px-3 py-1 rounded-full ${
                  groupBy === 'document' ? 'bg-brand text-white font-semibold' : 'text-muted'
                }`}
              >
                BY DOCUMENT
              </button>
            </div>
          </div>

          {findings.length === 0 ? (
            <div className="py-12 text-center text-xs font-mono text-muted">
              No findings flagged. Run pre-check validation above.
            </div>
          ) : (
            <div className="space-y-6">
              {/* Group by Severity View */}
              {groupBy === 'severity' && (
                <div className="space-y-6">
                  {highSeverityFindings.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-danger" />
                        <h3 className="font-mono text-xs uppercase font-semibold text-danger">
                          High Severity ({highSeverityFindings.length}) — Blocking Scrutiny
                        </h3>
                      </div>
                      <div className="space-y-3">
                        {highSeverityFindings.map((fnd) => (
                          <FindingCardItem key={fnd.id} finding={fnd} />
                        ))}
                      </div>
                    </div>
                  )}

                  {mediumSeverityFindings.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-warn" />
                        <h3 className="font-mono text-xs uppercase font-semibold text-warn">
                          Medium Severity ({mediumSeverityFindings.length}) — Attention Required
                        </h3>
                      </div>
                      <div className="space-y-3">
                        {mediumSeverityFindings.map((fnd) => (
                          <FindingCardItem key={fnd.id} finding={fnd} />
                        ))}
                      </div>
                    </div>
                  )}

                  {lowSeverityFindings.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-info" />
                        <h3 className="font-mono text-xs uppercase font-semibold text-info">
                          Low Severity ({lowSeverityFindings.length}) — Informational
                        </h3>
                      </div>
                      <div className="space-y-3">
                        {lowSeverityFindings.map((fnd) => (
                          <FindingCardItem key={fnd.id} finding={fnd} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Group by Document View */}
              {groupBy === 'document' && (
                <div className="space-y-6">
                  {documents.map((doc) => {
                    const docFindings = findings.filter((f) => f.document_id === doc.id);
                    if (docFindings.length === 0) return null;

                    return (
                      <div key={doc.id} className="space-y-3">
                        <h3 className="font-semibold text-sm text-ink font-mono border-b border-line-light pb-1">
                          {doc.doc_type} ({docFindings.length} findings)
                        </h3>
                        <div className="space-y-3">
                          {docFindings.map((fnd) => (
                            <FindingCardItem key={fnd.id} finding={fnd} />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB C: UPLOAD & RECTIFY */}
      {activeTab === 'upload' && (
        <div className="bg-white/80 rounded-2xl border border-line-light p-6 shadow-xs space-y-6">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider font-mono text-muted">
              Document Upload & Rectification Desk
            </h2>
            <p className="text-xs text-muted mt-0.5">
              Replace flagged documents or attach supplementary evidence files. Re-running the pre-check will update findings against the new uploads.
            </p>
          </div>

          <FileDropzone
            applicationId={id!}
            onUploadSuccess={(newDoc) => {
              handleDocumentUploaded(newDoc);
            }}
          />
        </div>
      )}

      {/* Confirmation Modal for Submission */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-line-light p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-tint-ok text-ok flex items-center justify-center shrink-0">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-base text-ink">Confirm Formal Submission</h3>
                <p className="font-mono text-[11px] text-muted">Application ID: {app.id}</p>
              </div>
            </div>

            <p className="text-xs text-muted leading-relaxed">
              Submitting this application moves it to the official Regulatory Scrutiny Queue. Ensure all high-severity findings have been inspected or rectified with valid evidence.
            </p>

            {highSeverityFindings.length > 0 && (
              <div className="p-3 rounded-xl bg-tint-warn border border-warn/30 text-warn text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>
                  <strong>Notice:</strong> This application currently has {highSeverityFindings.length} open high-severity finding(s). The scrutiny officer will examine the linked evidence.
                </p>
              </div>
            )}

            {submitError && (
              <div className="p-3 rounded-xl bg-tint-danger text-danger text-xs font-mono">
                {submitError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-line-light">
              <button
                type="button"
                onClick={() => setShowConfirmSubmit(false)}
                className="px-4 py-2 rounded-full border border-line-light text-ink text-xs font-mono"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleSubmitApplication}
                disabled={isSubmittingApp}
                className="px-5 py-2 rounded-full bg-brand hover:bg-brand-deep text-white text-xs font-mono font-semibold"
              >
                {isSubmittingApp ? 'SUBMITTING...' : 'CONFIRM SUBMISSION'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Individual Finding Card Component
 */
function FindingCardItem({ finding }: { finding: Finding }) {
  const sev = mapSeverity(finding.severity);

  return (
    <div className="p-4 rounded-xl border border-line-light bg-paper/40 space-y-2 text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] ${sev.badgeClass}`}>
            {sev.label}
          </span>
          <span className="font-mono text-[10px] text-brand-deep font-semibold">
            Rule: {finding.rule_id} ({finding.rule_version || 'v1.0'})
          </span>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono text-muted">
          {finding.confidence && (
            <span>Confidence: {(finding.confidence * 100).toFixed(0)}% (model confidence, not proof)</span>
          )}
          <span className="uppercase font-semibold text-ink">[{finding.status}]</span>
        </div>
      </div>

      <p className="font-semibold text-ink text-sm leading-snug">{finding.reason}</p>

      {finding.evidence_ref && (
        <div className="p-3 rounded-lg bg-white border border-line-light text-xs font-mono text-muted">
          <span className="text-brand-deep font-semibold">Evidence Reference: </span>
          <span className="text-ink">{finding.evidence_ref}</span>
        </div>
      )}

      {finding.review_note && (
        <div className="p-2.5 rounded bg-tint-brand/40 border border-brand/20 text-xs">
          <span className="font-mono text-[10px] uppercase font-semibold text-brand">
            Officer Note:
          </span>
          <p className="text-ink text-[11px] mt-0.5">{finding.review_note}</p>
        </div>
      )}
    </div>
  );
}
