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
// Limit dinaikin dari default 100kb -> 15mb, karena endpoint scan-receipt
// nerima gambar struk dalam bentuk base64 yang gampang beberapa MB.
app.use(express.json({ limit: '15mb' }));
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
    const { name, type, category, price, qty, date, cashier, cost } = req.body;
    if (!name || !type || price === undefined || price === null || price === '') {
      return res.status(400).json({ success: false, message: 'Data tidak lengkap' });
    }

    const newTxId = Date.now();
    const txDate = date || new Date().toISOString().split('T')[0];
    const txQty = Number(qty) || 1;
    const txPrice = Number(price);
    const txCashier = (cashier || '').trim() || null;
    const txCost = Number(cost) || 0;

    await pool.query(
      'INSERT INTO transactions (id, userId, name, type, category, price, qty, date, cashier, cost) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
      [newTxId, req.user.id, name, type, category, txPrice, txQty, txDate, txCashier, txCost]
    );

    res.status(201).json({
      success: true,
      data: { id: newTxId, userId: req.user.id, name, type, category, price: txPrice, qty: txQty, date: txDate, cashier: txCashier, cost: txCost }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal menambah transaksi' });
  }
});

app.put('/api/v1/transactions/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, category, price, qty, date, cashier, cost } = req.body;

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
    const updatedCashier = cashier !== undefined ? ((cashier || '').trim() || null) : current.cashier;
    const updatedCost = cost !== undefined ? Number(cost) : current.cost;

    await pool.query(
      'UPDATE transactions SET name = $1, type = $2, category = $3, price = $4, qty = $5, date = $6, cashier = $7, cost = $8 WHERE id = $9 AND userId = $10',
      [updatedName, updatedType, updatedCategory, updatedPrice, updatedQty, updatedDate, updatedCashier, updatedCost, id, req.user.id]
    );

    res.json({ success: true, data: { id: Number(id), userId: req.user.id, name: updatedName, type: updatedType, category: updatedCategory, price: updatedPrice, qty: updatedQty, date: updatedDate, cashier: updatedCashier, cost: updatedCost } });
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

// ================= CATEGORY ENDPOINTS (Kategori Custom, Multi-User) =================
// Kategori DEFAULT (Minuman, Makanan, dll) tetap hardcode di frontend (transactionMeta.js).
// Tabel `categories` ini cuma nyimpen kategori CUSTOM yang ditambahin user sendiri,
// supaya user F&B lama gak butuh migrasi data apa-apa.

const DEFAULT_CATEGORY_NAMES = ['Minuman', 'Makanan', 'Bahan Baku', 'Operasional', 'Lainnya'];
const CATEGORY_COLOR_PALETTE = [
  '#0ea5e9', '#ec4899', '#14b8a6', '#f97316',
  '#8b5cf6', '#ef4444', '#22c55e', '#eab308',
  '#06b6d4', '#d946ef',
];

app.get('/api/v1/categories', verifyToken, async (req, res) => {
  try {
    // Return semua baris: baik kategori custom (ishidden=false) maupun
    // "penanda" kategori default yang disembunyikan user (ishidden=true)
    const result = await pool.query(
      'SELECT * FROM categories WHERE userId = $1 ORDER BY createdAt ASC',
      [req.user.id]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Get Categories Error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data kategori' });
  }
});

app.post('/api/v1/categories', verifyToken, async (req, res) => {
  try {
    const { name } = req.body;
    const trimmed = (name || '').trim();
    if (!trimmed) {
      return res.status(400).json({ success: false, message: 'Nama kategori tidak boleh kosong' });
    }

    const existingRows = await pool.query(
      'SELECT * FROM categories WHERE userId = $1',
      [req.user.id]
    );
    const hiddenDefaultNames = existingRows.rows.filter(r => r.ishidden).map(r => r.name.toLowerCase());
    const visibleCustomRows = existingRows.rows.filter(r => !r.ishidden);
    const customNames = visibleCustomRows.map(r => r.name.toLowerCase());

    const isVisibleDefault = DEFAULT_CATEGORY_NAMES.some(n => n.toLowerCase() === trimmed.toLowerCase())
      && !hiddenDefaultNames.includes(trimmed.toLowerCase());

    if (isVisibleDefault || customNames.includes(trimmed.toLowerCase())) {
      // Sudah ada & masih kelihatan -> anggap sukses, biar frontend tetap bisa langsung pilih kategori ini
      return res.status(200).json({ success: true, data: { name: trimmed, alreadyExists: true } });
    }

    const color = CATEGORY_COLOR_PALETTE[visibleCustomRows.length % CATEGORY_COLOR_PALETTE.length];
    const newCatId = Date.now();
    await pool.query(
      'INSERT INTO categories (id, userId, name, color, ishidden) VALUES ($1, $2, $3, $4, false)',
      [newCatId, req.user.id, trimmed, color]
    );

    res.status(201).json({
      success: true,
      data: { id: newCatId, userId: req.user.id, name: trimmed, color, ishidden: false }
    });
  } catch (error) {
    console.error('Add Category Error:', error);
    res.status(500).json({ success: false, message: 'Gagal menambah kategori' });
  }
});

// Sembunyikan kategori DEFAULT (Minuman, Makanan, dll) khusus untuk user ini.
// Ini bukan hapus permanen dari sistem -- cuma bikin "penanda" per-user, jadi
// gampang dipulihkan lagi (tinggal hapus penandanya lewat DELETE /categories/:id).
app.post('/api/v1/categories/hide-default', verifyToken, async (req, res) => {
  try {
    const { name } = req.body;
    const trimmed = (name || '').trim();
    const isDefault = DEFAULT_CATEGORY_NAMES.some(n => n.toLowerCase() === trimmed.toLowerCase());
    if (!isDefault) {
      return res.status(400).json({ success: false, message: 'Kategori ini bukan kategori default' });
    }

    const existing = await pool.query(
      'SELECT * FROM categories WHERE userId = $1 AND LOWER(name) = LOWER($2) AND ishidden = true',
      [req.user.id, trimmed]
    );
    if (existing.rows.length > 0) {
      return res.json({ success: true, data: existing.rows[0] });
    }

    const newId = Date.now();
    await pool.query(
      'INSERT INTO categories (id, userId, name, color, ishidden) VALUES ($1, $2, $3, $4, true)',
      [newId, req.user.id, trimmed, '']
    );

    res.status(201).json({
      success: true,
      data: { id: newId, userId: req.user.id, name: trimmed, color: '', ishidden: true }
    });
  } catch (error) {
    console.error('Hide Default Category Error:', error);
    res.status(500).json({ success: false, message: 'Gagal menyembunyikan kategori' });
  }
});

app.delete('/api/v1/categories/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM categories WHERE id = $1 AND userId = $2', [id, req.user.id]);
    res.json({ success: true, message: 'Kategori berhasil dihapus' });
  } catch (error) {
    console.error('Delete Category Error:', error);
    res.status(500).json({ success: false, message: 'Gagal menghapus kategori' });
  }
});

