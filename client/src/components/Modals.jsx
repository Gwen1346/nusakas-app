// src/components/Modals.jsx
import React from 'react';
import { AlertTriangle } from 'lucide-react';

export function Modals({ kasir }) {
  if (!kasir.deleteModalConfig.isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-xl text-center">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
          <AlertTriangle size={24} />
        </div>
        <div>
          <h3 className="font-bold text-base text-slate-900">Hapus Transaksi?</h3>
          <p className="text-xs text-slate-400 mt-1">
            Transaksi <span className="font-semibold text-slate-700">"{kasir.deleteModalConfig.name}"</span> akan dihapus permanen.
          </p>
        </div>
        <div className="flex gap-2 pt-2">
          <button 
            onClick={() => kasir.setDeleteModalConfig({ isOpen: false, id: null, name: '' })}
            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
          >
            Batal
          </button>
          <button 
            onClick={kasir.confirmDelete}
            className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl text-xs transition shadow-md"
          >
            Ya, Hapus
          </button>
        </div>
      </div>
    </div>
  );
}