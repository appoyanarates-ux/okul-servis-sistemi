
import React, { useState, useMemo } from 'react';
import { Student, Driver, AppSettings } from '../types';
import { Search, Printer, FileText, ArrowRightLeft, Eye, Download, Bus, User, Users, School,  Info } from 'lucide-react';
import { PrintPreview } from '../components/PrintPreview';

// Globals for html2pdf
declare var html2pdf: any;

interface ServiceStudentListProps {
  students: Student[];
  drivers: Driver[];
  settings: AppSettings;
}

// --- PRINTABLE COMPONENT ---
export const PrintableServiceList: React.FC<{
  students: Student[];
  driver: Driver | undefined;
  settings: AppSettings;
  orientation?: 'portrait' | 'landscape';
}> = ({ students, driver, settings, orientation = 'portrait' }) => {

  const routeText = driver?.routes && driver.routes.length > 0 ? driver.routes.join(' + ') : (students.length > 0 ? students[0].route : '');

  return (
    <div className="bg-white p-8 font-['Times_New_Roman'] text-black h-full relative">
      <style>{`
        @page { size: A4 ${orientation}; margin: 10mm; }
        body { background-color: white !important; font-family: 'Times New Roman', Times, serif !important; }
        table, th, td { border: 1px solid black !important; border-collapse: collapse !important; }
        .break-inside-avoid { page-break-inside: avoid; }
        .print-header-cell { background-color: #f3f4f6 !important; font-weight: bold; text-align: center; }
      `}</style>

      {/* HEADER TABLE */}
      <table className="w-full text-xs mb-0 border-black">
          <tbody>
              <tr><td className="w-[40%] font-bold p-1 text-center bg-slate-50">TAŞIMA MERKEZİ OKULUN ADI</td><td className="p-1 text-center font-bold uppercase">{settings.schoolName}</td></tr>
              <tr><td className="font-bold p-1 text-center bg-slate-50">TAŞIMA GÜZERGAHI</td><td className="p-1 text-center">{routeText}</td></tr>
              <tr><td className="font-bold p-1 text-center bg-slate-50">TAŞIMA YAPAN ŞOFÖRÜN ADI</td><td className="p-1 text-center font-bold">{driver?.name || ''}</td></tr>
              <tr><td className="font-bold p-1 text-center bg-slate-50">TAŞIMA YAPAN ŞOFÖRÜN TELEFON NUMARASI</td><td className="p-1 text-center">{driver?.phone || ''}</td></tr>
              <tr><td className="font-bold p-1 text-center bg-slate-50">TAŞIMA YAPAN ARACIN PLAKASI</td><td className="p-1 text-center font-bold">{driver?.plateNumber || ''}</td></tr>
          </tbody>
      </table>

      {/* STUDENT LIST TABLE */}
      <table className="w-full text-xs text-center border-t-0">
        <thead>
          <tr className="bg-slate-50 font-bold"><th className="p-1 w-8 border-t-0">NO</th><th className="p-1 text-left border-t-0">ÖĞRENCİ ADI SOYADI</th><th className="p-1 w-16 border-t-0">SINIFI</th><th className="p-1 w-[25%] border-t-0">VELİNİN ADI SOYADI</th><th className="p-1 w-[20%] border-t-0">TELEFON NUMARASI</th></tr>
        </thead>
        <tbody>
          {students.map((student, index) => (
            <tr key={student.id} className="break-inside-avoid h-6"><td className="p-1 font-bold">{index + 1}</td><td className="p-1 text-left font-medium px-2 uppercase">{student.name}</td><td className="p-1">{student.className}</td><td className="p-1">{/* Manual Entry */}</td><td className="p-1">{/* Manual Entry */}</td></tr>
          ))}
        </tbody>
      </table>

      {/* FOOTER */}
      <div className="mt-1 border border-black border-t-0 p-1">
          <div className="flex text-xs h-12">
              <span className="font-bold mr-2">NOT:</span>
              <div className="border-b border-dotted border-slate-400 w-full h-4 mt-2"></div>
          </div>
      </div>

      <div className="mt-8 flex justify-between px-4 text-xs text-center font-bold break-inside-avoid">
          {/* Left Side Signatures (Vice Principals) */}
          <div className="flex gap-8">
              {settings.vicePrincipal1 && (
                  <div className="flex flex-col gap-8 min-w-[120px]">
                      <div>&nbsp;</div>
                      <div>
                          {settings.vicePrincipal1}<br/>
                          <span className="font-normal">Müdür Yardımcısı</span>
                      </div>
                  </div>
              )}
              {settings.vicePrincipal2 && (
                  <div className="flex flex-col gap-8 min-w-[120px]">
                      <div>&nbsp;</div>
                      <div>
                          {settings.vicePrincipal2}<br/>
                          <span className="font-normal">Müdür Yardımcısı</span>
                      </div>
                  </div>
              )}
          </div>

          {/* Right Side Signatures (Principals) */}
          <div className="flex gap-8">
              {settings.principals.map((p, i) => (
                  <div key={i} className="flex flex-col gap-8 min-w-[120px]">
                      <div>&nbsp;</div>
                      <div>
                          {p}<br/>
                          <span className="font-normal">Okul Müdürü</span>
                      </div>
                  </div>
              ))}
          </div>
      </div>
    </div>
  );
};