// ================= CASHIER ENDPOINTS (Split Shift/Kasir) =================
// Tabel `cashiers` cuma nyimpen DAFTAR NAMA kasir per toko (per userId) -- ini
// BUKAN akun login terpisah. Dipakai buat nge-tag "siapa yang bertugas" di tiap
// transaksi, jadi kalau ada selisih kas gampang dilacak itu transaksi shift siapa.

app.get('/api/v1/cashiers', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM cashiers WHERE userId = $1 ORDER BY createdAt ASC',
      [req.user.id]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Get Cashiers Error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data kasir' });
  }
});

app.post('/api/v1/cashiers', verifyToken, async (req, res) => {
  try {
    const { name } = req.body;
    const trimmed = (name || '').trim();
    if (!trimmed) {
      return res.status(400).json({ success: false, message: 'Nama kasir tidak boleh kosong' });
    }

    const existing = await pool.query(
      'SELECT * FROM cashiers WHERE userId = $1 AND LOWER(name) = LOWER($2)',
      [req.user.id, trimmed]
    );
    if (existing.rows.length > 0) {
      // Sudah ada -> anggap sukses (idempotent), biar frontend tetap bisa langsung pilih nama ini
      return res.status(200).json({ success: true, data: existing.rows[0], alreadyExists: true });
    }

    const newId = Date.now();
    await pool.query(
      'INSERT INTO cashiers (id, userId, name) VALUES ($1, $2, $3)',
      [newId, req.user.id, trimmed]
    );

    res.status(201).json({ success: true, data: { id: newId, userId: req.user.id, name: trimmed } });
  } catch (error) {
    console.error('Add Cashier Error:', error);
    res.status(500).json({ success: false, message: 'Gagal menambah kasir' });
  }
});

