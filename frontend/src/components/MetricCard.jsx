import React from 'react';

export default function MetricCard({ title, value, subtext, icon: Icon, trend, color = 'indigo' }) {
  const colorMap = {
    indigo: 'from-indigo-500/10 to-indigo-500/5 text-indigo-400 border-indigo-500/20',
    emerald: 'from-emerald-500/10 to-emerald-500/5 text-emerald-400 border-emerald-500/20',
    amber: 'from-amber-500/10 to-amber-500/5 text-amber-400 border-amber-500/20',
    rose: 'from-rose-500/10 to-rose-500/5 text-rose-400 border-rose-500/20',
  };

  return (
    <div className={`p-5 rounded-xl bg-gradient-to-br ${colorMap[color]} border backdrop-blur-sm relative overflow-hidden`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-400 tracking-wide uppercase">{title}</span>
        {Icon && <Icon className="w-5 h-5 opacity-80" />}
      </div>
      <div className="text-2xl font-bold tracking-tight text-white mb-1">
        {value}
      </div>
      {subtext && (
        <div className="text-xs text-slate-400 flex items-center gap-1.5">
          {trend && <span className="font-medium text-emerald-400">{trend}</span>}
          <span>{subtext}</span>
        </div>
      )}
    </div>
  );
}
