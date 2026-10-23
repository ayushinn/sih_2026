import React from 'react';
import { env } from '../../lib/env';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, UserCheck } from 'lucide-react';

export const DemoRibbon: React.FC = () => {
  const { user } = useAuth();

  if (!env.USE_MOCK) return null;

  return (
    <div
      role="status"
      aria-label="Institutional operational environment status"
      className="bg-[#0A101D] text-white px-4 py-1.5 text-xs font-mono tracking-wider flex items-center justify-between border-b border-white/10 select-none z-50 sticky top-0"
    >
      <div className="flex items-center gap-2.5">
        <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-semibold tracking-widest uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          GOVERNANCE SYSTEM ACTIVE
        </span>
        <span className="text-white/60 text-[11px] hidden sm:inline">
          Institutional Document Intelligence & Statutory Decision Support Environment
        </span>
      </div>

      <div className="flex items-center gap-4 text-white/80">
        {user ? (
          <span className="inline-flex items-center gap-1.5 text-[11px]">
            <UserCheck className="w-3.5 h-3.5 text-brand-soft" />
            <span className="text-brand-soft uppercase font-semibold">{user.role}</span>
            <span className="text-white/40 hidden md:inline">· {user.email}</span>
          </span>
        ) : (
          <span className="text-white/60 text-[11px]">Session Authenticated</span>
        )}
      </div>
    </div>
  );
};
