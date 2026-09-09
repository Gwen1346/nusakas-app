// src/components/AiAdvisorTab.jsx
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import ReactMarkdown from 'react-markdown';
import { Send, Sparkles, MessageSquarePlus, MessageSquare, Trash2, Target, Lightbulb, Bot, Loader2, Zap } from 'lucide-react';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');

export function AiAdvisorTab({ kasir }) {
  const transactions = kasir?.transactions || [];

  const totalIncome = transactions
    .filter((t) => t.type === 'INCOME')
    .reduce((acc, curr) => acc + Number(curr.price) * (curr.qty || 1), 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((acc, curr) => acc + Number(curr.price) * (curr.qty || 1), 0);

  const netProfit = totalIncome - totalExpense;

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

  const [activeSessionId, setActiveSessionId] = useState(() => chatSessions[0]?.id || Date.now().toString());
  const [inputChat, setInputChat] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef(null);
  const chatSessionRef = useRef(null);

  // State AI Features Tambahan
  const [targetAmount, setTargetAmount] = useState('1000000');
  const [targetResult, setTargetResult] = useState('');
  const [isCalculatingTarget, setIsCalculatingTarget] = useState(false);

  const [aiAnalysis, setAiAnalysis] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const currentSession = chatSessions.find(s => s.id === activeSessionId) || chatSessions[0];

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
    if (activeSessionId === id) setActiveSessionId(updated[0].id);
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

  const markdownComponents = {
    h1: ({node, ...props}) => <h1 className="text-xs font-black text-slate-900 mt-2 mb-1" {...props} />,
    h2: ({node, ...props}) => <h2 className="text-xs font-black text-slate-900 mt-2 mb-1" {...props} />,
    p: ({node, ...props}) => <p className="mb-1.5 last:mb-0" {...props} />,
    ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-2 space-y-0.5" {...props} />,
    ol: ({node, ...props}) => <ol className="list-decimal pl-4 mb-2 space-y-0.5" {...props} />,
    li: ({node, ...props}) => <li className="pl-0.5" {...props} />,
    strong: ({node, ...props}) => <strong className="font-extrabold text-slate-900" {...props} />,
    hr: ({node, ...props}) => <hr className="my-2 border-slate-200/60" {...props} />,
    code: ({node, inline, ...props}) => 
      inline 
        ? <code className="bg-slate-200/70 px-1.5 py-0.5 rounded text-[11px] font-mono text-emerald-700 font-bold" {...props} />
        : <code className="block bg-slate-900 text-emerald-400 p-3 rounded-2xl text-[11px] font-mono overflow-x-auto my-2 shadow-inner" {...props} />
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header Banner Modern dengan Gradient Tipis */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 p-6 rounded-3xl text-white shadow-lg relative overflow-hidden flex items-center justify-between">
        <div className="absolute right-0 top-0 translate-x-6 -translate-y-6 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="p-3.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-emerald-300 shadow-inner">
            <Bot size={28} />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black tracking-tight flex items-center gap-2">
              Tanya Nusa <Sparkles className="text-amber-300 animate-pulse" size={18} />
            </h1>
            <p className="text-xs text-emerald-100/80 font-medium">Asisten bisnis cerdas & kalkulator proyeksi keuangan toko</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 text-[10px] font-extrabold text-emerald-200 tracking-wider">
          <Zap size={13} className="text-amber-300" /> GEMINI 3.6 FLASH
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden p-4 sm:p-5">
        {/* Sidebar Riwayat Chat */}
        <div className="lg:col-span-4 xl:col-span-3 border-b lg:border-b-0 lg:border-r border-slate-100 pb-4 lg:pb-0 lg:pr-4 flex flex-col justify-between">
          <div>
            <button 
              onClick={handleCreateNewChat}
              className="w-full py-3 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-black text-xs rounded-2xl flex items-center justify-center gap-2 transition active:scale-95 mb-4 border border-emerald-100/60 shadow-2xs"
            >
              <MessageSquarePlus size={16} /> Chat Baru
            </button>

            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-2 mb-2">Riwayat Percakapan</p>
            <div className="space-y-1.5 max-h-48 lg:max-h-[360px] overflow-y-auto pr-1">
              {chatSessions.map((session) => (
                <div 
                  key={session.id}
                  onClick={() => setActiveSessionId(session.id)}
                  className={`group flex items-center justify-between p-3 rounded-2xl cursor-pointer text-xs transition ${
                    session.id === activeSessionId 
                      ? 'bg-emerald-50/80 text-emerald-900 font-bold border border-emerald-100 shadow-2xs' 
                      : 'text-slate-600 hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <MessageSquare size={14} className="shrink-0 text-slate-400 group-hover:text-emerald-600" />
                    <span className="truncate">{session.title}</span>
                  </div>
                  <button 
                    onClick={(e) => handleDeleteSession(session.id, e)}
                    className="opacity-100 lg:opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden lg:flex pt-4 border-t border-slate-100 text-[10px] text-slate-400 font-bold items-center justify-between px-2 mt-4 uppercase tracking-wider">
            <span>Status Engine</span>
            <span className="text-emerald-600 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span> Online
            </span>
          </div>
        </div>

        {/* Kotak Percakapan */}
        <div className="lg:col-span-8 xl:col-span-9 flex flex-col h-[420px] lg:h-[500px]">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-xs"></div>
              <span className="font-extrabold text-xs text-slate-900 truncate">
                {currentSession?.title}
              </span>
            </div>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-100">
              {currentSession?.messages.length || 0} Pesan
            </span>
          </div>

          {/* List Chat Bubble */}
          <div className="flex-1 overflow-y-auto pr-2 space-y-3.5 mb-3">
            {currentSession?.messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] sm:max-w-[75%] p-4 rounded-3xl text-xs leading-relaxed shadow-2xs ${
                  msg.sender === 'user' 
                    ? 'bg-emerald-600 text-white rounded-br-xs font-medium' 
                    : 'bg-slate-50/90 border border-slate-100 text-slate-800 rounded-bl-xs'
                }`}>
                  <ReactMarkdown components={markdownComponents}>{msg.text}</ReactMarkdown>
                </div>
              </div>
            ))}
            {isChatLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-3xl rounded-bl-xs text-xs text-slate-400 font-medium flex items-center gap-2 shadow-2xs">
                  <Loader2 size={14} className="animate-spin text-emerald-600" /> Nusa sedang menyusun jawaban...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Form Input Chat */}
          <form onSubmit={handleSendMessage} className="flex items-center gap-2.5 pt-3 border-t border-slate-100">
            <input 
              type="text" 
              value={inputChat}
              onChange={(e) => setInputChat(e.target.value)}
              placeholder="Tanya Nusa tentang keuangan toko..."
              className="flex-1 px-4 py-3 bg-slate-50/80 border border-slate-200/60 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 transition"
            />
            <button 
              type="submit"
              disabled={!inputChat.trim() || isChatLoading}
              className="p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl transition disabled:opacity-50 shrink-0 shadow-xs active:scale-95 cursor-pointer"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>

      {/* Fitur Tambahan (Kalkulator Target & Audit) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-2">
        {/* Kalkulator Target */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-2 text-emerald-700">
              <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-100">
                <Target size={18} />
              </div>
              <h2 className="font-black text-slate-900 text-sm sm:text-base">Kalkulator Target Keuntungan</h2>
            </div>
            <p className="text-xs text-slate-400 font-medium mb-4">
              Masukkan target laba bersih toko kamu, Nusa akan meracik strategi penjualannya!
            </p>

            <div className="space-y-3 mb-4">
              <input 
                type="number"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="Masukkan nominal target"
                className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200/60 rounded-2xl text-xs font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
              />
              <button 
                onClick={handleCalculateTarget}
                disabled={isCalculatingTarget || !targetAmount}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-2xl flex items-center justify-center gap-1.5 transition disabled:opacity-50 shadow-2xs active:scale-95 cursor-pointer"
              >
                {isCalculatingTarget ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} Hitung Target
              </button>
            </div>
          </div>

          {targetResult && (
            <div className="p-4 bg-emerald-50/50 border border-emerald-100/80 rounded-2xl text-xs text-slate-700 leading-relaxed shadow-2xs mt-2">
              <ReactMarkdown components={markdownComponents}>{targetResult}</ReactMarkdown>
            </div>
          )}
        </div>

        {/* Audit Laporan Kas */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5 text-emerald-700">
                <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-100">
                  <Lightbulb size={18} />
                </div>
                <h2 className="font-black text-slate-900 text-sm sm:text-base">Audit Laporan Kas</h2>
              </div>
              <button 
                onClick={handleAnalyzeCashflow}
                disabled={isAnalyzing || transactions.length === 0}
                className="text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-2 rounded-xl font-extrabold transition disabled:opacity-50 border border-emerald-100/60 active:scale-95 cursor-pointer"
              >
                {isAnalyzing ? 'Menganalisis...' : 'Audit Otomatis'}
              </button>
            </div>
            <p className="text-xs text-slate-400 font-medium mb-4">
              Evaluasi performa kesehatan keuangan dan temukan rekomendasi aksi cepat.
            </p>
          </div>

          {aiAnalysis ? (
            <div className="p-4 bg-slate-50/80 border border-slate-200/60 rounded-2xl text-xs text-slate-700 leading-relaxed max-h-40 overflow-y-auto shadow-2xs mt-2">
              <ReactMarkdown components={markdownComponents}>{aiAnalysis}</ReactMarkdown>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400 font-semibold bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 mt-2">
              Klik "Audit Otomatis" untuk ringkasan performa keuangan lengkap.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}