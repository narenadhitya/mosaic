import React from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Receipt, 
  Network, 
  QrCode, 
  GitCommit, 
  Scale, 
  Bot, 
  ShieldCheck, 
  CheckCircle2
} from 'lucide-react';

export default function Sidebar({ currentTab, setCurrentTab, userRole }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'invoices', label: 'Invoices', icon: FileText },
    { id: 'transactions', label: 'Transactions', icon: Receipt },
    { id: 'qr', label: 'QR Guard', icon: QrCode, badge: 'IS 19671' },
    { id: 'merkle', label: 'Merkle Audit', icon: GitCommit, badge: 'ISO 27001' },
    { id: 'copilot', label: 'AI Copilot', icon: Bot, badge: 'Sarvam' },
    { id: 'dpdp', label: 'DPDP Consent', icon: ShieldCheck, badge: 'Act 2023' },
    { id: 'recon', label: 'Reconciliation', icon: CheckCircle2 },
    { id: 'standards', label: 'BIS Compliance', icon: Scale },
  ];

  return (
    <aside className="w-64 bg-slate-950/80 border-r border-slate-800 flex flex-col shrink-0 min-h-screen">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 font-bold text-lg">
          M
        </div>
        <div>
          <div className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
            Mosaic
            <span className="text-[10px] font-mono bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/30">
              v1.0
            </span>
          </div>
          <div className="text-xs text-slate-400">Society Financial Intel</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
        <div className="px-3 py-1.5 text-[11px] font-semibold tracking-wider uppercase text-slate-500">
          Core Operations
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                    isActive
                      ? 'bg-indigo-500/30 text-indigo-100'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Role Indicator Footer */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
        <div className="text-[11px] text-slate-500 uppercase tracking-wider mb-1">Active Persona</div>
        <div className="text-xs font-semibold text-slate-300 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="capitalize">{userRole.replace('_', ' ')}</span>
        </div>
      </div>
    </aside>
  );
}
