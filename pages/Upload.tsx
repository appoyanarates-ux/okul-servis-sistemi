
import React, { useState, useRef, useMemo } from 'react';
import { Upload as UploadIcon, FileSpreadsheet, CheckCircle, AlertCircle, RefreshCw, Trash2, ShieldCheck, UserPlus, X, Save } from 'lucide-react';
import { Student, Driver } from '../types';
import * as XLSX from 'xlsx';

interface UploadProps {
  onDataLoaded: (students: Student[], mode: 'merge' | 'replace') => void;
  students: Student[];
  drivers: Driver[];
}

// Helper: Normalize strings
const normalizeKey = (k: string) => k.toLocaleLowerCase('tr-TR').replace(/['".,\s]/g, '').trim();

// Helper: Find column value fuzzily
const getCellValue = (row: any, possibleKeys: string[]): string => {
  const rowKeys = Object.keys(row);

  // 1. Exact Match
  for (const key of possibleKeys) {
    if (row[key] !== undefined && row[key] !== null) return String(row[key]).trim();
  }
  // 2. Normalized Match
  for (const key of possibleKeys) {
    const normalizedTarget = normalizeKey(key);
    const foundKey = rowKeys.find(k => normalizeKey(k) === normalizedTarget);
    if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null) return String(row[foundKey]).trim();
  }
  // 3. Partial Match (Includes)
  for (const key of possibleKeys) {
    if (key.length > 2) {
      const normalizedTarget = normalizeKey(key);
      const foundKey = rowKeys.find(k => normalizeKey(k).includes(normalizedTarget));
      if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null) return String(row[foundKey]).trim();
    }
  }
  return ''; // Return empty string if not found
};

// Helper: Find Header Row
const findHeaderRowIndex = (worksheet: XLSX.WorkSheet, keywords: string[]): number => {
  const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
  if (!rawData || rawData.length === 0) return 0;

  // Scan first 25 rows
  for (let i = 0; i < Math.min(rawData.length, 25); i++) {
    if (!rawData[i] || rawData[i].length === 0) continue;

    const rowStr = rawData[i].map(cell => normalizeKey(String(cell || '')));

    // Check if row contains keywords
    const match = keywords.some(k => {
      const nKey = normalizeKey(k);
      return rowStr.some(cell => cell.includes(nKey));
    });

    if (match) return i;
  }
  return 0;
};

