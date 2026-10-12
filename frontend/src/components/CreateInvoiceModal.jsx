import React, { useState } from 'react';
import { X, Plus, FileText, CheckCircle2 } from 'lucide-react';

export default function CreateInvoiceModal({ onClose, onSuccess }) {
  const [flatNo, setFlatNo] = useState('701');
  const [residentName, setResidentName] = useState('Naveen Chandran');
  const [userId, setUserId] = useState('usr_701');
  const [month, setMonth] = useState('October 2026');
  const [amountRupees, setAmountRupees] = useState(5500);
  const [dueDate, setDueDate] = useState('2026-10-25');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          flat_no: flatNo,
          resident_name: residentName,
          month: month,
          amount_rupees: parseFloat(amountRupees),
          due_date: dueDate
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to create invoice');
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-400" />
            <h2 className="text-base font-bold text-white">Raise Maintenance Invoice</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 block mb-1">Flat Number</label>
              <input
                type="text"
                value={flatNo}
                onChange={(e) => setFlatNo(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-medium focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Resident Name</label>
              <input
                type="text"
                value={residentName}
                onChange={(e) => setResidentName(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-medium focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 block mb-1">Amount (₹)</label>
              <input
                type="number"
                value={amountRupees}
                onChange={(e) => setAmountRupees(e.target.value)}
                required
                min="100"
                step="50"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-medium focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Billing Month</label>
              <input
                type="text"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-medium focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Create Invoice
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
