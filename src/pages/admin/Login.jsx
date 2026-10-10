import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, User, Eye, EyeOff, AlertCircle, ArrowRight, ShieldCheck, Clock } from 'lucide-react';
import { api } from '../../lib/api';
import { SITE_CONFIG } from '../../lib/env';
import Blobs from '../../components/Blobs';
import Button from '../../components/Button';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const isExpired = searchParams.get('expired') === '1';

  // If already logged in, redirect immediately to dashboard overview
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await api.get('/api/admin/me');
        if (res?.success) {
          navigate('/admin/overview', { replace: true });
        }
      } catch (err) {
        // Not logged in, stay on login page
      } finally {
        setCheckingAuth(false);
      }
    }
    checkAuth();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!username.trim() || !password) {
      setErrorMessage('Please enter both username and password.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/api/admin/login', {
        username: username.trim(),
        password
      });

      if (res?.success) {
        navigate('/admin/overview', { replace: true });
      } else {
        setErrorMessage(res?.message || 'Invalid username or password');
      }
    } catch (err) {
      setErrorMessage(err?.message || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
        <div className="w-8 h-8 rounded-full border-2 border-[#FF5E00] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-6 bg-[#FAFAFA]">
      <Blobs />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 shadow-2xl border border-[#EDEDED] z-10"
      >
        {/* Top Brand Logo */}
        <div className="text-center mb-8">
          <img
            src={SITE_CONFIG.logoPath}
            alt={SITE_CONFIG.brand}
            width={48}
            height={48}
            className="inline-flex w-12 h-12 rounded-2xl object-contain mb-3"
          />
          <h1 className="text-2xl font-extrabold text-[#111111] tracking-tight">
            {SITE_CONFIG.brand} Admin
          </h1>
          <p className="text-xs text-[#6B6B6B] mt-1">
            Sign in to access analytics, visitor telemetry, and lead management.
          </p>
        </div>

        {/* Session Expired Notice */}
        {isExpired && !errorMessage && (
          <div className="mb-5 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium flex items-center gap-2.5">
            <Clock className="w-4 h-4 shrink-0 text-amber-600" />
            <span>Your previous session has expired. Please log in again to continue.</span>
          </div>
        )}

        {/* Animated Error Alert */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -6 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -6 }}
              className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2.5 overflow-hidden"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{errorMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div>
            <label
              htmlFor="username"
              className="block text-xs font-bold uppercase tracking-wider text-[#111111] mb-1.5"
            >
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#71717A]">
                <User className="w-4 h-4" />
              </div>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter admin username"
                className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-[#EDEDED] bg-white text-[#111111] placeholder:text-[#71717A] focus:border-[#FF5E00] focus:ring-2 focus:ring-[#FF5E00]/20 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-xs font-bold uppercase tracking-wider text-[#111111] mb-1.5"
            >
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#71717A]">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-[#EDEDED] bg-white text-[#111111] placeholder:text-[#71717A] focus:border-[#FF5E00] focus:ring-2 focus:ring-[#FF5E00]/20 focus:outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#71717A] hover:text-[#111111] focus:outline-none"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              icon={ArrowRight}
              className="w-full justify-center"
            >
              Sign In to Dashboard
            </Button>
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-[#EDEDED] text-center">
          <div className="inline-flex items-center gap-1.5 text-xs text-[#71717A]">
            <ShieldCheck className="w-4 h-4 text-[#7C3AED]" />
            <span>Protected with rate limiting and httpOnly cookies</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
