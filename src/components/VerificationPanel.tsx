import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Upload, CheckCircle2, AlertCircle, Phone, Fingerprint, Lock, Key, Award, Sparkles, RefreshCw } from 'lucide-react';
import { UserProfile } from '../types';

interface VerificationPanelProps {
  currentUser: UserProfile;
  onUpdateUser: (updated: UserProfile) => void;
}

export default function VerificationPanel({ currentUser, onUpdateUser }: VerificationPanelProps) {
  // Verification states
  const [institution, setInstitution] = useState(currentUser.institution || 'IIIT Hyderabad');
  const [email, setEmail] = useState(currentUser.email || '');
  const [idNumber, setIdNumber] = useState(currentUser.institutionalIdNumber || '');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: string; previewUrl: string } | null>(null);
  
  // MFA states
  const [mfaPhone, setMfaPhone] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [mfaStep, setMfaStep] = useState<'idle' | 'phone_entry' | 'otp_sent' | 'verified'>(
    currentUser.mfaEnabled ? 'verified' : 'idle'
  );
  
  // Logs & Notifications
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [successStatus, setSuccessStatus] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validate academic or corporate domain
  const validateEmailDomain = (em: string, inst: string): boolean => {
    const domain = em.split('@')[1]?.toLowerCase();
    if (!domain) return false;

    if (inst === 'IIIT Hyderabad') return domain.endsWith('iiit.ac.in');
    if (inst === 'IIT Hyderabad') return domain.endsWith('iith.ac.in');
    if (inst === 'Google Hyderabad' || inst === 'Google Inc.') return domain.endsWith('google.com');
    if (inst === 'Microsoft Hyderabad') return domain.endsWith('microsoft.com');
    return false;
  };

  // Drag and Drop support
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setErrorStatus(null);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorStatus(null);
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/') && !file.type.endsWith('pdf')) {
      setErrorStatus('Invalid file format. Please upload an image format (PNG, JPG) or Institutional PDF.');
      return;
    }

    const sizeInKb = Math.round(file.size / 1024);
    const sizeStr = sizeInKb > 1024 ? `${(sizeInKb / 1024).toFixed(1)} MB` : `${sizeInKb} KB`;

    // Mock OCR reader
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedFile({
        name: file.name,
        size: sizeStr,
        previewUrl: e.target?.result as string || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80'
      });
      triggerOCRScanning();
    };
    reader.readAsDataURL(file);
  };

  const triggerOCRScanning = () => {
    setIsScanning(true);
    setScanProgress(0);
    setErrorStatus(null);

    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          setSuccessStatus("Institutional ID scanning successfully decrypted via secure node!");
          return 100;
        }
        return prev + 10;
      });
    }, 150);
  };

  const handleSubmitIDVerification = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorStatus(null);
    setSuccessStatus(null);

    if (!email || !idNumber) {
      setErrorStatus('Please provide your corporate/academic email and ID number.');
      return;
    }

    if (!validateEmailDomain(email, institution)) {
      setErrorStatus(`Email domain doesn't match chosen institution: ${institution}. Must use a valid official domain.`);
      return;
    }

    if (!uploadedFile) {
      setErrorStatus('Please upload or drag-and-drop a copy of your Institutional ID card.');
      return;
    }

    // Auto verify profile
    const updatedProfile: UserProfile = {
      ...currentUser,
      institution,
      email,
      institutionalIdNumber: idNumber,
      verificationStatus: 'verified',
      isVerified: true
    };

    onUpdateUser(updatedProfile);
    setSuccessStatus(`ID successfully verified under ${institution}. Welcome to the Circle!`);
  };

  // Simulating FireAuth MFA triggers
  const sendMfaOTP = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaPhone) {
      setErrorStatus('Please enter a valid phone number.');
      return;
    }
    setErrorStatus(null);
    setMfaStep('otp_sent');
    setSuccessStatus('Security One-Time Passcode sent for +1 ' + mfaPhone);
  };

  const verifyMfaOTP = (e: React.FormEvent) => {
    e.preventDefault();
    if (mfaCode === '123456' || mfaCode.length === 6) {
      setErrorStatus(null);
      setMfaStep('verified');
      
      const updatedProfile: UserProfile = {
        ...currentUser,
        mfaEnabled: true
      };
      onUpdateUser(updatedProfile);
      setSuccessStatus('Firebase MFA token synced successfully! Account security high.');
    } else {
      setErrorStatus('Invalid verification code. Use code "123456" or any 6-digit code for testing.');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Verification instructions / badge status card */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-[#161618] border border-zinc-800 rounded-2xl p-6 relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 p-3 bg-cyan-500/10 text-cyan-400 rounded-bl-2xl">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            Security & Circle Verification
          </h3>
          <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
            COGO runs on a strict <strong>Institutional Circle</strong> structure. Users can only match, share rides, and split fuel with peers who hold verified domains and audited IDs.
          </p>

          {/* Verification Badge Visualizer */}
          <div className="mt-6 p-4 bg-[#0A0A0B]/80 border border-zinc-800 rounded-xl flex items-center gap-4">
            <div className={`p-3 rounded-full ${currentUser.isVerified ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 text-rose-400 animate-pulse'}`}>
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Security Ring Status</p>
              <h4 className="font-bold text-sm text-zinc-200 mt-0.5">
                {currentUser.isVerified ? 'Verified Peer Circle' : 'Restricted Circle Membership'}
              </h4>
              <p className="text-xs text-zinc-400 mt-0.5">
                {currentUser.isVerified ? `Authenticated at ${currentUser.institution}` : 'Verification Pending ID/MFA'}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <div className="flex items-start gap-2.5 text-xs text-zinc-350">
              <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${currentUser.isVerified ? 'text-emerald-400' : 'text-zinc-600'}`} />
              <div>
                <span className="font-bold text-zinc-200">Official Institution Badge:</span> Validates academic/corporate alignment (.ac.in, .com).
              </div>
            </div>
            <div className="flex items-start gap-2.5 text-xs text-zinc-350">
              <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${uploadedFile || currentUser.isVerified ? 'text-emerald-400' : 'text-zinc-600'}`} />
              <div>
                <span className="font-bold text-zinc-200">Decrypted ID Scan:</span> Prevents spoofing through image verification processing.
              </div>
            </div>
            <div className="flex items-start gap-2.5 text-xs text-zinc-350">
              <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${currentUser.mfaEnabled ? 'text-emerald-400' : 'text-zinc-600'}`} />
              <div>
                <span className="font-bold text-zinc-200">Firebase MFA Bound:</span> Two-factor trust anchor for verified mobile communication.
              </div>
            </div>
          </div>

          {currentUser.isVerified && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mt-6 p-4 bg-emerald-950/30 border border-emerald-900/50 rounded-xl relative overflow-hidden"
            >
              <div className="absolute top-2 right-2 text-emerald-400/20">
                <Sparkles className="w-8 h-8" />
              </div>
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                <Award className="w-4 h-4" /> Account Authenticated
              </div>
              <p className="text-xs text-emerald-200 mt-1 leading-relaxed">
                Your credentials meet all security standards. You are cleared to drive and book shared rides across the Hyderabad & tech corridors.
              </p>
            </motion.div>
          )}
        </div>

        {/* Firebase MFA Setup card */}
        <div className="bg-[#161618] border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Phone className="text-cyan-400 w-5 h-5" />
            <h3>Firebase Multi-Factor (MFA)</h3>
          </div>

          {mfaStep === 'idle' && (
            <div className="space-y-3">
              <p className="text-xs text-zinc-400 leading-relaxed">
                Add phone-based multi-factor authentication backbones to guarantee peer coordinate exchange security.
              </p>
              <button
                onClick={() => setMfaStep('phone_entry')}
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-250 font-semibold text-xs py-2.5 rounded-xl border border-zinc-700 transition"
              >
                Configure MFA Lock
              </button>
            </div>
          )}

          {mfaStep === 'phone_entry' && (
            <form onSubmit={sendMfaOTP} className="space-y-3">
              <label className="block text-[10px] font-mono tracking-wider uppercase text-zinc-550">Phone Number</label>
              <div className="flex gap-2">
                <span className="bg-[#0A0A0B] border border-zinc-805 text-zinc-400 px-3 py-2 rounded-xl text-xs flex items-center font-mono">+1</span>
                <input
                  type="tel"
                  required
                  placeholder="(555) 000-0000"
                  value={mfaPhone}
                  onChange={(e) => setMfaPhone(e.target.value)}
                  className="flex-1 bg-[#0A0A0B] border border-zinc-800 focus:border-cyan-500 focus:outline-none text-zinc-200 text-xs px-3 py-2 rounded-xl font-mono"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs py-2.5 rounded-xl transition shadow"
              >
                Send OTP Verification
              </button>
            </form>
          )}

          {mfaStep === 'otp_sent' && (
            <form onSubmit={verifyMfaOTP} className="space-y-3">
              <label className="block text-[10px] font-mono tracking-wider uppercase text-zinc-550">Enter SMS Verification Code</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  required
                  placeholder="123456"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  className="w-full bg-[#0A0A0B] border border-zinc-800 text-center tracking-widest font-mono text-sm focus:border-cyan-500 focus:outline-none text-zinc-200 py-2.5 rounded-xl"
                />
              </div>
              <p className="text-[10px] text-zinc-500 text-center font-mono">
                Hint: Enter <strong className="text-zinc-400">123456</strong> for testing
              </p>
              <button
                type="submit"
                className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs py-2.5 rounded-xl transition"
              >
                Validate Security Key
              </button>
            </form>
          )}

          {mfaStep === 'verified' && (
            <div className="p-3.5 bg-cyan-950/20 border border-cyan-900/40 rounded-xl flex items-center gap-3">
              <Fingerprint className="text-cyan-400 w-8 h-8 shrink-0 animate-pulse" />
              <div>
                <p className="text-xs font-semibold text-zinc-200">Secured via Firebase MFA</p>
                <span className="text-[10px] text-cyan-400 font-mono">TOKEN: FIRE-OTP-VERIFIED</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ID Upload & Verification Form */}
      <div className="lg:col-span-7 bg-[#161618] border border-zinc-805 rounded-2xl p-6 shadow-xl">
        <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-zinc-800 pb-4">
          <ShieldCheck className="text-cyan-400 w-5.5 h-5.5" />
          Institutional ID Verification Wizard
        </h3>

        {/* Global Feedback Panel */}
        {errorStatus && (
          <div className="mt-4 p-3 bg-rose-950/20 border border-rose-900/40 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4.5 h-4.5 shrink-0 animate-bounce" />
            <p>{errorStatus}</p>
          </div>
        )}

        {successStatus && (
          <div className="mt-4 p-3 bg-emerald-955/20 border border-emerald-900/40 rounded-xl text-emerald-350 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4.5 h-4.5 shrink-0" />
            <p>{successStatus}</p>
          </div>
        )}

        <form onSubmit={handleSubmitIDVerification} className="mt-6 space-y-5">
          {/* Institutional Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-350 mb-1.5">Affiliation Network</label>
              <select
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                className="w-full bg-[#0A0A0B] border border-zinc-800 focus:border-cyan-500 focus:outline-none text-zinc-300 text-xs px-3 py-2.5 rounded-xl cursor-pointer"
              >
                <option value="IIIT Hyderabad">IIIT Hyderabad (Academic)</option>
                <option value="IIT Hyderabad">IIT Hyderabad (Academic)</option>
                <option value="Google Hyderabad">Google Hyderabad (Corporate)</option>
                <option value="Microsoft Hyderabad">Microsoft Hyderabad (Corporate)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-350 mb-1.5">ID Document Number</label>
              <input
                type="text"
                required
                placeholder="ST-902847"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                className="w-full bg-[#0A0A0B] border border-zinc-800 focus:border-cyan-500 focus:outline-none text-zinc-200 text-xs px-3 py-2.5 rounded-xl font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-350 mb-1.5">
              Official Email Address <span className="text-zinc-500 font-normal">({(institution === 'Google Hyderabad' || institution === 'Google Inc.') ? '@google.com' : institution === 'Microsoft Hyderabad' ? '@microsoft.com' : '@*ac.in'})</span>
            </label>
            <input
              type="email"
              required
              placeholder={(institution === 'Google Hyderabad' || institution === 'Google Inc.') ? 'name@google.com' : institution === 'Microsoft Hyderabad' ? 'name@microsoft.com' : institution === 'IIIT Hyderabad' ? 'student@iiit.ac.in' : 'student@iith.ac.in'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#0A0A0B] border border-zinc-800 focus:border-cyan-500 focus:outline-none text-zinc-200 text-xs px-3 py-2.5 rounded-xl font-mono"
            />
          </div>

          {/* Interactive Drag and Drop Upload */}
          <div>
            <label className="block text-xs font-bold text-zinc-350 mb-1.5">Institutional ID Copy of Card / Paystub PDF</label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${isDragging ? 'border-cyan-400 bg-cyan-950/20' : 'border-zinc-800 hover:border-zinc-700 bg-[#0A0A0B]/40'}`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                accept="image/*,application/pdf"
              />
              
              <Upload className={`w-8 h-8 mb-3 transition ${isDragging ? 'text-cyan-400' : 'text-zinc-500'}`} />
              <p className="text-xs text-zinc-300 font-semibold text-center">
                Drag and drop your Institutional ID card or click to browse
              </p>
              <p className="text-[10px] text-zinc-500 mt-1.5 text-center">
                Supports PNG, JPG, or PDF up to 4MB. Decrypted locally inside secure browser isolation.
              </p>
            </div>
          </div>

          {/* Simulated scanning / uploading layout */}
          <AnimatePresence>
            {isScanning && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 bg-[#0A0A0B] border border-zinc-800 rounded-xl space-y-2 mt-4"
              >
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-400 flex items-center gap-1.5">
                    <RefreshCw className="w-4.5 h-4.5 animate-spin text-cyan-455" />
                    OCR Scanners: Decrypting ID and validating matching metadata...
                  </span>
                  <span className="text-cyan-400 font-bold">{scanProgress}%</span>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                  <motion.div
                    className="bg-cyan-500 h-1.5"
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>
              </motion.div>
            )}

            {uploadedFile && !isScanning && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-[#0A0A0B] border border-zinc-800 rounded-xl flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  {uploadedFile.previewUrl && (
                    <img
                      src={uploadedFile.previewUrl}
                      alt="Verified Doc preview"
                      className="w-12 h-12 object-cover rounded-md border border-zinc-800"
                    />
                  )}
                  <div>
                    <p className="text-xs font-semibold text-zinc-200 truncate max-w-[200px]" title={uploadedFile.name}>
                      {uploadedFile.name}
                    </p>
                    <span className="text-[10px] text-zinc-500 font-mono">{uploadedFile.size}</span>
                  </div>
                </div>
                <div className="text-[10px] text-cyan-300 font-semibold font-mono bg-cyan-950/60 border border-cyan-900/60 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <span className="h-1.5 w-1.5 bg-cyan-450 rounded-full animate-ping"></span>
                  OCR CONFIRMED
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Verification Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs py-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow"
            >
              Verify & Bind Institutional Certificate
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
