import { ApiError } from './types';

/**
 * Custom Error class representing API errors from THERMORA backend or client network failures.
 */
export class ThermoraApiError extends Error {
  public code: string;
  public status: number;
  public requestId: string;
  public fieldErrors?: { field: string; message: string }[];

  constructor(status: number, errorData: ApiError) {
    super(errorData.message);
    this.name = 'ThermoraApiError';
    this.status = status;
    this.code = errorData.code;
    this.requestId = errorData.request_id;
    this.fieldErrors = errorData.errors;
  }
}

/**
 * Standard backend error code mapping to human-readable messages.
 */
export const BACKEND_ERROR_MESSAGES: Record<string, string> = {
  not_authenticated: 'Your session has expired or you are not signed in. Please sign in again.',
  token_expired: 'Your security token has expired. Please authenticate to continue.',
  forbidden_role: 'Your account role does not have authorization to access this regulatory action.',
  forbidden_object: 'You do not have permission to view or manipulate this application record.',
  rate_limit_exceeded: 'Rate limit reached. Please wait before retrying your request.',
  validation_error: 'The submitted application data failed regulatory validation checks.',
  not_found: 'The requested regulatory document or record was not found or is unavailable.',
  job_failed: 'The document validation job encountered an unexpected processing failure.',
  conflict: 'A conflicting record or state transition was detected by the server.',
};

/**
 * Evaluates HTTP status codes and maps to predictable error behavior.
 */
export function getStatusCategory(status: number): 'unauthorized' | 'forbidden' | 'not_found' | 'validation' | 'rate_limited' | 'server_error' | 'client_error' {
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'not_found';
  if (status === 422) return 'validation';
  if (status === 429) return 'rate_limited';
  if (status >= 500) return 'server_error';
  return 'client_error';
}
