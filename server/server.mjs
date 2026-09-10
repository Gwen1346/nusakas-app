import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import dotenv from 'dotenv';
import pkg from 'pg';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();
const { Pool } = pkg;

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 5000;

// Koneksi ke PostgreSQL Supabase via DATABASE_URL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Inisialisasi Google GenAI
const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || '');

// Middleware verifikasi Token JWT
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'Akses ditolak, token tidak ditemukan' });

  jwt.verify(token, process.env.JWT_SECRET || 'rahasia_super_aman', (err, user) => {
    if (err) return res.status(403).json({ success: false, message: 'Token tidak valid' });
    req.user = user;
    next();
  });
};

// ================= AUTHENTICATION ENDPOINTS =================

// 1. Register User Baru
app.post('/api/v1/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Email sudah terdaftar' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = Date.now().toString();

    await pool.query(
      'INSERT INTO users (id, name, email, password) VALUES ($1, $2, $3, $4)',
      [userId, name, email, hashedPassword]
    );

    res.status(201).json({ success: true, message: 'Registrasi berhasil, silakan login' });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
});

// 2. Login User
app.post('/api/v1/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Email atau password salah' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Email atau password salah' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      process.env.JWT_SECRET || 'rahasia_super_aman',
      { expiresIn: '7d' }
    );

    res.json({ success: true, message: 'Login berhasil', token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
});

// ================= TRANSACTION ENDPOINTS (Multi-User) =================

app.get('/api/v1/transactions', verifyToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM transactions WHERE userId = $1', [req.user.id]);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal mengambil data transaksi' });
  }
});

app.post('/api/v1/transactions', verifyToken, async (req, res) => {
  try {
    const { name, type, category, price, qty, date } = req.body;
    if (!name || !type || !price) {
      return res.status(400).json({ success: false, message: 'Data tidak lengkap' });
    }

    const newTxId = Date.now();
    const txDate = date || new Date().toISOString().split('T')[0];
    const txQty = Number(qty) || 1;
    const txPrice = Number(price);

    await pool.query(
      'INSERT INTO transactions (id, userId, name, type, category, price, qty, date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [newTxId, req.user.id, name, type, category, txPrice, txQty, txDate]
    );

    res.status(201).json({
      success: true,
      data: { id: newTxId, userId: req.user.id, name, type, category, price: txPrice, qty: txQty, date: txDate }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal menambah transaksi' });
  }
});

app.put('/api/v1/transactions/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, category, price, qty, date } = req.body;

    const check = await pool.query('SELECT * FROM transactions WHERE id = $1 AND userId = $2', [id, req.user.id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan' });
    }

    const current = check.rows[0];
    const updatedName = name ?? current.name;
    const updatedType = type ?? current.type;
    const updatedCategory = category ?? current.category;
    const updatedPrice = price !== undefined ? Number(price) : current.price;
    const updatedQty = qty !== undefined ? Number(qty) : current.qty;
    const updatedDate = date ?? current.date;

    await pool.query(
      'UPDATE transactions SET name = $1, type = $2, category = $3, price = $4, qty = $5, date = $6 WHERE id = $7 AND userId = $8',
      [updatedName, updatedType, updatedCategory, updatedPrice, updatedQty, updatedDate, id, req.user.id]
    );

    res.json({ success: true, data: { id: Number(id), userId: req.user.id, name: updatedName, type: updatedType, category: updatedCategory, price: updatedPrice, qty: updatedQty, date: updatedDate } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal mengubah transaksi' });
  }
});

app.delete('/api/v1/transactions/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM transactions WHERE id = $1 AND userId = $2', [id, req.user.id]);
    res.json({ success: true, message: 'Transaksi berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal menghapus transaksi' });
  }
});

// ================= AI ENDPOINTS (Nusa Advisor) =================

app.post('/api/v1/ai/chat', verifyToken, async (req, res) => {
  try {
    const { message, history, systemInstruction } = req.body;
    if (!apiKey) throw new Error("API Key Gemini belum dikonfigurasi");

    const model = genAI.getGenerativeModel({
      model: 'gemini-3.6-flash',
      systemInstruction: systemInstruction || 'Nama kamu Nusa, asisten keuangan UMKM POS.'
    });

    const chat = model.startChat({ history: history || [] });
    const result = await chat.sendMessage(message);
    res.json({ success: true, text: result.response.text() });
  } catch (err) {
    console.error("AI Chat Error Detail:", err);
    res.status(500).json({ success: false, message: err.message || 'Terjadi kesalahan pada AI' });
  }
});

app.post('/api/v1/ai/generate', verifyToken, async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!apiKey) throw new Error("API Key Gemini belum dikonfigurasi");

    const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
    const result = await model.generateContent(prompt);
    res.json({ success: true, text: result.response.text() });
  } catch (err) {
    console.error("AI Generate Error Detail:", err);
    res.status(500).json({ success: false, message: err.message || 'Terjadi kesalahan pada AI' });
  }
});

// Hanya jalankan app.listen saat development lokal (bukan di lingkungan Vercel)
if (!process.env.VERCEL) {
  app.listen(PORT, () => console.log(`Backend berjalan di port ${PORT}`));
}

// WAJIB: Vercel serverless function butuh default export ini
export default app;