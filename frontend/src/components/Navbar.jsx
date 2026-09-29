import React from 'react';
import { Trash2, Cpu, Activity, Play, Pause, Plus, RefreshCw, AlertTriangle } from 'lucide-react';

export default function Navbar({ 
  stats, 
  simulationRunning, 
  onToggleSimulation, 
  onOpenAddBin, 
  onOpenFirmware, 
  onRefresh, 
  isRefreshing,
  activeAlertCount 
}) {
  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand */}
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl shadow-lg shadow-emerald-500/10">
              <Trash2 className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                  SmartBin
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  IoT System
                </span>
              </div>
              <p className="text-xs text-slate-400">Waste Management Dashboard</p>
            </div>
          </div>

          {/* Center Info / Simulation Badge */}
          <div className="hidden md:flex items-center space-x-3">
            <button
              onClick={onToggleSimulation}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                simulationRunning
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/25'
                  : 'bg-amber-500/15 text-amber-300 border-amber-500/40 hover:bg-amber-500/25'
              }`}
            >
              {simulationRunning ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Telemetry Simulation Active</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-amber-400" />
                  <span>Simulation Paused (Click to Start)</span>
                </>
              )}
            </button>

            {activeAlertCount > 0 && (
              <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-red-500/15 text-red-300 border border-red-500/30 text-xs font-semibold animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                <span>{activeAlertCount} Full Bins Alert</span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              title="Refresh Data"
              className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
            </button>

            <button
              onClick={onOpenFirmware}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition-all shadow-sm"
            >
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline">ESP32 Firmware</span>
            </button>

            <button
              onClick={onOpenAddBin}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 shadow-md shadow-emerald-500/20 transition-all transform active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Register Bin</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
