
import React, { useState, useMemo, useEffect, ReactNode } from 'react';
import { Student, Driver, AppSettings } from '../types';
import { ChevronDown, Printer, Calendar, Check, ArrowRightLeft, Download, Eye } from 'lucide-react';

import { PrintableStudentList } from './Students';
import { PrintableDriversRoutes } from './DriversRoutes';
import { PrintableScorecard } from './Scorecard';
import { PrintableTransportPlan } from './TransportPlanning';
import { PrintableDistanceReport } from './DistanceReport';
import { PrintableDailyLog } from './DailyLog';
import { PrintPreview } from '../components/PrintPreview';
import { loadDistanceReportData, loadTransportPlanData } from '../services/storage';

// --- Reusable Components ---

interface AccordionProps {
  title: string;
  description: string;
  children: ReactNode;
  onOpen?: () => void;
}

const ReportAccordion: React.FC<AccordionProps> = ({ title, description, children, onOpen }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent accidental form submits or anchor jumps
    const newState = !isOpen;
    setIsOpen(newState);
    if (newState && onOpen) {
      onOpen();
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <button
        type="button"
        onClick={handleToggle}
        className="w-full text-left p-6 flex items-center justify-between hover:bg-slate-50 transition-colors focus:outline-none"
      >
        <div>
          <h3 className="text-lg font-bold text-slate-800">{title}</h3>
          <p className="text-sm text-slate-500 mt-1">{description}</p>
        </div>
        <ChevronDown
          size={24}
          className={`text-slate-400 transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen && (
        <div className="px-6 pb-6 border-t border-slate-100 animate-fade-in">
          {children}
        </div>
      )}
    </div>
  );
};

interface ReportActionsProps {
  onPdf: () => void;
  onPrint: () => void;
  onPreview: () => void;
  orientation: 'portrait' | 'landscape';
  onOrientationChange: (o: 'portrait' | 'landscape') => void;
}

const ReportActions: React.FC<ReportActionsProps> = ({ onPdf, onPrint, onPreview, orientation, onOrientationChange }) => (
  <div className="flex flex-wrap items-center justify-between gap-4 pt-4 mt-4 border-t border-slate-100">
    <div className="flex items-center gap-2">
       <span className="text-xs sm:text-sm font-medium text-slate-600 mr-1">Sayfa Yönü:</span>
       <div className="flex bg-slate-100 rounded-lg p-1 border border-slate-200">
          <button 
            type="button"
            onClick={(e) => { e.preventDefault(); onOrientationChange('portrait'); }}
            className={`px-2 sm:px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1 transition-all duration-200 ${orientation === 'portrait' ? 'bg-white text-blue-700 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
          >
            <div className="border-2 border-current w-2.5 h-3.5 rounded-[1px] sm:w-3 sm:h-4 sm:rounded-sm"></div> Dikey
          </button>
          <button 
            type="button"
            onClick={(e) => { e.preventDefault(); onOrientationChange('landscape'); }}
            className={`px-2 sm:px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1 transition-all duration-200 ${orientation === 'landscape' ? 'bg-white text-blue-700 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
          >
            <ArrowRightLeft size={14} /> Yatay
          </button>
       </div>
    </div>
    <div className="flex items-center gap-2">
      <span className="text-xs sm:text-sm font-medium text-slate-600 mr-1 hidden sm:inline">İşlemler:</span>
      <button type="button" onClick={onPreview} className="flex items-center space-x-1.5 bg-violet-50 text-violet-700 hover:bg-violet-100 px-3 py-1.5 rounded-lg transition-colors font-medium text-xs sm:text-sm border border-violet-200" title="Ekranda Önizle"><Eye size={16} /><span>Önizle</span></button>
      <div className="h-5 w-px bg-slate-300 mx-0.5 sm:mx-1"></div>
      <button type="button" onClick={onPdf} className="flex items-center space-x-1.5 bg-red-600 text-white hover:bg-red-700 px-3 py-1.5 rounded-lg transition-colors font-bold text-xs sm:text-sm shadow-sm shadow-red-200" title="PDF Olarak İndir"><Download size={16} /><span>PDF İndir</span></button>
      <button type="button" onClick={onPrint} className="flex items-center space-x-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors font-medium text-xs sm:text-sm border border-slate-300" title="Yazıcıya Gönder"><Printer size={16} /><span>Yazdır</span></button>
    </div>
  </div>
);

export const Reports: React.FC<{ students: Student[]; drivers: Driver[]; settings: AppSettings; }> = ({ students, drivers, settings }) => {
  const [printingReport, setPrintingReport] = useState<{ type: string; title: string; action?: 'pdf' | 'print' } | null>(null);
  
  const [reportOrientations, setReportOrientations] = useState<Record<string, 'portrait' | 'landscape'>>({
    'students': 'portrait',
    'drivers-routes': 'portrait',
    'scorecard': 'portrait',
    'planning': 'landscape',
    'distance': 'landscape',
    'daily-log': 'landscape'
  });

  const setOrientation = (reportType: string, value: 'portrait' | 'landscape') => {
    setReportOrientations(prev => ({ ...prev, [reportType]: value }));
  };
  
  // --- Student List State ---
  const [studentFilters, setStudentFilters] = useState({ class: 'all' });
  const classes = useMemo(() => Array.from(new Set(students.map(s => s.className))).sort(), [students]);
  const filteredStudents = useMemo(() => {
    return students.filter(student => studentFilters.class === 'all' || student.className === studentFilters.class);
  }, [students, studentFilters]);

  // --- Drivers/Routes State ---
  const [driversReportTab, setDriversReportTab] = useState<'drivers' | 'routes'>('drivers');
  const driversData = useMemo(() => drivers.map(driver => {
    const studentCount = students.filter(s => s.driver === driver.name).length;
    const routes = new Set([...driver.routes]);
    students.filter(s => s.driver === driver.name).forEach(s => routes.add(s.route));
    return { ...driver, studentCount, displayRoutes: Array.from(routes).filter(r => r && r.trim() !== '') };
  }).sort((a,b) => b.studentCount - a.studentCount), [students, drivers]);
  const uniqueRoutes = useMemo(() => {
    const routesSet = new Set<string>();
    drivers.forEach(d => d.routes.forEach(r => routesSet.add(r)));
    students.forEach(s => routesSet.add(s.route));
    routesSet.delete('');
    return Array.from(routesSet).sort();
  }, [students, drivers]);

  // --- Scorecard State ---
  const [scorecardFilters, setScorecardFilters] = useState({
    driver: drivers.length > 0 ? drivers[0].name : '',
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
    firmName: settings.firmName || 'DOĞAN GÜNEŞ',
    isBulk: false,
  });
  const [scorecardSelectedDays, setScorecardSelectedDays] = useState<number[]>([]);

  const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  
  const daysInMonth = useMemo(() => {
    const days = [];
    const numDays = new Date(scorecardFilters.year, scorecardFilters.month + 1, 0).getDate();
    for (let i = 1; i <= numDays; i++) {
      const current = new Date(scorecardFilters.year, scorecardFilters.month, i);
      days.push({ day: i, fullDate: `${i} ${monthNames[scorecardFilters.month]} ${scorecardFilters.year} ${current.toLocaleDateString('tr-TR', { weekday: 'long' })}`, isWeekend: current.getDay() === 0 || current.getDay() === 6 });
    }
    return days;
  }, [scorecardFilters.month, scorecardFilters.year]);

  useEffect(() => {
    const weekdays = daysInMonth.filter(d => !d.isWeekend).map(d => d.day);
    setScorecardSelectedDays(weekdays);
  }, [daysInMonth]);

  const toggleScorecardDay = (day: number) => {
    setScorecardSelectedDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort((a, b) => a - b));
  };

  const scorecardFilteredRows = useMemo(() => daysInMonth.filter(d => scorecardSelectedDays.includes(d.day)), [daysInMonth, scorecardSelectedDays]);
  
  const driverInfo = useMemo(() => {
    const info: Record<string, { route: string }> = {};
    students.forEach(s => { if (s.driver && !info[s.driver]) { info[s.driver] = { route: s.route }; } });
    return info;
  }, [students]);

  // --- Transport Plan State ---
  const [transportPlanRows, setTransportPlanRows] = useState<any[]>([]);
  
  useEffect(() => {
    const savedDataStr = localStorage.getItem('okulservis_transport_plan_v1');
    const savedData = savedDataStr ? JSON.parse(savedDataStr) : loadTransportPlanData();

    const routeMap = new Map<string, any>();
    students.forEach(student => {
      if (!student.route) return;
      const routeName = student.route.trim();
      const grade = parseInt(`${student.className || '0'}`, 10);
      if (!routeMap.has(routeName)) {
        const saved = savedData[routeName] || {};
        const initialClasses: Record<number, { K: number; E: number }> = {};
        for (let i = 1; i <= 8; i++) initialClasses[i] = { K: 0, E: 0 };
        
        routeMap.set(routeName, { 
            route: routeName, 
            distance: saved.distance || 0, 
            classes: initialClasses, 
            vehicleCount: saved.vehicleCount || 1, 
            capacity: saved.capacity || 17, 
            dailyCost: saved.dailyCost || 0, 
            yearlyCost: saved.yearlyCost || 0, 
            reason: saved.reason || '8/b' 
        });
      }
      const entry = routeMap.get(routeName)!;
      if (!isNaN(grade) && grade >= 1 && grade <= 8) {
        if (student.gender === 'KIZ' || (student.gender as any) === 'K') { entry.classes[grade].K++; } 
        else if (student.gender === 'ERKEK' || (student.gender as any) === 'E') { entry.classes[grade].E++; }
      }
    });
    setTransportPlanRows(Array.from(routeMap.values()).sort((a: any, b: any) => {
      const ra = String(a.route || '');
      const rb = String(b.route || '');
      return ra.localeCompare(rb);
    }));
  }, [students]);

  const transportPlanTotals = useMemo(() => transportPlanRows.reduce((acc, row) => {
    let rowTotalK = 0; let rowTotalE = 0;
    for (let i = 1; i <= 8; i++) {
      const k = row.classes[i]?.K || 0; const e = row.classes[i]?.E || 0;
      acc.classes[i].K += k; acc.classes[i].E += e;
      rowTotalK += k; rowTotalE += e;
    }
    acc.totalK += rowTotalK; acc.totalE += rowTotalE; acc.grandTotal += (rowTotalK + rowTotalE);
    return acc;
  }, { classes: { 1: { K: 0, E: 0 }, 2: { K: 0, E: 0 }, 3: { K: 0, E: 0 }, 4: { K: 0, E: 0 }, 5: { K: 0, E: 0 }, 6: { K: 0, E: 0 }, 7: { K: 0, E: 0 }, 8: { K: 0, E: 0 } }, totalK: 0, totalE: 0, grandTotal: 0 }), [transportPlanRows]);

  // --- Distance Report State ---
  const [distanceReportRows, setDistanceReportRows] = useState<any[]>([]);
  
  useEffect(() => {
      const savedData = loadDistanceReportData();
      const savedRowsMap = new Map<string, any>(savedData.map((r: any) => [r.route, r]));

      const uniqueRoutes = Array.from<string>(new Set(students.map(s => s.route).filter(r => r && r.trim() !== ''))).sort();
      
      const newRows = uniqueRoutes.map((route, index) => {
          const saved = savedRowsMap.get(route);
          if (saved) {
              return { ...saved, id: index + 1, total: (Number(saved.asphalt) || 0) + (Number(saved.stabilize) || 0) };
          } else {
              return { id: index + 1, route: route, features: 'Tamamı asfalttır.', asphalt: 0, stabilize: 0, total: 0 };
          }
      });
      
      if (uniqueRoutes.length === 0 && savedData.length > 0) {
          setDistanceReportRows(savedData);
      } else {
          setDistanceReportRows(newRows);
      }
  }, [students]);

  const distanceRouteCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    students.forEach(student => { if(student.route) { counts[student.route] = (counts[student.route] || 0) + 1; } });
    return counts;
  }, [students]);
  const distanceTotals = useMemo(() => distanceReportRows.reduce((acc: any, row: any) => ({ asphalt: acc.asphalt + (Number(row.asphalt) || 0), stabilize: acc.stabilize + (Number(row.stabilize) || 0), total: acc.total + (Number(row.total) || 0) }), { asphalt: 0, stabilize: 0, total: 0 }), [distanceReportRows]);

  // --- Daily Log State ---
  const [dailyLogStartDate, setDailyLogStartDate] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(today.setDate(diff)).toISOString().split('T')[0];
  });
  const dailyLogWeekDates = useMemo(() => {
    const dates = [];
    const current = new Date(dailyLogStartDate);
    for (let i = 0; i < 5; i++) {
      const d = new Date(current);
      d.setDate(current.getDate() + i);
      dates.push(d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' }));
    }
    return dates;
  }, [dailyLogStartDate]);

  const renderPrintableComponent = () => {
    const selectedDriverObj = drivers.find(d => d.name === scorecardFilters.driver);
    if (!printingReport) return null;

    const orientation = reportOrientations[printingReport.type] || 'portrait';

    switch (printingReport.type) {
      case 'students': return <PrintableStudentList students={filteredStudents} classFilter={studentFilters.class} routeFilter="all" orientation={orientation} />;
      case 'drivers-routes': return <PrintableDriversRoutes activeTab={driversReportTab} driversData={driversData} uniqueRoutes={uniqueRoutes} orientation={orientation} />;
      case 'scorecard': return <PrintableScorecard students={students} drivers={drivers} settings={settings} isBulkPrint={scorecardFilters.isBulk} selectedDriver={scorecardFilters.driver} plateNumber={selectedDriverObj?.plateNumber || ''} firmName={scorecardFilters.firmName} monthName={monthNames[scorecardFilters.month]} year={scorecardFilters.year} filteredRows={scorecardFilteredRows} driverInfo={driverInfo} orientation={orientation} />;
      case 'planning': return <PrintableTransportPlan rows={transportPlanRows} totals={transportPlanTotals} settings={settings} orientation={orientation} />;
      case 'distance': return <PrintableDistanceReport rows={distanceReportRows} totals={distanceTotals} routeCounts={distanceRouteCounts} settings={settings} orientation={orientation} />;
      case 'daily-log': return <PrintableDailyLog drivers={drivers} weekDates={dailyLogWeekDates} settings={settings} orientation={orientation} />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {printingReport && (
        <PrintPreview 
          onBack={() => setPrintingReport(null)} 
          title={printingReport.title}
          orientation={reportOrientations[printingReport.type] || 'portrait'}
          initialAction={printingReport.action}
        >
          {renderPrintableComponent()}
        </PrintPreview>
      )}

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Raporlama Merkezi</h1>
          <p className="text-slate-500 text-sm">Tüm raporları ve çıktıları buradan yönetin.</p>
        </div>
      </div>
      
      <div className="space-y-6">
        <ReportAccordion 
          title="Öğrenci Listesi" 
          description="Sınıflara göre filtrelenmiş öğrenci listesi çıktısı alın."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 py-4">
            <div><label className="text-sm font-medium text-slate-600 block mb-1">Sınıfa Göre Filtrele</label><select className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 py-2 px-4 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" value={studentFilters.class} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStudentFilters({ class: e.target.value })}><option value="all">Tüm Sınıflar</option>{classes.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
          </div>
          <ReportActions
            orientation={reportOrientations['students'] || 'portrait'}
            onOrientationChange={(val) => setOrientation('students', val)}
            onPreview={() => setPrintingReport({ type: 'students', title: 'Öğrenci Listesi' })}
            onPdf={() => setPrintingReport({ type: 'students', title: 'Öğrenci Listesi', action: 'pdf' })}
            onPrint={() => setPrintingReport({ type: 'students', title: 'Öğrenci Listesi', action: 'print' })}
          />
        </ReportAccordion>

        <ReportAccordion 
          title="Şoförler ve Güzergahlar" 
          description="Şoför veya güzergah listesi çıktısı alın."
        >
            <div className="py-4"><div className="flex border-b border-slate-200"><button type="button" onClick={() => setDriversReportTab('drivers')} className={`px-4 py-2 text-sm font-medium rounded-t-lg ${driversReportTab === 'drivers' ? 'bg-slate-100 border border-slate-200 border-b-white -mb-px' : 'text-slate-500 hover:bg-slate-50'}`}>Şoför Listesi</button><button type="button" onClick={() => setDriversReportTab('routes')} className={`px-4 py-2 text-sm font-medium rounded-t-lg ${driversReportTab === 'routes' ? 'bg-slate-100 border border-slate-200 border-b-white -mb-px' : 'text-slate-500 hover:bg-slate-50'}`}>Güzergah Listesi</button></div></div>
            <ReportActions 
                orientation={reportOrientations['drivers-routes'] || 'portrait'}
                onOrientationChange={(val) => setOrientation('drivers-routes', val)}
                onPreview={() => setPrintingReport({ type: 'drivers-routes', title: 'Şoför & Güzergah Listesi' })}
                onPdf={() => setPrintingReport({ type: 'drivers-routes', title: 'Şoför & Güzergah Listesi', action: 'pdf' })} 
                onPrint={() => setPrintingReport({ type: 'drivers-routes', title: 'Şoför & Güzergah Listesi', action: 'print' })} 
            />
        </ReportAccordion>

        <ReportAccordion 
          title="Puantaj (İmza Çizelgesi)" 
          description="Aylık şoför puantaj cetveli çıktısı alın."
        >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 py-4 items-end">
                <div><label className="text-sm font-medium text-slate-600 block mb-1">Şoför</label><select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none disabled:bg-slate-100" value={scorecardFilters.driver} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setScorecardFilters(prev => ({ ...prev, driver: e.target.value }))} disabled={scorecardFilters.isBulk}><option value="">Seçiniz...</option>{drivers.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}</select></div>
                <div><label className="text-sm font-medium text-slate-600 block mb-1">Ay / Yıl</label><div className="flex gap-2"><select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none" value={scorecardFilters.month} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setScorecardFilters(prev => ({ ...prev, month: Number(e.target.value) }))}>{monthNames.map((m, i) => (<option key={i} value={i}>{m}</option>))}</select><input type="number" className="w-24 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none" value={scorecardFilters.year} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setScorecardFilters(prev => ({ ...prev, year: Number(e.target.value) }))} /></div></div>
                <div className="flex items-center space-x-3"><div onClick={() => setScorecardFilters(prev => ({...prev, isBulk: !prev.isBulk}))} className={`w-10 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${scorecardFilters.isBulk ? 'bg-indigo-600' : 'bg-slate-300'}`}><div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${scorecardFilters.isBulk ? 'translate-x-4' : ''}`}></div></div><span className="text-sm font-medium text-slate-700">Tüm Şoförler</span></div>
            </div>
            
            <div className="mt-4 border-t border-slate-100 pt-4">
               <div className="flex items-center justify-between mb-2">
                 <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                   <Calendar size={16} />
                   <span>Puantaj Günlerini Seçiniz</span>
                 </label>
                 <div className="text-xs text-slate-500">
                   Seçilen Gün Sayısı: <span className="font-bold text-blue-600">{scorecardSelectedDays.length}</span>
                 </div>
               </div>
               <div className="grid grid-cols-7 gap-2">
                  {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(d => (<div key={d} className="text-center text-xs font-bold text-slate-400 py-1">{d}</div>))}
                  {Array.from({ length: (new Date(scorecardFilters.year, scorecardFilters.month, 1).getDay() + 6) % 7 }).map((_, i) => (<div key={`empty-${i}`} className="h-8"></div>))}
                  {daysInMonth.map((day) => { 
                    const isSelected = scorecardSelectedDays.includes(day.day); 
                    return (
                      <button type="button" key={day.day} onClick={() => toggleScorecardDay(day.day)} className={`h-8 rounded border text-xs font-medium transition-all relative ${isSelected ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'} ${day.isWeekend && !isSelected ? 'bg-slate-50 opacity-60' : ''}`} >
                        {day.day}
                        {isSelected && <Check size={10} className="absolute top-0.5 right-0.5 opacity-50" />}
                      </button>
                    ); 
                  })}
               </div>
            </div>

            <ReportActions 
                orientation={reportOrientations['scorecard'] || 'portrait'}
                onOrientationChange={(val) => setOrientation('scorecard', val)}
                onPreview={() => setPrintingReport({ type: 'scorecard', title: 'Aylık Puantaj' })}
                onPdf={() => setPrintingReport({ type: 'scorecard', title: 'Aylık Puantaj', action: 'pdf' })} 
                onPrint={() => setPrintingReport({ type: 'scorecard', title: 'Aylık Puantaj', action: 'print' })} 
            />
        </ReportAccordion>

        <ReportAccordion 
          title="Taşıma Planlama (Ek-1)" 
          description="Yıllık taşıma planlama raporu (EK-1) çıktısı alın."
        >
             <ReportActions 
                orientation={reportOrientations['planning'] || 'landscape'}
                onOrientationChange={(val) => setOrientation('planning', val)}
                onPreview={() => setPrintingReport({ type: 'planning', title: 'Taşıma Planlama (Ek-1)' })}
                onPdf={() => setPrintingReport({ type: 'planning', title: 'Taşıma Planlama (Ek-1)', action: 'pdf' })} 
                onPrint={() => setPrintingReport({ type: 'planning', title: 'Taşıma Planlama (Ek-1)', action: 'print' })} 
             />
        </ReportAccordion>
        
        <ReportAccordion 
          title="Mesafe Tutanağı" 
          description="Güzergahların mesafe ve özelliklerini gösteren tutanak çıktısı alın."
        >
            <ReportActions 
                orientation={reportOrientations['distance'] || 'landscape'}
                onOrientationChange={(val) => setOrientation('distance', val)}
                onPreview={() => setPrintingReport({ type: 'distance', title: 'Mesafe Tutanağı' })}
                onPdf={() => setPrintingReport({ type: 'distance', title: 'Mesafe Tutanağı', action: 'pdf' })} 
                onPrint={() => setPrintingReport({ type: 'distance', title: 'Mesafe Tutanağı', action: 'print' })} 
            />
        </ReportAccordion>
        
        <ReportAccordion 
          title="Günlük İmza Çizelgesi" 
          description="Haftalık bazda, şoförler için günlük imza çizelgesi çıktısı alın."
        >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 py-4">
                <div><label className="text-sm font-medium text-slate-600 block mb-1">Hafta Başlangıcı</label><input type="date" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none" value={dailyLogStartDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDailyLogStartDate(e.target.value)} /></div>
            </div>
            <ReportActions 
                orientation={reportOrientations['daily-log'] || 'landscape'}
                onOrientationChange={(val) => setOrientation('daily-log', val)}
                onPreview={() => setPrintingReport({ type: 'daily-log', title: 'Günlük İmza Çizelgesi' })}
                onPdf={() => setPrintingReport({ type: 'daily-log', title: 'Günlük İmza Çizelgesi', action: 'pdf' })} 
                onPrint={() => setPrintingReport({ type: 'daily-log', title: 'Günlük İmza Çizelgesi', action: 'print' })} 
            />
        </ReportAccordion>

      </div>
    </div>
  );
};
