import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CustomCursor } from '../../components/common/CustomCursor';
import {
  HERO_SENTENCES,
  HERO_SUBTITLE,
  STATEMENT_HEADLINE_PART_1,
  STATEMENT_HEADLINE_PART_2,
  MARQUEE_WORDS,
  WORKFLOW_STEPS,
  CAPABILITY_ITEMS,
  ROLES_LIST,
  WORKSPACE_MODULES,
  SAFEGUARDS,
  ECOSYSTEM_INTEGRATIONS,
} from '../../content/landing';
import {
  ArrowRight,
  CheckCircle,
  Pause,
  Play,
  Building,
  GraduationCap,
  Scale,
  Home,
  Shield,
  History,
  Cpu,
  ChevronDown,
  X,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

// Map safeguard IDs to sector icons
const SAFEGUARD_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'SG-EDU': GraduationCap,
  'SG-INFRA': Building,
  'SG-LEGAL': Scale,
  'SG-REAL': Home,
  'SG-AUDIT': History,
  'SG-AI': Cpu,
};

gsap.registerPlugin(ScrollTrigger);

// Sector verification showcase data using the copied assets
const SECTOR_SHOWCASE = [
  {
    id: 'education',
    title: 'Education Sector Verification',
    category: 'ACADEMIC & AFFILIATION',
    icon: GraduationCap,
    media: '/images/AI-Document-Verification-in-Education-Sector.webp',
    mediaType: 'image',
    badge: 'OCR + University Cross-Check',
    desc: 'Automated extraction and validation of university degrees, affiliation orders, faculty cadre matrices, and statutory compliance affidavits.',
    points: ['Institutional regulatory handbook checks', 'Digital mark-sheet & transcript OCR', 'Faculty qualification roster matching'],
  },
  {
    id: 'real-estate',
    title: 'Campus Infrastructure & Land Scrutiny',
    category: 'INFRASTRUCTURE & SAFETY',
    icon: Building,
    media: '/images/AI-Document-Verification-in-Real-Estate-Sector.gif',
    mediaType: 'gif',
    badge: 'Municipal & Land Registry Match',
    desc: 'Rigorous cross-examination of campus land title deeds, approved municipal floor plans, occupancy certificates, and fire safety clearances.',
    points: ['Land conversion & non-encumbrance verification', 'Fire safety NOC validity auditing', 'Built-up area requirement calculations'],
  },
  {
    id: 'legal',
    title: 'Legal & Statutory Compliance Validation',
    category: 'STATUTORY GOVERNANCE',
    icon: Scale,
    media: '/images/AI-Document-Verification-in-the-Legal-Sector.gif',
    mediaType: 'gif',
    badge: 'Notarization & Seal Verification',
    desc: 'Notarised affidavits, trust deeds, society registration certificates and court governance rulings — validated against notarial databases.',
    points: [],
  },
  {
    id: 'real-estate-prop',
    title: 'Real Estate Verification',
    category: 'PROPERTY & LAND',
    icon: Home,
    media: '/images/AI-Document-Verification-in-Real-Estate-Sector.gif',
    mediaType: 'gif',
    badge: 'Registry & RERA Match',
    desc: 'Sale deeds, encumbrance certificates, RERA registrations and property tax receipts — verified against land registry portals.',
    points: [],
  },
];

