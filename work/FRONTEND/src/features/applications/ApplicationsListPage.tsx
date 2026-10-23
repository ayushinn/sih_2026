import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { applicationQueries } from '../../api/queries/applications';
import { Application } from '../../api/types';
import { mapApplicationStatus } from '../../lib/status-mappers';
import {
  PlusCircle,
  Search,
  ArrowRight,
  FileText,
  GraduationCap,
  Building,
  Scale,
  Home,
  Activity,
} from 'lucide-react';

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

export const ApplicationsListPage: React.FC = () => {
  const { user } = useAuth();
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState('all');

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await applicationQueries.getApplications();
        setApps(res.items);
      } catch (err) {
        console.error('Failed to load applications:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    return apps.filter((a) => {
      const matchesSearch =
        a.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (INSTITUTION_NAMES[a.id] || '').toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;
      if (selectedSector === 'all') return true;

      const tag = SECTOR_TAGS.find((s) => s.id === selectedSector);
      if (!tag?.match) return true;
      return a.category.toLowerCase().includes(tag.match.toLowerCase());
    });
  }, [apps, searchTerm, selectedSector]);

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
        label: 'Legal Compliance',
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
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted">Statutory Repository</p>
          <h1 className="text-2xl font-bold tracking-tight text-ink font-sans mt-1">
            Application Dossiers
          </h1>
          <p className="text-xs text-muted font-sans mt-1">
            Verified submissions across Education, Campus Infrastructure, Legal Compliance, and Real Estate.
          </p>
        </div>

        {user?.role === 'applicant' && (
          <Link
            to="/applications/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand text-white text-xs font-mono font-semibold tracking-wider hover:bg-brand-deep transition-all shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            NEW SUBMISSION
          </Link>
        )}
      </div>

      {/* Sector filter tabs + Search bar */}
      <div className="bg-white rounded-2xl border border-line-light p-4 space-y-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          {SECTOR_TAGS.map((tag) => {
            const isSelected = selectedSector === tag.id;
            const Icon = tag.icon;
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => setSelectedSector(tag.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-ink text-white font-semibold shadow-xs'
                    : 'bg-black/[0.04] text-muted hover:bg-black/[0.08] hover:text-ink'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tag.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 bg-black/[0.02] border border-line-light rounded-xl px-4 py-2.5 focus-within:border-brand/50 focus-within:bg-white transition-colors">
          <Search className="w-4 h-4 text-muted/50 shrink-0" />
          <input
            type="text"
            placeholder="Search by Application ID, Institution Name, or Category…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none outline-none text-sm text-ink placeholder:text-muted/50 w-full font-sans"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-line-light overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-muted font-mono">Loading records…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <FileText className="w-8 h-8 text-muted/30 mx-auto mb-3" />
            <p className="text-sm text-muted">
              {searchTerm || selectedSector !== 'all' ? 'No matching dossiers found' : 'No applications found'}
            </p>
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div className="hidden md:grid md:grid-cols-[1.5fr_3fr_1.5fr_1fr_auto] gap-4 px-6 py-3.5 border-b border-line-light bg-black/[0.015]">
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted font-semibold">
                Dossier ID
              </span>
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted font-semibold">
                Institution & Scope
              </span>
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted font-semibold">
                Target Sector
              </span>
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted font-semibold">
                Status
              </span>
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted font-semibold text-right">
                Review
              </span>
            </div>

            {/* Rows */}
            <div className="divide-y divide-line-light">
              {filtered.map((app) => {
                const status = mapApplicationStatus(app.status);
                const sectorMeta = getSectorMeta(app.category);
                const instName = INSTITUTION_NAMES[app.id] || 'Registered Educational Institution';
                const SectorIcon = sectorMeta.icon;

                return (
                  <Link
                    key={app.id}
                    to={`/applications/${app.id}`}
                    className="flex flex-col md:grid md:grid-cols-[1.5fr_3fr_1.5fr_1fr_auto] gap-2 md:gap-4 px-6 py-4 hover:bg-black/[0.015] transition-colors items-start md:items-center group"
                  >
                    <div>
                      <span className="font-mono text-xs font-bold text-ink group-hover:text-brand transition-colors">
                        {app.id}
                      </span>
                      <p className="text-[11px] font-mono text-muted/70 mt-0.5">
                        {new Date(app.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink font-sans truncate group-hover:text-brand transition-colors">
                        {instName}
                      </p>
                      <p className="text-xs text-muted truncate mt-0.5 font-sans">
                        {app.category}
                      </p>
                    </div>

                    <div>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-mono border ${sectorMeta.badgeClass}`}
                      >
                        <SectorIcon className="w-3 h-3" />
                        <span>{sectorMeta.label}</span>
                      </span>
                    </div>

                    <div>
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full font-mono text-[10px] font-semibold border ${status.badgeClass}`}
                      >
                        {status.label}
                      </span>
                    </div>

                    <div className="text-right">
                      <ArrowRight className="w-4 h-4 text-muted group-hover:text-brand group-hover:translate-x-1 transition-all inline" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Footer count */}
      {!loading && (
        <div className="flex items-center justify-between text-xs font-mono text-muted px-1">
          <span>Displaying {filtered.length} of {apps.length} verified dossiers</span>
          <span>DOCKEXPERT Statutory Audit Engine</span>
        </div>
      )}
    </div>
  );
};
