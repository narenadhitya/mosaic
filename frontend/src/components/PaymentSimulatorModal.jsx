import React, { useState } from 'react';
import { formatPaiseToRupees } from '../utils/formatters';
import { 
  X, 
  ShieldCheck, 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ArrowRight, 
  RotateCcw,
  BookOpen
} from 'lucide-react';

export default function PaymentSimulatorModal({ invoice, onClose, onSuccess }) {
  const [step, setStep] = useState('INITIATE'); // INITIATE, SIMULATING, RESULT
  const [scenario, setScenario] = useState('SUCCESS');
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const scenarios = [
    { id: 'SUCCESS', label: 'Simulate Success', desc: 'Valid payment callback. Triggers balanced double-entry ledger posting.', color: 'emerald' },
    { id: 'DUPLICATE_CALLBACK', label: 'Simulate Duplicate Callback', desc: 'Simulates provider firing callback twice. Validates zero double-posting.', color: 'indigo' },
    { id: 'AMOUNT_MISMATCH', label: 'Simulate Amount Mismatch', desc: 'Callback returns mismatched paise amount. Flagged as anomaly and rejected.', color: 'rose' },
    { id: 'FAILURE', label: 'Simulate Payment Failure', desc: 'Gateway transaction declined by resident bank.', color: 'rose' },
    { id: 'TIMEOUT', label: 'Simulate Network Timeout', desc: 'Gateway drops connection. Payment remains strictly in PENDING without posting.', color: 'amber' },
  ];

  const handleStartSimulation = async () => {
    try {
      setLoading(true);
      setError(null);
      setStep('SIMULATING');

      // 1. Initiate Payment
      const initRes = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoice_id: invoice.id })
      });
      if (!initRes.ok) {
        const err = await initRes.json();
        throw new Error(err.detail || 'Initiation failed');
      }
      const initData = await initRes.json();
      setPaymentData(initData.payment);

      // Add a slight realistic delay for simulator visual demo
      await new Promise(r => setTimeout(r, 600));

      // 2. Execute Simulator Outcome
      const simRes = await fetch('/api/payments/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_id: initData.payment.id,
          scenario: scenario
        })
      });
      if (!simRes.ok) {
        const err = await simRes.json();
        throw new Error(err.detail || 'Simulation execution failed');
      }
      const simData = await simRes.json();
      setResult(simData);
      setStep('RESULT');
      if (onSuccess && scenario === 'SUCCESS') onSuccess();
    } catch (err) {
      setError(err.message);
      setStep('INITIATE');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">
                Phase 2 Engine
              </span>
              <h2 className="text-base font-bold text-white">Payment & Settlement Simulator</h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Testing deterministic execution and double-entry ledger balancing for Flat {invoice.flat_no}
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Invoice Summary Card */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Invoice Reference:</span>
              <span className="font-mono text-indigo-400 font-medium">{invoice.id}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Resident / Flat:</span>
              <span className="text-slate-200 font-medium">{invoice.resident_name} (Flat {invoice.flat_no})</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Payable Amount:</span>
              <span className="text-base font-bold text-emerald-400">
                {formatPaiseToRupees(invoice.amount_paise, true)}
                <span className="text-[10px] text-slate-400 font-normal ml-1">({invoice.amount_paise} paise)</span>
              </span>
            </div>
            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
              <span className="text-slate-400">Target VPA:</span>
              <span className="font-mono text-[11px] text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> sunrise.society@hdfcbank
              </span>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {step === 'INITIATE' && (
            <div className="space-y-4">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                Select Simulation Scenario:
              </label>
              <div className="space-y-2">
                {scenarios.map((sc) => (
                  <button
                    key={sc.id}
                    onClick={() => setScenario(sc.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3 ${
                      scenario === sc.id
                        ? 'bg-indigo-600/10 border-indigo-500 text-white shadow-sm'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                      scenario === sc.id ? 'border-indigo-400 bg-indigo-500' : 'border-slate-600'
                    }`}>
                      {scenario === sc.id && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-200">{sc.label}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{sc.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 'SIMULATING' && (
            <div className="p-8 text-center space-y-4">
              <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <div className="text-sm font-semibold text-slate-200">Executing Deterministic Lifecycle...</div>
              <div className="text-xs text-slate-400 font-mono space-y-1">
                <div>[1] Created Payment Session</div>
                <div>[2] Advanced State: CREATED &rarr; PENDING</div>
                <div>[3] Simulating Gateway Callback...</div>
              </div>
            </div>
          )}

          {step === 'RESULT' && result && (
            <div className="space-y-4">
              {/* Outcome Badge */}
              <div className={`p-4 rounded-xl border ${
                result.action === 'PAYMENT_POSTED'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : result.action === 'IGNORED_DUPLICATE'
                  ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
                  : result.action === 'SIMULATOR_TIMEOUT'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}>
                <div className="flex items-center gap-2 font-bold text-sm">
                  {result.action === 'PAYMENT_POSTED' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                  {result.action === 'IGNORED_DUPLICATE' && <RotateCcw className="w-4 h-4 text-indigo-400" />}
                  {result.action === 'SIMULATOR_TIMEOUT' && <Clock className="w-4 h-4 text-amber-400" />}
                  {result.action === 'PAYMENT_FAILED' && <AlertTriangle className="w-4 h-4 text-rose-400" />}
                  <span>{result.action}</span>
                </div>
                <div className="text-xs mt-1 text-slate-300">
                  {result.message || result.reason || `Payment successfully processed. Provider ref: ${result.provider_ref}`}
                </div>
              </div>

              {/* Balanced Double-Entry Ledger Details if posted */}
              {result.ledger_entry && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                    <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                      Balanced Double-Entry Journal
                    </span>
                    <span className="font-mono text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                      Debits = Credits ({result.ledger_entry.total_debit_paise} paise)
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    {result.ledger_entry.lines.map((line, idx) => (
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
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Journal Entry ID: <span className="font-mono text-slate-300">{result.ledger_entry.entry_id}</span></span>
                    <span className="text-emerald-400 font-medium">Net Balance: 0 paise</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end gap-3">
          {step === 'INITIATE' && (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleStartSimulation}
                disabled={loading}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition-all"
              >
                <Play className="w-3.5 h-3.5" />
                Run Simulation
              </button>
            </>
          )}

          {step === 'RESULT' && (
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white transition-all"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
