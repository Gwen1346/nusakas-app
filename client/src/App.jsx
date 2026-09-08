import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import ReactMarkdown from 'react-markdown';
import { useTransactions } from './hooks/useTransactions';
import { transactionSchema } from './schemas/transactionSchema';
import { 
  LayoutDashboard, Receipt, 
  Plus, Trash2, LogOut, Search,
  TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight,
  Bot, Sparkles, Loader2
} from 'lucide-react';

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || '' });

export default function App() {
  const { transactions, loading, addTx, removeTx } = useTransactions();

  // State Navigation
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // State Form
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [type, setType] = useState('INCOME');
  const [category, setCategory] = useState('Minuman');
  const [isAiCategorizing, setIsAiCategorizing] = useState(false);
  
  // State Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  // State AI Advisor
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // State Errors
  const [errors, setErrors] = useState({});

  const filteredTransactions = transactions.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'ALL' || item.type === filterType;
    return matchesSearch && matchesType;
  });

  const totalIncome = transactions
    .filter((t) => t.type === 'INCOME')
    .reduce((acc, curr) => acc + Number(curr.price) * (curr.qty || 1), 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((acc, curr) => acc + Number(curr.price) * (curr.qty || 1), 0);

  const netProfit = totalIncome - totalExpense;

  // FITUR AI 1: Auto Categorize
  const handleAutoCategorize = async () => {
    if (!name.trim()) return;
    setIsAiCategorizing(true);
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Analisis transaksi kasir berikut: "${name}". 
        Tentukan TIPE ("INCOME" atau "EXPENSE") dan KATEGORI (Pilih salah satu: "Minuman", "Makanan", "Bahan Baku", "Operasional").
        Berikan respon HANYA dalam format JSON valid tanpa markdown, contoh: {"type": "EXPENSE", "category": "Bahan Baku"}`,
      });

      const cleanJson = response.text.replace(/```json|```/g, '').trim();
      const result = JSON.parse(cleanJson);
      
      if (result.type) setType(result.type);
      if (result.category) setCategory(result.category);
    } catch (err) {
      console.error("Gagal melakukan kategorisasi AI:", err);
    } finally {
      setIsAiCategorizing(false);
    }
  };

  // FITUR AI 2: Analisis Cashflow
  const handleAnalyzeCashflow = async () => {
    setIsAnalyzing(true);
    setAiAnalysis('');
    try {
      const promptData = {
        totalIncome,
        totalExpense,
        netProfit,
        transactionCount: transactions.length,
        recentTransactions: transactions.slice(-10),
      };

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Kamu adalah Konsultan Keuangan UMKM profesional untuk aplikasi NusaKas.
        Berikut adalah data keuangan toko saat ini:
        ${JSON.stringify(promptData, null, 2)}

        Berikan analisis singkat, padat, dan praktis dalam format poin-poin:
        1. Evaluasi Kesehatan Kas (Profit/Defisit)
        2. Analisis Potensi Pemborosan / Pengeluaran Terbesar
        3. 2-3 Saran Strategi Bisnis Konkret untuk meningkatkan keuntungan minggu ini.
        Gunakan bahasa Indonesia yang ramah dan suportif!`,
      });

      setAiAnalysis(response.text);
    } catch (err) {
      setAiAnalysis("Gagal terhubung dengan NusaKas AI Advisor. Pastikan API Key valid.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formData = {
      name,
      price: price === '' ? NaN : Number(price),
      type,
      category,
    };

    const validationResult = transactionSchema.safeParse(formData);

    if (!validationResult.success) {
      const formattedErrors = {};
      validationResult.error.issues.forEach((issue) => {
        formattedErrors[issue.path[0]] = issue.message;
      });
      setErrors(formattedErrors);
      return;
    }

    setErrors({});
    const success = await addTx({ ...formData, qty: 1 });

    if (success) {
      setName('');
      setPrice('');
    }
  };

  const handleDelete = (id, txName) => {
    const isConfirmed = window.confirm(`Apakah Anda yakin ingin menghapus transaksi "${txName}"?`);
    if (isConfirmed) {
      removeTx(id);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Apakah Anda yakin ingin keluar dari aplikasi NusaKas?')) {
      alert('Sesi Anda telah berakhir.');
      window.location.reload();
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 font-sans text-slate-800">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between p-5 shrink-0 h-full">
        <div>
          {/* BRANDING LOGO */}
          <div className="flex items-center gap-3 px-1 mb-8">
            <svg viewBox="0 0 400 400" className="w-10 h-10 shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10B981" />
                  <stop offset="100%" stopColor="#047857" />
                </linearGradient>
                <linearGradient id="foldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#E6F4EA" />
                  <stop offset="100%" stopColor="#A7F3D0" />
                </linearGradient>
              </defs>
              <rect x="40" y="40" width="320" height="320" rx="80" fill="url(#bgGrad)" />
              <g transform="translate(110, 110)">
                <rect x="0" y="0" width="45" height="180" rx="22.5" fill="#FFFFFF" />
                <path d="M 22.5 0 L 157.5 157.5 C 168 168 158 180 142 180 L 110 180 Z" fill="#FFFFFF" />
                <rect x="125" y="45" width="45" height="135" rx="22.5" fill="#FFFFFF" />
                <path d="M 125 45 C 125 15, 170 15, 170 45 L 170 110 C 170 125, 125 110, 125 90 Z" fill="url(#foldGrad)" />
              </g>
            </svg>
            <div>
              <div className="font-extrabold text-lg leading-none tracking-tight">
                <span className="text-[#064E3B]">Nusa</span>
                <span className="text-[#10B981]">Kas</span>
              </div>
              <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">POS & Fintech</span>
            </div>
          </div>

          <nav className="space-y-1">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-3 w-full px-4 py-3 font-semibold rounded-xl text-sm transition ${
                activeTab === 'dashboard' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <LayoutDashboard size={18} /> Dashboard
            </button>
            <button 
              onClick={() => setActiveTab('laporan')}
              className={`flex items-center gap-3 w-full px-4 py-3 font-semibold rounded-xl text-sm transition ${
                activeTab === 'laporan' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <Receipt size={18} /> Laporan Kas
            </button>
            <button 
              onClick={() => setActiveTab('ai-advisor')}
              className={`flex items-center gap-3 w-full px-4 py-3 font-semibold rounded-xl text-sm transition ${
                activeTab === 'ai-advisor' ? 'bg-emerald-50 text-emerald-600 font-bold' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <Bot size={18} className="text-emerald-600" /> AI Advisor <Sparkles size={14} className="text-amber-400" />
            </button>
          </nav>
        </div>

        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 text-rose-500 hover:bg-rose-50 font-semibold rounded-xl text-sm transition mt-auto"
        >
          <LogOut size={18} /> Keluar
        </button>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto p-8 h-full">
        
        {/* TAMPILAN DASHBOARD */}
        {activeTab === 'dashboard' && (
          <>
            <header className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Dashboard Kasir</h1>
                <p className="text-sm text-slate-400">Kelola arus kas & transaksi UMKM</p>
              </div>
              <span className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full font-bold">
                ● Server Connected (Port 5000)
              </span>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                <p className="text-xs font-bold text-slate-400 uppercase">Pemasukan</p>
                <p className="text-2xl font-black text-emerald-600 mt-1">Rp {totalIncome.toLocaleString('id-ID')}</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                <p className="text-xs font-bold text-slate-400 uppercase">Pengeluaran</p>
                <p className="text-2xl font-black text-rose-600 mt-1">Rp {totalExpense.toLocaleString('id-ID')}</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                <p className="text-xs font-bold text-slate-400 uppercase">Net Profit</p>
                <p className={`text-2xl font-black mt-1 ${netProfit >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                  Rp {netProfit.toLocaleString('id-ID')}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-slate-900">+ Tambah Transaksi</h2>
                  <button 
                    type="button" 
                    onClick={handleAutoCategorize}
                    disabled={isAiCategorizing || !name}
                    className="text-xs text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition disabled:opacity-50"
                  >
                    {isAiCategorizing ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} AI Auto-Fill
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Nama Transaksi</label>
                    <input 
                      type="text" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)}
                      onBlur={handleAutoCategorize}
                      placeholder="Contoh: Beli Kopi Arabika 1kg" 
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                    {errors.name && <p className="text-xs text-rose-500 mt-1 font-medium">{errors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Nominal (Rp)</label>
                    <input 
                      type="number" 
                      value={price} 
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="18000" 
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                    {errors.price && <p className="text-xs text-rose-500 mt-1 font-medium">{errors.price}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Tipe</label>
                      <select 
                        value={type} 
                        onChange={(e) => setType(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
                      >
                        <option value="INCOME">Income</option>
                        <option value="EXPENSE">Expense</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Kategori</label>
                      <select 
                        value={category} 
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
                      >
                        <option value="Minuman">Minuman</option>
                        <option value="Makanan">Makanan</option>
                        <option value="Bahan Baku">Bahan Baku</option>
                        <option value="Operasional">Operasional</option>
                      </select>
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition"
                  >
                    <Plus size={18} /> Simpan Transaksi
                  </button>
                </form>
              </div>

              <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <h2 className="text-base font-bold text-slate-900">Riwayat Transaksi</h2>
                  
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="Cari transaksi..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                    
                    <select 
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600"
                    >
                      <option value="ALL">Semua Tipe</option>
                      <option value="INCOME">Income</option>
                      <option value="EXPENSE">Expense</option>
                    </select>
                  </div>
                </div>

                {loading ? (
                  <p className="text-sm text-slate-400 py-8 text-center">Memuat data...</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-400 text-xs uppercase font-semibold">
                          <th className="pb-3">Nama</th>
                          <th className="pb-3">Kategori</th>
                          <th className="pb-3">Tipe</th>
                          <th className="pb-3">Nominal</th>
                          <th className="pb-3 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredTransactions.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="py-6 text-center text-xs text-slate-400">
                              Tidak ada transaksi yang cocok.
                            </td>
                          </tr>
                        ) : (
                          filteredTransactions.map((item) => (
                            <tr key={item.id}>
                              <td className="py-3 font-bold text-slate-900">{item.name}</td>
                              <td className="py-3 text-slate-500">{item.category}</td>
                              <td className="py-3">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                  item.type === 'INCOME' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                                }`}>
                                  {item.type}
                                </span>
                              </td>
                              <td className={`py-3 font-extrabold ${
                                item.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'
                              }`}>
                                {item.type === 'INCOME' ? '+' : '-'} Rp {Number(item.price).toLocaleString('id-ID')}
                              </td>
                              <td className="py-3 text-right">
                                <button 
                                  onClick={() => handleDelete(item.id, item.name)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                  title="Hapus Transaksi"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* TAMPILAN LAPORAN KAS */}
        {activeTab === 'laporan' && (
          <div>
            <header className="mb-8">
              <h1 className="text-2xl font-bold text-slate-900">Laporan Kas & Keuangan</h1>
              <p className="text-sm text-slate-400">Ringkasan rinci performa transaksi dan statistik toko</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Total Pemasukan</p>
                  <p className="text-2xl font-black text-emerald-600 mt-1">Rp {totalIncome.toLocaleString('id-ID')}</p>
                </div>
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><TrendingUp size={24} /></div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Total Pengeluaran</p>
                  <p className="text-2xl font-black text-rose-600 mt-1">Rp {totalExpense.toLocaleString('id-ID')}</p>
                </div>
                <div className="p-3 bg-rose-50 text-rose-600 rounded-xl"><TrendingDown size={24} /></div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Laba Bersih (Net)</p>
                  <p className={`text-2xl font-black mt-1 ${netProfit >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                    Rp {netProfit.toLocaleString('id-ID')}
                  </p>
                </div>
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Wallet size={24} /></div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Rincian Arus Kas</h2>
              <div className="space-y-3">
                {transactions.map((t) => (
                  <div key={t.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${t.type === 'INCOME' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                        {t.type === 'INCOME' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{t.name}</p>
                        <p className="text-xs text-slate-400">{t.category}</p>
                      </div>
                    </div>
                    <p className={`font-black text-sm ${t.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {t.type === 'INCOME' ? '+' : '-'} Rp {Number(t.price).toLocaleString('id-ID')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAMPILAN AI ADVISOR */}
        {activeTab === 'ai-advisor' && (
          <div className="max-w-4xl">
            <header className="mb-8">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-200">
                  <Bot size={28} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    NusaKas AI Advisor <Sparkles className="text-amber-400" size={20} />
                  </h1>
                  <p className="text-sm text-slate-400">Analisis otomatis performa kas & saran pertumbuhan bisnis UMKM</p>
                </div>
              </div>
            </header>

            <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between mb-6 pb-6 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Analisis Keuangan Real-Time</h2>
                  <p className="text-xs text-slate-400">AI akan membaca {transactions.length} data transaksi Anda saat ini.</p>
                </div>
                <button 
                  onClick={handleAnalyzeCashflow}
                  disabled={isAnalyzing || transactions.length === 0}
                  className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm flex items-center gap-2 transition disabled:opacity-50"
                >
                  {isAnalyzing ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                  {isAnalyzing ? 'Menganalisis...' : 'Mulai Analisis AI'}
                </button>
              </div>

              {aiAnalysis ? (
                <div className={`p-6 rounded-xl border text-sm leading-relaxed max-w-none ${
                  aiAnalysis.includes('Gagal') 
                    ? 'bg-rose-50 border-rose-200 text-rose-700 font-medium' 
                    : 'bg-emerald-50/50 border-emerald-100 text-slate-700 prose prose-emerald'
                }`}>
                  <ReactMarkdown>{aiAnalysis}</ReactMarkdown>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <Bot size={48} className="mx-auto mb-3 text-slate-300" />
                  <p className="text-sm font-medium">
                    Klik tombol <strong className="text-slate-700">"Mulai Analisis AI"</strong> untuk mendapatkan masukan strategi bisnis dari Gemini AI.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

      </main>

    </div>
  );
}