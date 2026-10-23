import React, { useEffect, useState, useMemo } from 'react';
import { auditQueries } from '../../api/queries/audit';
import { AuditEntry } from '../../api/types';
import { Lock, Search, Filter, ShieldCheck, RefreshCw, Hash, Calendar, Info } from 'lucide-react';

export const AuditPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await auditQueries.getAuditLogs();
      setLogs(res.items);
    } catch (err: any) {
      console.error('Failed to load audit logs:', err);
      setError(err?.message || 'Failed to retrieve immutable audit chain');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (roleFilter !== 'all' && log.role !== roleFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesActor = log.actor_id.toLowerCase().includes(q);
        const matchesAction = log.action.toLowerCase().includes(q);
        const matchesTarget = (log.object_ref || '').toLowerCase().includes(q);
        const matchesReq = (log.request_id || '').toLowerCase().includes(q);
        const summaryStr = typeof log.summary === 'string' ? log.summary : JSON.stringify(log.summary);
        const matchesSummary = summaryStr.toLowerCase().includes(q);
        if (!matchesActor && !matchesAction && !matchesTarget && !matchesReq && !matchesSummary) {
          return false;
        }
      }
      return true;
    });
  }, [logs, roleFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-line-light pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-muted">
            REGULATORY ACCOUNTABILITY STREAM · STRICT READ-ONLY AUDIT
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink font-sans mt-1">
            Tamper-Evident Audit Chain
          </h1>
          <p className="text-xs text-muted mt-1 max-w-2xl">
            Append-only, immutable regulatory event log. By statutory design, audit entries cannot be edited,
            modified, or deleted by any administrative or scrutiny role.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-tint-ok border border-ok/20 text-ok font-mono text-xs">
            <Lock className="w-3.5 h-3.5" />
            <span>IMMUTABLE / APPEND-ONLY</span>
          </div>

          <button
            type="button"
            onClick={loadAuditLogs}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line-light bg-paper/60 text-xs font-mono text-ink hover:border-brand"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Stream</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Role Filters */}
        <div className="flex flex-wrap items-center gap-1.5" role="toolbar" aria-label="Role filters">
          {['all', 'applicant', 'officer', 'verifier', 'admin', 'auditor'].map((r) => {
            const isSelected = roleFilter === r;
            const count = r === 'all' ? logs.length : logs.filter((l) => l.role === r).length;
            return (
              <button
                key={r}
                type="button"
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1.5 rounded-full text-xs font-mono transition-all uppercase border ${
                  isSelected
                    ? 'bg-ink text-paper border-ink font-semibold'
                    : 'bg-paper/80 text-muted border-line-light hover:border-ink/30'
                }`}
              >
                <span>{r}</span>
                <span className={`ml-1.5 text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-paper/20' : 'bg-black/[0.05]'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[260px]">
          <Search className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search action, actor, target ref, or request ID..."
            aria-label="Search audit records"
            className="w-full pl-9 pr-3 py-1.5 text-xs font-mono rounded-lg border border-line-light bg-paper/60 text-ink placeholder:text-muted/60 focus:outline-none focus:border-brand"
          />
        </div>
      </div>

      {/* Audit Log Table (Strictly Read-Only: ZERO edit or delete controls) */}
      <div className="bg-white/80 rounded-2xl border border-line-light shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs font-mono text-muted flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-brand" />
            <span>Verifying cryptographic log signatures...</span>
          </div>
        ) : error ? (
          <div role="alert" className="p-5 text-xs font-mono text-danger bg-tint-danger">
            {error}
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-16 text-center text-xs font-mono text-muted flex flex-col items-center justify-center gap-2">
            <Info className="w-5 h-5 text-muted/60" />
            <span>No audit events match your search filters.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-line-light bg-black/[0.02] font-mono text-[11px] uppercase tracking-wider text-muted">
                  <th className="px-5 py-3.5 font-semibold">Timestamp (UTC)</th>
                  <th className="px-5 py-3.5 font-semibold">Actor & Role</th>
                  <th className="px-5 py-3.5 font-semibold">Regulatory Action</th>
                  <th className="px-5 py-3.5 font-semibold">Target Object</th>
                  <th className="px-5 py-3.5 font-semibold">Event Summary</th>
                  <th className="px-5 py-3.5 font-semibold font-mono">Request ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-light font-mono text-[11px]">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-black/[0.01] transition-colors">
                    <td className="px-5 py-3.5 text-muted whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-semibold text-ink">{log.actor_id}</span>
                      <span className="ml-1.5 px-2 py-0.5 rounded-full bg-paper border border-line-light uppercase text-[9px] font-semibold text-brand">
                        {log.role}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-brand-deep">
                      {log.action}
                    </td>
                    <td className="px-5 py-3.5 text-ink">
                      {log.object_ref ? (
                        <span className="px-2 py-0.5 rounded bg-black/[0.03] font-semibold">
                          {log.object_ref}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-sans text-muted max-w-sm truncate" title={typeof log.summary === 'string' ? log.summary : JSON.stringify(log.summary)}>
                      {typeof log.summary === 'string' ? log.summary : JSON.stringify(log.summary)}
                    </td>
                    <td className="px-5 py-3.5 text-muted/70 whitespace-nowrap font-mono text-[10px]">
                      {log.request_id || '—'}
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
