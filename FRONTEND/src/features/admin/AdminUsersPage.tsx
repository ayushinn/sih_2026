import React, { useEffect, useState } from 'react';
import { adminQueries } from '../../api/queries/admin';
import { User, Role } from '../../api/types';
import { Users, Shield, ShieldAlert, Check, RefreshCw, Lock, AlertCircle } from 'lucide-react';

const AVAILABLE_ROLES: Role[] = ['applicant', 'officer', 'verifier', 'admin', 'auditor'];

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roleChangeNotice, setRoleChangeNotice] = useState<string | null>(null);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminQueries.getUsers();
      setUsers(res);
    } catch (err: any) {
      console.error('Failed to load users:', err);
      setError(err?.message || 'Failed to load user directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: Role) => {
    try {
      const updated = await adminQueries.updateUserRole(userId, newRole);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      setRoleChangeNotice(`Assigned role '${newRole.toUpperCase()}' to user ${updated.email}.`);
      setTimeout(() => setRoleChangeNotice(null), 4000);
    } catch (err: any) {
      console.error('Failed to update role:', err);
      alert(err?.message || 'Could not update user role.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-line-light pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-muted">
            SYSTEM GOVERNANCE & ACCESS CONTROL
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink font-sans mt-1">
            User Directory & Role Provisioning
          </h1>
          <p className="text-xs text-muted mt-1 max-w-2xl">
            Role-based authorization mappings across institutions, scrutiny desks, and audit cells.
          </p>
        </div>

        <button
          type="button"
          onClick={loadUsers}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line-light bg-paper/60 text-xs font-mono text-ink hover:border-brand self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Directory</span>
        </button>
      </div>

      {/* Critical Regulatory Governance Notice: Admin Has No Decision Control */}
      <div className="p-4 rounded-xl border border-line-light bg-paper/60 flex items-start gap-3 text-xs">
        <Lock className="w-4 h-4 text-brand shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-ink font-sans">
            Strict Separation of Powers: Administrators Have No Scrutiny Decision Authority
          </p>
          <p className="text-muted leading-relaxed">
            Under statutory regulatory scrutiny guidelines, regulatory decisions (Approve, Return for Rectification, Reject)
            are strictly restricted to accredited Scrutiny Officers. Administrators manage checklists, rules, and user
            roles, but cannot record decisions or alter application compliance outcomes.
          </p>
        </div>
      </div>

      {/* Role Change Success Notice */}
      {roleChangeNotice && (
        <div role="status" className="p-3 rounded-xl border border-ok/30 bg-tint-ok text-ok text-xs font-mono flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{roleChangeNotice}</span>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white/80 rounded-2xl border border-line-light shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs font-mono text-muted">
            Loading user directory...
          </div>
        ) : error ? (
          <div role="alert" className="p-5 text-xs font-mono text-danger bg-tint-danger">
            {error}
          </div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center text-xs font-mono text-muted">
            No registered users found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-line-light bg-black/[0.02] font-mono text-[11px] uppercase tracking-wider text-muted">
                  <th className="px-5 py-3.5 font-semibold">Official Name</th>
                  <th className="px-5 py-3.5 font-semibold">Email</th>
                  <th className="px-5 py-3.5 font-semibold">Assigned Role</th>
                  <th className="px-5 py-3.5 font-semibold">Institution Scope</th>
                  <th className="px-5 py-3.5 font-semibold text-right">Role Management</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-light">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-black/[0.01] transition-colors">
                    <td className="px-5 py-4 font-medium text-ink">
                      <div>{u.name || 'Official User'}</div>
                      <div className="font-mono text-[10px] text-muted">{u.id}</div>
                    </td>
                    <td className="px-5 py-4 font-mono text-muted">{u.email}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`font-mono text-[10px] px-2.5 py-0.5 rounded-full uppercase font-semibold border ${
                          u.role === 'officer'
                            ? 'bg-tint-brand text-brand border-brand/30'
                            : u.role === 'admin'
                            ? 'bg-tint-info text-info border-info/30'
                            : u.role === 'verifier'
                            ? 'bg-tint-warn text-warn border-warn/30'
                            : u.role === 'auditor'
                            ? 'bg-tint-ok text-ok border-ok/30'
                            : 'bg-muted/10 text-muted border-muted/20'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-mono text-muted">
                      {u.institution_id || 'System-wide Regulatory'}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value as Role)}
                        aria-label={`Change role for ${u.email}`}
                        className="font-mono text-xs px-2 py-1 rounded-lg border border-line-light bg-paper text-ink focus:outline-none focus:border-brand"
                      >
                        {AVAILABLE_ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r.toUpperCase()}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
