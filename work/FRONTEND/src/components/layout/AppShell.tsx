import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { DemoRibbon } from './DemoRibbon';
import {
  FileText,
  PlusCircle,
  ClipboardList,
  CheckCircle2,
  Bell,
  Users,
  Sliders,
  History,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Shield,
  Search,
  LayoutDashboard,
} from 'lucide-react';

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

const ROLE_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  applicant: { bg: 'bg-brand/15', text: 'text-brand', dot: 'bg-brand' },
  officer: { bg: 'bg-info/15', text: 'text-info', dot: 'bg-info' },
  verifier: { bg: 'bg-ok/15', text: 'text-ok', dot: 'bg-ok' },
  admin: { bg: 'bg-warn/15', text: 'text-warn', dot: 'bg-warn' },
  auditor: { bg: 'bg-muted/15', text: 'text-muted', dot: 'bg-muted' },
};

export const AppShell: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const role = user?.role || 'applicant';
  const roleStyle = ROLE_COLORS[role] || ROLE_COLORS.applicant;

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const getNavItems = (): NavItem[] => {
    switch (role) {
      case 'applicant':
        return [
          { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { label: 'Applications', path: '/applications', icon: FileText },
          { label: 'New Application', path: '/applications/new', icon: PlusCircle },
          { label: 'Alerts', path: '/alerts', icon: Bell },
        ];
      case 'officer':
        return [
          { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { label: 'Scrutiny Queue', path: '/officer/queue', icon: ClipboardList },
          { label: 'Applications', path: '/applications', icon: FileText },
          { label: 'Alerts', path: '/alerts', icon: Bell },
        ];
      case 'verifier':
        return [
          { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { label: 'Verifications', path: '/verifications', icon: CheckCircle2 },
          { label: 'Alerts', path: '/alerts', icon: Bell },
        ];
      case 'admin':
        return [
          { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { label: 'Users & Roles', path: '/admin/users', icon: Users },
          { label: 'Checklist Rules', path: '/admin/checklists', icon: Sliders },
          { label: 'Audit Trail', path: '/audit', icon: History },
          { label: 'Applications', path: '/applications', icon: FileText },
        ];
      case 'auditor':
        return [
          { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { label: 'Audit Trail', path: '/audit', icon: History },
          { label: 'Alerts', path: '/alerts', icon: Bell },
        ];
      default:
        return [{ label: 'Applications', path: '/applications', icon: FileText }];
    }
  };

  const navItems = getNavItems();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const initials = (user?.name || user?.email || 'U')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col font-sans selection:bg-brand selection:text-white">
      <DemoRibbon />

      {/* Advisory Notice Banner */}
      <div className="bg-tint-brand text-brand-deep px-4 py-2 text-xs font-mono tracking-wide flex items-center border-b border-brand-deep/10">
        <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
          <Shield className="w-3.5 h-3.5 text-brand shrink-0" />
          <span className="font-semibold text-brand tracking-wider uppercase text-[11px]">
            Decision Support:
          </span>
          <span className="text-muted">
            AI findings are advisory. Evidence supports. Authorised officials decide.
          </span>
        </div>
      </div>

      {/* Top Header */}
      <header className="bg-paper border-b border-line-light px-4 lg:px-8 py-3.5 sticky top-8 z-30 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 text-ink hover:text-brand"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          <Link to="/" className="flex items-baseline gap-2 group">
            <span className="font-bold text-xl tracking-tight text-brand-deep font-sans group-hover:text-brand transition-colors">
              DOCKEXPERT
            </span>
            <span className="font-mono text-[10px] text-muted tracking-widest uppercase hidden sm:inline">
              Document Intelligence
            </span>
          </Link>

          {/* Desktop top nav bar */}
          <nav className="hidden lg:flex items-center gap-1 ml-6" aria-label="Top Navigation">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={() =>
                    `flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-sans text-[13px] font-medium transition-all ${
                      isActive
                        ? 'bg-brand text-white shadow-sm'
                        : 'text-muted hover:text-ink hover:bg-black/[0.04]'
                    }`
                  }
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Right: Search + Bell + User */}
        <div className="flex items-center gap-2">
          {/* Search pill */}
          <div className="hidden md:flex items-center gap-2 bg-black/[0.04] border border-line-light rounded-lg px-3 py-1.5 text-xs text-muted hover:border-brand/30 transition-colors cursor-pointer">
            <Search className="w-3.5 h-3.5" />
            <input
              type="text"
              placeholder="Search…"
              className="bg-transparent border-none outline-none text-ink placeholder:text-muted/60 w-32 text-xs font-sans"
              disabled
              title="Search — connects to backend"
            />
            <span className="font-mono text-[10px] text-muted/50 hidden lg:block">⌘K</span>
          </div>

          {/* Notification bell with dropdown */}
          <div ref={notifRef} className="relative">
            <button
              type="button"
              onClick={() => { setNotifOpen(!notifOpen); setUserDropdownOpen(false); }}
              className="relative p-2 rounded-lg hover:bg-black/[0.05] transition-colors text-ink"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-warn border-2 border-paper" />
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-line-light p-0 z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-line-light flex items-center justify-between">
                  <p className="font-semibold text-sm text-ink">Notifications</p>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-warn/15 text-warn font-semibold">
                    2 NEW
                  </span>
                </div>
                <div className="divide-y divide-line-light max-h-72 overflow-y-auto">
                  {[
                    { title: 'Pre-check completed', desc: 'Application APP-2026-1042 — 3 findings flagged', time: '2m ago', dot: 'bg-warn' },
                    { title: 'Document expiry alert', desc: 'Fire Safety NOC expires in 14 days', time: '1h ago', dot: 'bg-danger' },
                    { title: 'Application submitted', desc: 'APP-2026-1042 moved to scrutiny queue', time: '3h ago', dot: 'bg-ok' },
                  ].map((n, i) => (
                    <div key={i} className="flex items-start gap-3 px-4 py-3 hover:bg-black/[0.02] transition-colors cursor-pointer">
                      <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.dot}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink leading-tight">{n.title}</p>
                        <p className="text-xs text-muted mt-0.5 truncate">{n.desc}</p>
                      </div>
                      <span className="text-[11px] text-muted/60 font-mono shrink-0 mt-0.5">{n.time}</span>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2.5 border-t border-line-light">
                  <Link to="/alerts" onClick={() => setNotifOpen(false)} className="text-[12px] text-brand font-medium hover:underline">
                    View all alerts →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* User dropdown */}
          <div ref={userRef} className="relative">
            <button
              type="button"
              onClick={() => { setUserDropdownOpen(!userDropdownOpen); setNotifOpen(false); }}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-line-light hover:border-brand/30 bg-white/60 hover:bg-white transition-all"
            >
              <div className="w-7 h-7 rounded-full bg-brand-deep text-white font-mono text-[11px] flex items-center justify-center font-bold shrink-0">
                {initials}
              </div>
              <div className="text-left hidden sm:block">
                <p className="font-medium text-[13px] text-ink leading-none">{user?.name || user?.email?.split('@')[0] || 'User'}</p>
                <p className={`font-mono text-[10px] tracking-wider uppercase leading-tight mt-0.5 ${roleStyle.text}`}>
                  {role}
                </p>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-muted transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {userDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-line-light z-50 overflow-hidden">
                {/* User info header */}
                <div className="px-4 py-3 border-b border-line-light bg-paper/60">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-brand-deep text-white font-mono text-sm flex items-center justify-center font-bold shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-ink truncate">{user?.name || user?.email}</p>
                      <p className="text-[11px] text-muted truncate">{user?.institution_id || 'Institutional Portal'}</p>
                    </div>
                  </div>
                  <span className={`inline-block mt-2 font-mono text-[10px] px-2.5 py-0.5 rounded-full border font-semibold ${roleStyle.bg} ${roleStyle.text}`}>
                    {role.toUpperCase()}
                  </span>
                </div>

                <div className="p-2">
                  <Link
                    to="/dashboard"
                    onClick={() => setUserDropdownOpen(false)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-black/[0.04] flex items-center gap-2.5 text-[13px] text-muted hover:text-ink font-sans transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4 shrink-0" />
                    Dashboard
                  </Link>
                  <Link
                    to="/"
                    onClick={() => setUserDropdownOpen(false)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-black/[0.04] flex items-center gap-2.5 text-[13px] text-muted hover:text-ink font-sans transition-colors"
                  >
                    <FileText className="w-4 h-4 shrink-0" />
                    Landing Page
                  </Link>
                  <div className="h-px bg-line-light my-1.5 mx-1" />
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-tint-danger text-danger flex items-center gap-2.5 font-sans text-[13px] transition-colors"
                  >
                    <LogOut className="w-4 h-4 shrink-0" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content — no sidebar, full width */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6">
        <Outlet />
      </main>

      {/* Mobile Nav Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm flex">
          <div className="w-72 bg-paper h-full p-6 shadow-xl flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-5 border-b border-line-light mb-5">
                <span className="font-bold text-xl text-brand-deep">DOCKEXPERT</span>
                <button onClick={() => setMobileMenuOpen(false)} className="p-1 rounded-lg hover:bg-black/[0.05]">
                  <X className="w-5 h-5 text-muted" />
                </button>
              </div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-3">
                {role.toUpperCase()} WORKSPACE
              </p>
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-2.5 rounded-xl font-sans text-[13px] font-medium transition-all ${
                          isActive ? 'bg-brand text-white shadow-sm' : 'text-muted hover:text-ink hover:bg-black/[0.04]'
                        }`
                      }
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </nav>
            </div>
            <div className="pt-5 border-t border-line-light">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-danger font-sans text-[13px] hover:bg-tint-danger transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-auto border-t border-line-light py-4 px-4 lg:px-8 bg-white/40">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-[11px] text-muted font-mono gap-2">
          <p>© 2026 DOCKEXPERT. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link to="/" className="hover:text-ink transition-colors">Landing</Link>
            <span className="text-line-light">|</span>
            <span className="text-ok font-semibold">● System Operational</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
