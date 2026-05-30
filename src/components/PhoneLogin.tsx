import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Phone, Lock, ShieldCheck, ArrowRight, RefreshCw, MessageSquare, User, Building2, Smartphone } from 'lucide-react';
import { UserProfile } from '../types';
import { MOCK_USERS } from '../data';

interface PhoneLoginProps {
  onLoginSuccess: (user: UserProfile) => void;
}

export default function PhoneLogin({ onLoginSuccess }: PhoneLoginProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Setup user selector (either select one of mock users or register a new one)
  const [loginMode, setLoginMode] = useState<'quick' | 'custom'>('quick');
  const [selectedMockUser, setSelectedMockUser] = useState<UserProfile>(MOCK_USERS[3]); // Avinash as default

  // For custom user signup
  const [customName, setCustomName] = useState('');
  const [customInstitution, setCustomInstitution] = useState('IIIT Hyderabad');
  const [customEmail, setCustomEmail] = useState('');

  // Handle countdown timer for resending OTP
  useEffect(() => {
    let timer: any;
    if (otpSent && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpSent, countdown]);

  const validatePhone = (num: string) => {
    return /^[6-9]\d{9}$/.test(num); // Standard 10-digit Indian phone validator
  };

  const handleSendOtp = () => {
    setErrorMsg(null);
    if (loginMode === 'custom' && !validatePhone(phoneNumber)) {
      setErrorMsg('Please enter a valid 10-digit mobile number (starting with 6-9)');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      // Generate a sweet 6-digit code
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(otp);
      setOtpSent(true);
      setCountdown(60);
      setLoading(false);

      // Create a gorgeous visual SMS gateway notification simulation
      const activeNum = loginMode === 'quick' ? '9876543210' : phoneNumber;
      setNotification(`💬 SMS GATEWAY SIMULATION: OTP code "[${otp}]" dispatched to +91 ${activeNum}`);

      // Auto-dismiss notification after 15 seconds
      setTimeout(() => {
        setNotification(null);
      }, 15000);
    }, 800);
  };

  const handleVerifyOtp = () => {
    setErrorMsg(null);
    if (enteredOtp !== generatedOtp) {
      setErrorMsg('Incorrect OTP code. Please try again or resend the code.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);

      let finalUser: UserProfile;
      if (loginMode === 'quick') {
        const matchingMock = MOCK_USERS.find(u => u.id === selectedMockUser.id) || MOCK_USERS[3];
        // Ensure user is marked authenticated via local number
        finalUser = {
          ...matchingMock,
          isVerified: true,
          verificationStatus: 'verified',
          mfaEnabled: true
        };
      } else {
        // Create custom profile
        finalUser = {
          id: `custom_user_${Date.now()}`,
          name: customName || 'New Commuter',
          email: customEmail || `${(customName || 'commuter').toLowerCase().replace(/\s+/g, '')}@iiit.ac.in`,
          avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
          institution: customInstitution,
          role: 'student',
          institutionalIdNumber: `HYD-${Math.floor(100000 + Math.random() * 900000)}`,
          isVerified: true,
          verificationStatus: 'verified',
          mfaEnabled: true,
          rating: 5.0,
          ridesCompleted: 0
        };
      }

      // Persist log-in session
      localStorage.setItem('cogo_logged_in_user', JSON.stringify(finalUser));
      onLoginSuccess(finalUser);
    }, 1000);
  };

  const handleQuickSelect = (user: UserProfile) => {
    setSelectedMockUser(user);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] flex flex-col items-center justify-center p-4 selection:bg-cyan-500/30">
      {/* Visual background ambient glowing orbs */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-500/5 rounded-full blur-[150px] pointer-events-none" />

      {/* Main Login Card container */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md bg-[#0F0F11] border border-zinc-800/80 rounded-3xl p-6 md:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative z-10"
        id="cogo-login-card"
      >
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex bg-cyan-500/10 border border-cyan-500/20 p-3.5 rounded-2xl text-cyan-400 mb-3 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
            <Smartphone className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">COGO SECURE ACCESS</h2>
          <p className="text-xs text-zinc-400 mt-1.5 max-w-xs mx-auto">
            Log in using physical mobile verification OTP to enter Hyderabad's peer-to-peer network.
          </p>
        </div>

        {/* Dynamic OTP Dispatch Simulation Notification Drawer */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              className="mb-5 bg-cyan-950/40 border border-cyan-500/20 rounded-xl p-3.5 text-xs text-cyan-350 shadow-inner"
            >
              <div className="flex items-start gap-2.5">
                <MessageSquare className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5 animate-bounce" />
                <div className="flex-1">
                  <p className="font-semibold text-cyan-200">Device Carrier Stream (Simulated)</p>
                  <p className="mt-1 font-mono text-[11px] leading-relaxed select-text bg-black/40 p-2 rounded-lg border border-cyan-950">
                    {notification}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEnteredOtp(generatedOtp);
                        setNotification(null);
                      }}
                      className="text-[10px] bg-cyan-400 text-black px-2 py-0.5 rounded font-bold hover:bg-cyan-300 transition cursor-pointer"
                    >
                      Auto-Fill Code
                    </button>
                    <span className="text-[9px] text-zinc-500 font-medium">Valid for 60s</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error reporting */}
        {errorMsg && (
          <div className="mb-4 bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl text-xs text-rose-400 font-medium font-sans">
            ❌ {errorMsg}
          </div>
        )}

        <AnimatePresence mode="wait">
          {!otpSent ? (
            <motion.div
              key="step-phone"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-5"
            >
              {/* Credentials Mode Select */}
              <div className="grid grid-cols-2 bg-[#0A0A0B] p-1 rounded-xl border border-zinc-850">
                <button
                  type="button"
                  onClick={() => { setLoginMode('quick'); setErrorMsg(null); }}
                  className={`py-2 text-[11px] font-bold tracking-wider uppercase rounded-lg transition cursor-pointer ${
                    loginMode === 'quick' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  🏫 Choose Peer User
                </button>
                <button
                  type="button"
                  onClick={() => { setLoginMode('custom'); setErrorMsg(null); }}
                  className={`py-2 text-[11px] font-bold tracking-wider uppercase rounded-lg transition cursor-pointer ${
                    loginMode === 'custom' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  📱 Enter Custom Number
                </button>
              </div>

              {loginMode === 'quick' ? (
                <div className="space-y-3.5">
                  <label className="block text-xs font-bold text-zinc-450 uppercase tracking-wider">
                    Select active institutional commuter profile:
                  </label>
                  <div className="space-y-2.5 max-h-[170px] overflow-y-auto pr-1">
                    {MOCK_USERS.map((user) => (
                      <div
                        key={user.id}
                        onClick={() => handleQuickSelect(user)}
                        className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                          selectedMockUser.id === user.id
                            ? 'bg-cyan-950/20 border-cyan-500/40 text-cyan-200'
                            : 'bg-[#121214] border-zinc-850 text-zinc-300 hover:border-zinc-800'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <img
                            src={user.avatarUrl}
                            alt={user.name}
                            className="w-8 h-8 rounded-full object-cover border border-zinc-800"
                          />
                          <div className="text-left">
                            <p className="text-xs font-bold font-sans text-white">{user.name}</p>
                            <p className="text-[10px] text-zinc-400 mt-0.5">
                              {user.institution} • {user.role === 'student' ? 'Student' : 'Staff'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-mono text-zinc-400 bg-[#0A0A0B] px-2 py-1 rounded border border-zinc-800 inline-block font-semibold">
                            {user.id === 'user_driver_1' ? '+91 94401 20211' : user.id === 'user_driver_2' ? '+91 98858 10091' : '+91 81283 50284'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-[#121214] p-3 rounded-xl border border-zinc-850/60 text-[11px] text-zinc-400 leading-relaxed font-sans mt-2">
                    🔒 Selecting a character automatically feeds their pre-authorized virtual phone number to initiate simulated OTP transit handshake bypass.
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Custom Info form */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-350 mb-1.5">Your Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 w-4 h-4 text-zinc-550" />
                      <input
                        type="text"
                        required
                        placeholder="E.g. Rajesh Kumar"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        className="w-full bg-[#0A0A0B] border border-zinc-800 focus:border-cyan-500 focus:outline-none text-zinc-200 text-xs pl-9 pr-3 py-2.5 rounded-xl block font-sans"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-350 mb-1.5">Affiliation Circle</label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-2.5 w-4 h-4 text-zinc-550" />
                      <select
                        value={customInstitution}
                        onChange={(e) => setCustomInstitution(e.target.value)}
                        className="w-full bg-[#0A0A0B] border border-zinc-800 focus:border-cyan-500 focus:outline-none text-zinc-300 text-xs pl-9 pr-3 py-2.5 rounded-xl cursor-pointer"
                      >
                        <option value="IIIT Hyderabad">IIIT Hyderabad</option>
                        <option value="IIT Hyderabad">IIT Hyderabad</option>
                        <option value="Google Hyderabad">Google Hyderabad</option>
                        <option value="Microsoft Hyderabad">Microsoft Hyderabad</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-350 mb-1.5">Mobile Phone Number</label>
                    <div className="flex gap-2">
                      <span className="bg-[#0A0A0B] border border-zinc-805 text-zinc-400 text-xs px-3.5 py-2.5 rounded-xl flex items-center font-bold font-mono">
                        +91
                      </span>
                      <input
                        type="tel"
                        maxLength={10}
                        placeholder="98765 43210"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                        className="flex-1 bg-[#0A0A0B] border border-zinc-800 focus:border-cyan-500 focus:outline-none text-zinc-200 text-xs px-3 py-2.5 rounded-xl font-mono text-center tracking-widest text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Submit CTA */}
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={loading}
                className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold uppercase tracking-wider text-xs py-3.5 rounded-xl transition duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-[0_5px_15px_rgba(6,182,212,0.15)] active:translate-y-0.5 disabled:opacity-40 select-none"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Generate & Send OTP Securely</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="step-otp"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-5"
            >
              {/* Back Button */}
              <button
                onClick={() => { setOtpSent(false); setEnteredOtp(''); }}
                className="text-xs text-zinc-450 hover:text-zinc-200 pb-1 cursor-pointer transition flex items-center gap-1.5"
              >
                ← Back to profile setup
              </button>

              <div className="bg-[#121214] p-3.5 rounded-2xl border border-zinc-850 flex items-center justify-between text-xs text-zinc-350">
                <div>
                  <span className="block font-semibold text-zinc-400">Verifying Destination:</span>
                  <span className="font-mono text-zinc-200 bg-[#0A0A0B] px-1.5 py-0.5 border border-zinc-800 rounded inline-block mt-1">
                    +91 {loginMode === 'quick' ? '98765 43210' : phoneNumber}
                  </span>
                </div>
                <div className="text-right">
                  <span className="block text-[10px] text-zinc-500 font-mono">OTP COUNTDOWN</span>
                  <span className="font-mono text-cyan-400 font-bold">{countdown}s</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-350 mb-2 text-center uppercase tracking-wider">
                  Enter 6-Digit OTP Code
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    value={enteredOtp}
                    onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-[#0A0A0B] border border-zinc-800 focus:border-cyan-500 focus:outline-none text-zinc-100 font-mono text-center py-3.5 rounded-2xl text-lg tracking-[8px] pl-10"
                  />
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="button"
                onClick={handleVerifyOtp}
                disabled={loading || enteredOtp.length < 6}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold uppercase tracking-wider text-xs py-3.5 rounded-xl transition duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-[0_5px_15px_rgba(16,185,129,0.15)] active:translate-y-0.5 disabled:opacity-40 select-none"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verify OTP & Launch Dashboard</span>
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={countdown > 0}
                  className="text-xs text-zinc-400 hover:text-cyan-400 transition cursor-pointer disabled:opacity-40 font-semibold"
                >
                  Didn't receive the SMS?{' '}
                  <span className={countdown > 0 ? 'text-zinc-650' : 'text-cyan-400 underline'}>
                    Resend OTP {countdown > 0 ? `(${countdown}s)` : ''}
                  </span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Outer safety notes */}
        <div className="mt-6 border-t border-zinc-850/60 pt-4 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
          <span className="flex items-center gap-1">
            <Lock className="w-3 h-3 text-emerald-400" /> AES-256 OTP Encrypted
          </span>
          <span>COGO Hyderabad Nodes</span>
        </div>
      </motion.div>
    </div>
  );
}
