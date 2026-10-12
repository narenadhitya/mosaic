import React, { useState, useEffect } from 'react';
import { formatPaiseToRupees } from '../utils/formatters';
import { X, ShieldCheck, BookOpen, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';

export default function TransactionDetailModal({ paymentId, onClose }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/transactions/${paymentId}`)
      .then(res => res.json())
      .then(data => {
        setDetail(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [paymentId]);

  if (!detail && loading) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-slate-900 p-6 rounded-2xl text-slate-400 text-xs animate-pulse">
          Loading transaction trace & ledger details...
        </div>
      </div>
    );
  }

  const p = detail?.payment;
  const le = detail?.ledger_entry;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">
                Trace Explorer
              </span>
              <h2 className="text-base font-bold text-white">Payment & Ledger Detail</h2>
            </div>
            <div className="text-xs font-mono text-slate-400 mt-0.5">{p?.trace_id}</div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5">Resident / Flat</span>
              <span className="font-semibold text-slate-200">Flat {p?.flat_no} — {p?.payer_name}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Amount</span>
              <span className="font-bold text-emerald-400 text-sm">
                {formatPaiseToRupees(p?.amount_paise, true)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Target VPA</span>
              <span className="font-mono text-xs text-indigo-300">{p?.target_vpa}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Provider Reference</span>
              <span className="font-mono text-xs text-slate-300">{p?.provider_ref || 'None'}</span>
            </div>
          </div>

          {/* Anomaly banner if fraud scenario */}
          {p?.is_fraud_scenario && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                Structural Anomaly Detected
              </div>
              <p className="text-rose-200/90">{p?.flagged_reason}</p>
            </div>
          )}

          {/* Double-Entry Ledger Lines */}
          <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                  Double-Entry Ledger Lines
                </span>
              </div>
              {le && (
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Balanced ({le.total_debit_paise} paise)
                </span>
              )}
            </div>

            {le ? (
              <div className="space-y-2 text-xs">
                {le.lines?.map((line, idx) => (
                  <div key={idx} className="flex items-center justify-between font-mono py-1">
                    <span className="text-slate-300 text-[11px]">{line.account_name}</span>
                    <div className="text-right">
                      {line.debit_paise > 0 && (
                        <span className="text-emerald-400 font-semibold">
                          Dr {formatPaiseToRupees(line.debit_paise, true)}
                        </span>
                      )}
                      {line.credit_paise > 0 && (
                        <span className="text-indigo-400 font-semibold">
                          Cr {formatPaiseToRupees(line.credit_paise, true)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Entry: <span className="font-mono text-slate-300">{le.id}</span></span>
                  <span className="text-emerald-400 font-medium">Net Difference: 0 paise</span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 py-3 text-center">
                No ledger entry posted (Payment did not settle or was flagged).
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
