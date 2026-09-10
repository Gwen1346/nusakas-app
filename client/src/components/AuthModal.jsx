import React, { useState } from 'react';
import axios from 'axios';
import { Mail, Lock, Store, Eye, EyeOff, Loader2, ArrowRight, TrendingUp, Wallet, Receipt, X } from 'lucide-react';
import logoPutih from '../assets/logoputih.png';

export default function AuthModal({ onLoginSuccess, onClose }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isLogin
      ? 'http://localhost:5000/api/v1/auth/login'
      : 'http://localhost:5000/api/v1/auth/register';

    try {
      const payload = isLogin ? { email, password } : { name, email, password };
      const response = await axios.post(endpoint, payload);

      if (isLogin) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        onLoginSuccess(response.data.user);
      } else {
        alert('Registrasi berhasil! Silakan login.');
        setIsLogin(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Terjadi kesalahan pada server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-50 flex flex-col md:flex-row overflow-y-auto z-50">
      <style>{`
        @keyframes authFadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes authDrawLine {
          from { stroke-dashoffset: 480; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes authDotPop {
          from { opacity: 0; transform: scale(0); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes authFloat {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(0, -10px); }
        }
        .auth-fade-up { animation: authFadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .auth-draw-line {
          stroke-dasharray: 480;
          animation: authDrawLine 1.6s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both;
        }
        .auth-dot {
          opacity: 0;
          animation: authDotPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
        .auth-orb { animation: authFloat 7s ease-in-out infinite; }
        .auth-extra-field {
          display: grid;
          grid-template-rows: 0fr;
          opacity: 0;
          transition: grid-template-rows 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease, margin 0.35s ease;
          margin-bottom: 0;
        }
        .auth-extra-field.is-open {
          grid-template-rows: 1fr;
          opacity: 1;
          margin-bottom: 1rem;
        }
        .auth-extra-field > div { overflow: hidden; min-height: 0; }
        @media (prefers-reduced-motion: reduce) {
          .auth-fade-up, .auth-draw-line, .auth-dot, .auth-orb { animation: none !important; }
        }
      `}</style>

      {/* ================= PANEL KIRI: BRAND ================= */}
      <div className="relative shrink-0 md:w-[44%] md:h-full bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-900 text-white overflow-hidden">
        <svg
          className="absolute -right-16 -bottom-10 w-[420px] h-[420px] opacity-[0.16] pointer-events-none"
          viewBox="0 0 400 400"
          fill="none"
        >
          <path
            className="auth-draw-line"
            d="M10 320 L80 260 L140 300 L210 180 L270 220 L340 90"
            stroke="white"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle className="auth-dot" style={{ animationDelay: '1.1s' }} cx="80" cy="260" r="7" fill="white" />
          <circle className="auth-dot" style={{ animationDelay: '1.3s' }} cx="210" cy="180" r="7" fill="white" />
          <circle className="auth-dot" style={{ animationDelay: '1.5s' }} cx="340" cy="90" r="10" fill="white" />
        </svg>
        <div className="auth-orb absolute right-8 top-10 w-40 h-40 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col justify-between h-full p-8 sm:p-10 md:p-12 py-10 md:py-12">
          <div className="auth-fade-up flex items-center gap-3" style={{ animationDelay: '0.05s' }}>
            <div className="w-12 h-12 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center">
              <img src={logoPutih} alt="NusaKas Logo" className="w-16 h-16 max-w-none object-cover transform -translate-y-0.5" />
            </div>
            <div className="flex flex-col justify-center">
              <div className="font-extrabold text-base leading-tight tracking-tight">
                Nusa<span className="text-emerald-300">Kas</span>
              </div>
              <span className="text-[9px] text-emerald-200/70 font-semibold tracking-wider uppercase">
                POS & Fintech
              </span>
            </div>
          </div>

          <div className="max-w-sm">
            <h1 className="auth-fade-up text-3xl sm:text-4xl font-black tracking-tight leading-[1.1] mb-4" style={{ animationDelay: '0.15s' }}>
              Catat tiap rupiah, tumbuhkan usahamu.
            </h1>
            <p className="auth-fade-up text-sm text-emerald-100/80 leading-relaxed" style={{ animationDelay: '0.25s' }}>
              Satu tempat untuk transaksi harian, laporan kas, dan asisten AI yang bantu kamu baca angka toko sendiri.
            </p>
          </div>

          <div className="auth-fade-up hidden md:flex items-center gap-5 text-emerald-100/70" style={{ animationDelay: '0.35s' }}>
            <div className="flex items-center gap-2 text-xs font-semibold">
              <Wallet size={15} className="text-emerald-300" /> Kas real-time
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold">
              <Receipt size={15} className="text-emerald-300" /> Riwayat rapi
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold">
              <TrendingUp size={15} className="text-emerald-300" /> Insight AI
            </div>
          </div>
        </div>
      </div>

      {/* ================= PANEL KANAN: FORM ================= */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 relative">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-6 right-6 p-2.5 rounded-2xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition flex items-center justify-center cursor-pointer"
            title="Kembali"
          >
            <X size={20} />
          </button>
        )}

        <div className="auth-fade-up w-full max-w-sm" style={{ animationDelay: '0.2s' }}>
          <div className="relative flex items-center p-1 bg-slate-100 rounded-2xl mb-8 w-56">
            <div
              className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-xl shadow-xs transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{ transform: isLogin ? 'translateX(4px)' : 'translateX(calc(100% + 4px))' }}
            />
            <button
              type="button"
              onClick={() => { setIsLogin(true); setError(''); }}
              className={`relative z-10 flex-1 py-2 rounded-xl text-xs font-bold transition-colors duration-300 ${
                isLogin ? 'text-emerald-700' : 'text-slate-400'
              }`}
            >
              Masuk
            </button>
            <button
              type="button"
              onClick={() => { setIsLogin(false); setError(''); }}
              className={`relative z-10 flex-1 py-2 rounded-xl text-xs font-bold transition-colors duration-300 ${
                !isLogin ? 'text-emerald-700' : 'text-slate-400'
              }`}
            >
              Daftar
            </button>
          </div>

          <h2 className="text-2xl font-black text-slate-900 mb-1.5 tracking-tight transition-all duration-300">
            {isLogin ? 'Selamat datang kembali' : 'Buat akun toko baru'}
          </h2>
          <p className="text-xs text-slate-400 font-medium mb-7">
            {isLogin
              ? 'Masuk untuk lanjut kelola kas dan transaksi tokomu.'
              : 'Data keuanganmu terpisah aman dari toko lain.'}
          </p>

          {error && (
            <div className="auth-fade-up bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-2xl text-xs font-semibold mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className={`auth-extra-field ${!isLogin ? 'is-open' : ''}`}>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5">
                  Nama Toko / Usaha
                </label>
                <div className="relative">
                  <Store size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required={!isLogin}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200/60 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                    placeholder="Contoh: Kopi Senayan"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200/60 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                  placeholder="nama@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200/60 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-2xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-xs active:scale-[0.98] cursor-pointer mt-2"
            >
              {loading ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <>
                  {isLogin ? 'Masuk' : 'Daftar Sekarang'}
                  <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          <p className="mt-7 text-center text-[11px] text-slate-400 font-medium">
            {isLogin ? 'Belum punya akun? ' : 'Sudah punya akun? '}
            <button
              type="button"
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="text-emerald-700 font-bold hover:underline"
            >
              {isLogin ? 'Daftar di sini' : 'Masuk di sini'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}