import { useState, useEffect } from 'react';
import { getTransactions, createTransaction, deleteTransaction } from '../api/transactionService';

export const useTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const res = await getTransactions();
      setTransactions(res.data.data);
    } catch (err) {
      console.error('Gagal mengambil data:', err);
    } finally {
      setLoading(false);
    }
  };

  const addTx = async (payload) => {
    try {
      const res = await createTransaction(payload);
      setTransactions((prev) => [...prev, res.data.data]);
      return true;
    } catch (err) {
      console.error('Gagal menambah transaksi:', err);
      return false;
    }
  };

  const removeTx = async (id) => {
    try {
      await deleteTransaction(id);
      setTransactions((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error('Gagal menghapus transaksi:', err);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  return { transactions, loading, addTx, removeTx, refetch: fetchAll };
};