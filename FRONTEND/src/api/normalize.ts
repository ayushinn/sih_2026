import { ApiError, Page } from './types';
import { BACKEND_ERROR_MESSAGES } from './errors';

/**
 * Tolerant Page Adapter.
 * Normalizes lists from varied backend implementations:
 * - Standard envelope: { items: T[], total: number, page: number, page_size: number }
 * - Alternative keys: { data: T[], count: number } or { results: T[], total: number }
 * - Plain arrays: T[]
 * - Undefined / Null / empty: safe empty structure
 */
export function normalizePage<T>(data: unknown, fallbackPage = 1, fallbackPageSize = 10): Page<T> {
  if (!data) {
    return {
      items: [],
      total: 0,
      page: fallbackPage,
      page_size: fallbackPageSize,
    };
  }

  // If backend returns a plain array
  if (Array.isArray(data)) {
    return {
      items: data as T[],
      total: data.length,
      page: 1,
      page_size: data.length || fallbackPageSize,
    };
  }

  // If backend returns an envelope object
  if (typeof data === 'object') {
    const obj = data as Record<string, unknown>;

    const items: T[] = Array.isArray(obj.items)
      ? (obj.items as T[])
      : Array.isArray(obj.data)
      ? (obj.data as T[])
      : Array.isArray(obj.results)
      ? (obj.results as T[])
      : [];

    const total =
      typeof obj.total === 'number'
        ? obj.total
        : typeof obj.count === 'number'
        ? obj.count
        : items.length;

    const page =
      typeof obj.page === 'number'
        ? obj.page
        : typeof obj.current_page === 'number'
        ? obj.current_page
        : fallbackPage;

    const page_size =
      typeof obj.page_size === 'number'
        ? obj.page_size
        : typeof obj.limit === 'number'
        ? obj.limit
        : fallbackPageSize;

    return {
      items,
      total,
      page,
      page_size,
    };
  }

  return {
    items: [],
    total: 0,
    page: fallbackPage,
    page_size: fallbackPageSize,
  };
}

/**
 * Tolerant Error Adapter.
 * Normalizes arbitrary server errors, FastAPI validation schemas, standard envelopes,
 * and client exceptions into a guaranteed, uniform ApiError structure.
 */
export function normalizeError(err: unknown): ApiError {
  const genericRequestId = `req_${Date.now().toString(36)}`;

  if (!err) {
    return {
      code: 'unknown_error',
      message: 'An unexpected error occurred. Please try again.',
      request_id: genericRequestId,
    };
  }

  // Handle standard JavaScript Error instances first
  if (err instanceof Error) {
    return {
      code: 'client_error',
      message: err.message || 'A network error occurred.',
      request_id: genericRequestId,
    };
  }

  // If already an object matching API error envelope
  if (typeof err === 'object' && err !== null) {
    const e = err as Record<string, unknown>;

    const code = typeof e.code === 'string' ? e.code : 'api_error';
    const requestId = typeof e.request_id === 'string' ? e.request_id : genericRequestId;

    // Handle FastAPI 422 validation detail schema: [{ loc: ['body', 'field'], msg: 'error' }]
    if (Array.isArray(e.detail)) {
      const fieldErrors = (e.detail as Array<Record<string, unknown>>).map((d) => {
        const loc = Array.isArray(d.loc)
          ? d.loc.filter((part) => part !== 'body').join('.')
          : 'field';
        return {
          field: String(loc || 'field'),
          message: String(d.msg || 'Invalid field entry'),
        };
      });

      return {
        code: 'validation_error',
        message: 'The submitted application data failed validation checks.',
        request_id: requestId,
        errors: fieldErrors,
      };
    }

    if (typeof e.message === 'string') {
      // Prioritize explicit server message if present, otherwise fall back to code translation
      const hasSpecificMessage =
        e.message &&
        e.message !== code &&
        !e.message.startsWith('http_') &&
        e.message !== 'Custom message';

      const friendlyMessage = hasSpecificMessage
        ? e.message
        : BACKEND_ERROR_MESSAGES[code] || e.message;

      const errors = Array.isArray(e.errors)
        ? (e.errors as { field: string; message: string }[])
        : undefined;

      return {
        code,
        message: friendlyMessage,
        request_id: requestId,
        errors,
      };
    }
  }

  if (typeof err === 'string') {
    return {
      code: 'error',
      message: err,
      request_id: genericRequestId,
    };
  }

  return {
    code: 'unknown_error',
    message: 'An unexpected system error occurred.',
    request_id: genericRequestId,
  };
}
