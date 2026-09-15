// src/components/CashierManagementTab.jsx
import React, { useState } from 'react';
import { Users, Plus, Trash2, UserCheck, Loader2 } from 'lucide-react';

export function CashierManagementTab({ kasir }) {
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const handleAdd = async (e) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;
    setAdding(true);
    await kasir.addCashier(trimmed);
    setNewName('');
    setAdding(false);
  };

  const txCountByCashier = (name) => kasir.transactions.filter(t => t.cashier === name).length;
  const untaggedCount = kasir.transactions.filter(t => !t.cashier).length;

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-12">
      {/* Header Halaman */}
      <div className="bg-gradient-to-r from-emerald-900 to-emerald-800 text-white p-5 rounded-3xl shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 bg-emerald-700/50 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">Manajemen Kasir</h1>
          <p className="text-xs text-emerald-100/80">Kelola daftar kasir yang bertugas mencatat transaksi.</p>
        </div>
      </div>

      {untaggedCount > 0 && (
        <div className="bg-amber-50 border border-amber-100 text-amber-700 text-xs font-semibold px-4 py-3 rounded-2xl">
          Ada {untaggedCount} transaksi lama yang belum tercatat nama kasirnya (dari sebelum fitur ini aktif, atau saat belum pilih kasir bertugas).
        </div>
      )}

      {/* Form Tambah Kasir */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-100 shadow-xs">
        <h3 className="font-bold text-xs sm:text-sm text-slate-800 mb-4">Tambah Kasir Baru</h3>
        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Nama kasir, contoh: Budi"
            className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
          <button
            type="submit"
            disabled={adding || !newName.trim()}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition shrink-0"
          >
            {adding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Tambah
          </button>
        </form>
      </div>

      {/* Daftar Kasir */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-100 shadow-xs">
        <h3 className="font-bold text-xs sm:text-sm text-slate-800 mb-4">Daftar Kasir ({kasir.cashiers.length})</h3>

        {kasir.isLoadingCashiers ? (
          <div className="py-8 flex justify-center">
            <Loader2 size={20} className="animate-spin text-emerald-500" />
          </div>
        ) : kasir.cashiers.length === 0 ? (
          <div className="py-10 flex flex-col items-center justify-center text-center gap-2">
            <div className="w-11 h-11 rounded-2xl bg-slate-50 text-slate-300 flex items-center justify-center">
              <Users size={20} />
            </div>
            <p className="text-xs font-bold text-slate-500">Belum ada kasir terdaftar</p>
            <p className="text-[11px] text-slate-400 max-w-xs">
              Tambah nama kasir di atas supaya bisa dipilih sebagai "Kasir Bertugas" saat mencatat transaksi.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {kasir.cashiers.map(c => (
              <div key={c.id} className="flex items-center justify-between gap-3 p-3.5 bg-slate-50/80 border border-slate-100 rounded-2xl">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-slate-800 text-xs truncate">{c.name}</span>
                      {kasir.activeCashier === c.name && (
                        <span className="text-[9px] font-extrabold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shrink-0">
                          <UserCheck size={9} /> Aktif di device ini
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">{txCountByCashier(c.name)} transaksi tercatat</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {kasir.activeCashier !== c.name && (
                    <button
                      onClick={() => kasir.setActiveCashier(c.name)}
                      className="text-[10px] font-bold text-emerald-600 hover:bg-emerald-50 px-2.5 py-1.5 rounded-lg transition"
                    >
                      Jadikan Aktif
                    </button>
                  )}

                  {confirmDeleteId === c.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => { kasir.deleteCashier(c.id); setConfirmDeleteId(null); }}
                        className="text-[10px] font-bold text-white bg-rose-500 hover:bg-rose-600 px-2.5 py-1.5 rounded-lg transition"
                      >
                        Ya, Hapus
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="text-[10px] font-bold text-slate-500 hover:bg-slate-100 px-2.5 py-1.5 rounded-lg transition"
                      >
                        Batal
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(c.id)}
                      className="p-2 hover:bg-rose-50 rounded-xl text-rose-500 transition"
                      title="Hapus"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}