export const PrintableAllServiceLists: React.FC<{
  students: Student[];
  drivers: Driver[];
  settings: AppSettings;
  orientation?: 'portrait' | 'landscape';
}> = ({ students, drivers, settings, orientation = 'portrait' }) => {
  return (
    <div className="bg-white font-['Times_New_Roman'] text-black">
      <style>{`
        @page { size: A4 ${orientation}; margin: 10mm; }
        body { background-color: white !important; font-family: 'Times New Roman', Times, serif !important; }
        table, th, td { border: 1px solid black !important; border-collapse: collapse !important; }
        .break-inside-avoid { page-break-inside: avoid; }
        .print-header-cell { background-color: #f3f4f6 !important; font-weight: bold; text-align: center; }
        .page-break { page-break-after: always; }
      `}</style>
      {drivers.map((driver, index) => {
        const driverStudents = students
          .filter(s => s.driver === driver.name)
          .sort((a, b) => a.name.localeCompare(b.name, 'tr-TR'));

        if (driverStudents.length === 0) return null;

        return (
          <div key={driver.id} className={index < drivers.length - 1 ? 'page-break' : ''}>
            <PrintableServiceList
              students={driverStudents}
              driver={driver}
              settings={settings}
              orientation={orientation}
            />
          </div>
        );
      })}
    </div>
  );
};

