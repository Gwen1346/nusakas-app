// src/components/DashboardTab.jsx
import React, { useState } from 'react';
import { Wallet, ArrowUpRight, ArrowDownRight, PieChart, Receipt, ArrowRight } from 'lucide-react';
import { CATEGORY_COLORS, FALLBACK_COLOR, getLast7Days } from '../utils/transactionMeta';

const PERIOD_OPTIONS = [
  { value: 'today', label: 'Hari Ini' },
  { value: 'week', label: 'Minggu Ini' },
  { value: 'month', label: 'Bulan Ini' },
  { value: 'all', label: 'Semua' },
];

// Cek apakah sebuah tanggal transaksi (string 'YYYY-MM-DD') masuk ke periode yang dipilih
function isInPeriod(dateStr, period) {
  if (period === 'all') return true;
  if (!dateStr) return false;

  const date = new Date(dateStr);
  const now = new Date();

  if (period === 'today') {
    return dateStr === now.toISOString().split('T')[0];
  }

  if (period === 'week') {
    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay(); // 0 = Minggu ... 6 = Sabtu
    const diffToMonday = day === 0 ? 6 : day - 1;
    startOfWeek.setDate(startOfWeek.getDate() - diffToMonday);
    startOfWeek.setHours(0, 0, 0, 0);
    return date >= startOfWeek && date <= now;
  }

  if (period === 'month') {
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  }

  return true;
}

