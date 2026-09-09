// src/hooks/useTransactions.js
import { useState, useEffect } from 'react';
import axios from 'axios';

export function useTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  // Contoh fetch data dari API / backend lokal
  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/transactions');
      setTransactions(response.data);
    } catch (error) {
      console.error("Gagal memuat transaksi:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // Fungsi Filter & Pencarian
  const filteredTransactions = transactions.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'ALL' || item.type === filterType;
    return matchesSearch && matchesType;
  });

  return {
    transactions,
    filteredTransactions,
    loading,
    searchQuery,
    setSearchQuery,
    filterType,
    setFilterType,
    refreshTransactions: fetchTransactions,
  };
}