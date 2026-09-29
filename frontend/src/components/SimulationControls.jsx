import React from 'react';
import { Play, Pause, Sparkles, RefreshCw, Zap, ShieldAlert } from 'lucide-react';

export default function SimulationControls({ 
  simulationRunning, 
  onToggle, 
  onTriggerFillAll, 
  onEmptyAll 
}) {
  return (
    <div className="glass-card p-4 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 bg-slate-900/40">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-purple-500/20 text-purple-400 rounded-xl border border-purple-500/30">
          <Zap className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h4 className="text-sm font-bold text-slate-200">IoT Telemetry Simulator</h4>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
              Demo Mode
            </span>
          </div>
          <p className="text-xs text-slate-400">Simulate physical ultrasonic readings, waste accumulation, and servo lid triggers</p>
        </div>
      </div>

      <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
        <button
          onClick={onToggle}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center space-x-1.5 ${
            simulationRunning 
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
          }`}
        >
          {simulationRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          <span>{simulationRunning ? 'Pause Engine' : 'Start Simulation'}</span>
        </button>

        <button
          onClick={onTriggerFillAll}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-800/60 transition-colors flex items-center space-x-1"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Simulate Waste (+20%)</span>
        </button>

        <button
          onClick={onEmptyAll}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-800/60 transition-colors flex items-center space-x-1"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reset All Bins</span>
        </button>
      </div>
    </div>
  );
}
