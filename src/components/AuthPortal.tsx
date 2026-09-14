import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Eye, EyeOff, ShieldCheck, TrendingUp, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';

interface AuthPortalProps {
  isOpen?: boolean;
  onClose?: () => void;
  isModalMode?: boolean;
}

export const AuthPortal: React.FC<AuthPortalProps> = ({
  isOpen = true,
  onClose,
  isModalMode = false,
}) => {
  const { login, signup, loginWithGoogle, resetPassword } = useAuth();

  const [isRightPanelActive, setIsRightPanelActive] = useState<boolean>(false);
  const [signInEmail, setSignInEmail] = useState<string>('');
  const [signInPassword, setSignInPassword] = useState<string>('');
  const [showSignInPass, setShowSignInPass] = useState<boolean>(false);

  const [signUpName, setSignUpName] = useState<string>('');
  const [signUpEmail, setSignUpEmail] = useState<string>('');
  const [signUpPassword, setSignUpPassword] = useState<string>('');
  const [signUpConfirmPass, setSignUpConfirmPass] = useState<string>('');
  const [showSignUpPass, setShowSignUpPass] = useState<boolean>(false);
  const [showConfirmPass, setShowConfirmPass] = useState<boolean>(false);

  const [passwordStrength, setPasswordStrength] = useState<{
    score: number;
    text: string;
    color: string;
    width: string;
  }>({
    score: 0,
    text: 'Password strength: Empty',
    color: '#9ca3af',
    width: '0%',
  });

  const [passwordsMatch, setPasswordsMatch] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Forgot password modal state
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState<boolean>(false);
  const [forgotEmail, setForgotEmail] = useState<string>('');
  const [forgotLoading, setForgotLoading] = useState<boolean>(false);
  const [forgotStatus, setForgotStatus] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Parse Firebase Auth errors into clean, trader-friendly messages
  const getFriendlyErrorMessage = (err: any): string => {
    const code = err?.code || '';
    const msg = err?.message || '';

    if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
      return 'Invalid email or password. Please verify your credentials or create a new account.';
    }
    if (code === 'auth/email-already-in-use') {
      return 'An account already exists with this email address. Please sign in instead.';
    }
    if (code === 'auth/weak-password') {
      return 'Password should be at least 6 characters long with letters and numbers.';
    }
    if (code === 'auth/invalid-email') {
      return 'Please enter a valid email address format.';
    }
    if (code === 'auth/popup-closed-by-user') {
      return 'Google sign-in popup was closed before completing authentication.';
    }
    if (code === 'auth/too-many-requests') {
      return 'Access to this account has been temporarily disabled due to many failed login attempts. Try resetting your password or wait a few moments.';
    }
    if (msg.includes('network') || code === 'auth/network-request-failed') {
      return 'Network connection issue. Please check your internet connection.';
    }
    return msg || 'Authentication failed. Please verify your details.';
  };

  // Background Bioluminescent Candlestick Canvas Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    interface Candle {
      open: number;
      close: number;
      high: number;
      low: number;
    }

    const MAX_CANDLES = 28;
    let currentPrice = 500;
    const candles: Candle[] = [];

    // Pre-populate candles for immediate rich visual
    for (let i = 0; i < MAX_CANDLES; i++) {
      const volatility = 40;
      const open = currentPrice;
      const close = open + (Math.random() - 0.49) * volatility;
      const high = Math.max(open, close) + Math.random() * (volatility * 0.45);
      const low = Math.min(open, close) - Math.random() * (volatility * 0.45);
      currentPrice = Math.max(200, Math.min(800, close));
      candles.push({ open, close, high, low });
    }

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const generateCandle = () => {
      const volatility = 35;
      const open = currentPrice;
      const close = open + (Math.random() - 0.49) * volatility;
      const high = Math.max(open, close) + Math.random() * (volatility * 0.5);
      const low = Math.min(open, close) - Math.random() * (volatility * 0.5);

      currentPrice = close;
      if (currentPrice < 150) currentPrice = 250;
      if (currentPrice > 850) currentPrice = 750;

      candles.push({ open, close, high, low });
      if (candles.length > MAX_CANDLES) {
        candles.shift();
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Bioluminescent grid background
      ctx.strokeStyle = 'rgba(0, 255, 170, 0.03)';
      ctx.lineWidth = 1;
      const gridSize = 45;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      if (candles.length === 0) return;

      let minPrice = Infinity;
      let maxPrice = -Infinity;
      candles.forEach((c) => {
        if (c.low < minPrice) minPrice = c.low;
        if (c.high > maxPrice) maxPrice = c.high;
      });

      const padding = 90;
      const priceRange = maxPrice - minPrice || 1;
      const getY = (price: number) =>
        height - padding - ((price - minPrice) / priceRange) * (height - padding * 2);
      const candleWidth = width / MAX_CANDLES;

      candles.forEach((c, index) => {
        const x = index * candleWidth;
        const openY = getY(c.open);
        const closeY = getY(c.close);
        const highY = getY(c.high);
        const lowY = getY(c.low);

        const isBull = c.close >= c.open;
        const glowColor = isBull ? 'rgba(0, 255, 170, 0.85)' : 'rgba(255, 0, 85, 0.85)';
        const bodyColor = isBull ? '#00ffaa' : '#ff0055';

        // Draw Candle Wick
        ctx.shadowBlur = 12;
        ctx.shadowColor = glowColor;
        ctx.strokeStyle = bodyColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + candleWidth / 2, highY);
        ctx.lineTo(x + candleWidth / 2, lowY);
        ctx.stroke();

        // Draw Candle Body
        ctx.fillStyle = bodyColor;
        const candleHeight = Math.max(Math.abs(closeY - openY), 3);
        const bodyY = Math.min(openY, closeY);
        ctx.fillRect(x + 3, bodyY, Math.max(candleWidth - 6, 2), candleHeight);

        // Glowing core accent
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + 5, bodyY + 1, Math.max(candleWidth - 10, 1), Math.max(candleHeight - 2, 1));
      });

      ctx.shadowBlur = 0;
    };

    const intervalId = setInterval(() => {
      generateCandle();
      draw();
    }, 280);

    draw();

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Password strength calculation
  const handlePasswordChange = (val: string) => {
    setSignUpPassword(val);
    let score = 0;
    if (val.length === 0) {
      setPasswordStrength({
        score: 0,
        text: 'Password strength: Empty',
        color: '#9ca3af',
        width: '0%',
      });
      return;
    }
    if (val.length >= 8) score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;

    if (score === 1) {
      setPasswordStrength({
        score: 1,
        text: 'Password strength: Weak (Try 8+ characters)',
        color: '#ff0055',
        width: '25%',
      });
    } else if (score === 2) {
      setPasswordStrength({
        score: 2,
        text: 'Password strength: Moderate (Add upper/number)',
        color: '#eab308',
        width: '50%',
      });
    } else if (score === 3) {
      setPasswordStrength({
        score: 3,
        text: 'Password strength: Strong (Add special symbols)',
        color: '#3b82f6',
        width: '75%',
      });
    } else if (score === 4) {
      setPasswordStrength({
        score: 4,
        text: 'Password strength: Highly Secure!',
        color: '#00ffaa',
        width: '100%',
      });
    }

    if (signUpConfirmPass.length > 0) {
      setPasswordsMatch(val === signUpConfirmPass);
    }
  };

  const handleConfirmPasswordChange = (val: string) => {
    setSignUpConfirmPass(val);
    if (val.length === 0) {
      setPasswordsMatch(null);
    } else {
      setPasswordsMatch(val === signUpPassword);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInEmail || !signInPassword) {
      setErrorMessage('Please enter both email and password');
      return;
    }
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);
    try {
      await login(signInEmail, signInPassword);
      if (onClose) onClose();
    } catch (err: any) {
      setErrorMessage(getFriendlyErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpName || !signUpEmail || !signUpPassword) {
      setErrorMessage('Please fill out all required fields');
      return;
    }
    if (signUpPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long');
      return;
    }
    if (signUpPassword !== signUpConfirmPass) {
      setErrorMessage('Passwords do not match');
      return;
    }
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);
    try {
      await signup(signUpName, signUpEmail, signUpPassword);
      if (onClose) onClose();
    } catch (err: any) {
      setErrorMessage(getFriendlyErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);
    try {
      await loginWithGoogle();
      if (onClose) onClose();
    } catch (err: any) {
      setErrorMessage(getFriendlyErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail || !forgotEmail.trim()) {
      setForgotStatus({ type: 'error', text: 'Please enter your registered email address.' });
      return;
    }
    setForgotLoading(true);
    setForgotStatus(null);
    try {
      await resetPassword(forgotEmail.trim());
      setForgotStatus({
        type: 'success',
        text: 'Password reset link sent! Check your inbox to choose a new password.',
      });
    } catch (err: any) {
      setForgotStatus({
        type: 'error',
        text: getFriendlyErrorMessage(err),
      });
    } finally {
      setForgotLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#030708] overflow-hidden select-none">
      {/* Background Animated Bioluminescent Canvas */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <canvas ref={canvasRef} className="w-full h-full opacity-60 block" />
      </div>

      {/* Dark Vignette Overlay */}
      <div
        className="absolute inset-0 z-1 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, transparent 20%, rgba(3, 7, 8, 0.88) 100%)',
        }}
      />

      {/* Close button if shown in modal mode while already authenticated */}
      {isModalMode && onClose && (
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-50 p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 backdrop-blur transition cursor-pointer"
          title="Close Auth Portal"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {/* Main Portal Container Card */}
      <div
        className={`relative z-10 w-[880px] max-w-[92%] sm:max-w-[460px] md:max-w-[880px] h-auto min-h-[540px] md:h-[630px] rounded-2xl border border-white/10 backdrop-blur-2xl shadow-2xl overflow-hidden flex transition-all duration-700 ${
          isRightPanelActive ? 'right-panel-active' : ''
        }`}
        style={{
          backgroundColor: 'rgba(3, 7, 8, 0.88)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), inset 0 0 50px rgba(0, 255, 170, 0.03)',
        }}
      >
        {/* ======================================================== */}
        {/* SIGN IN CONTAINER */}
        {/* ======================================================== */}
        <div
          className={`w-full md:w-1/2 md:absolute md:top-0 md:left-0 md:h-full flex flex-col justify-center px-6 py-7 sm:px-10 md:px-12 transition-all duration-700 ease-[cubic-bezier(0.76,0,0.24,1)] ${
            isRightPanelActive
              ? 'hidden md:flex md:translate-x-full md:opacity-0 md:pointer-events-none md:z-1'
              : 'flex translate-x-0 opacity-100 pointer-events-auto z-10'
          }`}
        >
          <form onSubmit={handleSignIn} className="flex flex-col w-full">
            {/* Brand Logo Wrap */}
            <div className="flex items-center gap-2.5 mb-3.5">
              <img
                src="/logo.png"
                alt="OTIVO logo"
                className="w-7 h-7 object-contain rounded-md shadow-[0_0_8px_#00ffaa]"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div className="text-white font-extrabold text-lg tracking-[3px] font-sans">
                OTIVO<span className="text-[#00ffaa]">FX</span>
              </div>
            </div>

            <h1 className="text-2xl font-bold text-slate-100 mb-1 tracking-tight font-sans">
              Welcome Back
            </h1>
            <p className="text-xs text-slate-400 mb-4 font-sans">
              Sign in to sync your saved watchlists and trading profile across all devices
            </p>

            {errorMessage && !isRightPanelActive && (
              <div className="mb-3 px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && !isRightPanelActive && (
              <div className="mb-3 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Email Field with Floating Label */}
            <div className="relative mb-3.5 w-full group">
              <input
                type="email"
                id="signin-email"
                required
                placeholder=" "
                value={signInEmail}
                onChange={(e) => setSignInEmail(e.target.value)}
                className="peer w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-lg text-slate-100 text-sm outline-none transition duration-300 focus:border-[#00ffaa] focus:bg-white/[0.06] focus:shadow-[0_0_12px_rgba(0,255,170,0.18)]"
              />
              <label
                htmlFor="signin-email"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none transition-all duration-300 peer-focus:-top-2 peer-focus:left-2.5 peer-focus:text-[10px] peer-focus:text-[#00ffaa] peer-focus:bg-[#030708] peer-focus:px-1.5 peer-focus:rounded peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:left-2.5 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:text-[#00ffaa] peer-[:not(:placeholder-shown)]:bg-[#030708] peer-[:not(:placeholder-shown)]:px-1.5"
              >
                Email Address
              </label>
            </div>

            {/* Password Field with Floating Label & Eye Toggle */}
            <div className="relative mb-2 w-full group">
              <input
                type={showSignInPass ? 'text' : 'password'}
                id="signin-pass"
                required
                placeholder=" "
                value={signInPassword}
                onChange={(e) => setSignInPassword(e.target.value)}
                className="peer w-full pl-4 pr-11 py-3 bg-white/[0.03] border border-white/10 rounded-lg text-slate-100 text-sm outline-none transition duration-300 focus:border-[#00ffaa] focus:bg-white/[0.06] focus:shadow-[0_0_12px_rgba(0,255,170,0.18)]"
              />
              <label
                htmlFor="signin-pass"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none transition-all duration-300 peer-focus:-top-2 peer-focus:left-2.5 peer-focus:text-[10px] peer-focus:text-[#00ffaa] peer-focus:bg-[#030708] peer-focus:px-1.5 peer-focus:rounded peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:left-2.5 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:text-[#00ffaa] peer-[:not(:placeholder-shown)]:bg-[#030708] peer-[:not(:placeholder-shown)]:px-1.5"
              >
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowSignInPass(!showSignInPass)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#00ffaa] transition-colors p-1 cursor-pointer"
                title={showSignInPass ? 'Hide password' : 'Show password'}
              >
                {showSignInPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex justify-end items-center mb-4">
              <button
                type="button"
                onClick={() => {
                  setForgotEmail(signInEmail);
                  setForgotStatus(null);
                  setIsForgotPasswordOpen(true);
                }}
                className="text-[11px] text-slate-400 hover:text-[#00ffaa] transition-colors cursor-pointer bg-transparent border-none p-0"
              >
                Forgot Password?
              </button>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-6 rounded-lg bg-gradient-to-r from-[#00ffaa] to-[#029463] hover:from-[#00ffaa] hover:to-[#00cc88] text-[#01120b] font-bold text-xs uppercase tracking-wider transition-all duration-300 shadow-[0_4px_18px_rgba(0,255,170,0.25)] hover:shadow-[0_6px_24px_rgba(0,255,170,0.4)] hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </button>

              <div className="flex items-center text-center my-1 text-[11px] uppercase tracking-wider text-white/20 before:flex-1 before:border-b before:border-white/10 before:mr-3 after:flex-1 after:border-b after:border-white/10 after:ml-3">
                or
              </div>

              {/* Continue with Google */}
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2.5 transition-all duration-200 cursor-pointer"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                  <g>
                    <path
                      d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1v2.58h3.3c1.93,-1.78 3.04,-4.4 3.04,-7.48c0,-0.31 -0.03,-0.61 -0.07,-0.9z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12,20.7c2.43,0 4.47,-0.81 5.96,-2.2l-3.3,-2.58c-0.91,0.61 -2.08,0.98 -3.3,0.98c-2.34,0 -4.32,-1.58 -5.02,-3.7H2.94v2.66c1.47,2.92 4.5,4.84 8.06,4.84z"
                      fill="#34A853"
                    />
                    <path
                      d="M6.98,13.2a5.2,5.2 0 0 1 0,-3.3V7.24H2.94a8.77,8.77 0 0 0 0,8.62l4.04,-2.66z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12,7.3c1.32,0 2.51,0.45 3.44,1.35l2.58,-2.58C16.46,4.72 14.43,3.9 12,3.9c-3.56,0 -6.59,1.92 -8.06,4.84l4.04,2.66c0.7,-2.12 2.68,-3.7 5.02,-3.7z"
                      fill="#EA4335"
                    />
                  </g>
                </svg>
                <span>Continue with Google</span>
              </button>

              {/* Mobile direct toggle */}
              <div className="flex md:hidden justify-center items-center mt-2.5 pt-2 text-xs text-slate-400 border-t border-white/5">
                <span>New to OTIVO?</span>
                <button
                  type="button"
                  onClick={() => {
                    setIsRightPanelActive(true);
                    setErrorMessage('');
                  }}
                  className="ml-1.5 text-[#00ffaa] font-bold hover:underline cursor-pointer"
                >
                  Create Account
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* ======================================================== */}
        {/* SIGN UP CONTAINER */}
        {/* ======================================================== */}
        <div
          className={`w-full md:w-1/2 md:absolute md:top-0 md:left-0 md:h-full flex flex-col justify-center px-6 py-6 sm:px-10 md:px-12 transition-all duration-700 ease-[cubic-bezier(0.76,0,0.24,1)] ${
            isRightPanelActive
              ? 'flex translate-x-0 opacity-100 pointer-events-auto z-10 md:translate-x-full'
              : 'hidden md:flex md:translate-x-0 md:opacity-0 md:pointer-events-none md:z-1'
          }`}
        >
          <form onSubmit={handleSignUp} className="flex flex-col w-full">
            {/* Brand Logo Wrap */}
            <div className="flex items-center gap-2.5 mb-2.5">
              <img
                src="/logo.png"
                alt="OTIVO logo"
                className="w-7 h-7 object-contain rounded-md shadow-[0_0_8px_#00ffaa]"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div className="text-white font-extrabold text-lg tracking-[3px] font-sans">
                OTIVO<span className="text-[#00ffaa]">FX</span>
              </div>
            </div>

            <h1 className="text-2xl font-bold text-slate-100 mb-1 tracking-tight font-sans">
              Create Account
            </h1>
            <p className="text-xs text-slate-400 mb-3 font-sans">
              Register your trader profile to save watchlists and custom risk settings
            </p>

            {errorMessage && isRightPanelActive && (
              <div className="mb-3 px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Full Name */}
            <div className="relative mb-2.5 w-full group">
              <input
                type="text"
                id="signup-name"
                required
                placeholder=" "
                value={signUpName}
                onChange={(e) => setSignUpName(e.target.value)}
                className="peer w-full px-4 py-2.5 bg-white/[0.03] border border-white/10 rounded-lg text-slate-100 text-sm outline-none transition duration-300 focus:border-[#00ffaa] focus:bg-white/[0.06]"
              />
              <label
                htmlFor="signup-name"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none transition-all duration-300 peer-focus:-top-2 peer-focus:left-2.5 peer-focus:text-[10px] peer-focus:text-[#00ffaa] peer-focus:bg-[#030708] peer-focus:px-1.5 peer-focus:rounded peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:left-2.5 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:text-[#00ffaa] peer-[:not(:placeholder-shown)]:bg-[#030708] peer-[:not(:placeholder-shown)]:px-1.5"
              >
                Full Name
              </label>
            </div>

            {/* Email Address */}
            <div className="relative mb-2.5 w-full group">
              <input
                type="email"
                id="signup-email"
                required
                placeholder=" "
                value={signUpEmail}
                onChange={(e) => setSignUpEmail(e.target.value)}
                className="peer w-full px-4 py-2.5 bg-white/[0.03] border border-white/10 rounded-lg text-slate-100 text-sm outline-none transition duration-300 focus:border-[#00ffaa] focus:bg-white/[0.06]"
              />
              <label
                htmlFor="signup-email"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none transition-all duration-300 peer-focus:-top-2 peer-focus:left-2.5 peer-focus:text-[10px] peer-focus:text-[#00ffaa] peer-focus:bg-[#030708] peer-focus:px-1.5 peer-focus:rounded peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:left-2.5 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:text-[#00ffaa] peer-[:not(:placeholder-shown)]:bg-[#030708] peer-[:not(:placeholder-shown)]:px-1.5"
              >
                Email Address
              </label>
            </div>

            {/* Password with Strength Meter */}
            <div className="relative mb-2 w-full group">
              <input
                type={showSignUpPass ? 'text' : 'password'}
                id="signup-pass"
                required
                placeholder=" "
                value={signUpPassword}
                onChange={(e) => handlePasswordChange(e.target.value)}
                className="peer w-full pl-4 pr-11 py-2.5 bg-white/[0.03] border border-white/10 rounded-lg text-slate-100 text-sm outline-none transition duration-300 focus:border-[#00ffaa] focus:bg-white/[0.06]"
              />
              <label
                htmlFor="signup-pass"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none transition-all duration-300 peer-focus:-top-2 peer-focus:left-2.5 peer-focus:text-[10px] peer-focus:text-[#00ffaa] peer-focus:bg-[#030708] peer-focus:px-1.5 peer-focus:rounded peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:left-2.5 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:text-[#00ffaa] peer-[:not(:placeholder-shown)]:bg-[#030708] peer-[:not(:placeholder-shown)]:px-1.5"
              >
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowSignUpPass(!showSignUpPass)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#00ffaa] transition-colors p-1 cursor-pointer"
              >
                {showSignUpPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Dynamic Password Strength Component */}
            <div className="w-full mb-2">
              <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mb-1">
                <div
                  className="h-full transition-all duration-300 rounded-full"
                  style={{
                    width: passwordStrength.width,
                    backgroundColor: passwordStrength.color,
                  }}
                />
              </div>
              <div
                className="text-[10px] font-medium transition-colors"
                style={{ color: passwordStrength.color }}
              >
                {passwordStrength.text}
              </div>
            </div>

            {/* Confirm Password */}
            <div className="relative mb-3.5 w-full group">
              <input
                type={showConfirmPass ? 'text' : 'password'}
                id="signup-confirm-pass"
                required
                placeholder=" "
                value={signUpConfirmPass}
                onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                className={`peer w-full pl-4 pr-11 py-2.5 bg-white/[0.03] border rounded-lg text-slate-100 text-sm outline-none transition duration-300 ${
                  passwordsMatch === null
                    ? 'border-white/10 focus:border-[#00ffaa]'
                    : passwordsMatch
                    ? 'border-[#00ffaa] focus:border-[#00ffaa]'
                    : 'border-[#ff0055] focus:border-[#ff0055]'
                }`}
              />
              <label
                htmlFor="signup-confirm-pass"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none transition-all duration-300 peer-focus:-top-2 peer-focus:left-2.5 peer-focus:text-[10px] peer-focus:text-[#00ffaa] peer-focus:bg-[#030708] peer-focus:px-1.5 peer-focus:rounded peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:left-2.5 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:text-[#00ffaa] peer-[:not(:placeholder-shown)]:bg-[#030708] peer-[:not(:placeholder-shown)]:px-1.5"
              >
                Confirm Password
              </label>
              <button
                type="button"
                onClick={() => setShowConfirmPass(!showConfirmPass)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#00ffaa] transition-colors p-1 cursor-pointer"
              >
                {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 sm:py-3 px-6 rounded-lg bg-gradient-to-r from-[#00ffaa] to-[#3b82f6] hover:from-[#00ffaa] hover:to-[#2563eb] text-[#01120b] font-bold text-xs uppercase tracking-wider transition-all duration-300 shadow-[0_4px_18px_rgba(0,255,170,0.25)] hover:shadow-[0_6px_24px_rgba(59,130,246,0.4)] hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? 'Creating Account...' : 'Sign Up'}
            </button>

            {/* Mobile direct toggle */}
            <div className="flex md:hidden justify-center items-center mt-2.5 pt-2 text-xs text-slate-400 border-t border-white/5">
              <span>Already registered?</span>
              <button
                type="button"
                onClick={() => {
                  setIsRightPanelActive(false);
                  setErrorMessage('');
                }}
                className="ml-1.5 text-[#00ffaa] font-bold hover:underline cursor-pointer"
              >
                Sign In
              </button>
            </div>
          </form>
        </div>

        {/* ======================================================== */}
        {/* SLIDING INTERFACE OVERLAY CONTAINER (Desktop Only) */}
        {/* ======================================================== */}
        <div
          className={`hidden md:block absolute top-0 left-1/2 w-1/2 h-full overflow-hidden transition-transform duration-700 ease-[cubic-bezier(0.76,0,0.24,1)] z-20 ${
            isRightPanelActive ? '-translate-x-full' : 'translate-x-0'
          }`}
        >
          <div
            className={`relative -left-full h-full w-[200%] transition-transform duration-700 ease-[cubic-bezier(0.76,0,0.24,1)] flex items-center ${
              isRightPanelActive ? 'translate-x-1/2' : 'translate-x-0'
            }`}
          >
            {/* Left Overlay Panel (Revealed during Sign Up mode on desktop) */}
            <div
              className={`relative flex flex-col items-center justify-center px-10 text-center top-0 h-full w-1/2 transition-transform duration-700 ease-[cubic-bezier(0.76,0,0.24,1)] bg-cover bg-center ${
                isRightPanelActive ? 'translate-x-0' : '-translate-x-[20%]'
              }`}
              style={{
                backgroundImage:
                  "linear-gradient(135deg, rgba(3, 11, 20, 0.92) 0%, rgba(1, 18, 14, 0.92) 100%), url('https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=800')",
              }}
            >
              <div className="p-3 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[#00ffaa] mb-4">
                <TrendingUp className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-extrabold text-white mb-2 tracking-wide font-sans">
                Have an Account?
              </h2>
              <p className="text-xs text-slate-300 mb-6 leading-relaxed max-w-[280px]">
                Sign back in on any browser or device to instantly sync your watchlists and macroeconomic setups.
              </p>
              <button
                type="button"
                onClick={() => {
                  setIsRightPanelActive(false);
                  setErrorMessage('');
                }}
                className="px-6 py-2.5 rounded-lg border border-white/30 hover:border-white text-white text-xs font-bold uppercase tracking-wider hover:bg-white/10 transition-all duration-300 cursor-pointer"
              >
                Sign In
              </button>
            </div>

            {/* Right Overlay Panel (Revealed during Sign In mode on desktop) */}
            <div
              className={`relative flex flex-col items-center justify-center px-10 text-center top-0 h-full w-1/2 transition-transform duration-700 ease-[cubic-bezier(0.76,0,0.24,1)] bg-cover bg-center ${
                isRightPanelActive ? 'translate-x-[20%]' : 'translate-x-0'
              }`}
              style={{
                backgroundImage:
                  "linear-gradient(135deg, rgba(3, 11, 20, 0.92) 0%, rgba(1, 18, 14, 0.92) 100%), url('https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&q=80&w=800')",
              }}
            >
              <div className="p-3 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[#00ffaa] mb-4">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-extrabold text-white mb-2 tracking-wide font-sans">
                New Here?
              </h2>
              <p className="text-xs text-slate-300 mb-6 leading-relaxed max-w-[280px]">
                Create your verified trading profile to store your risk formulas, watchlist pairs, and alert thresholds in Cloud Firestore.
              </p>
              <button
                type="button"
                onClick={() => {
                  setIsRightPanelActive(true);
                  setErrorMessage('');
                }}
                className="px-6 py-2.5 rounded-lg border border-white/30 hover:border-white text-white text-xs font-bold uppercase tracking-wider hover:bg-white/10 transition-all duration-300 cursor-pointer"
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Dialog */}
      {isForgotPasswordOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-[#0c1417] border border-white/15 rounded-2xl p-6 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => setIsForgotPasswordOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 mb-2 text-[#00ffaa]">
              <KeyRound className="w-5 h-5" />
              <h3 className="text-lg font-bold text-white">Reset Password</h3>
            </div>
            <p className="text-xs text-slate-300 mb-4">
              Enter your account's email address and we'll send you an official password reset link.
            </p>

            {forgotStatus && (
              <div
                className={`mb-4 p-3 rounded-lg text-xs flex items-start gap-2 ${
                  forgotStatus.type === 'success'
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                }`}
              >
                {forgotStatus.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <span>{forgotStatus.text}</span>
              </div>
            )}

            <form onSubmit={handleSendResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="your.name@example.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white/[0.04] border border-white/15 rounded-lg text-white text-sm outline-none focus:border-[#00ffaa]"
                />
              </div>

              <div className="flex gap-2.5 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsForgotPasswordOpen(false)}
                  className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="px-5 py-2 rounded-lg bg-[#00ffaa] hover:bg-[#00cc88] text-[#01120b] text-xs font-bold uppercase tracking-wider transition cursor-pointer disabled:opacity-50"
                >
                  {forgotLoading ? 'Sending Link...' : 'Send Reset Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
