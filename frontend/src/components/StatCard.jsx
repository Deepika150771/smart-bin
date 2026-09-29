import React from 'react';

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'emerald' }) {
  const colorMap = {
    emerald: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      iconBg: 'bg-emerald-500/20 text-emerald-400',
      text: 'text-emerald-400'
    },
    amber: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      iconBg: 'bg-amber-500/20 text-amber-400',
      text: 'text-amber-400'
    },
    red: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
      iconBg: 'bg-red-500/20 text-red-400',
      text: 'text-red-400'
    },
    cyan: {
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/20',
      iconBg: 'bg-cyan-500/20 text-cyan-400',
      text: 'text-cyan-400'
    },
    purple: {
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20',
      iconBg: 'bg-purple-500/20 text-purple-400',
      text: 'text-purple-400'
    }
  };

  const theme = colorMap[color] || colorMap.emerald;

  return (
    <div className={`p-4 sm:p-5 rounded-2xl glass-card ${theme.bg} ${theme.border} border flex items-start justify-between`}>
      <div>
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</p>
        <div className="mt-2 flex items-baseline space-x-2">
          <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-100">{value}</span>
        </div>
        {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
      </div>
      {Icon && (
        <div className={`p-3 rounded-xl ${theme.iconBg} shadow-inner`}>
          <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      )}
    </div>
  );
}
