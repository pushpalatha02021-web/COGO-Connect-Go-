import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, RideJourney, RiderRequest, RouteMatchResult, NotificationItem } from './types';
import { MOCK_USERS, MOCK_RIDES, INITIAL_MATCHES } from './data';
import MapRouter from './components/MapRouter';
import VerificationPanel from './components/VerificationPanel';
import RideMatcher from './components/RideMatcher';
import PhoneLogin from './components/PhoneLogin';
import {
  ShieldAlert, ShieldCheck, HeartPulse, Sparkles, Navigation, Award, BarChart3,
  Calendar, Lock, Users, Activity, HelpCircle, Footprints, Leaf, Eye, LogOut,
  Bell, BellRing, MessageSquare, X
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('cogo_logged_in_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  // State linking selections across the SVG Map and RideMatcher Panel
  const [selectedRide, setSelectedRide] = useState<RideJourney | null>(MOCK_RIDES[0]);
  
  // Find initial match corresponding to ride 0 and request 0
  const initialMatch = INITIAL_MATCHES.find(m => m.rideId === MOCK_RIDES[0].id) || null;
  const [selectedRequest, setSelectedRequest] = useState<RiderRequest | null>({
    id: 'req_1',
    riderId: 'user_rider_1',
    riderName: 'Avinash',
    riderAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
    riderInstitution: 'IIIT Hyderabad',
    origin: { lat: 17.4400, lng: 78.3480, name: 'Gachibowli Circle (Transit)' },
    destination: { lat: 17.4300, lng: 78.4090, name: 'Jubilee Hills Precinct' },
    routePath: 'palo_alto_to_sf_mission',
    departureDate: '2026-05-26',
    departureTime: '08:20 AM',
    requestedSeats: 1,
    status: 'pending'
  });
  const [activeMatch, setActiveMatch] = useState<RouteMatchResult | null>(initialMatch);

  // Bell Notification system state
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif-initial-1',
      type: 'match_accepted',
      title: 'Institutional Circle Verified',
      desc: 'Your profile has been secured and aligned with Hyderabad educational and tech clusters.',
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
      isRead: true
    },
    {
      id: 'notif-initial-2',
      type: 'new_message',
      title: 'MFA Handshake Secure',
      desc: 'MFA SMS bypass channel active on secure port 3000.',
      timestamp: new Date(Date.now() - 3605000 * 6).toISOString(), // ~6 hours ago
      isRead: true
    }
  ]);

  interface ToastItem {
    id: string;
    type: 'match_accepted' | 'new_message';
    title: string;
    desc: string;
  }
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const triggerNotification = (type: 'match_accepted' | 'new_message', title: string, desc: string, linkId?: string) => {
    const id = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const newNotif: NotificationItem = {
      id,
      type,
      title,
      desc,
      timestamp: new Date().toISOString(),
      isRead: false,
      linkId
    };

    setNotifications(prev => [newNotif, ...prev]);

    // Toast alert
    const toastId = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    setToasts(prev => [...prev, { id: toastId, type, title, desc }]);

    // Auto delete toast after 4.5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== toastId));
    }, 4500);
  };

  // Background active commute events simulation (interactive simulator)
  useEffect(() => {
    if (!currentUser) return;

    const simulatedEvents = [
      {
        delay: 15000,
        type: 'new_message' as const,
        title: 'Message from Vignesh 💬',
        desc: '"I\'m waiting near the IIIT-H main gate for the overpass route matching."',
      },
      {
        delay: 35000,
        type: 'match_accepted' as const,
        title: 'New Ride Share Offered 🚗',
        desc: 'Meera (Google-H) posted a high-overlap route Begumpet ➔ Gachibowli.',
      },
      {
        delay: 55000,
        type: 'new_message' as const,
        title: 'Message from Swetha (IIT-H) 💬',
        desc: '"Can we stop for 2 mins at Kondapur Junction?"',
      },
      {
        delay: 75000,
        type: 'match_accepted' as const,
        title: 'Match Approved 🎉',
        desc: 'Swetha was approved to join Meera\'s Google Hyderabad route.',
      }
    ];

    const timers = simulatedEvents.map(event => {
      return setTimeout(() => {
        triggerNotification(event.type, event.title, event.desc);
      }, event.delay);
    });

    return () => {
      timers.forEach(t => clearTimeout(t));
    };
  }, [currentUser?.id]);

  const getRelativeTime = (isoString: string) => {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / 1000 / 60);
    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 min ago';
    if (diffMins < 60) return `${diffMins} mins ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return '1 hr ago';
    return `${diffHours} hrs ago`;
  };

  const [activeTab, setActiveTab] = useState<'commutes' | 'security' | 'impact'>('commutes');

  // Overall community metrics computed dynamically
  const computedMetrics = {
    cumulativeCo2lbs: 340,
    fuelSavingsRupees: 9600,
    seatsOptimized: 28,
    peerCircleDensity: 64 // Active verified users
  };

  const handleUpdateUser = (updated: UserProfile) => {
    setCurrentUser(updated);
  };

  const handleSelectNodeFromMap = (node: any) => {
    // Optionally trigger feedback or highlights when map pins are clicked
  };

  if (!currentUser) {
    return <PhoneLogin onLoginSuccess={setCurrentUser} />;
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-zinc-100 font-sans pb-12 select-none selection:bg-cyan-500/30">
      {/* Top Professional Security Banner */}
      <div className="bg-gradient-to-r from-zinc-950 via-[#0F0F11] to-zinc-950 border-b border-zinc-800 py-2.5 px-4 text-center text-xs text-zinc-400">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Institutional verification sandbox active. Test MFA in security locks.</span>
          <span className="hidden md:inline-block font-mono text-[10px] bg-zinc-800 px-2 py-0.5 rounded ml-2 text-cyan-400">
            NETWORK INGRESS: SECURE PORT 3000
          </span>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 mt-6 space-y-6">
        {/* Dynamic App Header */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between bg-[#0F0F11] border border-zinc-800 rounded-2xl p-6 backdrop-blur shadow-xl gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-cyan-500/10 border border-cyan-500/20 p-3 rounded-2xl text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
              <Navigation className="w-7 h-7 transform rotate-45" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight text-white font-sans flex items-center gap-1.5">
                  COGO <span className="text-cyan-400 font-light">P2P</span>
                </h1>
                <span className="text-[10px] font-mono tracking-widest font-bold bg-cyan-950/40 text-cyan-400 border border-cyan-900/40 px-2.5 py-0.5 rounded-full">
                  SECURE CIRCLE
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5 font-medium">
                Smarter peer route sharing & fuel split optimizations for Hyderabad Tech & Academic Circles
              </p>
            </div>
          </div>

          {/* User Profile Security Tag & Bell Notification System */}
          <div className="flex items-center gap-4 self-start md:self-auto z-30">
            {/* Bell Notification Dropdown */}
            <div className="relative" id="bell-notification-container">
              {(() => {
                const unreadCount = notifications.filter(n => !n.isRead).length;
                return (
                  <>
                    <button
                      onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                      className={`relative p-2.5 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-center ${
                        isNotificationsOpen 
                          ? 'bg-cyan-950/35 border-cyan-500/50 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]' 
                          : 'bg-[#0A0A0B] border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white'
                      }`}
                      title={`${unreadCount} unread notifications`}
                    >
                      {unreadCount > 0 ? (
                        <BellRing className="w-5 h-5 text-cyan-400 animate-pulse" />
                      ) : (
                        <Bell className="w-5 h-5" />
                      )}
                      {unreadCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 bg-cyan-500 text-black text-[9px] font-black font-mono h-5 w-5 rounded-full flex items-center justify-center border border-[#0F0F11] shadow-[0_3px_10px_rgba(6,182,212,0.4)] animate-bounce">
                          {unreadCount}
                        </span>
                      )}
                    </button>

                    {/* Notification Dropdown Menu */}
                    <AnimatePresence>
                      {isNotificationsOpen && (
                        <>
                          {/* Screen click blocker to close dropdown */}
                          <div 
                            className="fixed inset-0 z-40 bg-transparent cursor-default" 
                            onClick={() => setIsNotificationsOpen(false)} 
                          />
                          <motion.div
                            initial={{ opacity: 0, y: 15, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.15, ease: 'easeOut' }}
                            className="absolute right-0 mt-3 w-80 sm:w-96 bg-[#0F0F11] border border-zinc-805 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-xl overflow-hidden z-50 text-left"
                          >
                            {/* Dropdown Header */}
                            <div className="p-4 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-950/40">
                              <span className="text-xs uppercase font-extrabold tracking-wider text-zinc-250 flex items-center gap-2 font-sans">
                                🔔 Commute Operations Alert Log
                                {unreadCount > 0 && (
                                  <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[9px] font-bold font-mono px-2 py-0.5 rounded-full">
                                    {unreadCount} NEW
                                  </span>
                                )}
                              </span>
                              
                              {unreadCount > 0 && (
                                <button
                                  onClick={() => {
                                    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
                                  }}
                                  className="text-[10px] text-cyan-400 font-extrabold hover:text-cyan-300 transition uppercase tracking-wider cursor-pointer"
                                >
                                  Mark all read
                                </button>
                              )}
                            </div>

                            {/* Notifications Scrollable Zone */}
                            <div className="max-h-80 overflow-y-auto divide-y divide-zinc-900/60">
                              {notifications.length === 0 ? (
                                <div className="p-8 text-center flex flex-col items-center justify-center">
                                  <Bell className="w-8 h-8 text-zinc-600 shrink-0 mb-2" />
                                  <span className="text-zinc-500 font-medium text-xs">Your inbox is clear</span>
                                  <p className="text-[10px] text-zinc-600 mt-1 max-w-[200px]">Simulated peer ride events will arrive periodically in real-time.</p>
                                </div>
                              ) : (
                                notifications.map(notif => (
                                  <div
                                    key={notif.id}
                                    onClick={() => {
                                      // Mark single message as read
                                      setNotifications(notifications.map(n => n.id === notif.id ? { ...notif, isRead: true } : n));
                                      // Close dropdown
                                      setIsNotificationsOpen(false);
                                      // Trigger view routing to commutes tab if linked
                                      if (notif.linkId) {
                                        setActiveTab('commutes');
                                      }
                                    }}
                                    className={`p-3.5 transition hover:bg-zinc-805/40 cursor-pointer flex items-start gap-3 relative ${
                                      !notif.isRead ? 'bg-cyan-950/5' : ''
                                    }`}
                                  >
                                    {/* Left Status Icon indicator */}
                                    <div className={`p-2 rounded-xl shrink-0 ${
                                      notif.type === 'match_accepted' 
                                        ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/10' 
                                        : 'bg-cyan-950/40 text-cyan-400 border border-cyan-500/10'
                                    }`}>
                                      {notif.type === 'match_accepted' ? (
                                        <ShieldCheck className="w-4 h-4" />
                                      ) : (
                                        <MessageSquare className="w-4 h-4" />
                                      )}
                                    </div>

                                    {/* Right Content */}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between gap-1.5">
                                        <span className="font-bold text-xs text-white leading-tight truncate">
                                          {notif.title}
                                        </span>
                                        <span className="text-[9px] text-zinc-500 font-mono shrink-0">
                                          {getRelativeTime(notif.timestamp)}
                                        </span>
                                      </div>
                                      <p className="text-[10.5px] text-zinc-350 mt-1 font-sans leading-relaxed break-words">
                                        {notif.desc}
                                      </p>
                                    </div>

                                    {/* Unread Indicator */}
                                    {!notif.isRead && (
                                      <span className="absolute top-[18px] right-3.5 w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
                                    )}
                                  </div>
                                ))
                              )}
                            </div>

                            {/* Dropdown Footer Action */}
                            <div className="p-3 bg-[#0c0c0d] border-t border-zinc-900 text-center flex justify-between gap-2 text-[10px] font-sans">
                              <button
                                onClick={() => {
                                  setNotifications([]);
                                  setIsNotificationsOpen(false);
                                }}
                                className="w-full text-zinc-500 hover:text-rose-400 transition font-bold uppercase tracking-wider cursor-pointer"
                              >
                                Clear alert logs
                              </button>
                            </div>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </>
                );
              })()}
            </div>

            {/* Profile Security Box */}
            <div className="flex items-center gap-3 bg-[#0A0A0B] border border-zinc-800 p-3 rounded-xl">
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                className="w-10 h-10 rounded-full object-cover border border-zinc-850"
              />
              <div className="flex-1">
                <div className="flex items-center gap-1">
                  <h4 className="font-bold text-xs text-white">{currentUser.name}</h4>
                  {currentUser.isVerified ? (
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <ShieldAlert className="w-4 h-4 text-yellow-500" />
                  )}
                </div>
                <span className="text-[10px] block text-zinc-400 mt-0.5">
                  {currentUser.isVerified 
                    ? `Verified • ${currentUser.institution}` 
                    : 'Unverified Commuter'}
                </span>
              </div>
              
              <button
                onClick={() => {
                  localStorage.removeItem('cogo_logged_in_user');
                  setCurrentUser(null);
                }}
                title="Logout session"
                className="p-1.5 hover:bg-zinc-805/80 text-zinc-450 hover:text-rose-400 rounded-lg transition-all duration-200 cursor-pointer"
              >
                <LogOut className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard Navigation Tabs */}
        <nav className="flex border-b border-zinc-800 gap-6 text-sm">
          <button
            onClick={() => setActiveTab('commutes')}
            className={`pb-3 font-semibold relative cursor-pointer pt-1 transition ${
              activeTab === 'commutes' ? 'text-cyan-400 font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Matches & Cost Splits
            {activeTab === 'commutes' && (
              <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`pb-3 font-semibold relative cursor-pointer pt-1 transition ${
              activeTab === 'security' ? 'text-cyan-400 font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            MFA & ID Verification
            {activeTab === 'security' && (
              <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('impact')}
            className={`pb-3 font-semibold relative cursor-pointer pt-1 transition ${
              activeTab === 'impact' ? 'text-cyan-400 font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Impact Metrics & Ledger
            {activeTab === 'impact' && (
              <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400" />
            )}
          </button>
        </nav>

        {/* Dynamic Panels */}
        <div className="min-h-[500px]">
          <AnimatePresence mode="wait">
            {activeTab === 'commutes' && (
              <motion.div
                key="commutes-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch"
              >
                {/* SVG Visual Map Column (Left) */}
                <div className="lg:col-span-5 h-[580px] lg:h-auto">
                  <MapRouter
                    selectedRide={selectedRide}
                    selectedRequest={selectedRequest}
                    activeMatch={activeMatch}
                    onSelectNode={handleSelectNodeFromMap}
                  />
                </div>

                {/* Ride Match Controller Column (Right) */}
                <div className="lg:col-span-7">
                  <RideMatcher
                    currentUser={currentUser}
                    selectedRide={selectedRide}
                    selectedRequest={selectedRequest}
                    activeMatch={activeMatch}
                    onSelectRide={setSelectedRide}
                    onSelectRequest={setSelectedRequest}
                    onSelectMatch={setActiveMatch}
                    onAddNotification={triggerNotification}
                  />
                </div>
              </motion.div>
            )}

            {activeTab === 'security' && (
              <motion.div
                key="security-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <VerificationPanel
                  currentUser={currentUser}
                  onUpdateUser={handleUpdateUser}
                />
              </motion.div>
            )}

            {activeTab === 'impact' && (
              <motion.div
                key="impact-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Visual Bento Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-[#161618] border border-zinc-800 rounded-2xl p-6 relative overflow-hidden shadow-xl">
                    <div className="p-3 bg-emerald-950/30 text-emerald-400 border border-emerald-500/10 rounded-xl self-start inline-block mb-4">
                      <Leaf className="w-5.5 h-5.5" />
                    </div>
                    <p className="text-xs text-zinc-500 font-medium uppercase font-mono tracking-wider">Carbon Mitigated (Aggregate)</p>
                    <h2 className="text-3xl font-extrabold text-white mt-1.5 font-mono">{computedMetrics.cumulativeCo2lbs} lbs</h2>
                    <p className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
                      ▲ 18.2% vs previous period standard driving profile
                    </p>
                  </div>

                  <div className="bg-[#161618] border border-zinc-800 rounded-2xl p-6 relative overflow-hidden shadow-xl">
                    <div className="p-3 bg-amber-950/30 text-amber-400 border border-amber-500/10 rounded-xl self-start inline-block mb-4">
                      <Activity className="w-5.5 h-5.5" />
                    </div>
                    <p className="text-xs text-zinc-500 font-medium uppercase font-mono tracking-wider">Estimated Pool Expense Shared</p>
                    <h2 className="text-3xl font-extrabold text-white mt-1.5 font-mono">₹{computedMetrics.fuelSavingsRupees}</h2>
                    <p className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
                      Avg. commuter split saves ₹180 daily on Gachibowli Ring Road
                    </p>
                  </div>

                  <div className="bg-[#161618] border border-zinc-800 rounded-2xl p-6 relative overflow-hidden shadow-xl">
                    <div className="p-3 bg-cyan-950/30 text-cyan-400 border border-cyan-500/10 rounded-xl self-start inline-block mb-4">
                      <Users className="w-5.5 h-5.5" />
                    </div>
                    <p className="text-xs text-zinc-500 font-medium uppercase font-mono tracking-wider">Unused Seats Optimized</p>
                    <h2 className="text-3xl font-extrabold text-white mt-1.5 font-mono">{computedMetrics.seatsOptimized} Seats</h2>
                    <p className="text-[10px] text-zinc-400 mt-1">
                      Occupancy factor rose from 1.1 to 3.4
                    </p>
                  </div>

                  <div className="bg-[#161618] border border-zinc-800 rounded-2xl p-6 relative overflow-hidden shadow-xl">
                    <div className="p-3 bg-rose-950/30 text-rose-400 border border-rose-500/10 rounded-xl self-start inline-block mb-4">
                      <Award className="w-5.5 h-5.5" />
                    </div>
                    <p className="text-xs text-zinc-500 font-medium uppercase font-mono tracking-wider">Circle Commuters Registered</p>
                    <h2 className="text-3xl font-extrabold text-white mt-1.5 font-mono">{computedMetrics.peerCircleDensity} Peers</h2>
                    <p className="text-[10px] text-emerald-400 mt-1 font-semibold uppercase tracking-wider">
                      IIIT Hyd • IIT Hyd • Google Hyd
                    </p>
                  </div>
                </div>

                {/* Regional route analysis overview */}
                <div className="bg-[#161618] border border-zinc-800 rounded-2xl p-6 shadow-xl grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <BarChart3 className="text-emerald-400 w-5.5 h-5.5" />
                      Hyderabad Route Congestion Reductions
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                      By prioritizing route overlapping (detecting path intersections on Gachibowli Ring Road) instead of matching only start/endpoints, COGO optimizes vehicle density.
                    </p>
                    
                    <div className="mt-5 space-y-3 font-mono text-xs">
                      <div>
                        <div className="flex justify-between text-zinc-300 mb-1">
                          <span>Nehru Outer Ring Road (ORR) Corridor</span>
                          <span className="text-emerald-400 font-bold">-24.1% congestion</span>
                        </div>
                        <div className="w-full bg-[#0A0A0B] h-2 rounded-full overflow-hidden border border-zinc-800/40">
                          <div className="bg-emerald-500 h-2 w-[76%]" />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-zinc-300 mb-1">
                          <span>Miyapur-Kondapur Main Road</span>
                          <span className="text-emerald-400 font-bold">-18.4% congestion</span>
                        </div>
                        <div className="w-full bg-[#0A0A0B] h-2 rounded-full overflow-hidden border border-zinc-800/40">
                          <div className="bg-emerald-500 h-2 w-[81%]" />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-zinc-300 mb-1">
                          <span>Hitec City Corridor Link</span>
                          <span className="text-emerald-400 font-bold">-11.5% congestion</span>
                        </div>
                        <div className="w-full bg-[#0A0A0B] h-2 rounded-full overflow-hidden border border-zinc-800/40">
                          <div className="bg-emerald-500 h-2 w-[88%]" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#0A0A0B]/60 border border-zinc-800 p-6 rounded-xl flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-zinc-200">How Overlap Calculations Work</h4>
                      <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                        Rather than only looking for common destinations, COGO samples scheduled commuter paths. If Driver A is going IIIT Hyderabad ➔ Secunderabad Station and Passenger B is traveling Hitec City ➔ Begumpet Airport Zone, COGO detects an 85% overlap segment.
                      </p>
                      <p className="text-xs text-zinc-400 mt-2 leading-relaxed font-semibold">
                        Driver splits: Full fuel is split prorated by the distance Passenger B actually rides! Minimum pickup detours ensures 0-loss to transit times.
                      </p>
                    </div>

                    <div className="mt-4 pt-4 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                      <span>Secure cryptographic ledgers prevent spoofing.</span>
                      <span className="text-emerald-400 font-semibold uppercase">Powered by COGO Math Engine</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Floating Alert Toasts Container */}
      <div className="fixed bottom-5 right-5 z-[99999] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 35, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="pointer-events-auto w-full bg-[#161618]/95 border border-zinc-800/80 rounded-2xl p-4 shadow-[0_15px_35px_rgba(0,0,0,0.65)] backdrop-blur-md flex items-start gap-3 border-l-4 border-l-cyan-400 overflow-hidden"
            >
              <div className={`p-2 rounded-xl shrink-0 ${
                toast.type === 'match_accepted' 
                  ? 'bg-emerald-950/45 text-emerald-400 border border-emerald-500/10' 
                  : 'bg-cyan-950/45 text-cyan-400 border border-cyan-500/15'
              }`}>
                {toast.type === 'match_accepted' ? (
                  <ShieldCheck className="w-4.5 h-4.5" />
                ) : (
                  <MessageSquare className="w-4.5 h-4.5" />
                )}
              </div>
              
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-between gap-2">
                  <h5 className="font-extrabold text-[11px] text-white uppercase tracking-wider font-sans">
                    {toast.title}
                  </h5>
                  <button
                    onClick={() => {
                      setToasts(prev => prev.filter(t => t.id !== toast.id));
                    }}
                    className="text-zinc-500 hover:text-white transition cursor-pointer p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[11px] text-zinc-300 mt-1 font-sans leading-relaxed break-words">
                  {toast.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
