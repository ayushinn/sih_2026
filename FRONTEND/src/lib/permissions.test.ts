import { describe, it, expect } from 'vitest';
import { isRouteAllowed, getHomeRouteForRole } from './permissions';
import { Role } from '../api/types';

describe('Role-Based Route Guard Matrix', () => {
  const ALL_ROLES: Role[] = ['applicant', 'officer', 'verifier', 'admin', 'auditor'];

  const ROUTES_MATRIX: { route: string; allowedRoles: Role[] }[] = [
    {
      route: '/app',
      allowedRoles: ['applicant', 'officer', 'verifier', 'admin', 'auditor'],
    },
    {
      route: '/applications',
      allowedRoles: ['applicant', 'admin'],
    },
    {
      route: '/applications/new',
      allowedRoles: ['applicant'],
    },
    {
      route: '/applications/APP-2026-8810',
      allowedRoles: ['applicant', 'officer', 'verifier', 'admin', 'auditor'],
    },
    {
      route: '/applications/APP-2026-8810/upload',
      allowedRoles: ['applicant'],
    },
    {
      route: '/applications/APP-2026-8810/rectify',
      allowedRoles: ['applicant'],
    },
    {
      route: '/applications/APP-2026-8810/review',
      allowedRoles: ['officer'],
    },
    {
      route: '/officer/queue',
      allowedRoles: ['officer'],
    },
    {
      route: '/verifications',
      allowedRoles: ['verifier'],
    },
    {
      route: '/alerts',
      allowedRoles: ['applicant', 'officer', 'verifier', 'admin', 'auditor'],
    },
    {
      route: '/reports/APP-2026-8810',
      allowedRoles: ['applicant', 'officer', 'auditor'],
    },
    {
      route: '/admin/users',
      allowedRoles: ['admin'],
    },
    {
      route: '/admin/checklists',
      allowedRoles: ['admin'],
    },
    {
      route: '/audit',
      allowedRoles: ['admin', 'auditor'],
    },
  ];

  // Test every single combination of role and route
  ROUTES_MATRIX.forEach(({ route, allowedRoles }) => {
    describe(`Route: ${route}`, () => {
      ALL_ROLES.forEach((role) => {
        const shouldBeAllowed = allowedRoles.includes(role);
        it(`${role} should be ${shouldBeAllowed ? 'ALLOWED' : 'FORBIDDEN (routed to 403)'}`, () => {
          const allowed = isRouteAllowed(role, route);
          expect(allowed).toBe(shouldBeAllowed);
        });
      });
    });
  });

  describe('Non-authenticated or undefined role', () => {
    it('rejects access to any protected route when role is undefined', () => {
      expect(isRouteAllowed(undefined, '/app')).toBe(false);
      expect(isRouteAllowed(undefined, '/officer/queue')).toBe(false);
      expect(isRouteAllowed(undefined, '/admin/users')).toBe(false);
    });
  });

  describe('Home Route Destination per Role', () => {
    it('maps applicant to /app', () => {
      expect(getHomeRouteForRole('applicant')).toBe('/app');
    });

    it('maps officer to /officer/queue', () => {
      expect(getHomeRouteForRole('officer')).toBe('/officer/queue');
    });

    it('maps verifier to /verifications', () => {
      expect(getHomeRouteForRole('verifier')).toBe('/verifications');
    });

    it('maps admin to /admin/users', () => {
      expect(getHomeRouteForRole('admin')).toBe('/admin/users');
    });

    it('maps auditor to /audit', () => {
      expect(getHomeRouteForRole('auditor')).toBe('/audit');
    });

    it('defaults to /login for invalid role', () => {
      expect(getHomeRouteForRole(undefined)).toBe('/login');
    });
  });
});