/* ---------- Toggle segmented untuk pilih periode ringkasan ---------- */
function PeriodToggle({ value, onChange }) {
  return (
    <div className="inline-flex items-center gap-0.5 p-1 bg-slate-100 rounded-xl">
      {PERIOD_OPTIONS.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition ${
            value === opt.value
              ? 'bg-white text-emerald-700 shadow-xs'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/* ---------- Kartu Statistik gaya TailAdmin ---------- */
function StatCard({ label, value, sub, icon, iconBg, iconColor, badge, badgeTone }) {
  const toneClasses = badgeTone === 'up'
    ? 'bg-emerald-50 text-emerald-600'
    : badgeTone === 'down'
      ? 'bg-rose-50 text-rose-600'
      : 'bg-slate-100 text-slate-500';

  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-xs">
      <div className="flex items-start justify-between">
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${iconBg} ${iconColor}`}>
          {icon}
        </div>
        {badge && (
          <span className={`text-[10px] font-extrabold px-2 py-1 rounded-full ${toneClasses}`}>
            {badge}
          </span>
        )}
      </div>
      <div className="mt-4">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</div>
        <div className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">{value}</div>
        {sub && <div className="text-[11px] font-semibold text-slate-400 mt-1">{sub}</div>}
      </div>
    </div>
  );
}

/* ---------- Grafik batang arus kas 7 hari ---------- */
function CashFlowChart({ transactions }) {
  const days = getLast7Days();

  const byDay = days.map(({ iso, label }) => {
    const dayItems = transactions.filter(t => t.date === iso);
    const income = dayItems.filter(t => t.type === 'INCOME').reduce((a, c) => a + Number(c.price), 0);
    const expense = dayItems.filter(t => t.type === 'EXPENSE').reduce((a, c) => a + Number(c.price), 0);
    return { iso, label, income, expense };
  });

  const maxValue = Math.max(1, ...byDay.map(d => Math.max(d.income, d.expense)));
  const hasAnyData = byDay.some(d => d.income > 0 || d.expense > 0);

  return (
    <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-100 shadow-xs h-full">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-bold text-xs sm:text-sm text-slate-800">Arus Kas 7 Hari Terakhir</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Pemasukan vs pengeluaran harian</p>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-bold">
          <span className="flex items-center gap-1.5 text-slate-500">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" /> Masuk
          </span>
          <span className="flex items-center gap-1.5 text-slate-500">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-300 inline-block" /> Keluar
          </span>
        </div>
      </div>

      {!hasAnyData ? (
        <div className="py-10 text-center text-xs text-slate-400 font-medium">
          Belum ada transaksi minggu ini untuk ditampilkan di grafik.
        </div>
      ) : (
        <div className="flex items-end justify-between gap-2 sm:gap-4 h-48">
          {byDay.map((d) => {
            const incomeHeight = Math.max(4, (d.income / maxValue) * 100);
            const expenseHeight = Math.max(4, (d.expense / maxValue) * 100);
            return (
              <div key={d.iso} className="flex-1 flex flex-col items-center justify-end h-full gap-1.5">
                <div className="flex items-end gap-1 h-full w-full justify-center">
                  <div
                    className="w-2.5 sm:w-3.5 bg-emerald-500 rounded-t-md transition-all"
                    style={{ height: `${incomeHeight}%` }}
                    title={`Masuk: Rp ${d.income.toLocaleString('id-ID')}`}
                  />
                  <div
                    className="w-2.5 sm:w-3.5 bg-rose-300 rounded-t-md transition-all"
                    style={{ height: `${expenseHeight}%` }}
                    title={`Keluar: Rp ${d.expense.toLocaleString('id-ID')}`}
                  />
                </div>
                <span className="text-[10px] font-bold text-slate-400">{d.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------- Donut breakdown pengeluaran per kategori ---------- */
function CategoryDonut({ transactions, periodLabel }) {
  const expenseItems = transactions.filter(t => t.type === 'EXPENSE');
  const totalExpense = expenseItems.reduce((a, c) => a + Number(c.price), 0);

  const byCategory = {};
  expenseItems.forEach(t => {
    const cat = t.category || 'Lainnya';
    byCategory[cat] = (byCategory[cat] || 0) + Number(t.price);
  });

  const entries = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);

  if (totalExpense === 0) {
    return (
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-100 shadow-xs h-full flex flex-col">
        <h3 className="font-bold text-xs sm:text-sm text-slate-800">Pengeluaran per Kategori</h3>
        {periodLabel && <p className="text-[11px] text-slate-400 mt-0.5">{periodLabel}</p>}
        <div className="flex-1 flex flex-col items-center justify-center gap-2 py-8">
          <div className="w-11 h-11 rounded-2xl bg-slate-50 text-slate-300 flex items-center justify-center">
            <PieChart size={20} />
          </div>
          <p className="text-xs text-slate-400 font-medium text-center max-w-[200px]">
            Belum ada pengeluaran tercatat untuk dipetakan per kategori.
          </p>
        </div>
      </div>
    );
  }

  let cumulative = 0;
  const gradientStops = entries.map(([cat, val]) => {
    const start = (cumulative / totalExpense) * 360;
    cumulative += val;
    const end = (cumulative / totalExpense) * 360;
    const color = CATEGORY_COLORS[cat] || FALLBACK_COLOR;
    return `${color} ${start}deg ${end}deg`;
  }).join(', ');

  return (
    <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-100 shadow-xs h-full">
      <h3 className="font-bold text-xs sm:text-sm text-slate-800">Pengeluaran per Kategori</h3>
      {periodLabel && <p className="text-[11px] text-slate-400 mt-0.5 mb-4">{periodLabel}</p>}

      <div className="flex items-center gap-6">
        <div
          className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full shrink-0"
          style={{ background: `conic-gradient(${gradientStops})` }}
        >
          <div className="absolute inset-[14%] bg-white rounded-full flex flex-col items-center justify-center">
            <span className="text-[9px] font-bold text-slate-400 uppercase">Total</span>
            <span className="text-xs sm:text-sm font-black text-slate-800">
              Rp {totalExpense >= 1000000 ? `${(totalExpense / 1000000).toFixed(1)}jt` : totalExpense.toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        <div className="flex-1 space-y-2.5 min-w-0">
          {entries.map(([cat, val]) => {
            const pct = Math.round((val / totalExpense) * 100);
            const color = CATEGORY_COLORS[cat] || FALLBACK_COLOR;
            return (
              <div key={cat} className="flex items-center justify-between gap-2 text-xs">
                <span className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: color }} />
                  <span className="font-semibold text-slate-600 truncate">{cat}</span>
                </span>
                <span className="font-bold text-slate-800 shrink-0">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ---------- Preview 5 transaksi terbaru + link ke halaman Catat Transaksi ---------- */
function RecentTransactionsPreview({ transactions, onSeeAll }) {
  const recent = transactions.slice(0, 5);

  return (
    <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-xs sm:text-sm text-slate-800">Transaksi Terbaru</h3>
        <button
          onClick={onSeeAll}
          className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 transition"
        >
          Lihat Semua <ArrowRight size={13} />
        </button>
      </div>

      {recent.length === 0 ? (
        <div className="py-10 flex flex-col items-center justify-center text-center gap-2">
          <div className="w-11 h-11 rounded-2xl bg-slate-50 text-slate-300 flex items-center justify-center">
            <Receipt size={20} />
          </div>
          <p className="text-xs font-bold text-slate-500">Belum ada transaksi</p>
          <p className="text-[11px] text-slate-400 max-w-xs">
            Mulai catat transaksi pertamamu di halaman Catat Transaksi.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {recent.map(item => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 p-3.5 bg-slate-50/80 border border-slate-100 rounded-2xl"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase"
                    style={{
                      backgroundColor: `${CATEGORY_COLORS[item.category] || FALLBACK_COLOR}1a`,
                      color: CATEGORY_COLORS[item.category] || FALLBACK_COLOR,
                    }}
                  >
                    {item.category}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">{item.date || '-'}</span>
                </div>
                <div className="font-bold text-slate-800 text-xs truncate">{item.name}</div>
              </div>
              <div className={`font-black text-xs shrink-0 ${item.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                {item.type === 'INCOME' ? '+ Rp ' : '- Rp '}{Number(item.price).toLocaleString('id-ID')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function DashboardTab({ kasir, setActiveTab, user }) {
  const [period, setPeriod] = useState('today');
  const displayName = user?.storeName || user?.name || user?.username || 'Kasir';

  const periodTransactions = kasir.transactions.filter(t => isInPeriod(t.date, period));

  const totalIncome = periodTransactions
    .filter(t => t.type === 'INCOME')
    .reduce((acc, curr) => acc + Number(curr.price), 0);

  const totalExpense = periodTransactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((acc, curr) => acc + Number(curr.price), 0);

  const netProfit = totalIncome - totalExpense;
  const margin = totalIncome > 0 ? Math.round((netProfit / totalIncome) * 100) : 0;
  const incomeShare = (totalIncome + totalExpense) > 0 ? Math.round((totalIncome / (totalIncome + totalExpense)) * 100) : 0;
  const expenseShare = (totalIncome + totalExpense) > 0 ? Math.round((totalExpense / (totalIncome + totalExpense)) * 100) : 0;

  const periodLabel = PERIOD_OPTIONS.find(o => o.value === period)?.label || '';

  return (
    <div className="max-w-7xl mx-auto space-y-5 pb-12">
      {/* Header Selamat Datang / Ringkas */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-gradient-to-r from-emerald-900 to-emerald-800 text-white p-5 rounded-3xl shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 bg-emerald-700/50 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-700/60 text-emerald-200 rounded-full text-[10px] font-bold mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Live POS System
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">Halo, {displayName} 👋</h1>
          <p className="text-xs text-emerald-100/80">Pantau transaksi dan performa UMKM hari ini.</p>
        </div>
        <button
          onClick={() => setActiveTab('transaction')}
          className="relative z-10 shrink-0 flex items-center gap-2 px-4 py-2.5 bg-white text-emerald-700 font-extrabold text-xs rounded-xl shadow-sm hover:bg-emerald-50 transition"
        >
          + Catat Transaksi
        </button>
      </div>

      {/* Toggle Periode Ringkasan */}
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ringkasan {periodLabel}</h2>
        <PeriodToggle value={period} onChange={setPeriod} />
      </div>

      {/* Kartu Statistik gaya TailAdmin */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="col-span-2 sm:col-span-1">
          <StatCard
            label="Net Profit"
            value={`Rp ${netProfit.toLocaleString('id-ID')}`}
            sub={totalIncome > 0 ? `Margin ${margin}% dari pemasukan` : `${periodTransactions.length} transaksi tercatat`}
            icon={<Wallet size={18} />}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
            badge={totalIncome > 0 ? `${margin}%` : null}
            badgeTone={margin >= 0 ? 'up' : 'down'}
          />
        </div>
        <StatCard
          label="Masuk"
          value={`Rp ${totalIncome.toLocaleString('id-ID')}`}
          sub={`${periodLabel} · ${incomeShare > 0 ? `${incomeShare}% dari arus kas` : 'belum ada'}`}
          icon={<ArrowUpRight size={18} />}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          badge={incomeShare > 0 ? `${incomeShare}%` : null}
          badgeTone="up"
        />
        <StatCard
          label="Keluar"
          value={`Rp ${totalExpense.toLocaleString('id-ID')}`}
          sub={`${periodLabel} · ${expenseShare > 0 ? `${expenseShare}% dari arus kas` : 'belum ada'}`}
          icon={<ArrowDownRight size={18} />}
          iconBg="bg-rose-50"
          iconColor="text-rose-600"
          badge={expenseShare > 0 ? `${expenseShare}%` : null}
          badgeTone="down"
        />
      </div>

      {/* Grafik: Arus Kas + Donut Kategori berdampingan */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3">
          <CashFlowChart transactions={kasir.transactions} />
        </div>
        <div className="lg:col-span-2">
          <CategoryDonut transactions={periodTransactions} periodLabel={periodLabel} />
        </div>
      </div>

      {/* Preview Transaksi Terbaru (link ke halaman Catat Transaksi untuk lihat semua) */}
      <RecentTransactionsPreview
        transactions={kasir.transactions}
        onSeeAll={() => setActiveTab('transaction')}
      />
    </div>
  );
}