
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bus, Users, Upload, LayoutDashboard, Menu, X, FilePieChart, Ruler, Printer, DatabaseBackup, Settings, MapPin, Info, Database, CheckCircle, Calendar, ClipboardList, BookOpen, ShieldCheck, Briefcase } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { label: 'Genel Ayarlar', path: '/settings', icon: <Settings size={20} /> },
    { label: 'Özet Paneli', path: '/', icon: <LayoutDashboard size={20} /> },
    { label: 'Hızlı Excel Yükle', path: '/upload', icon: <Upload size={20} /> },
    { label: 'Taşıma Yönetimi', path: '/drivers', icon: <Briefcase size={20} /> },
    { label: 'Öğrenci Listesi', path: '/students', icon: <Users size={20} /> },
    { label: 'Servis Öğrenci Listeleri', path: '/service-lists', icon: <ClipboardList size={20} /> },
    { label: 'Taşıma Raporu', path: '/transport-report', icon: <BookOpen size={20} /> },
    { label: 'Araç Denetim Formu', path: '/vehicle-inspection', icon: <ShieldCheck size={20} /> },
    { label: 'Taşıma Planlama', path: '/planning', icon: <FilePieChart size={20} /> },
    { label: 'Harita / Konumlar', path: '/map', icon: <MapPin size={20} /> },
    { label: 'Mesafe Tutanağı', path: '/distance-report', icon: <Ruler size={20} /> },
    { label: 'Raporlama Merkezi', path: '/reports', icon: <Printer size={20} /> },
    { label: 'Yedekleme & Geri Yükle', path: '/backup', icon: <DatabaseBackup size={20} /> },
    { label: 'Hakkında & Yardım', path: '/about', icon: <Info size={20} /> },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out flex flex-col
        lg:relative lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between p-6 border-b border-slate-700 shrink-0">
          <div className="flex items-center space-x-2">
            <Bus className="text-blue-400" size={28} />
            <span className="text-xl font-bold tracking-wide">OkulServis</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <nav className="mt-4 px-4 space-y-1.5 overflow-y-auto flex-1 custom-scrollbar">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsSidebarOpen(false)}
              className={`
                flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors
                ${isActive(item.path) 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
              `}
            >
              {item.icon}
              <span className="font-medium text-sm">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Storage Indicator */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 shrink-0">
           <div className="flex items-start gap-3 bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
              <div className="bg-emerald-500/10 p-1.5 rounded-lg text-emerald-400 mt-0.5">
                 <Database size={16} />
              </div>
              <div>
                 <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs mb-0.5">
                    <CheckCircle size={10} />
                    <span>Sistem Aktif</span>
                 </div>
                 <p className="text-[10px] text-slate-400 leading-tight">
                    Tüm değişiklikler anlık olarak cihazınıza kaydedilmektedir.
                 </p>
              </div>
           </div>
        </div>

      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Mobile Header */}
        <header className="bg-white shadow-sm lg:hidden flex items-center justify-between p-4 z-10">
          <div className="flex items-center space-x-2">
            <Bus className="text-blue-600" size={24} />
            <span className="font-bold text-slate-800">OkulServis</span>
          </div>
          <button onClick={() => setIsSidebarOpen(true)} className="text-slate-600 p-2 rounded-md hover:bg-slate-100">
            <Menu size={24} />
          </button>
        </header>

        <main className="flex-1 overflow-auto p-4 lg:p-8 custom-scrollbar relative">
          {children}
        </main>
      </div>
    </div>
  );
};
