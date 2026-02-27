
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Edit, Save, Plus, Trash2, X, AlertTriangle, ArrowRightLeft, FileText, Eye, MapPin, Navigation, School, Loader2, ArrowUp, ArrowDown, MousePointer2, Users, Download } from 'lucide-react';
import { Student, AppSettings, Driver } from '../types';
import { loadDistanceReportData, saveDistanceReportData } from '../services/storage';
import { PrintPreview } from '../components/PrintPreview';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Globals for html2pdf
declare var html2pdf: any;

// Leaflet Icons
const iconSchool = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});
const iconStop = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

interface DistanceReportProps {
  students: Student[];
  drivers: Driver[];
  settings: AppSettings;
}

interface ReportRow {
  id: number;
  route: string;
  features: string;
  asphalt: number;
  stabilize: number;
  total: number;
}

const COMMON_FEATURES = [
    "Tamamı Asfalt", 
    "Stabilize", 
    "Toprak Yol", 
    "Kışın Karlı/Buzlu", 
    "Heyelan Riski", 
    "Dik Eğimli",
    "Virajlı"
];

const MapController = ({ bounds }: { bounds: L.LatLngBoundsExpression | null }) => {
    const map = useMap();
    useEffect(() => { 
        if (bounds) map.fitBounds(bounds, { padding: [50, 50] }); 
    }, [bounds, map]);
    return null;
};

