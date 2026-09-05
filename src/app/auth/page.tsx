'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Mail, Lock, User, ArrowRight, Sparkles, UserCheck,
  Phone, Eye, EyeOff, ShieldCheck, BookOpen, Star,
  ChevronRight, BadgeCheck,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

/* ── Input field ────────────────────────────────────────────────── */
function Field({
  icon: Icon, type = 'text', placeholder, value, onChange,
  maxLength, required = true, rightSlot, onBlur,
}: {
  icon: React.ElementType; type?: string; placeholder: string;
  value: string; onChange: (v: string) => void;
  maxLength?: number; required?: boolean;
  rightSlot?: React.ReactNode; onBlur?: () => void;
}) {
  return (
    <div className="relative group">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors z-10 pointer-events-none">
        <Icon className="w-4.5 h-4.5" />
      </div>
      <input
        type={type} placeholder={placeholder} required={required}
        value={value} maxLength={maxLength}
        onChange={e => onChange(e.target.value)}
        onBlur={onBlur}
        className="w-full pl-11 pr-11 py-3.5 rounded-2xl text-sm font-medium text-gray-900 placeholder-gray-300 outline-none
          bg-gray-50 border border-gray-100
          focus:bg-white focus:border-orange-300 focus:ring-4 focus:ring-orange-50
          hover:border-gray-200 transition-all duration-200"
      />
      {rightSlot && (
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 z-10">{rightSlot}</div>
      )}
    </div>
  );
}

/* ── Password field with show/hide ──────────────────────────────── */
function PasswordField({
  placeholder, value, onChange,
}: { placeholder: string; value: string; onChange: (v: string) => void }) {
  const [show, setShow] = useState(false);
  return (
    <Field
      icon={Lock} type={show ? 'text' : 'password'}
      placeholder={placeholder} value={value} onChange={onChange}
      rightSlot={
        <button type="button" onClick={() => setShow(s => !s)}
          className="p-1 text-gray-400 hover:text-orange-500 transition-colors">
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      }
    />
  );
}

