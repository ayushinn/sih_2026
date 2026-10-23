import React, { useEffect, useState, useMemo } from 'react';
import { verificationQueries } from '../../api/queries/verifications';
import { Verification, VerificationStatus } from '../../api/types';
import { mapVerificationStatus } from '../../lib/status-mappers';
import { useAuth } from '../../context/AuthContext';
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  HelpCircle,
  FileCheck2,
  ExternalLink,
  Search,
  Filter,
  Check,
  X,
  ShieldCheck,
  RefreshCw,
  Info,
} from 'lucide-react';

const STATUTORY_STATUSES: { id: string; label: string; statusValue?: VerificationStatus }[] = [
  { id: 'all', label: 'All Records' },
  { id: 'verified', label: 'Verified', statusValue: 'verified' },
  { id: 'failed', label: 'Failed / Mismatch', statusValue: 'failed' },
  { id: 'inconclusive', label: 'Inconclusive', statusValue: 'inconclusive' },
  { id: 'pending', label: 'Pending', statusValue: 'pending' },
  { id: 'manual_required', label: 'Manual Required', statusValue: 'manual_required' },
  { id: 'exempt', label: 'Exempt', statusValue: 'exempt' },
];

export const VerifierPage: React.FC = () => {
  const { user } = useAuth();
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Manual Confirmation Modal state
  const [confirmTarget, setConfirmTarget] = useState<Verification | null>(null);
  const [confirmNotes, setConfirmNotes] = useState('');
  const [submittingConfirm, setSubmittingConfirm] = useState(false);
  const [confirmSuccessMessage, setConfirmSuccessMessage] = useState<string | null>(null);

  const isVerifier = user?.role === 'verifier';

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await verificationQueries.getVerifications();
      setVerifications(res);
    } catch (err: any) {
      console.error('Failed to load verifications:', err);
      setError(err?.message || 'Unable to retrieve verification stream from authority registries.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleManualConfirmSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmTarget) return;

    try {
      setSubmittingConfirm(true);
      const updated = await verificationQueries.manualConfirm(confirmTarget.id, {
        notes: confirmNotes.trim() || 'Verified by authorised scrutinizer via offline documentary proof.',
      });

      // Update local state with the confirmed verification
      setVerifications((prev) =>
        prev.map((v) => (v.id === updated.id ? { ...v, status: 'verified', compared: updated.compared } : v))
      );

      setConfirmSuccessMessage(
        `Verification record ${confirmTarget.id} manually confirmed and certified under APH norms.`
      );
      setConfirmTarget(null);
      setConfirmNotes('');
      setTimeout(() => setConfirmSuccessMessage(null), 6000);
    } catch (err: any) {
      console.error('Manual confirmation failed:', err);
      alert(err?.message || 'Failed to record manual confirmation.');
    } finally {
      setSubmittingConfirm(false);
    }
  };

  const filteredVerifications = useMemo(() => {
    return verifications.filter((v) => {
      // Status filter
      if (selectedStatus !== 'all') {
        const norm = v.status.toLowerCase();
        if (selectedStatus === 'failed') {
          if (norm !== 'failed' && norm !== 'mismatch_detected') return false;
        } else if (selectedStatus === 'inconclusive') {
          if (norm !== 'inconclusive' && norm !== 'source_unavailable') return false;
        } else if (selectedStatus === 'pending') {
          if (norm !== 'pending' && norm !== 'verification_pending') return false;
        } else if (selectedStatus === 'manual_required') {
          if (norm !== 'manual_required' && norm !== 'manual_review_required') return false;
        } else if (selectedStatus === 'exempt') {
          if (norm !== 'exempt' && norm !== 'expired') return false;
        } else if (norm !== selectedStatus) {
          return false;
        }
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesId = v.id.toLowerCase().includes(q);
        const matchesDoc = v.document_id.toLowerCase().includes(q);
        const matchesSource = v.source.toLowerCase().includes(q);
        const matchesMethod = v.method.toLowerCase().includes(q);
        if (!matchesId && !matchesDoc && !matchesSource && !matchesMethod) return false;
      }

      return true;
    });
  }, [verifications, selectedStatus, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header with regulatory context */}
      <div className="border-b border-line-light pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-muted">
            AUTHORITY INTEGRATION DESK · 6 STATUTORY STATES
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink font-sans mt-1">
            Issuer Verification Workspace
          </h1>
          <p className="text-xs text-muted mt-1 max-w-2xl">
            Live synchronization against state land registries, fire safety portals, and municipal directorates.
            Authorised verifiers may inspect compared field discrepancies and certify physical proofs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line-light bg-paper/60 text-xs font-mono text-ink hover:border-brand transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Feeds</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {confirmSuccessMessage && (
        <div
          role="status"
          aria-live="polite"
          className="p-4 rounded-xl border border-ok/30 bg-tint-ok text-ok text-xs font-mono flex items-center justify-between gap-3 shadow-xs"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-ok" />
            <span>{confirmSuccessMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setConfirmSuccessMessage(null)}
            className="text-ok hover:opacity-75"
            aria-label="Dismiss alert"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Status Filters */}
        <div className="flex flex-wrap items-center gap-1.5" role="toolbar" aria-label="Status filters">
          {STATUTORY_STATUSES.map((item) => {
            const isSelected = selectedStatus === item.id;
            const count =
              item.id === 'all'
                ? verifications.length
                : verifications.filter((v) => {
                    const norm = v.status.toLowerCase();
                    if (item.id === 'failed') return norm === 'failed' || norm === 'mismatch_detected';
                    if (item.id === 'inconclusive') return norm === 'inconclusive' || norm === 'source_unavailable';
                    if (item.id === 'pending') return norm === 'pending' || norm === 'verification_pending';
                    if (item.id === 'manual_required') return norm === 'manual_required' || norm === 'manual_review_required';
                    if (item.id === 'exempt') return norm === 'exempt' || norm === 'expired';
                    return norm === item.id;
                  }).length;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedStatus(item.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-mono transition-all flex items-center gap-1.5 border ${
                  isSelected
                    ? 'bg-ink text-paper border-ink shadow-xs font-semibold'
                    : 'bg-paper/80 text-muted border-line-light hover:border-ink/30'
                }`}
              >
                <span>{item.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-paper/20 text-paper' : 'bg-black/[0.05] text-muted'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search input */}
        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search source, doc ID, or method..."
            aria-label="Search verification records"
            className="w-full pl-9 pr-3 py-1.5 text-xs font-mono rounded-lg border border-line-light bg-paper/60 text-ink placeholder:text-muted/60 focus:outline-none focus:border-brand transition-colors"
          />
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div role="alert" className="p-4 rounded-xl border border-danger/30 bg-tint-danger text-danger text-xs font-mono">
          <p className="font-semibold">Unable to load verification records:</p>
          <p className="mt-1">{error}</p>
        </div>
      )}

      {/* Main Verification List */}
      <div className="bg-white/80 rounded-2xl border border-line-light shadow-xs divide-y divide-line-light overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs font-mono text-muted flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-brand" />
            <span>Polling authority registries and issuing databases...</span>
          </div>
        ) : filteredVerifications.length === 0 ? (
          <div className="py-16 text-center text-xs font-mono text-muted flex flex-col items-center justify-center gap-2">
            <Info className="w-5 h-5 text-muted/60" />
            <span>No verification records match your selected criteria.</span>
            {selectedStatus !== 'all' && (
              <button
                type="button"
                onClick={() => setSelectedStatus('all')}
                className="mt-2 text-brand hover:underline font-mono"
              >
                Clear status filters
              </button>
            )}
          </div>
        ) : (
          filteredVerifications.map((v) => {
            const status = mapVerificationStatus(v.status);
            const isManualCandidate =
              v.status === 'manual_required' ||
              v.status === 'manual_review_required' ||
              v.status === 'inconclusive' ||
              v.status === 'failed' ||
              v.status === 'mismatch_detected';

            return (
              <article
                key={v.id}
                className="p-5 hover:bg-paper/30 transition-colors space-y-4"
                aria-labelledby={`ver-title-${v.id}`}
              >
                {/* Top Hairline Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span
                      id={`ver-title-${v.id}`}
                      className="font-mono font-semibold text-brand-deep text-sm"
                    >
                      {v.id}
                    </span>
                    <span className="font-mono text-xs text-muted">
                      Doc: <strong className="text-ink">{v.document_id}</strong>
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] uppercase font-semibold border ${status.badgeClass}`}>
                      {status.label}
                    </span>
                  </div>

                  <div className="font-mono text-[11px] text-muted flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Checked: {new Date(v.checked_at).toLocaleString()}</span>
                  </div>
                </div>

                {/* Source & Method details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-paper/40 p-3 rounded-xl border border-line-light">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-muted">Issuing Authority Source</p>
                    <p className="font-medium text-ink mt-0.5">{v.source}</p>
                  </div>
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-muted">Query Protocol / Method</p>
                    <p className="font-mono text-muted mt-0.5">{v.method}</p>
                  </div>
                </div>

                {/* Compared Fields Inspector */}
                {v.compared && Object.keys(v.compared).length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-mono text-[11px] uppercase tracking-wider text-muted font-semibold">
                        Compared Fields & Registry Payload
                      </p>
                      <span className="font-mono text-[10px] text-muted">
                        {Object.keys(v.compared).length} parameters inspected
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {Object.entries(v.compared).map(([key, val]) => (
                        <div
                          key={key}
                          className="p-2.5 rounded-lg border border-line-light bg-white/70 text-xs space-y-0.5"
                        >
                          <p className="font-mono text-[10px] text-muted uppercase truncate" title={key}>
                            {key.replace(/_/g, ' ')}
                          </p>
                          <p className="font-mono text-[11px] text-ink break-words font-medium">
                            {typeof val === 'string'
                              ? val
                              : typeof val === 'boolean'
                              ? val ? 'Yes / True' : 'No / False'
                              : JSON.stringify(val)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Manual Confirm Action Area */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-line-light/60">
                  <p className="text-[11px] text-muted">
                    {v.status === 'verified' ? (
                      <span className="flex items-center gap-1.5 text-ok font-mono font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Statutory certificate valid and cross-referenced with registry.
                      </span>
                    ) : isManualCandidate ? (
                      <span className="flex items-center gap-1.5 text-warn font-mono">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Discrepancy or source delay detected. Manual physical verification path available.
                      </span>
                    ) : (
                      <span className="font-mono">Status recorded per regulatory compliance workflow.</span>
                    )}
                  </p>

                  {/* Manual confirm button (visible to verifier role) */}
                  {isVerifier && v.status !== 'verified' && (
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmTarget(v);
                        setConfirmNotes('');
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-brand bg-tint-brand text-brand hover:bg-brand hover:text-paper text-xs font-mono transition-colors font-medium self-end sm:self-auto"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Manual Confirm</span>
                    </button>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* Manual Confirmation Dialog Modal */}
      {confirmTarget && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-modal-title"
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-paper border border-line-light rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-start justify-between border-b border-line-light pb-3">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                  MANUAL VERIFIER PATHWAY
                </p>
                <h2 id="confirm-modal-title" className="text-lg font-semibold text-ink font-sans">
                  Confirm Verification: {confirmTarget.id}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setConfirmTarget(null)}
                className="text-muted hover:text-ink p-1 rounded-lg"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-black/[0.02] p-3 rounded-xl border border-line-light space-y-1">
                <p>
                  <strong className="font-mono text-muted uppercase text-[10px]">Document ID:</strong>{' '}
                  <span className="font-mono text-ink font-semibold">{confirmTarget.document_id}</span>
                </p>
                <p>
                  <strong className="font-mono text-muted uppercase text-[10px]">Registry Source:</strong>{' '}
                  <span className="text-ink">{confirmTarget.source}</span>
                </p>
                <p>
                  <strong className="font-mono text-muted uppercase text-[10px]">Current Status:</strong>{' '}
                  <span className="font-mono text-warn font-semibold">{confirmTarget.status}</span>
                </p>
              </div>

              <form onSubmit={handleManualConfirmSubmit} className="space-y-3">
                <div>
                  <label htmlFor="confirm-notes" className="block font-mono text-[11px] text-ink font-semibold mb-1">
                    Manual Verification Justification & Audit Note
                  </label>
                  <textarea
                    id="confirm-notes"
                    rows={3}
                    value={confirmNotes}
                    onChange={(e) => setConfirmNotes(e.target.value)}
                    placeholder="E.g., Inspected original sealed municipal NOC presented during regional inspection. Number matches State record SO-2024."
                    className="w-full p-2.5 text-xs font-mono rounded-lg border border-line-light bg-paper text-ink placeholder:text-muted/60 focus:outline-none focus:border-brand"
                  />
                  <p className="text-[10px] text-muted font-mono mt-1">
                    Recorded permanently in the immutable audit trail with verifier ID {user?.id || 'usr_ver_01'}.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-line-light">
                  <button
                    type="button"
                    onClick={() => setConfirmTarget(null)}
                    disabled={submittingConfirm}
                    className="px-4 py-2 rounded-lg border border-line-light text-xs font-mono text-muted hover:text-ink"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingConfirm}
                    className="px-4 py-2 rounded-lg bg-brand text-paper text-xs font-mono font-semibold hover:bg-brand-deep flex items-center gap-1.5"
                  >
                    {submittingConfirm ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Recording Confirmation...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Certify & Confirm</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