app.delete('/api/v1/cashiers/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM cashiers WHERE id = $1 AND userId = $2', [id, req.user.id]);
    res.json({ success: true, message: 'Kasir berhasil dihapus' });
  } catch (error) {
    console.error('Delete Cashier Error:', error);
    res.status(500).json({ success: false, message: 'Gagal menghapus kasir' });
  }
});

// ================= PRODUCT CATALOG ENDPOINTS (Katalog Produk/Menu) =================
// Tabel `products` nyimpen daftar item tetap (menu/produk/pengeluaran rutin) per toko.
// Ini yang dipilih kasir di halaman Catat Transaksi -- nama & harga udah fix,
// jadi gak ada lagi typo/inkonsistensi nama transaksi.

app.get('/api/v1/products', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM products WHERE userId = $1 ORDER BY createdAt ASC',
      [req.user.id]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Get Products Error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data katalog produk' });
  }
});

app.post('/api/v1/products', verifyToken, async (req, res) => {
  try {
    const { name, type, category, price, cost } = req.body;
    const trimmed = (name || '').trim();
    if (!trimmed || !type || price === undefined || price === null || price === '') {
      return res.status(400).json({ success: false, message: 'Nama, tipe, dan harga jual wajib diisi' });
    }

    const newId = Date.now();
    const finalPrice = Number(price);
    const finalCost = Number(cost) || 0;

    await pool.query(
      'INSERT INTO products (id, userId, name, type, category, price, cost) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [newId, req.user.id, trimmed, type, category || 'Lainnya', finalPrice, finalCost]
    );

    res.status(201).json({
      success: true,
      data: { id: newId, userId: req.user.id, name: trimmed, type, category: category || 'Lainnya', price: finalPrice, cost: finalCost }
    });
  } catch (error) {
    console.error('Add Product Error:', error);
    res.status(500).json({ success: false, message: 'Gagal menambah produk' });
  }
});

app.put('/api/v1/products/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, category, price, cost } = req.body;

    const check = await pool.query('SELECT * FROM products WHERE id = $1 AND userId = $2', [id, req.user.id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });
    }

    const current = check.rows[0];
    const updatedName = (name ?? current.name).toString().trim();
    const updatedType = type ?? current.type;
    const updatedCategory = category ?? current.category;
    const updatedPrice = price !== undefined ? Number(price) : current.price;
    const updatedCost = cost !== undefined ? Number(cost) : current.cost;

    await pool.query(
      'UPDATE products SET name = $1, type = $2, category = $3, price = $4, cost = $5 WHERE id = $6 AND userId = $7',
      [updatedName, updatedType, updatedCategory, updatedPrice, updatedCost, id, req.user.id]
    );

    res.json({
      success: true,
      data: { id: Number(id), userId: req.user.id, name: updatedName, type: updatedType, category: updatedCategory, price: updatedPrice, cost: updatedCost }
    });
  } catch (error) {
    console.error('Update Product Error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengubah produk' });
  }
});

