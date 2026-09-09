// src/components/Sidebar.jsx
import React from 'react';
import { LayoutDashboard, Receipt, Bot, Sparkles, LogOut, X } from 'lucide-react';

export function Sidebar({ activeTab, setActiveTab, setIsMobileSidebarOpen }) {
  const logoSvg = (
    <svg viewBox="0 0 400 400" className="w-9 h-9 shrink-0" fill="none">
      <defs>
        <linearGradient id="nusaBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
        <linearGradient id="receiptFold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E6F4EA" />
          <stop offset="100%" stopColor="#A7F3D0" />
        </linearGradient>
      </defs>

      {/* Kotak Latar Belakang Lengkung */}
      <rect x="40" y="40" width="320" height="320" rx="80" fill="url(#nusaBg)" />

      {/* Grup Ikon N & Struk */}
      <g transform="translate(110, 110)">
        {/* Kaki Kiri Huruf N */}
        <rect x="0" y="0" width="45" height="180" rx="22.5" fill="#FFFFFF" />

        {/* Diagonal Huruf N */}
        <path d="M 22.5 0 L 157.5 157.5 C 168 168 158 180 142 180 L 110 180 Z" fill="#FFFFFF" />

        {/* Kaki Kanan (Badan Struk) */}
        <rect x="125" y="45" width="45" height="135" rx="22.5" fill="#FFFFFF" />

        {/* Lipatan Atas Kertas Struk */}
        <path d="M 125 45 C 125 15, 175 15, 175 45 L 175 110 C 175 125, 125 110, 125 90 Z" fill="url(#receiptFold)" />

        {/* Garis-garis Text pada Struk */}
        <line x1="138" y1="42" x2="160" y2="42" stroke="#047857" strokeWidth="5" strokeLinecap="round" />
        <line x1="138" y1="56" x2="160" y2="56" stroke="#047857" strokeWidth="5" strokeLinecap="round" />
        <line x1="138" y1="70" x2="152" y2="70" stroke="#047857" strokeWidth="5" strokeLinecap="round" />
      </g>
    </svg>
  );

  return (
    <div className="flex flex-col justify-between h-full p-5 w-64 bg-white">
      <div>
        <div className="flex items-center justify-between px-1 mb-8">
          <div className="flex items-center gap-3">
            {logoSvg}
            <div className="flex flex-col justify-center">
              <div className="font-extrabold text-base leading-tight tracking-tight">
                <span className="text-[#064E3B]">Nusa</span><span className="text-[#10B981]">Kas</span>
              </div>
              <span className="text-[9px] text-slate-400 font-semibold tracking-wider uppercase">POS & Fintech</span>
            </div>
          </div>
          {setIsMobileSidebarOpen && (
            <button onClick={() => setIsMobileSidebarOpen(false)} className="md:hidden p-1.5 text-slate-400 rounded-lg"><X size={20} /></button>
          )}
        </div>
        <nav className="space-y-1">
          <button onClick={() => { setActiveTab('dashboard'); if(setIsMobileSidebarOpen) setIsMobileSidebarOpen(false); }} className={`flex items-center gap-3 w-full px-4 py-3 font-semibold rounded-xl text-sm transition ${activeTab === 'dashboard' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-500 hover:bg-slate-50'}`}><LayoutDashboard size={18} /> Dashboard</button>
          <button onClick={() => { setActiveTab('report'); if(setIsMobileSidebarOpen) setIsMobileSidebarOpen(false); }} className={`flex items-center gap-3 w-full px-4 py-3 font-semibold rounded-xl text-sm transition ${activeTab === 'report' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-500 hover:bg-slate-50'}`}><Receipt size={18} /> Laporan Kas</button>
          <button onClick={() => { setActiveTab('ai'); if(setIsMobileSidebarOpen) setIsMobileSidebarOpen(false); }} className={`flex items-center gap-3 w-full px-4 py-3 font-semibold rounded-xl text-sm transition ${activeTab === 'ai' ? 'bg-emerald-50 text-emerald-600 font-bold' : 'text-slate-500 hover:bg-slate-50'}`}><Bot size={18} className="text-emerald-600" /> Tanya Nusa <Sparkles size={14} className="text-amber-400" /></button>
        </nav>
      </div>
      <button onClick={() => { if (window.confirm('Keluar?')) window.location.reload(); }} className="flex items-center gap-3 w-full px-4 py-3 text-rose-500 hover:bg-rose-50 font-semibold rounded-xl text-sm transition mt-auto"><LogOut size={18} /> Keluar</button>
    </div>
  );
}