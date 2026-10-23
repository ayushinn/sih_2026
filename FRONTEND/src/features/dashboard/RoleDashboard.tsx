import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { applicationQueries } from '../../api/queries/applications';
import { officerQueries } from '../../api/queries/officer';
import { alertQueries } from '../../api/queries/alerts';
import { Application, Alert } from '../../api/types';
import { mapApplicationStatus } from '../../lib/status-mappers';
import {
  FileText,
  ArrowRight,
  PlusCircle,
  Clock,
  TrendingUp,
  Activity,
  GraduationCap,
  Building,
  Scale,
  Home,
  ShieldCheck,
  CheckCircle,
  Database,
} from 'lucide-react';

// Institution mapping for realistic enterprise presentation
const INSTITUTION_NAMES: Record<string, string> = {
  'APP-2026-8810': "St. Xavier's Institute of Engineering & Technology",
  'APP-2026-9044': 'Apex Directorate of Management Studies',
  'APP-2026-3120': 'Horizon Knowledge Park Campus',
  'APP-2026-1188': 'Sovereign Educational & Charitable Trust',
  'APP-2026-5542': 'Metro Integrated Education & Research Zone',
  'APP-2026-7291': 'Global Polytechnic & Applied Sciences Campus',
};

const SECTOR_TAGS = [
  { id: 'all', label: 'All Sectors', icon: Activity },
  { id: 'education', label: 'Education', icon: GraduationCap, match: 'Education' },
  { id: 'campus', label: 'Campus Infrastructure', icon: Building, match: 'Campus' },
  { id: 'legal', label: 'Legal & Compliance', icon: Scale, match: 'Legal' },
  { id: 'realestate', label: 'Real Estate', icon: Home, match: 'Real Estate' },
];

