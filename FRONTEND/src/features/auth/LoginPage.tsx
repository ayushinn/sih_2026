import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getHomeRouteForRole } from '../../lib/permissions';
import { env } from '../../lib/env';
import { Role } from '../../api/types';
import {
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  GraduationCap,
  Building2,
  Scale,
  Home,
  Zap,
  Eye,
  EyeOff,
} from 'lucide-react';

const DEMO_ACCOUNTS: { email: string; role: Role; label: string; desc: string; color: string }[] = [
  {
    email: 'applicant@demo.test',
    role: 'applicant',
    label: 'Institution Applicant',
    desc: 'Upload, pre-check & submit',
    color: 'bg-brand/15 border-brand/30 text-brand',
  },
  {
    email: 'officer@demo.test',
    role: 'officer',
    label: 'Scrutiny Officer',
    desc: 'Queue review & record decisions',
    color: 'bg-info/15 border-info/30 text-info',
  },
  {
    email: 'verifier@demo.test',
    role: 'verifier',
    label: 'Document Verifier',
    desc: 'Verify against issuing portals',
    color: 'bg-ok/15 border-ok/30 text-ok',
  },
  {
    email: 'admin@demo.test',
    role: 'admin',
    label: 'Administrator',
    desc: 'Manage users, roles & checklists',
    color: 'bg-warn/15 border-warn/30 text-warn',
  },
  {
    email: 'auditor@demo.test',
    role: 'auditor',
    label: 'Regulatory Auditor',
    desc: 'Read-only immutable audit trail',
    color: 'bg-muted/15 border-muted/30 text-muted',
  },
];

