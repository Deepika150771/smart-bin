import React from 'react';
import { MapPin, Navigation, Compass, Layers } from 'lucide-react';

export default function MapView({ bins = [], onSelectBin }) {
  return (
    <div className="glass-panel p-6 border border-slate-800 relative overflow-hidden">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center space-x-2">
            <Compass className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-bold text-slate-100">Live Bin GIS Location Radar</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">Spatial distribution of smart waste collection points</p>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <span className="flex items-center space-x-1 text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
            <span>Empty</span>
          </span>
          <span className="flex items-center space-x-1 text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
            <span>Half</span>
          </span>
          <span className="flex items-center space-x-1 text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block animate-pulse"></span>
            <span>Full</span>
          </span>
        </div>
      </div>

      {/* Map Radar Grid Canvas */}
      <div className="w-full h-80 rounded-2xl bg-slate-950 border border-slate-800 relative overflow-hidden flex items-center justify-center p-4">
        
        {/* Background Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage: `radial-gradient(#38bdf8 1px, transparent 1px), radial-gradient(#38bdf8 1px, #020617 1px)`,
            backgroundSize: `24px 24px`,
            backgroundPosition: `0 0, 12px 12px`
          }}
        />

        {/* Circular Radar Rings */}
        <div className="absolute w-[450px] h-[450px] rounded-full border border-cyan-500/10 pointer-events-none" />
        <div className="absolute w-[300px] h-[300px] rounded-full border border-cyan-500/15 pointer-events-none" />
        <div className="absolute w-[150px] h-[150px] rounded-full border border-cyan-500/20 pointer-events-none" />

        {/* Bin Location Pins */}
        <div className="relative w-full h-full">
          {bins.map((bin, index) => {
            // Position bin on radar based on index or coordinates mock offset
            const positions = [
              { top: '25%', left: '30%' },
              { top: '40%', left: '70%' },
              { top: '70%', left: '45%' },
              { top: '60%', left: '20%' },
              { top: '30%', left: '80%' },
              { top: '75%', left: '75%' }
            ];

            const pos = positions[index % positions.length];
            const isFull = bin.status === 'Full' || bin.fillPercentage >= 80;
            const isHalf = bin.status === 'Half' || bin.fillPercentage >= 40;

            const pinColor = isFull 
              ? 'bg-red-500 text-red-100 shadow-red-500/50 border-red-400' 
              : isHalf 
              ? 'bg-amber-500 text-amber-950 shadow-amber-500/50 border-amber-300' 
              : 'bg-emerald-500 text-emerald-950 shadow-emerald-500/50 border-emerald-300';

            return (
              <div
                key={bin.binId}
                style={{ top: pos.top, left: pos.left }}
                onClick={() => onSelectBin(bin)}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-10"
              >
                {/* Pulse Ring */}
                <div className={`absolute -inset-2 rounded-full opacity-40 animate-ping ${
                  isFull ? 'bg-red-500' : isHalf ? 'bg-amber-500' : 'bg-emerald-500'
                }`} />

                {/* Marker Badge */}
                <div className={`relative px-2.5 py-1.5 rounded-xl text-xs font-bold border ${pinColor} shadow-lg flex items-center space-x-1.5 transition-transform group-hover:scale-110`}>
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{bin.binId}</span>
                  <span className="text-[10px] font-extrabold px-1 rounded bg-black/30">
                    {bin.fillPercentage}%
                  </span>
                </div>

                {/* Tooltip Card on Hover */}
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-48 p-2.5 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-30 pointer-events-none text-xs text-slate-200">
                  <p className="font-bold text-slate-100 truncate">{bin.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{bin.location?.address}</p>
                  <div className="mt-1 flex justify-between text-[11px]">
                    <span>Status: <strong className="text-emerald-400">{bin.status}</strong></span>
                    <span>Dist: <strong className="font-mono">{bin.currentLevelCm}cm</strong></span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Overlay */}
        <div className="absolute bottom-3 left-3 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800 text-[11px] text-slate-400 flex items-center space-x-2">
          <Navigation className="w-3.5 h-3.5 text-cyan-400" />
          <span>Interactive GIS Coordinates Overlay Active</span>
        </div>

      </div>
    </div>
  );
}
