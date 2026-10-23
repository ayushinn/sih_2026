import { describe, it, expect } from 'vitest';
import { normalizeError } from './normalize';
import { ThermoraApiError, getStatusCategory, BACKEND_ERROR_MESSAGES } from './errors';

describe('Error Envelope Mapping & Normalization', () => {
  it('correctly maps standard backend error envelope with field errors', () => {
    const rawError = {
      code: 'validation_error',
      message: 'Initial validation failure',
      request_id: 'req_test_999',
      errors: [
        { field: 'category', message: 'Category is required' },
        { field: 'institution_id', message: 'Invalid institution' },
      ],
    };

    const normalized = normalizeError(rawError);
    expect(normalized.code).toBe('validation_error');
    expect(normalized.request_id).toBe('req_test_999');
    expect(normalized.errors?.length).toBe(2);
    expect(normalized.errors?.[0].field).toBe('category');
    expect(normalized.errors?.[1].field).toBe('institution_id');
  });

  it('translates FastAPI 422 validation detail array into uniform field errors', () => {
    const fastApiError = {
      detail: [
        { loc: ['body', 'documents', '0', 'file'], msg: 'File too large' },
        { loc: ['body', 'decision_note'], msg: 'Field cannot be blank' },
      ],
    };

    const normalized = normalizeError(fastApiError);
    expect(normalized.code).toBe('validation_error');
    expect(normalized.message).toBe('The submitted application data failed validation checks.');
    expect(normalized.errors?.length).toBe(2);
    expect(normalized.errors?.[0].field).toBe('documents.0.file');
    expect(normalized.errors?.[0].message).toBe('File too large');
    expect(normalized.errors?.[1].field).toBe('decision_note');
  });

  it('translates security error codes to user-friendly messages when generic', () => {
    const notAuth = normalizeError({ code: 'not_authenticated', message: 'not_authenticated' });
    expect(notAuth.message).toBe(BACKEND_ERROR_MESSAGES.not_authenticated);

    const tokenExp = normalizeError({ code: 'token_expired', message: 'token_expired' });
    expect(tokenExp.message).toBe(BACKEND_ERROR_MESSAGES.token_expired);

    const forbiddenRole = normalizeError({ code: 'forbidden_role', message: 'forbidden_role' });
    expect(forbiddenRole.message).toBe(BACKEND_ERROR_MESSAGES.forbidden_role);

    const forbiddenObj = normalizeError({ code: 'forbidden_object', message: 'forbidden_object' });
    expect(forbiddenObj.message).toBe(BACKEND_ERROR_MESSAGES.forbidden_object);
  });

  it('handles standard Error instances and plain strings safely without crashing', () => {
    const jsError = new Error('Network offline or disconnected');
    const normalizedJsError = normalizeError(jsError);
    expect(normalizedJsError.code).toBe('client_error');
    expect(normalizedJsError.message).toBe('Network offline or disconnected');
    expect(normalizedJsError.request_id).toMatch(/^req_/);

    const stringError = normalizeError('Gateway connection timed out');
    expect(stringError.code).toBe('error');
    expect(stringError.message).toBe('Gateway connection timed out');

    const nullError = normalizeError(null);
    expect(nullError.code).toBe('unknown_error');
    expect(nullError.message).toContain('unexpected error');
  });

  it('evaluates HTTP status categories accurately', () => {
    expect(getStatusCategory(401)).toBe('unauthorized');
    expect(getStatusCategory(403)).toBe('forbidden');
    expect(getStatusCategory(404)).toBe('not_found');
    expect(getStatusCategory(422)).toBe('validation');
    expect(getStatusCategory(429)).toBe('rate_limited');
    expect(getStatusCategory(500)).toBe('server_error');
    expect(getStatusCategory(503)).toBe('server_error');
    expect(getStatusCategory(400)).toBe('client_error');
  });

  it('instantiates ThermoraApiError with status code, request ID, and field errors', () => {
    const apiError = new ThermoraApiError(422, {
      code: 'validation_error',
      message: 'Invalid input',
      request_id: 'req_custom_1',
      errors: [{ field: 'email', message: 'Required' }],
    });

    expect(apiError.name).toBe('ThermoraApiError');
    expect(apiError.status).toBe(422);
    expect(apiError.code).toBe('validation_error');
    expect(apiError.requestId).toBe('req_custom_1');
    expect(apiError.fieldErrors?.[0].field).toBe('email');
  });
});
