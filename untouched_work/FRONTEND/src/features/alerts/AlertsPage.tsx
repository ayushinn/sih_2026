import React, { useEffect, useState } from 'react';
import { alertQueries } from '../../api/queries/alerts';
import { Alert } from '../../api/types';
import { Bell, Check, Clock } from 'lucide-react';

export const AlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await alertQueries.getAlerts();
        setAlerts(res.items);
      } catch (err) {
        console.error('Failed to load alerts:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleAck = async (id: string) => {
    try {
      await alertQueries.ackAlert(id);
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, acked_at: new Date().toISOString() } : a))
      );
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-line-light pb-4">
        <p className="font-mono text-xs uppercase tracking-widest text-muted">
          SYSTEM NOTIFICATIONS
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-ink font-sans mt-1">
          Regulatory Alerts
        </h1>
        <p className="text-xs text-muted mt-1">
          Scrutiny flags, approaching deadlines, and pre-check completion alerts
        </p>
      </div>

      <div className="bg-white/80 rounded-2xl border border-line-light p-6 shadow-xs">
        {loading ? (
          <div className="py-12 text-center text-xs font-mono text-muted">
            Loading alerts...
          </div>
        ) : alerts.length === 0 ? (
          <div className="py-12 text-center text-xs font-mono text-muted">
            No active alerts.
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alt) => (
              <div
                key={alt.id}
                className="p-4 rounded-xl border border-line-light bg-paper/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-tint-warn text-warn flex items-center justify-center shrink-0 mt-0.5">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-medium text-ink text-sm">
                      {alt.message || `System Notification for ${alt.object_ref}`}
                    </p>
                    <p className="font-mono text-[11px] text-muted mt-0.5">
                      Target: {alt.object_ref || 'Global'} · Created: {new Date(alt.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {alt.acked_at ? (
                    <span className="font-mono text-[11px] text-ok flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      Acknowledged
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleAck(alt.id)}
                      className="px-4 py-1.5 rounded-full border border-line-light hover:border-brand text-brand hover:bg-tint-brand font-mono text-xs transition-colors"
                    >
                      Acknowledge
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