const IntegrationIcon: React.FC<{ type: string }> = ({ type }) => {
  switch (type) {
    case 'n8n':
      return (
        <svg viewBox="0 0 48 48" className="w-6 h-6" fill="none">
          <circle cx="10" cy="24" r="5" stroke="#EA4B71" strokeWidth="3" fill="#EA4B71" fillOpacity="0.25" />
          <circle cx="23" cy="24" r="5" stroke="#EA4B71" strokeWidth="3" fill="#EA4B71" fillOpacity="0.25" />
          <circle cx="38" cy="14" r="5" stroke="#EA4B71" strokeWidth="3" fill="#EA4B71" fillOpacity="0.25" />
          <circle cx="38" cy="34" r="5" stroke="#EA4B71" strokeWidth="3" fill="#EA4B71" fillOpacity="0.25" />
          <path d="M15 24h3 M28 24h3c3 0 4-2 4-5v-1 M31 24c0 3 1 5 4 5v1" stroke="#EA4B71" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );
    case 'make':
      return (
        <svg viewBox="0 0 48 48" className="w-6 h-6" fill="none">
          <rect width="48" height="48" rx="10" fill="#6B17E6" />
          <path d="M14 28V20l10 7 10-7v8" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="24" cy="20" r="3" fill="#A78BFA" />
        </svg>
      );
    case 'digilocker':
      return (
        <svg viewBox="0 0 48 48" className="w-6 h-6" fill="none">
          <rect width="48" height="48" rx="10" fill="#0052CC" />
          <path d="M24 13c-4 0-7 3-7 7v4h14v-4c0-4-3-7-7-7z" stroke="#FFFFFF" strokeWidth="2.5" />
          <rect x="15" y="24" width="18" height="12" rx="3" fill="#FFFFFF" />
          <circle cx="24" cy="29" r="2" fill="#0052CC" />
          <path d="M24 31v2" stroke="#0052CC" strokeWidth="2" strokeLinecap="round" />
          <circle cx="33" cy="15" r="3" fill="#2EA653" />
        </svg>
      );
    case 'zapier':
      return (
        <svg viewBox="0 0 48 48" className="w-6 h-6" fill="none">
          <rect width="48" height="48" rx="10" fill="#FF4F00" />
          <path d="M24 12v24M12 24h24M15.5 15.5l17 17M32.5 15.5l-17 17" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" />
        </svg>
      );
    case 'aws':
      return (
        <svg viewBox="0 0 48 48" className="w-6 h-6" fill="none">
          <rect width="48" height="48" rx="10" fill="#E05243" />
          <ellipse cx="24" cy="17" rx="10" ry="4" stroke="#FFFFFF" strokeWidth="2.5" />
          <path d="M14 17v12c0 2.2 4.5 4 10 4s10-1.8 10-4V17" stroke="#FFFFFF" strokeWidth="2.5" />
          <path d="M14 23c0 2.2 4.5 4 10 4s10-1.8 10-4" stroke="#FFFFFF" strokeWidth="2" strokeDasharray="2 2" />
        </svg>
      );
    case 'esign':
      return (
        <svg viewBox="0 0 48 48" className="w-6 h-6" fill="none">
          <rect width="48" height="48" rx="10" fill="#0F9D58" />
          <circle cx="24" cy="24" r="13" stroke="#FFFFFF" strokeWidth="2" strokeDasharray="3 3" />
          <path d="M17 24l5 5 10-11" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'webhook':
      return (
        <svg viewBox="0 0 48 48" className="w-6 h-6" fill="none">
          <rect width="48" height="48" rx="10" fill="#00C7B7" />
          <path d="M18 17l-6 7 6 7M30 17l6 7-6 7M26 14l-4 20" stroke="#0B0B0C" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'slack':
      return (
        <svg viewBox="0 0 48 48" className="w-6 h-6" fill="none">
          <rect width="48" height="48" rx="10" fill="#4A154B" />
          <circle cx="18" cy="18" r="3" fill="#E01E5A" />
          <rect x="23" y="15" width="10" height="6" rx="3" fill="#36C5F0" />
          <circle cx="30" cy="30" r="3" fill="#2EB67D" />
          <rect x="15" y="27" width="10" height="6" rx="3" fill="#ECB22E" />
        </svg>
      );
    default:
      return null;
  }
};

export const LandingPage: React.FC = () => {
  const [heroIndex, setHeroIndex] = useState(0);
  const [selectedCapability, setSelectedCapability] = useState(0);
  const [isAnimationPaused, setIsAnimationPaused] = useState(false);
  const [activeWorkflowStep, setActiveWorkflowStep] = useState(1);
  const [knowMoreOpen, setKnowMoreOpen] = useState(false);
  const [sectorBoxOpen, setSectorBoxOpen] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Animation Refs
  const pageContainerRef = useRef<HTMLDivElement>(null);
  const heroHeadingRef = useRef<HTMLHeadingElement>(null);
  const heroSubtitleRef = useRef<HTMLParagraphElement>(null);
  const heroCtaRef = useRef<HTMLDivElement>(null);
  const heroGlowRef = useRef<HTMLDivElement>(null);
  const statementRef = useRef<HTMLElement>(null);
  const workflowCardRef = useRef<HTMLDivElement>(null);
  const workflowContentRef = useRef<HTMLDivElement>(null);
  const rolesBgRef = useRef<HTMLDivElement>(null);
  const rolesRowsRef = useRef<HTMLDivElement>(null);
  const safeguardsGridRef = useRef<HTMLDivElement>(null);
  const sectorsGridRef = useRef<HTMLDivElement>(null);
  const giantWordmarkRef = useRef<HTMLDivElement>(null);
  const capabilityDisplayRef = useRef<HTMLDivElement>(null);

  // Check user preference for reduced motion
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mq.addEventListener?.('change', handleChange);
    return () => mq.removeEventListener?.('change', handleChange);
  }, []);

  // Refresh ScrollTrigger calculations after initial mount
  useEffect(() => {
    const timer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  // 1. Hero sentence auto-rotation with smooth GSAP fade & slide
  useEffect(() => {
    if (prefersReducedMotion) return;
    const timer = setInterval(() => {
      if (heroHeadingRef.current) {
        gsap.to(heroHeadingRef.current, {
          y: -20,
          opacity: 0,
          duration: 0.3,
          ease: 'power2.in',
          onComplete: () => {
            setHeroIndex((prev) => (prev + 1) % HERO_SENTENCES.length);
            gsap.fromTo(
              heroHeadingRef.current,
              { y: 25, opacity: 0 },
              { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' }
            );
          },
        });
      } else {
        setHeroIndex((prev) => (prev + 1) % HERO_SENTENCES.length);
      }
    }, 4500);
    return () => clearInterval(timer);
  }, [prefersReducedMotion]);

  // 2. Workflow auto-stepper with smooth transition
  useEffect(() => {
    if (prefersReducedMotion || isAnimationPaused) return;
    const stepTimer = setInterval(() => {
      if (workflowContentRef.current) {
        gsap.to(workflowContentRef.current, {
          x: -12,
          opacity: 0,
          duration: 0.22,
          ease: 'power2.in',
          onComplete: () => {
            setActiveWorkflowStep((prev) => (prev >= WORKFLOW_STEPS.length ? 1 : prev + 1));
            gsap.fromTo(
              workflowContentRef.current,
              { x: 15, opacity: 0 },
              { x: 0, opacity: 1, duration: 0.4, ease: 'power3.out' }
            );
          },
        });
      } else {
        setActiveWorkflowStep((prev) => (prev >= WORKFLOW_STEPS.length ? 1 : prev + 1));
      }
    }, 3200);
    return () => clearInterval(stepTimer);
  }, [prefersReducedMotion, isAnimationPaused]);

  // 3. Capability selection change animation
  useEffect(() => {
    if (prefersReducedMotion || !capabilityDisplayRef.current) return;
    gsap.fromTo(
      capabilityDisplayRef.current,
      { opacity: 0.3, y: 10 },
      { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }
    );
  }, [selectedCapability, prefersReducedMotion]);

  // 4. Master GSAP ScrollTrigger & Entrance animations (with safe clearProps)
  useEffect(() => {
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      // Hero entrance sequence
      const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      heroTl
        .from(heroHeadingRef.current, { y: 50, opacity: 0, duration: 1, delay: 0.1 })
        .from(heroSubtitleRef.current, { y: 25, opacity: 0, duration: 0.7 }, '-=0.5')
        .from(heroCtaRef.current, { y: 20, opacity: 0, duration: 0.6 }, '-=0.4');

      // Statement Section scale & glow on scroll
      if (statementRef.current) {
        gsap.fromTo(
          statementRef.current,
          { scale: 0.95, opacity: 0.85 },
          {
            scale: 1,
            opacity: 1,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: statementRef.current,
              start: 'top 85%',
              end: 'top 40%',
              scrub: 0.8,
            },
          }
        );
      }

      // Workflow Media Card reveal and 3D parallax on mousemove
      if (workflowCardRef.current) {
        gsap.from(workflowCardRef.current, {
          y: 50,
          opacity: 0,
          scale: 0.97,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: workflowCardRef.current,
            start: 'top 85%',
            once: true,
          },
        });

        const card = workflowCardRef.current;
        const onCardMouseMove = (e: MouseEvent) => {
          const rect = card.getBoundingClientRect();
          const x = (e.clientX - rect.left) / rect.width - 0.5;
          const y = (e.clientY - rect.top) / rect.height - 0.5;
          gsap.to(card, {
            rotationY: x * 6,
            rotationX: -y * 6,
            transformPerspective: 1000,
            duration: 0.4,
            ease: 'power2.out',
          });
        };
        const onCardMouseLeave = () => {
          gsap.to(card, {
            rotationY: 0,
            rotationX: 0,
            duration: 0.5,
            ease: 'power2.out',
          });
        };

        card.addEventListener('mousemove', onCardMouseMove);
        card.addEventListener('mouseleave', onCardMouseLeave);
      }

      // Sector Showcase cards entrance (clearProps ensures it stays visible)
      if (sectorsGridRef.current) {
        const sectorCards = sectorsGridRef.current.children;
        gsap.fromTo(
          sectorCards,
          { y: 35, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.7,
            stagger: 0.15,
            ease: 'power2.out',
            clearProps: 'all',
            scrollTrigger: {
              trigger: sectorsGridRef.current,
              start: 'top 90%',
              once: true,
            },
          }
        );
      }

      // Roles background parallax
      if (rolesBgRef.current) {
        gsap.to(rolesBgRef.current, {
          yPercent: 25,
          ease: 'none',
          scrollTrigger: {
            trigger: '#roles',
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        });
      }

      // Roles hairline rows staggered entrance (clearProps ensures it stays visible)
      if (rolesRowsRef.current) {
        const rows = rolesRowsRef.current.children;
        gsap.fromTo(
          rows,
          { y: 25, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.6,
            stagger: 0.08,
            ease: 'power2.out',
            clearProps: 'all',
            scrollTrigger: {
              trigger: rolesRowsRef.current,
              start: 'top 92%',
              once: true,
            },
          }
        );
      }

      // Safeguards cards staggered reveal (clearProps ensures it stays visible)
      if (safeguardsGridRef.current) {
        const cards = safeguardsGridRef.current.children;
        gsap.fromTo(
          cards,
          { y: 30, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.6,
            stagger: 0.1,
            ease: 'power2.out',
            clearProps: 'all',
            scrollTrigger: {
              trigger: safeguardsGridRef.current,
              start: 'top 92%',
              once: true,
            },
          }
        );
      }

      // Giant Wordmark Footer entrance & high visibility
      if (giantWordmarkRef.current) {
        gsap.fromTo(
          giantWordmarkRef.current,
          { scale: 0.96, opacity: 0.7, y: 20 },
          {
            scale: 1,
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power2.out',
            clearProps: 'all',
            scrollTrigger: {
              trigger: giantWordmarkRef.current,
              start: 'top 92%',
              once: true,
            },
          }
        );
      }
    }, pageContainerRef);

    return () => ctx.revert();
  }, [prefersReducedMotion]);

  // 5. Interactive hero ambient glow following cursor
  const handleHeroMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (prefersReducedMotion || !heroGlowRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    gsap.to(heroGlowRef.current, {
      x,
      y,
      duration: 0.8,
      ease: 'power2.out',
    });
  };

  return (
    <div
      ref={pageContainerRef}
      className="min-h-screen bg-ink text-white selection:bg-brand selection:text-white font-sans antialiased overflow-x-hidden"
    >
      {/* Fluid Custom Cursor Follower */}
      <CustomCursor reducedMotion={prefersReducedMotion} />

      {/* 1. Navbar */}
      <header className="sticky top-0 z-40 bg-ink/95 backdrop-blur-md border-b border-line-dark px-4 sm:px-6 lg:px-12 py-3.5 flex items-center justify-between transition-colors">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="font-bold text-2xl tracking-tighter text-white font-sans group-hover:text-brand-soft transition-colors">
              DOCKEXPERT
            </span>
          </Link>
          <span className="text-[10px] font-mono text-brand-soft tracking-widest uppercase hidden md:inline px-2 py-0.5 rounded bg-brand/10 border border-brand/20">
            DOCUMENT INTELLIGENCE
          </span>
        </div>

        {/* Clickable Interactive Nav Items */}
        <nav aria-label="Main Navigation" className="hidden md:flex items-center gap-2 text-xs font-mono tracking-wider">
          <a
            href="#integrations"
            className="px-3 py-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/[0.08] border border-transparent hover:border-white/10 transition-all duration-200 cursor-pointer"
          >
            INTEGRATIONS
          </a>
          <a
            href="#workflow"
            className="px-3 py-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/[0.08] border border-transparent hover:border-white/10 transition-all duration-200 cursor-pointer"
          >
            WORKFLOW
          </a>
          <a
            href="#capabilities"
            className="px-3 py-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/[0.08] border border-transparent hover:border-white/10 transition-all duration-200 cursor-pointer"
          >
            CAPABILITIES
          </a>

          {/* Special Clickable SECTORS Button that opens target domains box */}
          <button
            type="button"
            onClick={() => setSectorBoxOpen((prev) => !prev)}
            aria-expanded={sectorBoxOpen}
            className={`px-3.5 py-1.5 rounded-full flex items-center gap-1.5 transition-all duration-200 cursor-pointer font-mono text-xs ${
              sectorBoxOpen
                ? 'bg-brand text-white border border-brand-soft shadow-lg shadow-brand/20 ring-2 ring-brand/30'
                : 'text-brand-soft bg-brand/10 hover:bg-brand/20 border border-brand/30 hover:border-brand-soft/60'
            }`}
          >
            <Sparkles className="w-3 h-3 text-brand-soft" />
            <span className="font-semibold">SECTORS</span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                sectorBoxOpen ? 'rotate-180 text-white' : 'text-brand-soft'
              }`}
            />
          </button>

          <a
            href="#roles"
            className="px-3 py-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/[0.08] border border-transparent hover:border-white/10 transition-all duration-200 cursor-pointer"
          >
            ROLES
          </a>
          <a
            href="#safeguards"
            className="px-3 py-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/[0.08] border border-transparent hover:border-white/10 transition-all duration-200 cursor-pointer"
          >
            SAFEGUARDS
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="px-5 py-2 rounded-full bg-brand hover:bg-brand-soft text-white font-mono text-xs tracking-wider transition-all shadow-md font-semibold hover:shadow-brand/30 hover:scale-105 active:scale-95"
          >
            SIGN IN
          </Link>
        </div>
      </header>

      {/* Target Sectors Box Modal / Dropdown Popover */}
      {sectorBoxOpen && (
        <div className="relative z-50">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setSectorBoxOpen(false)}
          />

          {/* Floating Mega Box */}
          <div className="fixed top-20 left-1/2 -translate-x-1/2 w-[94vw] max-w-4xl bg-[#0E131F]/98 border border-brand/30 rounded-3xl p-6 sm:p-8 shadow-[0_20px_70px_rgba(0,0,0,0.85)] backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[85vh] overflow-y-auto">
            {/* Box Header */}
            <div className="flex items-start justify-between pb-6 border-b border-white/10 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="px-2.5 py-0.5 rounded-full bg-brand/20 text-brand-soft border border-brand/30 font-mono text-[10px] tracking-widest uppercase">
                    Core Target Domains
                  </span>
                  <span className="text-white/40 text-xs font-mono">Institutional Scrutiny Scope</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white font-sans tracking-tight">
                  Target Verification Sectors
                </h3>
                <p className="text-xs sm:text-sm text-white/60 font-sans mt-1">
                  Cross-referencing institutional submissions against official state registers, land records, and statutory databases.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSectorBoxOpen(false)}
                className="p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors shrink-0"
                aria-label="Close box"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 4 Targeted Sectors Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Sector 1: Education Sector Verification */}
              <a
                href="#sectors"
                onClick={() => setSectorBoxOpen(false)}
                className="group p-5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-blue-500/20 hover:border-blue-400/50 transition-all duration-200 block text-left"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <span className="font-mono text-[10px] tracking-wider uppercase text-blue-400/80 px-2 py-0.5 rounded bg-blue-500/10">
                    Degrees & Affiliation
                  </span>
                </div>
                <h4 className="text-base font-semibold text-white group-hover:text-blue-300 font-sans transition-colors">
                  Education Sector Verification
                </h4>
                <p className="text-xs text-white/65 mt-1.5 font-sans leading-relaxed">
                  Automated OCR extraction and validation of university degrees, affiliation charters, faculty cadre matrices, and regulatory handbooks against university portals.
                </p>
                <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-white/50 group-hover:text-blue-400">
                  <span>Cross-Match: Degree & Mark-sheets</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </a>

              {/* Sector 2: Campus Infrastructure & Land Scrutiny */}
              <a
                href="#sectors"
                onClick={() => setSectorBoxOpen(false)}
                className="group p-5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-emerald-500/20 hover:border-emerald-400/50 transition-all duration-200 block text-left"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Building className="w-5 h-5" />
                  </div>
                  <span className="font-mono text-[10px] tracking-wider uppercase text-emerald-400/80 px-2 py-0.5 rounded bg-emerald-500/10">
                    Land Title & Safety
                  </span>
                </div>
                <h4 className="text-base font-semibold text-white group-hover:text-emerald-300 font-sans transition-colors">
                  Campus Infrastructure & Land Scrutiny
                </h4>
                <p className="text-xs text-white/65 mt-1.5 font-sans leading-relaxed">
                  Rigorous scrutiny of campus land title deeds, approved municipal floor plans, built-up area FSI requirements, and Fire Safety NOC certifications.
                </p>
                <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-white/50 group-hover:text-emerald-400">
                  <span>Cross-Match: Fire NOC & Registry</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </a>

              {/* Sector 3: Legal & Statutory Compliance Validation */}
              <a
                href="#sectors"
                onClick={() => setSectorBoxOpen(false)}
                className="group p-5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-purple-500/20 hover:border-purple-400/50 transition-all duration-200 block text-left"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Scale className="w-5 h-5" />
                  </div>
                  <span className="font-mono text-[10px] tracking-wider uppercase text-purple-400/80 px-2 py-0.5 rounded bg-purple-500/10">
                    Trust Deeds & Bylaws
                  </span>
                </div>
                <h4 className="text-base font-semibold text-white group-hover:text-purple-300 font-sans transition-colors">
                  Legal & Statutory Compliance Validation
                </h4>
                <p className="text-xs text-white/65 mt-1.5 font-sans leading-relaxed">
                  Notarised affidavits, trust deeds, Society Registration Act 1860 certificates, and statutory bylaws validated against notarial and state governance databases.
                </p>
                <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-white/50 group-hover:text-purple-400">
                  <span>Cross-Match: Notary & Registrar</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </a>

              {/* Sector 4: Real Estate & Title Verification */}
              <a
                href="#sectors"
                onClick={() => setSectorBoxOpen(false)}
                className="group p-5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-amber-500/20 hover:border-amber-400/50 transition-all duration-200 block text-left"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Home className="w-5 h-5" />
                  </div>
                  <span className="font-mono text-[10px] tracking-wider uppercase text-amber-400/80 px-2 py-0.5 rounded bg-amber-500/10">
                    Encumbrance & Title
                  </span>
                </div>
                <h4 className="text-base font-semibold text-white group-hover:text-amber-300 font-sans transition-colors">
                  Real Estate & Title Verification
                </h4>
                <p className="text-xs text-white/65 mt-1.5 font-sans leading-relaxed">
                  Sale deeds, 30-year non-encumbrance certificates, RERA project approvals, property tax receipts, and land revenue mutation extracts verified against land registries.
                </p>
                <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-white/50 group-hover:text-amber-400">
                  <span>Cross-Match: RERA & Revenue Records</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </a>
            </div>

            {/* Box Footer Actions */}
            <div className="mt-6 pt-5 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <a
                href="#safeguards"
                onClick={() => setSectorBoxOpen(false)}
                className="text-xs font-mono text-brand-soft hover:underline flex items-center gap-1.5"
              >
                <span>Read Institutional Safeguards in detail</span>
                <ArrowRight className="w-3 h-3" />
              </a>

              <div className="flex items-center gap-3">
                <a
                  href="#sectors"
                  onClick={() => setSectorBoxOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-mono tracking-wider transition-colors"
                >
                  VIEW SECTOR CARDS
                </a>
                <Link
                  to="/login"
                  onClick={() => setSectorBoxOpen(false)}
                  className="px-4 py-2 rounded-xl bg-brand hover:bg-brand-soft text-white text-xs font-mono font-semibold tracking-wider transition-all"
                >
                  ENTER SCRUTINY PORTAL →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Hero Section */}
      <section
        onMouseMove={handleHeroMouseMove}
        className="relative min-h-[85vh] flex flex-col justify-center items-center px-6 py-24 text-center overflow-hidden"
      >
        {/* Subtle Interactive Ambient Glow */}
        <div
          ref={heroGlowRef}
          aria-hidden="true"
          className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-brand/15 blur-[120px] pointer-events-none -z-0"
        />

        <div className="max-w-4xl mx-auto z-10 space-y-6">
          <h1
            ref={heroHeadingRef}
            aria-live="polite"
            className="text-4xl sm:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.08] min-h-[160px] flex items-center justify-center font-sans text-white drop-shadow-md select-none"
          >
            {HERO_SENTENCES[heroIndex]}
          </h1>

          <p
            ref={heroSubtitleRef}
            className="text-base sm:text-lg text-white/70 max-w-2xl mx-auto leading-relaxed"
          >
            {HERO_SUBTITLE}
          </p>

          <div
            ref={heroCtaRef}
            className="pt-6 flex flex-wrap items-center justify-center gap-4"
          >
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-brand hover:bg-brand-soft text-white font-medium text-sm transition-all shadow-lg font-mono tracking-wider hover:shadow-brand/40 hover:-translate-y-0.5"
            >
              <span>ACCESS WORKSPACE</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#workflow"
              className="px-8 py-3.5 rounded-full border border-line-dark hover:border-white/50 text-white font-mono text-xs tracking-wider transition-all hover:bg-white/5 hover:-translate-y-0.5"
            >
              EXPLORE ARCHITECTURE
            </a>
          </div>
        </div>
      </section>

      {/* 2.5 Real Ecosystem & Integrations Marquee Ribbon — generic pill strip */}
      <section id="integrations" className="bg-ink/95 py-8 overflow-hidden border-y border-white/[0.06] relative select-none">
        {/* Label row */}
        <div className="max-w-7xl mx-auto px-6 mb-6 flex items-center gap-3">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ok opacity-60"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-ok"></span>
          </span>
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/50">
            Integrates with your existing stack
          </span>
          <span className="flex-1 h-px bg-white/[0.08]" />
        </div>

        {/* Row 1 — scrolls left */}
        <div className="relative w-full overflow-hidden mask-fade-edges mb-3">
          <div className="animate-marquee-slow flex items-center gap-3 will-change-transform">
            {[...ECOSYSTEM_INTEGRATIONS, ...ECOSYSTEM_INTEGRATIONS].map((item, idx) => (
              <div
                key={`row1-${item.id}-${idx}`}
                className="shrink-0 flex items-center gap-2.5 px-4 py-2.5 rounded-full border border-white/[0.10] bg-white/[0.04] hover:bg-white/[0.09] hover:border-white/25 transition-all duration-200 group cursor-default"
              >
                <span className="w-6 h-6 rounded-md bg-white/[0.08] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <IntegrationIcon type={item.iconType} />
                </span>
                <span className="font-sans text-[13px] font-medium text-white/75 group-hover:text-white transition-colors whitespace-nowrap">
                  {item.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Row 2 — scrolls right (reverse) */}
        <div className="relative w-full overflow-hidden mask-fade-edges">
          <div
            className="flex items-center gap-3 will-change-transform"
            style={{ animation: 'marqueeSlow 50s linear infinite reverse', display: 'flex', width: 'max-content' }}
          >
            {[...ECOSYSTEM_INTEGRATIONS.slice().reverse(), ...ECOSYSTEM_INTEGRATIONS.slice().reverse()].map((item, idx) => (
              <div
                key={`row2-${item.id}-${idx}`}
                className="shrink-0 flex items-center gap-2.5 px-4 py-2.5 rounded-full border border-white/[0.07] bg-white/[0.025] hover:bg-white/[0.07] hover:border-white/20 transition-all duration-200 group cursor-default"
              >
                <span className="w-6 h-6 rounded-md bg-white/[0.06] flex items-center justify-center shrink-0">
                  <IntegrationIcon type={item.iconType} />
                </span>
                <span className="font-sans text-[13px] font-medium text-white/55 group-hover:text-white/85 transition-colors whitespace-nowrap">
                  {item.name}
                </span>
                <span className="font-mono text-[10px] text-white/30 hidden sm:inline whitespace-nowrap">
                  {item.category}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Statement Section (Smooth Direct Transition) */}
      <section
        ref={statementRef}
        className="bg-brand text-white py-28 px-6 lg:px-16 text-center rounded-3xl mx-3 sm:mx-6 my-12 shadow-2xl transition-transform"
      >
        <div className="max-w-4xl mx-auto">
          <p className="font-mono text-xs uppercase tracking-widest text-white/70 mb-4">
            GOVERNING SCRUTINY PRINCIPLE
          </p>
          <blockquote className="text-3xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-tight">
            {STATEMENT_HEADLINE_PART_1}
            <span className="text-brand-soft ml-2">{STATEMENT_HEADLINE_PART_2}</span>
          </blockquote>
        </div>
      </section>

      {/* 4. Marquee Section with 3D Tilt Rounded Workflow Card */}
      <section id="workflow" className="bg-paper text-ink py-24 px-6 relative overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center opacity-6 select-none pointer-events-none text-[12vw] font-black uppercase text-brand-deep whitespace-nowrap overflow-hidden"
        >
          {MARQUEE_WORDS.join(' · ')}
        </div>

        <div className="max-w-4xl mx-auto relative z-10">
          <div className="text-center mb-10">
            <p className="font-mono text-xs uppercase tracking-widest text-muted mb-2">
              WORKFLOW SIMULATION
            </p>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-ink font-sans">
              Regulatory Scrutiny Lifecycle
            </h2>
            <p className="text-sm text-muted mt-2">
              Step-by-step pre-check validation and officer scrutiny workflow
            </p>
          </div>

          <div
            ref={workflowCardRef}
            className="bg-ink text-white rounded-3xl p-6 sm:p-10 border border-line-dark shadow-2xl relative transition-shadow hover:shadow-[0_20px_50px_rgba(43,108,196,0.18)]"
            style={{ transformStyle: 'preserve-3d' }}
          >
            <div className="flex items-center justify-between pb-6 border-b border-line-dark mb-6">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs px-2.5 py-1 bg-brand rounded-full text-white font-semibold shadow-xs">
                  STEP {activeWorkflowStep} OF {WORKFLOW_STEPS.length}
                </span>
                <span className="text-xs font-mono text-white/60">DOCKEXPERT WORKFLOW ENGINE</span>
              </div>
              <button
                type="button"
                onClick={() => setIsAnimationPaused(!isAnimationPaused)}
                aria-label={isAnimationPaused ? 'Resume workflow animation' : 'Pause workflow animation'}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-line-dark hover:border-white/40 text-xs font-mono text-white/80 transition-all hover:bg-white/5 active:scale-95"
              >
                {isAnimationPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                <span>{isAnimationPaused ? 'Resume' : 'Pause'}</span>
              </button>
            </div>

            <div ref={workflowContentRef} className="space-y-4 min-h-[90px]">
              {WORKFLOW_STEPS.filter((s) => s.step === activeWorkflowStep).map((item) => (
                <div key={item.step} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-brand-deep text-brand-soft flex items-center justify-center shrink-0 font-mono font-bold text-sm shadow-inner">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {item.title}
                    </h3>
                    <p className="text-sm text-white/70 mt-1 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-4 border-t border-line-dark flex items-center justify-between text-[11px] font-mono text-white/40">
              <span>ACTIVE ENGINE</span>
              <span>DOCKEXPERT VERIFICATION PIPELINE</span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Capabilities Panel with Vertical Mono Menu */}
      <section id="capabilities" className="bg-ink py-24 px-6 lg:px-16 border-t border-line-dark">
        <div className="max-w-6xl mx-auto">
          <p className="font-mono text-xs uppercase tracking-widest text-brand-soft mb-2">
            SYSTEM CAPABILITIES
          </p>
          <h2 className="text-3xl sm:text-5xl font-semibold tracking-tight text-white mb-12 font-sans">
            Engineering & Validation Architecture
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5 space-y-1.5" role="tablist" aria-label="Capabilities menu">
              {CAPABILITY_ITEMS.map((cap, idx) => (
                <button
                  key={cap.id}
                  type="button"
                  role="tab"
                  aria-selected={selectedCapability === idx}
                  onClick={() => {
                    setSelectedCapability(idx);
                    setKnowMoreOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-xl font-mono text-xs tracking-wider transition-all flex items-center justify-between ${
                    selectedCapability === idx
                      ? 'bg-brand text-white font-semibold shadow-md translate-x-1'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span>{cap.menu}</span>
                  {selectedCapability === idx && <ArrowRight className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>

            <div
              ref={capabilityDisplayRef}
              className="lg:col-span-7 bg-white/5 border border-line-dark rounded-2xl p-8 backdrop-blur-xs min-h-[320px] flex flex-col justify-between transition-all"
            >
              <div>
                <p className="font-mono text-xs text-brand-soft uppercase tracking-wider mb-2">
                  {CAPABILITY_ITEMS[selectedCapability].menu}
                </p>
                <h3 className="text-2xl font-semibold text-white mb-3">
                  {CAPABILITY_ITEMS[selectedCapability].title}
                </h3>
                <p className="text-white/80 text-sm leading-relaxed mb-4">
                  {CAPABILITY_ITEMS[selectedCapability].desc}
                </p>

                {knowMoreOpen && (
                  <div className="p-4 rounded-xl bg-black/40 border border-line-dark text-xs font-mono text-white/80 space-y-2 mb-4 animate-in fade-in duration-300">
                    <p className="text-brand-soft font-semibold uppercase text-[10px] tracking-wider">
                      Technical Specification:
                    </p>
                    <p>{CAPABILITY_ITEMS[selectedCapability].details}</p>
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-line-dark flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setKnowMoreOpen(!knowMoreOpen)}
                  className="px-5 py-2 rounded-full border border-brand bg-tint-brand text-brand-soft hover:bg-brand hover:text-white text-xs font-mono transition-colors font-medium active:scale-95"
                >
                  {knowMoreOpen ? 'Hide Details' : 'Know more'}
                </button>

                <Link
                  to="/login"
                  className="px-5 py-2 rounded-full border border-line-dark hover:border-white text-xs font-mono text-white transition-all hover:bg-white/5 active:scale-95"
                >
                  TRY IN DEMO
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Multi-Sector Document Intelligence Showcase */}
      <section id="sectors" className="bg-ink py-24 px-6 lg:px-16 border-t border-line-dark relative">
        <div className="max-w-6xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-14">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-brand-soft mb-3">
              Verification Coverage
            </p>
            <h2 className="text-3xl sm:text-5xl font-semibold tracking-tight text-white font-sans">
              Built for every sector.
            </h2>
          </div>

          {/* Cards grid */}
          <div
            ref={sectorsGridRef}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
          >
            {SECTOR_SHOWCASE.map((sector) => (
              <div
                key={sector.id}
                className="group relative rounded-2xl overflow-hidden border border-white/[0.08] bg-white/[0.03] hover:border-brand-soft/40 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(43,108,196,0.18)] cursor-default"
              >
                {/* Media */}
                <div className="aspect-video w-full overflow-hidden bg-black/50 relative">
                  <img
                    src={sector.media}
                    alt={sector.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 will-change-transform"
                    loading="lazy"
                  />
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                </div>

                {/* Text — just title + subtitle */}
                <div className="px-5 py-5">
                  <h3 className="text-[15px] font-semibold text-white font-sans leading-snug group-hover:text-brand-soft transition-colors">
                    {sector.title}
                  </h3>
                  <p className="text-[12px] text-white/50 mt-1.5 font-sans leading-relaxed">
                    {sector.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Roles Section */}
      <section id="roles" className="bg-ink py-24 px-6 lg:px-16 border-t border-line-dark relative overflow-hidden">
        <div
          ref={rolesBgRef}
          aria-hidden="true"
          className="absolute top-10 right-8 text-[15vw] font-black uppercase text-white/[0.03] select-none pointer-events-none will-change-transform"
        >
          ROLES
        </div>

        <div className="max-w-5xl mx-auto relative z-10">
          <p className="font-mono text-xs uppercase tracking-widest text-brand-soft mb-2">
            STAKEHOLDER ARCHITECTURE
          </p>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <h2 className="text-3xl sm:text-5xl font-semibold tracking-tight text-white font-sans">
              Separation of Responsibilities
            </h2>
            <p className="text-sm text-white/60 max-w-sm leading-relaxed">
              Role-guarded interfaces ensure applicants, scrutiny officers, and verifiers execute distinct statutory duties.
            </p>
          </div>

          {/* Hairline Rows */}
          <div
            ref={rolesRowsRef}
            className="divide-y divide-line-dark border-y border-line-dark opacity-100"
          >
            {ROLES_LIST.map((r, i) => (
              <div
                key={i}
                className="py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:bg-white/[0.025] px-4 -mx-4 rounded-lg transition-all duration-300"
              >
                <div className="w-44 shrink-0">
                  <span className="font-mono text-[10px] tracking-widest uppercase text-white/50 px-2.5 py-1 rounded bg-white/5 group-hover:bg-brand/20 group-hover:text-brand-soft transition-colors">
                    {r.side}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg sm:text-xl font-semibold text-white group-hover:text-brand-soft transition-colors font-sans group-hover:translate-x-1 duration-200">
                    {r.role}
                  </h3>
                  <p className="text-xs text-white/65 mt-1 max-w-xl leading-relaxed">{r.desc}</p>
                </div>
                <div className="shrink-0">
                  <Link
                    to={r.path}
                    className="inline-flex items-center gap-1.5 font-mono text-xs text-brand-soft hover:text-white px-3.5 py-1.5 rounded-full border border-line-dark group-hover:border-brand-soft transition-all duration-200 group-hover:shadow-sm"
                  >
                    <span>Enter</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Four-Column Grid of Small Modules */}
          <div className="mt-12 pt-8 border-t border-line-dark grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {WORKSPACE_MODULES.map((mod, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-line-dark bg-white/5 space-y-1 hover:border-brand-soft/40 transition-colors"
              >
                <p className="font-mono text-xs text-brand-soft font-semibold">{mod.name}</p>
                <p className="text-[11px] text-white/60 leading-relaxed">{mod.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Safeguards Section (Guaranteed Visible Cards) */}
      <section id="safeguards" className="bg-paper text-ink py-24 px-6 lg:px-16 border-t border-line-light">
        <div className="max-w-5xl mx-auto text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-muted mb-2">
            GOVERNANCE CONSTITUTION
          </p>
          <h2 className="text-3xl sm:text-5xl font-semibold tracking-tight text-ink mb-12 font-sans">
            Safeguards, in a few words.
          </h2>

          <div
            ref={safeguardsGridRef}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left opacity-100"
          >
            {SAFEGUARDS.map((s) => {
              const IconComp = SAFEGUARD_ICONS[s.id] || CheckCircle;
              return (
                <div
                  key={s.id}
                  className="bg-white p-6 rounded-2xl border border-line-light shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    <div className="w-9 h-9 rounded-xl bg-tint-brand text-brand flex items-center justify-center mb-4">
                      <IconComp className="w-4.5 h-4.5" />
                    </div>
                    <h3 className="font-semibold text-base text-ink mb-2 font-sans">{s.title}</h3>
                    <p className="text-[13px] text-muted leading-relaxed">{s.body}</p>
                  </div>
                  <p className="mt-4 pt-3 border-t border-line-light font-mono text-[10px] text-muted/60">
                    {s.id}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 9. Giant Footer (DOCKEXPERT Wordmark) */}
      <footer className="bg-ink text-white pt-20 pb-12 px-6 lg:px-16 border-t border-line-dark">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-12 border-b border-line-dark gap-6">
            <nav className="flex flex-wrap gap-6 text-xs font-mono tracking-widest text-white/70">
              <a href="#integrations" className="hover:text-white transition-colors">INTEGRATIONS</a>
              <a href="#workflow" className="hover:text-white transition-colors">WORKFLOW</a>
              <a href="#capabilities" className="hover:text-white transition-colors">CAPABILITIES</a>
              <a href="#sectors" className="hover:text-white transition-colors">SECTORS</a>
              <a href="#roles" className="hover:text-white transition-colors">ROLES</a>
              <a href="#safeguards" className="hover:text-white transition-colors">SAFEGUARDS</a>
              <Link to="/login" className="text-brand-soft hover:text-white transition-colors">PORTAL LOGIN</Link>
            </nav>
            <p className="text-xs font-mono text-white/40">
              Enterprise Document Intelligence & Decision Support Platform
            </p>
          </div>

          {/* Giant Wordmark Across Full Width - 100% Responsive SVG without Any Cropping */}
          <div className="py-12 sm:py-16 select-none flex items-center justify-center w-full px-2">
            <div ref={giantWordmarkRef} className="w-full max-w-5xl will-change-transform flex justify-center">
              <svg
                viewBox="0 0 1100 135"
                className="w-full h-auto overflow-visible select-none drop-shadow-[0_4px_35px_rgba(99,152,224,0.45)]"
                aria-label="DOCKEXPERT"
                role="img"
              >
                <defs>
                  <linearGradient id="dockexpertGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#FFFFFF" />
                    <stop offset="60%" stopColor="#F1F5F9" />
                    <stop offset="100%" stopColor="#94A3B8" />
                  </linearGradient>
                </defs>
                <text
                  x="550"
                  y="105"
                  textAnchor="middle"
                  fill="url(#dockexpertGrad)"
                  fontFamily="'Inter', var(--font-sans), system-ui, sans-serif"
                  fontWeight="900"
                  fontSize="124"
                  letterSpacing="-0.035em"
                >
                  DOCKEXPERT
                </text>
              </svg>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-white/40 gap-4">
            <p>© 2026 DOCKEXPERT. All rights reserved.</p>
            <p>Enterprise Institutional Verification & Regulatory Scrutiny Platform</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