app.delete('/api/v1/products/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM products WHERE id = $1 AND userId = $2', [id, req.user.id]);
    res.json({ success: true, message: 'Produk berhasil dihapus' });
  } catch (error) {
    console.error('Delete Product Error:', error);
    res.status(500).json({ success: false, message: 'Gagal menghapus produk' });
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

// Scan Struk/Nota -> Ekstrak item belanja jadi JSON (buat fitur Scan Struk)
app.post('/api/v1/ai/scan-receipt', verifyToken, async (req, res) => {
  try {
    const { image, mimeType } = req.body;
    if (!apiKey) throw new Error("API Key Gemini belum dikonfigurasi");
    if (!image) {
      return res.status(400).json({ success: false, message: 'Gambar struk tidak ditemukan' });
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-3.6-flash',
      generationConfig: { responseMimeType: 'application/json' }
    });

    const prompt = `Kamu adalah asisten yang membaca struk/nota belanja bahan baku untuk UMKM F&B (kafe/warung).
Baca gambar struk ini dan ekstrak SETIAP baris item belanja menjadi JSON array, dengan format PERSIS seperti ini:
[
  { "name": "Nama Barang", "price": 15000, "qty": 1, "category": "Bahan Baku" }
]

Aturan:
- "price" adalah harga TOTAL per baris item (bukan harga satuan), berupa angka Rupiah tanpa titik/koma/simbol, tipe number.
- "qty" adalah jumlah/kuantitas item pada baris tsb, default 1 kalau tidak tertulis jelas.
- "category" tebak salah satu dari daftar ini saja: "Bahan Baku", "Operasional", "Minuman", "Makanan", "Lainnya". Untuk struk belanja bahan baku, defaultnya "Bahan Baku" kecuali jelas terlihat kategori lain.
- Abaikan baris subtotal, PPN/pajak, diskon, biaya layanan, dan total keseluruhan -- hanya ambil baris item barang yang dibeli.
- Kalau gambar tidak jelas, buram, atau bukan struk belanja, kembalikan array kosong [].
- HANYA kembalikan JSON array mentah. Jangan tambahkan teks penjelasan atau markdown code fence apapun.`;

    const result = await model.generateContent([
      { inlineData: { data: image, mimeType: mimeType || 'image/jpeg' } },
      { text: prompt }
    ]);

    let rawText = (result.response.text() || '').trim();
    rawText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();

    let items;
    try {
      items = JSON.parse(rawText);
    } catch (parseErr) {
      console.error('Scan Receipt Parse Error:', parseErr, rawText);
      return res.status(500).json({
        success: false,
        message: 'AI gagal membaca struk ini dengan jelas. Coba foto ulang dengan pencahayaan lebih terang.'
      });
    }

    if (!Array.isArray(items)) items = [];

    const validCategories = ['Bahan Baku', 'Operasional', 'Minuman', 'Makanan', 'Lainnya'];
    const cleanItems = items
      .filter((it) => it && it.name && it.price !== undefined && it.price !== null)
      .map((it) => ({
        name: String(it.name).trim().slice(0, 120),
        price: Math.max(0, Math.round(Number(it.price)) || 0),
        qty: Math.max(1, Math.round(Number(it.qty)) || 1),
        category: validCategories.includes(it.category) ? it.category : 'Bahan Baku',
      }));

    res.json({ success: true, data: cleanItems });
  } catch (err) {
    console.error("Scan Receipt Error Detail:", err);
    res.status(500).json({ success: false, message: err.message || 'Terjadi kesalahan saat scan struk' });
  }
});

