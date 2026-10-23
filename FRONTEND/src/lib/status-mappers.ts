import { JobStatus, Severity, VerificationStatus } from '../api/types';

export interface StatusPresentation {
  label: string;
  badgeClass: string;
  iconName: 'check' | 'alert' | 'clock' | 'loader' | 'x' | 'info' | 'help';
  variant: 'ok' | 'warn' | 'danger' | 'info' | 'neutral';
}

/**
 * Format any raw string into human-readable words (e.g., 'mismatch_detected' -> 'Mismatch Detected')
 */
export function formatRawStatus(val: string): string {
  if (!val) return 'Unknown';
  return val
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

/**
 * Maps Job Status (one single place in the app).
 * Statuses: queued, running, completed, failed
 */
export function mapJobStatus(status: JobStatus | string | undefined): StatusPresentation {
  const norm = (status || '').toLowerCase().trim();

  switch (norm) {
    case 'queued':
      return {
        label: 'Queued',
        badgeClass: 'bg-muted/10 text-muted border-muted/20',
        iconName: 'clock',
        variant: 'neutral',
      };
    case 'running':
    case 'in_progress':
      return {
        label: 'Validating documents...',
        badgeClass: 'bg-tint-brand text-brand border-brand/30 animate-pulse',
        iconName: 'loader',
        variant: 'info',
      };
    case 'completed':
    case 'succeeded':
      return {
        label: 'Validation Complete',
        badgeClass: 'bg-tint-ok text-ok border-ok/30',
        iconName: 'check',
        variant: 'ok',
      };
    case 'failed':
    case 'error':
      return {
        label: 'Validation Failed',
        badgeClass: 'bg-tint-danger text-danger border-danger/30',
        iconName: 'x',
        variant: 'danger',
      };
    default:
      return {
        label: formatRawStatus(norm),
        badgeClass: 'bg-muted/10 text-muted border-muted/20',
        iconName: 'help',
        variant: 'neutral',
      };
  }
}

/**
 * Maps Verification Status
 * Six exact statutory statuses: verified, failed, inconclusive, pending, manual_required, exempt
 * Plus aliases: mismatch_detected, expired, verification_pending, source_unavailable, manual_review_required
 */
export function mapVerificationStatus(
  status: VerificationStatus | string | undefined
): StatusPresentation {
  const norm = (status || '').toLowerCase().trim();

  switch (norm) {
    case 'verified':
      return {
        label: 'Verified',
        badgeClass: 'bg-tint-ok text-ok border-ok/30',
        iconName: 'check',
        variant: 'ok',
      };
    case 'failed':
    case 'mismatch_detected':
      return {
        label: norm === 'failed' ? 'Failed' : 'Mismatch detected',
        badgeClass: 'bg-tint-danger text-danger border-danger/30',
        iconName: 'alert',
        variant: 'danger',
      };
    case 'inconclusive':
    case 'source_unavailable':
      return {
        label: norm === 'inconclusive' ? 'Inconclusive' : 'Could not be checked at the source',
        badgeClass: 'bg-muted/10 text-muted border-muted/20',
        iconName: 'info',
        variant: 'neutral',
      };
    case 'pending':
    case 'verification_pending':
      return {
        label: 'Verification pending',
        badgeClass: 'bg-tint-info text-info border-info/30',
        iconName: 'clock',
        variant: 'info',
      };
    case 'manual_required':
    case 'manual_review_required':
      return {
        label: 'Manual review required',
        badgeClass: 'bg-tint-warn text-warn border-warn/30',
        iconName: 'alert',
        variant: 'warn',
      };
    case 'exempt':
    case 'expired':
      return {
        label: norm === 'exempt' ? 'Exempt' : 'Expired',
        badgeClass: norm === 'exempt' ? 'bg-muted/10 text-muted border-muted/20' : 'bg-tint-warn text-warn border-warn/30',
        iconName: norm === 'exempt' ? 'info' : 'clock',
        variant: norm === 'exempt' ? 'neutral' : 'warn',
      };
    default:
      return {
        label: formatRawStatus(norm) || 'Unknown',
        badgeClass: 'bg-muted/10 text-muted border-muted/20',
        iconName: 'help',
        variant: 'neutral',
      };
  }
}

/**
 * Maps Finding / Risk Severity
 * Values: low, medium, high
 */
export function mapSeverity(severity: Severity | string | undefined): StatusPresentation {
  const norm = (severity || '').toLowerCase().trim();

  switch (norm) {
    case 'high':
      return {
        label: 'High Severity',
        badgeClass: 'bg-tint-danger text-danger border-danger/30 font-medium',
        iconName: 'alert',
        variant: 'danger',
      };
    case 'medium':
      return {
        label: 'Medium Severity',
        badgeClass: 'bg-tint-warn text-warn border-warn/30',
        iconName: 'alert',
        variant: 'warn',
      };
    case 'low':
      return {
        label: 'Low Severity',
        badgeClass: 'bg-tint-brand text-brand border-brand/30',
        iconName: 'info',
        variant: 'info',
      };
    default:
      return {
        label: formatRawStatus(norm),
        badgeClass: 'bg-muted/10 text-muted border-muted/20',
        iconName: 'info',
        variant: 'neutral',
      };
  }
}

/**
 * Maps Application lifecycle statuses
 */
export function mapApplicationStatus(status: string | undefined): StatusPresentation {
  const norm = (status || '').toLowerCase().trim();

  switch (norm) {
    case 'draft':
      return {
        label: 'Draft',
        badgeClass: 'bg-muted/10 text-muted border-muted/20',
        iconName: 'clock',
        variant: 'neutral',
      };
    case 'submitted':
      return {
        label: 'Submitted',
        badgeClass: 'bg-tint-brand text-brand border-brand/30',
        iconName: 'check',
        variant: 'info',
      };
    case 'under_scrutiny':
    case 'in_review':
      return {
        label: 'Under Scrutiny',
        badgeClass: 'bg-tint-info text-info border-info/30',
        iconName: 'loader',
        variant: 'info',
      };
    case 'rectification_requested':
      return {
        label: 'Rectification Requested',
        badgeClass: 'bg-tint-warn text-warn border-warn/30',
        iconName: 'alert',
        variant: 'warn',
      };
    case 'approved':
      return {
        label: 'Approved by Officer',
        badgeClass: 'bg-tint-ok text-ok border-ok/30 font-medium',
        iconName: 'check',
        variant: 'ok',
      };
    case 'rejected':
      return {
        label: 'Rejected by Officer',
        badgeClass: 'bg-tint-danger text-danger border-danger/30 font-medium',
        iconName: 'x',
        variant: 'danger',
      };
    default:
      return {
        label: formatRawStatus(norm),
        badgeClass: 'bg-muted/10 text-muted border-muted/20',
        iconName: 'info',
        variant: 'neutral',
      };
  }
}
