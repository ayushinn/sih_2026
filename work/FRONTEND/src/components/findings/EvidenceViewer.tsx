import React, { useState } from 'react';
import { Finding, DocumentMeta } from '../../api/types';
import { findingQueries } from '../../api/queries/findings';
import { mapSeverity } from '../../lib/status-mappers';
import { useAuth } from '../../context/AuthContext';
import {
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Maximize2,
  Info,
  Layers,
  ChevronRight,
  Shield,
  FileCheck,
} from 'lucide-react';

interface EvidenceViewerProps {
  applicationId: string;
  findings: Finding[];
  documents: DocumentMeta[];
  onFindingReviewed?: (updatedFinding: Finding) => void;
  initialSelectedFindingId?: string;
  readOnly?: boolean;
}

export const EvidenceViewer: React.FC<EvidenceViewerProps> = ({
  applicationId,
  findings,
  documents,
  onFindingReviewed,
  initialSelectedFindingId,
  readOnly = false,
}) => {
  const { user } = useAuth();
  const isOfficer = user?.role === 'officer' && !readOnly;

  // Selected finding state
  const [selectedFindingId, setSelectedFindingId] = useState<string>(
    initialSelectedFindingId || findings[0]?.id || ''
  );

  // Review form state
  const [reviewAction, setReviewAction] = useState<'accept' | 'dismiss'>('accept');
  const [reviewNote, setReviewNote] = useState<string>('');
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState<string | null>(null);

  // Filter state for left pane
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  const selectedFinding = findings.find((f) => f.id === selectedFindingId) || findings[0];

  // Selected document: either the document linked to the finding or first document
  const associatedDocument = documents.find((d) => d.id === selectedFinding?.document_id);
  const [activeDocId, setActiveDocId] = useState<string>(
    associatedDocument?.id || documents[0]?.id || ''
  );

  // Sync active document when finding changes
  React.useEffect(() => {
    if (selectedFinding?.document_id) {
      setActiveDocId(selectedFinding.document_id);
    }
  }, [selectedFindingId]);

  const activeDoc = documents.find((d) => d.id === activeDocId) || associatedDocument || documents[0];

  // Coordinate check: draw bounding box ONLY when API data contains page and bbox
  const hasBoundingBox = Boolean(
    selectedFinding &&
    selectedFinding.document_id === activeDoc?.id &&
    selectedFinding.evidence_page != null &&
    Array.isArray(selectedFinding.evidence_bbox) &&
    selectedFinding.evidence_bbox.length === 4
  );

  // Filtered findings for left rail
  const filteredFindings = findings.filter((f) => {
    if (severityFilter === 'all') return true;
    return f.severity === severityFilter;
  });

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFinding) return;

    if (!reviewNote.trim()) {
      setReviewError('A mandatory review note citing statutory grounds is required.');
      return;
    }

    setIsSubmittingReview(true);
    setReviewError(null);
    setReviewSuccessMsg(null);

    try {
      const updated = await findingQueries.reviewFinding(selectedFinding.id, {
        action: reviewAction,
        review_note: reviewNote.trim(),
      });
      setReviewSuccessMsg(
        `Finding marked as ${reviewAction === 'accept' ? 'ACCEPTED' : 'DISMISSED'}.`
      );
      setReviewNote('');
      if (onFindingReviewed) {
        onFindingReviewed(updated);
      }
    } catch (err: any) {
      setReviewError(err.message || 'Failed to submit finding review.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full min-h-[680px]">
      {/* ============================================================== */}
      {/* LEFT PANE: Findings List & Official Review Action               */}
      {/* ============================================================== */}
      <div className="w-full lg:w-5/12 flex flex-col space-y-4">
        {/* Filter bar */}
        <div className="bg-white rounded-2xl border border-line-light p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase text-muted tracking-widest">
                DOCUMENT EVIDENCE AUDIT
              </p>
              <h2 className="text-base font-semibold text-ink font-sans">
                Flagged Findings ({findings.length})
              </h2>
            </div>
            <span className="font-mono text-[10px] px-2.5 py-0.5 rounded-full bg-paper border border-line-light text-muted">
              ADVISORY ONLY
            </span>
          </div>

          {/* Severity filter tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-mono">
            {['all', 'high', 'medium', 'low'].map((sev) => (
              <button
                key={sev}
                type="button"
                onClick={() => setSeverityFilter(sev)}
                className={`px-3 py-1 rounded-lg capitalize transition-colors ${
                  severityFilter === sev
                    ? 'bg-brand-deep text-white font-semibold'
                    : 'bg-paper text-muted hover:text-ink'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>

        {/* Findings List */}
        <div className="bg-white rounded-2xl border border-line-light p-3 shadow-xs flex-1 max-h-[460px] overflow-y-auto space-y-2">
          {filteredFindings.length === 0 ? (
            <div className="py-12 text-center text-xs font-mono text-muted">
              No findings matching the selected filter.
            </div>
          ) : (
            filteredFindings.map((f) => {
              const sev = mapSeverity(f.severity);
              const isSelected = f.id === selectedFinding?.id;
              const isReviewed = f.status === 'accepted' || f.status === 'dismissed';

              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    setSelectedFindingId(f.id);
                    setReviewError(null);
                    setReviewSuccessMsg(null);
                  }}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                    isSelected
                      ? 'border-brand bg-tint-brand/20 shadow-xs'
                      : 'border-line-light hover:border-brand/40 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] ${sev.badgeClass}`}>
                        {sev.label}
                      </span>
                      <span className="font-mono text-[10px] text-brand-deep font-semibold">
                        {f.rule_id}
                      </span>
                    </div>
                    <span
                      className={`font-mono text-[9px] uppercase px-1.5 py-0.5 rounded ${
                        f.status === 'accepted'
                          ? 'bg-tint-ok text-ok font-semibold'
                          : f.status === 'dismissed'
                          ? 'bg-paper text-muted'
                          : 'bg-tint-warn text-warn font-semibold'
                      }`}
                    >
                      {f.status}
                    </span>
                  </div>

                  <p className="text-xs text-ink font-sans line-clamp-2 leading-relaxed">
                    {f.reason}
                  </p>

                  <div className="mt-2 pt-2 border-t border-line-light/60 flex items-center justify-between text-[10px] font-mono text-muted">
                    <span>
                      {f.confidence != null
                        ? `Confidence: ${(f.confidence * 100).toFixed(0)}%`
                        : 'Rule Evaluation'}
                    </span>
                    <span className="text-brand font-semibold flex items-center gap-1">
                      {f.evidence_bbox ? 'Has Page Coordinates' : 'Text Reference'}
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Selected Finding Detail & Officer Review Box */}
        {selectedFinding && (
          <div className="bg-white rounded-2xl border border-line-light p-5 shadow-xs space-y-4">
            <div className="flex items-start justify-between gap-2 border-b border-line-light pb-3">
              <div>
                <p className="font-mono text-[10px] text-muted uppercase">ACTIVE SELECTION</p>
                <h3 className="text-sm font-semibold text-ink font-sans">
                  {selectedFinding.rule_id}{' '}
                  <span className="text-muted font-normal">
                    ({selectedFinding.rule_version || 'v1.0'})
                  </span>
                </h3>
              </div>
              <div className="text-right">
                <span className="font-mono text-[10px] text-muted block">
                  Model Confidence:{' '}
                  {selectedFinding.confidence != null
                    ? `${(selectedFinding.confidence * 100).toFixed(0)}%`
                    : 'N/A'}
                </span>
                <span className="text-[9px] text-muted italic">Model confidence, not proof</span>
              </div>
            </div>

            <p className="text-xs text-ink leading-relaxed font-sans">
              {selectedFinding.reason}
            </p>

            {/* Evidence quote */}
            <div className="p-3 rounded-xl bg-paper border border-line-light text-xs font-mono">
              <span className="text-brand-deep font-semibold block text-[10px] uppercase mb-1">
                Cited Document Reference:
              </span>
              <p className="text-ink text-[11px] leading-relaxed">
                {selectedFinding.evidence_ref || 'No textual citation provided.'}
              </p>
              {selectedFinding.evidence_page && (
                <span className="text-[10px] text-muted mt-1 block">
                  Target Page: {selectedFinding.evidence_page}
                </span>
              )}
            </div>

            {/* Existing Review Note Display */}
            {selectedFinding.review_note && (
              <div className="p-3 rounded-xl bg-tint-brand/30 border border-brand/20 text-xs font-mono space-y-1">
                <div className="flex items-center justify-between text-[10px] text-brand-deep font-semibold uppercase">
                  <span>Recorded Officer Note</span>
                  <span>[{selectedFinding.status}]</span>
                </div>
                <p className="text-ink font-sans text-xs">{selectedFinding.review_note}</p>
                {selectedFinding.reviewed_by && (
                  <span className="text-[10px] text-muted block">
                    Reviewed by: {selectedFinding.reviewed_by}
                  </span>
                )}
              </div>
            )}

            {/* Officer Review Form (Mandatory note requirement) */}
            {isOfficer && (
              <form onSubmit={handleReviewSubmit} className="pt-2 border-t border-line-light space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] uppercase font-semibold text-ink">
                    Official Scrutiny Action
                  </span>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 text-xs font-mono cursor-pointer">
                      <input
                        type="radio"
                        name="review_action"
                        value="accept"
                        checked={reviewAction === 'accept'}
                        onChange={() => setReviewAction('accept')}
                        className="text-brand focus:ring-brand"
                      />
                      <span>Accept Flag</span>
                    </label>
                    <label className="flex items-center gap-1.5 text-xs font-mono cursor-pointer">
                      <input
                        type="radio"
                        name="review_action"
                        value="dismiss"
                        checked={reviewAction === 'dismiss'}
                        onChange={() => setReviewAction('dismiss')}
                        className="text-brand focus:ring-brand"
                      />
                      <span>Dismiss Flag</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="review-note-input"
                    className="block text-[11px] font-mono text-muted uppercase tracking-wider mb-1"
                  >
                    Mandatory Review Note <span className="text-danger">*</span>
                  </label>
                  <textarea
                    id="review-note-input"
                    rows={2}
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    placeholder="Enter regulatory justification for accepting or dismissing this finding..."
                    className="w-full p-2.5 rounded-xl border border-line-light bg-paper/30 text-xs text-ink placeholder:text-muted/60 focus:outline-none focus:border-brand"
                  />
                </div>

                {reviewError && (
                  <div className="p-2.5 rounded-lg bg-tint-danger text-danger text-xs font-mono">
                    {reviewError}
                  </div>
                )}

                {reviewSuccessMsg && (
                  <div className="p-2.5 rounded-lg bg-tint-ok text-ok text-xs font-mono">
                    {reviewSuccessMsg}
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmittingReview || !reviewNote.trim()}
                    className="px-4 py-2 rounded-full bg-brand hover:bg-brand-deep text-white font-mono text-xs font-semibold disabled:opacity-40 transition-colors shadow-xs"
                  >
                    {isSubmittingReview ? 'RECORDING...' : 'RECORD FINDING DECISION'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* RIGHT PANE: Document Viewer with Bounding Box Overlay          */}
      {/* ============================================================== */}
      <div className="w-full lg:w-7/12 flex flex-col space-y-4">
        {/* Document Header & Tab Selector */}
        <div className="bg-white rounded-2xl border border-line-light p-4 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-line-light pb-3">
            <div>
              <p className="font-mono text-[10px] uppercase text-muted tracking-widest">
                INSPECTED ARTIFACT
              </p>
              <h3 className="text-sm font-semibold text-ink font-sans flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand" />
                {activeDoc?.filename || 'No document selected'}
              </h3>
            </div>
            {activeDoc && (
              <span className="font-mono text-[10px] text-muted truncate max-w-[220px]">
                SHA-256: {activeDoc.sha256?.slice(0, 16)}...
              </span>
            )}
          </div>

          {/* Document switcher tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {documents.map((doc) => (
              <button
                key={doc.id}
                type="button"
                onClick={() => setActiveDocId(doc.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-sans whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  doc.id === activeDoc?.id
                    ? 'bg-tint-brand text-brand-deep font-semibold border border-brand/40'
                    : 'bg-paper text-muted hover:text-ink border border-line-light'
                }`}
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span>{doc.doc_type}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Visual Document Canvas */}
        <div className="bg-white rounded-2xl border border-line-light p-6 shadow-xs flex-1 flex flex-col items-center justify-start min-h-[560px] relative overflow-hidden">
          {/* Coordinate status banner */}
          <div className="w-full mb-4">
            {hasBoundingBox ? (
              <div
                data-testid="bounding-box-banner"
                className="p-3 rounded-xl bg-tint-warn border border-warn/30 text-xs font-mono flex items-center justify-between text-ink"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-warn animate-pulse" />
                  <span className="font-semibold text-brand-deep">
                    Visual Evidence Located on Page {selectedFinding?.evidence_page}
                  </span>
                </div>
                <span className="text-[10px] text-muted">
                  BBox: [{selectedFinding?.evidence_bbox?.map((v) => v.toFixed(2)).join(', ')}]
                </span>
              </div>
            ) : (
              <div
                data-testid="no-bounding-box-callout"
                className="p-3 rounded-xl bg-paper border border-line-light text-xs font-mono text-muted flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-brand-soft shrink-0" />
                  <span>
                    No visual bounding box coordinates provided by API. Referencing textual citation.
                  </span>
                </div>
                <span className="text-[10px] uppercase font-semibold text-brand">
                  Text-Only Evidence
                </span>
              </div>
            )}
          </div>

          {/* Simulated Authentic Document Page Preview */}
          <div
            data-testid="document-page-canvas"
            className="w-full max-w-xl aspect-[1/1.414] bg-white rounded-lg border-2 border-line-light shadow-md relative p-8 select-none overflow-hidden"
          >
            {/* Official Regulatory Scrutiny Header Simulation */}
            <div className="border-b-2 border-line-light pb-4 mb-6 flex items-center justify-between text-[11px] font-sans">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-wider text-muted">
                  ALL INDIA COUNCIL FOR TECHNICAL EDUCATION
                </p>
                <p className="font-bold text-ink">INSTITUTION STATUTORY SUBMISSION</p>
              </div>
              <div className="w-8 h-8 rounded-full border border-line-light bg-paper flex items-center justify-center font-mono text-[9px] text-muted">
                SEAL
              </div>
            </div>

            {/* Simulated Document Body Content */}
            <div className="space-y-4 text-[11px] leading-relaxed text-muted/80 font-serif">
              <p className="text-ink font-semibold font-sans">
                DOCUMENT TITLE: {activeDoc?.doc_type?.toUpperCase()}
              </p>
              <p>
                To Whom It May Concern, this official instrument verifies compliance with statutory
                accreditation handbook standards. The institution hereby tenders certified
                records under statutory penalty of declaration falsification.
              </p>

              {/* Text excerpt block */}
              <div className="p-3 bg-paper/60 rounded border border-line-light text-[10px] font-mono text-ink">
                <p className="font-semibold text-brand-deep mb-1">RECORDED EXCERPT:</p>
                <p>
                  {selectedFinding?.evidence_ref ||
                    'Certificate of recognition issued pursuant to regional Directorate inspections. All facilities and cadre allocation comply with standard schedules.'}
                </p>
              </div>

              <p>
                Signed and sealed by authorized representative. Validity subject to routine
                regional committee audits, building norm inspections, and empanelled university
                affiliations.
              </p>
            </div>

            {/* Official Footer */}
            <div className="absolute bottom-6 left-8 right-8 border-t border-line-light pt-3 flex items-center justify-between font-mono text-[9px] text-muted">
              <span>APPLICATION: {applicationId}</span>
              <span>PAGE 1 OF 4</span>
              <span>CONFIDENTIAL</span>
            </div>

            {/* ============================================================== */}
            {/* BOUNDING BOX OVERLAY: DRAWN ONLY WHEN BBOX & PAGE ARE PRESENT  */}
            {/* ============================================================== */}
            {hasBoundingBox && selectedFinding?.evidence_bbox && (
              <div
                data-testid="evidence-bounding-box"
                style={{
                  position: 'absolute',
                  top: `${selectedFinding.evidence_bbox[0] * 100}%`,
                  left: `${selectedFinding.evidence_bbox[1] * 100}%`,
                  height: `${(selectedFinding.evidence_bbox[2] - selectedFinding.evidence_bbox[0]) * 100}%`,
                  width: `${(selectedFinding.evidence_bbox[3] - selectedFinding.evidence_bbox[1]) * 100}%`,
                }}
                className="border-2 border-warn bg-warn/15 rounded-md pointer-events-auto transition-all shadow-sm ring-2 ring-warn/30"
              >
                {/* Hairline Tag */}
                <div className="absolute -top-6 left-0 px-2 py-0.5 rounded bg-brand-deep text-white font-mono text-[9px] uppercase tracking-wider flex items-center gap-1 shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-warn animate-ping" />
                  <span>TARGET: {selectedFinding.rule_id}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
