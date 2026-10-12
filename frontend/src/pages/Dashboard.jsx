import React, { useState, useEffect } from 'react';
import MetricCard from '../components/MetricCard';
import { formatPaiseToRupees } from '../utils/formatters';
import { 
  IndianRupee, 
  AlertOctagon, 
  FileCheck, 
  Users, 
  ArrowUpRight, 
  ArrowRight,
  ShieldAlert, 
  CheckCircle,
  Building,
  ExternalLink,
  RefreshCw
} from 'lucide-react';

export default function Dashboard({ stats, onNavigate, onRefresh }) {
  const [invoices, setInvoices] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [invRes, txRes] = await Promise.all([
          fetch('/api/invoices'),
          fetch('/api/transactions?include_fraud=false')
        ]);
        if (invRes.ok) setInvoices(await invRes.json());
        if (txRes.ok) setTransactions(await txRes.json());
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Title & Context */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Operations & Intelligence Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time financial collection metrics, knowledge graph anomalies, and compliance anchors for {stats?.society_name || 'Sunrise Housing Society'}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Feed
          </button>
        </div>
      </div>

      {/* Top Financial Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Collections"
          value={formatPaiseToRupees(stats?.total_collections_paise)}
          subtext={`${stats?.paid_invoices_count || 0} Invoices Settled`}
          icon={IndianRupee}
          color="emerald"
        />
        <MetricCard
          title="Outstanding Dues"
          value={formatPaiseToRupees(stats?.outstanding_dues_paise)}
          subtext={`${stats?.unpaid_invoices_count || 0} Unpaid Invoices`}
          icon={FileCheck}
          color="amber"
        />
        <MetricCard
          title="Flagged Anomalies"
          value={stats?.flagged_anomalies_count || 0}
          subtext="Graph Payee Mismatches"
          icon={AlertOctagon}
          color="rose"
        />
        <MetricCard
          title="Active Residents"
          value={stats?.total_residents_count || 0}
          subtext="Across Flats 101 to 602"
          icon={Users}
          color="indigo"
        />
      </div>

      {/* Society Details & Compliance Anchors */}
      <div className="p-5 rounded-xl bg-slate-900/40 border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Building className="w-4 h-4 text-indigo-400" />
            Society Information
          </div>
          <div className="font-semibold text-slate-200 text-sm">{stats?.society_name}</div>
          <div className="text-xs text-slate-400 mt-1">Plot 42, Sector 14, Palm Beach Rd, Navi Mumbai</div>
          <div className="text-xs font-mono text-indigo-400 mt-1">A/C: 50100428912345 (HDFC Bank)</div>
        </div>

        <div>
          <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
            Trusted Payment Rail (VPA)
          </div>
          <div className="font-mono text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1.5 rounded border border-emerald-500/20 inline-block">
            {stats?.trusted_vpa}
          </div>
          <div className="text-xs text-slate-400 mt-2">
            Payee: <span className="text-slate-300 font-medium">Sunrise Housing Society RWA</span>
          </div>
        </div>

        <div>
          <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
            Regulatory Compliance
          </div>
          <div className="space-y-1.5 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>BIS IS 19671:2026 QR Security</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>DPDP Act 2023 Consent Audit</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>IS/ISO 27001 Merkle Forest</span>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Section: Recent Transactions & Pending Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Confirmed Collections */}
        <div className="p-5 rounded-xl bg-slate-900/40 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-sm text-slate-200 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              Settled Collections (Double-Entry Posted)
            </div>
            <button
              onClick={() => onNavigate('transactions')}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-800/80">
            {transactions.slice(0, 3).map((tx) => (
              <div key={tx.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <div className="font-medium text-slate-200">
                    Flat {tx.flat_no} — {tx.payer_name}
                  </div>
                  <div className="text-[11px] font-mono text-slate-400">
                    Trace: {tx.trace_id} &bull; Ref: {tx.provider_ref}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-emerald-400">
                    {formatPaiseToRupees(tx.amount_paise)}
                  </div>
                  <span className="inline-block text-[10px] bg-emerald-500/10 text-emerald-300 px-1.5 py-0.5 rounded font-mono">
                    SUCCESS
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Invoices (Featuring Flat 4B for Live Demo) */}
        <div className="p-5 rounded-xl bg-slate-900/40 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-sm text-slate-200 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-amber-400" />
              Outstanding Invoices (Ready for Payment)
            </div>
            <button
              onClick={() => onNavigate('invoices')}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
            >
              View Invoices <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-800/80">
            {invoices.filter(i => i.status === 'UNPAID').slice(0, 3).map((inv) => (
              <div key={inv.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <div className="font-medium text-slate-200 flex items-center gap-1.5">
                    <span>Flat {inv.flat_no} — {inv.resident_name}</span>
                    {inv.flat_no === '4B' && (
                      <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 rounded border border-indigo-500/30">
                        Demo Flat
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] font-mono text-slate-400">
                    Invoice: {inv.id} &bull; Due: {inv.due_date}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-slate-200">
                    {formatPaiseToRupees(inv.amount_paise)}
                  </div>
                  <span className="inline-block text-[10px] bg-amber-500/10 text-amber-300 px-1.5 py-0.5 rounded font-mono">
                    UNPAID
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Demo Flow Quick Launch Panel */}
      <div className="p-5 rounded-xl bg-gradient-to-r from-indigo-950/40 via-slate-900/40 to-slate-900/40 border border-indigo-500/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="font-semibold text-sm text-white flex items-center gap-2">
              <span className="text-indigo-400 font-mono text-xs">⚡</span>
              Mosaic Core Innovations Navigation
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Explore the four core innovations built into the platform:
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onNavigate('graph')}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30 transition-all"
            >
              Payment Graph
            </button>
            <button
              onClick={() => onNavigate('qr')}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 transition-all"
            >
              IS 19671 QR Guard
            </button>
            <button
              onClick={() => onNavigate('merkle')}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-500/30 transition-all"
            >
              Merkle Forest
            </button>
            <button
              onClick={() => onNavigate('copilot')}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all"
            >
              Sarvam AI Copilot
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
