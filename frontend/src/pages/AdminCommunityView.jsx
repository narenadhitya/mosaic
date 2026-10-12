import React, { useState, useEffect } from 'react';
import { formatPaiseToRupees } from '../utils/formatters';
import { 
  Building2, 
  Users, 
  Send, 
  CheckCircle2, 
  Clock, 
  IndianRupee, 
  Home, 
  ShieldCheck,
  Megaphone
} from 'lucide-react';

export default function AdminCommunityView() {
  const [community, setCommunity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [broadcastSent, setBroadcastSent] = useState(false);

  useEffect(() => {
    fetch('/api/consumer/admin/community')
      .then(r => r.json())
      .then(data => {
        setCommunity(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleBroadcast = () => {
    setBroadcastSent(true);
    setTimeout(() => setBroadcastSent(false), 4000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider">
            <Building2 className="w-3.5 h-3.5" />
            <span>RWA Administration Hub</span>
          </div>
          <h1 className="text-2xl font-black text-white mt-1">
            {community?.society_name || 'Sunrise Heights RWA'}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Community collection rail: <span className="font-mono text-emerald-400">sunrise.society@hdfcbank</span>
          </p>
        </div>

        <button
          onClick={handleBroadcast}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          <Megaphone className="w-4 h-4" />
          <span>Broadcast Due Reminder</span>
        </button>
      </div>

      {broadcastSent && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Automated maintenance payment reminders dispatched to all unpaid flats across Wing A & B!</span>
        </div>
      )}

      {/* RWA Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs">
          <div className="text-slate-400 uppercase tracking-wider text-[10px] mb-1">Total Flats</div>
          <div className="text-xl font-black text-white">{community?.total_flats} units</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Across Wing A & Wing B</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs">
          <div className="text-slate-400 uppercase tracking-wider text-[10px] mb-1">Occupancy Rate</div>
          <div className="text-xl font-black text-emerald-400">
            {community?.occupied_flats} / {community?.total_flats}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">{community?.vacant_flats} units vacant</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs">
          <div className="text-slate-400 uppercase tracking-wider text-[10px] mb-1">Maintenance Collected</div>
          <div className="text-xl font-black text-emerald-400">
            {formatPaiseToRupees(community?.total_maintenance_collected_paise)}
          </div>
          <div className="text-[10px] text-emerald-500/80 mt-0.5">Cleared to HDFC RWA A/C</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs">
          <div className="text-slate-400 uppercase tracking-wider text-[10px] mb-1">Outstanding Arrears</div>
          <div className="text-xl font-black text-amber-400">
            {formatPaiseToRupees(community?.total_maintenance_outstanding_paise)}
          </div>
          <div className="text-[10px] text-amber-500/80 mt-0.5">Due by 15th October</div>
        </div>
      </div>

      {/* Community Directory Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="font-bold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400" />
            <span>Apartment & Occupancy Directory</span>
          </div>
          <span className="text-slate-400">{community?.directory?.length} registered units</span>
        </div>

        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
            <tr>
              <th className="p-4">Flat No</th>
              <th className="p-4">Wing</th>
              <th className="p-4">BHK</th>
              <th className="p-4">Owner (Landlord)</th>
              <th className="p-4">Current Resident</th>
              <th className="p-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {community?.directory?.map((f) => (
              <tr key={f.id} className="hover:bg-slate-800/30 transition-colors">
                <td className="p-4 font-bold text-white">Flat {f.flat_no}</td>
                <td className="p-4 text-slate-400">{f.wing}</td>
                <td className="p-4 text-slate-400">{f.bhk_type}</td>
                <td className="p-4 font-medium text-slate-200">{f.owner_name}</td>
                <td className="p-4 text-slate-300">{f.tenant_name || <span className="text-slate-500 italic">None (Vacant)</span>}</td>
                <td className="p-4 text-center">
                  {f.is_occupied ? (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                      OCCUPIED
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
                      VACANT
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
