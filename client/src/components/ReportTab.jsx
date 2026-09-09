// src/components/ReportTab.jsx
import React from 'react';
import { FileSpreadsheet, Printer, Search, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export function ReportTab({ kasir }) {
  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header Banner Modern */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-100 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">Laporan Kas Toko</h2>
            <p className="text-xs text-slate-400 font-medium">Rekapitulasi seluruh pemasukan dan pengeluaran.</p>
          </div>
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button 
              onClick={kasir.handleExportExcel} 
              className="flex-1 sm:flex-none px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-extrabold rounded-2xl text-xs flex items-center justify-center gap-1.5 transition active:scale-95"
            >
              <FileSpreadsheet size={15} /> Export Excel
            </button>
            <button 
              onClick={kasir.handleExportPDF} 
              className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-2xl text-xs flex items-center justify-center gap-1.5 transition active:scale-95"
            >
              <Printer size={15} /> Cetak / PDF
            </button>
          </div>
        </div>

        {/* Filter & Pencarian Laporan */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-3.5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari transaksi..." 
              value={kasir.reportSearch || ''} 
              onChange={e => kasir.setReportSearch(e.target.value)} 
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 border border-slate-200/60 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
            />
          </div>
          <div>
            <input 
              type="date" 
              value={kasir.reportStartDate || ''} 
              onChange={e => kasir.setReportStartDate(e.target.value)} 
              className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200/60 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-600 transition"
              title="Dari Tanggal"
            />
          </div>
          <div>
            <input 
              type="date" 
              value={kasir.reportEndDate || ''} 
              onChange={e => kasir.setReportEndDate(e.target.value)} 
              className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200/60 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-600 transition"
              title="Sampai Tanggal"
            />
          </div>
          <div>
            <select 
              value={kasir.reportFilterType || 'ALL'} 
              onChange={e => kasir.setReportFilterType(e.target.value)} 
              className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200/60 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-700 transition"
            >
              <option value="ALL">Semua Tipe</option>
              <option value="INCOME">Income (Pemasukan)</option>
              <option value="EXPENSE">Expense (Pengeluaran)</option>
            </select>
          </div>
        </div>

        {/* Daftar Transaksi */}
        {kasir.filteredReportTransactions.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 font-semibold bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
            Tidak ada data laporan yang cocok.
          </div>
        ) : (
          <>
            {/* Tampilan Mobile: Card Modern dengan Aksen Border Samping */}
            <div className="space-y-3 sm:hidden">
              {kasir.filteredReportTransactions.map(item => {
                const isIncome = item.type === 'INCOME';
                return (
                  <div 
                    key={item.id} 
                    className={`p-4 bg-gradient-to-r from-white to-slate-50/50 border border-slate-100 rounded-2xl flex items-center justify-between gap-3 shadow-2xs relative overflow-hidden pl-4 border-l-4 ${
                      isIncome ? 'border-l-emerald-500' : 'border-l-rose-500'
                    }`}
                  >
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${
                          isIncome ? 'bg-emerald-50 text-emerald-600 border border-emerald-100/60' : 'bg-rose-50 text-rose-600 border border-rose-100/60'
                        }`}>
                          {item.category}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">{item.date || '-'}</span>
                      </div>
                      <div className="font-bold text-slate-900 text-xs truncate pt-0.5">{item.name}</div>
                      <div className={`font-black text-xs flex items-center gap-1 ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {isIncome ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                        {isIncome ? '+ Rp ' : '- Rp '}{Number(item.price).toLocaleString('id-ID')}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Tampilan Desktop: Tabel Bersih & Elegan */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 text-[10px] uppercase tracking-wider font-extrabold">
                    <th className="pb-3.5">Tanggal</th>
                    <th className="pb-3.5">Nama Transaksi</th>
                    <th className="pb-3.5">Kategori</th>
                    <th className="pb-3.5">Tipe</th>
                    <th className="pb-3.5 text-right">Nominal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {kasir.filteredReportTransactions.map(item => {
                    const isIncome = item.type === 'INCOME';
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition group">
                        <td className="py-4 text-xs text-slate-400 font-medium whitespace-nowrap">{item.date || '-'}</td>
                        <td className="py-4 font-bold text-slate-900 text-xs">{item.name}</td>
                        <td className="py-4 text-xs text-slate-500 whitespace-nowrap">
                          <span className="px-2.5 py-1 bg-slate-100/80 rounded-lg font-semibold text-slate-600">{item.category}</span>
                        </td>
                        <td className="py-4 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black inline-flex items-center gap-1 ${
                            isIncome ? 'bg-emerald-50 text-emerald-600 border border-emerald-100/50' : 'bg-rose-50 text-rose-600 border border-rose-100/50'
                          }`}>
                            {isIncome ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                            {item.type}
                          </span>
                        </td>
                        <td className={`py-4 text-right font-black text-xs sm:text-sm whitespace-nowrap ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {isIncome ? '+ Rp ' : '- Rp '}{Number(item.price).toLocaleString('id-ID')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}