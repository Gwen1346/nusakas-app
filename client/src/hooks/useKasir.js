// src/hooks/useKasir.js
import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CATEGORY_COLORS as DEFAULT_CATEGORY_COLORS, formatLocalDate } from '../utils/transactionMeta';

export function useKasir() {
  // Urutkan transaksi: tanggal terbaru dulu, kalau tanggal sama urutkan
  // berdasarkan id (id = timestamp saat transaksi diinput, jadi urutan
  // input tetap konsisten walau tanggalnya sama).
  const sortTransactions = (list) => {
    return [...list].sort((a, b) => {
      const dateCompare = String(b.date).localeCompare(String(a.date));
      if (dateCompare !== 0) return dateCompare;
      return Number(b.id) - Number(a.id);
    });
  };

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // State data transaksi utama (diambil dari backend, kosong sampai fetch selesai)
  const [transactions, setTransactions] = useState([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [transactionError, setTransactionError] = useState('');

  // State kategori custom (diambil dari backend). Kategori DEFAULT (Minuman, Makanan,
  // dll) tetap hardcode di transactionMeta.js dan digabung di bawah lewat `categories`.
  const [customCategories, setCustomCategories] = useState([]);
  // Penanda kategori default yang disembunyikan user (misal toko baju gak butuh "Minuman")
  const [hiddenDefaults, setHiddenDefaults] = useState([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  // State daftar kasir (Split Shift/Kasir) -- daftar nama kasir milik toko ini,
  // diambil dari backend. "Kasir aktif" cuma disimpan di localStorage per
  // browser/device, bukan di backend, karena itu representasi "siapa yang lagi
  // pegang device ini sekarang", bukan data milik toko secara keseluruhan.
  const [cashiers, setCashiers] = useState([]);
  const [isLoadingCashiers, setIsLoadingCashiers] = useState(false);
  const [activeCashier, setActiveCashierState] = useState(() => localStorage.getItem('nusakas_active_cashier') || '');
  const [tableFilterCashier, setTableFilterCashier] = useState('ALL');
  const [reportFilterCashier, setReportFilterCashier] = useState('ALL');

  // State form input transaksi (Tambah & Edit)
  const [formName, setFormName] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formDate, setFormDate] = useState(() => formatLocalDate(new Date()));
  const [formType, setFormType] = useState('INCOME');
  const [formCategory, setFormCategory] = useState('Minuman');
  // Harga modal (cost) -- disnapshot ke transaksi saat disimpan, biar histori
  // margin tetap akurat walau harga modal produk di katalog berubah belakangan.
  const [formCost, setFormCost] = useState('');
  // ID produk katalog yang lagi dipilih (kalau transaksi Income baru WAJIB
  // pilih dari katalog). null = belum ada yang dipilih / mode manual (Expense/Edit).
  const [formProductId, setFormProductId] = useState(null);

  // State katalog produk/menu (diambil dari backend) -- dipilih kasir pas Catat
  // Transaksi biar nama & harga selalu konsisten, gak perlu ketik manual tiap kali.
  const [products, setProducts] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  // State Edit ID
  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State pencarian & filter tabel dashboard
  const [tableSearch, setTableSearch] = useState('');
  const [tableFilterType, setTableFilterType] = useState('ALL');
  const [tableFilterDate, setTableFilterDate] = useState('');

  // State pencarian & filter tanggal untuk menu Laporan Kas
  const [reportSearch, setReportSearch] = useState('');
  const [reportFilterType, setReportFilterType] = useState('ALL');
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');

  // State modal
  const [detailModalItem, setDetailModalItem] = useState(null);
  const [deleteModalConfig, setDeleteModalConfig] = useState({ isOpen: false, id: null, name: '' });

  // Ambil transaksi milik user yang sedang login dari backend
  const fetchTransactions = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      // Belum login, kosongkan data supaya tidak nyisa punya sesi sebelumnya
      setTransactions([]);
      return;
    }
    setIsLoadingTransactions(true);
    setTransactionError('');
    try {
      const res = await api.get('/transactions');
      setTransactions(sortTransactions(res.data.data || []));
    } catch (err) {
      console.error('Gagal mengambil data transaksi:', err);
      setTransactionError('Gagal memuat data transaksi. Coba refresh halaman.');
      setTransactions([]);
    } finally {
      setIsLoadingTransactions(false);
    }
  }, []);

  // Ambil kategori custom milik user yang sedang login dari backend
  const fetchCategories = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setCustomCategories([]);
      return;
    }
    setIsLoadingCategories(true);
    try {
      const res = await api.get('/categories');
      const rows = res.data.data || [];
      setHiddenDefaults(rows.filter(r => r.ishidden));
      setCustomCategories(rows.filter(r => !r.ishidden));
    } catch (err) {
      console.error('Gagal mengambil data kategori:', err);
      setHiddenDefaults([]);
      setCustomCategories([]);
    } finally {
      setIsLoadingCategories(false);
    }
  }, []);

  // Ambil katalog produk/menu milik toko (user yang sedang login) dari backend
  const fetchProducts = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setProducts([]);
      return;
    }
    setIsLoadingProducts(true);
    try {
      const res = await api.get('/products');
      setProducts(res.data.data || []);
    } catch (err) {
      console.error('Gagal mengambil data katalog produk:', err);
      setProducts([]);
    } finally {
      setIsLoadingProducts(false);
    }
  }, []);

  // Ambil daftar kasir milik toko (user yang sedang login) dari backend
  const fetchCashiers = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setCashiers([]);
      return;
    }
    setIsLoadingCashiers(true);
    try {
      const res = await api.get('/cashiers');
      setCashiers(res.data.data || []);
    } catch (err) {
      console.error('Gagal mengambil data kasir:', err);
      setCashiers([]);
    } finally {
      setIsLoadingCashiers(false);
    }
  }, []);

  // Ambil data begitu hook pertama kali dipakai (mis. saat refresh halaman & sesi masih ada)
  useEffect(() => {
    fetchTransactions();
    fetchCategories();
    fetchCashiers();
    fetchProducts();
  }, [fetchTransactions, fetchCategories, fetchCashiers, fetchProducts]);

  const hiddenDefaultNames = hiddenDefaults.map(h => h.name.toLowerCase());

  // Tambah kategori baru (dipanggil dari dropdown Kategori di TransactionTab)
  const addCategory = useCallback(async (name) => {
    const trimmed = (name || '').trim();
    if (!trimmed) return null;

    const visibleDefaultNames = Object.keys(DEFAULT_CATEGORY_COLORS)
      .filter(n => !hiddenDefaultNames.includes(n.toLowerCase()));
    const alreadyExists = [...visibleDefaultNames, ...customCategories.map(c => c.name)]
      .some(existing => existing.toLowerCase() === trimmed.toLowerCase());
    if (alreadyExists) return trimmed;

    try {
      const res = await api.post('/categories', { name: trimmed });
      if (res.data.data && !res.data.data.alreadyExists) {
        setCustomCategories(prev => [...prev, res.data.data]);
      }
      return trimmed;
    } catch (err) {
      console.error('Gagal menambah kategori:', err);
      alert('Gagal menambah kategori baru. Coba lagi ya.');
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customCategories, hiddenDefaultNames]);

  // Sembunyikan kategori DEFAULT (Minuman, Makanan, dll) buat akun ini -- misalnya
  // toko baju yang gak butuh kategori F&B sama sekali. Bisa dipulihkan lagi lewat deleteCategory.
  const hideDefaultCategory = useCallback(async (name) => {
    try {
      const res = await api.post('/categories/hide-default', { name });
      setHiddenDefaults(prev => {
        const exists = prev.some(h => h.name.toLowerCase() === name.toLowerCase());
        return exists ? prev : [...prev, res.data.data];
      });
    } catch (err) {
      console.error('Gagal menyembunyikan kategori:', err);
      alert('Gagal menyembunyikan kategori. Coba lagi ya.');
    }
  }, []);

  // Hapus kategori custom ATAU pulihkan kategori default yang sebelumnya disembunyikan
  // (keduanya sama-sama baris di tabel `categories`, jadi cukup 1 fungsi + 1 endpoint).
  const deleteCategory = useCallback(async (id) => {
    try {
      await api.delete(`/categories/${id}`);
      setCustomCategories(prev => prev.filter(c => c.id !== id));
      setHiddenDefaults(prev => prev.filter(h => h.id !== id));
    } catch (err) {
      console.error('Gagal menghapus kategori:', err);
      alert('Gagal menghapus kategori. Coba lagi ya.');
    }
  }, []);

  // Tambah nama kasir baru (dipanggil dari dropdown "Kasir Aktif" di TransactionTab)
  const addCashier = useCallback(async (name) => {
    const trimmed = (name || '').trim();
    if (!trimmed) return null;

    const alreadyExists = cashiers.some(c => c.name.toLowerCase() === trimmed.toLowerCase());
    if (alreadyExists) return trimmed;

    try {
      const res = await api.post('/cashiers', { name: trimmed });
      if (res.data.data && !res.data.alreadyExists) {
        setCashiers(prev => [...prev, res.data.data]);
      }
      return trimmed;
    } catch (err) {
      console.error('Gagal menambah kasir:', err);
      alert('Gagal menambah kasir baru. Coba lagi ya.');
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cashiers]);

  // Hapus nama kasir dari daftar. Transaksi lama yang udah ke-tag nama itu
  // TETAP nyimpen nama aslinya (gak ikut kehapus), cuma gak muncul lagi di dropdown.
  const deleteCashier = useCallback(async (id) => {
    try {
      await api.delete(`/cashiers/${id}`);
      setCashiers(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error('Gagal menghapus kasir:', err);
      alert('Gagal menghapus kasir. Coba lagi ya.');
    }
  }, []);

  // Tambah produk baru ke katalog (dipanggil dari Catat Transaksi saat produk
  // belum ada di daftar, atau dari halaman kelola katalog kalau ada nanti).
  const addProduct = useCallback(async ({ name, type, category, price, cost }) => {
    const trimmed = (name || '').trim();
    if (!trimmed || price === undefined || price === null || price === '') {
      alert('Nama & harga jual produk wajib diisi.');
      return null;
    }
    try {
      const res = await api.post('/products', {
        name: trimmed,
        type: type || 'INCOME',
        category,
        price: Number(price),
        cost: Number(cost) || 0,
      });
      setProducts(prev => [...prev, res.data.data]);
      return res.data.data;
    } catch (err) {
      console.error('Gagal menambah produk ke katalog:', err);
      alert('Gagal menambah produk ke katalog. Coba lagi ya.');
      return null;
    }
  }, []);

  // Ubah produk katalog yang sudah ada (harga jual/modal/nama/kategori).
  // Transaksi LAMA yang udah kepakai gak ikut berubah, karena harga & cost
  // disnapshot ke tabel transactions saat transaksi itu dibuat.
  const updateProduct = useCallback(async (id, payload) => {
    try {
      const res = await api.put(`/products/${id}`, payload);
      setProducts(prev => prev.map(p => (p.id === id ? res.data.data : p)));
      return res.data.data;
    } catch (err) {
      console.error('Gagal mengubah produk katalog:', err);
      alert('Gagal mengubah produk katalog. Coba lagi ya.');
      return null;
    }
  }, []);

  // Hapus produk dari katalog. Transaksi lama yang udah pernah pakai nama ini
  // tetap aman (gak ikut kehapus), cuma gak muncul lagi di daftar pilihan.
  const deleteProduct = useCallback(async (id) => {
    try {
      await api.delete(`/products/${id}`);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error('Gagal menghapus produk katalog:', err);
      alert('Gagal menghapus produk katalog. Coba lagi ya.');
    }
  }, []);

  // Minta AI ngasih PERKIRAAN harga modal & harga jual buat produk baru,
  // berdasarkan nama produknya aja. Ini estimasi umum harga pasar Indonesia --
  // BUKAN harga pasti tiap daerah/toko, tetap perlu disesuaikan manual.
  const suggestProductPrice = useCallback(async (name, existingCost) => {
    const trimmed = (name || '').trim();
    if (!trimmed) {
      alert('Ketik dulu nama produknya sebelum minta bantuan AI.');
      return null;
    }
    try {
      const payload = { name: trimmed };
      if (existingCost) {
        payload.cost = existingCost; // modal udah diisi manual -- AI gak boleh ubah ini
      }
      const res = await api.post('/ai/suggest-product-price', payload);
      return res.data.data;
    } catch (err) {
      console.error('Gagal minta estimasi harga AI:', err);
      alert(err.response?.data?.message || 'AI gagal memberi estimasi harga. Coba lagi ya.');
      return null;
    }
  }, []);

  // "Kasir aktif" = siapa yang lagi pegang device ini sekarang. Disimpan di
  // localStorage (bukan backend) supaya tetap kepilih walau halaman di-refresh,
  // tapi independen per device -- device kasir A tetap "Budi" walau kasir B
  // pilih namanya sendiri di device lain.
  const setActiveCashier = (name) => {
    setActiveCashierState(name);
    if (name) {
      localStorage.setItem('nusakas_active_cashier', name);
    } else {
      localStorage.removeItem('nusakas_active_cashier');
    }
  };

  const cashierOptions = cashiers.map(c => ({ value: c.name, label: c.name }));

  // Daftar kategori siap pakai untuk CustomSelect: default (yang belum disembunyikan) + custom
  const categories = [
    ...Object.keys(DEFAULT_CATEGORY_COLORS)
      .filter(name => !hiddenDefaultNames.includes(name.toLowerCase()))
      .map(name => ({ value: name, label: name })),
    ...customCategories.map(c => ({ value: c.name, label: c.name })),
  ];

  // Warna kategori siap pakai: default (yang masih kelihatan) + custom
  const categoryColors = {
    ...Object.fromEntries(
      Object.entries(DEFAULT_CATEGORY_COLORS).filter(([name]) => !hiddenDefaultNames.includes(name.toLowerCase()))
    ),
    ...Object.fromEntries(customCategories.map(c => [c.name, c.color])),
  };

  // Reset semua state form ke kondisi awal
  const resetForm = () => {
    setFormName('');
    setFormPrice('');
    setFormCost('');
    setFormProductId(null);
    setFormDate(formatLocalDate(new Date()));
    setFormType('INCOME');
    setFormCategory('Minuman');
    setEditingId(null);
  };

  // Fungsi Tambah / Edit Transaksi (sekarang benar-benar tersimpan ke backend)
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formName || !formPrice) return;
    if (isSubmitting) return; // cegah submit dobel kalau somehow ke-trigger 2x

    // Wajib pilih kasir bertugas dulu sebelum bisa nyimpen transaksi BARU.
    // Transaksi lama yang lagi diedit boleh disimpan tanpa ini (kasir asli
    // yang udah nyatet dulu tetap dipertahankan, lihat catatan di bawah).
    if (!editingId && !activeCashier) {
      alert('Pilih kasir bertugas terlebih dahulu sebelum menyimpan transaksi.');
      return;
    }

    // Transaksi Income BARU wajib dipilih dari katalog produk (biar nama &
    // harga konsisten, gak ada lagi typo). Expense tetap bebas manual karena
    // harga belanja bahan baku/operasional emang beda-beda tiap kali beli.
    // Transaksi yang lagi diedit dikecualikan, biar tetap bisa dibenerin manual.
    if (!editingId && formType === 'INCOME' && !formProductId) {
      alert('Pilih produk dari katalog terlebih dahulu. Kalau belum ada, tambahkan dulu lewat "+ Tambah produk baru ke katalog".');
      return;
    }

    setIsSubmitting(true);

    const payload = {
      name: formName,
      price: Number(formPrice),
      cost: Number(formCost) || 0,
      date: formDate,
      type: formType,
      category: formCategory,
    };
    // Cuma tag "kasir aktif" pas bikin transaksi BARU. Kalau lagi edit transaksi
    // lama, jangan timpa kasir asli yang dulu nyatet -- itu riwayat shift yang
    // penting buat pengecekan selisih kas, gak boleh berubah cuma gara-gara ada typo dibenerin.
    if (!editingId) {
      payload.cashier = activeCashier || null;
    }

    try {
      if (editingId) {
        const res = await api.put(`/transactions/${editingId}`, payload);
        setTransactions(prev => sortTransactions(prev.map(t => (t.id === editingId ? res.data.data : t))));
      } else {
        const res = await api.post('/transactions', payload);
        setTransactions(prev => sortTransactions([res.data.data, ...prev]));
      }
      resetForm();
    } catch (err) {
      console.error('Gagal menyimpan transaksi:', err);
      alert('Gagal menyimpan transaksi. Coba lagi ya.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Trigger Masuk Mode Edit -- selalu manual (gak wajib pilih ulang dari
  // katalog), karena ini cuma buat benerin transaksi lama yang udah dicatat.
  const handleStartEdit = (item) => {
    setEditingId(item.id);
    setFormName(item.name);
    setFormPrice(item.price);
    setFormCost(item.cost || 0);
    setFormProductId(null);
    setFormDate(item.date || new Date().toISOString().split('T')[0]);
    setFormType(item.type);
    setFormCategory(item.category);
  };

  // Fungsi Hapus Transaksi (sekarang benar-benar hapus dari backend)
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDelete = async () => {
    const { id } = deleteModalConfig;
    if (isDeleting) return; // cegah klik dobel pas masih proses hapus
    setIsDeleting(true);
    try {
      await api.delete(`/transactions/${id}`);
      setTransactions(prev => prev.filter(t => t.id !== id));
      setDeleteModalConfig({ isOpen: false, id: null, name: '' });
    } catch (err) {
      console.error('Gagal menghapus transaksi:', err);
      alert('Gagal menghapus transaksi. Coba lagi ya.');
      // Modal SENGAJA gak ditutup kalau gagal, biar user bisa coba lagi
      // tanpa harus buka ulang dari tabel.
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter laporan kas dengan rentang tanggal
  const filteredReportTransactions = transactions.filter(item => {
    const matchSearch = (item.name || '').toLowerCase().includes(reportSearch.toLowerCase()) ||
                        (item.category || '').toLowerCase().includes(reportSearch.toLowerCase());
    const matchType = reportFilterType === 'ALL' || item.type === reportFilterType;
    const matchCashier = reportFilterCashier === 'ALL' || item.cashier === reportFilterCashier;

    const itemDate = new Date(item.date);
    const startMatch = reportStartDate ? itemDate >= new Date(reportStartDate) : true;
    const endMatch = reportEndDate ? itemDate <= new Date(reportEndDate) : true;

    return matchSearch && matchType && matchCashier && startMatch && endMatch;
  });

  // Export laporan (yang sudah difilter di menu Laporan Kas) ke file Excel (.xlsx)
  const handleExportExcel = () => {
    if (filteredReportTransactions.length === 0) {
      alert('Tidak ada data transaksi untuk diexport.');
      return;
    }

    const totalIncome = filteredReportTransactions
      .filter(t => t.type === 'INCOME')
      .reduce((a, c) => a + Number(c.price), 0);
    const totalExpense = filteredReportTransactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((a, c) => a + Number(c.price), 0);

    const rows = filteredReportTransactions.map(t => ({
      Tanggal: t.date || '-',
      Nama: t.name,
      Kategori: t.category,
      Tipe: t.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran',
      Nominal: Number(t.price),
    }));

    // Baris kosong pemisah + ringkasan total di bagian bawah
    rows.push({ Tanggal: '', Nama: '', Kategori: '', Tipe: '', Nominal: '' });
    rows.push({ Tanggal: '', Nama: '', Kategori: '', Tipe: 'Total Pemasukan', Nominal: totalIncome });
    rows.push({ Tanggal: '', Nama: '', Kategori: '', Tipe: 'Total Pengeluaran', Nominal: totalExpense });
    rows.push({ Tanggal: '', Nama: '', Kategori: '', Tipe: 'Net Profit', Nominal: totalIncome - totalExpense });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet['!cols'] = [{ wch: 12 }, { wch: 26 }, { wch: 16 }, { wch: 18 }, { wch: 16 }];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan Kas');

    const today = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `laporan-kas-nusakas-${today}.xlsx`);
  };

  // Export laporan (yang sudah difilter di menu Laporan Kas) ke file PDF sungguhan
  const handleExportPDF = () => {
    if (filteredReportTransactions.length === 0) {
      alert('Tidak ada data transaksi untuk diexport.');
      return;
    }

    const totalIncome = filteredReportTransactions
      .filter(t => t.type === 'INCOME')
      .reduce((a, c) => a + Number(c.price), 0);
    const totalExpense = filteredReportTransactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((a, c) => a + Number(c.price), 0);
    const netProfit = totalIncome - totalExpense;

    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.setTextColor(6, 78, 59);
    doc.text('Laporan Kas - NusaKas', 14, 18);

    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(`Dicetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 14, 24);

    autoTable(doc, {
      startY: 30,
      head: [['Tanggal', 'Nama', 'Kategori', 'Tipe', 'Nominal']],
      body: filteredReportTransactions.map(t => [
        t.date || '-',
        t.name,
        t.category,
        t.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran',
        `Rp ${Number(t.price).toLocaleString('id-ID')}`,
      ]),
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: [6, 78, 59], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [246, 249, 248] },
    });

    const finalY = (doc.lastAutoTable?.finalY || 30) + 10;
    doc.setFontSize(10);
    doc.setTextColor(60);
    doc.text(`Total Pemasukan: Rp ${totalIncome.toLocaleString('id-ID')}`, 14, finalY);
    doc.text(`Total Pengeluaran: Rp ${totalExpense.toLocaleString('id-ID')}`, 14, finalY + 6);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(netProfit >= 0 ? 6 : 190, netProfit >= 0 ? 95 : 30, netProfit >= 0 ? 70 : 30);
    doc.text(`Net Profit: Rp ${netProfit.toLocaleString('id-ID')}`, 14, finalY + 14);

    const today = new Date().toISOString().split('T')[0];
    doc.save(`laporan-kas-nusakas-${today}.pdf`);
  };

  return {
    activeTab, setActiveTab,
    isMobileSidebarOpen, setIsMobileSidebarOpen,
    transactions,
    isLoadingTransactions,
    transactionError,
    fetchTransactions,
    categories,
    categoryColors,
    customCategories,
    hiddenDefaults,
    isLoadingCategories,
    addCategory,
    hideDefaultCategory,
    deleteCategory,
    cashiers,
    isLoadingCashiers,
    activeCashier, setActiveCashier,
    cashierOptions,
    addCashier,
    deleteCashier,
    tableFilterCashier, setTableFilterCashier,
    reportFilterCashier, setReportFilterCashier,
    formName, setFormName,
    formPrice, setFormPrice,
    formCost, setFormCost,
    formProductId, setFormProductId,
    formDate, setFormDate,
    formType, setFormType,
    formCategory, setFormCategory,
    products,
    isLoadingProducts,
    fetchProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    suggestProductPrice,
    editingId, setEditingId,
    isSubmitting,
    handleFormSubmit,
    handleStartEdit,
    tableSearch, setTableSearch,
    tableFilterType, setTableFilterType,
    tableFilterDate, setTableFilterDate,
    reportSearch, setReportSearch,
    reportFilterType, setReportFilterType,
    reportStartDate, setReportStartDate,
    reportEndDate, setReportEndDate,
    filteredReportTransactions,
    handleExportExcel, handleExportPDF,
    detailModalItem, setDetailModalItem,
    deleteModalConfig, setDeleteModalConfig,
    confirmDelete,
    isDeleting
  };
}