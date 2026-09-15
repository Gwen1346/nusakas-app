// src/components/TransactionTab.jsx
import React, { useState } from 'react';
import { Sparkles, Trash2, Edit2, Receipt, Loader2, ScanLine, UserCheck } from 'lucide-react';
import { CustomSelect } from './CustomSelect';
import { ScanReceiptModal } from './ScanReceiptModal';
import { CATEGORY_COLORS as DEFAULT_CATEGORY_COLORS, TYPE_OPTIONS } from '../utils/transactionMeta';

const DEFAULT_CATEGORY_NAMES = Object.keys(DEFAULT_CATEGORY_COLORS);

export function TransactionTab({ kasir, setActiveTab }) {
  const [showScanModal, setShowScanModal] = useState(false);

  // Kategori sekarang dinamis: default (Minuman, Makanan, dll) + custom yang
  // ditambahkan user sendiri lewat dropdown. Disimpan di backend (Supabase),
  // jadi sinkron di semua device — dikelola lewat useKasir.js.
  const { categories, categoryColors, addCategory, customCategories, hideDefaultCategory, deleteCategory } = kasir;

  // Kategori default & custom sama-sama bisa dihapus dari dropdown, tapi lewat
  // endpoint yang beda: default cuma "disembunyikan" per akun, custom beneran dihapus.
  const handleDeleteCategoryOption = (value) => {
    if (DEFAULT_CATEGORY_NAMES.includes(value)) {
      hideDefaultCategory(value);
    } else {
      const row = customCategories.find(c => c.name === value);
      if (row) deleteCategory(row.id);
    }
    if (kasir.formCategory === value) {
      kasir.setFormCategory('');
    }
  };

  const filteredList = kasir.transactions.filter(item => {
    const searchVal = (kasir.tableSearch || '').toLowerCase();
    const matchSearch = (item.name || '').toLowerCase().includes(searchVal) ||
                        (item.category || '').toLowerCase().includes(searchVal);
    const matchType = kasir.tableFilterType === 'ALL' || !kasir.tableFilterType || item.type === kasir.tableFilterType;
    const matchDate = !kasir.tableFilterDate || item.date === kasir.tableFilterDate;
    const matchCashier = kasir.tableFilterCashier === 'ALL' || !kasir.tableFilterCashier || item.cashier === kasir.tableFilterCashier;
    return matchSearch && matchType && matchDate && matchCashier;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-5 pb-12">
      {/* Header Halaman */}
      <div className="bg-gradient-to-r from-emerald-900 to-emerald-800 text-white p-5 rounded-3xl shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 bg-emerald-700/50 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">Catat Transaksi</h1>
          <p className="text-xs text-emerald-100/80">Tambah pemasukan atau pengeluaran, dan pantau riwayatnya di sini.</p>
        </div>
      </div>

      {/* Form Tambah / Edit Transaksi */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-100 shadow-xs">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-xs sm:text-sm text-slate-800 flex items-center gap-2">
            {kasir.editingId ? '✏️ Edit Transaksi' : '+ Input Transaksi Baru'}
          </h3>
          {!kasir.editingId && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowScanModal(true)}
                className="text-[10px] font-bold text-white bg-[#064E3B] hover:bg-[#053e2f] px-2.5 py-1.5 rounded-full flex items-center gap-1 transition"
              >
                <ScanLine size={12} /> Scan Struk
              </button>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full flex items-center gap-1 border border-emerald-100/50">
                <Sparkles size={11} /> AI Ready
              </span>
            </div>
          )}
        </div>

        <form onSubmit={kasir.handleFormSubmit} className="space-y-3.5">
          {/* Kasir Aktif -- SENGAJA dikunci (read-only) di halaman ini. Ganti kasir
              aktif cuma boleh lewat halaman Manajemen Kasir (tombol "Jadikan Aktif"),
              biar nggak kepencet/kegeser nggak sengaja pas lagi buru-buru nyatet transaksi. */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 border border-slate-200/60 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-500 shrink-0">Kasir Bertugas:</span>
              {kasir.activeCashier ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
                  <UserCheck size={12} /> {kasir.activeCashier}
                </span>
              ) : (
                <span className="text-[10px] text-amber-600 font-semibold">
                  {kasir.cashierOptions.length === 0 ? 'Belum ada kasir terdaftar' : 'Belum ada kasir dipilih'}
                </span>
              )}
            </div>
            {setActiveTab && (
              <button
                type="button"
                onClick={() => setActiveTab('cashiers')}
                className="text-[10px] font-bold text-slate-500 hover:text-emerald-700 bg-white hover:bg-emerald-50 border border-slate-200/70 hover:border-emerald-200 px-2.5 py-1.5 rounded-full flex items-center gap-1 transition shrink-0"
              >
                <UserCheck size={11} />
                {kasir.activeCashier ? 'Ganti Kasir' : 'Pilih Kasir'}
              </button>
            )}
          </div>

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
                type="text"
                inputMode="numeric"
                placeholder="18.000"
                value={kasir.formPrice ? Number(kasir.formPrice).toLocaleString('id-ID') : ''}
                onChange={e => {
                  // Buang semua karakter selain digit (termasuk titik pemisah ribuan
                  // yang barusan kita tampilkan), jadi state tetap angka mentah murni.
                  const digitsOnly = e.target.value.replace(/\D/g, '');
                  kasir.setFormPrice(digitsOnly);
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <CustomSelect
              label="Tipe"
              value={kasir.formType}
              onChange={kasir.setFormType}
              options={TYPE_OPTIONS}
            />
            <CustomSelect
              label="Kategori"
              value={kasir.formCategory}
              onChange={kasir.setFormCategory}
              options={categories}
              categoryColors={categoryColors}
              onAddNew={addCategory}
              onDeleteOption={handleDeleteCategoryOption}
              colored
            />
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
                disabled={kasir.isSubmitting}
                onClick={() => {
                  kasir.setEditingId(null);
                  kasir.setFormName('');
                  kasir.setFormPrice('');
                }}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs transition flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Batal
              </button>
            )}
            <button
              type="submit"
              disabled={kasir.isSubmitting}
              className={`flex-1 py-3 text-white font-extrabold rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed ${
                kasir.editingId ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {kasir.isSubmitting ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                kasir.editingId ? 'Simpan Perubahan' : '+ Simpan Transaksi'
              )}
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

            <div className="flex items-center gap-1 w-full sm:w-auto">
              <input
                type="date"
                value={kasir.tableFilterDate || ''}
                onChange={e => kasir.setTableFilterDate && kasir.setTableFilterDate(e.target.value)}
                className="flex-1 sm:flex-none px-3 py-2 bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500 text-slate-600"
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

            <div className="flex gap-2 w-full sm:w-auto">
              <div className="flex-1 sm:w-32">
                <CustomSelect
                  value={kasir.tableFilterType || 'ALL'}
                  onChange={(v) => kasir.setTableFilterType && kasir.setTableFilterType(v)}
                  options={[{ value: 'ALL', label: 'Semua Tipe' }, ...TYPE_OPTIONS.map(o => ({ value: o.value, label: o.value === 'INCOME' ? 'Income' : 'Expense' }))]}
                />
              </div>

              {kasir.cashierOptions.length > 0 && (
                <div className="flex-1 sm:w-36">
                  <CustomSelect
                    value={kasir.tableFilterCashier || 'ALL'}
                    onChange={(v) => kasir.setTableFilterCashier && kasir.setTableFilterCashier(v)}
                    options={[{ value: 'ALL', label: 'Semua Kasir' }, ...kasir.cashierOptions]}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {filteredList.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center gap-2">
            <div className="w-11 h-11 rounded-2xl bg-slate-50 text-slate-300 flex items-center justify-center">
              <Receipt size={20} />
            </div>
            <p className="text-xs font-bold text-slate-500">Belum ada transaksi</p>
            <p className="text-[11px] text-slate-400 max-w-xs">
              Catat transaksi pertamamu lewat form di atas untuk mulai memantau kas tokomu.
            </p>
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
                      {item.cashier && (
                        <span className="text-[10px] text-slate-400 font-medium">· {item.cashier}</span>
                      )}
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
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 text-[10px] uppercase tracking-wider">
                    <th className="pb-3 pr-4">Tanggal</th>
                    <th className="pb-3 pr-4">Nama</th>
                    <th className="pb-3 pr-4">Kategori</th>
                    <th className="pb-3 pr-4">Kasir</th>
                    <th className="pb-3 pr-4">Tipe</th>
                    <th className="pb-3 pr-4">Nominal</th>
                    <th className="pb-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredList.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3.5 pr-4 text-xs text-slate-400 whitespace-nowrap">{item.date || '-'}</td>
                      <td className="py-3.5 pr-4 font-bold text-slate-800 text-sm max-w-[220px] truncate">{item.name}</td>
                      <td className="py-3.5 pr-4 text-xs text-slate-500 whitespace-nowrap">{item.category}</td>
                      <td className="py-3.5 pr-4 text-xs text-slate-400 whitespace-nowrap">{item.cashier || '-'}</td>
                      <td className="py-3.5 pr-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold ${item.type === 'INCOME' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                          {item.type}
                        </span>
                      </td>
                      <td className={`py-3.5 pr-4 font-extrabold text-sm whitespace-nowrap ${item.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
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

      {showScanModal && (
        <ScanReceiptModal
          onClose={() => setShowScanModal(false)}
          onSaved={kasir.fetchTransactions}
        />
      )}
    </div>
  );
}