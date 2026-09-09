// src/hooks/useKasir.js
import { useState } from 'react';

export function useKasir() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // State data transaksi utama
  const [transactions, setTransactions] = useState([
    { id: 1, name: 'Exspresso', price: 10, date: '2026-09-08', type: 'INCOME', category: 'Minuman' },
    { id: 2, name: 'admin', price: 10, date: '2026-09-08', type: 'EXPENSE', category: 'Operasional' },
    { id: 3, name: 'Matcha Latte', price: 18000, date: '2026-09-08', type: 'INCOME', category: 'Minuman' }
  ]);

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

  // State pencarian & filter tanggal untuk menu Laporan Kas
  const [reportSearch, setReportSearch] = useState('');
  const [reportFilterType, setReportFilterType] = useState('ALL');
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');

  // State modal
  const [detailModalItem, setDetailModalItem] = useState(null);
  const [deleteModalConfig, setDeleteModalConfig] = useState({ isOpen: false, id: null, name: '' });

  // Fungsi Tambah / Edit Transaksi
  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!formName || !formPrice) return;

    if (editingId) {
      setTransactions(transactions.map(t => 
        t.id === editingId 
          ? { ...t, name: formName, price: Number(formPrice), date: formDate, type: formType, category: formCategory }
          : t
      ));
      setEditingId(null);
    } else {
      const newTx = {
        id: Date.now(),
        name: formName,
        price: Number(formPrice),
        date: formDate,
        type: formType,
        category: formCategory
      };
      setTransactions([newTx, ...transactions]);
    }
    
    setFormName('');
    setFormPrice('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormType('INCOME');
    setFormCategory('Minuman');
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

  // Fungsi Hapus Transaksi
  const confirmDelete = () => {
    setTransactions(transactions.filter(t => t.id !== deleteModalConfig.id));
    setDeleteModalConfig({ isOpen: false, id: null, name: '' });
  };

  // Filter laporan kas dengan rentang tanggal
  const filteredReportTransactions = transactions.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(reportSearch.toLowerCase()) || 
                        item.category.toLowerCase().includes(reportSearch.toLowerCase());
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