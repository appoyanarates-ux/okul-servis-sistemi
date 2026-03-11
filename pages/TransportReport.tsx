
import React, { useState, useEffect, useRef } from 'react';
import { Student, AppSettings, Driver } from '../types';
import { Printer, FileText, ArrowRightLeft, Eye, RefreshCw, Edit, Download } from 'lucide-react';
import { PrintPreview } from '../components/PrintPreview';
import { loadDistanceReportData, loadTransportPlanData } from '../services/storage';

// Globals for html2pdf
declare var html2pdf: any;

interface TransportReportProps {
  students: Student[];
  drivers: Driver[];
  settings: AppSettings;
}

interface RouteReportData {
  id: string;
  route: string;
  distance: number;
  primaryCount: number; // İlkokul (1-4)
  middleCount: number; // Ortaokul (5-8)
  totalCount: number;
  description: string; // The full text paragraph
}

// --- PRINTABLE COMPONENT ---
export const PrintableTransportReport: React.FC<{
  reportData: RouteReportData[];
  settings: AppSettings;
  oabbPrimary: string;
  oabbMiddle: string;
  orientation?: 'portrait' | 'landscape';
}> = ({ reportData, settings, oabbPrimary, oabbMiddle, orientation = 'portrait' }) => {
  return (
    <div className="bg-white p-8 font-[Times_New_Roman] text-black leading-relaxed">
      <style>{`
        @page { size: ${orientation}; margin: 20mm 15mm; }
        body { background-color: white !important; font-family: 'Times New Roman', Times, serif !important; }
        .justify-text { text-align: justify; text-justify: inter-word; }
        .break-inside-avoid { page-break-inside: avoid; }
      `}</style>

      <div className="text-center font-bold text-base mb-6">
        <p>{settings.educationYear} EĞİTİM ÖĞRETİM YILI</p>
        <p>{settings.province} İLİ {settings.district} İLÇESİ</p>
        <p className="uppercase">{settings.schoolName}</p>
        <p>TAŞIMALI EĞİTİM RAPORU</p>
      </div>

      <div className="font-bold mb-6 text-sm">
        TAŞIMA MERKEZİ: {settings.schoolName}
      </div>

      <div className="space-y-4 text-sm">
        {reportData.map((item, index) => (
          <div key={item.id} className="justify-text pl-4 -indent-4">
            <span className="font-bold">{index + 1}. {item.route}: </span>
            <span>{item.description}</span>
          </div>
        ))}
      </div>

      {/* Signature Block */}
      <div className="mt-16 text-xs font-bold text-center break-inside-avoid">
        {/* Row 1: Admins */}
        <div className="flex flex-wrap justify-center gap-8 mb-12 px-4">
            {settings.principals.map((p, i) => (
                <div key={i} className="flex flex-col gap-1 w-32">
                    <span>{p}</span>
                    <span>Okul Müdürü</span>
                </div>
            ))}
            {settings.vicePrincipals.map((vp, i) => (
                <div key={i} className="flex flex-col gap-1 w-32">
                    <span>{vp}</span>
                    <span>Müdür Yardımcısı</span>
                </div>
            ))}
        </div>

        {/* Row 2: O.A.B.B */}
        <div className="flex justify-around items-start px-12">
            <div className="flex flex-col gap-1 w-40">
                <span>{oabbPrimary}</span>
                <span>İlkokul O.A.B.B.</span>
            </div>
            <div className="flex flex-col gap-1 w-40">
                <span>{oabbMiddle}</span>
                <span>Ortaokul O.A.B.B.</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export const TransportReport: React.FC<TransportReportProps> = ({ students, drivers, settings }) => {
  const [reportData, setReportData] = useState<RouteReportData[]>([]);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [oabbPrimary, setOabbPrimary] = useState('Orhan AYAR');
  const [oabbMiddle, setOabbMiddle] = useState('Serdar GEDİK');
  const [isDownloading, setIsDownloading] = useState(false);
  const hiddenPrintRef = useRef<HTMLDivElement>(null);

  // Load / Initialize Data
  useEffect(() => {
    // 1. Calculate stats from current student list
    const stats = new Map<string, { p: number; m: number; total: number }>();

    students.forEach(s => {
        if (!s.route) return;
        const route = s.route.trim();
        if (!stats.has(route)) stats.set(route, { p: 0, m: 0, total: 0 });

        const entry = stats.get(route)!;
        const grade = parseInt(s.className.replace(/[^0-9]/g, '')) || 0;

        if (grade >= 1 && grade <= 4) entry.p++;
        else if (grade >= 5 && grade <= 8) entry.m++;

        entry.total++;
    });

    // 2. Load External Data from other modules
    const savedDescriptionsStr = localStorage.getItem('okulservis_report_descriptions_v1');
    const savedDescriptions: Record<string, string> = savedDescriptionsStr ? JSON.parse(savedDescriptionsStr) : {};

    const planData = loadTransportPlanData(); // From Planning Page (Distance)
    const distanceData = loadDistanceReportData(); // From Distance Page (KM, Features)
    const distanceMap = new Map(distanceData.map((d: any) => [d.route, d]));

    // 4. Merge Data and Generate Text
    const mergedData: RouteReportData[] = Array.from(stats.entries()).sort((a,b) => a[0].localeCompare(b[0])).map(([route, counts], index) => {

        // --- Smart Data Fetching Logic ---
        // A. Distance: Prefer "Distance Report" value, fallback to "Transport Plan", fallback to 0
        const distFromReport = distanceMap.get(route)?.total;
        const distFromPlan = planData[route]?.distance;
        const distance = distFromReport || distFromPlan || 0;

        // B. Features: Prefer "Distance Report" features (e.g., "Asfalt, Virajlı")
        let features = distanceMap.get(route)?.features || "yolu asfalt";
        // Clean up features text to flow in sentence (lowercase if not special)
        features = features.replace(/\.$/, ''); // Remove trailing dot

        // C. Capacity: Get from Transport Planning (vehicleCount * capacity) or fallback to "......"
        const plan = planData[route];
        // Calculate total capacity based on student counts if plan data is missing or to ensure it matches
        const totalCapacity = plan ? (plan.vehicleCount * plan.capacity) : null;
        const capacity = totalCapacity ? totalCapacity.toString() : "......";

        // Generate Default Text dynamically using all sources
        const defaultDesc = `Taşıma merkezine uzaklığı ${distance} km olup güzergah özellikleri; ${features} niteliktedir. Yerleşim yerinde okul bulunmamaktadır. İlkokuldaki ${counts.p} öğrencinin yönetmeliğin 8/b maddesine göre aynı yerleşim yerindeki ${counts.m} ortaokul öğrencisiyle birlikte toplam ${counts.total} öğrencinin ${capacity} koltuk kapasiteli bir araçla belirlenen taşıma merkezine taşınmasına.`;

        return {
            id: route,
            route,
            distance,
            primaryCount: counts.p,
            middleCount: counts.m,
            totalCount: counts.total,
            description: savedDescriptions[route] || defaultDesc
        };
    });

    setReportData(mergedData);

    // Load OABB names
    const savedOabb = localStorage.getItem('okulservis_report_oabb_v1');
    if (savedOabb) {
        const parsed = JSON.parse(savedOabb);
        setOabbPrimary(parsed.p || '');
        setOabbMiddle(parsed.m || '');
    }

  }, [students, drivers]);

  // Save changes
  const handleSaveDescription = (id: string, newDesc: string) => {
      setReportData(prev => {
          const newData = prev.map(item => item.id === id ? { ...item, description: newDesc } : item);

          // Save to LocalStorage
          const descMap: Record<string, string> = {};
          newData.forEach(d => descMap[d.id] = d.description);
          localStorage.setItem('okulservis_report_descriptions_v1', JSON.stringify(descMap));

          return newData;
      });
  };

  const handleSaveOabb = () => {
      localStorage.setItem('okulservis_report_oabb_v1', JSON.stringify({ p: oabbPrimary, m: oabbMiddle }));
  };

  // Reset text to auto-generated default (re-triggering the logic logic)
  const handleResetText = (item: RouteReportData) => {
      // Re-fetch fresh data for this specific item
      const planData = loadTransportPlanData();
      const distanceData = loadDistanceReportData();
      const distanceMap = new Map(distanceData.map((d: any) => [d.route, d]));

      const distFromReport = distanceMap.get(item.route)?.total;
      const distFromPlan = planData[item.route]?.distance;
      const distance = distFromReport || distFromPlan || 0;

      let features = distanceMap.get(item.route)?.features || "yolu asfalt";
      features = features.replace(/\.$/, '');

      // Recalculate capacity from Transport Planning
      const plan = planData[item.route];
      const totalCapacity = plan ? (plan.vehicleCount * plan.capacity) : null;
      const capacity = totalCapacity ? totalCapacity.toString() : "......";

      const defaultDesc = `Taşıma merkezine uzaklığı ${distance} km olup güzergah özellikleri; ${features} niteliktedir. Yerleşim yerinde okul bulunmamaktadır. İlkokuldaki ${item.primaryCount} öğrencinin yönetmeliğin 8/b maddesine göre aynı yerleşim yerindeki ${item.middleCount} ortaokul öğrencisiyle birlikte toplam ${item.totalCount} öğrencinin ${capacity} koltuk kapasiteli bir araçla belirlenen taşıma merkezine taşınmasına.`;

      if(confirm("Metni diğer sayfalardaki (Mesafe, Şoför/Koltuk, Planlama) güncel verilere göre sıfırlamak istediğinize emin misiniz?")) {
          handleSaveDescription(item.id, defaultDesc);
      }
  };

  const handleDownloadPDF = () => {
    if (!hiddenPrintRef.current) return;
    setIsDownloading(true);

    const element = hiddenPrintRef.current;
    const opt = {
      margin: 20,
      filename: 'Tasimali_Egitim_Raporu.pdf',
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

  return (
    <div className="space-y-6">
      {isPreviewing && (
        <PrintPreview
          title="Taşımalı Eğitim Raporu"
          onBack={() => setIsPreviewing(false)}
          orientation={orientation}
        >
          <PrintableTransportReport
            reportData={reportData}
            settings={settings}
            oabbPrimary={oabbPrimary}
            oabbMiddle={oabbMiddle}
            orientation={orientation}
          />
        </PrintPreview>
      )}

      {/* Hidden for PDF generation */}
      <div className="hidden">
          <div ref={hiddenPrintRef}>
            <PrintableTransportReport
                reportData={reportData}
                settings={settings}
                oabbPrimary={oabbPrimary}
                oabbMiddle={oabbMiddle}
                orientation={orientation}
            />
          </div>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Taşımalı Eğitim Raporu</h1>
          <p className="text-slate-500 text-sm">Yönetmelik gereği oluşturulan taşıma karar raporu. Veriler diğer modüllerden otomatik çekilir.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1 mr-2">
                <button onClick={() => setOrientation('portrait')} className={`px-2 py-1.5 rounded text-xs font-medium flex items-center gap-1 transition-colors ${orientation === 'portrait' ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-50'}`}><FileText size={14} /></button>
                <button onClick={() => setOrientation('landscape')} className={`px-2 py-1.5 rounded text-xs font-medium flex items-center gap-1 transition-colors ${orientation === 'landscape' ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-50'}`}><ArrowRightLeft size={14} /></button>
            </div>
            <button onClick={() => setIsPreviewing(true)} className="flex items-center space-x-2 bg-violet-50 text-violet-700 hover:bg-violet-100 px-3 py-2 rounded-lg transition-colors font-medium border border-violet-200" title="Önizle"><Eye size={16} /><span className="hidden sm:inline">Önizle</span></button>
            <button onClick={handleDownloadPDF} disabled={isDownloading} className="flex items-center space-x-2 bg-red-50 text-red-700 hover:bg-red-100 px-3 py-2 rounded-lg transition-colors font-medium border border-red-200 shadow-sm disabled:opacity-50"><Download size={16} /><span className="hidden sm:inline">{isDownloading ? '...' : 'PDF İndir'}</span></button>
        </div>
      </div>

      {/* O.A.B.B Settings */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2"><Edit size={16} /> Okul Aile Birliği Başkanları (İmza İçin)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">İlkokul O.A.B.B</label>
                  <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" value={oabbPrimary} onChange={(e) => setOabbPrimary(e.target.value)} onBlur={handleSaveOabb} />
              </div>
              <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Ortaokul O.A.B.B</label>
                  <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" value={oabbMiddle} onChange={(e) => setOabbMiddle(e.target.value)} onBlur={handleSaveOabb} />
              </div>
          </div>
      </div>

      {/* Content Editor */}
      <div className="space-y-4">
          {reportData.map((item, index) => (
              <div key={item.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                      <h3 className="font-bold text-slate-800">{index + 1}. {item.route}</h3>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded">İlkokul: {item.primaryCount}</span>
                          <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded">Ortaokul: {item.middleCount}</span>
                          <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold">Toplam: {item.totalCount}</span>
                      </div>
                  </div>
                  <div className="p-4">
                      <div className="relative">
                          <textarea
                            className="w-full p-3 border border-slate-300 rounded-lg text-sm leading-relaxed focus:ring-2 focus:ring-blue-500 outline-none min-h-[100px]"
                            value={item.description}
                            onChange={(e) => handleSaveDescription(item.id, e.target.value)}
                          />
                          <button
                            onClick={() => handleResetText(item)}
                            className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-blue-600 bg-white border border-slate-200 rounded shadow-sm transition-colors"
                            title="Güncel Verilerle Sıfırla"
                          >
                              <RefreshCw size={14} />
                          </button>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-2 italic">
                          Otomatik Metin: Mesafe ve özellikler "Mesafe Tutanağı"ndan, kapasite "Şoför" verisinden, sayılar "Öğrenci Listesi"nden çekilir. Değişiklik yaptıysanız sıfırlama butonunu kullanın.
                      </p>
                  </div>
              </div>
          ))}
          {reportData.length === 0 && (
              <div className="text-center py-12 bg-white rounded-xl border border-slate-200 text-slate-500">
                  Henüz tanımlı öğrenci veya güzergah bulunmuyor.
              </div>
          )}
      </div>
    </div>
  );
};
