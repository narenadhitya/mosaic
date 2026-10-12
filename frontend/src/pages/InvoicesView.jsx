import React, { useState, useEffect } from 'react';
import { formatPaiseToRupees } from '../utils/formatters';
import PaymentSimulatorModal from '../components/PaymentSimulatorModal';
import CreateInvoiceModal from '../components/CreateInvoiceModal';
import { FileText, CheckCircle2, Clock, Plus, Play, Sparkles } from 'lucide-react';

export default function InvoicesView({ userRole }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchInvoices = () => {
    setLoading(true);
    // If resident persona, filter to Flat 4B user usr_4b
    const url = userRole === 'resident' ? '/api/invoices?user_id=usr_4b' : '/api/invoices';
    fetch(url)
      .then(res => res.json())
      .then(data => {
        setInvoices(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchInvoices();
  }, [userRole]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Maintenance Invoices
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Society billing records tracked in exact integer paise. Unpaid invoices can be settled via deterministic simulation.
          </p>
        </div>
        {(userRole === 'admin' || userRole === 'accountant') && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Raise New Invoice
          </button>
        )}
      </div>

      {/* Invoices Table */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
            <tr>
              <th className="p-4">Invoice ID</th>
              <th className="p-4">Flat No</th>
              <th className="p-4">Resident</th>
              <th className="p-4">Month</th>
              <th className="p-4 text-right">Amount</th>
              <th className="p-4">Due Date</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {invoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-slate-800/30 transition-colors">
                <td className="p-4 font-mono font-medium text-slate-200">
                  {inv.id}
                  {inv.flat_no === '4B' && (
                    <span className="ml-2 text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/30 font-sans">
                      Demo Flat
                    </span>
                  )}
                </td>
                <td className="p-4 font-semibold text-white">Flat {inv.flat_no}</td>
                <td className="p-4 text-slate-200">{inv.resident_name}</td>
                <td className="p-4 text-slate-400">{inv.month}</td>
                <td className="p-4 text-right font-bold text-slate-100">
                  {formatPaiseToRupees(inv.amount_paise, true)}
                </td>
                <td className="p-4 font-mono text-slate-400">{inv.due_date}</td>
                <td className="p-4 text-center">
                  {inv.status === 'PAID' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" /> PAID
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <Clock className="w-3 h-3" /> UNPAID
                    </span>
                  )}
                </td>
                <td className="p-4 text-right">
                  {inv.status === 'UNPAID' ? (
                    <button
                      onClick={() => setSelectedInvoice(inv)}
                      className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 hover:text-white border border-indigo-500/40 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-all shadow-sm"
                    >
                      <Play className="w-3 h-3" />
                      Pay / Simulate
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-500 italic">Settled</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Simulator Modal */}
      {selectedInvoice && (
        <PaymentSimulatorModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onSuccess={() => {
            fetchInvoices();
          }}
        />
      )}

      {/* Create Invoice Modal */}
      {showCreateModal && (
        <CreateInvoiceModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => fetchInvoices()}
        />
      )}
    </div>
  );
}
