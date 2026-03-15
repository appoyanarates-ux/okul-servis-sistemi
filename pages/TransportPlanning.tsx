
import React, { useState, useEffect, useRef } from 'react';
import { Student, AppSettings, Driver } from '../types';
import { Printer, Save, Edit2, AlertCircle, FileText, ArrowRightLeft, Eye, Bus, CreditCard, Users, X, Download } from 'lucide-react';
import { saveTransportPlanData, loadTransportPlanData, loadDistanceReportData, saveDistanceReportData } from '../services/storage';
import { PrintPreview } from '../components/PrintPreview';

// Globals for html2pdf
declare var html2pdf: any;

interface TransportPlanningProps {
  students: Student[];
  drivers: Driver[];
  settings: AppSettings;
}

interface TableRow {
  id: string;
  route: string;
  distance: number;
  classes: Record<number, { K: number; E: number }>;
  vehicleCount: number;
  capacity: number;
  dailyCost: number;
  yearlyCost: number;
  reason: string;
}

const getRowTotals = (row: TableRow) => {
  let k = 0, e = 0;
  for(let i=1; i<=8; i++) { k += row.classes[i].K; e += row.classes[i].E; }
  return { k, e, t: k+e };
};

// --- PRINTABLE COMPONENT (Standard Layout) ---
export const PrintableTransportPlan: React.FC<{
  rows: TableRow[];
  totals: any;
  settings: AppSettings;
  orientation?: 'portrait' | 'landscape';
}> = ({ rows, totals, settings, orientation = 'landscape' }) => {
  return (
    <div className="bg-white p-4 font-sans text-black">
      <style>{`
        @page { size: ${orientation}; margin: 5mm; }
        body { background-color: white !important; }
        table, th, td { border: 1px solid black !important; border-collapse: collapse !important; }
        .break-inside-avoid { page-break-inside: avoid; }
      `}</style>
      
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold">TAŞIMA PLANLAMA (EK-1)</h2>
        <div className="text-sm mt-1 font-bold uppercase">{settings.schoolName}</div>
        <div className="text-xs text-slate-600">{settings.educationYear} Eğitim Öğretim Yılı</div>
      </div>

      <table className="w-full text-[10px] text-center">
        <thead>
          <tr className="bg-slate-100 font-bold">
            <th rowSpan={2} className="p-1 w-8">S.No</th>
            <th rowSpan={2} className="p-1 text-left">Güzergah Adı</th>
            <th rowSpan={2} className="p-1 w-12">Mesafe (KM)</th>
            <th colSpan={2} className="p-1">1. Sınıf</th>
            <th colSpan={2} className="p-1">2. Sınıf</th>
            <th colSpan={2} className="p-1">3. Sınıf</th>
            <th colSpan={2} className="p-1">4. Sınıf</th>
            <th colSpan={2} className="p-1">5. Sınıf</th>
            <th colSpan={2} className="p-1">6. Sınıf</th>
            <th colSpan={2} className="p-1">7. Sınıf</th>
            <th colSpan={2} className="p-1">8. Sınıf</th>
            <th rowSpan={2} className="p-1 w-10">Top. Öğr</th>
            <th rowSpan={2} className="p-1 w-10">Araç Sayısı</th>
            <th rowSpan={2} className="p-1 w-10">Kap.</th>
            <th rowSpan={2} className="p-1">Yıllık Maliyet</th>
          </tr>
          <tr className="bg-slate-100 font-bold">
             {/* K/E subheaders */}
             {Array.from({length:8}).map((_,i) => <React.Fragment key={i}><th className="p-1">K</th><th className="p-1">E</th></React.Fragment>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const rowTotals = getRowTotals(row);
            return (
              <tr key={index} className="break-inside-avoid">
                <td className="p-1 font-bold">{index + 1}</td>
                <td className="p-1 text-left">{row.route}</td>
                <td className="p-1">{row.distance}</td>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(g => (
                  <React.Fragment key={g}>
                    <td className="p-1 text-slate-600">{row.classes[g].K || ''}</td>
                    <td className="p-1 text-slate-600">{row.classes[g].E || ''}</td>
                  </React.Fragment>
                ))}
                <td className="p-1 font-bold bg-slate-50">{rowTotals.t}</td>
                <td className="p-1">{row.vehicleCount}</td>
                <td className="p-1">{row.capacity}</td>
                <td className="p-1">{row.yearlyCost > 0 ? row.yearlyCost : ''}</td>
              </tr>
            );
          })}
          <tr className="bg-slate-100 font-bold">
            <td colSpan={3} className="text-right p-1">GENEL TOPLAM</td>
            {[1, 2, 3, 4, 5, 6, 7, 8].map(g => (<React.Fragment key={g}><td className="p-1">{totals.classes[g].K}</td><td className="p-1">{totals.classes[g].E}</td></React.Fragment>))}
            <td className="p-1">{totals.grandTotal}</td>
            <td className="p-1">{totals.totalVehicles}</td>
            <td className="p-1"></td>
            <td className="p-1">{totals.totalCost > 0 ? totals.totalCost.toLocaleString('tr-TR') : ''}</td>
          </tr>
        </tbody>
      </table>
      
      <div className="mt-12 flex justify-around px-8 text-xs text-center font-bold break-inside-avoid">
          <div className="flex flex-col gap-8 min-w-[150px]">
              <div>DÜZENLEYEN</div>
              <div className="space-y-4">
                  {settings.vicePrincipals.map((vp, i) => (
                      <div key={i}>
                          {vp}<br/>
                          <span className="font-normal">Müdür Yardımcısı</span>
                      </div>
                  ))}
              </div>
          </div>
          <div className="flex flex-col gap-8 min-w-[150px]">
              <div>ONAYLAYAN</div>
              <div className="space-y-4">
                  {settings.principals.map((p, i) => (
                      <div key={i}>
                          {p}<br/>
                          <span className="font-normal">Okul Müdürü</span>
                      </div>
                  ))}
              </div>
          </div>
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---
export const TransportPlanning: React.FC<TransportPlanningProps> = ({ students, drivers, settings }) => {
  const [rows, setRows] = useState<TableRow[]>([]);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');
  const [editingRow, setEditingRow] = useState<any | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const hiddenPrintRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
        const savedData = await loadTransportPlanData();
        const distanceData = await loadDistanceReportData();
        const distanceMap = new Map(distanceData.map((r: any) => [r.route, r.total]));
        const routeMap = new Map<string, TableRow>();
        
        students.forEach(student => {
          if (!student.route) return;
          const routeName = student.route.trim();
          // Safe integer parsing for grade
          const gradeStr = student.className.replace(/[^0-9]/g, '');
          const grade = gradeStr ? parseInt(gradeStr) : 0;
          
          if (!routeMap.has(routeName)) {
            const saved = savedData[routeName] || {};
            const initialClasses: Record<number, { K: number; E: number }> = {};
            for (let i = 1; i <= 8; i++) initialClasses[i] = { K: 0, E: 0 };
            
            const distance = distanceMap.has(routeName) ? distanceMap.get(routeName) : (saved.distance || 0);
            const driver = drivers.find(d => d.routes.includes(routeName));
            const seatCount = driver?.seatCount;
    
            routeMap.set(routeName, { 
                id: routeName, 
                route: routeName, 
                distance: distance, 
                classes: initialClasses, 
                vehicleCount: saved.vehicleCount || 1, 
                capacity: seatCount || saved.capacity || 17, 
                dailyCost: saved.dailyCost || 0, 
                yearlyCost: saved.yearlyCost || 0, 
                reason: saved.reason || 'Ulaşım Güçlüğü' 
            });
          }
          
          const entry = routeMap.get(routeName)!;
          if (grade >= 1 && grade <= 8) {
            if (student.gender === 'KIZ' || (student.gender as any) === 'K') { 
                entry.classes[grade].K++; 
            } else if (student.gender === 'ERKEK' || (student.gender as any) === 'E') { 
                entry.classes[grade].E++; 
            }
          }
        });
    
        const calculatedRows = Array.from(routeMap.values()).sort((a, b) => a.route.localeCompare(b.route));
        setRows(calculatedRows);
    };
    fetchData();
  }, [students, drivers]);
  
  useEffect(() => {
      const saveData = async () => {
          if (rows.length > 0) {
              const dataToSave: Record<string, any> = {};
              rows.forEach(row => {
                  dataToSave[row.route] = {
                      distance: row.distance,
                      vehicleCount: row.vehicleCount,
                      capacity: row.capacity,
                      dailyCost: row.dailyCost,
                      yearlyCost: row.yearlyCost,
                      reason: row.reason
                  };
              });
              await saveTransportPlanData(dataToSave);
          }
      };
      saveData();
  }, [rows]);
  
  const totals = rows.reduce((acc, row) => {
    let rowTotalK = 0; let rowTotalE = 0;
    for (let i = 1; i <= 8; i++) {
      const k = row.classes[i]?.K || 0; const e = row.classes[i]?.E || 0;
      acc.classes[i].K += k; acc.classes[i].E += e;
      rowTotalK += k; rowTotalE += e;
    }
    acc.totalK += rowTotalK; acc.totalE += rowTotalE; acc.grandTotal += (rowTotalK + rowTotalE);
    acc.totalVehicles += Number(row.vehicleCount) || 0;
    acc.totalCost += Number(row.yearlyCost) || 0;
    return acc;
  }, { 
      classes: { 1: { K: 0, E: 0 }, 2: { K: 0, E: 0 }, 3: { K: 0, E: 0 }, 4: { K: 0, E: 0 }, 5: { K: 0, E: 0 }, 6: { K: 0, E: 0 }, 7: { K: 0, E: 0 }, 8: { K: 0, E: 0 } } as Record<number, { K: number; E: number }>, 
      totalK: 0, totalE: 0, grandTotal: 0, totalVehicles: 0, totalCost: 0
  });

  const handleUpdateRow = async () => {
      if (!editingRow) return;
      const updatedRow: TableRow = {
          ...editingRow,
          distance: Number(editingRow.distance),
          vehicleCount: Number(editingRow.vehicleCount),
          capacity: Number(editingRow.capacity),
          dailyCost: Number(editingRow.dailyCost),
          yearlyCost: Number(editingRow.yearlyCost),
      };
      setRows(prev => prev.map(r => r.id === editingRow.id ? updatedRow : r));
      
      // Sync to DistanceReport
      const distanceData = await loadDistanceReportData();
      const existingDistIndex = distanceData.findIndex((r: any) => r.route === updatedRow.route);
      if (existingDistIndex >= 0) {
          distanceData[existingDistIndex].asphalt = updatedRow.distance;
          distanceData[existingDistIndex].total = updatedRow.distance + (distanceData[existingDistIndex].stabilize || 0);
      } else {
          distanceData.push({
              id: distanceData.length + 1,
              route: updatedRow.route,
              features: 'Tamamı asfalttır.',
              asphalt: updatedRow.distance,
              stabilize: 0,
              total: updatedRow.distance
          });
      }
      await saveDistanceReportData(distanceData);

      setEditingRow(null);
  };

  const handleDownloadPDF = () => {
    if (!hiddenPrintRef.current) return;
    setIsDownloading(true);
    
    const element = hiddenPrintRef.current;
    const opt = {
      margin: 5,
      filename: 'Tasima_Planlama_Ek1.pdf',
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
    <div className="space-y-6 animate-fade-in">
      {isPreviewing && (
        <PrintPreview 
          title="Taşıma Planlama (Ek-1)" 
          onBack={() => setIsPreviewing(false)}
          orientation={orientation}
        >
             <PrintableTransportPlan rows={rows} totals={totals} settings={settings} orientation={orientation} />
        </PrintPreview>
      )}

      {/* Hidden for PDF generation */}
      <div className="hidden">
          <div ref={hiddenPrintRef}>
            <PrintableTransportPlan 
                rows={rows} 
                totals={totals} 
                settings={settings} 
                orientation={orientation} 
            />
          </div>
      </div>

      {/* Edit Modal */}
      {editingRow && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
              <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
                  <div className="flex items-center justify-between p-4 border-b border-slate-100">
                      <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Edit2 size={20} className="text-blue-600"/> Planlama Düzenle</h3>
                      <button onClick={() => setEditingRow(null)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                  </div>
                  <div className="p-6 space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Güzergah Adı</label>
                          <input type="text" disabled className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-500" value={editingRow.route} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Mesafe (KM)</label>
                              <input type="number" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={editingRow.distance} onChange={(e) => setEditingRow({ ...editingRow, distance: e.target.value })} />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Araç Sayısı</label>
                              <input type="number" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={editingRow.vehicleCount} onChange={(e) => setEditingRow({ ...editingRow, vehicleCount: e.target.value })} />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Araç Kapasitesi</label>
                              <input type="number" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={editingRow.capacity} onChange={(e) => setEditingRow({ ...editingRow, capacity: e.target.value })} />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Taşıma Nedeni</label>
                              <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={editingRow.reason} onChange={(e) => setEditingRow({ ...editingRow, reason: e.target.value })} />
                          </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                          <div>
                              <label className="block text-xs font-bold text-slate-500 mb-1">Günlük Maliyet (TL)</label>
                              <input type="number" className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none" value={editingRow.dailyCost} onChange={(e) => setEditingRow({ ...editingRow, dailyCost: e.target.value })} />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-slate-500 mb-1">Yıllık Maliyet (TL)</label>
                              <input type="number" className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none" value={editingRow.yearlyCost} onChange={(e) => setEditingRow({ ...editingRow, yearlyCost: e.target.value })} />
                          </div>
                      </div>
                  </div>
                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                      <button onClick={() => setEditingRow(null)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg">İptal</button>
                      <button onClick={handleUpdateRow} className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-sm">Kaydet</button>
                  </div>
              </div>
          </div>
      )}

      {/* Header and Stats */}
      <div className="space-y-6">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Taşıma Planlama</h1>
              <p className="text-slate-500 text-sm">Öğrenci sayıları otomatik hesaplanır. Maliyet ve araç bilgilerini düzenleyebilirsiniz.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1 mr-2">
                    <button 
                        onClick={() => setOrientation('portrait')} 
                        className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1 transition-colors ${orientation === 'portrait' ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                        title="Dikey"
                    >
                        <FileText size={14} />
                        <span>Dikey</span>
                    </button>
                    <button 
                        onClick={() => setOrientation('landscape')} 
                        className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1 transition-colors ${orientation === 'landscape' ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                        title="Yatay"
                    >
                        <ArrowRightLeft size={14} />
                        <span>Yatay</span>
                    </button>
                </div>
                <button onClick={() => setIsPreviewing(true)} className="flex items-center space-x-2 bg-violet-50 text-violet-700 hover:bg-violet-100 px-3 py-2 rounded-lg transition-colors font-medium border border-violet-200 shadow-sm" title="Önizle"><Eye size={16} /><span className="hidden sm:inline">Önizle</span></button>
                <button onClick={handleDownloadPDF} disabled={isDownloading} className="flex items-center space-x-2 bg-red-50 text-red-700 hover:bg-red-100 px-3 py-2 rounded-lg transition-colors font-medium border border-red-200 shadow-sm disabled:opacity-50"><Download size={16} /><span className="hidden sm:inline">{isDownloading ? '...' : 'PDF İndir'}</span></button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                  <div className="p-3 bg-blue-100 text-blue-600 rounded-lg"><Users size={24}/></div>
                  <div><p className="text-sm text-slate-500">Toplam Öğrenci</p><h3 className="text-2xl font-bold text-slate-800">{totals.grandTotal}</h3></div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                  <div className="p-3 bg-orange-100 text-orange-600 rounded-lg"><Bus size={24}/></div>
                  <div><p className="text-sm text-slate-500">Planlanan Araç</p><h3 className="text-2xl font-bold text-slate-800">{totals.totalVehicles}</h3></div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                  <div className="p-3 bg-green-100 text-green-600 rounded-lg"><CreditCard size={24}/></div>
                  <div><p className="text-sm text-slate-500">Yıllık Toplam Maliyet</p><h3 className="text-2xl font-bold text-slate-800">{totals.totalCost.toLocaleString('tr-TR')} ₺</h3></div>
              </div>
          </div>

          {/* Data Table */}
          {rows.length === 0 ? (
              <div className="bg-blue-50 text-blue-800 p-4 rounded-lg flex items-center gap-2"><AlertCircle size={20} /><p>Listelenecek veri bulunamadı. Lütfen önce öğrenci listesi yükleyiniz.</p></div>
          ) : (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                          <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                              <tr>
                                  <th className="px-6 py-4 w-12">No</th>
                                  <th className="px-6 py-4">Güzergah Adı</th>
                                  <th className="px-6 py-4">Atanan Şoför</th>
                                  <th className="px-6 py-4 text-center">Öğrenci Sayısı</th>
                                  <th className="px-6 py-4 text-center">Mesafe (KM)</th>
                                  <th className="px-6 py-4 text-center">Araç Sayısı</th>
                                  <th className="px-6 py-4 text-center">Yıllık Maliyet</th>
                                  <th className="px-6 py-4 text-right">İşlemler</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                              {rows.map((row, index) => {
                                  const rowTotal = getRowTotals(row).t;
                                  return (
                                      <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                                          <td className="px-6 py-4 text-slate-500 font-mono">{index + 1}</td>
                                          <td className="px-6 py-4 font-medium text-slate-800">{row.route}</td>
                                          <td className="px-6 py-4 text-slate-600">{drivers.find(d => d.routes?.some(r => r?.trim() === row.route))?.name || <span className="text-slate-400 italic">Atanmamış</span>}</td>
                                          <td className="px-6 py-4 text-center"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{rowTotal}</span></td>
                                          <td className="px-6 py-4 text-center text-slate-600">{row.distance}</td>
                                          <td className="px-6 py-4 text-center text-slate-600">{row.vehicleCount}</td>
                                          <td className="px-6 py-4 text-center font-medium text-slate-800">{row.yearlyCost > 0 ? `${row.yearlyCost.toLocaleString('tr-TR')} ₺` : '-'}</td>
                                          <td className="px-6 py-4 text-right">
                                              <button onClick={() => setEditingRow(row)} className="text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg text-xs font-medium border border-blue-200 transition-colors">Düzenle</button>
                                          </td>
                                      </tr>
                                  );
                              })}
                          </tbody>
                      </table>
                  </div>
              </div>
          )}
      </div>
    </div>
  );
};
