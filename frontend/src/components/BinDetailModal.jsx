import React, { useState, useEffect } from 'react';
import { X, MapPin, Activity, Cpu, RotateCcw, Sparkles, Clock, Calendar } from 'lucide-react';

export default function BinDetailModal({ bin, isOpen, onClose, onEmpty, onSimulateAdd }) {
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (isOpen && bin) {
      fetchHistory();
    }
  }, [isOpen, bin]);

  const fetchHistory = async () => {
    if (!bin) return;
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/telemetry/history/${bin.binId}?limit=10`);
      const data = await res.json();
      if (data.success) {
        setHistory(data.data || []);
      }
    } catch (e) {
      console.error('Failed to fetch bin history:', e);
    } finally {
      setLoadingHistory(false);
    }
  };

  if (!isOpen || !bin) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-2xl p-6 relative shadow-2xl border border-slate-700 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-slate-800 text-emerald-400 border border-slate-700">
                {bin.binId}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                bin.fillPercentage >= 80 ? 'bg-red-500/20 text-red-400' :
                bin.fillPercentage >= 40 ? 'bg-amber-500/20 text-amber-400' :
                'bg-emerald-500/20 text-emerald-400'
              }`}>
                {bin.status} ({bin.fillPercentage}%)
              </span>
            </div>
            <h3 className="text-xl font-bold text-slate-100 mt-2">{bin.name}</h3>
            <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              {bin.location?.address || 'Unassigned Location'}
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5">
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Fill Level</span>
            <span className="text-xl font-extrabold text-emerald-400">{bin.fillPercentage}%</span>
          </div>

          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Distance</span>
            <span className="text-xl font-extrabold text-cyan-400">{bin.currentLevelCm} cm</span>
          </div>

          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Total Height</span>
            <span className="text-xl font-extrabold text-slate-200">{bin.heightCm} cm</span>
          </div>

          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Servo Lid Ops</span>
            <span className="text-xl font-extrabold text-purple-400">{bin.servoOpenedCount || 0}</span>
          </div>
        </div>

        {/* Action controls */}
        <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-between gap-3 mb-5">
          <span className="text-xs text-slate-400 font-medium">Quick Actions</span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onSimulateAdd(bin.binId)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-800/60 transition-colors flex items-center space-x-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Simulate Waste (+15%)</span>
            </button>

            <button
              onClick={() => onEmpty(bin.binId)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-300 bg-amber-950/60 hover:bg-amber-900/80 border border-amber-800/60 transition-colors flex items-center space-x-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Empty Bin</span>
            </button>
          </div>
        </div>

        {/* History log table */}
        <div>
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-emerald-400" />
            Recent Telemetry Logs
          </h4>

          <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950">
            {loadingHistory ? (
              <div className="p-4 text-center text-xs text-slate-500">Loading history logs...</div>
            ) : history.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500">No telemetry logs recorded</div>
            ) : (
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900 text-slate-400 text-[11px] font-semibold sticky top-0 border-b border-slate-800">
                  <tr>
                    <th className="p-2.5">Time</th>
                    <th className="p-2.5">Distance</th>
                    <th className="p-2.5">Fill %</th>
                    <th className="p-2.5">Status</th>
                    <th className="p-2.5 text-right">Servo Lid</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {history.map((item, idx) => (
                    <tr key={item._id || idx} className="hover:bg-slate-900/50 transition-colors">
                      <td className="p-2.5 font-mono text-slate-400">
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="p-2.5 font-mono">{item.distanceCm} cm</td>
                      <td className="p-2.5 font-bold text-emerald-400">{item.fillPercentage}%</td>
                      <td className="p-2.5">{item.status}</td>
                      <td className="p-2.5 text-right">
                        {item.servoActivated ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-900/40 text-purple-300 border border-purple-700">Opened</span>
                        ) : (
                          <span className="text-[10px] text-slate-600">Closed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
