// src/utils/transactionMeta.js
// Konstanta & helper yang dipakai bareng oleh DashboardTab & TransactionTab
// biar ga duplikat kode di dua tempat.

export const DAY_LABELS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export const CATEGORY_COLORS = {
  Minuman: '#10b981',
  Makanan: '#f59e0b',
  'Bahan Baku': '#6366f1',
  Operasional: '#3b82f6',
  Lainnya: '#a855f7',
};
export const FALLBACK_COLOR = '#94a3b8';

export const CATEGORY_OPTIONS = [
  { value: 'Minuman', label: 'Minuman' },
  { value: 'Makanan', label: 'Makanan' },
  { value: 'Bahan Baku', label: 'Bahan Baku' },
  { value: 'Operasional', label: 'Operasional' },
  { value: 'Lainnya', label: 'Lainnya' },
];

export const TYPE_OPTIONS = [
  { value: 'INCOME', label: 'Income (Pemasukan)' },
  { value: 'EXPENSE', label: 'Expense (Pengeluaran)' },
];

export function getLast7Days() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().split('T')[0];
    days.push({ iso, label: DAY_LABELS[d.getDay()] });
  }
  return days;
}