/**
 * Environment configuration helper for THERMORA.
 *
 * Rules:
 * - Components must NEVER read import.meta.env or process.env directly.
 * - All network operations must go through src/api/client.ts.
 * - No secrets in VITE_* variables.
 */

export const env = {
  // Whether to use built-in mock server (true) or live backend (false)
  USE_MOCK: import.meta.env.VITE_USE_MOCK !== 'false',

  // Relative API prefix, e.g. "/api/v1"
  API_BASE_URL: (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, ''),

  // Proxy target used in dev
  PROXY_TARGET: import.meta.env.VITE_PROXY_TARGET || '',

  // Development environment check
  IS_DEV: import.meta.env.DEV,
} as const;
