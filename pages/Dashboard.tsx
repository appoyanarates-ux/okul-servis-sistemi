
import React, { useMemo, useState, useEffect } from 'react';
import { Student, AppSettings, Driver, SavedPlanning } from '../types';
import { Users, Bus, MapPin, School, TrendingUp, Upload as UploadIcon, Sparkles, FileText, Loader2, Route as RouteIcon, PieChart, Key, ArrowRight, AlertTriangle, CheckCircle, Info, Save, Trash2, Edit2, Play } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useNavigate, Link } from 'react-router-dom';
import { analyzeTransportData, AnalysisMode } from '../services/geminiService';
import { loadSavedPlannings, saveSavedPlannings } from '../services/storage';

interface DashboardProps {
  students: Student[];
  drivers: Driver[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  setDrivers: React.Dispatch<React.SetStateAction<Driver[]>>;
  settings: AppSettings;
}

export const Dashboard: React.FC<DashboardProps> = ({ students, drivers, setStudents, setDrivers, settings }) => {
  const navigate = useNavigate();
  const [aiSummary, setAiSummary] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [analysisType, setAnalysisType] = useState<AnalysisMode>('general');

  // Saved Plannings State
  const [savedPlannings, setSavedPlannings] = useState<SavedPlanning[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [newPlanName, setNewPlanName] = useState('');
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);

  useEffect(() => {
    setSavedPlannings(loadSavedPlannings());
  }, []);

  const handleSavePlanning = () => {
    if (!newPlanName.trim()) return;

    let updatedPlannings;
    if (editingPlanId) {
      updatedPlannings = savedPlannings.map(p =>
        p.id === editingPlanId ? { ...p, name: newPlanName.trim() } : p
      );
    } else {
      const newPlan: SavedPlanning = {
        id: `plan-${Date.now()}`,
        name: newPlanName.trim(),
        createdAt: new Date().toISOString(),
        students: JSON.parse(JSON.stringify(students)),
        drivers: JSON.parse(JSON.stringify(drivers))
      };
      updatedPlannings = [...savedPlannings, newPlan];
    }

    setSavedPlannings(updatedPlannings);
    saveSavedPlannings(updatedPlannings);
    setShowSaveModal(false);
    setNewPlanName('');
    setEditingPlanId(null);
  };

  const handleDeletePlanning = (id: string) => {
    if (window.confirm('Bu planlamayı silmek istediğinize emin misiniz?')) {
      const updatedPlannings = savedPlannings.filter(p => p.id !== id);
      setSavedPlannings(updatedPlannings);
      saveSavedPlannings(updatedPlannings);
    }
  };

  const handleLoadPlanning = (plan: SavedPlanning) => {
    if (window.confirm(`"${plan.name}" planlamasını yüklemek istediğinize emin misiniz? Mevcut kaydedilmemiş değişiklikleriniz kaybolacaktır.`)) {
      setStudents(plan.students);
      setDrivers(plan.drivers);
    }
  };

  const openEditModal = (plan: SavedPlanning) => {
    setEditingPlanId(plan.id);
    setNewPlanName(plan.name);
    setShowSaveModal(true);
  };

  const stats = useMemo(() => {
    const uniqueDrivers = new Set(students.map(s => s.driver)).size;
    const uniqueRoutes = new Set(students.map(s => s.route)).size;
    const uniqueVillages = new Set(students.map(s => s.village)).size;

    // Class distribution for chart
    const classCount: Record<string, number> = {};
    students.forEach(s => {
      classCount[s.className] = (classCount[s.className] || 0) + 1;
    });

    const chartData = Object.keys(classCount).map(key => ({
      name: key,
      students: classCount[key]
    })).sort((a,b) => a.name.localeCompare(b.name));

    return {
      totalStudents: students.length,
      drivers: uniqueDrivers,
      routes: uniqueRoutes,
      villages: uniqueVillages,
      chartData
    };
  }, [students]);

  // Route Efficiency Analysis Data
  const routeMetrics = useMemo(() => {
      const map = new Map<string, { count: number; driver: string; villages: Set<string> }>();

      students.forEach(s => {
          const rName = s.route || 'Tanımsız Güzergah';
          if (!map.has(rName)) {
              map.set(rName, { count: 0, driver: s.driver || 'Atanmamış', villages: new Set() });
          }
          const data = map.get(rName)!;
          data.count++;
          if (s.village) data.villages.add(s.village);
          // If driver is assigned later in the list, update it
          if (s.driver && data.driver === 'Atanmamış') data.driver = s.driver;
      });

      return Array.from(map.entries()).map(([name, data]) => {
          let status: 'optimal' | 'inefficient' | 'overload' = 'optimal';
          if (data.count > 16) status = 'overload';
          else if (data.count < 8) status = 'inefficient';

          return {
              name,
              count: data.count,
              driver: data.driver,
              villageCount: data.villages.size,
              status
          };
      }).sort((a, b) => a.count - b.count); // Sort by count ascending (highlight inefficient first)
  }, [students]);

  const handleGenerateReport = async () => {
    if (!settings.googleApiKey) {
      setAiSummary("Bu özelliği kullanmak için lütfen Ayarlar menüsünden geçerli bir Gemini API Anahtarı giriniz.");
      return;
    }
    if (students.length === 0) {
      setAiSummary("Analiz için önce sisteme öğrenci verisi eklemelisiniz.");
      return;
    }
    setLoadingAi(true);
    setAiSummary(''); // Clear previous
    try {
      const result = await analyzeTransportData(students, analysisType, settings.googleApiKey);
      setAiSummary(result);
    } catch (error) {
      setAiSummary("Rapor oluşturulurken bir hata meydana geldi. API anahtarınızı kontrol ediniz.");
    } finally {
      setLoadingAi(false);
    }
  };

  const handleChartClick = (data: any) => {
    if (data && data.activePayload && data.activePayload.length > 0) {
      const className = data.activePayload[0].payload.name;
      navigate('/students', { state: { filterClass: className } });
    }
  };

  const StatCard = ({ icon, label, value, color, link, state }: any) => (
    <Link
      to={link}
      state={state}
      className="bg-white rounded-xl shadow-sm p-6 border border-slate-100 flex items-center justify-between hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group cursor-pointer"
    >
      <div className="flex items-center space-x-4">
        <div className={`p-3 rounded-lg ${color} text-white shadow-md group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500 group-hover:text-slate-600 transition-colors">{label}</p>
          <h3 className="text-2xl font-bold text-slate-800 mt-1">{value}</h3>
        </div>
      </div>
      <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
        <ArrowRight size={18} />
      </div>
    </Link>
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Yönetim Paneli</h1>
          <p className="text-slate-500 mt-1">Okul taşıma sistemi genel durumu</p>
        </div>
      </div>

      {/* AI & Optimization Section */}
      <div className="bg-gradient-to-br from-violet-900 to-indigo-800 rounded-2xl shadow-xl overflow-hidden relative text-white">
        <div className="relative z-10 p-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 border-b border-white/10 pb-6 mb-6">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Sparkles className="text-yellow-400" />
                AI Destekli Analiz Merkezi
              </h2>
              <p className="text-blue-200 mt-1 text-sm max-w-xl">
                Yapay zeka asistanı ve veri görselleştirme araçları ile taşıma sisteminizi optimize edin.
              </p>
              {!settings.googleApiKey && (
                 <Link to="/settings" className="inline-flex items-center gap-2 mt-3 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-100 px-3 py-1.5 rounded-lg border border-red-500/30 transition-colors">
                   <Key size={14} />
                   <span>API Anahtarı Eksik - Girmek için tıklayın</span>
                 </Link>
              )}
            </div>

            <div className="flex flex-wrap gap-3 bg-black/20 p-2 rounded-xl backdrop-blur-md border border-white/10">
               <button
                 onClick={() => setAnalysisType('general')}
                 className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${analysisType === 'general' ? 'bg-white text-violet-900 shadow-lg' : 'text-white/80 hover:bg-white/10'}`}
               >
                 <PieChart size={18} />
                 Genel Özet
               </button>
               <button
                 onClick={() => setAnalysisType('routes')}
                 className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${analysisType === 'routes' ? 'bg-white text-violet-900 shadow-lg' : 'text-white/80 hover:bg-white/10'}`}
               >
                 <RouteIcon size={18} />
                 Güzergah Optimizasyonu
               </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* LEFT SIDE: Content based on Selection */}
              <div className="space-y-4">
                  {analysisType === 'routes' ? (
                      <div className="bg-white/5 rounded-xl border border-white/10 p-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                          <h3 className="text-sm font-bold text-blue-200 mb-3 flex items-center gap-2 sticky top-0 bg-transparent backdrop-blur-sm py-2">
                              <RouteIcon size={16} /> Tüm Güzergahlar ve Doluluk Durumu
                          </h3>
                          <table className="w-full text-xs text-left text-blue-100">
                              <thead className="text-xs text-blue-300 uppercase bg-black/20 sticky top-8">
                                  <tr>
                                      <th className="px-3 py-2 rounded-l-lg">Güzergah Adı</th>
                                      <th className="px-3 py-2 text-center">Öğrenci</th>
                                      <th className="px-3 py-2 text-center">Durum</th>
                                      <th className="px-3 py-2 rounded-r-lg text-right">İşlem</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-white/5">
                                  {routeMetrics.map((route, idx) => (
                                      <tr key={idx} className="hover:bg-white/5 transition-colors">
                                          <td className="px-3 py-2 font-medium">
                                              <div className="truncate max-w-[150px]" title={route.name}>{route.name}</div>
                                              <div className="text-[10px] text-white/40">{route.driver}</div>
                                          </td>
                                          <td className="px-3 py-2 text-center font-bold text-sm">{route.count}</td>
                                          <td className="px-3 py-2 text-center">
                                              {route.status === 'inefficient' && <span className="px-2 py-0.5 rounded text-[10px] bg-orange-500/20 text-orange-200 border border-orange-500/30 whitespace-nowrap">Verimsiz</span>}
                                              {route.status === 'optimal' && <span className="px-2 py-0.5 rounded text-[10px] bg-green-500/20 text-green-200 border border-green-500/30 whitespace-nowrap">İdeal</span>}
                                              {route.status === 'overload' && <span className="px-2 py-0.5 rounded text-[10px] bg-red-500/20 text-red-200 border border-red-500/30 whitespace-nowrap">Kapasite Üstü</span>}
                                          </td>
                                          <td className="px-3 py-2 text-right">
                                              <Link to="/drivers" state={{ activeTab: 'routes' }} className="text-blue-300 hover:text-white transition-colors"><ArrowRight size={14}/></Link>
                                          </td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>
                  ) : (
                      <div className="bg-white/5 rounded-xl border border-white/10 p-6 flex flex-col justify-center items-center text-center h-full min-h-[300px]">
                          <PieChart size={48} className="text-white/20 mb-4" />
                          <h3 className="text-lg font-bold text-white mb-2">Genel Veri Özeti</h3>
                          <p className="text-blue-200 text-sm max-w-md">
                              Sağ taraftaki yapay zeka alanından "Analizi Başlat" butonuna tıklayarak okul taşıma verilerinizin genel durum özetini alabilirsiniz.
                          </p>
                      </div>
                  )}
              </div>

              {/* RIGHT SIDE: AI Output */}
              <div className="flex flex-col h-full">
                  <div className="flex justify-between items-center mb-3">
                      <h3 className="text-sm font-bold text-yellow-100 flex items-center gap-2">
                          <Sparkles size={16} />
                          {analysisType === 'routes' ? 'AI Optimizasyon Önerileri' : 'Yapay Zeka Raporu'}
                      </h3>
                      <button
                        onClick={handleGenerateReport}
                        disabled={loadingAi}
                        className="bg-white text-violet-900 px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-50 transition-colors disabled:opacity-70 flex items-center gap-2 shadow-sm"
                      >
                        {loadingAi ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />}
                        {aiSummary ? 'Yeniden Analiz Et' : 'Analizi Başlat'}
                      </button>
                  </div>

                  <div className="flex-1 bg-black/20 rounded-xl border border-white/10 p-4 min-h-[300px] max-h-[400px] overflow-y-auto custom-scrollbar relative">
                      {loadingAi ? (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-white/50">
                              <Loader2 className="animate-spin mb-2" size={32} />
                              <span className="text-sm animate-pulse">Veriler inceleniyor...</span>
                          </div>
                      ) : aiSummary ? (
                          <div className="prose prose-invert prose-sm max-w-none">
                              {aiSummary.split('\n').map((line, i) => (
                                <React.Fragment key={i}>
                                  {line.trim().startsWith('**') || line.trim().startsWith('#') ? (
                                    <strong className="block mt-3 mb-1 text-white text-base border-b border-white/10 pb-1">{line.replace(/[\*#]/g, '')}</strong>
                                  ) : line.trim().startsWith('-') ? (
                                    <div className="flex gap-2 ml-1 mb-1 text-blue-100/90 text-xs leading-relaxed">
                                        <span className="mt-1.5 w-1 h-1 rounded-full bg-yellow-400 shrink-0"></span>
                                        <span>{line.substring(1).trim()}</span>
                                    </div>
                                  ) : line.trim() !== '' ? (
                                    <p className="mb-2 text-blue-100/80 text-xs leading-relaxed">{line}</p>
                                  ) : null}
                                </React.Fragment>
                              ))}
                          </div>
                      ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-white/30">
                              <Info size={32} className="mb-2" />
                              <span className="text-sm">Analiz başlatmak için butona tıklayın.</span>
                          </div>
                      )}
                  </div>
              </div>
          </div>
        </div>

        {/* Background Decorative Elements */}
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* Stats Grid - Clickable */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={<Users size={24} />}
          label="Toplam Öğrenci"
          value={stats.totalStudents}
          color="bg-blue-500"
          link="/students"
        />
        <StatCard
          icon={<Bus size={24} />}
          label="Aktif Şoförler"
          value={stats.drivers}
          color="bg-emerald-500"
          link="/drivers"
          state={{ activeTab: 'drivers' }}
        />
        <StatCard
          icon={<MapPin size={24} />}
          label="Güzergah Sayısı"
          value={stats.routes}
          color="bg-indigo-500"
          link="/drivers"
          state={{ activeTab: 'routes' }}
        />
        <StatCard
          icon={<School size={24} />}
          label="Hizmet Verilen Köy"
          value={stats.villages}
          color="bg-orange-500"
          link="/map"
        />
      </div>

      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100 min-w-0">
          <div className="flex items-center justify-between mb-6">
             <h3 className="font-semibold text-slate-800 flex items-center space-x-2">
               <TrendingUp size={18} className="text-blue-500" />
               <span>Sınıf Bazlı Öğrenci Dağılımı</span>
             </h3>
             <span className="text-xs text-slate-400 font-medium bg-slate-50 px-2 py-1 rounded">Detay için sütuna tıklayın</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.chartData} onClick={handleChartClick}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <Tooltip
                  cursor={{fill: '#f1f5f9'}}
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="students" radius={[4, 4, 0, 0]} cursor="pointer">
                  {stats.chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#6366f1', '#f59e0b'][index % 4]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
               <h3 className="font-semibold text-slate-800 mb-4">Hızlı İşlemler</h3>
               <div className="space-y-3">
                 <button
                    onClick={() => navigate('/students', { state: { action: 'add' } })}
                    className="w-full text-left px-4 py-3 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium transition-colors border border-slate-200 flex items-center justify-between group">
                    <span>Yeni Öğrenci Ekle</span>
                    <span className="text-slate-400 group-hover:text-blue-500">+</span>
                 </button>
                 <button
                    onClick={() => navigate('/drivers', { state: { action: 'add-route' } })}
                    className="w-full text-left px-4 py-3 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium transition-colors border border-slate-200 flex items-center justify-between group">
                    <span>Yeni Güzergah Tanımla</span>
                    <span className="text-slate-400 group-hover:text-blue-500">+</span>
                 </button>
                 <button
                    onClick={() => navigate('/planning')}
                    className="w-full text-left px-4 py-3 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium transition-colors border border-slate-200 flex items-center justify-between group">
                    <span>Rapor İndir</span>
                    <UploadIcon size={16} className="text-slate-400 group-hover:text-blue-500" />
                 </button>
               </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
               <div className="flex items-center justify-between mb-4">
                   <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                       <Save size={18} className="text-indigo-500" />
                       Kayıtlı Planlamalar
                   </h3>
                   <button
                       onClick={() => { setEditingPlanId(null); setNewPlanName(''); setShowSaveModal(true); }}
                       className="text-xs bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-2 py-1 rounded font-medium transition-colors"
                   >
                       Mevcut Durumu Kaydet
                   </button>
               </div>

               {savedPlannings.length === 0 ? (
                   <div className="text-center py-6 text-slate-400 text-sm bg-slate-50 rounded-lg border border-slate-100 border-dashed">
                       Henüz kaydedilmiş bir planlama yok.
                   </div>
               ) : (
                   <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-1">
                       {savedPlannings.map(plan => (
                           <div key={plan.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg hover:border-indigo-300 transition-colors group">
                               <div className="min-w-0 flex-1">
                                   <div className="font-medium text-slate-800 text-sm truncate" title={plan.name}>{plan.name}</div>
                                   <div className="text-[10px] text-slate-500 mt-0.5">
                                       {new Date(plan.createdAt).toLocaleDateString('tr-TR')} • {plan.students.length} Öğrenci
                                   </div>
                               </div>
                               <div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                   <button onClick={() => handleLoadPlanning(plan)} title="Bu planlamayı yükle" className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-md transition-colors">
                                       <Play size={14} />
                                   </button>
                                   <button onClick={() => openEditModal(plan)} title="İsmi düzenle" className="p-1.5 text-slate-600 hover:bg-slate-200 rounded-md transition-colors">
                                       <Edit2 size={14} />
                                   </button>
                                   <button onClick={() => handleDeletePlanning(plan.id)} title="Sil" className="p-1.5 text-red-600 hover:bg-red-100 rounded-md transition-colors">
                                       <Trash2 size={14} />
                                   </button>
                               </div>
                           </div>
                       ))}
                   </div>
               )}
            </div>
        </div>
      </div>

      {/* Save Planning Modal */}
      {showSaveModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
              <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                  <div className="p-6">
                      <h3 className="text-lg font-bold text-slate-800 mb-2">
                          {editingPlanId ? 'Planlama Adını Düzenle' : 'Mevcut Planlamayı Kaydet'}
                      </h3>
                      <p className="text-sm text-slate-500 mb-4">
                          {editingPlanId
                              ? 'Bu planlamanın ismini güncelleyebilirsiniz.'
                              : 'Şu anki öğrenci ve şoför eşleştirmelerini bir planlama olarak kaydederek daha sonra tekrar yükleyebilirsiniz.'}
                      </p>

                      <div className="space-y-1">
                          <label className="text-sm font-medium text-slate-700">Planlama Adı</label>
                          <input
                              type="text"
                              value={newPlanName}
                              onChange={(e) => setNewPlanName(e.target.value)}
                              placeholder="Örn: Alternatif Güzergah Planı 1"
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                              autoFocus
                              onKeyDown={(e) => e.key === 'Enter' && handleSavePlanning()}
                          />
                      </div>
                  </div>
                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                      <button
                          onClick={() => { setShowSaveModal(false); setNewPlanName(''); setEditingPlanId(null); }}
                          className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors"
                      >
                          İptal
                      </button>
                      <button
                          onClick={handleSavePlanning}
                          disabled={!newPlanName.trim()}
                          className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                      >
                          Kaydet
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
