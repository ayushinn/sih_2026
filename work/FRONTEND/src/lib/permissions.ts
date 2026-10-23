import { Role } from '../api/types';

export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  applicant: [
    '/app',
    '/applications',
    '/applications/new',
    '/applications/:id',
    '/applications/:id/upload',
    '/applications/:id/rectify',
    '/alerts',
    '/reports/:id',
  ],
  officer: [
    '/app',
    '/officer/queue',
    '/applications/:id',
    '/applications/:id/review',
    '/alerts',
    '/reports/:id',
  ],
  verifier: [
    '/app',
    '/verifications',
    '/applications/:id',
    '/alerts',
  ],
  admin: [
    '/app',
    '/admin/users',
    '/admin/checklists',
    '/audit',
    '/alerts',
    '/applications',
    '/applications/:id',
  ],
  auditor: [
    '/app',
    '/audit',
    '/reports/:id',
    '/applications/:id',
    '/alerts',
  ],
};

export function getHomeRouteForRole(role?: Role): string {
  switch (role) {
    case 'applicant':
      return '/app';
    case 'officer':
      return '/officer/queue';
    case 'verifier':
      return '/verifications';
    case 'admin':
      return '/admin/users';
    case 'auditor':
      return '/audit';
    default:
      return '/login';
  }
}

/**
 * Checks if a given path is permitted for a given user role.
 */
export function isRouteAllowed(role: Role | undefined, pathname: string): boolean {
  if (!role) return false;

  // Specific static routes that cannot be shadowed by /:id param
  if (pathname === '/applications/new') {
    return role === 'applicant';
  }

  const allowedPatterns = ROLE_PERMISSIONS[role] || [];

  return allowedPatterns.some((pattern) => {
    // Exact match
    if (pattern === pathname) return true;

    // Pattern with parameter e.g. /applications/:id or /applications/:id/review
    // Ensure :id does not match reserved segment "new"
    const regexPattern =
      '^' + pattern.replace(/:[a-zA-Z0-9_]+/g, '(?!new$|new/)[^/]+') + '$';
    return new RegExp(regexPattern).test(pathname);
  });
}
