// src/components/Sidebar.jsx
import React from 'react';
import { LayoutDashboard, Receipt, Bot, Sparkles, LogOut, X } from 'lucide-react';
import logoNusa from '../assets/logoNusa.png';

export function Sidebar({ activeTab, setActiveTab, setIsMobileSidebarOpen, onOpenLogoutModal }) {
  return (
    <div className="flex flex-col justify-between h-full p-5 w-64 bg-white shadow-sm border-r border-slate-100">
      <div>
        {/* Header Logo & Close Button (Mobile) */}
        <div className="flex items-center justify-between px-1 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl overflow-hidden shrink-0 shadow-sm bg-emerald-600 flex items-center justify-center">
              <img 
                src={logoNusa} 
                alt="NusaKas Logo" 
                className="w-14 h-14 max-w-none object-cover transform -translate-y-0.5" 
              />
            </div>
            <div className="flex flex-col justify-center">
              <div className="font-extrabold text-base leading-tight tracking-tight">
                <span className="text-[#064E3B]">Nusa</span><span className="text-[#10B981]">Kas</span>
              </div>
              <span className="text-[9px] text-slate-400 font-semibold tracking-wider uppercase">POS & Fintech</span>
            </div>
          </div>
          {setIsMobileSidebarOpen && (
            <button 
              onClick={() => setIsMobileSidebarOpen(false)} 
              className="md:hidden p-1.5 text-slate-400 rounded-lg hover:bg-slate-100 transition"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Menu Navigasi */}
        <nav className="space-y-1.5">
          <button 
            onClick={() => { 
              setActiveTab('dashboard'); 
              if(setIsMobileSidebarOpen) setIsMobileSidebarOpen(false); 
            }} 
            className={`flex items-center gap-3 w-full px-4 py-3 font-semibold rounded-xl text-sm transition ${
              activeTab === 'dashboard' 
                ? 'bg-emerald-50 text-emerald-600 shadow-xs' 
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <LayoutDashboard size={18} /> Dashboard
          </button>

          <button 
            onClick={() => { 
              setActiveTab('report'); 
              if(setIsMobileSidebarOpen) setIsMobileSidebarOpen(false); 
            }} 
            className={`flex items-center gap-3 w-full px-4 py-3 font-semibold rounded-xl text-sm transition ${
              activeTab === 'report' 
                ? 'bg-emerald-50 text-emerald-600 shadow-xs' 
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Receipt size={18} /> Laporan Kas
          </button>

          <button 
            onClick={() => { 
              setActiveTab('ai'); 
              if(setIsMobileSidebarOpen) setIsMobileSidebarOpen(false); 
            }} 
            className={`flex items-center gap-3 w-full px-4 py-3 font-semibold rounded-xl text-sm transition ${
              activeTab === 'ai' 
                ? 'bg-emerald-50 text-emerald-600 font-bold shadow-xs' 
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Bot size={18} className="text-emerald-600" /> Tanya Nusa <Sparkles size={14} className="text-amber-400" />
          </button>
        </nav>
      </div>

      {/* Tombol Keluar di Bawah */}
      <button 
        onClick={onOpenLogoutModal} 
        className="flex items-center gap-3 w-full px-4 py-3 text-rose-500 hover:bg-rose-50 font-semibold rounded-xl text-sm transition mt-auto cursor-pointer"
      >
        <LogOut size={18} /> Keluar
      </button>
    </div>
  );
}