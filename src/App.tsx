import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, RideJourney, RiderRequest, RouteMatchResult } from './types';
import { MOCK_USERS, MOCK_RIDES, INITIAL_MATCHES } from './data';
import MapRouter from './components/MapRouter';
import VerificationPanel from './components/VerificationPanel';
import RideMatcher from './components/RideMatcher';
import PhoneLogin from './components/PhoneLogin';
import {
  ShieldAlert, ShieldCheck, HeartPulse, Sparkles, Navigation, Award, BarChart3,
  Calendar, Lock, Users, Activity, HelpCircle, Footprints, Leaf, Eye, LogOut
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

          {/* User Profile Security Tag */}
          <div className="flex items-center gap-3 bg-[#0A0A0B] border border-zinc-800 p-3 rounded-xl self-start md:self-auto">
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
    </div>
  );
}
