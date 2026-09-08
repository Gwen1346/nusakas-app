import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// In-Memory Database Transaksi
let transactions = [
  { id: 1, name: 'Kopi Susu Aren', type: 'INCOME', category: 'Minuman', price: 18000, qty: 2, date: '2026-09-08' },
  { id: 2, name: 'Beli Biji Kopi Espresso 1kg', type: 'EXPENSE', category: 'Bahan Baku', price: 180000, qty: 1, date: '2026-09-08' }
];

// Endpoint 1: Ambil semua transaksi
app.get('/api/v1/transactions', (req, res) => {
  res.json({ success: true, data: transactions });
});

// Endpoint 2: Tambah transaksi baru
app.post('/api/v1/transactions', (req, res) => {
  const { name, type, category, price, qty } = req.body;
  if (!name || !type || !price) {
    return res.status(400).json({ success: false, message: 'Data tidak lengkap' });
  }

  const newTx = {
    id: Date.now(),
    name,
    type,
    category,
    price: Number(price),
    qty: Number(qty) || 1,
    date: new Date().toISOString().split('T')[0]
  };

  transactions.push(newTx);
  res.status(201).json({ success: true, data: newTx });
});

// Endpoint 3: Hapus transaksi berdasarkan ID
app.delete('/api/v1/transactions/:id', (req, res) => {
  const { id } = req.params;
  transactions = transactions.filter((t) => t.id !== Number(id));
  res.json({ success: true, message: 'Transaksi berhasil dihapus' });
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Backend berjalan di http://localhost:${PORT}`));