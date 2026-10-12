import React, { useState, useEffect } from 'react';
import { Network, QrCode, GitCommit, Bot, ShieldCheck, CheckCircle2, Scale } from 'lucide-react';

export default function GenericPhasePlaceholder({ tabId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let url = '';
    if (tabId === 'qr') url = '/api/qr/scenarios';
    else if (tabId === 'merkle') url = '/api/merkle/epoch/latest';
    else if (tabId === 'dpdp') url = '/api/dpdp/logs';
    else if (tabId === 'recon') url = '/api/recon/statement';
    else if (tabId === 'graph') url = '/api/graph?fraud_scenario=true';

    if (url) {
      setLoading(true);
      fetch(url)
        .then(r => r.json())
        .then(res => {
          setData(res);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [tabId]);

  const meta = {
    graph: {
      title: 'Payment Knowledge Graph',
      phase: 'Phase 3 Target',
      desc: 'Graph structural anomaly detection. Star topology routing with automatic VPA Degree Anomaly alerts.',
      icon: Network,
    },
    qr: {
      title: 'BIS IS 19671 QR Compliance Guard',
      phase: 'Phase 4 Target',
      desc: 'Clause-by-clause validation for UPI QR payloads against IS 19671:2026 / ISO 5201:2024.',
      icon: QrCode,
    },
    merkle: {
      title: 'Merkle Audit Forest',
      phase: 'Phase 5 Target',
      desc: 'Cryptographically sealed audit epochs with mathematical inclusion proofs (ISO 27001 Control A.8.15).',
      icon: GitCommit,
    },
    copilot: {
      title: 'Sarvam AI Multilingual Copilot',
      phase: 'Phase 7 Target',
      desc: 'Post-hoc transaction explanations in Tamil, Hindi, Telugu, Kannada, Bengali & English with deterministic fallback.',
      icon: Bot,
    },
    dpdp: {
      title: 'DPDP Act 2023 Consent Ledger',
      phase: 'Phase 6 Target',
      desc: 'Full audit log of personal data access, purpose tracking, and data minimisation evidence bundles.',
      icon: ShieldCheck,
    },
    recon: {
      title: 'Bank Statement Reconciliation',
      phase: 'Phase 8 Target',
      desc: 'Automated 1-to-1 matching of external bank credits against internal provider references.',
      icon: CheckCircle2,
    },
    standards: {
      title: 'Standards & Compliance Matrix',
      phase: 'Phase 8 Target',
      desc: 'Live telemetry mapping platform controls to BIS IS 19671, DPDP Act 2023, and IS/ISO/IEC 27001:2022.',
      icon: Scale,
    },
  }[tabId] || {
    title: 'Platform Module',
    phase: 'Future Phase',
    desc: 'Module will be configured in subsequent phases.',
    icon: Network,
  };

  const Icon = meta.icon;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Icon className="w-6 h-6 text-indigo-400" />
            {meta.title}
          </h1>
          <p className="text-sm text-slate-400 mt-1">{meta.desc}</p>
        </div>
        <span className="text-xs font-mono bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full border border-indigo-500/30">
          {meta.phase}
        </span>
      </div>

      <div className="p-5 rounded-xl bg-slate-900/40 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Seeded Foundation Data & API Response
          </div>
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
            HTTP 200 OK
          </span>
        </div>
        
        {loading ? (
          <div className="text-xs text-slate-400 animate-pulse">Loading seeded payload...</div>
        ) : (
          <pre className="p-4 rounded-lg bg-slate-950 font-mono text-xs text-indigo-300/90 overflow-x-auto border border-slate-800/80 max-h-96">
            {JSON.stringify(data, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