// Component to handle clicks on the map to add points
const MapClickHandler = ({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) => {
    useMapEvents({
        click(e) {
            onMapClick(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
};

// --- PRINTABLE COMPONENT (Official Layout) ---
export const PrintableDistanceReport: React.FC<{
  rows: ReportRow[];
  totals: { asphalt: number, stabilize: number, total: number };
  routeCounts: Record<string, number>;
  settings: AppSettings;
  orientation?: 'portrait' | 'landscape';
}> = ({ rows, totals, routeCounts, settings, orientation = 'landscape' }) => {

  const admins = [
      { name: settings.principalName, title: 'Okul Müdürü', role: 'KOMİSYON BAŞKANI' },
      settings.principalName2 ? { name: settings.principalName2, title: 'Okul Müdürü', role: 'ÜYE' } : null,
      settings.vicePrincipal1 ? { name: settings.vicePrincipal1, title: 'Müdür Yardımcısı', role: 'ÜYE' } : null,
      settings.vicePrincipal2 ? { name: settings.vicePrincipal2, title: 'Müdür Yardımcısı', role: 'ÜYE' } : null,
      settings.vicePrincipal3 ? { name: settings.vicePrincipal3, title: 'Müdür Yardımcısı', role: 'ÜYE' } : null,
      settings.vicePrincipal4 ? { name: settings.vicePrincipal4, title: 'Müdür Yardımcısı', role: 'ÜYE' } : null,
  ].filter(Boolean);

  return (
    <div className="bg-white p-4 font-sans" id="printable-distance-report">
        <style>{`
          @page { size: ${orientation}; margin: 5mm; }
          body { background-color: white !important; }
          table, th, td { border: 1px solid black !important; border-collapse: collapse !important; }
          .break-inside-avoid { page-break-inside: avoid; }
        `}</style>
        <div className="text-center mb-4">
          <h2 className="text-lg font-bold uppercase">{settings.schoolName} TAŞIMALI EĞİTİM GÜZERGAH VE MESAFE CETVELİ</h2>
        </div>
        <table className="w-full border-collapse border border-black text-center table-fixed text-[10px] leading-tight">
          <thead>
            <tr className="bg-slate-100 font-bold">
              <th className="p-1 w-[5%]">S.No</th><th className="p-1 w-[20%]">Güzergah Adı</th><th className="p-1 w-[10%]">Öğrenci Sayısı</th><th className="p-1 w-[35%]">Güzergah Özellikleri</th><th className="p-1 w-[10%]">Asfalt (KM)</th><th className="p-1 w-[10%]">Stabilize (KM)</th><th className="p-1 w-[10%]">Toplam (KM)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.id} className="break-inside-avoid">
                <td className="p-1 font-bold">{index + 1}</td>
                <td className="text-left p-1">{row.route}</td>
                <td className="p-1 font-bold">{routeCounts[row.route] || 0}</td>
                <td className="text-left p-1">{row.features}</td>
                <td className="p-1">{row.asphalt}</td>
                <td className="p-1">{row.stabilize}</td>
                <td className="p-1 font-bold">{row.total}</td>
              </tr>
            ))}
            <tr className="bg-slate-100 font-bold">
              <td className="text-right p-1" colSpan={4}>TOPLAM</td><td className="p-1">{totals.asphalt}</td><td className="p-1">{totals.stabilize}</td><td className="p-1">{totals.total}</td>
            </tr>
          </tbody>
        </table>
        <div className="mt-8 text-xs break-inside-avoid"><p>Yukarıda dökümü yapılan güzergahların kilometreleri ve özellikleri komisyonumuzca yerinde görülerek tespit edilmiş olup iş bu tutanak imza altına alınmıştır.</p></div>
        
        <div className="mt-12 flex flex-wrap justify-between gap-8 px-8 text-xs text-center font-bold break-inside-avoid">
            {admins.map((admin, idx) => (
                <div key={idx} className="flex flex-col gap-1 items-center min-w-[120px]">
                    <div>{admin?.role}</div>
                    <div className="mt-4">{admin?.name}</div>
                    <div>{admin?.title}</div>
                </div>
            ))}
        </div>
    </div>
  );
}

// --- MAIN COMPONENT ---
export const DistanceReport: React.FC<DistanceReportProps> = ({ students, drivers, settings }) => {
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');
  const [editingRow, setEditingRow] = useState<ReportRow | null>(null); // For Modal
  const [isDownloading, setIsDownloading] = useState(false);
  const hiddenPrintRef = useRef<HTMLDivElement>(null);
  
  // Map Calculation State
  const [mapCalc, setMapCalc] = useState<{ 
      isOpen: boolean; 
      rowId: number; 
      calculatedDist: number | null;
      routeGeom: [number, number][] | null;
      routePoints: { name: string; lat?: number; lon?: number; studentCount?: number; studentNames?: string }[];
      mapBounds: L.LatLngBoundsExpression | null;
      loading: boolean;
      error: string | null;
  }>({ 
      isOpen: false, 
      rowId: 0, 
      calculatedDist: null,
      routeGeom: null,
      routePoints: [],
      mapBounds: null,
      loading: false,
      error: null
  });

  const [newPointName, setNewPointName] = useState('');

  const schoolCoords: [number, number] = [settings.mapCenterLat || 37.5350, settings.mapCenterLng || 36.1950];

  useEffect(() => {
    const savedRows = loadDistanceReportData();
    const savedRowsMap = new Map<string, any>(savedRows.map((r: any) => [r.route as string, r]));
    
    // 1. Get routes from students
    const studentRoutes = new Set<string>(students.map(s => s.route).filter((r): r is string => !!r && r.trim() !== ''));
    
    // 2. Get routes from drivers
    const driverRoutesArray: string[] = [];
    drivers.forEach(d => {
        if (d.routes) {
            driverRoutesArray.push(...d.routes);
        }
    });
    const driverRoutes = new Set<string>(driverRoutesArray.filter((r): r is string => !!r && r.trim() !== ''));

    // 3. Combine both
    const allRoutes = new Set<string>([...studentRoutes, ...driverRoutes]);
    const uniqueRoutes = Array.from(allRoutes).sort();
    
    const newRows: ReportRow[] = uniqueRoutes.map((route: string, index) => {
        const saved = savedRowsMap.get(route);
        if (saved) {
            return { 
                ...saved, 
                id: index + 1,
                total: (Number(saved.asphalt) || 0) + (Number(saved.stabilize) || 0)
            };
        } else {
            return {
                id: index + 1,
                route: route,
                features: 'Tamamı asfalttır.',
                asphalt: 0,
                stabilize: 0,
                total: 0
            };
        }
    });

    setRows(newRows);

  }, [students, drivers]);

  useEffect(() => {
    if (rows.length > 0) {
        saveDistanceReportData(rows);
    }
  }, [rows]);

  const routeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    students.forEach(student => { if(student.route) { counts[student.route] = (counts[student.route] || 0) + 1; } });
    return counts;
  }, [students]);
  
  const totals = useMemo(() => {
    return rows.reduce((acc, row) => {
      acc.asphalt += Number(row.asphalt) || 0;
      acc.stabilize += Number(row.stabilize) || 0;
      acc.total += Number(row.total) || 0;
      return acc;
    }, { asphalt: 0, stabilize: 0, total: 0 });
  }, [rows]);

  const handleDownloadPDF = () => {
    if (!hiddenPrintRef.current) return;
    setIsDownloading(true);
    
    const element = hiddenPrintRef.current;
    const opt = {
      margin: 5,
      filename: 'Mesafe_Tutanagi.pdf',
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
  
  const handleSaveRow = () => {
      if (!editingRow) return;
      setRows(prev => prev.map(r => r.id === editingRow.id ? { ...editingRow, total: Number(editingRow.asphalt) + Number(editingRow.stabilize) } : r));
      setEditingRow(null);
  };

  const openMapCalculator = (rowId: number, currentRoute: string) => {
      const associatedStudents = students.filter(s => s.route === currentRoute);
      const uniqueVillages = Array.from(new Set(associatedStudents.map(s => s.village).filter(Boolean))).sort();

      const pointsWithStudents = uniqueVillages.map(v => {
          const studs = associatedStudents.filter(s => s.village === v);
          return {
              name: v,
              studentCount: studs.length,
              studentNames: studs.map(s => s.name).join(', ')
          };
      });

      setMapCalc({ 
          isOpen: true, 
          rowId, 
          calculatedDist: null,
          routeGeom: null,
          routePoints: pointsWithStudents, 
          mapBounds: null,
          loading: false,
          error: uniqueVillages.length === 0 ? "Kayıtlı köy bulunamadı. Lütfen manuel ekleyiniz." : null
      });
      setNewPointName('');
  };

  const moveRoutePoint = (index: number, direction: 'up' | 'down') => {
      setMapCalc(prev => {
          const newPoints = [...prev.routePoints];
          if (direction === 'up' && index > 0) {
              [newPoints[index], newPoints[index - 1]] = [newPoints[index - 1], newPoints[index]];
          } else if (direction === 'down' && index < newPoints.length - 1) {
              [newPoints[index], newPoints[index + 1]] = [newPoints[index + 1], newPoints[index]];
          }
          return { ...prev, routePoints: newPoints, calculatedDist: null, routeGeom: null };
      });
  };

  const removeRoutePoint = (index: number) => {
      setMapCalc(prev => {
          const newPoints = [...prev.routePoints];
          newPoints.splice(index, 1);
          return { ...prev, routePoints: newPoints, calculatedDist: null, routeGeom: null };
      });
  };

  const addRoutePoint = () => {
      if (newPointName.trim()) {
          setMapCalc(prev => ({ 
              ...prev, 
              routePoints: [...prev.routePoints, { name: newPointName, studentCount: 0 }], 
              calculatedDist: null, 
              routeGeom: null 
          }));
          setNewPointName('');
      }
  };

  // Haritaya tıklayınca nokta ekle
  const handleMapClick = (lat: number, lng: number) => {
      setMapCalc(prev => ({
          ...prev,
          routePoints: [...prev.routePoints, { name: `Seçilen Konum (${prev.routePoints.length + 1})`, lat, lon: lng, studentCount: 0 }],
          calculatedDist: null,
          routeGeom: null
      }));
  };

  // Marker sürüklendiğinde konumu güncelle
  const updatePointPosition = (index: number, lat: number, lng: number) => {
      setMapCalc(prev => {
          const newPoints = [...prev.routePoints];
          newPoints[index] = { ...newPoints[index], lat, lon: lng };
          return { ...prev, routePoints: newPoints, calculatedDist: null, routeGeom: null };
      });
  };

  const calculateFullRoute = async () => {
      if (mapCalc.routePoints.length === 0) return;
      setMapCalc(prev => ({ ...prev, loading: true, error: null }));

      try {
          const geocodedPoints: { lat: number; lon: number; name: string }[] = [];
          
          for (const point of mapCalc.routePoints) {
              // Eğer zaten koordinatı varsa (haritadan eklenmiş veya daha önce bulunmuşsa)
              if (point.lat && point.lon) {
                  geocodedPoints.push({ lat: point.lat, lon: point.lon, name: point.name });
              } else {
                  // Yoksa isme göre ara
                  const query = `${point.name}, ${settings.district}, ${settings.province}, Türkiye`;
                  const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
                  const data = await res.json();
                  
                  if (data && data.length > 0) {
                      geocodedPoints.push({ lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon), name: point.name });
                  } else {
                      // Hata fırlatma, sadece uyarı ver ve o noktayı atla veya 0,0 yapma
                      throw new Error(`"${point.name}" konumu bulunamadı. Lütfen ismini kontrol edin veya harita üzerinden manuel ekleyin.`);
                  }
                  // Rate limit
                  await new Promise(r => setTimeout(r, 1100));
              }
          }

          if (geocodedPoints.length === 0) throw new Error("Durakların konumları bulunamadı.");

          let coordinates = geocodedPoints.map(p => `${p.lon},${p.lat}`).join(';');
          // Add School as destination
          coordinates += `;${schoolCoords[1]},${schoolCoords[0]}`; 

          const routerUrl = `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson`;
          const routeRes = await fetch(routerUrl);
          const routeData = await routeRes.json();

          if (routeData.code !== 'Ok' || !routeData.routes || routeData.routes.length === 0) {
              throw new Error("Rota hesaplanamadı.");
          }

          const distKm = parseFloat((routeData.routes[0].distance / 1000).toFixed(1));
          const geom = routeData.routes[0].geometry.coordinates.map((c: number[]) => [c[1], c[0]]);

          // Calculate bounds for map fit
          const lats = [...geocodedPoints.map(p => p.lat), schoolCoords[0]];
          const lons = [...geocodedPoints.map(p => p.lon), schoolCoords[1]];
          
          setMapCalc(prev => ({ 
              ...prev, 
              loading: false,
              routePoints: mapCalc.routePoints.map((p, i) => ({ ...p, lat: geocodedPoints[i].lat, lon: geocodedPoints[i].lon })), // Update lat/lon for markers
              calculatedDist: distKm,
              routeGeom: geom as [number, number][],
              mapBounds: [[Math.min(...lats), Math.min(...lons)], [Math.max(...lats), Math.max(...lons)]]
          }));

      } catch (err: any) {
          console.error(err);
          setMapCalc(prev => ({ ...prev, loading: false, error: err.message || "Hata oluştu. İnternet bağlantınızı kontrol edin." }));
      }
  };

  const applyDistanceToRow = () => {
      if (mapCalc.calculatedDist !== null && mapCalc.rowId) {
          setRows(prev => prev.map(r => r.id === mapCalc.rowId ? { ...r, asphalt: mapCalc.calculatedDist!, stabilize: 0, total: mapCalc.calculatedDist! } : r));
          setMapCalc({ ...mapCalc, isOpen: false });
      }
  };
  
  return (
    <div className="space-y-6">
      {isPreviewing && (
        <PrintPreview 
          title="Mesafe Tutanağı" 
          onBack={() => setIsPreviewing(false)}
          orientation={orientation}
        >
          <PrintableDistanceReport 
             rows={rows} 
             totals={totals}
             routeCounts={routeCounts} 
             settings={settings}
             orientation={orientation}
          />
        </PrintPreview>
      )}

      {/* Hidden for PDF generation */}
      <div className="hidden">
          <div ref={hiddenPrintRef}>
            <PrintableDistanceReport 
                rows={rows} 
                totals={totals}
                routeCounts={routeCounts} 
                settings={settings}
                orientation={orientation}
            />
          </div>
      </div>

      {/* Map Modal */}
      {mapCalc.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
              <div className="bg-white rounded-2xl w-full max-w-6xl shadow-2xl overflow-hidden flex flex-col h-[90vh]">
                  <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
                      <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Navigation className="text-blue-600" /> Güzergah Rotası Oluştur ve Ölç</h3>
                      <button onClick={() => setMapCalc({ ...mapCalc, isOpen: false })} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                  </div>
                  <div className="flex flex-col md:flex-row h-full overflow-hidden">
                      <div className="w-full md:w-1/3 bg-white border-r border-slate-200 p-4 flex flex-col gap-4 overflow-y-auto">
                          <div className="space-y-2">
                              <label className="block text-xs font-bold text-slate-500 uppercase">Varış Noktası (Okul)</label>
                              <div className="flex items-center gap-2 p-2 bg-blue-50 rounded text-sm text-blue-800 border border-blue-100 font-medium"><School size={16} /><span className="truncate">{settings.schoolName}</span></div>
                          </div>
                          <div className="space-y-2">
                              <label className="block text-xs font-bold text-slate-500 uppercase">Öğrenci Alım Noktaları</label>
                              
                              <div className="flex gap-2 mb-2">
                                  <input 
                                    autoFocus
                                    type="text" 
                                    className="flex-1 px-2 py-1.5 border border-slate-300 rounded text-sm outline-none focus:ring-1 focus:ring-blue-500" 
                                    placeholder="Durak / Köy Adı..." 
                                    value={newPointName}
                                    onChange={(e) => setNewPointName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && addRoutePoint()}
                                  />
                                  <button onClick={addRoutePoint} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-sm font-medium transition-colors border border-slate-200">Ekle</button>
                              </div>

                              <div className="bg-orange-50 p-2 text-[10px] text-orange-800 rounded border border-orange-100 flex gap-2">
                                  <MousePointer2 size={14} className="shrink-0" />
                                  <span>İpucu: Haritaya tıklayarak yeni durak ekleyebilir veya durak ikonlarını sürükleyerek yerini değiştirebilirsiniz.</span>
                              </div>

                              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                                  {mapCalc.routePoints.map((point, idx) => (
                                      <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg group hover:border-blue-300 transition-colors">
                                          <div className="bg-orange-100 text-orange-600 w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold">{idx + 1}</div>
                                          <div className="flex-1 min-w-0" title={point.studentNames}>
                                              <div className="text-sm font-medium text-slate-700 truncate">{point.name}</div>
                                              <div className="text-[10px] text-slate-500 flex items-center gap-1">
                                                  {point.studentCount !== undefined && point.studentCount > 0 ? (
                                                      <span className="text-blue-600 font-bold">{point.studentCount} Öğrenci</span>
                                                  ) : (
                                                      <span className="text-slate-400 italic">Manuel Eklendi</span>
                                                  )}
                                                  {point.lat && <span className="text-slate-300">|</span>}
                                                  {point.lat && <span className="text-slate-400 font-mono">{point.lat.toFixed(3)}, {point.lon?.toFixed(3)}</span>}
                                              </div>
                                          </div>
                                          <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                              <button onClick={() => moveRoutePoint(idx, 'up')} disabled={idx === 0} className="p-0.5 hover:bg-slate-200 rounded disabled:opacity-30"><ArrowUp size={12} /></button>
                                              <button onClick={() => moveRoutePoint(idx, 'down')} disabled={idx === mapCalc.routePoints.length - 1} className="p-0.5 hover:bg-slate-200 rounded disabled:opacity-30"><ArrowDown size={12} /></button>
                                          </div>
                                          <button onClick={() => removeRoutePoint(idx)} className="text-slate-400 hover:text-red-500 p-1"><Trash2 size={14} /></button>
                                      </div>
                                  ))}
                                  {mapCalc.routePoints.length === 0 && <div className="text-center py-4 text-xs text-slate-400 italic">Henüz durak eklenmedi.</div>}
                              </div>
                          </div>
                          <div className="mt-auto pt-4 border-t border-slate-100 space-y-3">
                              <button onClick={calculateFullRoute} disabled={mapCalc.loading || mapCalc.routePoints.length === 0} className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm disabled:opacity-50 font-bold flex items-center justify-center gap-2">{mapCalc.loading ? <Loader2 className="animate-spin" size={18} /> : <Navigation size={18}/>}Rotayı Hesapla</button>
                              {mapCalc.calculatedDist !== null && (<div className="bg-green-50 p-4 rounded-xl border border-green-200 text-center space-y-3 animate-fade-in"><div><span className="block text-xs text-green-600 uppercase font-bold">Toplam Mesafe</span><span className="text-3xl font-black text-green-700">{mapCalc.calculatedDist} KM</span></div><button onClick={applyDistanceToRow} className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold shadow transition-colors flex items-center justify-center gap-2"><Save size={18} />Tabloya Kaydet</button></div>)}
                              {mapCalc.error && <div className="text-red-500 text-xs text-center p-2 bg-red-50 rounded">{mapCalc.error}</div>}
                          </div>
                      </div>
                      <div className="flex-1 relative bg-slate-100 min-h-[400px]">
                          <MapContainer center={schoolCoords} zoom={11} style={{ height: '100%', width: '100%' }}>
                              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' />
                              <MapController bounds={mapCalc.mapBounds} />
                              <MapClickHandler onMapClick={handleMapClick} />
                              <Marker position={schoolCoords} icon={iconSchool}><Popup><strong>{settings.schoolName}</strong></Popup></Marker>
                              {mapCalc.routePoints.map((point, idx) => (point.lat && point.lon && (
                                <Marker 
                                    key={idx} 
                                    position={[point.lat, point.lon]} 
                                    icon={iconStop}
                                    draggable={true}
                                    eventHandlers={{
                                        dragend: (e) => {
                                            const marker = e.target;
                                            const position = marker.getLatLng();
                                            updatePointPosition(idx, position.lat, position.lng);
                                        }
                                    }}
                                >
                                    <Popup>
                                        <div className="text-sm">
                                            <strong>{idx + 1}. Durak: {point.name}</strong>
                                            {point.studentCount ? (
                                                <div className="mt-1">
                                                    <span className="badge bg-blue-100 text-blue-800 px-1 rounded text-xs font-bold">{point.studentCount} Öğrenci</span>
                                                    <div className="text-xs text-slate-600 mt-1 max-h-24 overflow-y-auto">{point.studentNames}</div>
                                                </div>
                                            ) : <div className="text-xs text-slate-400 mt-1">Öğrenci kaydı yok (Manuel)</div>}
                                        </div>
                                    </Popup>
                                </Marker>
                              )))}
                              {mapCalc.routeGeom && (<Polyline positions={mapCalc.routeGeom} color="blue" weight={5} opacity={0.7} />)}
                          </MapContainer>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Edit Row Modal */}
      {editingRow && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
              <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
                  <div className="flex items-center justify-between p-4 border-b border-slate-100">
                      <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Edit size={20} className="text-blue-600"/> Güzergah Düzenle</h3>
                      <button onClick={() => setEditingRow(null)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                  </div>
                  <div className="p-6 space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Güzergah Adı</label>
                          <input type="text" disabled className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-500" value={editingRow.route} />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Güzergah Özellikleri</label>
                          <textarea autoFocus className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-20 text-sm" value={editingRow.features} onChange={(e) => setEditingRow({ ...editingRow, features: e.target.value })} />
                          <div className="flex flex-wrap gap-2 mt-2">
                              {COMMON_FEATURES.map(f => (
                                  <button key={f} onClick={() => {
                                      if(!editingRow.features.includes(f)) setEditingRow({ ...editingRow, features: editingRow.features ? `${editingRow.features}, ${f}` : f });
                                  }} className="px-2 py-1 text-[10px] bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-700 rounded-full border border-slate-200 transition-colors">
                                      + {f}
                                  </button>
                              ))}
                          </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Asfalt (KM)</label>
                              <input type="number" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={editingRow.asphalt} onChange={(e) => setEditingRow({ ...editingRow, asphalt: Number(e.target.value) })} />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Stabilize (KM)</label>
                              <input type="number" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={editingRow.stabilize} onChange={(e) => setEditingRow({ ...editingRow, stabilize: Number(e.target.value) })} />
                          </div>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg flex justify-between items-center border border-slate-100">
                          <span className="font-bold text-slate-700 text-sm">TOPLAM MESAFE</span>
                          <span className="font-black text-xl text-blue-600">{Number(editingRow.asphalt) + Number(editingRow.stabilize)} KM</span>
                      </div>
                  </div>
                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                      <button onClick={() => setEditingRow(null)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg">İptal</button>
                      <button onClick={handleSaveRow} className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-sm">Kaydet</button>
                  </div>
              </div>
          </div>
      )}

      {/* Main UI */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Mesafe Tutanağı</h1>
          <p className="text-slate-500 text-sm">Öğrenci listesindeki ve şoförlere tanımlı güzergahların mesafe/özelliklerini yönetin.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1 mr-2">
            <button onClick={() => setOrientation('portrait')} className={`px-2 py-1.5 rounded text-xs font-medium flex items-center gap-1 transition-colors ${orientation === 'portrait' ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-50'}`}><FileText size={14} /></button>
            <button onClick={() => setOrientation('landscape')} className={`px-2 py-1.5 rounded text-xs font-medium flex items-center gap-1 transition-colors ${orientation === 'landscape' ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-50'}`}><ArrowRightLeft size={14} /></button>
          </div>
          <button onClick={() => setIsPreviewing(true)} className="flex items-center space-x-2 bg-violet-50 text-violet-700 hover:bg-violet-100 px-3 py-2 rounded-lg transition-colors font-medium border border-violet-200 shadow-sm" title="Önizle"><Eye size={16} /><span className="hidden sm:inline">Önizle / Yazdır</span></button>
          <button onClick={handleDownloadPDF} disabled={isDownloading} className="flex items-center space-x-2 bg-red-50 text-red-700 hover:bg-red-100 px-3 py-2 rounded-lg transition-colors font-medium border border-red-200 shadow-sm disabled:opacity-50"><Download size={16} /><span className="hidden sm:inline">{isDownloading ? '...' : 'PDF İndir'}</span></button>
        </div>
      </div>
      
      {/* Data Grid View */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                      <tr>
                          <th className="px-6 py-4 w-16">S.No</th>
                          <th className="px-6 py-4">Güzergah</th>
                          <th className="px-6 py-4">Öğrenci</th>
                          <th className="px-6 py-4 w-1/3">Özellikler</th>
                          <th className="px-6 py-4 text-center">Asfalt</th>
                          <th className="px-6 py-4 text-center">Stabilize</th>
                          <th className="px-6 py-4 text-center font-bold">Toplam</th>
                          <th className="px-6 py-4 text-right">İşlemler</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                      {rows.map((row, index) => (
                          <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-4 text-slate-500 font-mono">{index + 1}</td>
                              <td className="px-6 py-4 font-medium text-slate-800">{row.route}</td>
                              <td className="px-6 py-4"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{routeCounts[row.route] || 0}</span></td>
                              <td className="px-6 py-4 text-slate-600 truncate max-w-xs" title={row.features}>{row.features}</td>
                              <td className="px-6 py-4 text-center text-slate-600">{row.asphalt}</td>
                              <td className="px-6 py-4 text-center text-slate-600">{row.stabilize}</td>
                              <td className="px-6 py-4 text-center font-bold text-slate-800">{row.total}</td>
                              <td className="px-6 py-4 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                      <button onClick={() => openMapCalculator(row.id, row.route)} className="p-1.5 text-blue-500 hover:bg-blue-100 rounded-lg transition-colors" title="Harita ile Ölç"><MapPin size={16} /></button>
                                      <button onClick={() => setEditingRow(row)} className="p-1.5 text-emerald-500 hover:bg-emerald-100 rounded-lg transition-colors" title="Düzenle"><Edit size={16} /></button>
                                  </div>
                              </td>
                          </tr>
                      ))}
                      {rows.length === 0 && <tr><td colSpan={8} className="px-6 py-12 text-center text-slate-400">Veri bulunamadı. Öğrenci veya Şoför listesi boş.</td></tr>}
                  </tbody>
                  {rows.length > 0 && (
                      <tfoot className="bg-slate-50 font-bold text-slate-700">
                          <tr>
                              <td colSpan={4} className="px-6 py-4 text-right">GENEL TOPLAM</td>
                              <td className="px-6 py-4 text-center">{totals.asphalt}</td>
                              <td className="px-6 py-4 text-center">{totals.stabilize}</td>
                              <td className="px-6 py-4 text-center">{totals.total}</td>
                              <td></td>
                          </tr>
                      </tfoot>
                  )}
              </table>
          </div>
      </div>

    </div>
  );
};
