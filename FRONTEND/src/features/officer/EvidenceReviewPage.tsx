import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { applicationQueries } from '../../api/queries/applications';
import { findingQueries } from '../../api/queries/findings';
import { documentQueries } from '../../api/queries/documents';
import { Application, DocumentMeta, Finding } from '../../api/types';
import { mapApplicationStatus } from '../../lib/status-mappers';
import { EvidenceViewer } from '../../components/findings/EvidenceViewer';
import { ConfirmDecisionDialog } from '../../components/officer/ConfirmDecisionDialog';
import {
  ArrowLeft,
  ShieldCheck,
  FileCheck,
  FileText,
  AlertCircle,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';

export const EvidenceReviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isOfficer = user?.role === 'officer';

  const [app, setApp] = useState<Application | null>(null);
  const [documents, setDocuments] = useState<DocumentMeta[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Decision Dialog state (strictly officer-only)
  const [isDecisionOpen, setIsDecisionOpen] = useState<boolean>(false);
  const [decisionSuccessMsg, setDecisionSuccessMsg] = useState<string | null>(null);

  const loadAll = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const [appData, findingsData, docsData] = await Promise.all([
        applicationQueries.getApplication(id),
        findingQueries.getFindings(id),
        documentQueries.getDocuments(id).catch(() => []),
      ]);

      setApp(appData);
      setFindings(findingsData);
      setDocuments(docsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load application evidence');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [id]);

  const handleFindingReviewed = (updated: Finding) => {
    setFindings((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
  };

  const handleDecisionRecorded = (res: { decision: string; status: string }) => {
    setDecisionSuccessMsg(`Decision '${res.decision}' recorded successfully. Status updated.`);
    if (app) {
      setApp({ ...app, status: res.status as any });
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center font-mono text-xs text-muted">
        Loading evidence workspace...
      </div>
    );
  }

  if (error || !app) {
    return (
      <div className="p-6 rounded-2xl bg-tint-danger border border-danger/30 text-danger text-xs font-mono space-y-3">
        <p className="font-semibold">Error Loading Application Evidence</p>
        <p>{error || 'Application not found.'}</p>
        <Link
          to="/officer/queue"
          className="inline-flex items-center gap-1 text-brand-deep font-semibold underline"
        >
          Return to Scrutiny Queue
        </Link>
      </div>
    );
  }

  const status = mapApplicationStatus(app.status);

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Metadata Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-line-light pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-muted mb-1">
            <Link to="/officer/queue" className="hover:text-ink flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Scrutiny Queue</span>
            </Link>
            <span>/</span>
            <span className="text-ink font-semibold">{app.id}</span>
            <span>/</span>
            <span className="text-brand uppercase font-semibold">Evidence Review</span>
          </div>

          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-ink font-sans">
              Evidence Evaluation & Scrutiny
            </h1>
            <span className={`px-2.5 py-0.5 rounded-full font-mono text-xs ${status.badgeClass}`}>
              {status.label}
            </span>
          </div>

          <p className="text-xs text-muted mt-1 font-mono">
            Institution: {app.institution_id} &bull; Category: {app.category} &bull; Open Flags:{' '}
            {findings.filter((f) => f.status === 'open').length}
          </p>
        </div>

        {/* Action Buttons: Decision Dialog is STRICTLY visible to Officer only! */}
        <div className="flex items-center gap-3">
          <Link
            to={`/reports/${app.id}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-line-light hover:border-brand/40 bg-white text-xs font-mono text-ink transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-brand" />
            <span>SCRUTINY REPORT</span>
          </Link>

          {isOfficer && (
            <button
              type="button"
              data-testid="open-decision-dialog-btn"
              onClick={() => setIsDecisionOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-brand-deep hover:bg-brand text-white text-xs font-mono font-semibold tracking-wider transition-all shadow-sm"
            >
              <ShieldCheck className="w-4 h-4 text-brand-soft" />
              <span>RECORD FINAL DECISION</span>
            </button>
          )}
        </div>
      </div>

      {decisionSuccessMsg && (
        <div
          role="status"
          className="p-4 rounded-xl bg-tint-ok border border-ok/30 text-ok text-xs font-mono flex items-center justify-between"
        >
          <span>{decisionSuccessMsg}</span>
          <Link
            to={`/reports/${app.id}`}
            className="underline font-semibold hover:text-brand-deep"
          >
            View Official Report &rarr;
          </Link>
        </div>
      )}

      {/* Two-Pane Evidence Viewer */}
      <EvidenceViewer
        applicationId={app.id}
        findings={findings}
        documents={documents}
        onFindingReviewed={handleFindingReviewed}
        readOnly={!isOfficer}
      />

      {/* Final Decision Modal (Officer Only) */}
      {isOfficer && (
        <ConfirmDecisionDialog
          applicationId={app.id}
          isOpen={isDecisionOpen}
          onClose={() => setIsDecisionOpen(false)}
          onSuccess={handleDecisionRecorded}
        />
      )}
    </div>
  );
};
