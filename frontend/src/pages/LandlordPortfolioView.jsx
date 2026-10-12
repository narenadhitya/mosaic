import React, { useState, useEffect } from 'react';
import { formatPaiseToRupees } from '../utils/formatters';
import { 
  Building2, 
  Key, 
  UserCheck, 
  Plus, 
  Send, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Copy, 
  Check, 
  ShieldCheck,
  FileText,
  Download
} from 'lucide-react';

export default function LandlordPortfolioView({ onOpenRedeemModal, onViewReceipt }) {
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [newInviteFlat, setNewInviteFlat] = useState('501');
  const [newInviteRent, setNewInviteRent] = useState(28000);
  const [copiedCode, setCopiedCode] = useState(null);
  const [nudgeStatus, setNudgeStatus] = useState(null);

  const fetchPortfolio = () => {
    setLoading(true);
    fetch('/api/consumer/landlord/portfolio')
      .then(r => r.json())
      .then(d => {
        setPortfolio(d);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const handleCreateInvite = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/consumer/landlord/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flat_no: newInviteFlat,
          monthly_rent_rupees: parseFloat(newInviteRent)
        })
      });
      if (res.ok) {
        setShowInviteModal(false);
        fetchPortfolio();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendNudge = async (flatNo) => {
    try {
      const res = await fetch('/api/consumer/landlord/nudge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flat_no: flatNo, bill_id: 'BILL-RENT-4B' })
      });
      if (res.ok) {
        setNudgeStatus(`Payment reminder nudge sent to Flat ${flatNo} tenant!`);
        setTimeout(() => setNudgeStatus(null), 3500);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(`http://localhost:3000/join?code=${code}`);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Landlord Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider">
            <Key className="w-3.5 h-3.5" />
            <span>Landlord Property Management</span>
          </div>
          <h1 className="text-2xl font-black text-white mt-1">
            Properties Owned by {portfolio?.owner_name || 'Vikram Malhotra'}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Rent collection rail: <span className="font-mono text-emerald-400">{portfolio?.owner_vpa}</span> &bull; Sunrise Heights
          </p>
        </div>

        <button
          onClick={() => setShowInviteModal(true)}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Invite Tenant to Vacant Flat</span>
        </button>
      </div>

      {nudgeStatus && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{nudgeStatus}</span>
        </div>
      )}

      {/* Flats Portfolio Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {portfolio?.flats?.map((flat) => (
          <div key={flat.id} className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 shadow-lg">
            {/* Flat Header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-white">Flat {flat.flat_no}</h3>
                  <span className="text-xs text-slate-400 font-normal">({flat.bhk_type}, {flat.wing})</span>
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Monthly Rent: <span className="text-slate-200 font-bold">{formatPaiseToRupees(flat.monthly_rent_paise)}</span>
                </div>
              </div>

              {flat.is_occupied ? (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                  OCCUPIED
                </span>
              ) : (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
                  VACANT
                </span>
              )}
            </div>

            {/* Tenant & Rent Status Details */}
            {flat.is_occupied ? (
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Current Tenant:</span>
                  <span className="font-semibold text-slate-200">{flat.tenant_name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Phone:</span>
                  <span className="font-mono text-slate-300">{flat.tenant_phone}</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                  <span className="text-slate-400">October Rent Status:</span>
                  <span className={`font-bold ${flat.rent_status === 'PAID' ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {flat.rent_status === 'PAID' ? 'Cleared' : 'Pending Clearance'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Utility Liabilities:</span>
                  <span className="text-slate-300">
                    {flat.utility_liabilities_count === 0 ? 'All cleared' : `${flat.utility_liabilities_count} unpaid bills`}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-amber-200/90 space-y-1">
                <div className="font-bold text-amber-300">Flat is currently vacant</div>
                <p className="text-[11px] text-slate-400">
                  Generate a digital invite code to onboard an incoming tenant. Once accepted, their profile and rent cycle will connect automatically.
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-1">
              {flat.is_occupied ? (
                flat.rent_status === 'PAID' ? (
                  <button
                    onClick={() => onViewReceipt && onViewReceipt(`BILL-RENT-${flat.flat_no}`)}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold border border-emerald-500/30 transition-all shadow-sm group"
                    title="Download Official Tenant Rent Receipt"
                  >
                    <FileText className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                    <span>Download Rent Receipt</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleSendNudge(flat.flat_no)}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all"
                  >
                    <Send className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Send Rent Payment Reminder</span>
                  </button>
                )
              ) : (
                <button
                  onClick={() => {
                    setNewInviteFlat(flat.flat_no);
                    setShowInviteModal(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white text-xs font-semibold border border-indigo-500/30 transition-all"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Generate Invite Code</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Active Invites List */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-indigo-400" />
          <span>Active Tenant Onboarding Invites</span>
        </h3>

        <div className="divide-y divide-slate-800 text-xs">
          {portfolio?.active_invites?.map((inv) => (
            <div key={inv.id} className="py-3 flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-200">
                  Flat {inv.flat_no} Onboarding Invite
                </div>
                <div className="text-[11px] font-mono text-indigo-400 mt-0.5">
                  Code: {inv.invite_code}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20">
                  {inv.status}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onOpenRedeemModal && onOpenRedeemModal(inv.invite_code)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-semibold transition-all shadow-sm"
                    title="Test redeeming this code as a tenant"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>Test Onboard</span>
                  </button>

                  <button
                    onClick={() => copyToClipboard(inv.invite_code)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all"
                  >
                    {copiedCode === inv.invite_code ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal: Create Invite */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Generate Tenant Invite</h3>
            <p className="text-xs text-slate-400">
              Create a digital onboarding link for Flat {newInviteFlat}. When the resident enters this code, they are assigned to your flat automatically.
            </p>

            <form onSubmit={handleCreateInvite} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Flat Number</label>
                <input
                  type="text"
                  value={newInviteFlat}
                  onChange={(e) => setNewInviteFlat(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-medium focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Monthly Rent (₹)</label>
                <input
                  type="number"
                  value={newInviteRent}
                  onChange={(e) => setNewInviteRent(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-medium focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30"
                >
                  Create Invite Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
