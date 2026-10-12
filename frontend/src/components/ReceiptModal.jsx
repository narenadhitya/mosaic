import React, { useState, useEffect, useRef } from 'react';
import { formatPaiseToRupees } from '../utils/formatters';
import { 
  X, 
  Printer, 
  Download, 
  Share2, 
  CheckCircle2, 
  Building2, 
  ShieldCheck, 
  FileText, 
  Check, 
  Copy, 
  Home, 
  Zap, 
  Droplets,
  Calendar,
  Lock,
  QrCode,
  Sparkles,
  Mail,
  Send,
  Loader2
} from 'lucide-react';

export default function ReceiptModal({ isOpen, onClose, billId, initialReceipt = null }) {
  const [receipt, setReceipt] = useState(initialReceipt);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [emailTarget, setEmailTarget] = useState('rohan.verma@gmail.com');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(null);
  const receiptRef = useRef(null);

  const handleSendEmail = async (e) => {
    e?.preventDefault();
    if (!receipt) return;
    setSendingEmail(true);
    setEmailSuccess(null);
    try {
      const res = await fetch('/api/consumer/email/send-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bill_id: receipt.bill_id,
          email: emailTarget
        })
      });
      const data = await res.json();
      if (res.ok && data.email_dispatch?.success) {
        setEmailSuccess(`Receipt sent to ${data.email_dispatch.recipient} via Resend! (ID: ${data.email_dispatch.email_id.slice(0, 12)}...)`);
        setTimeout(() => setEmailSuccess(null), 6000);
      } else {
        setEmailSuccess(`Resend notice: ${data.message || 'Dispatched via Resend test pipe'}`);
      }
    } catch (err) {
      console.error(err);
      setEmailSuccess('Email request failed. Please check backend.');
    } finally {
      setSendingEmail(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    if (initialReceipt) {
      setReceipt(initialReceipt);
    } else if (billId) {
      setLoading(true);
      fetch(`/api/consumer/receipt/${billId}`)
        .then(r => {
          if (!r.ok) throw new Error('Receipt not found');
          return r.json();
        })
        .then(d => {
          setReceipt(d);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [isOpen, billId, initialReceipt]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadText = () => {
    if (!receipt) return;
    const isRent = receipt.bill_type === 'RENT';
    
    let text = `========================================================================\n`;
    text += `       SUNRISE HEIGHTS RESIDENTS WELFARE ASSOCIATION (RWA)             \n`;
    text += `       Plot 42, Sector 14, Palm Beach Rd, Navi Mumbai, MH 400703       \n`;
    text += `       Registration No: RWA/BLR/2021/8841 | GSTIN: 29AAAAA0000A1Z5     \n`;
    text += `========================================================================\n\n`;
    text += `OFFICIAL DIGITAL TRANSACTION RECEIPT & TAX PROOF\n`;
    text += `Receipt Number:  ${receipt.receipt_number}\n`;
    text += `Date & Time:     ${new Date(receipt.paid_at).toLocaleString('en-IN')}\n`;
    text += `Status:          ${receipt.status} (SETTLED & RECONCILED)\n\n`;
    text += `RESIDENT DETAILS:\n`;
    text += `Tenant/Resident: ${receipt.payer_name}\n`;
    text += `Flat Allocation: ${receipt.payer_flat}\n`;
    text += `Contact Phone:   ${receipt.payer_phone}\n\n`;
    text += `PAYMENT PARTICULARS:\n`;
    text += `Description:     ${receipt.title}\n`;
    text += `Bill Type:       ${receipt.bill_type}\n`;
    text += `Total Settled:   ₹${(receipt.amount_paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n`;
    text += `Beneficiary:     ${receipt.payee.name}\n`;
    text += `Beneficiary VPA: ${receipt.payee.vpa}\n`;
    text += `NPCI UPI Ref:    ${receipt.payment_details.transaction_ref}\n`;
    text += `Audit Trace ID:  ${receipt.payment_details.trace_id}\n`;
    text += `Settlement Rail: ${receipt.payment_details.settlement_rail}\n\n`;

    if (isRent && receipt.hra_compliance) {
      text += `------------------------------------------------------------------------\n`;
      text += `HOUSE RENT ALLOWANCE (HRA) TAX EXEMPTION PARTICULARS (SEC 10(13A))\n`;
      text += `------------------------------------------------------------------------\n`;
      text += `Landlord Name:   ${receipt.hra_compliance.landlord_name}\n`;
      text += `Landlord PAN:    ${receipt.hra_compliance.landlord_pan}\n`;
      text += `Rental Period:   ${receipt.hra_compliance.rent_period}\n`;
      text += `Declaration:     ${receipt.hra_compliance.declaration}\n\n`;
    }

    if (receipt.smart_meter) {
      text += `------------------------------------------------------------------------\n`;
      text += `AUTOMATED IOT SUB-METER METRICS\n`;
      text += `------------------------------------------------------------------------\n`;
      text += `Meter Device ID: ${receipt.smart_meter.device_id}\n`;
      text += `Units Consumed:  ${receipt.smart_meter.cycle_consumption} ${receipt.smart_meter.unit_label}\n`;
      text += `Tariff Rate:     ₹${(receipt.smart_meter.rate_per_unit_paise / 100).toFixed(2)} / ${receipt.smart_meter.unit_label}\n`;
      text += `Cumulative Rdg:  ${receipt.smart_meter.current_reading} ${receipt.smart_meter.unit_label}\n\n`;
    }

    text += `========================================================================\n`;
    text += `SECURITY VERIFICATION:\n`;
    text += `Standard:        ${receipt.bis_compliance}\n`;
    text += `Digital Seal:    ${receipt.digital_seal_hash}\n`;
    text += `========================================================================\n`;

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Receipt_${receipt.receipt_number}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCopySummary = () => {
    if (!receipt) return;
    const summary = `Mosaic Receipt ${receipt.receipt_number} | ${receipt.title} | ${formatPaiseToRupees(receipt.amount_paise)} paid to ${receipt.payee.name} via ${receipt.payment_details.transaction_ref}`;
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isRent = receipt?.bill_type === 'RENT';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      {/* Container */}
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Actions Bar (Top) */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-950/50 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Official Tax Receipt</div>
              <div className="text-[10px] text-slate-400">Certified Digital Proof &bull; NPCI Verified</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowEmailInput(!showEmailInput)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white text-xs font-semibold border border-indigo-500/30 transition-all shadow-sm"
              title="Send official receipt via Resend Email"
            >
              <Mail className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Email Receipt</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all shadow-sm"
              title="Print or Save as PDF"
            >
              <Printer className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Print / PDF</span>
            </button>

            <button
              onClick={handleDownloadText}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-all shadow-sm"
              title="Download text certificate"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
            </button>

            <button
              onClick={handleCopySummary}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors"
              title="Copy Receipt Summary"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Resend Email Dispatch Tray */}
        {showEmailInput && (
          <div className="p-3 bg-slate-950 border-b border-slate-800/80 px-4 md:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-in slide-in-from-top-2 duration-200 no-print">
            <div className="flex items-center gap-2 text-indigo-300">
              <Mail className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="font-semibold">Resend Email Delivery:</span>
            </div>

            <form onSubmit={handleSendEmail} className="flex items-center gap-2 flex-1 max-w-md">
              <input
                type="email"
                value={emailTarget}
                onChange={(e) => setEmailTarget(e.target.value)}
                placeholder="Recipient Email (e.g. rohan.verma@gmail.com)"
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-medium text-xs focus:outline-none focus:border-indigo-500"
                required
              />
              <button
                type="submit"
                disabled={sendingEmail}
                className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all flex items-center gap-1.5 disabled:opacity-50 shrink-0"
              >
                {sendingEmail ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </>
                )}
              </button>
            </form>

            {emailSuccess && (
              <div className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>{emailSuccess}</span>
              </div>
            )}
          </div>
        )}

        {/* Scrollable Receipt Body */}
        <div className="p-6 md:p-8 overflow-y-auto space-y-6 print-container" ref={receiptRef}>
          {loading || !receipt ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
              <div className="text-xs text-slate-400 font-medium">Retrieving official ledger receipt...</div>
            </div>
          ) : (
            <>
              {/* Receipt Header / Society Letterhead */}
              <div className="border-b border-slate-800 pb-5 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-xs">
                        M
                      </div>
                      <h2 className="text-base font-extrabold text-white tracking-tight">
                        {receipt.society.name}
                      </h2>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-md">
                      {receipt.society.address}
                    </p>
                    <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                      Registration: <span className="text-slate-400">{receipt.society.registration_no}</span> &bull; GSTIN: <span className="text-slate-400">{receipt.society.gstin}</span>
                    </div>
                  </div>

                  {/* Stamp Badge */}
                  <div className="sm:text-right shrink-0">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      PAYMENT CLEARED
                    </span>
                    <div className="text-[11px] font-mono text-indigo-300 font-bold mt-1">
                      {receipt.receipt_number}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {new Date(receipt.paid_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </div>

              {/* HRA Compliant Banner (if rent) */}
              {isRent && receipt.hra_compliance && (
                <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        Income Tax HRA Exemption Certificate
                      </span>
                    </div>
                    <span className="text-[10px] font-mono bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded font-bold">
                      Section 10(13A) Eligible
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Landlord (Property Owner)</span>
                      <span className="font-semibold text-white">{receipt.hra_compliance.landlord_name}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Landlord PAN Number</span>
                      <span className="font-mono font-bold text-emerald-400">{receipt.hra_compliance.landlord_pan}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Rental Tenure</span>
                      <span className="font-medium text-slate-200">{receipt.hra_compliance.rent_period}</span>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400/90 pt-1 border-t border-indigo-500/20 italic">
                    &ldquo;{receipt.hra_compliance.declaration}&rdquo;
                  </p>
                </div>
              )}

              {/* Resident & Payee Particulars */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Resident Block */}
                <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800 space-y-1.5">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    Billed To (Tenant / Resident)
                  </span>
                  <div className="font-bold text-white text-sm">{receipt.payer_name}</div>
                  <div className="text-slate-300">{receipt.payer_flat}</div>
                  <div className="text-slate-400 font-mono text-[11px]">{receipt.payer_phone}</div>
                </div>

                {/* Beneficiary Block */}
                <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800 space-y-1.5">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    Settled To (Beneficiary)
                  </span>
                  <div className="font-bold text-white text-sm">{receipt.payee.name}</div>
                  <div className="text-slate-300 font-mono">{receipt.payee.vpa}</div>
                  <div className="text-emerald-400 text-[11px] font-medium">&bull; Direct Bank Account VPA</div>
                </div>
              </div>

              {/* Itemized Line Items Table */}
              <div className="border border-slate-800 rounded-2xl overflow-hidden text-xs">
                <div className="bg-slate-950/80 px-4 py-2.5 flex items-center justify-between font-semibold text-slate-400 border-b border-slate-800">
                  <span>Particulars / Service Description</span>
                  <span>Amount (INR)</span>
                </div>

                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-white text-sm">{receipt.title}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Category: {receipt.bill_type} &bull; Due Date: {receipt.due_date}
                      </div>

                      {/* Smart Meter telemetry tag */}
                      {receipt.smart_meter && (
                        <div className="mt-2 p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] space-y-1">
                          <div className="font-semibold text-indigo-300 flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-amber-400" />
                            <span>IoT Sub-Meter Telemetry Verified</span>
                          </div>
                          <div className="text-slate-400 flex items-center gap-4">
                            <span>Device: <span className="font-mono text-slate-300">{receipt.smart_meter.device_id}</span></span>
                            <span>Consumed: <span className="font-bold text-white">{receipt.smart_meter.cycle_consumption} {receipt.smart_meter.unit_label}</span></span>
                            <span>Tariff: <span className="text-slate-300">₹{(receipt.smart_meter.rate_per_unit_paise/100).toFixed(2)}/{receipt.smart_meter.unit_label}</span></span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="text-right">
                      <div className="font-black text-base text-white">
                        {formatPaiseToRupees(receipt.amount_paise)}
                      </div>
                      <div className="text-[10px] text-emerald-400 font-medium">Direct Settlement</div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-slate-400">
                    <span>Convenience Fee / Platform Surcharge</span>
                    <span className="font-mono text-emerald-400 font-semibold">₹0.00 (Zero Surcharge)</span>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                    <span className="font-bold text-white text-sm">Total Paid</span>
                    <span className="font-black text-xl text-white">
                      {formatPaiseToRupees(receipt.amount_paise)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Transaction & Audit Metadata Card */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-[11px] space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span>NPCI UPI Transaction Reference:</span>
                  <span className="font-mono text-indigo-300 font-bold">{receipt.payment_details.transaction_ref}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Audit Trail Trace ID:</span>
                  <span className="font-mono text-slate-300">{receipt.payment_details.trace_id}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Settlement Mechanism:</span>
                  <span className="text-slate-200">{receipt.payment_details.payment_mode}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Cryptographic Proof / Digital Seal:</span>
                  <span className="font-mono text-emerald-400">{receipt.digital_seal_hash}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-slate-500 text-[10px]">
                  <span>Regulatory Standard: {receipt.bis_compliance}</span>
                  <span className="text-emerald-400 font-medium">&bull; Immutable Ledger Record</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/50 flex items-center justify-between no-print">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Certified by Mosaic Financial Operations</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors"
          >
            Close Receipt
          </button>
        </div>
      </div>
    </div>
  );
}
