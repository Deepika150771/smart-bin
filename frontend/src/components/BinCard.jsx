import React from 'react';
import { MapPin, RotateCcw, Eye, Trash, ShieldAlert, Cpu, Sparkles } from 'lucide-react';

export default function BinCard({ bin, onSelect, onEmpty, onDelete, onSimulateAdd }) {
  const getStatusBadge = (status, pct) => {
    if (status === 'Full' || pct >= 80) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/40 flex items-center space-x-1 animate-pulse">
          <ShieldAlert className="w-3 h-3" />
          <span>FULL ({pct}%)</span>
        </span>
      );
    }
    if (status === 'Half' || pct >= 40) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/40">
          HALF ({pct}%)
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
        EMPTY ({pct}%)
      </span>
    );
  };

  const getFillColor = (pct) => {
    if (pct >= 80) return 'from-red-500 to-rose-600 shadow-red-500/30';
    if (pct >= 40) return 'from-amber-400 to-orange-500 shadow-amber-500/30';
    return 'from-emerald-400 to-teal-500 shadow-emerald-500/30';
  };

  const formattedTime = bin.lastUpdated 
    ? new Date(bin.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : 'Just now';

  return (
    <div className="glass-card p-5 relative overflow-hidden flex flex-col justify-between group border border-slate-800 hover:border-slate-700">
      
      {/* Top Header */}
      <div>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
                {bin.binId}
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Cpu className="w-3 h-3 text-cyan-400" />
                {bin.servoOpenedCount || 0} Lid Servo
              </span>
            </div>
            <h3 className="mt-2 text-base font-bold text-slate-100 group-hover:text-emerald-300 transition-colors">
              {bin.name}
            </h3>
          </div>
          {getStatusBadge(bin.status, bin.fillPercentage)}
        </div>

        <div className="mt-2 flex items-center text-xs text-slate-400 space-x-1">
          <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="truncate">{bin.location?.address || 'Unassigned Location'}</span>
        </div>
      </div>

      {/* Visual Fill Gauge */}
      <div className="my-5 flex items-center space-x-4">
        {/* Bin Cylinder Graphic */}
        <div className="relative w-14 h-28 bg-slate-900 rounded-xl border-2 border-slate-700 overflow-hidden flex flex-col justify-end p-1 shadow-inner shrink-0">
          
          {/* Lid indicator */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-600 border-b border-slate-800" />
          
          {/* Ultrasonic Sensor Icon */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-4 h-1.5 bg-cyan-500/50 rounded-full" />
          
          {/* Fill Water/Garbage Level */}
          <div
            style={{ height: `${bin.fillPercentage}%` }}
            className={`w-full rounded-lg bg-gradient-to-t ${getFillColor(bin.fillPercentage)} transition-all duration-700 shadow-md relative overflow-hidden`}
          >
            {/* Animated shine line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-white/40 animate-pulse" />
          </div>

          {/* Grid scale lines */}
          <div className="absolute inset-0 flex flex-col justify-between p-2 pointer-events-none opacity-20">
            <div className="border-b border-white" />
            <div className="border-b border-white" />
            <div className="border-b border-white" />
          </div>
        </div>

        {/* Level Stats */}
        <div className="flex-1 space-y-2">
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1 font-medium">
              <span>Garbage Capacity</span>
              <span className="text-slate-200 font-bold">{bin.fillPercentage}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-700">
              <div
                style={{ width: `${bin.fillPercentage}%` }}
                className={`h-full rounded-full bg-gradient-to-r ${getFillColor(bin.fillPercentage)} transition-all duration-500`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
            <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
              <span className="text-slate-500 block text-[10px]">Sensor Distance</span>
              <span className="font-mono text-slate-200 font-semibold">{bin.currentLevelCm} cm</span>
            </div>
            <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
              <span className="text-slate-500 block text-[10px]">Total Depth</span>
              <span className="font-mono text-slate-200 font-semibold">{bin.heightCm} cm</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
            <span>Updated: <strong className="text-slate-300">{formattedTime}</strong></span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center space-x-1">
          <button
            onClick={() => onSimulateAdd(bin.binId)}
            title="Add Simulated Trash (+15%)"
            className="p-1.5 text-xs text-cyan-400 hover:text-cyan-300 bg-cyan-950/40 hover:bg-cyan-900/50 rounded-lg border border-cyan-800/40 transition-colors flex items-center space-x-1"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="text-[11px] hidden sm:inline">+Trash</span>
          </button>

          <button
            onClick={() => onEmpty(bin.binId)}
            title="Empty Bin"
            className="p-1.5 text-xs text-amber-400 hover:text-amber-300 bg-amber-950/40 hover:bg-amber-900/50 rounded-lg border border-amber-800/40 transition-colors flex items-center space-x-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="text-[11px]">Empty</span>
          </button>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={() => onSelect(bin)}
            className="px-2.5 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors flex items-center space-x-1"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Details</span>
          </button>

          <button
            onClick={() => onDelete(bin.binId)}
            title="Delete Bin"
            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Trash className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

    </div>
  );
}
