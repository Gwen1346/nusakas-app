import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import ReactMarkdown from 'react-markdown';
import { useTransactions } from './hooks/useTransactions';
import { transactionSchema } from './schemas/transactionSchema';
import { 
  LayoutDashboard, Receipt, 
  Plus, Trash2, LogOut, Search,
  TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight,
  Bot, Sparkles, Loader2, Send, Target, Lightbulb, MessageSquarePlus, MessageSquare
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

  // State Management Multi-Session Chatbot (Nusa)
  const [chatSessions, setChatSessions] = useState(() => {
    const savedSessions = localStorage.getItem('nusakas_chat_sessions');
    if (savedSessions) {
      try { 
        const parsed = JSON.parse(savedSessions);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) { 
        console.error("Gagal memuat riwayat sesi chat:", e); 
      }
    }
    const defaultId = Date.now().toString();
    return [{
      id: defaultId,
      title: 'Percakapan Baru',
      messages: [{ sender: 'nusa', text: 'Halo! Aku **Nusa**, asisten keuangan pribadi toko kamu! 🚀 Ada yang bisa Nusa bantu hari ini?' }]
    }];
  });

  const [activeSessionId, setActiveSessionId] = useState(() => {
    return chatSessions[0]?.id || Date.now().toString();
  });

  const [inputChat, setInputChat] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef(null);
  const chatSessionRef = useRef(null);

  // State Errors Form
  const [errors, setErrors] = useState({});

  const currentSession = chatSessions.find(s => s.id === activeSessionId) || chatSessions[0];

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

  useEffect(() => {
    localStorage.setItem('nusakas_chat_sessions', JSON.stringify(chatSessions));
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatSessions, activeSessionId]);

  useEffect(() => {
    if (!currentSession) return;
    try {
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-3.6-flash',
        systemInstruction: `Nama kamu Nusa, asisten keuangan UMKM POS NusaKas. Jawablah dengan ringkas, ramah, padat, langsung ke poin utama, dan gunakan format markdown sederhana yang rapi.`
      });

      const formattedHistory = currentSession.messages
        .filter((_, index) => index > 0)
        .map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        }));

      chatSessionRef.current = model.startChat({ history: formattedHistory });
    } catch (err) {
      console.error("Gagal inisialisasi sesi chat Nusa:", err);
    }
  }, [activeSessionId]);

  const handleCreateNewChat = () => {
    const newId = Date.now().toString();
    const newSession = {
      id: newId,
      title: 'Percakapan Baru',
      messages: [{ sender: 'nusa', text: 'Halo! Aku **Nusa**, asisten keuangan pribadi toko kamu! 🚀 Ada yang bisa Nusa bantu hari ini?' }]
    };
    setChatSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newId);
  };

  const handleDeleteSession = (id, e) => {
    e.stopPropagation();
    if (chatSessions.length === 1) {
      handleCreateNewChat();
      return;
    }
    const updated = chatSessions.filter(s => s.id !== id);
    setChatSessions(updated);
    if (activeSessionId === id) {
      setActiveSessionId(updated[0].id);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputChat.trim() || isChatLoading) return;

    const userText = inputChat;
    setInputChat('');

    setChatSessions(prev => prev.map(s => {
      if (s.id === activeSessionId) {
        const isFirstUserMsg = s.messages.filter(m => m.sender === 'user').length === 0;
        const newTitle = isFirstUserMsg ? (userText.length > 22 ? userText.substring(0, 22) + '...' : userText) : s.title;
        return {
          ...s,
          title: newTitle,
          messages: [...s.messages, { sender: 'user', text: userText }]
        };
      }
      return s;
    }));

    setIsChatLoading(true);

    try {
      if (!chatSessionRef.current) {
        const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
        chatSessionRef.current = model.startChat();
      }

      const promptWithContext = `[Kas Toko -> Income: Rp${totalIncome}, Expense: Rp${totalExpense}, Profit: Rp${netProfit}]\nPertanyaan: ${userText}`;
      const result = await chatSessionRef.current.sendMessage(promptWithContext);
      const responseText = result.response.text();

      setChatSessions(prev => prev.map(s => {
        if (s.id === activeSessionId) {
          return { ...s, messages: [...s.messages, { sender: 'nusa', text: responseText }] };
        }
        return s;
      }));
    } catch (err) {
      console.error(err);
      setChatSessions(prev => prev.map(s => {
        if (s.id === activeSessionId) {
          return { ...s, messages: [...s.messages, { sender: 'nusa', text: 'Maaf, sambungan Nusa terputus. Coba tanyakan lagi!' }] };
        }
        return s;
      }));
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleAutoCategorize = async () => {
    if (!name.trim()) return;
    setIsAiCategorizing(true);
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
      const prompt = `Analisis nama transaksi ini: "${name}". Tentukan TIPE ("INCOME" atau "EXPENSE") dan KATEGORI ("Minuman", "Makanan", "Bahan Baku", "Operasional"). Berikan JSON valid saja: {"type": "EXPENSE", "category": "Bahan Baku"}`;
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

  const handleAnalyzeCashflow = async () => {
    setIsAnalyzing(true);
    setAiAnalysis('');
    try {
      const promptData = { totalIncome, totalExpense, netProfit, transactionCount: transactions.length, recentTransactions: transactions.slice(-10) };
      const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
      const prompt = `Konsultan Keuangan UMKM POS NusaKas. Analisis data kas: ${JSON.stringify(promptData)}. Berikan ringkasan singkat status kas, potensi pemborosan, dan 2 saran aksi cepat.`;
      const result = await model.generateContent(prompt);
      setAiAnalysis(result.response.text());
    } catch (err) {
      console.error(err);
      setAiAnalysis("Gagal terhubung dengan Nusa.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCalculateTarget = async () => {
    if (!targetAmount) return;
    setIsCalculatingTarget(true);
    setTargetResult('');
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
      const prompt = `Asisten bisnis. Target Laba: Rp ${Number(targetAmount).toLocaleString('id-ID')}. Kas: Pemasukan Rp ${totalIncome}, Pengeluaran Rp ${totalExpense}. Berikan estimasi porsi/cup terjual per hari dan rekomendasi promo singkat.`;
      const result = await model.generateContent(prompt);
      setTargetResult(result.response.text());
    } catch (err) {
      console.error(err);
      setTargetResult("Gagal menghitung target.");
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
      
      {/* SIDEBAR UTAMA */}
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
          <div className="max-w-7xl mx-auto space-y-6">
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

            {/* LAYOUT CHATBOX UTAMA: SIDEBAR CHAT (KIRI) & CHAT ROOM (KANAN) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden p-4 min-h-[580px]">
              
              {/* Sidebar Riwayat Sesi Chat */}
              <div className="md:col-span-4 lg:col-span-3 border-r border-slate-100 pr-4 flex flex-col justify-between">
                <div>
                  <button 
                    onClick={handleCreateNewChat}
                    className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-2 transition shadow-sm mb-4"
                  >
                    <MessageSquarePlus size={16} /> Chat Baru
                  </button>

                  <p className="text-[10px] font-bold text-slate-400 uppercase px-2 mb-2">Riwayat Percakapan</p>
                  <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
                    {chatSessions.map((session) => (
                      <div 
                        key={session.id}
                        onClick={() => setActiveSessionId(session.id)}
                        className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer text-xs transition ${
                          session.id === activeSessionId 
                            ? 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-100' 
                            : 'text-slate-600 hover:bg-slate-50 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <MessageSquare size={14} className="shrink-0 text-slate-400 group-hover:text-emerald-600" />
                          <span className="truncate">{session.title}</span>
                        </div>
                        <button 
                          onClick={(e) => handleDeleteSession(session.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 rounded transition"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between px-2">
                  <span>Model Aktif</span>
                  <span className="font-bold text-emerald-600">Gemini 3.6 Flash</span>
                </div>
              </div>

              {/* Ruang Chat Utama */}
              <div className="md:col-span-8 lg:col-span-9 flex flex-col h-[560px]">
                <div className="pb-3 border-b border-slate-100 flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="font-bold text-xs text-slate-800 truncate">
                      {currentSession?.title}
                    </span>
                  </div>
                </div>

                {/* Daftar Pesan */}
                <div className="flex-1 overflow-y-auto pr-2 space-y-3 mb-3">
                  {currentSession?.messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-4 rounded-2xl text-xs leading-relaxed ${
                        msg.sender === 'user' 
                          ? 'bg-emerald-600 text-white rounded-br-none font-medium' 
                          : 'bg-slate-50 border border-slate-100 text-slate-800 rounded-bl-none'
                      }`}>
                        <ReactMarkdown components={markdownComponents}>{msg.text}</ReactMarkdown>
                      </div>
                    </div>
                  ))}
                  {isChatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl rounded-bl-none text-xs text-slate-400 flex items-center gap-2">
                        <Loader2 size={14} className="animate-spin text-emerald-600" /> Nusa sedang meracik jawaban...
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Form Input Chat */}
                <form onSubmit={handleSendMessage} className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <input 
                    type="text" 
                    value={inputChat}
                    onChange={(e) => setInputChat(e.target.value)}
                    placeholder="Tanya Nusa tentang keuangan toko atau strategi promo..."
                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <button 
                    type="submit"
                    disabled={!inputChat.trim() || isChatLoading}
                    className="p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl transition disabled:opacity-50 shrink-0 shadow-sm"
                  >
                    <Send size={16} />
                  </button>
                </form>
              </div>

            </div>

            {/* GRID FITUR PENDUKUNG (KALKULATOR & AUDIT) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
              
              {/* Kalkulator Target */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
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
                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <button 
                    onClick={handleCalculateTarget}
                    disabled={isCalculatingTarget || !targetAmount}
                    className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl flex items-center gap-1.5 transition disabled:opacity-50 shadow-sm"
                  >
                    {isCalculatingTarget ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} Hitung Target
                  </button>
                </div>

                {targetResult && (
                  <div className="p-4 bg-emerald-50/60 border border-emerald-100 rounded-2xl text-xs text-slate-700 leading-relaxed">
                    <ReactMarkdown components={markdownComponents}>{targetResult}</ReactMarkdown>
                  </div>
                )}
              </div>

              {/* Audit Laporan Kas */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-emerald-600">
                    <Lightbulb size={20} />
                    <h2 className="font-bold text-slate-900 text-base">Audit Laporan Kas</h2>
                  </div>
                  <button 
                    onClick={handleAnalyzeCashflow}
                    disabled={isAnalyzing || transactions.length === 0}
                    className="text-xs text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-2 rounded-xl font-bold transition disabled:opacity-50"
                  >
                    {isAnalyzing ? 'Menganalisis...' : 'Audit Otomatis'}
                  </button>
                </div>

                {aiAnalysis ? (
                  <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl text-xs text-slate-700 leading-relaxed max-h-40 overflow-y-auto">
                    <ReactMarkdown components={markdownComponents}>{aiAnalysis}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 text-center py-6">
                    Klik "Audit Otomatis" untuk ringkasan performa keuangan lengkap.
                  </p>
                )}
              </div>

            </div>
          </div>
        )}

      </main>

    </div>
  );
}