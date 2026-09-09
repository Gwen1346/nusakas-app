// src/components/DashboardTab.jsx
import React from 'react';
import { Sparkles, Trash2, Edit2, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export function DashboardTab({ kasir }) {
  const totalIncome = kasir.transactions
    .filter(t => t.type === 'INCOME')
    .reduce((acc, curr) => acc + Number(curr.price), 0);

  const totalExpense = kasir.transactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((acc, curr) => acc + Number(curr.price), 0);

  const netProfit = totalIncome - totalExpense;

  const filteredList = kasir.transactions.filter(item => {
    const searchVal = (kasir.tableSearch || '').toLowerCase();
    const matchSearch = (item.name || '').toLowerCase().includes(searchVal) ||
                        (item.category || '').toLowerCase().includes(searchVal);
    const matchType = kasir.tableFilterType === 'ALL' || !kasir.tableFilterType || item.type === kasir.tableFilterType;
    const matchDate = !kasir.tableFilterDate || item.date === kasir.tableFilterDate;
    return matchSearch && matchType && matchDate;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-5 pb-12">
      {/* Header Selamat Datang / Ringkas */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-gradient-to-r from-emerald-900 to-emerald-800 text-white p-5 rounded-3xl shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 bg-emerald-700/50 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-700/60 text-emerald-200 rounded-full text-[10px] font-bold mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Live POS System
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">Halo, Kasir 👋</h1>
          <p className="text-xs text-emerald-100/80">Pantau transaksi dan performa UMKM hari ini.</p>
        </div>
      </div>

      {/* Kartu Statistik Keuangan Modern */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-xs space-y-1 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Net Profit</span>
            <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Wallet size={14} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">Rp {netProfit.toLocaleString('id-ID')}</div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Masuk</span>
            <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowUpRight size={14} />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-emerald-600">Rp {totalIncome.toLocaleString('id-ID')}</div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Keluar</span>
            <div className="w-7 h-7 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <ArrowDownRight size={14} />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-rose-600">Rp {totalExpense.toLocaleString('id-ID')}</div>
        </div>
      </div>

      {/* Form Tambah / Edit Transaksi */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-100 shadow-xs">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-xs sm:text-sm text-slate-800 flex items-center gap-2">
            {kasir.editingId ? '✏️ Edit Transaksi' : '+ Input Transaksi Baru'}
          </h3>
          {!kasir.editingId && (
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full flex items-center gap-1 border border-emerald-100/50">
              <Sparkles size={11} /> AI Ready
            </span>
          )}
        </div>

        <form onSubmit={kasir.handleFormSubmit} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Nama Transaksi</label>
              <input 
                type="text" 
                placeholder="Contoh: Es Kopi Susu" 
                value={kasir.formName} 
                onChange={e => kasir.setFormName(e.target.value)} 
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" 
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Nominal (Rp)</label>
              <input 
                type="number" 
                placeholder="18000" 
                value={kasir.formPrice} 
                onChange={e => kasir.setFormPrice(e.target.value)} 
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" 
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Tipe</label>
              <select 
                value={kasir.formType} 
                onChange={e => kasir.setFormType(e.target.value)} 
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
              >
                <option value="INCOME">Income (Pemasukan)</option>
                <option value="EXPENSE">Expense (Pengeluaran)</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Kategori</label>
              <select 
                value={kasir.formCategory} 
                onChange={e => kasir.setFormCategory(e.target.value)} 
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
              >
                <option value="Minuman">Minuman</option>
                <option value="Makanan">Makanan</option>
                <option value="Operasional">Operasional</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Tanggal</label>
              <input 
                type="date" 
                value={kasir.formDate} 
                onChange={e => kasir.setFormDate(e.target.value)} 
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500 text-slate-600" 
              />
            </div>
          </div>

          <div className="flex items-center gap-2.5 pt-1">
            {kasir.editingId && (
              <button 
                type="button"
                onClick={() => {
                  kasir.setEditingId(null);
                  kasir.setFormName('');
                  kasir.setFormPrice('');
                }}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs transition flex items-center justify-center"
              >
                Batal
              </button>
            )}
            <button 
              type="submit" 
              className={`flex-1 py-3 text-white font-extrabold rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-1.5 ${
                kasir.editingId ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {kasir.editingId ? 'Simpan Perubahan' : '+ Simpan Transaksi'}
            </button>
          </div>
        </form>
      </div>

      {/* Riwayat Transaksi dengan Filter Sejajar */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
          <h3 className="font-bold text-xs sm:text-sm text-slate-800">Riwayat Transaksi</h3>
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <input 
              type="text" 
              placeholder="Cari nama/kategori..." 
              value={kasir.tableSearch || ''}
              onChange={e => kasir.setTableSearch && kasir.setTableSearch(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200/60 rounded-xl text-xs flex-1 sm:w-40 focus:outline-none focus:border-emerald-500"
            />
            
            <div className="flex items-center gap-1">
              <input 
                type="date" 
                value={kasir.tableFilterDate || ''}
                onChange={e => kasir.setTableFilterDate && kasir.setTableFilterDate(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500 text-slate-600"
                title="Filter Tanggal"
              />
              {kasir.tableFilterDate && (
                <button 
                  onClick={() => kasir.setTableFilterDate && kasir.setTableFilterDate('')}
                  className="text-[10px] font-bold text-rose-500 hover:underline px-1"
                  title="Reset Tanggal"
                >
                  Reset
                </button>
              )}
            </div>

            <select 
              value={kasir.tableFilterType || 'ALL'}
              onChange={e => kasir.setTableFilterType && kasir.setTableFilterType(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">Semua Tipe</option>
              <option value="INCOME">Income</option>
              <option value="EXPENSE">Expense</option>
            </select>
          </div>
        </div>
        
        {filteredList.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 font-medium">
            Tidak ada data transaksi.
          </div>
        ) : (
          <>
            {/* Tampilan Mobile: Card Vertikal */}
            <div className="space-y-3 sm:hidden">
              {filteredList.map(item => (
                <div key={item.id} className="p-4 bg-slate-50/80 border border-slate-100 rounded-2xl flex items-center justify-between gap-3 shadow-2xs">
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${item.type === 'INCOME' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {item.category}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">{item.date || '-'}</span>
                    </div>
                    <div className="font-bold text-slate-800 text-xs truncate">{item.name}</div>
                    <div className={`font-black text-xs ${item.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {item.type === 'INCOME' ? '+ Rp ' : '- Rp '}{Number(item.price).toLocaleString('id-ID')}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button 
                      onClick={() => kasir.handleStartEdit(item)} 
                      className="p-2.5 bg-white border border-slate-200/60 rounded-xl text-amber-500 shadow-2xs active:scale-95 transition"
                      title="Edit"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      onClick={() => kasir.setDeleteModalConfig({ isOpen: true, id: item.id, name: item.name })} 
                      className="p-2.5 bg-white border border-slate-200/60 rounded-xl text-rose-500 shadow-2xs active:scale-95 transition"
                      title="Hapus"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Tampilan Desktop: Tabel Klasik */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 text-[10px] uppercase tracking-wider">
                    <th className="pb-3">Tanggal</th>
                    <th className="pb-3">Nama</th>
                    <th className="pb-3">Kategori</th>
                    <th className="pb-3">Tipe</th>
                    <th className="pb-3">Nominal</th>
                    <th className="pb-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredList.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3.5 text-xs text-slate-400 whitespace-nowrap">{item.date || '-'}</td>
                      <td className="py-3.5 font-bold text-slate-800 text-sm">{item.name}</td>
                      <td className="py-3.5 text-xs text-slate-500 whitespace-nowrap">{item.category}</td>
                      <td className="py-3.5 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold ${item.type === 'INCOME' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                          {item.type}
                        </span>
                      </td>
                      <td className={`py-3.5 font-extrabold text-sm whitespace-nowrap ${item.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {item.type === 'INCOME' ? '+ Rp ' : '- Rp '}{Number(item.price).toLocaleString('id-ID')}
                      </td>
                      <td className="py-3.5 text-center flex items-center justify-center gap-1.5">
                        <button 
                          onClick={() => kasir.handleStartEdit(item)} 
                          className="p-2 hover:bg-amber-50 rounded-xl text-amber-500 transition border border-transparent hover:border-amber-200" 
                          title="Edit"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button 
                          onClick={() => kasir.setDeleteModalConfig({ isOpen: true, id: item.id, name: item.name })} 
                          className="p-2 hover:bg-rose-50 rounded-xl text-rose-500 transition border border-transparent hover:border-rose-200" 
                          title="Hapus"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}