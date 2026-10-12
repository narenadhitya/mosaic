import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  Network, 
  GitCommit, 
  Scale, 
  AlertTriangle, 
  CheckCircle2, 
  ExternalLink,
  Flame,
  RotateCcw
} from 'lucide-react';

export default function UnderTheHoodDrawer({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('bis'); // 'bis', 'graph', 'merkle', 'dpdp'
  const [telemetry, setTelemetry] = useState(null);
  const [fraudActive, setFraudActive] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetch('/api/security/telemetry')
        .then(r => r.json())
        .then(data => {
          setTelemetry(data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/80 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-2xl bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-tight">Under The Hood — Security & Standards Engine</h2>
                <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  Invisible Backend
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Technical showcase for hackathon judges: Institutional security running silently beneath the consumer UI.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center border-b border-slate-800 px-5 bg-slate-950/30 text-xs font-medium gap-1 overflow-x-auto">
          {[
            { id: 'bis', label: 'BIS IS 19671 QR', icon: Scale },
            { id: 'graph', label: 'Knowledge Graph', icon: Network },
            { id: 'merkle', label: 'Merkle Audit (ISO 27001)', icon: GitCommit },
            { id: 'dpdp', label: 'DPDP Privacy', icon: ShieldCheck },
          ].map(t => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`py-3 px-3 flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                  isActive
                    ? 'border-indigo-500 text-indigo-400 font-semibold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Drawer Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs text-slate-300">
          {loading && !telemetry ? (
            <div className="py-12 text-center text-slate-500 animate-pulse">
              Reading live cryptographic proofs & compliance telemetry from backend...
            </div>
          ) : (
            <>
              {/* TAB 1: BIS IS 19671 QR */}
              {activeTab === 'bis' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white text-sm">BIS IS 19671:2026 QR Shield</span>
                      <span className="font-mono text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                        Active Pre-Scan
                      </span>
                    </div>
                    <p className="text-slate-400 leading-relaxed text-[11px]">
                      National standard for code-scanning payment security (ISO 5201:2024). Validates payee addresses, INR currency constraint, and invoice matching silently in the backend before presenting payment QR codes to residents.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Seeded Verification Test Payloads
                    </div>
                    {telemetry?.bis_qr_engine?.scenarios?.map((sc, i) => (
                      <div key={i} className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-slate-200">{sc.label}</span>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                            sc.expected_verdict === 'PASS' 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            {sc.expected_verdict}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">{sc.description}</p>
                        <div className="p-2 rounded bg-slate-900 font-mono text-[10px] text-indigo-300 break-all border border-slate-800">
                          {sc.payload}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 2: KNOWLEDGE GRAPH */}
              {activeTab === 'graph' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white text-sm">Payment Knowledge Graph (NetworkX)</span>
                      <span className="font-mono text-[11px] text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded">
                        Payee Anomaly Radar
                      </span>
                    </div>
                    <p className="text-slate-400 leading-relaxed text-[11px]">
                      Models the society as a graph ($$\text{Resident} \rightarrow \text{Payment} \rightarrow \text{VPA}$$). Automatically intercepts payee substitution attacks when multiple residents are tricked into routing payments to an unregistered address.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Live Detected Structural Findings
                    </div>
                    {telemetry?.knowledge_graph?.anomalies_detected?.map((a, i) => (
                      <div key={i} className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-rose-300">{a.title}</span>
                          <span className="text-[10px] font-mono bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded">
                            {a.severity}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300">{a.description}</p>
                        <div className="text-[10px] font-mono text-rose-400 mt-1">
                          Rogue Payee Node: {a.affected_vpa} ({a.affected_payers_count} residents affected)
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: MERKLE AUDIT FOREST */}
              {activeTab === 'merkle' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white text-sm">Merkle Audit Forest</span>
                      <span className="font-mono text-[11px] text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">
                        ISO 27001 Control A.8.15
                      </span>
                    </div>
                    <p className="text-slate-400 leading-relaxed text-[11px]">
                      Every 10 transactions form an audit epoch cryptographically sealed in a binary SHA-256 tree. A single modified character breaks the root verification path, guaranteeing tamper-evident financial ledgers.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 font-mono text-[11px] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Current Epoch ID:</span>
                      <span className="text-indigo-400 font-bold">#{telemetry?.merkle_forest?.latest_epoch_id}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Batched Transaction Events:</span>
                      <span className="text-slate-200">{telemetry?.merkle_forest?.event_count} events</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-1">Epoch Root Hash (SHA-256):</span>
                      <div className="p-2 rounded bg-slate-900 text-purple-300 break-all border border-slate-800">
                        {telemetry?.merkle_forest?.root_hash}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: DPDP PRIVACY */}
              {activeTab === 'dpdp' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white text-sm">DPDP Act 2023 Consent Guard</span>
                      <span className="font-mono text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                        PII Minimised
                      </span>
                    </div>
                    <p className="text-slate-400 leading-relaxed text-[11px]">
                      Enforces data minimisation before utility/billing processing. Strips phone numbers and personal names, recording purpose and actor in the consent ledger.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Recent Privacy Audit Trail
                    </div>
                    {telemetry?.dpdp_ledger?.recent_logs?.map((l, i) => (
                      <div key={i} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1 font-mono text-[11px]">
                        <div className="flex items-center justify-between text-slate-300">
                          <span>Actor: {l.actor_id} ({l.actor_role})</span>
                          <span className="text-emerald-400">{l.purpose}</span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Target: {l.target_user_id} &bull; Fields: {l.fields_accessed_json}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Deterministic financial engine active</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
