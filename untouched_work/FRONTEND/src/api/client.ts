import { env } from '../lib/env';
import { normalizeError } from './normalize';
import { ThermoraApiError } from './errors';
import { ApiError } from './types';
import { mockServer } from './mock/server';

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
  _isRetry?: boolean;
}

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

/**
 * Resets the refresh lock (useful for unit tests and logout).
 */
export function resetRefreshState(): void {
  isRefreshing = false;
  refreshPromise = null;
}

/**
 * Formats a clean URL path without duplicate /api/v1 prefixes or trailing slashes.
 */
export function buildCleanUrl(
  endpoint: string,
  params?: Record<string, string | number | boolean | undefined>
): string {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const trimmed = cleanEndpoint.length > 1 ? cleanEndpoint.replace(/\/$/, '') : cleanEndpoint;
  const fullPath = `${env.API_BASE_URL}${trimmed}`;

  if (!params) return fullPath;

  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  }

  const queryString = searchParams.toString();
  return queryString ? `${fullPath}?${queryString}` : fullPath;
}

/**
 * Single Unified HTTP Client for THERMORA.
 * All HTTP operations in the entire application flow through this client.
 */
export const apiClient = {
  async request<T>(method: string, endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { params, body, headers, _isRetry, ...restOptions } = options;

    // --- 1. MOCK MODE DISPATCH ---
    if (env.USE_MOCK) {
      try {
        let parsedBody = body;
        if (typeof body === 'string') {
          try {
            parsedBody = JSON.parse(body);
          } catch {
            // Keep original string if not valid JSON
          }
        }
        return await mockServer.handleRequest<T>(method, endpoint, parsedBody);
      } catch (err: any) {
        const normalized = normalizeError(err);
        const status = (err as any)?._status || 400;
        throw new ThermoraApiError(status, normalized);
      }
    }

    // --- 2. REAL BACKEND HTTP FETCH ---
    const url = buildCleanUrl(endpoint, params);

    const defaultHeaders: Record<string, string> = {
      Accept: 'application/json',
      ...(body && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
    };

    const fetchConfig: RequestInit = {
      method,
      credentials: 'include', // Always send and receive HTTP-only session cookies
      headers: {
        ...defaultHeaders,
        ...(headers as Record<string, string>),
      },
      body,
      ...restOptions,
    };

    try {
      const response = await fetch(url, fetchConfig);

      // --- 3. 401 SESSION EXPIRY & SINGLE REFRESH HANDLING ---
      // If 401 is received, attempt ONE refresh if not already retrying, not on login, and not on refresh itself.
      const isAuthEndpoint = endpoint.includes('/auth/login') || endpoint.includes('/auth/refresh');
      if (response.status === 401 && !isAuthEndpoint && !_isRetry) {
        if (!isRefreshing) {
          isRefreshing = true;
          refreshPromise = (async () => {
            try {
              const refreshRes = await fetch(`${env.API_BASE_URL}/auth/refresh`, {
                method: 'POST',
                credentials: 'include',
              });
              return refreshRes.ok;
            } catch {
              return false;
            } finally {
              isRefreshing = false;
              refreshPromise = null;
            }
          })();
        }

        const refreshedSuccessfully = await refreshPromise;

        if (refreshedSuccessfully) {
          // Retry the original request ONCE with _isRetry: true to prevent infinite refresh loops
          return await apiClient.request<T>(method, endpoint, {
            ...options,
            _isRetry: true,
          });
        }
      }

      // If response is not OK, parse the error payload or synthesize an ApiError
      if (!response.ok) {
        let errorPayload: unknown;
        try {
          errorPayload = await response.json();
        } catch {
          errorPayload = {
            code: `http_${response.status}`,
            message: response.statusText || 'Server error occurred',
            request_id: response.headers.get('x-request-id') || `req_${Date.now().toString(36)}`,
          };
        }
        const normalized = normalizeError(errorPayload);
        throw new ThermoraApiError(response.status, normalized);
      }

      // Handle empty 204 No Content
      if (response.status === 204) {
        return {} as T;
      }

      // Handle PDF or binary octet stream
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/pdf') || contentType.includes('application/octet-stream')) {
        return (await response.blob()) as unknown as T;
      }

      return (await response.json()) as T;
    } catch (err: any) {
      if (err instanceof ThermoraApiError) {
        throw err;
      }
      const normalized = normalizeError(err);
      throw new ThermoraApiError(0, normalized);
    }
  },

  get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return apiClient.request<T>('GET', endpoint, options);
  },

  post<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return apiClient.request<T>('POST', endpoint, {
      ...options,
      body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    });
  },

  patch<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return apiClient.request<T>('PATCH', endpoint, {
      ...options,
      body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    });
  },

  put<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return apiClient.request<T>('PUT', endpoint, {
      ...options,
      body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    });
  },

  delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return apiClient.request<T>('DELETE', endpoint, options);
  },

  upload<T>(endpoint: string, formData: FormData, options?: RequestOptions): Promise<T> {
    return apiClient.request<T>('POST', endpoint, {
      ...options,
      body: formData,
    });
  },
};
