import React, { useState } from 'react';
import { formatPaiseToRupees } from '../utils/formatters';
import { 
  Home, 
  Zap, 
  Droplets, 
  Building2, 
  Calendar, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  RefreshCw, 
  ShieldCheck,
  CreditCard,
  AlertCircle,
  FileText,
  Download
} from 'lucide-react';

export default function ResidentHomeView({ homeData, onSyncMeter, onPayBill, onViewReceipt }) {
  const [syncing, setSyncing] = useState(false);
  const flat = homeData?.active_flat;
  const bills = homeData?.bills || [];
  const meters = homeData?.smart_meters || [];
  const unpaidBills = bills.filter(b => b.status === 'UNPAID');

  const rentBill = bills.find(b => b.bill_type === 'RENT');
  const eleMeter = meters.find(m => m.meter_type === 'ELECTRICITY');
  const waterMeter = meters.find(m => m.meter_type === 'WATER');

  const handleSyncClick = async (type) => {
    setSyncing(true);
    if (onSyncMeter) await onSyncMeter(type);
    setTimeout(() => setSyncing(false), 500);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Home Hero Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-950/60 via-slate-900/80 to-slate-900 border border-indigo-500/20 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider">
              <Home className="w-3.5 h-3.5" />
              <span>Flat {flat?.flat_no} &bull; {flat?.bhk_type} ({flat?.wing})</span>
            </div>
            <h1 className="text-2xl font-black text-white mt-1">
              Welcome back, {homeData?.user_name}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Owner: <span className="text-slate-300 font-medium">{flat?.owner_name}</span> &bull; Sunrise Heights Gated Community
            </p>
          </div>

          <div className="flex flex-col sm:items-end">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Total Outstanding</span>
            <div className="text-2xl font-extrabold text-emerald-400 mt-0.5">
              {formatPaiseToRupees(homeData?.total_unpaid_paise, true)}
            </div>
            <span className="text-[10px] text-slate-500">{unpaidBills.length} pending obligations</span>
          </div>
        </div>
      </div>

      {/* Featured Primary Card: Rent Due */}
      {rentBill && rentBill.status === 'UNPAID' && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-900/30 via-slate-900 to-slate-900 border border-indigo-500/30 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white uppercase tracking-wide">Monthly Apartment Rent</span>
                <span className="text-[10px] font-mono bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded border border-amber-500/20">
                  Due in 4 Days (16th Oct)
                </span>
              </div>
              <div className="text-xl font-black text-white mt-1">
                {formatPaiseToRupees(rentBill.amount_paise)}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Payee: {rentBill.payee_name} &bull; VPA: <span className="font-mono text-indigo-300">{rentBill.payee_vpa}</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => onPayBill(rentBill)}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all shrink-0"
          >
            <CreditCard className="w-4 h-4" />
            <span>Pay Rent Now</span>
          </button>
        </div>
      )}

      {/* Smart Automated Utilities Grid (Electricity & Water) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Automated Smart Meters (IoT Telemetry)</span>
          </div>
          <span className="text-[11px] text-slate-400">Zero manual logging &bull; Live meter sync</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Electricity Smart Meter Card */}
          {eleMeter && (
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
                  <Zap className="w-4 h-4" />
                  <span>Electricity Sub-Meter ({eleMeter.device_id})</span>
                </div>
                <button
                  onClick={() => handleSyncClick('ELECTRICITY')}
                  disabled={syncing}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
                  title="Simulate polling IoT device"
                >
                  <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin text-amber-400' : ''}`} />
                  <span>Sync Device</span>
                </button>
              </div>

              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <div className="text-2xl font-black text-white">
                    {eleMeter.cycle_consumption} <span className="text-xs font-normal text-slate-400">kWh</span>
                  </div>
                  <div className="text-[11px] text-slate-400">Cumulative: {eleMeter.current_reading} kWh</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-amber-400">
                    {formatPaiseToRupees(eleMeter.calculated_bill_paise, true)}
                  </div>
                  <div className="text-[10px] text-slate-500">Tariff: ₹{eleMeter.rate_per_unit_paise/100}/kWh</div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>Billing Period: {eleMeter.billing_period}</span>
                <span className="text-emerald-400 font-mono text-[10px] bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  &bull; LIVE SYNCED
                </span>
              </div>
            </div>
          )}

          {/* Water Smart Meter Card */}
          {waterMeter && (
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400">
                  <Droplets className="w-4 h-4" />
                  <span>Water Smart Meter ({waterMeter.device_id})</span>
                </div>
                <button
                  onClick={() => handleSyncClick('WATER')}
                  disabled={syncing}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
                  title="Simulate polling IoT device"
                >
                  <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin text-cyan-400' : ''}`} />
                  <span>Sync Device</span>
                </button>
              </div>

              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <div className="text-2xl font-black text-white">
                    {waterMeter.cycle_consumption} <span className="text-xs font-normal text-slate-400">kL</span>
                  </div>
                  <div className="text-[11px] text-slate-400">Cumulative: {waterMeter.current_reading} kL</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-cyan-400">
                    {formatPaiseToRupees(waterMeter.calculated_bill_paise, true)}
                  </div>
                  <div className="text-[10px] text-slate-500">Water Board: ₹{waterMeter.rate_per_unit_paise/100}/kL</div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>Billing Period: {waterMeter.billing_period}</span>
                <span className="text-emerald-400 font-mono text-[10px] bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  &bull; LIVE SYNCED
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Outstanding Dues Breakdown Table */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-bold text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-400" />
            <span>Active Flat Invoices & Obligations</span>
          </div>
          <span className="text-xs text-slate-400">{unpaidBills.length} unpaid items</span>
        </div>

        <div className="divide-y divide-slate-800/80 text-xs">
          {bills.map((bill) => (
            <div key={bill.id} className="py-3.5 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="font-semibold text-slate-200 flex items-center gap-2">
                  <span>{bill.title}</span>
                  {bill.is_automated_meter && (
                    <span className="text-[9px] font-mono bg-cyan-500/10 text-cyan-300 px-1.5 py-0.2 rounded border border-cyan-500/20">
                      IoT Auto
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400">
                  Payee: {bill.payee_name} &bull; Due: {bill.due_date}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="font-bold text-sm text-white">
                    {formatPaiseToRupees(bill.amount_paise, true)}
                  </div>
                  {bill.status === 'PAID' ? (
                    <span className="text-[10px] text-emerald-400 font-medium">Cleared</span>
                  ) : (
                    <span className="text-[10px] text-amber-400 font-medium">Unpaid</span>
                  )}
                </div>

                {bill.status === 'UNPAID' ? (
                  <button
                    onClick={() => onPayBill(bill)}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 transition-all shadow-sm"
                  >
                    Pay
                  </button>
                ) : (
                  <button
                    onClick={() => onViewReceipt && onViewReceipt(bill.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-all shadow-sm group"
                    title="View & Download Official Receipt"
                  >
                    <FileText className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                    <span>Receipt</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