/* ════════════════════════════════════════════════════════════════ */
export default function Auth() {
  const [isLogin,          setIsLogin]          = useState(true);
  const [email,            setEmail]            = useState('');
  const [password,         setPassword]         = useState('');
  const [confirmPassword,  setConfirmPassword]  = useState('');
  const [name,             setName]             = useState('');
  const [phone,            setPhone]            = useState('');
  const [error,            setError]            = useState('');
  const [loading,          setLoading]          = useState(false);
  const [nameError,        setNameError]        = useState('');
  const [phoneError,      setPhoneError]      = useState('');
  const router = useRouter();
  const { login, register } = useAuth();

  const run = async (fn: () => Promise<void>) => {
    setLoading(true); setError('');
    try { await fn(); } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };

  const toProperCase = (str: string) => {
    return str.toLowerCase().replace(/(?:^|\s)\w/g, c => c.toUpperCase());
  };

  const handleNameBlur = () => {
    if (!isLogin && name.trim().length > 0 && name.trim().length < 3) setNameError('Name must be at least 3 characters');
    else setNameError('');
  };

  const handlePhoneBlur = () => {
    if (!isLogin && phone.length > 0 && !/^\d{11}$/.test(phone)) setPhoneError('Phone must be exactly 11 digits');
    else setPhoneError('');
  };

  const handleTestLogin  = () => run(async () => { await login('john@example.com', 'password123'); router.push('/'); });
  const handleStaffLogin = () => run(async () => { await login('admin@luminabooks.com', 'staff123'); router.push('/staff'); });
  const handleAdminLogin = () => run(async () => { await login('admin@luminabooks.com', 'admin123'); router.push('/staff'); });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    run(async () => {
      if (isLogin) {
        await login(email, password);
      } else {
        if (name.trim().length < 3) throw new Error('Name must be at least 3 characters');
        if (!/^\d{11}$/.test(phone)) throw new Error('Phone must be exactly 11 digits');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Please enter a valid email address');
        if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/.test(password))
          throw new Error('Password must be at least 8 characters with a letter and a number');
        if (password !== confirmPassword) throw new Error('Passwords do not match');
        await register({ name, phone, email, password, password_confirmation: confirmPassword });
      }
      router.push('/');
    });
  };

  return (
    <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">

        {/* ══════════════════════════════════════════════
            LEFT — Main auth card
        ══════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, ease: [0.22,1,0.36,1] }}
          className="lg:col-span-3 bg-white rounded-3xl border border-gray-100 shadow-2xl shadow-gray-100/80 overflow-hidden">

          {/* Top accent */}
          <div className="h-1.5 bg-gradient-to-r from-orange-600 to-amber-400" />

          <div className="p-8 sm:p-10">

            {/* Header */}
            <div className="text-center mb-9">
              <div className="relative inline-block mb-5">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-amber-50 border border-orange-100 rounded-2xl flex items-center justify-center shadow-sm">
                  <Sparkles className="w-7 h-7 text-orange-500" />
                </div>
                {/* dot */}
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full border-2 border-white shadow" />
              </div>

              <h1 className="font-serif text-4xl font-bold text-gray-900 tracking-tight mb-2">
                {isLogin ? 'Welcome back' : 'Create account'}
              </h1>
              <p className="text-gray-400 text-sm leading-relaxed">
                {isLogin
                  ? 'Sign in to access your library, orders and reviews.'
                  : 'Join thousands of readers in our community.'}
              </p>
            </div>

            {/* Tab switcher */}
            <div className="flex bg-gray-50 border border-gray-100 rounded-2xl p-1 mb-8">
              {['Sign In', 'Sign Up'].map((label, i) => {
                const active = (i === 0) === isLogin;
                return (
                  <button key={label} onClick={() => setIsLogin(i === 0)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                      active
                        ? 'bg-white text-gray-900 shadow-md shadow-gray-100'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}>
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="mb-6 flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl text-sm text-red-600">
                  <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[10px] font-black">!</span>
                  </div>
                  <span className="leading-relaxed">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <AnimatePresence mode="popLayout">
                {!isLogin && (
                  <motion.div key="reg-fields"
                    initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.3 }} className="space-y-3.5">
                    <div className="space-y-4">
                      <Field icon={User} placeholder="Full Name" value={name}
                        onChange={v => setName(toProperCase(v.slice(0, 100)))} maxLength={100} onBlur={handleNameBlur} />
                      {nameError && <p className="text-[10px] font-medium text-red-500 -mt-3">{nameError}</p>}
                    </div>
                    <div className="space-y-4">
                      <Field icon={Phone} type="tel" placeholder="Phone Number (01XXXXXXXXX)" value={phone}
                        onChange={v => setPhone(v.replace(/\D/g,'').slice(0,11))} maxLength={11} onBlur={handlePhoneBlur} />
                      {phoneError && <p className="text-[10px] font-medium text-red-500 -mt-3">{phoneError}</p>}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <Field icon={Mail} type="email" placeholder="Email Address" value={email} onChange={setEmail} />
              <PasswordField placeholder="Password (min 8 chars, letter + number)" value={password} onChange={setPassword} />

              <AnimatePresence mode="popLayout">
                {!isLogin && (
                  <motion.div key="confirm"
                    initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.3 }}>
                    <PasswordField placeholder="Confirm Password" value={confirmPassword} onChange={setConfirmPassword} />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <button type="submit" disabled={loading}
                className="w-full group flex items-center justify-center gap-2.5 py-4 mt-2 rounded-2xl font-bold text-sm
                  bg-gradient-to-r from-orange-600 to-amber-500 text-white
                  hover:from-orange-500 hover:to-amber-400 hover:-translate-y-0.5
                  shadow-xl shadow-orange-200 hover:shadow-orange-300
                  transition-all duration-200 active:translate-y-0
                  disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0">
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Processing…</>
                ) : (
                  <>{isLogin ? 'Sign In' : 'Create Account'} <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" /></>
                )}
              </button>
            </form>

            {/* Trust badges */}
            <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-center gap-5">
              {[
                { icon: ShieldCheck, label: 'Secure Login' },
                { icon: BadgeCheck,  label: 'Verified' },
                { icon: BookOpen,    label: 'Full Access' },
              ].map(b => (
                <div key={b.label} className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  <b.icon className="w-3.5 h-3.5 text-emerald-500" /> {b.label}
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ══════════════════════════════════════════════
            RIGHT — Quick access cards
        ══════════════════════════════════════════════ */}
        <div className="lg:col-span-2 flex flex-col gap-5">

          {/* Customer card */}
          <motion.div
            initial={{ opacity: 0, x: 24, y: 8 }} animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ delay: 0.15, duration: 0.55, ease: [0.22,1,0.36,1] }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-600 via-orange-500 to-amber-400
              text-white shadow-2xl shadow-orange-200/60">

            {/* Decorative blobs */}
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/8 blur-2xl pointer-events-none" />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-amber-300/10 blur-2xl pointer-events-none" />
            {/* Grid */}
            <div className="absolute inset-0 opacity-[0.05]"
              style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '28px 28px' }} />

            <div className="relative z-10 p-8 flex flex-col items-center text-center gap-5">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm border border-white/25 rounded-2xl flex items-center justify-center shadow-inner">
                <UserCheck className="w-7 h-7" />
              </div>

              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 border border-white/20 rounded-full text-[10px] font-bold uppercase tracking-widest mb-3">
                  <Star className="w-2.5 h-2.5 fill-white" /> Test Account
                </div>
                <h3 className="font-serif text-2xl font-bold mb-2">Test Customer</h3>
                <p className="text-orange-100/85 text-sm leading-relaxed">
                  Instantly explore all features — browse books, manage cart, and track orders.
                </p>
              </div>

              <button onClick={handleTestLogin} disabled={loading}
                className="w-full group flex items-center justify-center gap-2.5 py-3.5 bg-white text-orange-600 rounded-2xl font-bold text-sm
                  hover:bg-orange-50 transition-all shadow-lg shadow-orange-700/15 hover:-translate-y-0.5
                  disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0">
                {loading ? 'Logging in…' : 'Login as Customer'}
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-orange-200/70">
                For Testing Purposes Only
              </p>
            </div>
          </motion.div>

          {/* Admin card */}
          <motion.div
            initial={{ opacity: 0, x: 24, y: 8 }} animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ delay: 0.2, duration: 0.55, ease: [0.22,1,0.36,1] }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-500
              text-white shadow-2xl shadow-emerald-200/60">

            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/8 blur-2xl pointer-events-none" />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-teal-300/10 blur-2xl pointer-events-none" />
            <div className="absolute inset-0 opacity-[0.05]"
              style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '28px 28px' }} />

            <div className="relative z-10 p-8 flex flex-col items-center text-center gap-5">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm border border-white/25 rounded-2xl flex items-center justify-center shadow-inner">
                <ShieldCheck className="w-7 h-7" />
              </div>

              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 border border-white/20 rounded-full text-[10px] font-bold uppercase tracking-widest mb-3">
                  <Star className="w-2.5 h-2.5 fill-white" /> Admin Panel
                </div>
                <h3 className="font-serif text-2xl font-bold mb-2">Administrator</h3>
                <p className="text-emerald-100/85 text-sm leading-relaxed">
                  Full access to manage books, inventory, orders, users, and platform settings.
                </p>
              </div>

              <button onClick={handleAdminLogin} disabled={loading}
                className="w-full group flex items-center justify-center gap-2.5 py-3.5 bg-white text-emerald-700 rounded-2xl font-bold text-sm
                  hover:bg-emerald-50 transition-all shadow-lg shadow-emerald-700/15 hover:-translate-y-0.5
                  disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0">
                {loading ? 'Logging in…' : 'Login as Admin'}
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-emerald-200/70">
                Full Administrative Access
              </p>
            </div>
          </motion.div>

          {/* Staff card */}
          <motion.div
            initial={{ opacity: 0, x: 24, y: 8 }} animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ delay: 0.25, duration: 0.55, ease: [0.22,1,0.36,1] }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800
              text-white shadow-2xl shadow-gray-900/20">

            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/3 blur-2xl pointer-events-none" />
            <div className="absolute inset-0 opacity-[0.04]"
              style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '28px 28px' }} />

            <div className="relative z-10 p-8 flex flex-col items-center text-center gap-5">
              <div className="w-14 h-14 bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl flex items-center justify-center">
                <User className="w-7 h-7 text-gray-300" />
              </div>

              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/8 border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
                  <ShieldCheck className="w-2.5 h-2.5 text-orange-400" /> Restricted Access
                </div>
                <h3 className="font-serif text-2xl font-bold mb-2">Staff Portal</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Access the admin dashboard — manage books, inventory, orders and analytics.
                </p>
              </div>

              <button onClick={handleStaffLogin} disabled={loading}
                className="w-full group flex items-center justify-center gap-2.5 py-3.5 bg-white text-gray-900 rounded-2xl font-bold text-sm
                  hover:bg-gray-100 transition-all shadow-lg shadow-black/20 hover:-translate-y-0.5
                  disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0">
                {loading ? 'Logging in…' : 'Login as Staff'}
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-gray-600">
                Authorized Staff Only
              </p>
            </div>
          </motion.div>

          {/* Bottom micro note */}
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="text-center text-[11px] text-gray-400 leading-relaxed px-2">
            By continuing you agree to our{' '}
            <span className="text-orange-600 font-semibold cursor-pointer hover:underline">Terms of Service</span>
            {' & '}
            <span className="text-orange-600 font-semibold cursor-pointer hover:underline">Privacy Policy</span>
          </motion.p>
        </div>

      </div>
    </div>
  );
}