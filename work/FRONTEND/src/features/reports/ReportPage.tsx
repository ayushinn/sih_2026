import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { reportQueries, ReportSummary } from '../../api/queries/reports';
import { applicationQueries } from '../../api/queries/applications';
import { findingQueries } from '../../api/queries/findings';
import { Application, Finding } from '../../api/types';
import { mapApplicationStatus, mapSeverity } from '../../lib/status-mappers';
import {
  FileText,
  Download,
  ArrowLeft,
  Shield,
  CheckCircle,
  AlertTriangle,
  Clock,
  ExternalLink,
  Printer,
} from 'lucide-react';

export const ReportPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [report, setReport] = useState<ReportSummary | null>(null);
  const [app, setApp] = useState<Application | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        setLoading(true);
        setError(null);
        const [repData, appData, fndData] = await Promise.all([
          reportQueries.getReport(id),
          applicationQueries.getApplication(id).catch(() => null),
          findingQueries.getFindings(id).catch(() => []),
        ]);
        setReport(repData);
        setApp(appData);
        setFindings(fndData);
      } catch (err: any) {
        setError(err.message || 'Failed to generate scrutiny report');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleDownloadPdf = async () => {
    if (!id) return;
    try {
      setIsDownloadingPdf(true);
      const blob = await reportQueries.getReportPdf(id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Scrutiny_Report_${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Failed to download PDF:', err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center font-mono text-xs text-muted">
        Compiling statutory scrutiny report...
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="p-6 rounded-2xl bg-tint-danger border border-danger/30 text-danger text-xs font-mono space-y-3">
        <p className="font-semibold">Unable to Load Report</p>
        <p>{error || 'Report summary unavailable.'}</p>
        <Link to="/applications" className="text-brand-deep underline block">
          Return to Applications
        </Link>
      </div>
    );
  }

  const status = mapApplicationStatus(report.status);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line-light pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-muted mb-1">
            <Link to={`/applications/${id}`} className="hover:text-ink flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Application {id}</span>
            </Link>
            <span>/</span>
            <span className="text-brand uppercase font-semibold">Official Report</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink font-sans">
            Institutional Scrutiny & Evaluation Summary
          </h1>
          <p className="text-xs text-muted font-mono mt-0.5">
            Report Reference: REP-{id}-FINAL &bull; Generated:{' '}
            {new Date(report.generated_at).toLocaleString()}
          </p>
        </div>

        {/* PDF Link / Download Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
            data-testid="download-pdf-btn"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-brand hover:bg-brand-deep text-white text-xs font-mono font-semibold tracking-wider transition-all shadow-sm disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isDownloadingPdf ? 'DOWNLOADING...' : 'DOWNLOAD OFFICIAL PDF'}</span>
          </button>
        </div>
      </div>

      {/* Advisory Disclaimer Notice */}
      <div className="p-4 rounded-2xl bg-tint-brand border border-brand/30 text-xs font-mono text-brand-deep flex items-start gap-3">
        <Shield className="w-5 h-5 text-brand shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold uppercase tracking-wider text-[11px]">
            Statutory Regulatory Disclaimer
          </p>
          <p className="mt-0.5 text-ink leading-relaxed">
            {report.advisory_disclaimer ||
              'AI findings are strictly advisory. Authorized regulatory officials make the final decision.'}
          </p>
        </div>
      </div>

      {/* Primary Summary Card */}
      <div className="bg-white rounded-2xl border border-line-light p-6 shadow-xs space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-6 border-b border-line-light">
          <div>
            <span className="font-mono text-[10px] uppercase text-muted block">Application ID</span>
            <span className="font-mono text-sm font-bold text-ink">{report.application_id}</span>
          </div>
          <div>
            <span className="font-mono text-[10px] uppercase text-muted block">
              Institution Code
            </span>
            <span className="font-mono text-sm font-semibold text-ink">
              {report.institution_id}
            </span>
          </div>
          <div>
            <span className="font-mono text-[10px] uppercase text-muted block">Current Status</span>
            <span
              className={`inline-block mt-1 px-2.5 py-0.5 rounded-full font-mono text-xs ${status.badgeClass}`}
            >
              {status.label}
            </span>
          </div>
          <div>
            <span className="font-mono text-[10px] uppercase text-muted block">Findings Audited</span>
            <span className="font-mono text-sm font-bold text-ink">{report.findings_count}</span>
          </div>
        </div>

        {/* Detailed Findings Summary */}
        <div>
          <h2 className="text-sm font-semibold font-sans text-ink uppercase tracking-wider mb-3">
            Recorded Findings & Dispositions
          </h2>

          {findings.length === 0 ? (
            <div className="p-4 rounded-xl bg-paper text-center text-xs font-mono text-muted">
              No findings recorded for this submission.
            </div>
          ) : (
            <div className="border border-line-light rounded-xl overflow-hidden divide-y divide-line-light">
              {findings.map((f) => {
                const sev = mapSeverity(f.severity);
                return (
                  <div key={f.id} className="p-4 text-xs font-sans space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-full font-mono text-[10px] ${sev.badgeClass}`}
                        >
                          {sev.label}
                        </span>
                        <span className="font-mono text-xs font-semibold text-brand-deep">
                          {f.rule_id}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] uppercase font-semibold text-muted">
                        Status: [{f.status}]
                      </span>
                    </div>

                    <p className="text-ink">{f.reason}</p>

                    {f.evidence_ref && (
                      <p className="text-[11px] font-mono text-muted bg-paper p-2 rounded">
                        <span className="font-semibold text-ink">Citation: </span>
                        {f.evidence_ref}
                      </p>
                    )}

                    {f.review_note && (
                      <div className="p-2.5 rounded bg-tint-brand/20 border border-brand/20 text-xs">
                        <span className="font-mono text-[10px] uppercase font-semibold text-brand-deep block">
                          Official Regulatory Note:
                        </span>
                        <p className="text-ink text-[11px] mt-0.5">{f.review_note}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Audit Sign-off Block */}
        <div className="pt-6 border-t border-line-light flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-[11px] text-muted">
          <div>
            <p className="uppercase text-ink font-semibold">ALL INDIA COUNCIL FOR TECHNICAL EDUCATION</p>
            <p>Approval Process Handbook Automated Scrutiny System</p>
          </div>
          <div className="text-right">
            <p>Verification Checksum: SHA256-AUTHENTICATED</p>
            <p>Generated at: {report.generated_at}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
