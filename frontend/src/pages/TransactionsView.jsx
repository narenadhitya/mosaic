import React, { useState, useEffect } from 'react';
import { formatPaiseToRupees } from '../utils/formatters';
import TransactionDetailModal from '../components/TransactionDetailModal';
import { Receipt, AlertTriangle, ShieldCheck, CheckCircle2, XCircle, Eye } from 'lucide-react';

export default function TransactionsView() {
  const [transactions, setTransactions] = useState([]);
  const [showFraud, setShowFraud] = useState(true);
  const [loading, setLoading] = useState(true);
  const [selectedTxId, setSelectedTxId] = useState(null);

  useEffect(() => {
    fetch(`/api/transactions?include_fraud=${showFraud}`)
      .then(res => res.json())
      .then(data => {
        setTransactions(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [showFraud]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Transactions & Payment Traces
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            End-to-end payment journal with trace IDs, target VPAs, and fraud scenario tags. Click any row to view double-entry ledger lines.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1.5 rounded-lg text-xs">
          <label className="flex items-center gap-2 cursor-pointer text-slate-300 px-2">
            <input
              type="checkbox"
              checked={showFraud}
              onChange={(e) => setShowFraud(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
            />
            <span>Include Seeded Fraud Scenarios (6 records)</span>
          </label>
        </div>
      </div>

      <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
            <tr>
              <th className="p-4">Trace ID</th>
              <th className="p-4">Payment ID</th>
              <th className="p-4">Resident</th>
              <th className="p-4">Target VPA</th>
              <th className="p-4 text-right">Amount</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4">Anomaly Flag</th>
              <th className="p-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {transactions.map((tx) => (
              <tr 
                key={tx.id} 
                onClick={() => setSelectedTxId(tx.id)}
                className={`hover:bg-slate-800/40 cursor-pointer transition-colors ${tx.is_fraud_scenario ? 'bg-rose-950/10' : ''}`}
              >
                <td className="p-4 font-mono font-medium text-indigo-400">{tx.trace_id}</td>
                <td className="p-4 font-mono text-slate-400">{tx.id}</td>
                <td className="p-4">
                  <div className="font-semibold text-slate-200">Flat {tx.flat_no}</div>
                  <div className="text-[11px] text-slate-400">{tx.payer_name}</div>
                </td>
                <td className="p-4 font-mono text-xs">
                  <span className={tx.is_fraud_scenario ? 'text-rose-400 font-semibold' : 'text-emerald-400'}>
                    {tx.target_vpa}
                  </span>
                </td>
                <td className="p-4 text-right font-bold text-slate-100">
                  {formatPaiseToRupees(tx.amount_paise, true)}
                </td>
                <td className="p-4 text-center">
                  {tx.status === 'SUCCESS' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" /> SUCCESS
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      <XCircle className="w-3 h-3" /> FAILED
                    </span>
                  )}
                </td>
                <td className="p-4">
                  {tx.is_fraud_scenario ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                      <AlertTriangle className="w-3 h-3 shrink-0" />
                      {tx.flagged_reason?.split(':')[0] || 'VPA_ANOMALY'}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                      Verified
                    </span>
                  )}
                </td>
                <td className="p-4 text-right">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTxId(tx.id);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    title="View Ledger Trace"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedTxId && (
        <TransactionDetailModal
          paymentId={selectedTxId}
          onClose={() => setSelectedTxId(null)}
        />
      )}
    </div>
  );
}
