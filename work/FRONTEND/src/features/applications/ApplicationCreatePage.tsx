import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { applicationQueries } from '../../api/queries/applications';
import { ArrowLeft, ArrowRight, CheckCircle2, Layers, AlertCircle } from 'lucide-react';

const CATEGORY_OPTIONS = [
  {
    id: 'Technical Degree (Engineering & Technology)',
    title: 'Technical Degree (Engineering & Technology)',
    desc: 'B.Tech, B.E., M.Tech programs. Governed by statutory accreditation norms for land, infrastructure, and cadre ratios.',
    badge: 'Statutory Chapter 1-2',
    reqCount: '5 Core Documents',
  },
  {
    id: 'Postgraduate Diploma (Management)',
    title: 'Postgraduate Diploma (Management)',
    desc: 'PGDM and MBA programs requiring specialized academic resources, library ratios, and executive seminar halls.',
    badge: 'APH Chapter 3',
    reqCount: '4 Core Documents',
  },
  {
    id: 'Diploma in Applied Engineering',
    title: 'Diploma in Applied Engineering',
    desc: 'Polytechnic and diploma engineering institutions focusing on workshop floor layouts and mechanical facilities.',
    badge: 'APH Chapter 4',
    reqCount: '4 Core Documents',
  },
  {
    id: 'New Technical Institution Setup',
    title: 'New Technical Institution Setup',
    desc: 'Comprehensive initial statutory scrutiny. Requires title deeds, master campus plans, fire NOC, and trust deed.',
    badge: 'Comprehensive APH',
    reqCount: '6 Core Documents',
  },
];

export const ApplicationCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>(CATEGORY_OPTIONS[0].id);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const created = await applicationQueries.createApplication({ category: selectedCategory });
      navigate(`/applications/${created.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Breadcrumb & Title */}
      <div className="border-b border-line-light pb-4">
        <Link
          to="/applications"
          className="text-xs font-mono text-muted hover:text-ink flex items-center gap-1 mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>RETURN TO APPLICATIONS</span>
        </Link>
        <p className="font-mono text-xs uppercase tracking-widest text-muted">
          REGULATORY SCRUTINY INITIATION
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-ink font-sans mt-1">
          New Institutional Application
        </h1>
        <p className="text-xs text-muted mt-1">
          Select an educational category. The category automatically binds the corresponding statutory checklist rules.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-tint-danger border border-danger/30 text-danger text-xs flex items-center gap-3"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Category Selection Form */}
      <form onSubmit={handleCreate} className="space-y-6">
        <div className="space-y-3">
          <label className="block text-xs font-mono uppercase tracking-wider text-muted">
            Select Educational Category
          </label>

          <div className="grid grid-cols-1 gap-3">
            {CATEGORY_OPTIONS.map((cat) => (
              <div
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  selectedCategory === cat.id
                    ? 'border-brand bg-tint-brand/50 shadow-xs'
                    : 'border-line-light bg-white/70 hover:border-brand/40'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-ink">{cat.title}</span>
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-black/[0.04] text-muted uppercase">
                      {cat.badge}
                    </span>
                  </div>
                  <p className="text-xs text-muted leading-relaxed max-w-xl">{cat.desc}</p>
                </div>

                <div className="shrink-0 flex items-center gap-3">
                  <span className="font-mono text-[11px] text-muted hidden sm:inline">
                    {cat.reqCount}
                  </span>
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                      selectedCategory === cat.id
                        ? 'border-brand bg-brand text-white'
                        : 'border-muted/40'
                    }`}
                  >
                    {selectedCategory === cat.id && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-paper/60 border border-line-light flex items-start gap-3 text-xs text-muted">
          <Layers className="w-4 h-4 text-brand shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Checklist Binding:</strong> Once created, your application will load the versioned rules from the statutory compliance handbook. You will be prompted to upload evidence files corresponding to each required rule.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-line-light">
          <Link
            to="/applications"
            className="px-5 py-2.5 rounded-full border border-line-light hover:border-ink/40 text-ink text-xs font-mono transition-colors"
          >
            CANCEL
          </Link>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-brand hover:bg-brand-deep text-white text-xs font-mono tracking-wider transition-all shadow-sm disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>INITIALIZING...</span>
            ) : (
              <>
                <span>PROCEED TO DOCUMENT UPLOAD</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
