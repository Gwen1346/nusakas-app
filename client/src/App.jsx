import React, { useState } from 'react';
import { useTransactions } from './hooks/useTransactions';
import { transactionSchema } from './schemas/transactionSchema';
import { 
  LayoutDashboard, Receipt, 
  Plus, Trash2, LogOut, Search 
} from 'lucide-react';

export default function App() {
  const { transactions, loading, addTx, removeTx } = useTransactions();
  
  // State Form Transaksi
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [type, setType] = useState('INCOME');
  const [category, setCategory] = useState('Minuman');
  
  // State Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  // State Error Validasi Zod
  const [errors, setErrors] = useState({});

  // Filter Data Transaksi berdasarkan Search & Tipe
  const filteredTransactions = transactions.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'ALL' || item.type === filterType;
    return matchesSearch && matchesType;
  });

  // Ringkasan Keuangan
  const totalIncome = transactions
    .filter((t) => t.type === 'INCOME')
    .reduce((acc, curr) => acc + Number(curr.price) * (curr.qty || 1), 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((acc, curr) => acc + Number(curr.price) * (curr.qty || 1), 0);

  // Handler Submit dengan Validasi Zod
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formData = {
      name,
      price: price === '' ? NaN : Number(price),
      type,
      category,
    };

    // Validasi input via Zod
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

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-800">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between p-5">
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
                <line x1="137" y1="42" x2="158" y2="42" stroke="#047857" strokeWidth="4.5" strokeLinecap="round" />
                <line x1="137" y1="54" x2="158" y2="54" stroke="#047857" strokeWidth="4.5" strokeLinecap="round" />
                <line x1="137" y1="66" x2="151" y2="66" stroke="#047857" strokeWidth="4.5" strokeLinecap="round" />
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
            <button className="flex items-center gap-3 w-full px-4 py-3 bg-emerald-50 text-emerald-600 font-semibold rounded-xl text-sm">
              <LayoutDashboard size={18} /> Dashboard
            </button>
            <button className="flex items-center gap-3 w-full px-4 py-3 text-slate-500 hover:bg-slate-50 font-medium rounded-xl text-sm transition">
              <Receipt size={18} /> Laporan Kas
            </button>
          </nav>
        </div>

        <button className="flex items-center gap-3 w-full px-4 py-3 text-rose-500 hover:bg-rose-50 font-semibold rounded-xl text-sm transition">
          <LogOut size={18} /> Keluar
        </button>
      </aside>

      {/* MAIN AREA */}
      <main className="flex-1 overflow-y-auto p-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Dashboard Kasir</h1>
            <p className="text-sm text-slate-400">Kelola arus kas & transaksi UMKM</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full font-bold">
              ● Server Connected (Port 5000)
            </span>
          </div>
        </header>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase">Pemasukan</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">
              Rp {totalIncome.toLocaleString('id-ID')}
            </p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase">Pengeluaran</p>
            <p className="text-2xl font-black text-rose-600 mt-1">
              Rp {totalExpense.toLocaleString('id-ID')}
            </p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase">Net Profit</p>
            <p className="text-2xl font-black text-blue-600 mt-1">
              Rp {(totalIncome - totalExpense).toLocaleString('id-ID')}
            </p>
          </div>
        </div>

        {/* FORM INPUT & TABEL */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* FORM INPUT */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-4">+ Tambah Transaksi</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Nama Transaksi</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Kopi Susu Aren" 
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
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
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
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
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

          {/* TABEL TRANSAKSI */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <h2 className="text-base font-bold text-slate-900">Riwayat Transaksi</h2>
              
              {/* SEARCH & FILTER */}
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
                              item.type === 'INCOME' 
                                ? 'bg-emerald-50 text-emerald-600' 
                                : 'bg-rose-50 text-rose-600'
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
                              onClick={() => removeTx(item.id)}
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
      </main>

    </div>
  );
}