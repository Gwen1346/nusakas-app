import express from 'express';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 5000;
const DB_PATH = path.resolve('db.json');

// Inisialisasi Google GenAI (Mendukung GEMINI_API_KEY maupun VITE_GEMINI_API_KEY)
const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || '');

// Helper baca/tulis database JSON lokal
const readDB = () => {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ users: [], transactions: [] }, null, 2));
  }
  const data = fs.readFileSync(DB_PATH, 'utf-8');
  return JSON.parse(data);
};

const writeDB = (data) => {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
};

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
    const db = readDB();

    const existingUser = db.users.find(u => u.email === email);
    if (existingUser) return res.status(400).json({ success: false, message: 'Email sudah terdaftar' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: Date.now().toString(),
      name,
      email,
      password: hashedPassword
    };

    db.users.push(newUser);
    writeDB(db);

    res.status(201).json({ success: true, message: 'Registrasi berhasil, silakan login' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
});

// 2. Login User
app.post('/api/v1/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const db = readDB();

    const user = db.users.find(u => u.email === email);
    if (!user) return res.status(400).json({ success: false, message: 'Email atau password salah' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Email atau password salah' });

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name }, 
      process.env.JWT_SECRET || 'rahasia_super_aman', 
      { expiresIn: '7d' }
    );

    res.json({ success: true, message: 'Login berhasil', token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
});

// ================= TRANSACTION ENDPOINTS (Multi-User) =================

// 3. Ambil transaksi khusus user yang sedang login
app.get('/api/v1/transactions', verifyToken, (req, res) => {
  const db = readDB();
  const userTransactions = db.transactions.filter(t => t.userId === req.user.id);
  res.json({ success: true, data: userTransactions });
});

// 4. Tambah transaksi baru untuk user yang login
app.post('/api/v1/transactions', verifyToken, (req, res) => {
  const { name, type, category, price, qty, date } = req.body;
  if (!name || !type || !price) {
    return res.status(400).json({ success: false, message: 'Data tidak lengkap' });
  }

  const db = readDB();
  const newTx = {
    id: Date.now(),
    userId: req.user.id,
    name,
    type,
    category,
    price: Number(price),
    qty: Number(qty) || 1,
    date: date || new Date().toISOString().split('T')[0]
  };

  db.transactions.push(newTx);
  writeDB(db);

  res.status(201).json({ success: true, data: newTx });
});

// 4b. Edit transaksi milik user yang login
app.put('/api/v1/transactions/:id', verifyToken, (req, res) => {
  const { id } = req.params;
  const { name, type, category, price, qty, date } = req.body;

  const db = readDB();
  const index = db.transactions.findIndex((t) => t.id === Number(id) && t.userId === req.user.id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan' });
  }

  db.transactions[index] = {
    ...db.transactions[index],
    name: name ?? db.transactions[index].name,
    type: type ?? db.transactions[index].type,
    category: category ?? db.transactions[index].category,
    price: price !== undefined ? Number(price) : db.transactions[index].price,
    qty: qty !== undefined ? Number(qty) : db.transactions[index].qty,
    date: date ?? db.transactions[index].date
  };
  writeDB(db);

  res.json({ success: true, data: db.transactions[index] });
});

// 5. Hapus transaksi
app.delete('/api/v1/transactions/:id', verifyToken, (req, res) => {
  const { id } = req.params;
  const db = readDB();
  
  db.transactions = db.transactions.filter((t) => !(t.id === Number(id) && t.userId === req.user.id));
  writeDB(db);

  res.json({ success: true, message: 'Transaksi berhasil dihapus' });
});

// ================= AI ENDPOINTS (Nusa Advisor) =================

app.post('/api/v1/ai/chat', verifyToken, async (req, res) => {
  try {
    const { message, history, systemInstruction } = req.body;
    
    // Pastikan API key terbaca
    if (!apiKey) {
      throw new Error("API Key Gemini belum dikonfigurasi di file .env");
    }

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

    if (!apiKey) {
      throw new Error("API Key Gemini belum dikonfigurasi di file .env");
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
    const result = await model.generateContent(prompt);
    res.json({ success: true, text: result.response.text() });
  } catch (err) {
    console.error("AI Generate Error Detail:", err);
    res.status(500).json({ success: false, message: err.message || 'Terjadi kesalahan pada AI' });
  }
});

app.listen(PORT, () => console.log(`Backend berjalan di port ${PORT}`));