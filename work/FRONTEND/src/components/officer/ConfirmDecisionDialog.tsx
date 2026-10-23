import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { officerQueries, DecisionPayload } from '../../api/queries/officer';
import { DECISION_OPTIONS, DecisionType } from '../../api/types';
import { ShieldCheck, AlertTriangle, X, CheckCircle, ArrowRight } from 'lucide-react';

interface ConfirmDecisionDialogProps {
  applicationId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (result: { decision: string; status: string }) => void;
}

export const ConfirmDecisionDialog: React.FC<ConfirmDecisionDialogProps> = ({
  applicationId,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [decision, setDecision] = useState<DecisionType>('approve');
  const [decisionNote, setDecisionNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hard Rule: Only the officer role ever sees this control!
  if (!isOpen || user?.role !== 'officer') {
    return null;
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting) return; // Prevent double submit

    // Validation: Mandatory non-empty decision note
    if (!decisionNote.trim()) {
      setError('A mandatory regulatory justification note is required before recording a decision.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload: DecisionPayload = {
        decision,
        decision_note: decisionNote.trim(),
      };

      const res = await officerQueries.recordDecision(applicationId, payload);
      onSuccess(res);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to record decision on server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="decision-dialog-title"
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 selection:bg-brand selection:text-white"
    >
      <div className="bg-white rounded-3xl border border-line-light max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex items-start justify-between pb-4 border-b border-line-light">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-deep text-white flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-brand-soft" />
            </div>
            <div>
              <p className="font-mono text-[10px] text-muted tracking-widest uppercase">
                OFFICIAL REGULATORY SCRUTINY
              </p>
              <h2 id="decision-dialog-title" className="text-xl font-semibold text-ink font-sans">
                Record Scrutiny Decision
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 rounded-full text-muted hover:text-ink disabled:opacity-50"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="p-3.5 rounded-xl bg-tint-danger border border-danger/30 text-danger text-xs flex items-start gap-2.5 font-mono"
          >
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Application ID (Explicit Display) */}
          <div className="p-3.5 rounded-xl bg-paper border border-line-light flex items-center justify-between text-xs">
            <span className="font-mono text-muted uppercase">Target Application:</span>
            <span className="font-mono font-bold text-brand-deep text-sm">{applicationId}</span>
          </div>

          {/* Decision Selection */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-muted mb-2">
              Select Official Ruling
            </label>
            <div className="grid grid-cols-1 gap-2">
              {DECISION_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer text-xs transition-all ${
                    decision === opt.value
                      ? 'border-brand bg-tint-brand text-brand-deep font-semibold shadow-xs'
                      : 'border-line-light bg-white hover:border-brand/30 text-ink'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="scrutiny_decision"
                      value={opt.value}
                      checked={decision === opt.value}
                      onChange={() => setDecision(opt.value)}
                      className="text-brand focus:ring-brand"
                    />
                    <span>{opt.label}</span>
                  </div>
                  <span className="font-mono text-[10px] uppercase text-muted">
                    {opt.value === 'approve'
                      ? 'Grants Approval'
                      : opt.value === 'return_for_rectification'
                      ? 'Applicant Rectify'
                      : 'Formal Refusal'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Mandatory Regulatory Note */}
          <div>
            <label
              htmlFor="decision-note"
              className="block text-xs font-mono uppercase tracking-wider text-muted mb-1.5"
            >
              Mandatory Scrutiny Justification Note <span className="text-danger">*</span>
            </label>
            <textarea
              id="decision-note"
              rows={4}
              required
              value={decisionNote}
              onChange={(e) => setDecisionNote(e.target.value)}
              placeholder="Provide clear statutory reasoning citing APH clauses, inspected evidence paragraphs, and verified registry outcomes..."
              className="w-full p-3 rounded-xl border border-line-light bg-paper/40 text-xs text-ink placeholder:text-muted/60 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 font-sans leading-relaxed"
            />
            <p className="mt-1 font-mono text-[10px] text-muted">
              This note will be permanently recorded in the immutable audit trail and printed on the official report.
            </p>
          </div>

          {/* Action Buttons with double-click block */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-line-light">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-full border border-line-light hover:border-ink/40 text-ink text-xs font-mono transition-colors disabled:opacity-50"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !decisionNote.trim()}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-brand hover:bg-brand-deep text-white text-xs font-mono tracking-wider transition-all shadow-sm disabled:opacity-40"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  RECORDING DECISION...
                </span>
              ) : (
                <>
                  <span>CONFIRM & RECORD DECISION</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
