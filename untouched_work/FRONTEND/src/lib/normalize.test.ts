import { describe, it, expect } from 'vitest';
import { normalizePage, normalizeError } from '../api/normalize';
import {
  mapJobStatus,
  mapVerificationStatus,
  mapSeverity,
  formatRawStatus,
} from './status-mappers';

describe('normalizePage Adapter', () => {
  it('handles plain arrays', () => {
    const result = normalizePage(['a', 'b', 'c']);
    expect(result.items.length).toBe(3);
    expect(result.total).toBe(3);
    expect(result.page).toBe(1);
  });

  it('handles standard envelope', () => {
    const result = normalizePage({
      items: [{ id: 1 }, { id: 2 }],
      total: 20,
      page: 2,
      page_size: 10,
    });
    expect(result.items.length).toBe(2);
    expect(result.total).toBe(20);
    expect(result.page).toBe(2);
  });

  it('handles null or undefined safely without throwing', () => {
    const result = normalizePage(null);
    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
  });
});

describe('normalizeError Adapter', () => {
  it('handles standard envelope and translates known error codes', () => {
    const err = normalizeError({
      code: 'not_authenticated',
      message: 'Custom message',
      request_id: 'req_123',
    });
    expect(err.code).toBe('not_authenticated');
    expect(err.message).toContain('session has expired');
    expect(err.request_id).toBe('req_123');
  });

  it('handles FastAPI detail validation errors', () => {
    const fastApiErr = normalizeError({
      detail: [{ loc: ['body', 'email'], msg: 'Invalid email address' }],
    });
    expect(fastApiErr.code).toBe('validation_error');
    expect(fastApiErr.errors?.[0].field).toBe('email');
  });
});

describe('Status Mappers', () => {
  it('maps known and unknown strings safely', () => {
    const jobRunning = mapJobStatus('running');
    expect(jobRunning.variant).toBe('info');

    const jobUnknown = mapJobStatus('custom_state_xyz');
    expect(jobUnknown.variant).toBe('neutral');
    expect(jobUnknown.label).toBe('Custom State Xyz');

    const verifUnavailable = mapVerificationStatus('source_unavailable');
    expect(verifUnavailable.label).toBe('Could not be checked at the source');

    const severityHigh = mapSeverity('high');
    expect(severityHigh.variant).toBe('danger');
  });

  it('formats raw status strings cleanly', () => {
    expect(formatRawStatus('mismatch_detected')).toBe('Mismatch Detected');
    expect(formatRawStatus('in_review')).toBe('In Review');
  });
});