export const Upload: React.FC<UploadProps> = ({ onDataLoaded, students, drivers }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [uploadMode, setUploadMode] = useState<'merge' | 'replace'>('merge');
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Manual Entry States
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualStudent, setManualStudent] = useState<Partial<Student>>({
    studentNumber: '',
    name: '',
    className: '',
    gender: 'KIZ',
    schoolName: '',
    village: '',
    route: ''
  });

  // Extract unique values for autocomplete
  const uniqueSchools = useMemo(() => Array.from(new Set(students.map(s => s.schoolName).filter(Boolean))).sort(), [students]);
  const uniqueClasses = useMemo(() => Array.from(new Set(students.map(s => s.className).filter(Boolean))).sort(), [students]);
  const uniqueVillages = useMemo(() => Array.from(new Set(students.map(s => s.village).filter(Boolean))).sort(), [students]);
  const uniqueRoutes = useMemo(() => {
    const routes = new Set(students.map(s => s.route).filter(Boolean));
    drivers.forEach(d => d.routes.forEach(r => routes.add(r)));
    return Array.from(routes).sort();
  }, [students, drivers]);
  const uniqueDrivers = useMemo(() => drivers.map(d => d.name).sort(), [drivers]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setStatus('idle');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatus('idle');
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualStudent.name || !manualStudent.className) {
      setMsg({ type: 'error', text: "Lütfen en az İsim ve Sınıf bilgilerini doldurunuz." });
      setTimeout(() => setMsg(null), 3000);
      return;
    }

    // Okul adı boşsa varsayılan belirle
    let schoolName = manualStudent.schoolName || '';
    if (!schoolName) {
      const grade = parseInt(manualStudent.className.replace(/[^0-9]/g, '')) || 0;
      if (grade >= 1 && grade <= 4) schoolName = 'İlkokul';
      else if (grade >= 5 && grade <= 8) schoolName = 'Ortaokul';
    }

    const newStudent: Student = {
      id: `manual-${Date.now()}`,
      sn: 0, // Will be handled by merge logic or ignored
      studentNumber: manualStudent.studentNumber,
      name: manualStudent.name,
      className: manualStudent.className,
      gender: (manualStudent.gender as any) || 'KIZ',
      schoolName: schoolName,
      village: manualStudent.village || '',
      route: manualStudent.route || '',
      driver: manualStudent.driver || ''
    };

    // Add as a merge operation
    onDataLoaded([newStudent], 'merge');

    // Reset and feedback
    setManualStudent({ studentNumber: '', name: '', className: '', gender: 'KIZ', schoolName: '', village: '', route: '', driver: '' });
    setIsManualModalOpen(false);
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    setStatus('success');
    setErrorMessage('');
    setMsg({ type: 'success', text: "Öğrenci başarıyla listeye eklendi." });
    setTimeout(() => setMsg(null), 3000);
  };

  const processFile = async () => {
    if (!file) return;

    setStatus('processing');
    setErrorMessage('');

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      // Auto-detect header row with expanded keywords
      const headerRowIndex = findHeaderRowIndex(worksheet, [
        'Adı', 'Ad', 'Adı Soyadı', 'Ad Soyad', 'Öğrenci Adı', 'Name', 'İsim',
        'Öğrenci No', 'No', 'Numara', 'Okul No',
        'T.C.', 'TC', 'Kimlik No'
      ]);

      // Convert sheet to JSON
      const jsonData = XLSX.utils.sheet_to_json<any>(worksheet, {
        range: headerRowIndex,
        raw: false,
        defval: ''
      });

      if (jsonData.length === 0) {
        throw new Error("Dosya boş veya veri okunamadı. Lütfen dosya formatını kontrol ediniz. (Adı, Soyadı veya No gibi başlıklar bulunamadı)");
      }

      // Map JSON to Student type with logic for separate Name/Surname columns and filtering summary rows
      const parsedStudents: Student[] = jsonData.map((row, index) => {
        // 1. İsim ve Soyisim Ayrıştırma (Öncelik Ayrı Sütunlar: Adı, Soyadı)
        let name = getCellValue(row, ['Adı', 'Ad', 'İsim']);
        let surname = getCellValue(row, ['Soyadı', 'Soyad']);

        let fullName = '';

        if (name && surname) {
          // Adı ve Soyadı ayrı sütunlardaysa birleştir
          fullName = `${name} ${surname}`.trim();
        } else {
          // Değilse tek sütun aramayı dene (Fallback)
          fullName = getCellValue(row, ['Adı Soyadı', 'Ad Soyad', 'Öğrenci Adı', 'Name', 'İsim Soyisim']);
        }

        // 2. Filtreleme (Özet satırlarını ve boş satırları atla)
        // Eğer isim boşsa veya "Sayısı", "Toplam", "Mevcut", "İmza" gibi kelimeler içeriyorsa bu bir veri satırı değildir.
        if (!fullName ||
          fullName.includes('Sayısı') ||
          fullName.includes('Toplam') ||
          fullName.includes('Mevcut') ||
          fullName === 'Adı' || // Header tekrarı
          fullName === 'Adı Soyadı'
        ) {
          return null;
        }

        // Find Class
        const className = getCellValue(row, ['Sınıf', 'Sınıfı', 'Sinif', 'Grade', 'Şube', 'Sınıfı/Şubesi']);

        // Find Student Number
        const studentNumber = getCellValue(row, ['Öğrenci No', 'Ogrenci No', 'No', 'Numara']);

        // Find School Name (Optional)
        let schoolName = getCellValue(row, ['Okul Adı', 'Okul', 'Okulu', 'School', 'Kurum']);

        // --- OKUL KADEMESİ TESPİTİ (1-4 İlkokul, 5-8 Ortaokul) ---
        const gradeStr = className.replace(/[^0-9]/g, '');
        const grade = gradeStr ? parseInt(gradeStr, 10) : 0;

        if (grade >= 1 && grade <= 4) {
          // İLKOKUL
          if (!schoolName) {
            schoolName = 'İlkokul';
          } else if (!schoolName.toLocaleLowerCase('tr-TR').includes('ilkokul') && !schoolName.toLocaleLowerCase('tr-TR').includes('ortaokul') && !schoolName.toLocaleLowerCase('tr-TR').includes('lise')) {
            schoolName += ' İlkokulu';
          }
        } else if (grade >= 5 && grade <= 8) {
          // ORTAOKUL
          if (!schoolName) {
            schoolName = 'Ortaokul';
          } else if (!schoolName.toLocaleLowerCase('tr-TR').includes('ilkokul') && !schoolName.toLocaleLowerCase('tr-TR').includes('ortaokul') && !schoolName.toLocaleLowerCase('tr-TR').includes('lise')) {
            schoolName += ' Ortaokulu';
          }
        }
        // --------------------------------------------------------

        // Robust Gender Parsing
        const rawGender = getCellValue(row, ['Cinsiyeti', 'Cinsiyet', 'Gender', 'Cins']);
        const normalizedGender = rawGender.toLocaleUpperCase('tr-TR').trim();

        let gender: 'KIZ' | 'ERKEK' | '' = '';

        if (normalizedGender) {
          // FEMALE DETECTION
          if (
            normalizedGender.startsWith('K') || // K, KIZ, KADIN
            normalizedGender === 'BAYAN' ||
            normalizedGender.includes('KIZ') ||
            normalizedGender === 'F' ||
            normalizedGender === 'FEMALE'
          ) {
            gender = 'KIZ';
          }
          // MALE DETECTION
          else if (
            normalizedGender.startsWith('E') || // E, ERKEK
            normalizedGender === 'BAY' ||
            normalizedGender.includes('ERK') ||
            normalizedGender === 'M' ||
            normalizedGender === 'MALE'
          ) {
            gender = 'ERKEK';
          }
        }

        // Other Fields
        let route = getCellValue(row, ['Güzergah', 'Güzergahı', 'Route', 'Hat', 'Servis']);
        // Köy verisi boşsa ve Güzergah verisi varsa, köyü güzergahtan çek
        let village = getCellValue(row, ['Köy', 'Köyü', 'Mahalle', 'Yerleşim Yeri', 'Village', 'İkamet', 'Adres']);
        if (!village && route) {
          village = route;
        }

        const driver = getCellValue(row, ['Şoför', 'Şoför Adı', 'Driver', 'Sofor']);

        // Sıra No (S.No) ve Öğrenci No
        const snVal = getCellValue(row, ['S.No', 'Sıra No', 'SN', 'Sıra']);
        // Eğer S.No sütunu yoksa döngüdeki index'i kullan
        const sn = snVal ? parseInt(snVal.replace(/[^0-9]/g, '')) : (index + 1);

        return {
          id: `upload-${Date.now()}-${index}`,
          sn: isNaN(sn) ? index + 1 : sn,
          studentNumber: studentNumber,
          schoolName: schoolName,
          name: fullName,
          gender: gender,
          className: className,
          village: village,
          route: route,
          driver: driver
        } as Student;
      }).filter((s): s is Student => s !== null);

      if (parsedStudents.length === 0) {
        throw new Error("Dosyada geçerli öğrenci verisi bulunamadı. Lütfen 'Adı' ve 'Soyadı' (veya 'Adı Soyadı') sütunlarının olduğundan emin olun.");
      }

      // Pass data to parent with selected mode
      onDataLoaded(parsedStudents, uploadMode);
      setStatus('success');

      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = '';

    } catch (error) {
      console.error("Upload Error:", error);
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : "Dosya işlenirken bir hata oluştu.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in relative">
      {msg && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 ${msg.type === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white px-6 py-4 rounded-xl shadow-2xl animate-slide-in-up`}>
          <div className="bg-white/20 p-2 rounded-full">
            {msg.type === 'success' ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
          </div>
          <div>
            <h4 className="font-bold text-lg">{msg.type === 'success' ? 'Başarılı' : 'Hata'}</h4>
            <p className="text-white/90 text-sm">{msg.text}</p>
          </div>
        </div>
      )}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-800">Hızlı Excel Yükle</h1>
        <p className="text-slate-500 mt-2">e-Okul veya MEBBİS formatındaki öğrenci listelerini sisteme yükleyin.</p>
        <p className="text-xs text-blue-600 mt-2 font-medium bg-blue-50 inline-block px-3 py-1 rounded-full border border-blue-100">
          Not: e-Okul taşımalı eğitim alan öğrenci listesinden alınmıştır.
        </p>
      </div>

      {/* Datalists for Autocomplete */}
      <datalist id="schoolOptions">
        {uniqueSchools.map(s => <option key={s} value={s} />)}
      </datalist>
      <datalist id="classOptions">
        {uniqueClasses.map(c => <option key={c} value={c} />)}
      </datalist>
      <datalist id="villageOptions">
        {uniqueVillages.map(v => <option key={v} value={v} />)}
      </datalist>
      <datalist id="routeOptions">
        {uniqueRoutes.map(r => <option key={r} value={r} />)}
      </datalist>
      <datalist id="driverOptions">
        {uniqueDrivers.map(d => <option key={d} value={d} />)}
      </datalist>

      {/* Manual Entry Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><UserPlus size={20} className="text-blue-600" /> Yeni Öğrenci Ekle</h3>
              <button onClick={() => setIsManualModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleManualSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Adı Soyadı</label>
                  <input autoFocus required type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={manualStudent.name} onChange={(e) => setManualStudent({ ...manualStudent, name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Okul No</label>
                  <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={manualStudent.studentNumber} onChange={(e) => setManualStudent({ ...manualStudent, studentNumber: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Okul</label>
                  <input type="text" list="schoolOptions" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={manualStudent.schoolName} onChange={(e) => setManualStudent({ ...manualStudent, schoolName: e.target.value })} placeholder="Seç veya Yaz" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Sınıf / Şube</label>
                  <input required type="text" list="classOptions" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={manualStudent.className} onChange={(e) => setManualStudent({ ...manualStudent, className: e.target.value })} placeholder="Seç veya Yaz (Örn: 5/A)" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Cinsiyet</label>
                  <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={manualStudent.gender} onChange={(e) => setManualStudent({ ...manualStudent, gender: e.target.value as any })}>
                    <option value="KIZ">KIZ</option>
                    <option value="ERKEK">ERKEK</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Köy / Mahalle</label>
                  <input type="text" list="villageOptions" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={manualStudent.village} onChange={(e) => setManualStudent({ ...manualStudent, village: e.target.value })} placeholder="Seç veya Yaz" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Güzergah</label>
                  <input type="text" list="routeOptions" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={manualStudent.route} onChange={(e) => setManualStudent({ ...manualStudent, route: e.target.value })} placeholder="Seç veya Yaz" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Şoför</label>
                  <input type="text" list="driverOptions" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={manualStudent.driver} onChange={(e) => setManualStudent({ ...manualStudent, driver: e.target.value })} placeholder="Seç veya Yaz" />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-4">
                <button type="button" onClick={() => setIsManualModalOpen(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors">İptal</button>
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex items-center gap-2"><Save size={18} /> Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Preferences & Manual Add */}
      <div className="flex flex-col gap-4">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <ShieldCheck size={20} className="text-blue-600" />
              <span>Yükleme Tercihleri</span>
            </h3>
            <button
              onClick={() => setIsManualModalOpen(true)}
              className="text-xs flex items-center gap-1 bg-violet-50 text-violet-700 px-3 py-1.5 rounded-lg font-bold border border-violet-100 hover:bg-violet-100 transition-colors"
            >
              <UserPlus size={14} /> Öğrenci Ekle
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              onClick={() => setUploadMode('merge')}
              className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex flex-col gap-2 ${uploadMode === 'merge' ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200 hover:border-slate-300'}`}
            >
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${uploadMode === 'merge' ? 'border-blue-500' : 'border-slate-400'}`}>
                  {uploadMode === 'merge' && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />}
                </div>
                <RefreshCw size={18} className="text-blue-600" />
                Gelişmiş Akıllı Birleştirme
              </div>
              <p className="text-xs text-slate-500 pl-7">
                Öğrenci adı eşleşirse bilgiler güncellenir, yeni öğrenciler eklenir. <br />
                <span className="font-bold text-blue-600">Önemli:</span> Excel'deki boş hücreler mevcut verinizi silmez.
              </p>
            </div>

            <div
              onClick={() => setUploadMode('replace')}
              className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex flex-col gap-2 ${uploadMode === 'replace' ? 'border-red-500 bg-red-50/50' : 'border-slate-200 hover:border-slate-300'}`}
            >
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${uploadMode === 'replace' ? 'border-red-500' : 'border-slate-400'}`}>
                  {uploadMode === 'replace' && <div className="w-2.5 h-2.5 bg-red-500 rounded-full" />}
                </div>
                <Trash2 size={18} className="text-red-600" />
                Listeyi Sıfırla ve Yükle
              </div>
              <p className="text-xs text-slate-500 pl-7">
                Mevcut tüm öğrenci listesi silinir ve sadece bu dosyadaki veriler yüklenir.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div
        className={`
          border-3 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer relative overflow-hidden
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}
          ${status === 'success' ? 'bg-green-50 border-green-200' : ''}
          ${status === 'error' ? 'bg-red-50 border-red-200' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".csv,.xlsx,.xls,.xlt,.xltx"
          onChange={handleFileChange}
        />

        <div className="flex flex-col items-center space-y-4 relative z-10">
          {status === 'success' ? (
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center animate-bounce">
              <CheckCircle size={32} />
            </div>
          ) : status === 'error' ? (
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
              <AlertCircle size={32} />
            </div>
          ) : (
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
              <FileSpreadsheet size={32} />
            </div>
          )}

          <div>
            {file ? (
              <p className="font-semibold text-slate-800 text-lg">{file.name}</p>
            ) : (
              <>
                <p className="font-semibold text-slate-800 text-lg">Dosyayı buraya sürükleyin</p>
                <p className="text-slate-500">veya seçmek için tıklayın</p>
              </>
            )}
          </div>

          <p className="text-xs text-slate-400">Desteklenen formatlar: XLS, XLSX, XLT, CSV</p>
        </div>
      </div>

      {status === 'error' && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-start gap-3 border border-red-200 animate-slide-in-up">
          <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-bold">Hata Oluştu</h4>
            <p className="text-sm">{errorMessage}</p>
          </div>
        </div>
      )}

      {file && status !== 'success' && (
        <div className="flex justify-center">
          <button
            onClick={(e) => { e.stopPropagation(); processFile(); }}
            disabled={status === 'processing'}
            className={`
              flex items-center space-x-2 px-8 py-3 rounded-xl text-white font-medium shadow-lg transition-all
              ${status === 'processing' ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:scale-105'}
            `}
          >
            {status === 'processing' ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>İşleniyor...</span>
              </>
            ) : (
              <>
                <UploadIcon size={20} />
                <span>{uploadMode === 'merge' ? 'Verileri Birleştir & Yükle' : 'Tümünü Sil & Yükle'}</span>
              </>
            )}
          </button>
        </div>
      )}

      {status === 'success' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3 animate-fade-in">
          <CheckCircle className="text-green-600 mt-0.5" size={20} />
          <div>
            <h4 className="font-semibold text-green-800">İşlem Başarılı</h4>
            <p className="text-green-700 text-sm mt-1">
              Veriler listeye başarıyla aktarıldı. <br />
              Yeni eklenenleri öğrenci listesinden kontrol edebilirsiniz.
            </p>
            <button
              onClick={() => { setStatus('idle'); setFile(null); }}
              className="mt-2 text-green-800 text-xs font-bold underline hover:text-green-900"
            >
              Yeni Dosya Yükle
            </button>
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-xl border border-slate-200">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <AlertCircle size={18} className="text-orange-500" />
          <span>Yükleme Talimatları</span>
        </h3>
        <ul className="space-y-2 text-sm text-slate-600 list-disc pl-5">
          <li>Excel dosyasında "Adı" ve "Soyadı" sütunları ayrı olsa bile sistem bunları otomatik birleştirir.</li>
          <li><strong>Öğrenci No:</strong> "Öğrenci No", "No" veya "Numara" sütunları otomatik algılanır.</li>
          <li><strong>Okul Bilgisi:</strong> 1-4. sınıflar "İlkokul", 5-8. sınıflar "Ortaokul" olarak otomatik ayarlanır.</li>
          <li><strong>Köy/Güzergah:</strong> Eğer "Köy" sütunu boşsa ancak "Güzergah" sütunu doluysa, sistem köy bilgisini güzergahtan çeker.</li>
          <li><strong>Manuel Ekleme:</strong> "Öğrenci Ekle" butonu ile dosya yüklemeden de hızlıca kayıt oluşturabilirsiniz.</li>
        </ul>
      </div>
    </div>
  );
};
