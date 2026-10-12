import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ConsumerNav from './components/ConsumerNav';
import UnderTheHoodDrawer from './components/UnderTheHoodDrawer';
import PaymentModal from './components/PaymentModal';
import JoinInviteModal from './components/JoinInviteModal';
import ResidentHomeView from './pages/ResidentHomeView';
import SmartMetersView from './pages/SmartMetersView';
import ExpenseRadarView from './pages/ExpenseRadarView';
import LandlordPortfolioView from './pages/LandlordPortfolioView';
import AdminCommunityView from './pages/AdminCommunityView';
import RemindersView from './pages/RemindersView';

export default function App() {
  const [userRole, setUserRole] = useState('resident'); // 'resident', 'landlord', 'admin'
  const [activeFlatNo, setActiveFlatNo] = useState('4B');
  const [currentTab, setCurrentTab] = useState('home'); // 'home', 'utilities', 'expenses', 'community', 'reminders'
  const [homeData, setHomeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Inspector Drawer, Payment Modal, & Join Invite Modal State
  const [isSecurityDrawerOpen, setIsSecurityDrawerOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedBillForPayment, setSelectedBillForPayment] = useState(null);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [initialInviteCode, setInitialInviteCode] = useState('');

  const fetchHomeData = async (targetFlat = activeFlatNo) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/consumer/home?role=${userRole}&flat_no=${targetFlat}`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      setHomeData(data);
    } catch (err) {
      console.error('Failed to fetch consumer feed:', err);
      setError('Could not connect to Mosaic backend. Please ensure the API server is running on port 8000.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomeData(activeFlatNo);
  }, [userRole, activeFlatNo]);

  const handleSyncMeter = async (meterType, loadProfile = 'NORMAL') => {
    try {
      const res = await fetch('/api/consumer/smart-meter/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flat_no: activeFlatNo,
          meter_type: meterType,
          load_profile: loadProfile,
        }),
      });
      if (res.ok) {
        await fetchHomeData(activeFlatNo);
      }
    } catch (err) {
      console.error('Meter sync failed:', err);
    }
  };

  const handlePayBill = (bill) => {
    setSelectedBillForPayment(bill);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSuccess = async () => {
    await fetchHomeData(activeFlatNo);
  };

  const handleOpenRedeemModal = (code) => {
    setInitialInviteCode(code || '');
    setIsJoinModalOpen(true);
  };

  const handleJoinSuccess = async (data) => {
    if (data?.flat_no) {
      setActiveFlatNo(data.flat_no);
    }
    setUserRole('resident');
    setCurrentTab('home');
    await fetchHomeData(data?.flat_no || activeFlatNo);
  };

  const renderContent = () => {
    if (loading && !homeData) {
      return (
        <div className="flex flex-col items-center justify-center h-80 text-slate-400 space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <div className="text-xs font-semibold text-slate-300">Loading your Mosaic home feed...</div>
        </div>
      );
    }

    if (error && !homeData) {
      return (
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 max-w-lg mx-auto my-12 space-y-3">
          <div className="font-bold text-sm">Connection Notice</div>
          <p className="text-xs text-rose-200/80">{error}</p>
          <button
            onClick={() => fetchHomeData(activeFlatNo)}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold"
          >
            Retry Connection
          </button>
        </div>
      );
    }

    // Role-dependent tab switching
    switch (currentTab) {
      case 'home':
        if (userRole === 'landlord') {
          return <LandlordPortfolioView onOpenRedeemModal={handleOpenRedeemModal} />;
        }
        if (userRole === 'admin') {
          return <AdminCommunityView />;
        }
        return (
          <ResidentHomeView
            homeData={homeData}
            onSyncMeter={handleSyncMeter}
            onPayBill={handlePayBill}
          />
        );

      case 'utilities':
        return (
          <SmartMetersView
            meters={homeData?.smart_meters}
            onSyncMeter={handleSyncMeter}
            flatNo={activeFlatNo}
          />
        );

      case 'expenses':
        return (
          <ExpenseRadarView
            homeData={homeData}
            onPayBill={handlePayBill}
          />
        );

      case 'community':
        if (userRole === 'landlord') {
          return <LandlordPortfolioView onOpenRedeemModal={handleOpenRedeemModal} />;
        }
        return <AdminCommunityView />;

      case 'reminders':
        return (
          <RemindersView
            homeData={homeData}
            onPayBill={handlePayBill}
          />
        );

      default:
        return (
          <ResidentHomeView
            homeData={homeData}
            onSyncMeter={handleSyncMeter}
            onPayBill={handlePayBill}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Header */}
      <Header
        userRole={userRole}
        setUserRole={setUserRole}
        activeFlatNo={activeFlatNo}
        activeResidentName={homeData?.user_name}
        onOpenJoinModal={() => handleOpenRedeemModal('')}
        unreadCount={homeData?.unread_notifications_count || 0}
        onOpenSecurityDrawer={() => setIsSecurityDrawerOpen(true)}
        onOpenNotifications={() => setCurrentTab('reminders')}
      />

      {/* Navigation Sub-Bar */}
      <ConsumerNav
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        userRole={userRole}
      />

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        {renderContent()}
      </main>

      {/* Under-The-Hood Technical Drawer (Hackathon Judges / Auditor Inspection) */}
      <UnderTheHoodDrawer
        isOpen={isSecurityDrawerOpen}
        onClose={() => setIsSecurityDrawerOpen(false)}
      />

      {/* Instant Consumer Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        bill={selectedBillForPayment}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* Digital Tenant Invite Redemption Modal */}
      <JoinInviteModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        initialCode={initialInviteCode}
        onJoinSuccess={handleJoinSuccess}
      />
    </div>
  );
}
