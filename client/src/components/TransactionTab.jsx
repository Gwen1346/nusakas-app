// src/components/TransactionTab.jsx
import React, { useState, useEffect } from 'react';
import { Sparkles, Trash2, Edit2, Receipt, Loader2, ScanLine, UserCheck, X, Plus } from 'lucide-react';
import { CustomSelect } from './CustomSelect';
import { ScanReceiptModal } from './ScanReceiptModal';
import { Pagination } from './Pagination';
import { CATEGORY_COLORS as DEFAULT_CATEGORY_COLORS, TYPE_OPTIONS } from '../utils/transactionMeta';

const DEFAULT_CATEGORY_NAMES = Object.keys(DEFAULT_CATEGORY_COLORS);
const ITEMS_PER_PAGE = 10;

export function TransactionTab({ kasir, setActiveTab }) {
  const [showScanModal, setShowScanModal] = useState(false);

  // Mode Income (pilih/tambah dari katalog) vs mode Manual (Expense atau lagi Edit).
  // Dipakai di beberapa tempat buat nentuin field mana yang perlu ditampilin.
  const isIncomeCatalogMode = kasir.formType === 'INCOME' && !kasir.editingId;

  // State picker katalog produk (khusus form Income baru)
  const [productSearch, setProductSearch] = useState('');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdCost, setNewProdCost] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('Minuman');
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isSuggestingPrice, setIsSuggestingPrice] = useState(false);
  const [priceSuggestionNote, setPriceSuggestionNote] = useState('');

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
    if (newProdCategory === value) {
      setNewProdCategory('');
    }
  };

  // Daftar katalog produk yang sedang difilter pencarian, buat picker Income
  const filteredProducts = (kasir.products || []).filter(p =>
    (p.name || '').toLowerCase().includes(productSearch.toLowerCase())
  );

  // Pilih 1 produk dari katalog -> auto-isi nama/harga/kategori/cost di form
  const handleSelectProduct = (p) => {
    kasir.setFormName(p.name);
    kasir.setFormPrice(p.price);
    kasir.setFormCategory(p.category);
    kasir.setFormCost(p.cost || 0);
    kasir.setFormProductId(p.id);
  };

  // Batalkan pilihan produk, balik ke mode pilih dari katalog lagi
  const handleClearProductSelection = () => {
    kasir.setFormProductId(null);
    kasir.setFormName('');
    kasir.setFormPrice('');
    kasir.setFormCost('');
  };

  // Hapus produk dari katalog langsung dari kartu pilihannya (misal buat
  // beresin data kembar tanpa perlu buka Supabase).
  const handleDeleteProduct = (p) => {
    if (!window.confirm(`Hapus "${p.name}" dari katalog?`)) return;
    kasir.deleteProduct(p.id);
    if (kasir.formProductId === p.id) {
      handleClearProductSelection();
    }
  };

  // Tambah produk baru langsung dari halaman Catat Transaksi, biar kasir gak
  // perlu pindah halaman kalau ada menu baru yang belum ada di katalog.
  const handleAddProduct = async () => {
    if (isAddingProduct) return; // cegah klik dobel pas masih proses nyimpen
    if (!newProdName.trim() || !newProdPrice) {
      alert('Nama & harga jual produk wajib diisi.');
      return;
    }
    setIsAddingProduct(true);
    try {
      const created = await kasir.addProduct({
        name: newProdName,
        type: 'INCOME',
        category: newProdCategory,
        price: Number(newProdPrice),
        cost: Number(newProdCost) || 0,
      });
      if (created) {
        handleSelectProduct(created);
        setNewProdName('');
        setNewProdPrice('');
        setNewProdCost('');
        setPriceSuggestionNote('');
        setShowAddProduct(false);
        setProductSearch('');
      }
    } finally {
      setIsAddingProduct(false);
    }
  };

  // Minta AI ngasih perkiraan harga modal & harga jual dari nama produk aja
  const handleSuggestPrice = async () => {
    if (isSuggestingPrice) return;
    setIsSuggestingPrice(true);
    setPriceSuggestionNote('');
    // Kalau modal udah diisi manual sama user, kirim itu ke AI sebagai patokan
    // yang GAK BOLEH diubah -- AI cuma fokus itung harga jualnya aja. Modal yang
    // udah user tau pasti (misal dari struk belanja) lebih akurat dari tebakan AI.
    const existingCost = newProdCost ? Number(newProdCost) : null;
    try {
      const suggestion = await kasir.suggestProductPrice(newProdName, existingCost);
      if (suggestion) {
        setNewProdPrice(String(suggestion.price));
        // Kalau user udah isi modal sendiri, JANGAN ditimpa -- tetap pakai punya user.
        if (!existingCost) {
          setNewProdCost(String(suggestion.cost));
        }
        setPriceSuggestionNote(suggestion.note || '');
      }
    } finally {
      setIsSuggestingPrice(false);
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

  // Reset ke halaman 1 tiap kali filter/pencarian berubah, biar gak nyangkut
  // di halaman 5 kosong misalnya abis ganti filter yang hasilnya cuma 2 baris.
  const [currentPage, setCurrentPage] = useState(1);
  useEffect(() => {
    setCurrentPage(1);
  }, [kasir.tableSearch, kasir.tableFilterType, kasir.tableFilterDate, kasir.tableFilterCashier]);

  const paginatedList = filteredList.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

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
                className="text-[10px] font-bold text-white bg-teal-600 hover:bg-teal-700 px-2.5 py-1.5 rounded-full flex items-center gap-1 transition"
              >
                <ScanLine size={12} /> Scan Struk
              </button>
              <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-2.5 py-1 rounded-full flex items-center gap-1 border border-teal-100/50">
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

          {kasir.formType === 'INCOME' && !kasir.editingId ? (
            /* ============ MODE KATALOG (khusus Income, transaksi baru) ============
               Wajib pilih dari katalog produk -- gak ada lagi ketik manual nama/harga,
               biar konsisten & bisa dihitung produk terlaris. */
            <div className="p-3.5 bg-slate-50 border border-slate-200/60 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-bold text-slate-500">Pilih Produk dari Katalog</label>
                {kasir.formProductId && (
                  <button
                    type="button"
                    onClick={handleClearProductSelection}
                    className="text-[10px] font-bold text-emerald-600 hover:underline"
                  >
                    Ganti Pilihan
                  </button>
                )}
              </div>

              {kasir.formProductId ? (
                <div className="flex items-center justify-between gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-emerald-800 truncate">{kasir.formName}</div>
                    <div className="text-[11px] text-emerald-600 font-bold">
                      Rp {Number(kasir.formPrice).toLocaleString('id-ID')}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    placeholder="Cari produk di katalog..."
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200/60 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />

                  {kasir.isLoadingProducts ? (
                    <div className="text-[11px] text-slate-400 py-3 text-center">Memuat katalog...</div>
                  ) : filteredProducts.length === 0 ? (
                    <div className="text-[11px] text-slate-400 py-3 text-center">
                      {kasir.products.length === 0
                        ? 'Katalog masih kosong. Tambahkan produk pertama di bawah.'
                        : 'Produk tidak ditemukan.'}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-52 overflow-y-auto pr-1">
                      {filteredProducts.map(p => (
                        <div key={p.id} className="relative group">
                          <button
                            type="button"
                            onClick={() => handleSelectProduct(p)}
                            className="w-full text-left p-2.5 pr-6 bg-white hover:bg-emerald-50 border border-slate-200/60 hover:border-emerald-300 rounded-xl transition"
                          >
                            <div className="font-bold text-[11px] text-slate-800 truncate">{p.name}</div>
                            <div className="text-[10px] text-emerald-600 font-bold">
                              Rp {Number(p.price).toLocaleString('id-ID')}
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteProduct(p);
                            }}
                            title="Hapus dari katalog"
                            className="absolute top-1.5 right-1.5 w-4 h-4 flex items-center justify-center rounded-full bg-slate-100 hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition opacity-0 group-hover:opacity-100 focus:opacity-100"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {!showAddProduct ? (
                <button
                  type="button"
                  onClick={() => setShowAddProduct(true)}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 border border-dashed border-emerald-300 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-700 rounded-xl text-[11px] font-bold transition"
                >
                  <Plus size={13} /> Produk belum ada di katalog? Tambah baru
                </button>
              ) : (
                <div className="p-3 bg-white border border-slate-200/60 rounded-xl space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Nama produk"
                      value={newProdName}
                      onChange={e => setNewProdName(e.target.value)}
                      className="px-3 py-2 bg-slate-50 border border-slate-200/60 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={handleSuggestPrice}
                      disabled={isSuggestingPrice || !newProdName.trim()}
                      className="px-3 py-2 bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-700 rounded-lg text-[11px] font-bold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                      title="Belum yakin harganya? Minta AI kasih perkiraan"
                    >
                      {isSuggestingPrice ? (
                        <>
                          <Loader2 size={12} className="animate-spin" /> Menghitung...
                        </>
                      ) : (
                        <>
                          <Sparkles size={12} /> Bantu AI Hitung Harga
                        </>
                      )}
                    </button>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="Harga jual"
                      value={newProdPrice ? Number(newProdPrice).toLocaleString('id-ID') : ''}
                      onChange={e => setNewProdPrice(e.target.value.replace(/\D/g, ''))}
                      className="px-3 py-2 bg-slate-50 border border-slate-200/60 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                    />
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="Harga modal (opsional)"
                      value={newProdCost ? Number(newProdCost).toLocaleString('id-ID') : ''}
                      onChange={e => setNewProdCost(e.target.value.replace(/\D/g, ''))}
                      className="px-3 py-2 bg-slate-50 border border-slate-200/60 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                    />
                    <div className="sm:col-span-2">
                      <CustomSelect
                        value={newProdCategory}
                        onChange={setNewProdCategory}
                        options={categories}
                        categoryColors={categoryColors}
                        onAddNew={addCategory}
                        onDeleteOption={handleDeleteCategoryOption}
                        colored
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 sm:col-span-2 -mt-1">
                      Jualan bukan F&amp;B (baju, sembako, dll)? Ketik nama kategori baru di kolom ini lalu pilih "Tambah" -- kategori bawaan di atas cuma contoh, bisa disesuaikan bebas.
                    </p>
                  </div>

                  {priceSuggestionNote && (
                    <p className="text-[10px] text-teal-600 bg-teal-50 border border-teal-100 rounded-lg px-2.5 py-1.5 leading-relaxed">
                      ✨ {priceSuggestionNote} — ini perkiraan umum, sesuaikan lagi dengan harga bahan di tempatmu.
                    </p>
                  )}

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleAddProduct}
                      disabled={isAddingProduct}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                    >
                      {isAddingProduct ? (
                        <>
                          <Loader2 size={13} className="animate-spin" /> Menyimpan...
                        </>
                      ) : (
                        'Simpan ke Katalog'
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddProduct(false);
                        setPriceSuggestionNote('');
                        setNewProdName('');
                        setNewProdPrice('');
                        setNewProdCost('');
                        setNewProdCategory('Minuman');
                      }}
                      disabled={isAddingProduct}
                      className="flex-1 px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-600 text-[11px] font-bold rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ============ MODE MANUAL (Expense, atau sedang Edit transaksi lama) ============ */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Nama Transaksi</label>
                <input
                  type="text"
                  placeholder="Contoh: Beli Kopi Bubuk 1kg"
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
          )}

          <div className={`grid grid-cols-1 gap-3.5 ${isIncomeCatalogMode ? 'sm:grid-cols-2' : 'sm:grid-cols-3'}`}>
            <CustomSelect
              label="Tipe"
              value={kasir.formType}
              onChange={(v) => {
                kasir.setFormType(v);
                kasir.setFormProductId(null);
                kasir.setFormName('');
                kasir.setFormPrice('');
                kasir.setFormCost('');
                setProductSearch('');
                setShowAddProduct(false);
              }}
              options={TYPE_OPTIONS}
            />
            {!isIncomeCatalogMode && (
              // Kategori cuma muncul buat mode Expense/Edit manual. Pas mode Income
              // (pilih/tambah produk dari katalog), kategori udah 100% diurus di
              // bagian "Pilih Produk dari Katalog" di atas (baik dari produk yang
              // dipilih, atau dari dropdown kategori pas nambah produk baru) --
              // jadi field ini gak perlu ditampilin lagi di sini sama sekali.
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
            )}
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
                  kasir.setFormCost('');
                  kasir.setFormProductId(null);
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
                <>
                  <Loader2 size={15} className="animate-spin" /> Menyimpan...
                </>
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
              {paginatedList.map(item => (
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
                  {paginatedList.map(item => (
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

            <Pagination
              currentPage={currentPage}
              totalItems={filteredList.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={setCurrentPage}
            />
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