// --- MAIN COMPONENT ---
export const ServiceStudentList: React.FC<ServiceStudentListProps> = ({ students, drivers, settings }) => {
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isPreviewingAll, setIsPreviewingAll] = useState(false);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const hiddenPrintRef = React.useRef<HTMLDivElement>(null);
  const hiddenPrintAllRef = React.useRef<HTMLDivElement>(null);

  // Filter Data
  const selectedDriver = useMemo(() => drivers.find(d => d.id === selectedDriverId), [drivers, selectedDriverId]);

  const filteredStudents = useMemo(() => {
      if (!selectedDriver) return [];
      return students
        .filter(s => s.driver === selectedDriver.name)
        .sort((a, b) => a.name.localeCompare(b.name, 'tr-TR'));
  }, [students, selectedDriver]);

  // Derived Stats
  const stats = useMemo(() => {
      const total = filteredStudents.length;
      const girls = filteredStudents.filter(s => s.gender === 'KIZ' || (s.gender as any) === 'K').length;
      const boys = filteredStudents.filter(s => s.gender === 'ERKEK' || (s.gender as any) === 'E').length;
      const schools = new Set(filteredStudents.map(s => s.schoolName)).size;
      return { total, girls, boys, schools };
  }, [filteredStudents]);

  // Actions
  const handleDownloadPDF = () => {
    if (!selectedDriver || !hiddenPrintRef.current) return alert("Lütfen şoför seçiniz.");
    setIsDownloading(true);

    const element = hiddenPrintRef.current;
    const opt = {
      margin: 5,
      filename: `${selectedDriver.name}_Servis_Listesi.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: orientation, orientation: orientation }
    };

    if (typeof html2pdf !== 'undefined') {
        html2pdf().set(opt).from(element).save().then(() => setIsDownloading(false));
    } else {
        alert("PDF modülü yüklenemedi.");
        setIsDownloading(false);
    }
  };

  const handleDownloadAllPDF = () => {
    if (!hiddenPrintAllRef.current) return;
    setIsDownloadingAll(true);

    const element = hiddenPrintAllRef.current;
    const opt = {
      margin: 5,
      filename: `Tum_Servis_Listeleri.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: orientation, orientation: orientation }
    };

    if (typeof html2pdf !== 'undefined') {
        html2pdf().set(opt).from(element).save().then(() => setIsDownloadingAll(false));
    } else {
        alert("PDF modülü yüklenemedi.");
        setIsDownloadingAll(false);
    }
  };

  return (
    <div className="space-y-6">
      {isPreviewing && (
        <PrintPreview
          title="Servis Öğrenci Listesi"
          onBack={() => setIsPreviewing(false)}
          orientation={orientation}
        >
          <PrintableServiceList
            students={filteredStudents}
            driver={selectedDriver}
            settings={settings}
            orientation={orientation}
          />
        </PrintPreview>
      )}

      {isPreviewingAll && (
        <PrintPreview
          title="Tüm Servis Öğrenci Listeleri"
          onBack={() => setIsPreviewingAll(false)}
          orientation={orientation}
        >
          <PrintableAllServiceLists
            students={students}
            drivers={drivers}
            settings={settings}
            orientation={orientation}
          />
        </PrintPreview>
      )}

      {/* Hidden for PDF generation */}
      <div className="hidden">
          <div ref={hiddenPrintRef}>
            <PrintableServiceList
                students={filteredStudents}
                driver={selectedDriver}
                settings={settings}
                orientation={orientation}
            />
          </div>
          <div ref={hiddenPrintAllRef}>
            <PrintableAllServiceLists
                students={students}
                drivers={drivers}
                settings={settings}
                orientation={orientation}
            />
          </div>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Servis Öğrenci Listeleri</h1>
          <p className="text-slate-500 text-sm">Şoförlere verilecek öğrenci iletişim listelerini yönetin ve yazdırın.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1 mr-2">
                <button onClick={() => setOrientation('portrait')} className={`px-2 py-1.5 rounded text-xs font-medium flex items-center gap-1 transition-colors ${orientation === 'portrait' ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-50'}`}><FileText size={14} /></button>
                <button onClick={() => setOrientation('landscape')} className={`px-2 py-1.5 rounded text-xs font-medium flex items-center gap-1 transition-colors ${orientation === 'landscape' ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-50'}`}><ArrowRightLeft size={14} /></button>
            </div>

            <button onClick={() => setIsPreviewing(true)} disabled={!selectedDriver} className="flex items-center space-x-2 bg-violet-50 text-violet-700 hover:bg-violet-100 px-3 py-2 rounded-lg transition-colors font-medium border border-violet-200 disabled:opacity-50 shadow-sm"><Eye size={16} /><span className="hidden sm:inline">Önizle</span></button>
            <button onClick={handleDownloadPDF} disabled={!selectedDriver || isDownloading} className="flex items-center space-x-2 bg-red-50 text-red-700 hover:bg-red-100 px-3 py-2 rounded-lg transition-colors font-medium border border-red-200 disabled:opacity-50 shadow-sm"><Download size={16} /><span className="hidden sm:inline">{isDownloading ? '...' : 'PDF İndir'}</span></button>
            <div className="w-px h-6 bg-slate-300 mx-1"></div>
            <button onClick={() => setIsPreviewingAll(true)} disabled={drivers.length === 0} className="flex items-center space-x-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-3 py-2 rounded-lg transition-colors font-medium border border-indigo-200 disabled:opacity-50 shadow-sm"><Eye size={16} /><span className="hidden sm:inline">Toplu Önizle</span></button>
            <button onClick={handleDownloadAllPDF} disabled={drivers.length === 0 || isDownloadingAll} className="flex items-center space-x-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-3 py-2 rounded-lg transition-colors font-medium border border-emerald-200 disabled:opacity-50 shadow-sm"><Printer size={16} /><span className="hidden sm:inline">{isDownloadingAll ? '...' : 'Toplu İndir'}</span></button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* Left Sidebar: Driver Selection */}
          <div className="lg:col-span-1 flex flex-col gap-4">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[600px]">
                  <div className="p-4 border-b border-slate-100 bg-slate-50">
                      <label className="block text-sm font-bold text-slate-700">Şoför Listesi</label>
                      <p className="text-xs text-slate-500 mt-1">İşlem yapmak için birini seçin</p>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                      {drivers.map(driver => (
                          <button
                            key={driver.id}
                            onClick={() => setSelectedDriverId(driver.id)}
                            className={`w-full text-left px-3 py-3 rounded-lg text-sm flex items-center justify-between transition-all ${selectedDriverId === driver.id ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50 hover:pl-4'}`}
                          >
                              <div className="flex items-center gap-3 overflow-hidden">
                                  <div className={`p-1.5 rounded-full shrink-0 ${selectedDriverId === driver.id ? 'bg-white/20' : 'bg-slate-100 text-slate-500'}`}>
                                      <Bus size={14} />
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                      <span className="truncate font-medium leading-none">{driver.name}</span>
                                      <span className={`text-[10px] mt-1 truncate ${selectedDriverId === driver.id ? 'text-blue-200' : 'text-slate-400'}`}>{driver.plateNumber || 'Plaka Yok'}</span>
                                  </div>
                              </div>
                              {selectedDriverId === driver.id && <div className="w-1.5 h-1.5 bg-white rounded-full shrink-0 animate-pulse" />}
                          </button>
                      ))}
                      {drivers.length === 0 && <div className="text-slate-400 text-xs text-center py-8">Kayıtlı şoför bulunamadı.</div>}
                  </div>
              </div>
          </div>

          {/* Right Area: Content */}
          <div className="lg:col-span-3 flex flex-col gap-4">
              {selectedDriver ? (
                  <>
                      {/* Stats Cards */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
                              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Users size={20} /></div>
                              <div>
                                  <p className="text-xs text-slate-500 font-medium">Toplam</p>
                                  <p className="text-xl font-bold text-slate-800">{stats.total}</p>
                              </div>
                          </div>
                          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
                              <div className="p-2 bg-pink-50 text-pink-600 rounded-lg"><User size={20} /></div>
                              <div>
                                  <p className="text-xs text-slate-500 font-medium">Kız Öğrenci</p>
                                  <p className="text-xl font-bold text-slate-800">{stats.girls}</p>
                              </div>
                          </div>
                          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
                              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><User size={20} /></div>
                              <div>
                                  <p className="text-xs text-slate-500 font-medium">Erkek Öğrenci</p>
                                  <p className="text-xl font-bold text-slate-800">{stats.boys}</p>
                              </div>
                          </div>
                          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
                              <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><School size={20} /></div>
                              <div>
                                  <p className="text-xs text-slate-500 font-medium">Farklı Okul</p>
                                  <p className="text-xl font-bold text-slate-800">{stats.schools}</p>
                              </div>
                          </div>
                      </div>

                      {/* Driver Info Bar */}
                      <div className="bg-blue-600 text-white p-4 rounded-xl shadow-md flex flex-wrap justify-between items-center gap-4">
                          <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                                  <Bus size={24} />
                              </div>
                              <div>
                                  <h2 className="text-lg font-bold">{selectedDriver.name}</h2>
                                  <p className="text-blue-100 text-xs flex items-center gap-2">
                                      <span>{selectedDriver.phone || 'Telefon Yok'}</span>
                                      <span>•</span>
                                      <span>{selectedDriver.plateNumber || 'Plaka Yok'}</span>
                                  </p>
                              </div>
                          </div>
                          <div className="text-right hidden sm:block">
                              <div className="text-xs text-blue-200 mb-1">Güzergah Bilgisi</div>
                              <div className="font-medium text-sm bg-blue-700 px-3 py-1 rounded-lg inline-block">
                                  {selectedDriver.routes.length > 0 ? selectedDriver.routes[0] : 'Tanımsız'}
                                  {selectedDriver.routes.length > 1 && ` +${selectedDriver.routes.length - 1} diğer`}
                              </div>
                          </div>
                      </div>

                      {/* Table */}
                      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex-1">
                          <div className="overflow-x-auto">
                              <table className="w-full text-left text-sm">
                                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                                      <tr><th className="px-6 py-4 w-12 font-bold">#</th><th className="px-6 py-4 font-bold">Öğrenci Adı</th><th className="px-6 py-4 font-bold">Okul</th><th className="px-6 py-4 font-bold text-center">Sınıf</th><th className="px-6 py-4 font-bold text-center">Cinsiyet</th><th className="px-6 py-4 font-bold">Köy</th></tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                      {filteredStudents.map((student, index) => (
                                          <tr key={student.id} className="hover:bg-slate-50 transition-colors"><td className="px-6 py-3 font-mono text-slate-500">{index + 1}</td><td className="px-6 py-3 font-medium text-slate-800">{student.name}</td><td className="px-6 py-3 text-slate-600 text-xs">{student.schoolName}</td><td className="px-6 py-3 text-center"><span className="px-2 py-1 bg-slate-100 rounded text-xs font-bold text-slate-600 border border-slate-200">{student.className}</span></td><td className="px-6 py-3 text-center text-xs text-slate-500">{student.gender}</td><td className="px-6 py-3 text-slate-600 text-xs">{student.village}</td></tr>
                                      ))}
                                      {filteredStudents.length === 0 && (
                                          <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">Bu şoföre atanmış öğrenci bulunmamaktadır.</td></tr>
                                      )}
                                  </tbody>
                              </table>
                          </div>
                      </div>
                  </>
              ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-white rounded-xl border border-slate-200 border-dashed min-h-[400px]">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                          <Info size={32} className="opacity-50" />
                      </div>
                      <h3 className="text-lg font-medium text-slate-600">Şoför Seçimi Yapılmadı</h3>
                      <p className="text-sm mt-1">Listeyi görüntülemek için soldaki menüden bir şoför seçiniz.</p>
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};
