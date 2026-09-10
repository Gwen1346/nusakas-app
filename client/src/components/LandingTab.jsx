// src/components/LandingTab.jsx
import React from 'react';
import { 
  ArrowRight, Play, Zap, BarChart3, TrendingUp, 
  Bot, ShieldCheck, Smile, Users, Star, Clock, Sparkles, 
  Mail, Phone, MapPin 
} from 'lucide-react';
import logoPutih from '../assets/logoputih.png';
import heroImg from '../assets/hero.png';

export function LandingTab({ onGetStarted }) {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-emerald-500 selection:text-white overflow-x-hidden relative">
      
      {/* Background Ambient Glow Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-emerald-100/40 via-transparent to-transparent pointer-events-none blur-3xl -z-10" />
      <div className="absolute top-1/3 -right-32 w-96 h-96 bg-emerald-300/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* 1. NAVBAR */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 lg:px-16 py-4 flex items-center justify-between transition-all shadow-xs">
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="w-12 h-12 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center">
            <img 
              src={logoPutih} 
              alt="NusaKas Logo" 
              className="w-16 h-16 max-w-none object-cover transform -translate-y-0.5" 
            />
          </div>
          <div className="flex flex-col justify-center">
            <div className="font-extrabold text-base leading-tight tracking-tight">
              <span className="text-[#064E3B]">Nusa</span><span className="text-[#10B981]">Kas</span>
            </div>
            <span className="text-[9px] text-slate-400 font-semibold tracking-wider uppercase">POS & Fintech</span>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-xs font-bold text-slate-600">
          <a href="#beranda" className="text-emerald-600 cursor-pointer transition hover:-translate-y-0.5">Beranda</a>
          <a href="#fitur" className="cursor-pointer hover:text-emerald-600 transition hover:-translate-y-0.5">Fitur</a>
          <a href="#carakerja" className="cursor-pointer hover:text-emerald-600 transition hover:-translate-y-0.5">Cara Kerja</a>
          <a href="#tentang" className="cursor-pointer hover:text-emerald-600 transition hover:-translate-y-0.5">Tentang</a>
        </nav>

        <button 
          onClick={onGetStarted}
          className="group flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-full shadow-lg shadow-emerald-600/25 transition-all duration-300 transform hover:-translate-y-0.5 active:scale-95 cursor-pointer"
        >
          Mulai Sekarang <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1.5" />
        </button>
      </header>

      {/* 2. HERO SECTION */}
      <section id="beranda" className="max-w-7xl mx-auto px-6 pt-36 pb-24 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* Kolom Teks di Kiri */}
        <div className="lg:col-span-6 text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-50 border border-emerald-200/60 rounded-full text-emerald-700 text-xs font-bold mb-6 shadow-xs animate-bounce">
            <Sparkles size={14} className="text-emerald-600" /> Solusi Kasir & Keuangan untuk UMKM Modern
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight mb-6 leading-[1.12]">
            Kelola Keuangan UMKM, Jadi <span className="text-emerald-600 inline-block transform hover:scale-105 transition duration-300">Lebih Mudah.</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-500 font-medium max-w-lg mb-8 leading-relaxed">
            NusaKas membantu kamu mencatat transaksi, memantau pemasukan dan pengeluaran, serta mendapatkan laporan keuangan secara praktis dalam satu aplikasi.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 mb-10">
            <button 
              onClick={onGetStarted}
              className="group w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-2xl shadow-xl shadow-emerald-600/30 transition-all duration-300 transform hover:-translate-y-1 active:scale-95 cursor-pointer"
            >
              Mulai Gratis <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1.5" />
            </button>
            <button 
              onClick={onGetStarted}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 font-extrabold text-xs rounded-2xl transition-all duration-300 transform hover:-translate-y-1 active:scale-95 cursor-pointer shadow-xs"
            >
              <Play size={14} className="fill-slate-700 text-slate-700 animate-pulse" /> Lihat Demo
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-[11px] font-bold text-slate-600 pt-2 border-t border-slate-200/60">
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px]">✓</span> Gratis selamanya
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px]">✓</span> Mudah digunakan
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px]">✓</span> Aman & terpercaya
            </div>
          </div>
        </div>

        {/* Kolom Gambar/Mockup Dasbor di Kanan */}
        <div className="lg:col-span-6 relative flex justify-center">
          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600 to-teal-400 rounded-3xl blur-xl opacity-20 group-hover:opacity-100 transition duration-1000 animate-pulse" />
          <div className="relative w-full max-w-xl bg-white p-3 rounded-3xl shadow-2xl border border-slate-100 transform transition-all duration-500 hover:-translate-y-2 hover:shadow-emerald-600/20">
            <div className="rounded-2xl overflow-hidden bg-slate-900 relative">
              <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-full border border-slate-700/50">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <span className="w-2 h-2 rounded-full bg-red-500 absolute" />
                <span className="w-2 h-2 rounded-full bg-yellow-500 ml-1" />
                <span className="w-2 h-2 rounded-full bg-green-500 ml-1" />
                <span className="text-[10px] text-white font-mono ml-2">nusakas-app.preview</span>
              </div>
              <img 
                src={heroImg} 
                alt="Dashboard Preview" 
                className="w-full h-auto object-cover pt-6 transform transition duration-700 hover:scale-105" 
              />
            </div>
          </div>
        </div>

      </section>

      {/* 3. FITUR UNGGULAN */}
      <section id="fitur" className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center max-w-xl mx-auto mb-16">
          <span className="px-3.5 py-1 bg-emerald-50 text-emerald-600 border border-emerald-200/60 rounded-full text-xs font-bold uppercase tracking-wider">
            Fitur Unggulan
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mt-4 mb-3 tracking-tight">
            Semua yang Kamu Butuhkan untuk Mengelola Kas
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            NusaKas hadir dengan fitur lengkap untuk membantu kamu mengelola keuangan bisnis dengan lebih mudah, cepat, dan efisien.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: <Zap size={22} />, title: "Catat Transaksi", desc: "Catat pemasukan dan pengeluaran usaha dengan cepat dan mudah." },
            { icon: <BarChart3 size={22} />, title: "Laporan Kas", desc: "Lihat rekap keuangan harian, mingguan, atau bulanan dengan jelas." },
            { icon: <TrendingUp size={22} />, title: "Analisis Keuangan", desc: "Pantau performa bisnis dengan grafik dan statistik yang informatif." },
            { icon: <Bot size={22} />, title: "AI Assistant", desc: "Dapatkan saran dan bantuan pintar untuk mengelola keuangan." },
            { icon: <ShieldCheck size={22} />, title: "Aman & Terorganisir", desc: "Data transaksi kamu aman dengan sistem penyimpanan yang terpercaya." },
            { icon: <Smile size={22} />, title: "Mudah Digunakan", desc: "Desain simpel dan intuitif, cocok untuk semua kalangan." }
          ].map((item, idx) => (
            <div 
              key={idx}
              className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm transition-all duration-300 transform hover:-translate-y-2 hover:shadow-xl hover:border-emerald-200 group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-2xl -z-0 opacity-0 group-hover:opacity-100 transition duration-500" />
              <div className="relative z-10">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-5 border border-emerald-100 transition-all duration-300 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white shadow-xs">
                  {item.icon}
                </div>
                <h3 className="font-extrabold text-slate-900 text-base mb-2 group-hover:text-emerald-700 transition">{item.title}</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. STATISTIK BAR (Versi Beta) */}
      <section className="bg-white border-y border-slate-100 py-12 my-10 shadow-xs relative">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { icon: <Users size={20} />, value: "Beta Version", label: "Akses Eksklusif Awal" },
            { icon: <Star size={20} />, value: "99,9%", label: "Uptime Server" },
            { icon: <ShieldCheck size={20} />, value: "100%", label: "Data Aman & Terlindungi" },
            { icon: <Clock size={20} />, value: "24/7", label: "Dukungan Pelanggan" }
          ].map((stat, i) => (
            <div key={i} className="flex items-center justify-center gap-3.5 transform hover:scale-105 transition duration-300 p-3 rounded-2xl hover:bg-slate-50">
              <div className="w-11 h-11 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0 border border-emerald-100/50">{stat.icon}</div>
              <div className="text-left">
                <div className="font-black text-slate-900 text-lg sm:text-xl tracking-tight">{stat.value}</div>
                <div className="text-[10px] text-slate-400 font-semibold">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. CARA KERJA */}
      <section id="carakerja" className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center max-w-xl mx-auto mb-16">
          <span className="px-3.5 py-1 bg-emerald-50 text-emerald-600 border border-emerald-200/60 rounded-full text-xs font-bold uppercase tracking-wider">
            Cara Kerja
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mt-4 mb-3 tracking-tight">
            Dari Transaksi sampai Laporan
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Hanya dalam 3 langkah mudah, kamu sudah bisa mulai mengelola keuangan usaha.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { step: "1", title: "Catat Transaksi", desc: "Input pemasukan dan pengeluaran usaha kamu dengan cepat." },
            { step: "2", title: "Pantau & Kelola", desc: "Lihat riwayat transaksi dan pantau arus kas secara real-time." },
            { step: "3", title: "Dapatkan Laporan", desc: "Unduh laporan kas untuk mengetahui perkembangan bisnis kamu." }
          ].map((step, idx) => (
            <div key={idx} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm relative transition duration-300 transform hover:-translate-y-2 hover:shadow-xl group">
              <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-700 font-black text-xs flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white shadow-2xs">
                {step.step}
              </div>
              <h3 className="font-extrabold text-slate-900 text-base mb-2 group-hover:text-emerald-700 transition">{step.title}</h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 6. BANNER CTA */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="bg-gradient-to-br from-emerald-900 via-emerald-700 to-teal-700 rounded-3xl p-10 sm:p-16 text-white text-center relative overflow-hidden shadow-2xl transition duration-500 transform hover:scale-[1.01]">
          <div className="absolute -right-20 -top-20 w-72 h-72 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
          <div className="absolute -left-20 -bottom-20 w-72 h-72 bg-teal-400/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
          
          <div className="relative z-10 max-w-xl mx-auto">
            <span className="text-xs font-bold text-emerald-200 uppercase tracking-widest block mb-3">Siap Memulai?</span>
            <h2 className="text-3xl sm:text-4xl font-black mb-4 tracking-tight">Kelola Keuangan Bisnismu Sekarang!</h2>
            <p className="text-xs sm:text-sm text-emerald-100/90 font-medium mb-8 leading-relaxed">
              Bergabunglah dengan ribuan UMKM yang sudah merasakan kemudahan dan efisiensi bersama NusaKas.
            </p>
            <button 
              onClick={onGetStarted}
              className="group px-8 py-4 bg-white text-emerald-900 font-extrabold text-xs rounded-2xl shadow-xl hover:bg-emerald-50 transition-all duration-300 transform hover:-translate-y-1 active:scale-95 cursor-pointer inline-flex items-center gap-2"
            >
              Mulai Gratis <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1.5" />
            </button>
          </div>
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer id="tentang" className="bg-white border-t border-slate-200/80 pt-16 pb-12 px-6 lg:px-16 mt-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-slate-100">
          
          {/* Kolom Info Brand */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl overflow-hidden bg-emerald-600 flex items-center justify-center shadow-md shadow-emerald-600/20">
                <img src={logoPutih} alt="Logo" className="w-14 h-14 object-cover transform -translate-y-0.5" />
              </div>
              <div className="font-extrabold text-base tracking-tight">
                <span className="text-[#064E3B]">Nusa</span><span className="text-[#10B981]">Kas</span>
                <span className="block text-[8px] text-slate-400 font-bold tracking-widest uppercase">POS & FINTECH</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 font-medium max-w-sm leading-relaxed">
              Platform kasir pintar dan manajemen keuangan digital terdepan yang dirancang khusus untuk membantu UMKM Indonesia tumbuh dan berkembang.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <span className="px-3 py-1 bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-600 text-[10px] font-bold rounded-full transition duration-300 cursor-pointer">IG</span>
              <span className="px-3 py-1 bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-600 text-[10px] font-bold rounded-full transition duration-300 cursor-pointer">TW</span>
              <span className="px-3 py-1 bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-600 text-[10px] font-bold rounded-full transition duration-300 cursor-pointer">IN</span>
            </div>
          </div>

          {/* Kolom Navigasi */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">Navigasi</h4>
            <ul className="space-y-2.5 text-xs font-bold text-slate-500">
              <li><a href="#beranda" className="hover:text-emerald-600 transition">Beranda</a></li>
              <li><a href="#fitur" className="hover:text-emerald-600 transition">Fitur Utama</a></li>
              <li><a href="#carakerja" className="hover:text-emerald-600 transition">Cara Kerja</a></li>
              <li><a href="#tentang" className="hover:text-emerald-600 transition">Tentang Kami</a></li>
            </ul>
          </div>

          {/* Kolom Legal / Lainnya */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">Legal & Privasi</h4>
            <ul className="space-y-2.5 text-xs font-bold text-slate-500">
              <li className="cursor-pointer hover:text-emerald-600 transition">Syarat & Ketentuan</li>
              <li className="cursor-pointer hover:text-emerald-600 transition">Kebijakan Privasi</li>
              <li className="cursor-pointer hover:text-emerald-600 transition">Keamanan Data</li>
            </ul>
          </div>

          {/* Kolom Kontak */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">Hubungi Kami</h4>
            <ul className="space-y-3 text-xs text-slate-500 font-medium">
              <li className="flex items-center gap-2.5">
                <Mail size={14} className="text-emerald-600 shrink-0" />
                <span>support@nusakas.id</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone size={14} className="text-emerald-600 shrink-0" />
                <span>+62 812-3456-7890</span>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>Malang, Jawa Timur, Indonesia</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bagian Bawah Hak Cipta */}
        <div className="max-w-7xl mx-auto pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 font-medium">
          <div>
            &copy; 2026 NusaKas. Semua hak dilindungi.
          </div>
          <div className="flex items-center gap-6">
            <span className="cursor-pointer hover:text-slate-600 transition">Kebijakan Privasi</span>
            <span className="cursor-pointer hover:text-slate-600 transition">Ketentuan Layanan</span>
            <span className="cursor-pointer hover:text-slate-600 transition">Pusat Bantuan</span>
          </div>
        </div>
      </footer>

    </div>
  );
}