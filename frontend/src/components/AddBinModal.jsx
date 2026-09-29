import React, { useState } from 'react';
import { X, Plus, Trash2, MapPin, Gauge } from 'lucide-react';

export default function AddBinModal({ isOpen, onClose, onAddBin }) {
  const [formData, setFormData] = useState({
    binId: `BIN-${Math.floor(100 + Math.random() * 900)}`,
    name: '',
    address: '',
    lat: '40.758896',
    lng: '-73.978718',
    zone: 'Zone 1 - Main Public Area',
    capacityLiters: 100,
    heightCm: 100
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    onAddBin({
      binId: formData.binId,
      name: formData.name,
      location: {
        address: formData.address || 'Central City Square',
        lat: parseFloat(formData.lat) || 40.7128,
        lng: parseFloat(formData.lng) || -74.0060,
        zone: formData.zone
      },
      capacityLiters: Number(formData.capacityLiters),
      heightCm: Number(formData.heightCm)
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-lg p-6 relative shadow-2xl border border-slate-700 animate-in fade-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">Register New SmartBin</h3>
              <p className="text-xs text-slate-400">Configure IoT bin telemetry & sensor depth</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Bin ID (Unique)</label>
              <input
                type="text"
                required
                value={formData.binId}
                onChange={(e) => setFormData({ ...formData, binId: e.target.value.toUpperCase() })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Bin Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Park North Gate Bin"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Location Address</label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Street address or landmark description"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Zone Area</label>
              <input
                type="text"
                value={formData.zone}
                onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Capacity (L)</label>
              <input
                type="number"
                min="10"
                max="1000"
                value={formData.capacityLiters}
                onChange={(e) => setFormData({ ...formData, capacityLiters: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Sensor Height (cm)</label>
              <input
                type="number"
                min="20"
                max="500"
                value={formData.heightCm}
                onChange={(e) => setFormData({ ...formData, heightCm: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg text-xs font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20 flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Register Smart Bin</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
