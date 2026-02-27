
import React, { useState } from 'react';
import { AppSettings } from '../types';
import { Save, Building2, UserCircle, Users, CheckCircle, UserPlus, Key, Eye, EyeOff, Loader2, AlertCircle, Briefcase, MapPin, Search } from 'lucide-react';
import { testGeminiConnection } from '../services/geminiService';

interface SettingsPageProps {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
}

export const Settings: React.FC<SettingsPageProps> = ({ settings, setSettings }) => {
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [isSaved, setIsSaved] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [geocoding, setGeocoding] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSettings(formData);
    setIsSaved(true);
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
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
        setMsg({ type: 'success', text: "Adres başarıyla koordinata çevrildi." });
      } else {
        setMsg({ type: 'error', text: "Adres bulunamadı." });
      }
    } catch (error) {
      setMsg({ type: 'error', text: "Konum servisine erişilemedi." });
    } finally {
      setGeocoding(false);
      setTimeout(() => setMsg(null), 3000);
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

      {msg && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 ${msg.type === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white px-6 py-4 rounded-xl shadow-2xl animate-slide-in-up`}>
          <div className="bg-white/20 p-2 rounded-full">
            {msg.type === 'success' ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
          </div>
          <div>
            <h4 className="font-bold text-lg">{msg.type === 'success' ? 'Başarılı' : 'Hata'}</h4>
            <p className={`${msg.type === 'success' ? 'text-green-100' : 'text-red-100'} text-sm`}>{msg.text}</p>
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
                autoFocus
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
                <Briefcase size={14} className="text-slate-500" />
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
                  {geocoding ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Okul Müdürü</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.principalName}
                onChange={(e) => handleChange('principalName', e.target.value)}
                placeholder="Ad Soyad"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Müdür Yardımcısı 1</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.vicePrincipal1}
                onChange={(e) => handleChange('vicePrincipal1', e.target.value)}
                placeholder="Ad Soyad"
              />
            </div>

            {showExtraAdmins && (
              <>
                <div className="col-span-1 md:col-span-2 border-t border-slate-100 my-2 pt-2">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Ekstra Yöneticiler</p>
                </div>

                <div className="animate-fade-in bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <label className="block text-sm font-medium text-slate-700 mb-1">2. Okul Müdürü (Varsa)</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.principalName2 || ''}
                    onChange={(e) => handleChange('principalName2', e.target.value)}
                    placeholder="Ad Soyad"
                  />
                </div>

                <div className="animate-fade-in bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Müdür Yardımcısı 2</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.vicePrincipal2}
                    onChange={(e) => handleChange('vicePrincipal2', e.target.value)}
                    placeholder="Ad Soyad"
                  />
                </div>

                <div className="animate-fade-in">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Müdür Yardımcısı 3 (Opsiyonel)</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.vicePrincipal3 || ''}
                    onChange={(e) => handleChange('vicePrincipal3', e.target.value)}
                    placeholder="Ad Soyad"
                  />
                </div>
                <div className="animate-fade-in">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Müdür Yardımcısı 4 (Opsiyonel)</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.vicePrincipal4 || ''}
                    onChange={(e) => handleChange('vicePrincipal4', e.target.value)}
                    placeholder="Ad Soyad"
                  />
                </div>
              </>
            )}
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
              )
            })}
          </div>
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
    </div>
  );
};
