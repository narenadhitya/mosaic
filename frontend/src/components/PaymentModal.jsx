import React, { useState } from 'react';
import { formatPaiseToRupees } from '../utils/formatters';
import { 
  X, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowRight, 
  Smartphone, 
  QrCode, 
  Lock,
  Loader2,
  Building2,
  UserCheck,
  FileText
} from 'lucide-react';

export default function PaymentModal({ isOpen, onClose, bill, onPaymentSuccess, onViewReceipt }) {
  const [selectedApp, setSelectedApp] = useState('GPAY');
  const [isProcessing, setIsProcessing] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [error, setError] = useState(null);

  if (!isOpen || !bill) return null;

  const upiApps = [
    { id: 'GPAY', name: 'Google Pay', color: 'from-blue-600 to-emerald-500' },
    { id: 'PHONEPE', name: 'PhonePe', color: 'from-purple-600 to-indigo-600' },
    { id: 'PAYTM', name: 'Paytm UPI', color: 'from-sky-500 to-blue-700' },
    { id: 'BHIM', name: 'BHIM UPI', color: 'from-orange-500 to-emerald-600' },
  ];

  const handlePay = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      const res = await fetch('/api/consumer/pay-bill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bill_id: bill.id,
          upi_app: selectedApp,
          simulated_upi_pin: '1234'
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Payment could not be processed');
      }

      setReceipt(data);
      if (onPaymentSuccess) {
        onPaymentSuccess(data);
      }
    } catch (err) {
      setError(err.message || 'Payment failed. Please retry.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setReceipt(null);
    setError(null);
    onClose();
  };

  const handleOpenReceipt = () => {
    const receiptData = receipt?.receipt;
    handleClose();
    if (onViewReceipt) {
      onViewReceipt(bill.id, receiptData);
    }
  };

  const getSplitRailDescription = () => {
    switch (bill.bill_type) {
      case 'RENT':
        return 'Direct to Landlord Bank VPA (Rent Settlement)';
      case 'ELECTRICITY':
        return 'Direct to DISCOM Sub-Meter Rail';
      case 'WATER':
        return 'Direct to Municipal Water Board Rail';
      case 'MAINTENANCE':
        return 'Direct to Society Maintenance Fund';
      default:
        return 'Direct NPCI Certified Settlement Rail';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Mosaic Instant UPI Pay</h3>
              <p className="text-[11px] text-slate-400">NPCI Certified Direct Settlement</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {receipt ? (
          /* Success Receipt View */
          <div className="p-6 space-y-5 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20 animate-in zoom-in-50 duration-200">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">Payment Successful</span>
              <h2 className="text-2xl font-black text-white mt-1">
                {formatPaiseToRupees(bill.amount_paise)}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Paid to <span className="text-slate-200 font-medium">{receipt.payee_name}</span>
              </p>
            </div>

            {/* Receipt Summary Box */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Transaction Ref:</span>
                <span className="font-mono text-indigo-300 font-medium">{receipt.transaction_ref}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Payee UPI VPA:</span>
                <span className="font-mono text-slate-300">{receipt.payee_vpa}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Audit Trace ID:</span>
                <span className="font-mono text-slate-400 text-[10px]">{receipt.trace_id}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-800/80">
                <span className="text-slate-400">Ledger Status:</span>
                <span className="text-emerald-400 font-semibold text-[11px]">POSTED (Double-Entry Balanced)</span>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={handleOpenReceipt}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all"
              >
                <FileText className="w-4 h-4" />
                <span>View & Download Official Receipt</span>
              </button>

              <button
                onClick={handleClose}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
              >
                Done &bull; Return to Home
              </button>
            </div>
          </div>
        ) : (
          /* Payment Selection Form */
          <div className="p-6 space-y-5">
            {/* Bill Details Summary Card */}
            <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">{bill.title}</span>
                <span className="text-[10px] font-mono bg-indigo-500/10 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/20">
                  Flat {bill.flat_no}
                </span>
              </div>

              <div className="flex items-baseline justify-between pt-1">
                <div className="text-2xl font-black text-white">
                  {formatPaiseToRupees(bill.amount_paise)}
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Payee Destination</span>
                  <span className="text-xs font-semibold text-emerald-400">{bill.payee_name}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-indigo-500/10 flex items-center justify-between text-[11px] text-slate-400">
                <span>Settlement Rail:</span>
                <span className="text-slate-200 font-medium text-[11px]">{getSplitRailDescription()}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Direct UPI VPA:</span>
                <span className="font-mono text-indigo-300 text-xs font-medium">{bill.payee_vpa}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-emerald-400">
                <span>Convenience Surcharge:</span>
                <span className="font-mono font-semibold">₹0.00 (Zero Fee)</span>
              </div>
            </div>

            {/* UPI App Selection */}
            <div className="space-y-2.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Select Payment Rail</span>
                <span className="text-[10px] text-slate-500">Zero surcharge</span>
              </label>

              <div className="grid grid-cols-2 gap-2.5">
                {upiApps.map((app) => (
                  <button
                    key={app.id}
                    type="button"
                    onClick={() => setSelectedApp(app.id)}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                      selectedApp === app.id
                        ? 'bg-slate-800 border-indigo-500 text-white shadow-md shadow-indigo-500/10'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className={`w-3 h-3 rounded-full border flex items-center justify-center ${
                      selectedApp === app.id ? 'border-indigo-400 bg-indigo-400' : 'border-slate-600'
                    }`}>
                      {selectedApp === app.id && <div className="w-1.5 h-1.5 bg-slate-900 rounded-full" />}
                    </div>
                    <span className="text-xs font-semibold">{app.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                {error}
              </div>
            )}

            {/* Pay Button */}
            <button
              onClick={handlePay}
              disabled={isProcessing}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 hover:from-indigo-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Authorizing UPI Payment...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Authorize & Pay {formatPaiseToRupees(bill.amount_paise)}</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Protected by BIS IS 19671:2026 validation engine</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