export const RoleDashboard: React.FC = () => {
  const { user } = useAuth();
  const [apps, setApps] = useState<Application[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSector, setSelectedSector] = useState<string>('all');

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        if (user?.role === 'officer') {
          const q = await officerQueries.getQueue();
          if (isMounted) setApps(q.items);
        } else {
          const a = await applicationQueries.getApplications();
          if (isMounted) setApps(a.items);
        }
        const alt = await alertQueries.getAlerts();
        if (isMounted) setAlerts(alt.items);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [user]);

  const role = user?.role || 'applicant';

  // Filter applications by selected sector
  const filteredApps = useMemo(() => {
    if (selectedSector === 'all') return apps;
    const tag = SECTOR_TAGS.find((s) => s.id === selectedSector);
    if (!tag?.match) return apps;
    return apps.filter((a) => a.category.toLowerCase().includes(tag.match.toLowerCase()));
  }, [apps, selectedSector]);

  // Sector stats
  const sectorCounts = useMemo(() => {
    const counts: Record<string, number> = {
      education: 0,
      campus: 0,
      legal: 0,
      realestate: 0,
    };
    apps.forEach((a) => {
      const cat = a.category.toLowerCase();
      if (cat.includes('education')) counts.education++;
      else if (cat.includes('campus')) counts.campus++;
      else if (cat.includes('legal')) counts.legal++;
      else if (cat.includes('real estate')) counts.realestate++;
    });
    return counts;
  }, [apps]);

  const getSectorMeta = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('education')) {
      return {
        label: 'Education Sector',
        badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
        icon: GraduationCap,
      };
    }
    if (cat.includes('campus')) {
      return {
        label: 'Campus Infrastructure',
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
      {/* Top Greeting & Scrutiny Context Bar */}
      <div className="bg-white rounded-2xl border border-line-light p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-brand font-semibold px-2 py-0.5 rounded bg-brand/10 border border-brand/20">
              {role.toUpperCase()} SCRUTINY CONSOLE
            </span>
            <span className="text-xs text-muted font-mono">
              Statutory Jurisdiction: {user?.institution_id || 'CENTRAL REGULATORY CELL'}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-ink font-sans mt-2">
            Institutional Verification Portal
          </h1>
          <p className="text-xs text-muted mt-1 font-sans">
            Cross-verifying Education, Campus Infrastructure, Legal Governance, and Real Estate records.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {role === 'applicant' && (
            <Link
              to="/applications/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand text-white text-xs font-mono font-semibold tracking-wider hover:bg-brand-deep transition-all shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              NEW SUBMISSION
            </Link>
          )}
          {role === 'officer' && (
            <Link
              to="/officer/queue"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand text-white text-xs font-mono font-semibold tracking-wider hover:bg-brand-deep transition-all shadow-sm"
            >
              <TrendingUp className="w-4 h-4" />
              SCRUTINY QUEUE ({apps.length})
            </Link>
          )}
        </div>
      </div>

      {/* Target Sectors Verification KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Education Sector KPI */}
        <div
          onClick={() => setSelectedSector('education')}
          className={`bg-white rounded-2xl border p-4 cursor-pointer transition-all hover:shadow-md ${
            selectedSector === 'education' ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-sm' : 'border-line-light'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[10px] uppercase tracking-wider text-blue-700 font-semibold">
              Education Sector
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <GraduationCap className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-bold font-sans text-ink">{sectorCounts.education}</p>
          <p className="text-[11px] text-muted mt-1">Degrees & Affiliations</p>
        </div>

        {/* Campus Infrastructure KPI */}
        <div
          onClick={() => setSelectedSector('campus')}
          className={`bg-white rounded-2xl border p-4 cursor-pointer transition-all hover:shadow-md ${
            selectedSector === 'campus' ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm' : 'border-line-light'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-700 font-semibold">
              Campus Infrastructure
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Building className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-bold font-sans text-ink">{sectorCounts.campus}</p>
          <p className="text-[11px] text-muted mt-1">Land Deeds & Fire NOC</p>
        </div>

        {/* Legal & Compliance KPI */}
        <div
          onClick={() => setSelectedSector('legal')}
          className={`bg-white rounded-2xl border p-4 cursor-pointer transition-all hover:shadow-md ${
            selectedSector === 'legal' ? 'border-purple-500 ring-2 ring-purple-500/20 shadow-sm' : 'border-line-light'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[10px] uppercase tracking-wider text-purple-700 font-semibold">
              Legal Compliance
            </span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Scale className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-bold font-sans text-ink">{sectorCounts.legal}</p>
          <p className="text-[11px] text-muted mt-1">Trust Deeds & Societies 1860</p>
        </div>

        {/* Real Estate KPI */}
        <div
          onClick={() => setSelectedSector('realestate')}
          className={`bg-white rounded-2xl border p-4 cursor-pointer transition-all hover:shadow-md ${
            selectedSector === 'realestate' ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-sm' : 'border-line-light'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[10px] uppercase tracking-wider text-amber-700 font-semibold">
              Real Estate & Title
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Home className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-bold font-sans text-ink">{sectorCounts.realestate}</p>
          <p className="text-[11px] text-muted mt-1">30-Yr Encumbrance & Deeds</p>
        </div>
      </div>

      {/* Main Grid: Applications Table (2/3) + Regulatory Cockpit (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Applications Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-line-light overflow-hidden shadow-xs">
          {/* Header & Sector Filter Tabs */}
          <div className="p-5 border-b border-line-light space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-base text-ink font-sans">
                  {role === 'officer' ? 'Active Scrutiny Queue' : 'Institutional Applications'}
                </h2>
                <p className="text-xs text-muted font-sans mt-0.5">
                  Showing {filteredApps.length} records matching regulatory filter
                </p>
              </div>
              <Link
                to={role === 'officer' ? '/officer/queue' : '/applications'}
                className="text-xs font-mono text-brand font-medium hover:underline flex items-center gap-1"
              >
                <span>Full Ledger</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Sector Filter Chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {SECTOR_TAGS.map((tag) => {
                const isSelected = selectedSector === tag.id;
                const Icon = tag.icon;
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => setSelectedSector(tag.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-ink text-white font-semibold shadow-xs'
                        : 'bg-black/[0.04] text-muted hover:bg-black/[0.08] hover:text-ink'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{tag.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Table / List */}
          {loading ? (
            <div className="py-16 text-center">
              <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-muted font-mono">Synchronizing regulatory state…</p>
            </div>
          ) : filteredApps.length === 0 ? (
            <div className="py-16 text-center">
              <FileText className="w-8 h-8 text-muted/30 mx-auto mb-3" />
              <p className="text-sm text-muted">No applications found in this sector</p>
              <button
                type="button"
                onClick={() => setSelectedSector('all')}
                className="mt-2 text-xs text-brand font-medium hover:underline"
              >
                Reset to all sectors
              </button>
            </div>
          ) : (
            <div className="divide-y divide-line-light">
              {filteredApps.map((app) => {
                const status = mapApplicationStatus(app.status);
                const sectorMeta = getSectorMeta(app.category);
                const SectorIcon = sectorMeta.icon;
                const instName = INSTITUTION_NAMES[app.id] || 'Registered Technical Institute';

                return (
                  <Link
                    key={app.id}
                    to={`/applications/${app.id}`}
                    className="p-5 hover:bg-black/[0.02] transition-colors block group"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="min-w-0 flex items-start gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                          <SectorIcon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-bold text-ink">
                              {app.id}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono border ${sectorMeta.badgeClass}`}
                            >
                              {sectorMeta.label}
                            </span>
                            {app.open_findings_count > 0 && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-50 text-amber-700 border border-amber-200 font-semibold">
                                {app.open_findings_count} Flagged
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-semibold text-ink mt-1 font-sans truncate group-hover:text-brand transition-colors">
                            {instName}
                          </p>
                          <p className="text-xs text-muted mt-0.5 font-sans truncate">
                            {app.category}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 sm:self-center pl-13 sm:pl-0">
                        <span
                          className={`px-2.5 py-1 rounded-full font-mono text-[10px] font-semibold border ${status.badgeClass}`}
                        >
                          {status.label}
                        </span>
                        <ArrowRight className="w-4 h-4 text-muted group-hover:text-brand group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Regulatory Feeds & Safeguard Matrix */}
        <div className="space-y-6">
          {/* Target Sectors Verification Status */}
          <div className="bg-white rounded-2xl border border-line-light p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-brand" />
              <h3 className="font-bold text-sm text-ink font-sans">
                Target Scrutiny Framework
              </h3>
            </div>
            <p className="text-xs text-muted mb-4 leading-relaxed font-sans">
              Statutory validation standards applied across active scrutiny queues:
            </p>

            <div className="space-y-3 font-sans">
              <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100 flex items-start gap-2.5">
                <GraduationCap className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-blue-900">Education Sector</p>
                  <p className="text-[11px] text-blue-700/80 mt-0.5">
                    Degrees, mark-sheets, and faculty rosters checked via university registries.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 flex items-start gap-2.5">
                <Building className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-emerald-900">Campus Infrastructure</p>
                  <p className="text-[11px] text-emerald-700/80 mt-0.5">
                    Land deeds, municipal floor plans, and Fire NOC clearances cross-matched.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-purple-50/50 border border-purple-100 flex items-start gap-2.5">
                <Scale className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-purple-900">Legal Compliance</p>
                  <p className="text-[11px] text-purple-700/80 mt-0.5">
                    Societies Registration Act 1860, trust deeds, and notarial affidavits verified.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-100 flex items-start gap-2.5">
                <Home className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-amber-900">Real Estate Scrutiny</p>
                  <p className="text-[11px] text-amber-700/80 mt-0.5">
                    30-year non-encumbrance certificates and mutation extracts validated.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Connected Statutory Registries */}
          <div className="bg-white rounded-2xl border border-line-light p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-ink font-sans flex items-center gap-2">
                <Database className="w-4 h-4 text-muted" />
                <span>Statutory Registries</span>
              </h3>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            <div className="space-y-2 text-xs font-mono">
              {[
                { name: 'State Land Revenue Records', status: 'ONLINE', ping: '12ms' },
                { name: 'University Affiliation Directory', status: 'ONLINE', ping: '18ms' },
                { name: 'Registrar of Societies (1860)', status: 'ONLINE', ping: '24ms' },
                { name: 'Fire Safety Clearance API', status: 'ONLINE', ping: '15ms' },
              ].map((reg, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-black/[0.02]"
                >
                  <span className="text-muted text-[11px] truncate">{reg.name}</span>
                  <span className="text-[10px] text-emerald-600 font-semibold shrink-0">
                    {reg.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Alerts Feed */}
          <div className="bg-white rounded-2xl border border-line-light overflow-hidden shadow-xs">
            <div className="px-5 py-4 border-b border-line-light flex items-center justify-between">
              <h3 className="font-bold text-sm text-ink font-sans">Regulatory Alerts</h3>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold">
                {alerts.length} PENDING
              </span>
            </div>

            {alerts.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <CheckCircle className="w-6 h-6 text-emerald-500/50 mx-auto mb-2" />
                <p className="text-xs text-muted">No pending alerts</p>
              </div>
            ) : (
              <div className="divide-y divide-line-light">
                {alerts.slice(0, 3).map((alert) => (
                  <div key={alert.id} className="p-4 hover:bg-black/[0.02] transition-colors">
                    <div className="flex items-start gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-ink leading-tight">
                          {alert.message || alert.type}
                        </p>
                        <p className="text-[11px] text-muted mt-1 flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3" />
                          {new Date(alert.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                <Link
                  to="/alerts"
                  className="block p-3 text-center text-xs font-mono text-brand font-semibold hover:underline bg-black/[0.01]"
                >
                  View all alerts →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
