import React, { useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { TrendingUp, Filter } from 'lucide-react';

export default function HistoricalChart({ readings = [], bins = [] }) {
  const [selectedBin, setSelectedBin] = useState('ALL');

  // Filter and format reading data
  const filteredReadings = selectedBin === 'ALL' 
    ? readings 
    : readings.filter(r => r.binId === selectedBin);

  const chartData = filteredReadings.map(r => ({
    time: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    fillPercentage: r.fillPercentage,
    binId: r.binId,
    distanceCm: r.distanceCm,
    status: r.status
  })).reverse();

  return (
    <div className="glass-panel p-6 border border-slate-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-bold text-slate-100">Historical Garbage Fill Trend</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">Real-time ultrasonic sensor reading history across monitored locations</p>
        </div>

        {/* Bin Filter Dropdown */}
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedBin}
            onChange={(e) => setSelectedBin(e.target.value)}
            className="bg-slate-900 text-xs text-slate-200 border border-slate-700 rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-500 font-medium"
          >
            <option value="ALL">All Bins Aggregate</option>
            {bins.map(b => (
              <option key={b.binId} value={b.binId}>
                {b.binId} - {b.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="h-64 flex items-center justify-center border border-dashed border-slate-800 rounded-xl">
          <p className="text-sm text-slate-500">No historical telemetry recorded yet</p>
        </div>
      ) : (
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="fillGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis domain={[0, 100]} stroke="#64748b" fontSize={11} tickLine={false} unit="%" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '0.75rem',
                  color: '#f8fafc',
                  fontSize: '12px'
                }}
                formatter={(value, name, props) => [`${value}% (${props.payload.distanceCm} cm dist)`, 'Fill Level']}
                labelFormatter={(label) => `Time: ${label}`}
              />
              <Area
                type="monotone"
                dataKey="fillPercentage"
                stroke="#10b981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#fillGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
