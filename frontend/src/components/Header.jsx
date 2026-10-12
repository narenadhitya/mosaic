import React from 'react';
import { 
  Building2, 
  ShieldCheck, 
  UserCheck, 
  Bell, 
  Key, 
  Home, 
  Sparkles 
} from 'lucide-react';

export default function Header({ userRole, setUserRole, unreadCount, onOpenSecurityDrawer, onOpenNotifications }) {
  const personas = [
    { id: 'resident', name: 'Rohan Verma', label: 'Resident (Flat 4B)', icon: Home, badge: 'Tenant' },
    { id: 'landlord', name: 'Vikram Malhotra', label: 'Landlord (Flat 4B Owner)', icon: Key, badge: 'Owner' },
    { id: 'admin', name: 'R. Sundaram', label: 'Society Admin (RWA Desk)', icon: Building2, badge: 'Secretary' },
  ];

  const currentPersona = personas.find(p => p.id === userRole) || personas[0];
  const PersonaIcon = currentPersona.icon;

  return (
    <header className="bg-slate-900/80 border-b border-slate-800 px-4 md:px-8 py-3.5 flex items-center justify-between backdrop-blur-md sticky top-0 z-40">
      {/* Brand & Apartment Title */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-indigo-400 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 font-black text-lg">
          M
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-base tracking-tight text-white">Mosaic</span>
            <span className="hidden sm:inline-block text-[10px] font-semibold bg-indigo-500/10 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/20">
              Sunrise Heights
            </span>
          </div>
          <div className="text-[11px] text-slate-400 font-medium hidden sm:block">
            Smart Home & Community Living
          </div>
        </div>
      </div>

      {/* Right Controls: Persona Switcher, Notification Bell, Security Shield */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Under the Hood Technical Showcase Button */}
        <button
          onClick={onOpenSecurityDrawer}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-all shadow-sm group"
          title="Open invisible backend security & BIS standards inspector"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
          <span className="hidden md:inline">Under The Hood</span>
          <span className="text-[10px] font-mono opacity-80 hidden lg:inline">&bull; BIS &bull; Graph &bull; Merkle</span>
        </button>

        {/* Notification Bell */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Notifications & Due Alerts"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
          )}
        </button>

        {/* Persona Switcher Dropdown */}
        <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 p-1.5 rounded-xl shadow-inner">
          <PersonaIcon className="w-4 h-4 text-indigo-400 ml-1 shrink-0" />
          <select
            value={userRole}
            onChange={(e) => setUserRole(e.target.value)}
            className="bg-transparent text-xs text-slate-200 font-semibold focus:outline-none cursor-pointer pr-1"
          >
            {personas.map((p) => (
              <option key={p.id} value={p.id} className="bg-slate-900 text-slate-200">
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
}
