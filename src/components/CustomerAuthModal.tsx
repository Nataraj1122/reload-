import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Smartphone, ArrowRight } from 'lucide-react';
import { 
  RecaptchaVerifier, 
  signInWithPhoneNumber,
  ConfirmationResult
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ADMIN_EMAIL } from '../constants';

declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier;
  }
}

interface CustomerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CustomerAuthModal({ isOpen, onClose }: CustomerAuthModalProps) {
  const navigate = useNavigate();
  const { loginWithGoogle, syncAccount } = useAuth();
  
  const [authMethod, setAuthMethod] = useState<'google' | 'phone'>('google');
  const [phoneNumber, setPhoneNumber] = useState('+91');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
       // Reset state when opened
       setAuthMethod('google');
       setPhoneNumber('+91');
       setVerificationCode('');
       setConfirmationResult(null);
       setError('');
       setLoading(false);
    }
  }, [isOpen]);

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible'
      });
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      await loginWithGoogle();
      // AuthContext handles the sync and the redirect fallback
      onClose();
    } catch (err: any) {
      console.error("Google Login Error:", err);
      if (err.code === 'auth/popup-blocked') {
        setError('Popup blocked. Please enable popups or try clicking again for redirect.');
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError('Login cancelled (popup closed).');
      } else if (err.code === 'auth/cancelled-popup-request') {
        setError('Login request cancelled.');
      } else {
        setError(`Auth Error: ${err.message || 'Unknown error'}. Try opening the site in a new tab if you are using an iframe.`);
      }
    } finally {
       setLoading(false);
    }
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.length < 10) {
       setError("Please enter a valid phone number with country code (e.g. +91...)");
       return;
    }
    
    try {
      setLoading(true);
      setError('');
      setupRecaptcha();
      const appVerifier = window.recaptchaVerifier;
      const result = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      setConfirmationResult(result);
    } catch (err: any) {
       console.error("SMS Error:", err);
       if (err.code === 'auth/invalid-phone-number') {
          setError('Invalid phone number format.');
       } else if (err.code === 'auth/too-many-requests') {
          setError('Too many attempts. Please try again later.');
       } else {
          setError('Failed to send OTP. Please check your connection.');
       }
       if (window.recaptchaVerifier) {
           window.recaptchaVerifier.clear();
           delete (window as any).recaptchaVerifier;
       }
    } finally {
       setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult || !verificationCode) return;
    try {
      setLoading(true);
      setError('');
      const result = await confirmationResult.confirm(verificationCode);
      await syncAccount(result.user, {
        phone: result.user.phoneNumber,
        name: result.user.displayName || '',
        email: result.user.email || ''
      });
      onClose();
      if (result.user.email === ADMIN_EMAIL) {
        navigate('/admin');
      }
    } catch (err: any) {
      console.error(err);
      setError('Invalid OTP code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 z-[200] backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white z-[201] shadow-2xl p-8 md:p-12 border border-zinc-100"
      >
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 text-zinc-400 hover:text-black transition-colors"
        >
          <X size={20} />
        </button>

        <h2 className="text-2xl font-serif mb-2 text-center uppercase tracking-widest">
          Sign In
        </h2>
        <p className="text-xs text-zinc-500 text-center mb-8 uppercase tracking-widest font-medium">
          Access your account
        </p>

        {/* RECAPTCHA CONTAINER (INVISIBLE) */}
        <div id="recaptcha-container"></div>

        {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 border border-red-100 text-[11px] uppercase tracking-widest font-bold text-center leading-relaxed">
              <p className="mb-2">{error}</p>
              <a 
                href={window.location.href} 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline hover:text-red-800"
              >
                Try opening in a new tab
              </a>
            </div>
        )}

        {authMethod === 'google' && (
          <div className="flex flex-col gap-4">
             <button
               onClick={handleGoogleLogin}
               disabled={loading}
               className="group flex items-center justify-center gap-3 w-full border border-black px-4 py-4 text-sm font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-all disabled:opacity-50"
             >
               <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
               </svg>
               Continue with Google
             </button>

             <div className="flex items-center my-4">
                <div className="flex-1 border-t border-zinc-200"></div>
                <span className="px-4 text-[10px] uppercase font-bold tracking-widest text-zinc-400">or</span>
                <div className="flex-1 border-t border-zinc-200"></div>
             </div>

             <button 
               onClick={() => setAuthMethod('phone')}
               className="group flex items-center justify-center gap-3 w-full border border-zinc-200 px-4 py-4 text-sm font-bold uppercase tracking-widest hover:border-black transition-all"
             >
               <Smartphone size={18} />
               Continue with Phone
             </button>
          </div>
        )}

        {authMethod === 'phone' && (
           <div className="flex flex-col gap-6">
              {!confirmationResult ? (
                 <form onSubmit={handleSendOTP} className="flex flex-col gap-6">
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-bold text-zinc-500 mb-2">Phone Number</label>
                      <input 
                        type="tel" 
                        required 
                        value={phoneNumber}
                        onChange={e => setPhoneNumber(e.target.value)}
                        placeholder="+91 9999999999"
                        className="w-full border border-zinc-200 px-4 py-4 text-sm focus:border-black focus:outline-none transition-colors"
                      />
                    </div>
                    <button 
                      type="submit" 
                      disabled={loading}
                      className="group flex items-center justify-center gap-2 bg-black text-white px-4 py-4 text-sm font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Sending OTP...' : 'Send Login Code'}
                      {!loading && <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />}
                    </button>
                 </form>
              ) : (
                 <form onSubmit={handleVerifyOTP} className="flex flex-col gap-6">
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-bold text-zinc-500 mb-2">Verification Code</label>
                      <p className="text-xs text-zinc-500 mb-4">Sent to {phoneNumber}</p>
                      <input 
                        type="text" 
                        required 
                        value={verificationCode}
                        onChange={e => setVerificationCode(e.target.value)}
                        placeholder="123456"
                        maxLength={6}
                        className="w-full border border-zinc-200 px-4 py-4 text-2xl tracking-widest text-center focus:border-black focus:outline-none transition-colors"
                      />
                    </div>
                    <button 
                      type="submit" 
                      disabled={loading}
                      className="group flex items-center justify-center gap-2 bg-black text-white px-4 py-4 text-sm font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Verifying...' : 'Verify & Login'}
                    </button>
                 </form>
              )}

              <button 
                 onClick={() => {
                     setAuthMethod('google');
                     setConfirmationResult(null);
                     setVerificationCode('');
                     setError('');
                 }}
                 className="text-[10px] uppercase tracking-widest font-bold text-zinc-400 hover:text-black transition-colors"
              >
                 Return to Google Login
              </button>
           </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
