import React, { useState } from 'react';
import { formatPaiseToRupees } from '../utils/formatters';
import { 
  Zap, 
  Droplets, 
  RefreshCw, 
  Cpu, 
  Clock, 
  CheckCircle2, 
  ShieldCheck, 
  TrendingUp,
  Activity
} from 'lucide-react';

export default function SmartMetersView({ meters, onSyncMeter }) {
  const [syncingType, setSyncingType] = useState(null);

  const handleSync = async (type) => {
    setSyncingType(type);
    if (onSyncMeter) await onSyncMeter(type);
    setTimeout(() => setSyncingType(null), 500);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider">
            <Cpu className="w-3.5 h-3.5" />
            <span>Automated Utility Telemetry</span>
          </div>
          <h1 className="text-2xl font-black text-white mt-1">
            Smart Meters (Flat 4B)
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Automated IoT hardware integration: readings are polled continuously and billed with zero manual paperwork.
          </p>
        </div>
      </div>

      {/* Smart Meters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {meters?.map((meter) => {
          const isElec = meter.meter_type === 'ELECTRICITY';
          const isSyncing = syncingType === meter.meter_type;

          return (
            <div 
              key={meter.id}
              className={`p-6 rounded-2xl border space-y-4 shadow-xl transition-all ${
                isElec 
                  ? 'bg-gradient-to-br from-amber-950/20 via-slate-900 to-slate-900 border-amber-500/30'
                  : 'bg-gradient-to-br from-cyan-950/20 via-slate-900 to-slate-900 border-cyan-500/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                    isElec ? 'bg-amber-500/20 text-amber-400' : 'bg-cyan-500/20 text-cyan-400'
                  }`}>
                    {isElec ? <Zap className="w-5 h-5" /> : <Droplets className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white">
                      {isElec ? 'Electricity Sub-Meter' : 'Water Smart Meter'}
                    </h3>
                    <div className="text-[10px] font-mono text-slate-400">ID: {meter.device_id}</div>
                  </div>
                </div>

                <button
                  onClick={() => handleSync(meter.meter_type)}
                  disabled={isSyncing}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all shadow-sm"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-amber-400' : ''}`} />
                  <span>Sync Telemetry</span>
                </button>
              </div>

              {/* Main Consumption Gauge */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 block mb-0.5">Cycle Consumption</span>
                  <div className="text-3xl font-black text-white">
                    {meter.cycle_consumption} <span className="text-xs font-normal text-slate-400">{meter.unit_label}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    Cumulative: {meter.current_reading} {meter.unit_label}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block mb-0.5">Auto-Calculated Dues</span>
                  <div className={`text-2xl font-black ${isElec ? 'text-amber-400' : 'text-cyan-400'}`}>
                    {formatPaiseToRupees(meter.calculated_bill_paise, true)}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Rate: ₹{meter.rate_per_unit_paise/100} / {meter.unit_label}
                  </div>
                </div>
              </div>

              {/* Metadata */}
              <div className="space-y-1.5 text-xs text-slate-400 pt-1">
                <div className="flex items-center justify-between">
                  <span>Billing Period:</span>
                  <span className="text-slate-200 font-medium">{meter.billing_period}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Due Date:</span>
                  <span className="text-slate-200 font-mono">{meter.due_date}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Last Hardware Sync:</span>
                  <span className="text-emerald-400 font-mono text-[10px]">Just now (Live)</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
