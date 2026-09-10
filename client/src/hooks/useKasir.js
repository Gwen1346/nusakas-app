// src/hooks/useKasir.js
import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export function useKasir() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // State data transaksi utama (diambil dari backend, kosong sampai fetch selesai)
  const [transactions, setTransactions] = useState([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [transactionError, setTransactionError] = useState('');

  // State form input transaksi (Tambah & Edit)
  const [formName, setFormName] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formType, setFormType] = useState('INCOME');
  const [formCategory, setFormCategory] = useState('Minuman');

  // State Edit ID
  const [editingId, setEditingId] = useState(null);

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
      setTransactions(res.data.data || []);
    } catch (err) {
      console.error('Gagal mengambil data transaksi:', err);
      setTransactionError('Gagal memuat data transaksi. Coba refresh halaman.');
      setTransactions([]);
    } finally {
      setIsLoadingTransactions(false);
    }
  }, []);

  // Ambil data begitu hook pertama kali dipakai (mis. saat refresh halaman & sesi masih ada)
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Reset semua state form ke kondisi awal
  const resetForm = () => {
    setFormName('');
    setFormPrice('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormType('INCOME');
    setFormCategory('Minuman');
    setEditingId(null);
  };

  // Fungsi Tambah / Edit Transaksi (sekarang benar-benar tersimpan ke backend)
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formName || !formPrice) return;

    const payload = {
      name: formName,
      price: Number(formPrice),
      date: formDate,
      type: formType,
      category: formCategory
    };

    try {
      if (editingId) {
        const res = await api.put(`/transactions/${editingId}`, payload);
        setTransactions(prev => prev.map(t => (t.id === editingId ? res.data.data : t)));
      } else {
        const res = await api.post('/transactions', payload);
        setTransactions(prev => [res.data.data, ...prev]);
      }
      resetForm();
    } catch (err) {
      console.error('Gagal menyimpan transaksi:', err);
      alert('Gagal menyimpan transaksi. Coba lagi ya.');
    }
  };

  // Trigger Masuk Mode Edit
  const handleStartEdit = (item) => {
    setEditingId(item.id);
    setFormName(item.name);
    setFormPrice(item.price);
    setFormDate(item.date || new Date().toISOString().split('T')[0]);
    setFormType(item.type);
    setFormCategory(item.category);
  };

  // Fungsi Hapus Transaksi (sekarang benar-benar hapus dari backend)
  const confirmDelete = async () => {
    const { id } = deleteModalConfig;
    try {
      await api.delete(`/transactions/${id}`);
      setTransactions(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error('Gagal menghapus transaksi:', err);
      alert('Gagal menghapus transaksi. Coba lagi ya.');
    } finally {
      setDeleteModalConfig({ isOpen: false, id: null, name: '' });
    }
  };

  // Filter laporan kas dengan rentang tanggal
  const filteredReportTransactions = transactions.filter(item => {
    const matchSearch = (item.name || '').toLowerCase().includes(reportSearch.toLowerCase()) ||
                        (item.category || '').toLowerCase().includes(reportSearch.toLowerCase());
    const matchType = reportFilterType === 'ALL' || item.type === reportFilterType;

    const itemDate = new Date(item.date);
    const startMatch = reportStartDate ? itemDate >= new Date(reportStartDate) : true;
    const endMatch = reportEndDate ? itemDate <= new Date(reportEndDate) : true;

    return matchSearch && matchType && startMatch && endMatch;
  });

  const handleExportExcel = () => {
    alert("Data berhasil diexport ke Excel!");
  };

  const handleExportPDF = () => {
    window.print();
  };

  return {
    activeTab, setActiveTab,
    isMobileSidebarOpen, setIsMobileSidebarOpen,
    transactions,
    isLoadingTransactions,
    transactionError,
    fetchTransactions,
    formName, setFormName,
    formPrice, setFormPrice,
    formDate, setFormDate,
    formType, setFormType,
    formCategory, setFormCategory,
    editingId, setEditingId,
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
    confirmDelete
  };
}