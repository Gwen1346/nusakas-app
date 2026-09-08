import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import ReactMarkdown from 'react-markdown';
import { useTransactions } from './hooks/useTransactions';
import { transactionSchema } from './schemas/transactionSchema';
import { 
  LayoutDashboard, Receipt, 
  Plus, Trash2, LogOut, Search,
  TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight,
  Bot, Sparkles, Loader2, Send, Target, Lightbulb, RefreshCw
} from 'lucide-react';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');

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

  // State AI Features
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [targetAmount, setTargetAmount] = useState('1000000');
  const [targetResult, setTargetResult] = useState('');
  const [isCalculatingTarget, setIsCalculatingTarget] = useState(false);

  // State Chatbot (Nusa) dengan Persistent Storage (localStorage)
  const [messages, setMessages] = useState(() => {
    const savedChat = localStorage.getItem('nusakas_chat_history');
    return savedChat ? JSON.parse(savedChat) : [
      { 
        sender: 'nusa', 
        text: 'Halo! Aku **Nusa**, asisten keuangan pribadi toko kamu! 🚀 Ada yang bisa Nusa bantu hari ini?' 
      }
    ];
  });
  
  const [inputChat, setInputChat] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Ref untuk menyimpan instance Sesi Chat Gemini (Bikin respon super cepat)
  const chatSessionRef = useRef(null);

  // State Errors Form
  const [errors, setErrors] = useState({});

  // Hitung Arus Kas
  const totalIncome = transactions
    .filter((t) => t.type === 'INCOME')
    .reduce((acc, curr) => acc + Number(curr.price) * (curr.qty || 1), 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((acc, curr) => acc + Number(curr.price) * (curr.qty || 1), 0);

  const netProfit = totalIncome - totalExpense;

  const filteredTransactions = transactions.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'ALL' || item.type === filterType;
    return matchesSearch && matchesType;
  });

  // Simpan riwayat chat ke localStorage setiap kali pesan bertambah & Auto Scroll
  useEffect(() => {
    localStorage.setItem('nusakas_chat_history', JSON.stringify(messages));
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Inisialisasi Sesi Chat Gemini (startChat) saat komponen dimuat
  useEffect(() => {
    try {
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-3.6-flash',
        systemInstruction: `Nama kamu Nusa, asisten keuangan UMKM POS NusaKas. Jawablah dengan ringkas, ramah, padat, langsung ke poin utama, dan gunakan format markdown sederhana yang rapi.`
      });

      // Format riwayat chat lama ke format SDK Gemini
      const formattedHistory = messages
        .filter((_, index) => index > 0)
        .map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        }));

      chatSessionRef.current = model.startChat({ history: formattedHistory });
    } catch (err) {
      console.error("Gagal inisialisasi sesi chat Nusa:", err);
    }
  }, []);

  // FITUR AI 1: Send Message Chatbot Nusa (Fast Response)
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputChat.trim() || isChatLoading) return;

    const userText = inputChat;
    setInputChat('');
    setMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setIsChatLoading(true);

    try {
      if (!chatSessionRef.current) {
        const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
        chatSessionRef.current = model.startChat();
      }

      // Kirim konteks transaksi singkat bersama pesan pengguna
      const promptWithContext = `[Konteks Kas Toko -> Pemasukan: Rp${totalIncome}, Pengeluaran: Rp${totalExpense}, Profit Net: Rp${netProfit}]\nPertanyaan Pengguna: ${userText}`;
      
      const result = await chatSessionRef.current.sendMessage(promptWithContext);
      setMessages((prev) => [...prev, { sender: 'nusa', text: result.response.text() }]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [...prev, { sender: 'nusa', text: 'Maaf, sambungan Nusa terputus. Coba tanyakan lagi!' }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Hapus Riwayat Chat
  const handleClearChat = () => {
    if (window.confirm('Hapus semua riwayat chat dengan Nusa?')) {
      const defaultMsg = [{ 
        sender: 'nusa', 
        text: 'Halo! Aku **Nusa**, asisten keuangan pribadi toko kamu! 🚀 Ada yang bisa Nusa bantu hari ini?' 
      }];
      setMessages(defaultMsg);
      localStorage.removeItem('nusakas_chat_history');
      
      const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
      chatSessionRef.current = model.startChat();
    }
  };

  // FITUR AI 2: Auto Categorize Input Transaksi
  const handleAutoCategorize = async () => {
    if (!name.trim()) return;
    setIsAiCategorizing(true);
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
      const prompt = `Analisis nama transaksi ini: "${name}". 
      Tentukan TIPE ("INCOME" atau "EXPENSE") dan KATEGORI (Pilih salah satu: "Minuman", "Makanan", "Bahan Baku", "Operasional").
      Hanya berikan JSON valid tanpa markdown, contoh: {"type": "EXPENSE", "category": "Bahan Baku"}`;

      const result = await model.generateContent(prompt);
      const cleanJson = result.response.text().replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      
      if (parsed.type) setType(parsed.type);
      if (parsed.category) setCategory(parsed.category);
    } catch (err) {
      console.error("Gagal auto categorize:", err);
    } finally {
      setIsAiCategorizing(false);
    }
  };

  // FITUR AI 3: Audit Laporan Kas
  const handleAnalyzeCashflow = async () => {
    setIsAnalyzing(true);
    setAiAnalysis('');
    try {
      const promptData = { totalIncome, totalExpense, netProfit, transactionCount: transactions.length, recentTransactions: transactions.slice(-10) };
      const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
      const prompt = `Kamu adalah Nusa, Konsultan Keuangan UMKM POS NusaKas.
      Analisis data kas berikut: ${JSON.stringify(promptData, null, 2)}
      Berikan ringkasan audit singkat meliputi:
      - Status Kesehatan Kas
      - Potensi Pemborosan / Pengeluaran Terbesar
      - 2 Saran Aksi Cepat Minggu Ini`;

      const result = await model.generateContent(prompt);
      setAiAnalysis(result.response.text());
    } catch (err) {
      console.error(err);
      setAiAnalysis("Gagal terhubung dengan Nusa. Coba lagi beberapa saat lagi.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // FITUR AI 4: Kalkulator Target Profit
  const handleCalculateTarget = async () => {
    if (!targetAmount) return;
    setIsCalculatingTarget(true);
    setTargetResult('');
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
      const prompt = `Kamu adalah Nusa, asisten bisnis UMKM. 
      Target Laba Bersih yang diinginkan: Rp ${Number(targetAmount).toLocaleString('id-ID')}.
      Data Kas Toko: Pemasukan Rp ${totalIncome}, Pengeluaran Rp ${totalExpense}.
      
      Berikan estimasi ringkas (maksimal 3 poin):
      - Estimasi porsi/cup terjual per hari.
      - Rekomendasi strategi bundling/promo cepat.`;

      const result = await model.generateContent(prompt);
      setTargetResult(result.response.text());
    } catch (err) {
      console.error(err);
      setTargetResult("Gagal menghitung target. Pastikan nominal angka valid.");
    } finally {
      setIsCalculatingTarget(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = { name, price: price === '' ? NaN : Number(price), type, category };
    const validationResult = transactionSchema.safeParse(formData);

    if (!validationResult.success) {
      const formattedErrors = {};
      validationResult.error.issues.forEach((issue) => { formattedErrors[issue.path[0]] = issue.message; });
      setErrors(formattedErrors);
      return;
    }

    setErrors({});
    const success = await addTx({ ...formData, qty: 1 });
    if (success) { setName(''); setPrice(''); }
  };

  const handleDelete = (id, txName) => {
    if (window.confirm(`Hapus transaksi "${txName}"?`)) removeTx(id);
  };

  const handleLogout = () => {
    if (window.confirm('Keluar dari NusaKas?')) { window.location.reload(); }
  };

  // Komponen khusus pemicu kustom visual Markdown
  const markdownComponents = {
    h1: ({node, ...props}) => <h1 className="text-sm font-bold text-slate-900 mt-2 mb-1" {...props} />,
    h2: ({node, ...props}) => <h2 className="text-xs font-bold text-slate-900 mt-2 mb-1" {...props} />,
    p: ({node, ...props}) => <p className="mb-1.5 last:mb-0" {...props} />,
    ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-2 space-y-0.5" {...props} />,
    ol: ({node, ...props}) => <ol className="list-decimal pl-4 mb-2 space-y-0.5" {...props} />,
    li: ({node, ...props}) => <li className="pl-0.5" {...props} />,
    strong: ({node, ...props}) => <strong className="font-bold text-slate-900" {...props} />,
    hr: ({node, ...props}) => <hr className="my-2 border-slate-200" {...props} />,
    code: ({node, inline, ...props}) => 
      inline 
        ? <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px] font-mono" {...props} />
        : <code className="block bg-slate-800 text-emerald-400 p-2 rounded-lg text-[11px] font-mono overflow-x-auto my-2" {...props} />
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 font-sans text-slate-800">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between p-5 shrink-0 h-full">
        <div>
          <div className="flex items-center gap-3 px-1 mb-8">
            <svg viewBox="0 0 400 400" className="w-10 h-10 shrink-0" fill="none">
              <defs>
                <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10B981" />
                  <stop offset="100%" stopColor="#047857" />
                </linearGradient>
              </defs>
              <rect x="40" y="40" width="320" height="320" rx="80" fill="url(#bgGrad)" />
              <path d="M 130 110 L 270 270 M 270 110 L 130 270" stroke="#FFFFFF" strokeWidth="40" strokeLinecap="round" />
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
              <Bot size={18} className="text-emerald-600" /> Tanya Nusa <Sparkles size={14} className="text-amber-400" />
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
                ● Server Connected
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
              <p className="text-sm text-slate-400">Ringkasan rinci performa transaksi toko</p>
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

        {/* TAMPILAN AI ADVISOR (TANYA NUSA) */}
        {activeTab === 'ai-advisor' && (
          <div className="max-w-5xl space-y-8">
            <header className="flex items-center gap-3">
              <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-200">
                <Bot size={28} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                  Tanya Nusa <Sparkles className="text-amber-400" size={20} />
                </h1>
                <p className="text-sm text-slate-400">Asisten bisnis cerdas & kalkulator proyeksi keuangan toko</p>
              </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* INTERACTIVE CHATBOT (NUSA) */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col h-[530px]">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="font-bold text-sm text-slate-800">NusaBot Chat</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      type="button" 
                      onClick={handleClearChat}
                      className="text-[11px] text-slate-400 hover:text-rose-500 font-semibold transition px-2 py-1 rounded-md hover:bg-rose-50"
                    >
                      Hapus Chat
                    </button>
                    <span className="text-[10px] bg-emerald-100 text-emerald-700 font-extrabold px-2 py-0.5 rounded-md">Online</span>
                  </div>
                </div>

                {/* CONTAINER MESAGE LIST */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                        msg.sender === 'user' 
                          ? 'bg-emerald-600 text-white rounded-br-none font-medium' 
                          : 'bg-slate-100 text-slate-800 rounded-bl-none'
                      }`}>
                        <ReactMarkdown components={markdownComponents}>{msg.text}</ReactMarkdown>
                      </div>
                    </div>
                  ))}
                  {isChatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-slate-100 p-3 rounded-2xl rounded-bl-none text-xs text-slate-400 flex items-center gap-2">
                        <Loader2 size={14} className="animate-spin text-emerald-600" /> Nusa sedang berpikir...
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* FORM INPUT CHAT */}
                <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-100 flex items-center gap-2">
                  <input 
                    type="text" 
                    value={inputChat}
                    onChange={(e) => setInputChat(e.target.value)}
                    placeholder="Tanya Nusa (misal: kasih ide promo harian)..."
                    className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <button 
                    type="submit"
                    disabled={!inputChat.trim() || isChatLoading}
                    className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition disabled:opacity-50 shrink-0"
                  >
                    <Send size={16} />
                  </button>
                </form>
              </div>

              {/* FITUR SAMPINGAN (KALKULATOR & AUDIT) */}
              <div className="space-y-6">
                
                {/* KALKULATOR TARGET OMZET */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
                  <div className="flex items-center gap-2 mb-3 text-emerald-600">
                    <Target size={20} />
                    <h2 className="font-bold text-slate-900 text-base">Kalkulator Target Keuntungan</h2>
                  </div>
                  <p className="text-xs text-slate-400 mb-4">
                    Masukkan target laba bersih toko kamu, Nusa akan meracik strategi penjualannya!
                  </p>

                  <div className="flex items-center gap-2 mb-4">
                    <input 
                      type="number"
                      value={targetAmount}
                      onChange={(e) => setTargetAmount(e.target.value)}
                      placeholder="Masukkan nominal target"
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                    <button 
                      onClick={handleCalculateTarget}
                      disabled={isCalculatingTarget || !targetAmount}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition disabled:opacity-50"
                    >
                      {isCalculatingTarget ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} Hitung Target
                    </button>
                  </div>

                  {targetResult && (
                    <div className="p-4 bg-emerald-50/60 border border-emerald-100 rounded-xl text-xs text-slate-700 leading-relaxed">
                      <ReactMarkdown components={markdownComponents}>{targetResult}</ReactMarkdown>
                    </div>
                  )}
                </div>

                {/* AUDIT LAPORAN KAS */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-emerald-600">
                      <Lightbulb size={20} />
                      <h2 className="font-bold text-slate-900 text-base">Audit Laporan Kas</h2>
                    </div>
                    <button 
                      onClick={handleAnalyzeCashflow}
                      disabled={isAnalyzing || transactions.length === 0}
                      className="text-xs text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg font-bold transition disabled:opacity-50"
                    >
                      {isAnalyzing ? 'Menganalisis...' : 'Audit Otomatis'}
                    </button>
                  </div>

                  {aiAnalysis ? (
                    <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl text-xs text-slate-700 leading-relaxed max-h-40 overflow-y-auto">
                      <ReactMarkdown components={markdownComponents}>{aiAnalysis}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-4">
                      Klik "Audit Otomatis" untuk ringkasan performa keuangan lengkap.
                    </p>
                  )}
                </div>

              </div>

            </div>
          </div>
        )}

      </main>

    </div>
  );
}