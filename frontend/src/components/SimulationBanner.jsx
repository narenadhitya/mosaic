import React from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

export default function SimulationBanner() {
  return (
    <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2 text-xs text-amber-300 flex items-center justify-between sticky top-0 z-50 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
        <span className="font-semibold tracking-wide uppercase">Simulation Mode</span>
        <span className="text-amber-200/80 hidden sm:inline">
          — No real funds are moving. All bank interfaces, UPI rails, and provider callbacks are strictly simulated.
        </span>
      </div>
      <div className="flex items-center gap-2 text-amber-400 font-mono text-[11px] bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
        <ShieldCheck className="w-3.5 h-3.5" />
        <span>BIS IS 19671 &bull; DPDP 2023 &bull; ISO 27001</span>
      </div>
    </div>
  );
}
