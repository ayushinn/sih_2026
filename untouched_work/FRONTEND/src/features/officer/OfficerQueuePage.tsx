import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { officerQueries } from '../../api/queries/officer';
import { Application } from '../../api/types';
import { mapApplicationStatus, mapSeverity } from '../../lib/status-mappers';
import {
  ClipboardList,
  ArrowRight,
  GraduationCap,
  Building,
  Scale,
  Home,
  FileText,
  ShieldCheck,
} from 'lucide-react';

const INSTITUTION_NAMES: Record<string, string> = {
  'APP-2026-8810': "St. Xavier's Institute of Engineering & Technology",
  'APP-2026-9044': 'Apex Directorate of Management Studies',
  'APP-2026-3120': 'Horizon Knowledge Park Campus',
  'APP-2026-1188': 'Sovereign Educational & Charitable Trust',
  'APP-2026-5542': 'Metro Integrated Education & Research Zone',
  'APP-2026-7291': 'Global Polytechnic & Applied Sciences Campus',
};

export const OfficerQueuePage: React.FC = () => {
  const [queue, setQueue] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await officerQueries.getQueue();
        setQueue(res.items);
      } catch (err) {
        console.error('Failed to load officer queue:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const getSectorMeta = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('education')) {
      return {
        label: 'Education',
        badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
        icon: GraduationCap,
      };
    }
    if (cat.includes('campus')) {
      return {
        label: 'Campus Infra',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        icon: Building,
      };
    }
    if (cat.includes('legal')) {
      return {
        label: 'Legal & Compliance',
        badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
        icon: Scale,
      };
    }
    if (cat.includes('real estate')) {
      return {
        label: 'Real Estate',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
        icon: Home,
      };
    }
    return {
      label: 'Institutional',
      badgeClass: 'bg-gray-50 text-gray-700 border-gray-200',
      icon: FileText,
    };
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-line-light p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-brand font-semibold px-2 py-0.5 rounded bg-brand/10 border border-brand/20">
              OFFICIAL SCRUTINY BENCH
            </span>
            <span className="text-xs text-muted font-mono">Statutory Evaluation Register</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-ink font-sans mt-2">
            Officer Scrutiny Queue
          </h1>
          <p className="text-xs text-muted mt-1 font-sans">
            Ranked institutional applications awaiting statutory evaluation and final decision recording.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-muted bg-black/[0.03] px-3.5 py-2 rounded-xl">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Statutory Authority Reserved</span>
        </div>
      </div>

      {/* Queue Table */}
      <div className="bg-white rounded-2xl border border-line-light overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-16 text-center text-xs font-mono text-muted">
            <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading scrutiny queue...
          </div>
        ) : queue.length === 0 ? (
          <div className="py-16 text-center text-xs font-mono text-muted">
            <ClipboardList className="w-8 h-8 text-muted/30 mx-auto mb-3" />
            No pending applications in scrutiny queue.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-line-light bg-black/[0.015] font-mono text-[10px] uppercase tracking-wider text-muted">
                  <th className="py-3.5 px-6 font-semibold">Dossier</th>
                  <th className="py-3.5 px-4 font-semibold">Institution Name</th>
                  <th className="py-3.5 px-4 font-semibold">Target Sector</th>
                  <th className="py-3.5 px-4 font-semibold">Findings</th>
                  <th className="py-3.5 px-4 font-semibold">Severity</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-6 font-semibold text-right">Scrutiny Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-light">
                {queue.map((item) => {
                  const status = mapApplicationStatus(item.status);
                  const sev = mapSeverity(item.highest_severity || 'low');
                  const sectorMeta = getSectorMeta(item.category);
                  const SectorIcon = sectorMeta.icon;
                  const instName = INSTITUTION_NAMES[item.id] || 'Registered Technical Institute';

                  return (
                    <tr key={item.id} className="hover:bg-black/[0.015] transition-colors">
                      <td className="py-4 px-6 font-mono font-bold text-ink">
                        {item.id}
                      </td>
                      <td className="py-4 px-4 min-w-[200px]">
                        <p className="font-semibold text-ink text-sm font-sans truncate">{instName}</p>
                        <p className="text-muted text-[11px] truncate mt-0.5">{item.category}</p>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono border ${sectorMeta.badgeClass}`}
                        >
                          <SectorIcon className="w-3 h-3" />
                          <span>{sectorMeta.label}</span>
                        </span>
                      </td>
                      <td className="py-4 px-4 font-semibold text-ink font-mono">
                        {item.open_findings_count ?? 0} flags
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] ${sev.badgeClass}`}>
                          {sev.label}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] font-semibold border ${status.badgeClass}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <Link
                          to={`/applications/${item.id}`}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-brand text-white font-mono text-[11px] font-semibold hover:bg-brand-deep transition-all shadow-xs"
                        >
                          <span>Review</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
