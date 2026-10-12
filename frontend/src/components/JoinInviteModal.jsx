import React, { useState, useEffect } from 'react';
import { formatPaiseToRupees } from '../utils/formatters';
import { 
  X, 
  Key, 
  Home, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  User, 
  Mail, 
  Phone, 
  ArrowRight,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

export default function JoinInviteModal({ isOpen, onClose, initialCode = '', onJoinSuccess }) {
  const [inviteCode, setInviteCode] = useState(initialCode);
  const [inviteDetails, setInviteDetails] = useState(null);
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState(null);

  // Tenant form state
  const [name, setName] = useState('Ananya Sharma');
  const [email, setEmail] = useState('ananya.sharma@gmail.com');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [joinedSuccess, setJoinedSuccess] = useState(null);

  useEffect(() => {
    if (initialCode) {
      setInviteCode(initialCode);
      lookupCode(initialCode);
    }
  }, [initialCode, isOpen]);

  const lookupCode = async (codeToLookup) => {
    const clean = (codeToLookup || inviteCode).trim().toUpperCase();
    if (!clean) return;
    setLookingUp(true);
    setLookupError(null);
    try {
      const res = await fetch(`/api/consumer/invite/${clean}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Invite code not found');
      }
      setInviteDetails(data);
    } catch (err) {
      setInviteDetails(null);
      setLookupError(err.message);
    } finally {
      setLookingUp(false);
    }
  };

  const handleRedeem = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch('/api/consumer/resident/redeem-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invite_code: inviteCode.trim().toUpperCase(),
          resident_name: name,
          resident_email: email,
          resident_phone: phone,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Could not join flat');
      }

      setJoinedSuccess(data);
      if (onJoinSuccess) {
        onJoinSuccess(data);
      }
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setJoinedSuccess(null);
    setSubmitError(null);
    setLookupError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Join Home with Digital Invite</h3>
              <p className="text-[11px] text-slate-400">Move into your new apartment on Mosaic</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {joinedSuccess ? (
          /* Success Screen */
          <div className="p-6 text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20 animate-in zoom-in-50 duration-200">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider flex items-center justify-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Move-In Verified</span>
              </span>
              <h2 className="text-2xl font-black text-white mt-1">
                Welcome to Flat {joinedSuccess.flat_no}!
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Registered to <span className="text-slate-200 font-semibold">{joinedSuccess.resident_name}</span>. Automated smart meters and monthly rent obligations are now live.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Apartment:</span>
                <span className="text-white font-bold">Flat {joinedSuccess.flat_no}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Monthly Rent:</span>
                <span className="text-emerald-400 font-bold">{formatPaiseToRupees(joinedSuccess.monthly_rent_paise, true)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">IoT Telemetry:</span>
                <span className="text-cyan-400 font-mono">AUTOMATED METERS ACTIVE</span>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all"
            >
              Enter Flat {joinedSuccess.flat_no} Dashboard
            </button>
          </div>
        ) : (
          /* Input Form */
          <form onSubmit={handleRedeem} className="p-6 space-y-4">
            {/* Invite Code Input & Lookup */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Digital Invite Code</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="e.g. MOSAIC-FLAT-501"
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono uppercase focus:outline-none focus:border-indigo-500 transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => lookupCode(inviteCode)}
                  disabled={lookingUp || !inviteCode.trim()}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all disabled:opacity-50 shrink-0"
                >
                  {lookingUp ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify Code'}
                </button>
              </div>

              {lookupError && (
                <p className="text-[11px] text-rose-400 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{lookupError}</span>
                </p>
              )}
            </div>

            {/* Invite Flat Details Preview Card */}
            {inviteDetails && (
              <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Home className="w-4 h-4 text-indigo-400" />
                    <span className="font-bold text-white">Flat {inviteDetails.flat_no}</span>
                    <span className="text-[10px] text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-full border border-indigo-500/30 font-mono">
                      {inviteDetails.wing || 'Pine Wing'} &bull; {inviteDetails.bhk_type || '3 BHK'}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    PENDING INVITE
                  </span>
                </div>

                <div className="flex justify-between items-baseline pt-1">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Property Owner</span>
                    <span className="font-semibold text-slate-200">{inviteDetails.owner_name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Agreed Monthly Rent</span>
                    <span className="font-extrabold text-white text-sm">
                      {formatPaiseToRupees(inviteDetails.monthly_rent_paise, true)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Resident Details Fields */}
            <div className="space-y-3 pt-1">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Full Legal Name</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tenant Name"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>Email Address</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>Phone Number</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>
            </div>

            {submitError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                {submitError}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || (!inviteDetails && !inviteCode.trim())}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-extrabold text-xs shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Verifying Lease & Onboarding...</span>
                </>
              ) : (
                <>
                  <span>Accept Invite & Move In</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Digital Lease & Automated Smart Meters Setup</span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