const SECTORS = [
  { icon: GraduationCap, label: 'Education Sector' },
  { icon: Building2, label: 'Infrastructure & Land' },
  { icon: Scale, label: 'Legal & Statutory' },
  { icon: Home, label: 'Real Estate' },
];

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState('applicant@demo.test');
  const [password, setPassword] = useState('demo123');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const redirectParam = searchParams.get('redirect');

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const loggedInUser = await login(email, password);
      if (redirectParam) {
        navigate(decodeURIComponent(redirectParam));
      } else {
        navigate(getHomeRouteForRole(loggedInUser.role));
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeAccount = DEMO_ACCOUNTS.find((a) => a.email === email);

  return (
    <div className="min-h-screen flex font-sans" style={{ background: '#0B0B0C' }}>
      {/* ── Left Panel: Dark brand panel ── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[480px] shrink-0 px-12 py-14 relative overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, #0E2F66 0%, #0B0B0C 60%, #0B0B0C 100%)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Ambient glow */}
        <div
          aria-hidden
          className="absolute -top-24 -left-24 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(43,108,196,0.18) 0%, transparent 70%)' }}
        />
        <div
          aria-hidden
          className="absolute bottom-0 right-0 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(99,152,224,0.08) 0%, transparent 70%)' }}
        />

        {/* Logo */}
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-2.5 group w-fit">
            <div className="w-9 h-9 rounded-xl bg-brand flex items-center justify-center shadow-lg shadow-brand/30">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white font-sans">DOCKEXPERT</span>
          </Link>

          <div className="mt-14 space-y-2">
            <p className="font-mono text-[11px] uppercase tracking-widest text-white/40 mb-4">
              Verification Coverage
            </p>
            {SECTORS.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.03]"
              >
                <Icon className="w-4 h-4 text-brand-soft shrink-0" />
                <span className="text-sm text-white/70 font-sans">{label}</span>
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-ok" />
              </div>
            ))}
          </div>

          <div className="mt-10 p-4 rounded-2xl border border-white/[0.07] bg-white/[0.03]">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-3.5 h-3.5 text-brand-soft" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-white/50">
                Decision Support Principle
              </span>
            </div>
            <p className="text-sm text-white/75 leading-relaxed font-sans">
              AI finds. Evidence links. <span className="text-white font-medium">Officers decide.</span>
            </p>
          </div>
        </div>

        {/* Bottom stat strip */}
        <div className="relative z-10">
          <div className="grid grid-cols-3 gap-4 pt-8 border-t border-white/[0.06]">
            {[
              { val: '6', label: 'Doc types' },
              { val: '4', label: 'Sectors' },
              { val: '5', label: 'Roles' },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-2xl font-bold text-white font-sans">{s.val}</p>
                <p className="text-[11px] text-white/40 font-mono mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right Panel: Form ── */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 relative">
        {/* Back to landing */}
        <Link
          to="/"
          className="absolute top-6 right-6 font-mono text-[11px] uppercase tracking-widest text-white/30 hover:text-white/70 transition-colors"
        >
          ← Back
        </Link>

        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-8 h-8 rounded-xl bg-brand flex items-center justify-center">
              <ShieldCheck className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="font-bold text-lg text-white">DOCKEXPERT</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-white tracking-tight font-sans">Sign in</h1>
            <p className="text-sm text-white/45 mt-1.5 font-sans">
              Institutional Document Verification Platform
            </p>
          </div>

          {/* Error */}
          {errorMessage && (
            <div
              role="alert"
              className="mb-6 flex items-start gap-3 px-4 py-3 rounded-xl border border-danger/30 bg-danger/10 text-danger text-sm"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="text-xs leading-relaxed">{errorMessage}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email-address"
                className="block text-[11px] font-mono uppercase tracking-widest mb-2"
                style={{ color: 'rgba(255,255,255,0.4)' }}
              >
                Email Address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="official@institution.edu.in"
                className="w-full px-4 py-3 rounded-xl text-sm font-sans transition-all outline-none"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  color: 'white',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'rgba(43,108,196,0.6)')}
                onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.10)')}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-[11px] font-mono uppercase tracking-widest mb-2"
                style={{ color: 'rgba(255,255,255,0.4)' }}
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  className="w-full px-4 py-3 pr-11 rounded-xl text-sm font-sans transition-all outline-none"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.10)',
                    color: 'white',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'rgba(43,108,196,0.6)')}
                  onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.10)')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {env.USE_MOCK && (
                <p className="mt-1.5 text-[11px] text-white/30 font-mono">
                  Demo mode — any non-empty password works.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-medium text-sm transition-all disabled:opacity-50 mt-2"
              style={{
                background: isSubmitting ? 'rgba(43,108,196,0.7)' : '#2B6CC4',
                color: 'white',
                boxShadow: '0 4px 20px rgba(43,108,196,0.35)',
              }}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying…</span>
                </>
              ) : (
                <>
                  <span>Sign In to Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Demo role switcher */}
          {env.USE_MOCK && (
            <div className="mt-8">
              <div
                className="px-4 py-3 rounded-t-xl flex items-center justify-between"
                style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
              >
                <span className="font-mono text-[10px] uppercase tracking-widest text-white/35">
                  Quick Demo Role Switch
                </span>
                {activeAccount && (
                  <span
                    className={`font-mono text-[10px] px-2 py-0.5 rounded-full border font-semibold ${activeAccount.color}`}
                  >
                    {activeAccount.role}
                  </span>
                )}
              </div>
              <div
                className="rounded-b-xl overflow-hidden divide-y"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderTop: 'none',
                }}
              >
                {DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => {
                      setEmail(acc.email);
                      setPassword('demo123');
                    }}
                    className="w-full text-left px-4 py-3 flex items-center justify-between transition-all"
                    style={{
                      background: email === acc.email ? 'rgba(43,108,196,0.12)' : 'transparent',
                    }}
                    onMouseEnter={(e) =>
                      email !== acc.email &&
                      ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)')
                    }
                    onMouseLeave={(e) =>
                      email !== acc.email &&
                      ((e.currentTarget as HTMLElement).style.background = 'transparent')
                    }
                  >
                    <div>
                      <p className="text-sm font-medium text-white/80 font-sans">{acc.label}</p>
                      <p className="text-[11px] text-white/35 font-sans mt-0.5">{acc.desc}</p>
                    </div>
                    {email === acc.email && (
                      <span className="font-mono text-[10px] text-brand-soft font-semibold shrink-0 ml-3">
                        SELECTED
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
