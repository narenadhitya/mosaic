import React, { useState, useEffect } from 'react';
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
  Activity,
  Flame,
  Snowflake,
  Waves,
  Layers,
  Radio,
  Sliders,
  Check
} from 'lucide-react';

export default function SmartMetersView({ meters, onSyncMeter, flatNo = '4B' }) {
  const [selectedMeterType, setSelectedMeterType] = useState('ELECTRICITY');
  const [telemetry, setTelemetry] = useState(null);
  const [loadingTelemetry, setLoadingTelemetry] = useState(false);
  const [syncingProfile, setSyncingProfile] = useState(null);
  const [successToast, setSuccessToast] = useState(null);

  const fetchTelemetry = async (type) => {
    setLoadingTelemetry(true);
    try {
      const res = await fetch(`/api/consumer/smart-meter/telemetry?flat_no=${flatNo}&meter_type=${type}`);
      const data = await res.json();
      setTelemetry(data);
    } catch (err) {
      console.error('Failed to fetch meter telemetry:', err);
    } finally {
      setLoadingTelemetry(false);
    }
  };

  useEffect(() => {
    fetchTelemetry(selectedMeterType);
  }, [selectedMeterType, flatNo]);

  const activeMeter = meters?.find(m => m.meter_type === selectedMeterType) || telemetry?.meter;
  const isElec = selectedMeterType === 'ELECTRICITY';

  const handleSimulatePulse = async (profileId) => {
    setSyncingProfile(profileId);
    try {
      if (onSyncMeter) {
        await onSyncMeter(selectedMeterType, profileId);
      }
      await fetchTelemetry(selectedMeterType);
      const profile = telemetry?.load_profiles?.find(p => p.id === profileId);
      setSuccessToast(`Logged ${profile?.label || 'IoT pulse'} (${profile?.delta}) successfully!`);
      setTimeout(() => setSuccessToast(null), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSyncingProfile(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider">
            <Cpu className="w-3.5 h-3.5" />
            <span>Automated IoT Telemetry & Slabs</span>
          </div>
          <h1 className="text-2xl font-black text-white mt-1">
            Smart Sub-Meters &mdash; Flat {flatNo}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Continuous hardware telemetry polling. Zero manual logbooks, zero disputed bill splits.
          </p>
        </div>

        {/* Meter Type Switcher */}
        <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-2xl">
          <button
            onClick={() => setSelectedMeterType('ELECTRICITY')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              isElec 
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-md' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Electricity Sub-Meter</span>
          </button>
          <button
            onClick={() => setSelectedMeterType('WATER')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              !isElec 
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-md' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Droplets className="w-3.5 h-3.5" />
            <span>Water Flow Meter</span>
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successToast && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successToast}</span>
          </div>
          <span className="text-[10px] font-mono text-emerald-400/80">LIVE BROADCAST</span>
        </div>
      )}

      {/* Current Meter Overview Hero Card */}
      {activeMeter && (
        <div className={`p-6 rounded-3xl border shadow-2xl relative overflow-hidden ${
          isElec
            ? 'bg-gradient-to-br from-amber-950/30 via-slate-900 to-slate-900 border-amber-500/30'
            : 'bg-gradient-to-br from-cyan-950/30 via-slate-900 to-slate-900 border-cyan-500/30'
        }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold ${
                  isElec ? 'bg-amber-500/20 text-amber-400' : 'bg-cyan-500/20 text-cyan-400'
                }`}>
                  {isElec ? <Zap className="w-5 h-5" /> : <Droplets className="w-5 h-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-white">
                      {isElec ? 'Apartment Electricity Sub-Meter' : 'Ultrasonic Water Smart Meter'}
                    </h2>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      LIVE ONLINE
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">Device ID: {activeMeter.device_id}</div>
                </div>
              </div>

              <div className="flex items-baseline gap-4 pt-1">
                <div>
                  <span className="text-[11px] text-slate-400 block">Current Cycle Consumption</span>
                  <div className="text-4xl font-black text-white">
                    {activeMeter.cycle_consumption} <span className="text-sm font-normal text-slate-400">{activeMeter.unit_label}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                    Cumulative reading: {activeMeter.current_reading} {activeMeter.unit_label}
                  </div>
                </div>

                <div className="pl-6 border-l border-slate-800">
                  <span className="text-[11px] text-slate-400 block">Accrued Billing Liability</span>
                  <div className={`text-3xl font-black ${isElec ? 'text-amber-400' : 'text-cyan-400'}`}>
                    {formatPaiseToRupees(activeMeter.calculated_bill_paise, true)}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Tariff: ₹{activeMeter.rate_per_unit_paise/100} per {activeMeter.unit_label}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2 text-xs md:w-64">
              <div className="flex justify-between">
                <span className="text-slate-400">Billing Cycle:</span>
                <span className="text-slate-200 font-medium">{activeMeter.billing_period}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Invoice Due:</span>
                <span className="text-slate-200 font-mono">{activeMeter.due_date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Mesh Signal:</span>
                <span className="text-emerald-400 font-mono text-[11px]">{telemetry?.hardware?.rssi || '-67 dBm'}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-800">
                <span className="text-slate-400">Telemetry Status:</span>
                <span className="text-indigo-400 font-bold text-[10px]">POLLING (Every 15s)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interactive IoT Load Simulator Pulse Center */}
      <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <Sliders className="w-4 h-4 text-indigo-400" />
              <span>Interactive IoT Device Load Simulator</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Trigger real-world residential appliance loads to test instant meter incrementation & bill recalculation.
            </p>
          </div>
          <span className="text-[10px] font-mono text-slate-500 bg-slate-800 px-2 py-0.5 rounded">
            HARDWARE EMULATOR
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {telemetry?.load_profiles?.map((profile) => {
            const isSyncing = syncingProfile === profile.id;
            return (
              <button
                key={profile.id}
                onClick={() => handleSimulatePulse(profile.id)}
                disabled={isSyncing}
                className="p-4 rounded-2xl bg-slate-950/70 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/40 text-left transition-all space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-white group-hover:text-indigo-300 transition-colors">
                    {profile.label}
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                    {profile.delta}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {profile.desc}
                </p>
                <div className="pt-2 flex items-center gap-1.5 text-[10px] text-indigo-400 font-semibold">
                  <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Injecting Telemetry...' : 'Click to Trigger Pulse'}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 24-Hour Diurnal Consumption Chart */}
      <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-white">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>24-Hour Diurnal Telemetry Curve (Hourly Consumption)</span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">00:00 &mdash; 23:00</span>
        </div>

        {/* Visual Bar Graph */}
        <div className="h-44 flex items-end gap-1.5 pt-6 pb-2 px-2 border-b border-slate-800">
          {telemetry?.hourly_data?.map((point, index) => {
            const maxVal = isElec ? 2.8 : 1.8;
            const heightPct = Math.min(100, (point.value / maxVal) * 100);
            const isPeak = point.value >= (isElec ? 2.0 : 1.2);

            return (
              <div 
                key={index} 
                className="flex-1 flex flex-col items-center gap-1 h-full justify-end group relative"
              >
                {/* Tooltip on Hover */}
                <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] font-mono py-1 px-2 rounded-lg border border-slate-700 pointer-events-none whitespace-nowrap z-20 shadow-lg">
                  {point.hour}: {point.value} {point.unit}
                </div>

                {/* Bar */}
                <div 
                  style={{ height: `${heightPct}%` }}
                  className={`w-full rounded-t transition-all duration-300 ${
                    isPeak
                      ? isElec ? 'bg-amber-500 shadow-md shadow-amber-500/20' : 'bg-cyan-500 shadow-md shadow-cyan-500/20'
                      : 'bg-slate-700 group-hover:bg-indigo-500'
                  }`}
                />
                <span className="text-[8px] font-mono text-slate-500 hidden sm:block">
                  {index % 4 === 0 ? point.hour.split(':')[0] : ''}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded-sm ${isElec ? 'bg-amber-500' : 'bg-cyan-500'}`} />
              <span>Peak Living Load (AC / Geyser)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-slate-700" />
              <span>Base Refrigeration & Standby</span>
            </div>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Polled via Zigbee 3.0</span>
        </div>
      </div>

      {/* Tariff Slabs & Hardware Telemetry Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Tariff Slabs Card */}
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-white">
            <Layers className="w-4 h-4 text-purple-400" />
            <span>Government Tariff Slab Breakdown ({isElec ? 'BESCOM LT-2' : 'BWSSB Domestic'})</span>
          </div>

          <div className="space-y-2.5">
            {telemetry?.tariff_slabs?.map((slab, i) => (
              <div key={i} className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-slate-200">{slab.tier}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{slab.range} &bull; {slab.description}</div>
                </div>
                <span className="font-extrabold text-white text-sm">
                  ₹{slab.rate_rupees.toFixed(2)} <span className="text-[10px] font-normal text-slate-400">/{activeMeter?.unit_label}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Hardware Telemetry Card */}
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-white">
            <Radio className="w-4 h-4 text-cyan-400" />
            <span>IoT Hardware Specification & Calibration</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Hardware Model:</span>
              <span className="font-semibold text-white">{telemetry?.hardware?.model}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Communication Rail:</span>
              <span className="text-slate-300 font-mono text-[11px]">{telemetry?.hardware?.protocol}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Accuracy Class:</span>
              <span className="text-emerald-400 font-mono">{telemetry?.hardware?.accuracy_class}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Power Supply:</span>
              <span className="text-slate-300">{telemetry?.hardware?.power_source}</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-slate-400">Calibration Certificate:</span>
              <span className="text-slate-300 font-mono text-[11px]">{telemetry?.hardware?.last_calibrated}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
