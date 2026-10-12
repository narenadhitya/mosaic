import React from 'react';
import { formatPaiseToRupees } from '../utils/formatters';
import { 
  Bell, 
  Clock, 
  Home, 
  Zap, 
  Building2, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar,
  CreditCard,
  MessageSquare
} from 'lucide-react';

export default function RemindersView({ homeData, onPayBill }) {
  const bills = homeData?.bills || [];
  const unpaidBills = bills.filter(b => b.status === 'UNPAID');
  const notifications = homeData?.recent_notifications || [];

  const getNotifIcon = (type) => {
    switch (type) {
      case 'RENT_DUE':
        return <Home className="w-4 h-4 text-indigo-400" />;
      case 'METER_SYNC':
        return <Zap className="w-4 h-4 text-amber-400" />;
      case 'PAYMENT_CONFIRMED':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      default:
        return <Building2 className="w-4 h-4 text-purple-400" />;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider">
            <Bell className="w-3.5 h-3.5" />
            <span>Reminders & Due Countdowns</span>
          </div>
          <h1 className="text-2xl font-black text-white mt-1">
            Notifications & Deadlines
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Never miss a payment deadline. Instant alerts for rent countdowns, meter cycles, and landlord nudges.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-2xl flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-semibold text-slate-200">
            {unpaidBills.length} Active Deadlines
          </span>
        </div>
      </div>

      {/* Countdown Cards for Unpaid Bills */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Calendar className="w-4 h-4 text-indigo-400" />
          <span>Payment Deadlines & Countdowns</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {unpaidBills.map((bill) => {
            const isRent = bill.bill_type === 'RENT';

            return (
              <div 
                key={bill.id}
                className={`p-5 rounded-2xl border space-y-3 flex flex-col justify-between ${
                  isRent
                    ? 'bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 border-indigo-500/30'
                    : 'bg-slate-900/60 border-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">{bill.title}</span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                      isRent 
                        ? 'bg-amber-500/10 text-amber-300 border-amber-500/20' 
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      Due: {bill.due_date}
                    </span>
                  </div>

                  <div className="text-xl font-black text-white mt-2">
                    {formatPaiseToRupees(bill.amount_paise)}
                  </div>

                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Payee: <span className="text-slate-300 font-medium">{bill.payee_name}</span> ({bill.payee_vpa})
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{isRent ? '4 days remaining' : '18 days remaining'}</span>
                  </span>

                  <button
                    onClick={() => onPayBill(bill)}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all flex items-center gap-1.5"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Pay Now</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Notifications Log */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-indigo-400" />
            <span>Community & Living Notification Feed</span>
          </div>
          <span className="text-xs text-slate-400">{notifications.length} alerts</span>
        </div>

        <div className="divide-y divide-slate-800/80">
          {notifications.map((notif) => (
            <div key={notif.id} className="py-3.5 flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                {getNotifIcon(notif.notification_type)}
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-slate-200">{notif.title}</h4>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{notif.message}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
