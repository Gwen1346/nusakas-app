// src/components/LogoutModal.jsx
import React from 'react';
import { AlertTriangle } from 'lucide-react';

export function LogoutModal({ isOpen, onClose, onConfirm }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-xl border border-slate-100 text-center relative">
        
        {/* Icon Peringatan */}
        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-100">
          <AlertTriangle size={24} />
        </div>

        {/* Teks Pesan */}
        <h3 className="text-base font-black text-slate-900 mb-1">Keluar dari Aplikasi?</h3>
        <p className="text-xs text-slate-500 font-medium leading-relaxed mb-6">
          Kamu yakin ingin keluar dari sesi NusaKas ini? Pastikan data sudah tersimpan.
        </p>

        {/* Tombol Aksi */}
        <div className="flex items-center gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-2xl transition active:scale-95 cursor-pointer"
          >
            Batal
          </button>
          <button 
            onClick={onConfirm}
            className="flex-1 py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-2xl transition shadow-sm active:scale-95 cursor-pointer"
          >
            Ya, Keluar
          </button>
        </div>

      </div>
    </div>
  );
}