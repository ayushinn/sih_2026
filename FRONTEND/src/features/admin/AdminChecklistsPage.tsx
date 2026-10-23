import React, { useEffect, useState } from 'react';
import { adminQueries } from '../../api/queries/admin';
import { Checklist, Rule } from '../../api/types';
import { Sliders, ShieldAlert, Layers, Plus, CheckCircle, XCircle, BookOpen, AlertCircle, RefreshCw } from 'lucide-react';

export const AdminChecklistsPage: React.FC = () => {
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [successNote, setSuccessNote] = useState<string | null>(null);

  const loadChecklists = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminQueries.getChecklists();
      setChecklists(res);
    } catch (err: any) {
      console.error('Failed to load checklists:', err);
      setError(err?.message || 'Failed to load checklists');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChecklists();
  }, []);

  const handleToggleActive = async (chk: Checklist) => {
    try {
      const updated = await adminQueries.updateChecklist(chk.id, {
        active: !chk.active,
      });
      setChecklists((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setSuccessNote(`Checklist ${chk.id} is now ${!chk.active ? 'ACTIVE' : 'INACTIVE'}.`);
      setTimeout(() => setSuccessNote(null), 4000);
    } catch (err: any) {
      console.error('Failed to update checklist active state:', err);
      alert(err?.message || 'Could not update checklist state.');
    }
  };

  const filteredChecklists = checklists.filter((c) => {
    if (activeFilter === 'active') return c.active;
    if (activeFilter === 'inactive') return !c.active;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-line-light pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-muted">
            REGULATORY COMPLIANCE SPECIFICATIONS · STATUTORY HANDBOOK 2026-27
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink font-sans mt-1">
            Checklists & Statutory Rules
          </h1>
          <p className="text-xs text-muted mt-1 max-w-2xl">
            Version-controlled rule checklists mapped against the official Approval Process Handbook.
            Active rules are evaluated during pre-check validation and officer scrutiny.
          </p>
        </div>

        <button
          type="button"
          onClick={loadChecklists}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line-light bg-paper/60 text-xs font-mono text-ink hover:border-brand self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Reload Rules</span>
        </button>
      </div>

      {/* Success Notification */}
      {successNote && (
        <div role="status" className="p-3 rounded-xl border border-ok/30 bg-tint-ok text-ok text-xs font-mono flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{successNote}</span>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2">
        {(['all', 'active', 'inactive'] as const).map((filterKey) => (
          <button
            key={filterKey}
            type="button"
            onClick={() => setActiveFilter(filterKey)}
            className={`px-3 py-1.5 rounded-full text-xs font-mono capitalize transition-all border ${
              activeFilter === filterKey
                ? 'bg-ink text-paper border-ink font-semibold'
                : 'bg-paper/80 text-muted border-line-light hover:border-ink/30'
            }`}
          >
            {filterKey} ({filterKey === 'all' ? checklists.length : checklists.filter((c) => filterKey === 'active' ? c.active : !c.active).length})
          </button>
        ))}
      </div>

      {/* Checklists List */}
      <div className="space-y-6">
        {loading ? (
          <div className="py-16 text-center text-xs font-mono text-muted bg-white/80 rounded-2xl border border-line-light">
            Loading statutory checklist definitions...
          </div>
        ) : error ? (
          <div role="alert" className="p-5 text-xs font-mono text-danger bg-tint-danger rounded-2xl border border-danger/30">
            {error}
          </div>
        ) : filteredChecklists.length === 0 ? (
          <div className="py-16 text-center text-xs font-mono text-muted bg-white/80 rounded-2xl border border-line-light">
            No checklists found.
          </div>
        ) : (
          filteredChecklists.map((chk) => (
            <div
              key={chk.id}
              className="bg-white/90 rounded-2xl border border-line-light p-6 shadow-xs space-y-4"
            >
              {/* Header with version, active state, and category */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-line-light gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="font-semibold text-ink text-base font-sans">{chk.category}</h2>
                    <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-paper border border-line-light text-brand-deep font-semibold">
                      v{chk.version}.0
                    </span>
                    <span
                      className={`font-mono text-[10px] px-2.5 py-0.5 rounded-full uppercase font-semibold border ${
                        chk.active
                          ? 'bg-tint-ok text-ok border-ok/30'
                          : 'bg-muted/10 text-muted border-muted/20'
                      }`}
                    >
                      {chk.active ? 'Active Checklist' : 'Inactive'}
                    </span>
                  </div>
                  <p className="font-mono text-[11px] text-muted">
                    Checklist ID: <span className="text-ink">{chk.id}</span> · Standardized for 2026-2027 Scrutiny Cycle
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(chk)}
                    className="px-3 py-1.5 rounded-lg border border-line-light bg-paper text-xs font-mono text-ink hover:border-brand transition-colors"
                  >
                    {chk.active ? 'Deactivate' : 'Activate Checklist'}
                  </button>
                </div>
              </div>

              {/* Rules Table / Hairline rows with Statutory Source References */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-mono text-[11px] uppercase tracking-wider text-muted font-semibold">
                    Enforced Statutory Scrutiny Rules ({chk.rules.length})
                  </p>
                  <span className="font-mono text-[10px] text-muted">
                    Evaluated during OCR pipeline
                  </span>
                </div>

                <div className="divide-y divide-line-light border border-line-light rounded-xl overflow-hidden bg-paper/30">
                  {chk.rules.map((rule: Rule) => (
                    <div
                      key={rule.id}
                      className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-paper/60 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-brand-deep">{rule.id}</span>
                          <span className="font-mono text-[10px] text-muted uppercase px-1.5 py-0.2 rounded bg-black/[0.04]">
                            {rule.rule_type}
                          </span>
                        </div>
                        {/* Statutory Source Reference */}
                        <div className="flex items-center gap-1.5 text-muted text-[11px]">
                          <BookOpen className="w-3.5 h-3.5 text-brand shrink-0" />
                          <span className="font-sans">
                            Statutory Reference:{' '}
                            <strong className="text-ink font-medium">{rule.source_ref || 'Statutory Compliance Handbook General Regulation'}</strong>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-auto">
                        <span
                          className={`font-mono text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full border ${
                            rule.severity === 'high'
                              ? 'bg-tint-danger text-danger border-danger/30'
                              : rule.severity === 'medium'
                              ? 'bg-tint-warn text-warn border-warn/30'
                              : 'bg-tint-brand text-brand border-brand/30'
                          }`}
                        >
                          {rule.severity || 'low'} severity
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
