import React from 'react';
import { 
  Home, 
  Zap, 
  PieChart, 
  Building2, 
  Bell 
} from 'lucide-react';

export default function ConsumerNav({ currentTab, setCurrentTab, userRole }) {
  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'utilities', label: 'Smart Meters', icon: Zap },
    { id: 'expenses', label: 'Expense Radar', icon: PieChart },
    { 
      id: 'community', 
      label: userRole === 'landlord' ? 'My Properties' : userRole === 'admin' ? 'Community RWA' : 'Neighbors', 
      icon: Building2 
    },
    { id: 'reminders', label: 'Reminders', icon: Bell },
  ];

  return (
    <nav className="bg-slate-950/80 border-b border-slate-800/80 px-4 md:px-8 py-2 flex items-center justify-center sm:justify-start gap-1 md:gap-2 backdrop-blur-md sticky top-[61px] z-30 overflow-x-auto">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setCurrentTab(tab.id)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              isActive
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
