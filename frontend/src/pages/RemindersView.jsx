import React, { useState } from 'react';
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
  MessageSquare,
  FileText,
  Download,
  CheckCheck
} from 'lucide-react';

export default function RemindersView({ homeData, onPayBill, onViewReceipt, onRefresh }) {
  const [markingRead, setMarkingRead] = useState(false);
  const bills = homeData?.bills || [];
  const unpaidBills = bills.filter(b => b.status === 'UNPAID');
  const paidBills = bills.filter(b => b.status === 'PAID');
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

  const getRemainingDays = (dueDateStr) => {
    if (!dueDateStr) return { label: 'Due soon', isUrgent: false };
    const today = new Date('2026-10-12');
    const due = new Date(dueDateStr);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { label: `${Math.abs(diffDays)}d Overdue`, isOverdue: true };
    if (diffDays === 0) return { label: 'Due Today', isUrgent: true };
    if (diffDays === 1) return { label: 'Due Tomorrow', isUrgent: true };
    return { label: `${diffDays} days remaining`, isUrgent: diffDays <= 4 };
  };

  const handleMarkAllRead = async () => {
    setMarkingRead(true);
    try {
      const res = await fetch('/api/consumer/notifications/mark-all-read', { method: 'POST' });
      if (res.ok && onRefresh) {
        await onRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setMarkingRead(false);
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

        <div className="flex items-center gap-2">
          <div className="bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-2xl flex items-center gap-2 shadow-sm">
            <Clock className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold text-slate-200">
              {unpaidBills.length} Active Deadlines
            </span>
          </div>
        </div>
      </div>

      {/* Countdown Cards for Unpaid Bills */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Calendar className="w-4 h-4 text-indigo-400" />
          <span>Payment Deadlines & Proactive Countdowns</span>
        </h2>

        {unpaidBills.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <div className="text-sm font-bold text-white">All Clear! No Pending Deadlines</div>
            <p className="text-xs text-slate-400">All your rent, electricity, water, and maintenance dues have been settled.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {unpaidBills.map((bill) => {
              const isRent = bill.bill_type === 'RENT';
              const countdown = getRemainingDays(bill.due_date);

              return (
                <div 
                  key={bill.id}
                  className={`p-5 rounded-2xl border space-y-3 flex flex-col justify-between transition-all ${
                    isRent
                      ? 'bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 border-indigo-500/30 shadow-lg shadow-indigo-950/20'
                      : 'bg-slate-900/60 border-slate-800'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white uppercase tracking-wider">{bill.title}</span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                        countdown.isOverdue
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          : countdown.isUrgent
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
                    <span className={`text-[11px] flex items-center gap-1 font-medium ${
                      countdown.isOverdue ? 'text-rose-400' : countdown.isUrgent ? 'text-amber-400' : 'text-slate-400'
                    }`}>
                      <Clock className="w-3.5 h-3.5" />
                      <span>{countdown.label}</span>
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
        )}
      </div>

      {/* Payment History & Downloadable Receipts */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-bold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>Settled Payments & Downloadable Receipts</span>
          </div>
          <span className="text-xs text-slate-400">{paidBills.length} cleared invoices</span>
        </div>

        {paidBills.length === 0 ? (
          <div className="text-xs text-slate-500 py-4 text-center">
            No cleared bills yet. Once you complete a payment, its official tax receipt will appear here.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {paidBills.map((bill) => (
              <div key={bill.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <div className="font-semibold text-slate-200 flex items-center gap-2">
                    <span>{bill.title}</span>
                    <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-300 px-2 py-0.2 rounded border border-emerald-500/20">
                      Settled
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Paid to {bill.payee_name} &bull; Cleared on {new Date(bill.paid_at || bill.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <div className="font-bold text-sm text-white">
                    {formatPaiseToRupees(bill.amount_paise)}
                  </div>
                  <button
                    onClick={() => onViewReceipt && onViewReceipt(bill.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-all group"
                    title="Download Official Tax Receipt & Proof"
                  >
                    <Download className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                    <span>Download Receipt</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notifications Log */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-indigo-400" />
            <span>Community & Living Notification Feed</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">{notifications.length} alerts</span>
            {notifications.some(n => !n.is_read) && (
              <button
                onClick={handleMarkAllRead}
                disabled={markingRead}
                className="flex items-center gap-1 text-[11px] font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                title="Mark all notifications as read"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark All Read</span>
              </button>
            )}
          </div>
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
