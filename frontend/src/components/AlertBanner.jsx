import React from 'react';
import { ShieldAlert, CheckCircle2, X } from 'lucide-react';

export default function AlertBanner({ alerts = [], onResolve, onAcknowledge }) {
  const activeAlerts = alerts.filter(a => a.status === 'Active');

  if (activeAlerts.length === 0) return null;

  return (
    <div className="space-y-3 mb-6">
      {activeAlerts.map(alert => (
        <div
          key={alert._id || alert.alertId}
          className="p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg shadow-red-950/50 backdrop-blur-md animate-pulse"
        >
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-red-500/20 rounded-lg shrink-0">
              <ShieldAlert className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-red-900/60 text-red-300 border border-red-700/50">
                  {alert.alertId}
                </span>
                <span className="text-sm font-bold text-slate-100">{alert.binName}</span>
                <span className="text-xs text-red-300">({alert.fillPercentage}% Capacity)</span>
              </div>
              <p className="text-xs text-red-200/90 mt-1">{alert.message}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-end sm:self-center shrink-0">
            <button
              onClick={() => onResolve(alert._id || alert.alertId)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-red-600 hover:bg-red-500 transition-colors flex items-center space-x-1 shadow"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Resolve & Clear</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
