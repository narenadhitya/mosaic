import React from 'react';
import { formatPaiseToRupees } from '../utils/formatters';
import { 
  PieChart, 
  TrendingUp, 
  Home, 
  Zap, 
  Droplets, 
  Building2, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight,
  ShieldCheck,
  CreditCard,
  Lightbulb
} from 'lucide-react';

export default function ExpenseRadarView({ homeData, onPayBill }) {
  const bills = homeData?.bills || [];
  const breakdown = homeData?.monthly_expense_breakdown || {};
  
  const totalSpendPaise = (breakdown.RENT || 0) + (breakdown.ELECTRICITY || 0) + (breakdown.WATER || 0) + (breakdown.MAINTENANCE || 0);
  const totalSpendRupees = totalSpendPaise / 100;

  const categories = [
    {
      id: 'RENT',
      name: 'Apartment Rent',
      amountPaise: breakdown.RENT || 0,
      icon: Home,
      color: 'bg-indigo-500',
      textColor: 'text-indigo-400',
      bgColor: 'bg-indigo-500/10',
      borderColor: 'border-indigo-500/20',
      recipient: 'Landlord (Vikram Malhotra)',
      vpa: 'vikram.owner@hdfcbank'
    },
    {
      id: 'MAINTENANCE',
      name: 'Society Maintenance',
      amountPaise: breakdown.MAINTENANCE || 0,
      icon: Building2,
      color: 'bg-purple-500',
      textColor: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20',
      recipient: 'Sunrise Heights RWA',
      vpa: 'sunrise.society@hdfcbank'
    },
    {
      id: 'ELECTRICITY',
      name: 'Smart Electricity (IoT)',
      amountPaise: breakdown.ELECTRICITY || 0,
      icon: Zap,
      color: 'bg-amber-500',
      textColor: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
      recipient: 'BESCOM via Society Rail',
      vpa: 'sunrise.society@hdfcbank'
    },
    {
      id: 'WATER',
      name: 'Smart Water (IoT)',
      amountPaise: breakdown.WATER || 0,
      icon: Droplets,
      color: 'bg-cyan-500',
      textColor: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/20',
      recipient: 'BWSSB via Society Rail',
      vpa: 'sunrise.society@hdfcbank'
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider">
            <PieChart className="w-3.5 h-3.5" />
            <span>Living Expense Intelligence</span>
          </div>
          <h1 className="text-2xl font-black text-white mt-1">
            Expense Radar &mdash; Flat 4B
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Complete real-time breakdown of all monthly residential costs, smart meters, and society maintenance.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-2xl flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Monthly Budget</span>
            <span className="text-lg font-black text-white">{formatPaiseToRupees(totalSpendPaise, true)}</span>
          </div>
        </div>
      </div>

      {/* Proportional Distribution Bar */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-white">Monthly Expense Allocation (October 2026)</span>
          <span className="text-slate-400 font-mono text-[11px]">{formatPaiseToRupees(totalSpendPaise, true)} Total</span>
        </div>

        {/* Multi-segment Progress Bar */}
        <div className="h-3.5 w-full bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
          {categories.map((cat) => {
            const pct = totalSpendPaise > 0 ? (cat.amountPaise / totalSpendPaise) * 100 : 0;
            return (
              <div 
                key={cat.id} 
                style={{ width: `${pct}%` }} 
                className={`${cat.color} h-full transition-all duration-500`}
                title={`${cat.name}: ${pct.toFixed(1)}%`}
              />
            );
          })}
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
          {categories.map((cat) => {
            const pct = totalSpendPaise > 0 ? ((cat.amountPaise / totalSpendPaise) * 100).toFixed(1) : 0;
            return (
              <div key={cat.id} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${cat.color} shrink-0`} />
                <div>
                  <div className="font-semibold text-slate-200 text-[11px] truncate">{cat.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{pct}% &bull; {formatPaiseToRupees(cat.amountPaise, true)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Category Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const pct = totalSpendPaise > 0 ? ((cat.amountPaise / totalSpendPaise) * 100).toFixed(1) : 0;
          const matchingBill = bills.find(b => b.bill_type === cat.id);

          return (
            <div 
              key={cat.id}
              className={`p-5 rounded-2xl bg-slate-900/60 border ${cat.borderColor} space-y-3 flex flex-col justify-between`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${cat.bgColor} border ${cat.borderColor} flex items-center justify-center ${cat.textColor}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">{cat.name}</h3>
                    <p className="text-[11px] text-slate-400">{cat.recipient}</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded-lg">
                  {pct}%
                </span>
              </div>

              <div className="flex items-baseline justify-between pt-2 border-t border-slate-800/80">
                <div>
                  <div className="text-xl font-black text-white">
                    {formatPaiseToRupees(cat.amountPaise)}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">VPA: {cat.vpa}</div>
                </div>

                {matchingBill && (
                  <div>
                    {matchingBill.status === 'PAID' ? (
                      <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Cleared</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => onPayBill(matchingBill)}
                        className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all flex items-center gap-1.5"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Pay</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Historical Trend & Living Tips */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Comparison Card */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>Month-on-Month Trend</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
              <span className="text-slate-400">October 2026 (Current)</span>
              <span className="font-bold text-white">{formatPaiseToRupees(totalSpendPaise, true)}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
              <span className="text-slate-400">September 2026</span>
              <span className="font-bold text-slate-300">₹31,450</span>
            </div>
            <div className="flex justify-between items-center pt-1 text-[11px]">
              <span className="text-slate-400">Variance:</span>
              <span className="text-amber-400 font-semibold">+₹656 (+2.1%) due to AC utility usage</span>
            </div>
          </div>
        </div>

        {/* Smart Tips Card */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-400">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <span>Smart Living Insights</span>
          </div>

          <div className="space-y-2 text-xs text-slate-300">
            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span className="font-semibold text-white block">Automated IoT Telemetry Active</span>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Sub-meters record actual kWh and kL consumption directly. No manual logging or disputed split bills.
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span className="font-semibold text-white block">Transparent Split Destination</span>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Rent is routed directly to Vikram Malhotra, while Maintenance and Water are credited to Sunrise Heights RWA.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