// Estimasi Harga Modal & Harga Jual produk baru (dipanggil dari form Tambah
// Produk ke Katalog). Ini PERKIRAAN UMUM dari pengetahuan model soal harga
// pasar rata-rata di Indonesia, BUKAN data harga real-time per daerah/toko --
// user tetap perlu sesuaikan dengan harga bahan baku di tempatnya masing-masing.
app.post('/api/v1/ai/suggest-product-price', verifyToken, async (req, res) => {
  try {
    const { name } = req.body;
    if (!apiKey) throw new Error("API Key Gemini belum dikonfigurasi");

    const trimmed = (name || '').trim();
    if (!trimmed) {
      return res.status(400).json({ success: false, message: 'Nama produk wajib diisi' });
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-3.6-flash',
      generationConfig: { responseMimeType: 'application/json' }
    });

    const prompt = `Kamu adalah konsultan harga untuk UMKM Indonesia lintas jenis usaha -- bisa F&B (kafe/warung makan), toko sembako/kelontong, toko baju/fashion, toko roti/bakery, atau jenis UMKM lain apa saja.

PENTING: nama produk BELUM TENTU makanan/minuman. Tentukan jenis produk berdasarkan MAKNA HARFIAH kata-katanya, JANGAN mengasumsikan F&B kalau gak ada indikasi jelas soal makanan/minuman di namanya. Contoh penentuan jenis produk yang BENAR:
- "Sweater Bangkok" -> pakaian/fashion (BUKAN minuman, walau ada kata asing di namanya)
- "Es Teh" -> minuman F&B
- "Beras 5kg" -> sembako/kelontong
- "Roti Tawar" -> bakery
- "Kaos Polos" -> pakaian/fashion

Untuk produk bernama "${trimmed}":
1. Tentukan dulu jenis produknya secara harfiah (isi field "detected_type", misal "pakaian/fashion" atau "minuman F&B")
2. Hitung "cost": estimasi harga modal per unit/porsi dalam Rupiah, mencakup SEMUA komponen biaya langsung yang relevan untuk jenis produk itu. Contoh:
   * Makanan/minuman siap saji: bahan baku + es batu (kalau minuman dingin) + kemasan (cup/kotak/sedotan)
   * Barang dagangan/retail (sembako, pakaian, dll): harga beli/modal dari supplier atau grosir
   * Roti/kue: bahan baku + kemasan
3. Hitung "price": estimasi harga jual dengan margin REALISTIS sesuai jenis usahanya. Acuan umum UMKM Indonesia:
   * Makanan/minuman siap saji: food cost ratio (cost/price) sekitar 28-33%
   * Sembako/kelontong: margin tipis, markup sekitar 10-20% dari modal
   * Pakaian/fashion: markup sekitar 50-150% dari modal
   * Roti/kue: food cost ratio sekitar 25-35%
4. "note": maksimal 1 kalimat, sebutkan jenis produk yang diasumsikan & komponen biaya yang dihitung.

Balikan HANYA JSON mentah dengan format PERSIS seperti ini, tanpa markdown code fence atau teks lain:
{ "detected_type": "pakaian/fashion", "cost": 45000, "price": 90000, "note": "Diasumsikan pakaian: harga modal dari grosir/supplier." }`;

    const result = await model.generateContent(prompt);
    let rawText = (result.response.text() || '').trim();
    rawText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch (parseErr) {
      console.error('Suggest Price Parse Error:', parseErr, rawText);
      return res.status(500).json({ success: false, message: 'AI gagal memberi estimasi harga. Coba lagi ya.' });
    }

    const cost = Math.max(0, Math.round(Number(parsed.cost)) || 0);
    let price = Math.max(0, Math.round(Number(parsed.price)) || 0);
    const note = String(parsed.note || '').trim().slice(0, 200);

    // Sanity check general (BUKAN maksa rasio F&B ke semua jenis usaha, karena
    // margin sembako/pakaian/F&B beda jauh -- cuma jaga-jaga kalau AI kasih
    // harga jual di bawah/sama modal, yang jelas gak masuk akal buat usaha apapun.
    if (cost > 0 && price <= cost) {
      price = Math.round((cost * 1.3) / 500) * 500; // fallback minimal markup 30%
    }

    res.json({ success: true, data: { cost, price, note } });
  } catch (err) {
    console.error("Suggest Product Price Error Detail:", err);
    res.status(500).json({ success: false, message: err.message || 'Terjadi kesalahan saat estimasi harga' });
  }
});

// Hanya jalankan app.listen saat development lokal (bukan di lingkungan Vercel)
if (!process.env.VERCEL) {
  app.listen(PORT, () => console.log(`Backend berjalan di port ${PORT}`));
}

// WAJIB: Vercel serverless function butuh default export ini
export default app;