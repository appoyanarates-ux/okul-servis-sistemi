
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Student, Driver, AppSettings } from '../types';
import { Calendar as CalendarIcon, Check, Users, Printer, ArrowRightLeft, Eye, Download, FileText } from 'lucide-react';
import { PrintPreview } from '../components/PrintPreview';

// Globals
declare var html2pdf: any;

interface ScorecardProps {
  students: Student[];
  drivers: Driver[];
  settings: AppSettings;
  isEmbedded?: boolean;
}

const ScorecardSheet: React.FC<{
  driverName: string;
  plateNumber: string;
  route: string;
  firmName: string;
  monthName: string;
  year: number;
  filteredRows: any[];
  settings: AppSettings;
}> = ({ driverName, plateNumber, route, firmName, monthName, year, filteredRows, settings }) => {
  return (
    <div className="bg-white mx-auto w-full p-4 font-sans text-black text-[10px] leading-tight">
      <table className="w-full border-collapse border border-black mb-0">
          <tbody>
            <tr><td className="border border-black p-1 font-bold w-[40%] bg-slate-50">TAŞIMA MERKEZİ OKULUN ADI</td><td className="border border-black p-1 text-center font-bold uppercase">{settings.schoolName}</td></tr>
            <tr><td className="border border-black p-1 font-bold bg-slate-50">TAŞIMA GÜZERGAHI</td><td className="border border-black p-1 text-center">{route || '-'}</td></tr>
            <tr><td className="border border-black p-1 font-bold bg-slate-50">TAŞIMA YAPAN ŞOFÖRÜN ADI</td><td className="border border-black p-1 text-center font-bold">{driverName || '-'}</td></tr>
            <tr><td className="border border-black p-1 font-bold bg-slate-50">TAŞIMA YAPAN ŞOFÖRÜN TC KİMLİK NO</td><td className="border border-black p-1 text-center"></td></tr>
            <tr><td className="border border-black p-1 font-bold bg-slate-50">TAŞIMA YAPAN ARACIN PLAKASI</td><td className="border border-black p-1 text-center">{plateNumber}</td></tr>
          </tbody>
      </table>
      <table className="w-full border-collapse border border-black text-center">
        <thead>
          <tr className="bg-slate-50">
            <td className="border border-black w-8 py-2"></td><td className="border border-black w-1/4 py-2 font-bold">İHALEYİ YÜKLENEN FİRMA VEYA KİŞİ</td><td className="border border-black py-2 font-bold">TAŞINDIĞI TARİH</td><td className="border border-black w-1/4 py-2 font-bold">SABAH İMZA</td><td className="border border-black w-1/4 py-2 font-bold">AKŞAM İMZA</td>
          </tr>
        </thead>
        <tbody>
          {filteredRows.map((dayData, index) => (<tr key={index} className="h-[22px]"><td className="border border-black">{index + 1}</td><td className="border border-black">{firmName}</td><td className="border border-black text-left pl-2">{dayData.fullDate}</td><td className="border border-black bg-slate-50/50"></td><td className="border border-black bg-slate-50/50"></td></tr>))}
          {Array.from({ length: Math.max(0, 25 - filteredRows.length) }).map((_, i) => (<tr key={`empty-${i}`} className="h-[22px]"><td className="border border-black">{filteredRows.length + i + 1}</td><td className="border border-black"></td><td className="border border-black"></td><td className="border border-black"></td><td className="border border-black"></td></tr>))}
          <tr><td className="border border-black h-6 bg-slate-100"></td><td className="border border-black bg-slate-100"></td><td className="border border-black text-right pr-2 font-bold bg-slate-100">TAŞIMA YAPILAN GÜN SAYISI</td><td className="border border-black font-bold text-center bg-slate-100" colSpan={2}>{filteredRows.length}</td></tr>
        </tbody>
      </table>
      <div className="border border-black border-t-0 p-2 text-[9px]">
        <div className="flex gap-2 mb-4"><span className="font-bold">NOT:</span><div><p>PUANTAJLAR ÇALIŞILAN AYIN BİTİMİNİ TAKİBEN İLK İŞ GÜNÜ MÜDÜRLÜĞÜMÜZE TESLİM EDİLECEKTİR.</p><p>PUANTAJLAR HER YÜKLENİCİ VE ŞOFÖR İÇİN MÜSTAKİL OLARAK TANZİM EDİLECEKTİR.</p></div></div>
        
        {/* Dynamic Signature Block */}
        <div className="flex justify-around text-center mt-8 gap-4">
            {settings.vicePrincipal1 && (
                <div className="flex flex-col gap-12 min-w-[100px]">
                    <span className="font-bold">DÜZENLEYEN</span>
                    <div className="flex flex-col">
                        <span className="font-bold">{settings.vicePrincipal1}</span>
                        <span>Müdür Yardımcısı</span>
                    </div>
                </div>
            )}
            
            {settings.vicePrincipal2 && (
                <div className="flex flex-col gap-12 min-w-[100px]">
                    <span className="font-bold">DÜZENLEYEN</span>
                    <div className="flex flex-col">
                        <span className="font-bold">{settings.vicePrincipal2}</span>
                        <span>Müdür Yardımcısı</span>
                    </div>
                </div>
            )}

            <div className="flex flex-col gap-12 min-w-[100px]">
                <span className="font-bold">TASDİK OLUNUR</span>
                <div className="flex flex-col">
                    <span className="font-bold">{settings.principalName}</span>
                    <span>Okul Müdürü</span>
                </div>
            </div>

            {settings.principalName2 && (
                <div className="flex flex-col gap-12 min-w-[100px]">
                    <span className="font-bold">TASDİK OLUNUR</span>
                    <div className="flex flex-col">
                        <span className="font-bold">{settings.principalName2}</span>
                        <span>Okul Müdürü</span>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export const PrintableScorecard: React.FC<ScorecardProps & {
  isBulkPrint: boolean;
  selectedDriver: string;
  plateNumber: string;
  firmName: string;
  monthName: string;
  year: number;
  filteredRows: any[];
  driverInfo: Record<string, { route: string }>;
  orientation?: 'portrait' | 'landscape';
}> = ({ drivers, settings, isBulkPrint, selectedDriver, plateNumber, firmName, monthName, year, filteredRows, driverInfo, orientation = 'portrait' }) => {

  return (
    <div className="bg-white">
      <style>{`
        @page { size: ${orientation}; margin: 5mm; }
        body { background-color: white !important; }
        .page-break { page-break-after: always; }
        table, th, td { border: 1px solid black !important; border-collapse: collapse !important; }
      `}</style>
      {isBulkPrint ? (
        drivers.map((driver, index) => (
          <div key={driver.id} className={index < drivers.length - 1 ? 'page-break' : ''}>
            <ScorecardSheet
                driverName={driver.name}
                plateNumber={driver.plateNumber || ''}
                route={driver.routes[0] || driverInfo[driver.name]?.route || '-'}
                firmName={firmName} monthName={monthName} year={year} filteredRows={filteredRows}
                settings={settings}
            />
          </div>
        ))
      ) : (
        <ScorecardSheet
          driverName={selectedDriver}
          plateNumber={plateNumber}
          route={selectedDriver ? (drivers.find(d => d.name === selectedDriver)?.routes[0] || driverInfo[selectedDriver]?.route || '-') : '-'}
          firmName={firmName} monthName={monthName} year={year} filteredRows={filteredRows}
          settings={settings}
        />
      )}
    </div>
  );
};


export const Scorecard: React.FC<ScorecardProps> = ({ students, drivers, settings, isEmbedded = false }) => {
  const [selectedDriver, setSelectedDriver] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [plateNumber, setPlateNumber] = useState('80 M 7166');
  const [isBulkPrint, setIsBulkPrint] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [isDownloading, setIsDownloading] = useState(false);
  const hiddenPrintRef = useRef<HTMLDivElement>(null);

  const driverInfo = useMemo(() => {
    const info: Record<string, { route: string }> = {};
    students.forEach(s => { if (!info[s.driver]) { info[s.driver] = { route: s.route }; } });
    return info;
  }, [students]);

  const allDriverNames = useMemo(() => {
    const names = new Set(Object.keys(driverInfo));
    drivers.forEach(d => names.add(d.name));
    return Array.from(names).sort();
  }, [driverInfo, drivers]);

  useEffect(() => {
    if (selectedDriver) {
      const driverObj = drivers.find(d => d.name === selectedDriver);
      if (driverObj && driverObj.plateNumber) { setPlateNumber(driverObj.plateNumber); }
    }
  }, [selectedDriver, drivers]);

  const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

  const daysInMonth = useMemo(() => {
    const days = [];
    const numDays = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    for (let i = 1; i <= numDays; i++) {
      const current = new Date(selectedYear, selectedMonth, i);
      days.push({ day: i, fullDate: `${i} ${monthNames[selectedMonth]} ${selectedYear} ${current.toLocaleDateString('tr-TR', { weekday: 'long' })}`, isWeekend: current.getDay() === 0 || current.getDay() === 6, dateObj: current });
    }
    return days;
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    const weekdays = daysInMonth.filter(d => !d.isWeekend).map(d => d.day);
    setSelectedDays(weekdays);
  }, [daysInMonth]);

  const toggleDay = (day: number) => {
    setSelectedDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort((a, b) => a - b));
  };

  const filteredRows = daysInMonth.filter(d => selectedDays.includes(d.day));

  const handleDownloadPDF = () => {
    if ((!selectedDriver && !isBulkPrint) || !hiddenPrintRef.current) {
        alert("Lütfen önce bir şoför seçiniz.");
        return;
    }
    
    setIsDownloading(true);
    
    const element = hiddenPrintRef.current;
    const filename = `Puantaj_${monthNames[selectedMonth]}_${selectedYear}.pdf`;
    
    const opt = {
      margin: 5, // mm (matches css)
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: orientation, orientation: orientation }
    };

    if (typeof html2pdf !== 'undefined') {
        html2pdf().set(opt).from(element).save().then(() => {
            setIsDownloading(false);
        });
    } else {
        alert("PDF oluşturucu yüklenemedi. Lütfen sayfayı yenileyin.");
        setIsDownloading(false);
    }
  };
  
  return (
    <div className={`space-y-6 ${!isEmbedded ? 'animate-fade-in' : ''}`}>
      {isPreviewing && (
        <PrintPreview 
          title={`Puantaj - ${monthNames[selectedMonth]} ${selectedYear}`} 
          onBack={() => setIsPreviewing(false)}
          orientation={orientation}
        >
          <PrintableScorecard 
            students={students} 
            drivers={drivers} 
            settings={settings}
            isBulkPrint={isBulkPrint} 
            selectedDriver={selectedDriver} 
            plateNumber={plateNumber} 
            firmName={settings.firmName} 
            monthName={monthNames[selectedMonth]} 
            year={selectedYear} 
            filteredRows={filteredRows} 
            driverInfo={driverInfo}
            orientation={orientation}
          />
        </PrintPreview>
      )}

      {/* Hidden container for PDF generation */}
      <div className="hidden">
          <div ref={hiddenPrintRef}>
             <PrintableScorecard 
                students={students} 
                drivers={drivers} 
                settings={settings}
                isBulkPrint={isBulkPrint} 
                selectedDriver={selectedDriver} 
                plateNumber={plateNumber} 
                firmName={settings.firmName} 
                monthName={monthNames[selectedMonth]} 
                year={selectedYear} 
                filteredRows={filteredRows} 
                driverInfo={driverInfo}
                orientation={orientation}
              />
          </div>
      </div>

      {/* Main Container - Conditional Styling */}
      <div className={`${isEmbedded ? '' : 'bg-white p-6 rounded-xl shadow-sm border border-slate-200'} space-y-6`}>
        {/* Page Title only if not embedded */}
        {!isEmbedded && (
            <div className="flex justify-between items-center mb-4">
               <div>
                  <h1 className="text-2xl font-bold text-slate-800">Puantaj Cetveli</h1>
                  <p className="text-slate-500">Aylık şoför imza çizelgeleri oluşturun.</p>
               </div>
            </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
           <div><label className="block text-sm font-medium text-slate-700 mb-1">Şoför Seçiniz</label><select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-100 disabled:text-slate-400" value={selectedDriver} onChange={(e) => setSelectedDriver(e.target.value)} disabled={isBulkPrint}><option value="">{isBulkPrint ? 'Toplu Yazdırma Modu Aktif' : 'Seçiniz...'}</option>{!isBulkPrint && allDriverNames.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
           <div><label className="block text-sm font-medium text-slate-700 mb-1">Ay / Yıl</label><div className="flex gap-2"><select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))}>{monthNames.map((m, i) => (<option key={i} value={i}>{m}</option>))}</select><input type="number" className="w-24 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} /></div></div>
           <div><label className="block text-sm font-medium text-slate-700 mb-1">Firma Adı (Ayarlardan Değiştirilebilir)</label><div className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-600 cursor-not-allowed">{settings.firmName}</div></div>
           <div><label className="block text-sm font-medium text-slate-700 mb-1">Araç Plakası</label><input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-100" value={plateNumber} onChange={(e) => setPlateNumber(e.target.value)} disabled={isBulkPrint} /></div>
        </div>
        <div className="flex flex-col xl:flex-row items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 gap-4">
          <div className="flex items-center space-x-3 w-full xl:w-auto"><div onClick={() => setIsBulkPrint(!isBulkPrint)} className={`w-10 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${isBulkPrint ? 'bg-indigo-600' : 'bg-slate-300'}`}><div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${isBulkPrint ? 'translate-x-4' : 'translate-x-0'}`}></div></div><span className="text-sm font-medium text-slate-700 flex items-center gap-2"><Users size={16} className="text-indigo-600" />Tüm Şoförler (Toplu Mod)</span></div>
          
          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto justify-end">
             <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1 mr-2">
                <button 
                  onClick={() => setOrientation('portrait')}
                  className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1 transition-colors ${orientation === 'portrait' ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  <FileText size={14} /> Dikey
                </button>
                <button 
                  onClick={() => setOrientation('landscape')}
                  className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1 transition-colors ${orientation === 'landscape' ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  <ArrowRightLeft size={14} /> Yatay
                </button>
             </div>
             
             <button onClick={() => setIsPreviewing(true)} className="flex items-center space-x-2 bg-violet-50 text-violet-700 hover:bg-violet-100 px-3 py-2 rounded-lg transition-colors font-medium border border-violet-200" title="Önizle"><Eye size={16} /><span className="hidden xl:inline">Önizle</span></button>
             <button onClick={handleDownloadPDF} disabled={isDownloading} className="flex items-center space-x-2 bg-red-50 text-red-700 hover:bg-red-100 px-3 py-2 rounded-lg transition-colors font-medium border border-red-200" type="button"><Download size={16} /><span className="hidden sm:inline">{isDownloading ? 'İndiriliyor...' : 'PDF İndir'}</span></button>
             <button onClick={() => setIsPreviewing(true)} className="flex items-center space-x-2 bg-slate-100 text-slate-700 hover:bg-slate-200 px-3 py-2 rounded-lg transition-colors font-medium border border-slate-300" type="button"><Printer size={16} /><span className="hidden sm:inline">PDF Yazdır</span></button>
          </div>
        </div>
        <div className="border-t border-slate-100 pt-4">
          <div className="flex items-center justify-between mb-2"><label className="block text-sm font-medium text-slate-700 flex items-center gap-2"><CalendarIcon size={16} /><span>Puantaj Günlerini Seçiniz</span></label><div className="text-xs text-slate-500">Seçilen Gün Sayısı: <span className="font-bold text-blue-600">{selectedDays.length}</span></div></div>
          <div className="grid grid-cols-7 gap-2">
             {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(d => (<div key={d} className="text-center text-xs font-bold text-slate-400 py-1">{d}</div>))}
             {Array.from({ length: (new Date(selectedYear, selectedMonth, 1).getDay() + 6) % 7 }).map((_, i) => (<div key={`empty-${i}`} className="h-10"></div>))}
             {daysInMonth.map((day) => { const isSelected = selectedDays.includes(day.day); return (<button key={day.day} onClick={() => toggleDay(day.day)} className={`h-10 rounded-lg border text-sm font-medium transition-all relative ${isSelected ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'} ${day.isWeekend && !isSelected ? 'bg-slate-50 opacity-60' : ''}`} >{day.day}{isSelected && <Check size={12} className="absolute top-1 right-1 opacity-50" />}</button>); })}
          </div>
        </div>
      </div>
    </div>
  );
};
