
import React, { useState, useRef, useEffect } from 'react';
import { AppSettings } from '../types';
import { Save, Building2, UserCircle, Users, CheckCircle, UserPlus, Key, Eye, EyeOff, Loader2, AlertCircle, Briefcase, MapPin, Search, PenTool, Upload, Trash2, X, Plus } from 'lucide-react';
import { testGeminiConnection } from '../services/geminiService';

interface SettingsPageProps {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
}

const SignaturePad = ({ onSave, onCancel }: { onSave: (dataUrl: string) => void, onCancel: () => void }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            canvas.width = 500;
            canvas.height = 200;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.lineWidth = 2;
                ctx.lineCap = 'round';
                ctx.strokeStyle = '#000';
            }
        }
    }, []);

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDrawing(true);
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        let x, y;
        if ('touches' in e) {
            x = e.touches[0].clientX - rect.left;
            y = e.touches[0].clientY - rect.top;
        } else {
            x = (e as React.MouseEvent).clientX - rect.left;
            y = (e as React.MouseEvent).clientY - rect.top;
        }
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        let x, y;
        if ('touches' in e) {
            x = e.touches[0].clientX - rect.left;
            y = e.touches[0].clientY - rect.top;
        } else {
            x = (e as React.MouseEvent).clientX - rect.left;
            y = (e as React.MouseEvent).clientY - rect.top;
        }
        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const clear = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx?.clearRect(0, 0, canvas.width, canvas.height);
        }
    };

    const save = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            onSave(canvas.toDataURL());
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg">
                <h3 className="text-lg font-bold mb-4">İmza Çiz</h3>
                <div className="border-2 border-dashed border-slate-300 rounded-lg mb-4 bg-slate-50 touch-none">
                    <canvas
                        ref={canvasRef}
                        className="w-full h-[200px] cursor-crosshair"
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                    />
                </div>
                <div className="flex justify-between">
                    <button onClick={clear} className="text-red-500 hover:text-red-700 text-sm font-medium px-3 py-2">Temizle</button>
                    <div className="flex gap-2">
                        <button onClick={onCancel} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">İptal</button>
                        <button onClick={save} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Kaydet</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const Settings: React.FC<SettingsPageProps> = ({ settings, setSettings }) => {
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [isSaved, setIsSaved] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [geocoding, setGeocoding] = useState(false);
  const [signingTeacher, setSigningTeacher] = useState<string | null>(null);

  // Show extra admins if any of the optional fields have data
  const [showExtraAdmins, setShowExtraAdmins] = useState(
    !!settings.principalName2 || !!settings.vicePrincipal2 || !!settings.vicePrincipal3 || !!settings.vicePrincipal4
  );

  const handleChange = (field: keyof AppSettings, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsSaved(false);
    if (field === 'googleApiKey') setTestStatus('idle');
  };

  const updateDutyTeacher = (dayIndex: number, teacherIndex: number, value: string) => {
    const newDutyTeachers = [...formData.dutyTeachers];
    // Ensure we have a string for this day
    const dayValue = newDutyTeachers[dayIndex] || '';
    let teachers = dayValue.split('\n');

    // Ensure we have at least 2 slots
    while (teachers.length < 2) {
        teachers.push('');
    }

    teachers[teacherIndex] = value;

    newDutyTeachers[dayIndex] = teachers.join('\n');
    handleChange('dutyTeachers', newDutyTeachers);
  };

  const handleSignatureUpload = (teacherName: string, e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              const base64 = reader.result as string;
              const newSignatures = { ...(formData.teacherSignatures || {}), [teacherName]: base64 };
              handleChange('teacherSignatures', newSignatures);
          };
          reader.readAsDataURL(file);
      }
  };

  const handleSignatureSave = (dataUrl: string) => {
      if (signingTeacher) {
          const newSignatures = { ...(formData.teacherSignatures || {}), [signingTeacher]: dataUrl };
          handleChange('teacherSignatures', newSignatures);
          setSigningTeacher(null);
      }
  };

  const removeSignature = (teacherName: string) => {
      const newSignatures = { ...(formData.teacherSignatures || {}) };
      delete newSignatures[teacherName];
      handleChange('teacherSignatures', newSignatures);
  };

  const uniqueTeachers = Array.from(new Set(
      formData.dutyTeachers.flatMap(day => day.split('\n').map(t => t.trim()).filter(t => t))
  )).sort();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSettings(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleTestApi = async () => {
    if (!formData.googleApiKey) return;
    setTestStatus('testing');
    const isValid = await testGeminiConnection(formData.googleApiKey);
    setTestStatus(isValid ? 'success' : 'error');
  };

  const handleGeocodeAddress = async () => {
      if (!formData.mapAddress) return;
      setGeocoding(true);
      try {
          const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.mapAddress)}`);
          const data = await response.json();
          if (data && data.length > 0) {
              const lat = parseFloat(data[0].lat);
              const lon = parseFloat(data[0].lon);
              handleChange('mapCenterLat', lat);
              handleChange('mapCenterLng', lon);
              alert("Adres başarıyla koordinata çevrildi ve ayarlandı.");
          } else {
              alert("Adres bulunamadı. Lütfen daha belirgin bir adres giriniz.");
          }
      } catch (error) {
          alert("Konum servisine erişilemedi.");
      } finally {
          setGeocoding(false);
      }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in relative">
      {/* Fixed Toast Notification */}
      {isSaved && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-green-600 text-white px-6 py-4 rounded-xl shadow-2xl animate-slide-in-up">
            <div className="bg-white/20 p-2 rounded-full">
              <CheckCircle size={24} className="text-white" />
            </div>
            <div>
              <h4 className="font-bold text-lg">Başarılı</h4>
              <p className="text-green-100 text-sm">Ayarlar başarıyla kaydedildi.</p>
            </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Genel Ayarlar</h1>
          <p className="text-slate-500 mt-1">Okul bilgileri, idari personel, nöbetçi öğretmenler ve AI yapılandırması.</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">

        {/* Okul ve Bölge Bilgileri */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
            <Building2 className="text-blue-600" size={20} />
            Okul ve Bölge Bilgileri
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Okul Adı</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.schoolName}
                onChange={(e) => handleChange('schoolName', e.target.value)}
                placeholder="Örn: YOĞUNOLUK İLKOKULU"
              />
            </div>

            {/* Taşıma Bölgesi Bilgileri */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Taşıma Yapılacak İl</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.province}
                onChange={(e) => handleChange('province', e.target.value)}
                placeholder="Örn: OSMANİYE"
              />
              <p className="text-[10px] text-slate-400 mt-1">Harita aramalarında öncelikli bölge olarak kullanılır.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Taşıma Yapılacak İlçe</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.district}
                onChange={(e) => handleChange('district', e.target.value)}
                placeholder="Örn: KADİRLİ"
              />
              <p className="text-[10px] text-slate-400 mt-1">Güzergah oluşturma ve konum servislerinde kullanılır.</p>
            </div>

             <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Eğitim Öğretim Yılı</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.educationYear}
                onChange={(e) => handleChange('educationYear', e.target.value)}
                placeholder="Örn: 2025 - 2026"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                  <Briefcase size={14} className="text-slate-500"/>
                  Taşıma Yapan Firma Adı
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                value={formData.firmName || ''}
                onChange={(e) => handleChange('firmName', e.target.value)}
                placeholder="Örn: DOĞAN GÜNEŞ"
              />
            </div>
          </div>
        </div>

        {/* Harita ve Konum Ayarları */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
            <MapPin className="text-red-500" size={20} />
            Harita ve Konum Ayarları
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="col-span-1 md:col-span-2">
                 <label className="block text-sm font-medium text-slate-700 mb-1">Okul Açık Adresi / Plus Code</label>
                 <div className="flex gap-2">
                     <input
                        type="text"
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        value={formData.mapAddress || ''}
                        onChange={(e) => handleChange('mapAddress', e.target.value)}
                        placeholder="Örn: H6F6+R87 Yoğunoluk, Kadirli/Osmaniye"
                     />
                     <button type="button" onClick={handleGeocodeAddress} disabled={!formData.mapAddress || geocoding} className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200 transition-colors flex items-center gap-2 text-sm font-medium disabled:opacity-50">
                         {geocoding ? <Loader2 size={16} className="animate-spin"/> : <Search size={16} />}
                         Koordinata Çevir
                     </button>
                 </div>
                 <p className="text-xs text-slate-500 mt-1">Google Maps Plus Code veya tam açık adres girebilirsiniz. Butona tıkladığınızda enlem/boylam otomatik doldurulur.</p>
             </div>

             <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Okul Enlem (Latitude)</label>
              <input
                type="number"
                step="any"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.mapCenterLat !== undefined ? formData.mapCenterLat : ''}
                onChange={(e) => handleChange('mapCenterLat', e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="Örn: 37.5350"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Okul Boylam (Longitude)</label>
              <input
                type="number"
                step="any"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.mapCenterLng !== undefined ? formData.mapCenterLng : ''}
                onChange={(e) => handleChange('mapCenterLng', e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="Örn: 36.1950"
              />
            </div>
          </div>
        </div>

        {/* İdari Personel */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <UserCircle className="text-violet-600" size={20} />
              İdari Personel (İmza Yetkilileri)
            </h2>
            <button
              type="button"
              onClick={() => setShowExtraAdmins(!showExtraAdmins)}
              className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100 transition-colors"
            >
              <UserPlus size={14} />
              {showExtraAdmins ? 'Ekstra Alanları Gizle' : 'Yardımcı Yönetici Ekle'}
            </button>
          </div>

          <div className="space-y-6">
             <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Okul Müdürleri</label>
              {formData.principals.map((p, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                      <input type="text" className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={p} onChange={(e) => {
                          const newPrincipals = [...formData.principals];
                          newPrincipals[i] = e.target.value;
                          handleChange('principals', newPrincipals);
                      }} placeholder="Ad Soyad" />
                      <button type="button" onClick={() => {
                          const newPrincipals = formData.principals.filter((_, index) => index !== i);
                          handleChange('principals', newPrincipals);
                      }} className="text-red-500 hover:text-red-700 p-2"><Trash2 size={18}/></button>
                  </div>
              ))}
              <button type="button" onClick={() => handleChange('principals', [...formData.principals, ''])} className="text-sm text-blue-600 font-medium flex items-center gap-1"><Plus size={16}/> Müdür Ekle</button>
            </div>

             <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Müdür Yardımcıları</label>
              {formData.vicePrincipals.map((vp, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                      <input type="text" className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={vp} onChange={(e) => {
                          const newVicePrincipals = [...formData.vicePrincipals];
                          newVicePrincipals[i] = e.target.value;
                          handleChange('vicePrincipals', newVicePrincipals);
                      }} placeholder="Ad Soyad" />
                      <button type="button" onClick={() => {
                          const newVicePrincipals = formData.vicePrincipals.filter((_, index) => index !== i);
                          handleChange('vicePrincipals', newVicePrincipals);
                      }} className="text-red-500 hover:text-red-700 p-2"><Trash2 size={18}/></button>
                  </div>
              ))}
              <button type="button" onClick={() => handleChange('vicePrincipals', [...formData.vicePrincipals, ''])} className="text-sm text-blue-600 font-medium flex items-center gap-1"><Plus size={16}/> Müdür Yrd. Ekle</button>
            </div>
          </div>
        </div>

        {/* Nöbetçi Öğretmenler */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
            <Users className="text-orange-500" size={20} />
            Nöbetçi Öğretmenler (Günlük İmza Çizelgesi İçin)
          </h2>
          <p className="text-sm text-slate-500 mb-4">
            Her gün için 1. ve 2. nöbetçi öğretmenleri tanımlayabilirsiniz.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma'].map((day, dayIndex) => {
              const teachers = (formData.dutyTeachers[dayIndex] || '').split('\n');
              return (
              <div key={day} className="h-full bg-slate-50 p-3 rounded-lg border border-slate-200">
                <label className="block text-sm font-bold text-slate-700 mb-2 text-center">{day}</label>
                <div className="space-y-2">
                    <div>
                        <label className="block text-[10px] text-slate-500 mb-0.5">1. Nöbetçi Öğretmen</label>
                        <input
                          type="text"
                          className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                          value={teachers[0] || ''}
                          onChange={(e) => updateDutyTeacher(dayIndex, 0, e.target.value)}
                          placeholder="Ad Soyad"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] text-slate-500 mb-0.5">2. Nöbetçi Öğretmen</label>
                        <input
                          type="text"
                          className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                          value={teachers[1] || ''}
                          onChange={(e) => updateDutyTeacher(dayIndex, 1, e.target.value)}
                          placeholder="Ad Soyad"
                        />
                    </div>
                </div>
              </div>
            )})}
          </div>
        </div>

        {/* Nöbetçi Öğretmen İmzaları */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
            <PenTool className="text-emerald-600" size={20} />
            Nöbetçi Öğretmen İmzaları
          </h2>
          <p className="text-sm text-slate-500 mb-4">
            Yukarıda tanımlanan nöbetçi öğretmenler için imza yükleyebilir veya çizebilirsiniz. Bu imzalar raporlarda kullanılacaktır.
          </p>

          {uniqueTeachers.length === 0 ? (
              <p className="text-slate-400 italic text-sm">Henüz nöbetçi öğretmen tanımlanmamış.</p>
          ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(uniqueTeachers as string[]).map((teacher: string) => (
                      <div key={teacher} className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-col gap-3">
                          <div className="font-bold text-slate-700">{teacher}</div>

                          <div className="flex-1 bg-white border border-slate-200 rounded h-24 flex items-center justify-center overflow-hidden relative group">
                              {formData.teacherSignatures?.[teacher] ? (
                                  <img src={formData.teacherSignatures[teacher]} alt="İmza" className="max-h-full max-w-full object-contain" />
                              ) : (
                                  <span className="text-xs text-slate-400">İmza Yok</span>
                              )}
                          </div>

                          <div className="flex gap-2">
                              <label className="flex-1 cursor-pointer bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 px-3 py-1.5 rounded text-xs font-medium flex items-center justify-center gap-1 transition-colors">
                                  <Upload size={14} />
                                  Yükle
                                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleSignatureUpload(teacher, e)} />
                              </label>
                              <button
                                  type="button"
                                  onClick={() => setSigningTeacher(teacher)}
                                  className="flex-1 bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 px-3 py-1.5 rounded text-xs font-medium flex items-center justify-center gap-1 transition-colors"
                              >
                                  <PenTool size={14} />
                                  Çiz
                              </button>
                              {formData.teacherSignatures?.[teacher] && (
                                  <button
                                      type="button"
                                      onClick={() => removeSignature(teacher)}
                                      className="bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 px-2 py-1.5 rounded transition-colors"
                                      title="İmzayı Sil"
                                  >
                                      <Trash2 size={14} />
                                  </button>
                              )}
                          </div>
                      </div>
                  ))}
              </div>
          )}
        </div>

        {/* Yapay Zeka Ayarları */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
            <Key className="text-violet-600" size={20} />
            Yapay Zeka (AI) Yapılandırması
          </h2>
          <div className="grid grid-cols-1 gap-6">
             <div className="bg-violet-50 p-4 rounded-lg border border-violet-100 text-sm text-violet-800">
               Uygulamanın akıllı analiz özelliklerini (Öğrenci Analizi, Güzergah Optimizasyonu) kullanabilmek için geçerli bir <strong>Google Gemini API Anahtarına</strong> ihtiyacınız vardır.
               <br />
               <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-violet-700 font-bold underline mt-1 inline-block">
                 API Anahtarı Almak İçin Tıklayın (Google AI Studio)
               </a>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Gemini API Anahtarı</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={showApiKey ? "text" : "password"}
                    className={`w-full pl-10 pr-10 py-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-violet-500 transition-all ${testStatus === 'error' ? 'border-red-300 bg-red-50' : testStatus === 'success' ? 'border-green-300 bg-green-50' : 'border-slate-300'}`}
                    value={formData.googleApiKey || ''}
                    onChange={(e) => handleChange('googleApiKey', e.target.value)}
                    placeholder="AIzaSy..."
                  />
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleTestApi}
                  disabled={!formData.googleApiKey || testStatus === 'testing'}
                  className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors ${testStatus === 'success' ? 'bg-green-100 text-green-700 border border-green-200' : testStatus === 'error' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'}`}
                >
                  {testStatus === 'testing' ? <Loader2 size={16} className="animate-spin" /> :
                   testStatus === 'success' ? <CheckCircle size={16} /> :
                   testStatus === 'error' ? <AlertCircle size={16} /> :
                   <Key size={16} />}
                  {testStatus === 'testing' ? 'Test Ediliyor...' :
                   testStatus === 'success' ? 'Bağlantı Başarılı' :
                   testStatus === 'error' ? 'Bağlantı Hatası' :
                   'Bağlantıyı Test Et'}
                </button>
              </div>
              {testStatus === 'error' && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle size={12} />
                  API Anahtarı geçersiz veya bağlantı kurulamadı. Lütfen kontrol ediniz.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
           <button
             type="submit"
             className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
           >
             <Save size={20} />
             Ayarları Kaydet
           </button>
        </div>
      </form>

      {signingTeacher && (
          <SignaturePad
              onSave={handleSignatureSave}
              onCancel={() => setSigningTeacher(null)}
          />
      )}
    </div>
  );
};
