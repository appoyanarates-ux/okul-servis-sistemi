import React, { useRef, useState } from 'react';
import { Student, Driver } from '../types';
import { Download, Upload, AlertTriangle, CheckCircle, Database, FileJson, Trash2 } from 'lucide-react';
import { saveBlob } from '../services/fileService';

interface BackupRestoreProps {
  students: Student[];
  drivers: Driver[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  setDrivers: React.Dispatch<React.SetStateAction<Driver[]>>;
}

export const BackupRestore: React.FC<BackupRestoreProps> = ({ students, drivers, setStudents, setDrivers }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [restoreStatus, setRestoreStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Verileri Yedekle (İndir)
  const handleBackup = () => {
    const backupData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      source: 'OkulServis Yönetim Sistemi',
      data: {
        students: students,
        drivers: drivers
      }
    };

    const fileName = `okulservis_yedek_${new Date().toLocaleDateString('tr-TR').replace(/\./g, '-')}.json`;
    const jsonString = JSON.stringify(backupData, null, 2);

    // Use fileService to handle download compatibility
    saveBlob(jsonString, fileName, 'application/json');
  };

  // Verileri Geri Yükle (Dosya Seçimi)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsedData = JSON.parse(content);

        // Basit validasyon: students ve drivers anahtarları var mı?
        // Eski format veya yeni format kontrolü
        let newStudents: Student[] = [];
        let newDrivers: Driver[] = [];

        if (parsedData.data && Array.isArray(parsedData.data.students)) {
          // Bizim oluşturduğumuz yeni format
          newStudents = parsedData.data.students;
          newDrivers = parsedData.data.drivers || [];
        } else if (Array.isArray(parsedData.students)) {
          // Doğrudan state formatı (manuel yedeklenmiş olabilir)
          newStudents = parsedData.students;
          newDrivers = parsedData.drivers || [];
        } else {
          throw new Error("Geçersiz yedek dosyası formatı.");
        }

        // State güncelle
        setStudents(newStudents);
        setDrivers(newDrivers);

        setRestoreStatus('success');
        setStatusMessage(`${newStudents.length} öğrenci ve ${newDrivers.length} şoför kaydı başarıyla yüklendi.`);

      } catch (error) {
        console.error("Yedek yükleme hatası:", error);
        setRestoreStatus('error');
        setStatusMessage("Dosya okunamadı veya format hatalı. Lütfen geçerli bir .json yedek dosyası seçin.");
      }
    };
    reader.readAsText(file);

    // Inputu temizle ki aynı dosyayı tekrar seçebilelim
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleResetData = () => {
    setStudents([]);
    setDrivers([]);
    setShowResetConfirm(false);
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    setRestoreStatus('success');
    setStatusMessage("Tüm veriler başarıyla sıfırlandı. Sistem fabrika ayarlarına döndü.");
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Yedekleme ve Geri Yükleme</h1>
        <p className="text-slate-500 mt-1">Verilerinizi güvene alın veya başka bir bilgisayara taşıyın.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* YEDEKLEME KARTI */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center text-center space-y-6 hover:shadow-md transition-shadow">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
            <Download size={32} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">Verileri Yedekle</h3>
            <p className="text-slate-500 mt-2 text-sm">
              Mevcut tüm öğrenci, şoför ve güzergah verilerini bilgisayarınıza <b>.json</b> dosyası olarak indirin.
            </p>
          </div>

          <div className="bg-slate-50 w-full p-4 rounded-xl border border-slate-100 text-left space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Öğrenci Sayısı:</span>
              <span className="font-bold text-slate-800">{students.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Şoför Sayısı:</span>
              <span className="font-bold text-slate-800">{drivers.length}</span>
            </div>
          </div>

          <button
            onClick={handleBackup}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Database size={18} />
            Yedeği İndir
          </button>
        </div>

        {/* GERİ YÜKLEME KARTI */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center text-center space-y-6 hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
            <Upload size={32} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">Yedeği Geri Yükle</h3>
            <p className="text-slate-500 mt-2 text-sm">
              Daha önce aldığınız bir yedek dosyasını seçerek verileri sisteme geri yükleyin.
            </p>
          </div>

          <div className="bg-orange-50 w-full p-3 rounded-xl border border-orange-100 flex items-start gap-3 text-left">
            <AlertTriangle className="text-orange-500 shrink-0 mt-0.5" size={18} />
            <p className="text-xs text-orange-700 leading-relaxed">
              <b>Dikkat:</b> Geri yükleme işlemi mevcut verilerin üzerine yazacaktır. İşleme devam etmeden önce mevcut verilerin yedeğini almanız önerilir.
            </p>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <FileJson size={18} />
            Yedek Dosyası Seç
          </button>
        </div>
      </div>

      {/* DURUM MESAJI */}
      {restoreStatus !== 'idle' && (
        <div className={`p-4 rounded-xl border flex items-start gap-3 animate-slide-in-up ${restoreStatus === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
          {restoreStatus === 'success' ? <CheckCircle className="mt-0.5" /> : <AlertTriangle className="mt-0.5" />}
          <div>
            <h4 className="font-bold">{restoreStatus === 'success' ? 'İşlem Başarılı' : 'Hata Oluştu'}</h4>
            <p className="text-sm">{statusMessage}</p>
          </div>
          <button onClick={() => setRestoreStatus('idle')} className="ml-auto p-1 hover:bg-black/5 rounded"><div className="w-4 h-4">✕</div></button>
        </div>
      )}

      {/* FABRİKA AYARLARI */}
      <div className="mt-12 pt-8 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-red-600 flex items-center gap-2"><Trash2 size={20} /> Verileri Sıfırla</h3>
            <p className="text-sm text-slate-500">Tüm verileri siler ve uygulamayı başlangıç durumuna getirir.</p>
          </div>
          <button
            onClick={() => setShowResetConfirm(true)}
            className="px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors"
          >
            Sıfırla
          </button>
        </div>
      </div>

      {/* SIFIRLAMA ONAY MODALI */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 text-center space-y-6">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle size={32} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Emin misiniz?</h3>
              <p className="text-slate-500 mt-2">
                Bu işlem kayıtlı <b>tüm öğrenci ve şoför verilerini kalıcı olarak silecektir.</b> Bu işlem geri alınamaz.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-3 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl font-medium transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleResetData}
                autoFocus
                className="flex-1 py-3 bg-red-600 text-white hover:bg-red-700 rounded-xl font-bold transition-colors shadow-lg shadow-red-200"
              >
                Evet, Hepsini Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};