// src/App.jsx
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { LandingTab } from './components/LandingTab';
import { DashboardTab } from './components/DashboardTab';
import { ReportTab } from './components/ReportTab';
import { AiAdvisorTab } from './components/AiAdvisorTab';
import { Modals } from './components/Modals';
import { LogoutModal } from './components/LogoutModal';
import AuthModal from './components/AuthModal'; // Komponen login/register baru
import { useKasir } from './hooks/useKasir';
import { Menu } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(null); // State user login
  const [activeTab, setActiveTab] = useState('landing');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const kasir = useKasir();

  // Cek sesi login saat aplikasi pertama kali dibuka
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleConfirmLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setActiveTab('landing');
    setShowLogoutModal(false);
    window.location.reload();
  };

  // Jika user belum login dan mencoba masuk ke dashboard/aplikasi, paksa tampilkan AuthModal atau biarkan di landing
  // Di sini kita biarkan user melihat landing page, lalu saat klik "Mulai", jika belum login bisa diarahkan ke modal login.
  
  if (activeTab === 'landing') {
    return (
      <div className="min-h-screen bg-slate-50 font-sans">
        <LandingTab onGetStarted={() => {
          // Jika belum login, arahkan ke login, jika sudah langsung ke dashboard
          if (!user) {
            setActiveTab('login-required');
          } else {
            setActiveTab('dashboard');
          }
        }} />
        
        {/* Modal Login jika user dari landing ingin mulai tapi belum login */}
        {activeTab === 'login-required' && (
          <AuthModal 
            onLoginSuccess={(userData) => {
              setUser(userData);
              setActiveTab('dashboard');
            }} 
          />
        )}
      </div>
    );
  }

  // Jika belum login sama sekali tapi memaksa masuk rute lain
  if (!user) {
    return (
      <AuthModal 
        onLoginSuccess={(userData) => {
          setUser(userData);
          setActiveTab('dashboard');
        }} 
      />
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 font-sans relative">
      {isMobileSidebarOpen && (
        <div 
          onClick={() => setIsMobileSidebarOpen(false)} 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs md:hidden transition-opacity" 
        />
      )}

      {/* Sidebar hanya muncul setelah user masuk dashboard/aplikasi */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:h-screen md:sticky md:top-0 border-r border-slate-200 flex flex-col ${
        isMobileSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
      }`}>
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={(tab) => { 
            setActiveTab(tab); 
            setIsMobileSidebarOpen(false); 
          }} 
          setIsMobileSidebarOpen={setIsMobileSidebarOpen}
          onOpenLogoutModal={() => setShowLogoutModal(true)} 
        />
      </div>
      
      <div className="flex flex-col flex-1 h-full overflow-hidden w-full">
        <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 md:hidden shrink-0">
          <button 
            onClick={() => setIsMobileSidebarOpen(true)} 
            className="p-2 text-slate-700 rounded-xl hover:bg-slate-100 transition"
          >
            <Menu size={22} />
          </button>
          <div className="font-extrabold text-base tracking-tight">
            <span className="text-[#064E3B]">Nusa</span><span className="text-[#10B981]">Kas</span>
          </div>
          <div className="w-9" />
        </header>

        <main className="flex-1 p-4 sm:p-10 overflow-y-auto">
          {activeTab === 'dashboard' && <DashboardTab kasir={kasir} />}
          {activeTab === 'report' && <ReportTab kasir={kasir} />}
          {activeTab === 'ai' && <AiAdvisorTab kasir={kasir} />}
        </main>
      </div>

      <Modals kasir={kasir} />

      <LogoutModal 
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleConfirmLogout}
      />
    </div>
  );
}