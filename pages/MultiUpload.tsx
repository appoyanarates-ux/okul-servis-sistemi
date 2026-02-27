
import React, { useState, useRef } from 'react';
import { Upload as UploadIcon, FileSpreadsheet, CheckCircle, AlertCircle, ArrowRight, Merge, Users, Bus, RefreshCw, HelpCircle } from 'lucide-react';
import { Student, Driver } from '../types';
import * as XLSX from 'xlsx';

interface MultiUploadProps {
  onDataMerged: (students: Student[], drivers: Driver[]) => void;
}

// Helper: Normalize strings for comparison (remove spaces, lowercase, punctuation)
const normalizeKey = (k: string) => k.toLowerCase().replace(/['".,\s]/g, '').trim();

// Helper: Find value in row using fuzzy matching
const findColumnValue = (row: any, possibleKeys: string[]): string => {
  const rowKeys = Object.keys(row);
  
  // 1. Exact Match
  for (const key of possibleKeys) {
    if (row[key] !== undefined && row[key] !== null) return String(row[key]).trim();
  }

  // 2. Normalized Match (ignore case, spaces, punctuation)
  for (const key of possibleKeys) {
    const normalizedTarget = normalizeKey(key);
    const foundKey = rowKeys.find(k => normalizeKey(k) === normalizedTarget);
    if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null) return String(row[foundKey]).trim();
  }
  
  // 3. Partial Match (Includes) - Only for longer keys to avoid false positives
  for (const key of possibleKeys) {
      const normalizedTarget = normalizeKey(key);
      if (normalizedTarget.length > 2) {
        const foundKey = rowKeys.find(k => normalizeKey(k).includes(normalizedTarget));
        if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null) return String(row[foundKey]).trim();
      }
  }

  return ''; // Return empty string if not found
};

// Helper: Extract Name (Combined or Separate Columns)
const extractName = (row: any, combinedKeys: string[], nameKeys: string[], surnameKeys: string[]): string => {
    // 1. Try combined column first
    const combined = findColumnValue(row, combinedKeys);
    if (combined) return combined;

    // 2. Try separate columns
    const name = findColumnValue(row, nameKeys);
    const surname = findColumnValue(row, surnameKeys);
    
    if (name || surname) {
        return `${name} ${surname}`.trim();
    }

    return '';
};

// Helper: Find the header row index by scanning first 20 rows
const findHeaderRowIndex = (worksheet: XLSX.WorkSheet, keywords: string[]): number => {
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
    // Scan first 20 rows
    for (let i = 0; i < Math.min(rawData.length, 20); i++) {
        if (!rawData[i]) continue;
        const rowStr = rawData[i].map(cell => normalizeKey(String(cell)));
        // Check if any of the keywords exist in this row
        const match = keywords.some(k => rowStr.some(cell => cell.includes(normalizeKey(k))));
        if (match) return i;
    }
    return 0; // Default to first row if not found
};

export const MultiUpload: React.FC<MultiUploadProps> = ({ onDataMerged }) => {
  const [studentFile, setStudentFile] = useState<File | null>(null);
  const [driverFile, setDriverFile] = useState<File | null>(null);
  const [parsedStudents, setParsedStudents] = useState<Student[]>([]);
  const [parsedDrivers, setParsedDrivers] = useState<Driver[]>([]);
  const [step, setStep] = useState<1 | 2 | 3>(1); 
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [matchCount, setMatchCount] = useState(0);

  const studentInputRef = useRef<HTMLInputElement>(null);
  const driverInputRef = useRef<HTMLInputElement>(null);

  const handleStudentFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setStudentFile(e.target.files[0]);
      setStatus('idle');
    }
  };

  const handleDriverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setDriverFile(e.target.files[0]);
      setStatus('idle');
    }
  };

  const processFiles = async () => {
    if (!studentFile || !driverFile) {
      setErrorMessage("Lütfen her iki Excel dosyasını da seçiniz.");
      setStatus('error');
      return;
    }

    setStatus('processing');
    setErrorMessage('');

    try {
      // --- 1. PROCESS STUDENT LIST ---
      const studentDataBuffer = await studentFile.arrayBuffer();
      const studentWorkbook = XLSX.read(studentDataBuffer);
      const studentWorksheet = studentWorkbook.Sheets[studentWorkbook.SheetNames[0]];
      
      // Find header row for students
      const studentHeaderRow = findHeaderRowIndex(studentWorksheet, ['Adı Soyadı', 'Ad Soyad', 'Öğrenci Adı', 'Sınıfı', 'Okul No', 'T.C.']);
      
      const studentJson = XLSX.utils.sheet_to_json<any>(studentWorksheet, { 
          range: studentHeaderRow,
          defval: '' 
      });

      const tempStudents: Student[] = studentJson.map((row, index) => {
        // Name Extraction
        const name = extractName(
            row, 
            ['Adı Soyadı', 'Ad Soyad', 'Öğrenci Adı', 'Adı-Soyadı', 'İsim Soyisim'], 
            ['Adı', 'Ad', 'İsim'], 
            ['Soyadı', 'Soyad'] 
        );

        if (!name) return null; // Skip empty rows

        // Robust Gender Parsing
        const rawGender = findColumnValue(row, ['Cinsiyeti', 'Cinsiyet', 'Cins', 'Gender']);
        let gender: 'KIZ' | 'ERKEK' | '' = '';
        const upperGender = rawGender.toUpperCase();
        
        if (upperGender.startsWith('K') || upperGender.includes('KIZ') || upperGender === 'BAYAN' || upperGender === 'FEMALE' || upperGender === 'F') gender = 'KIZ';
        else if (upperGender.startsWith('E') || upperGender.includes('ERK') || upperGender === 'BAY' || upperGender === 'MALE' || upperGender === 'M') gender = 'ERKEK';

        const snVal = findColumnValue(row, ['Sıra No', 'S.No', 'Sıra', 'No', 'Öğrenci No']);
        const className = findColumnValue(row, ['Sınıfı/Şubesi', 'Sınıfı', 'Sınıf', 'Şube', 'Sinif']);
        let schoolName = findColumnValue(row, ['Okul Adı', 'Okulu', 'Okul', 'Kurum']) || '';

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
        
        return {
          id: `stu-${Date.now()}-${index}`,
          sn: snVal ? parseInt(snVal.replace(/[^0-9]/g, '')) || (index + 1) : (index + 1),
          schoolName: schoolName,
          name: name,
          gender: gender,
          className: className,
          village: findColumnValue(row, ['Köy', 'Köyü', 'Mahalle', 'Yerleşim Yeri', 'İkamet', 'Adres']),
          route: findColumnValue(row, ['Güzergah', 'Güzergahı', 'Hat', 'Servis', 'Rota']),
          driver: '' 
        };
      }).filter((s): s is Student => s !== null);

      // --- 2. PROCESS DRIVER LIST ---
      const driverDataBuffer = await driverFile.arrayBuffer();
      const driverWorkbook = XLSX.read(driverDataBuffer);
      const driverWorksheet = driverWorkbook.Sheets[driverWorkbook.SheetNames[0]];
      
      // Find header row for drivers
      const driverHeaderRow = findHeaderRowIndex(driverWorksheet, ['Şoför Adı', 'Adı Soyadı', 'Plaka', 'Güzergah', 'Sürücü']);
      
      const driverJson = XLSX.utils.sheet_to_json<any>(driverWorksheet, { 
          range: driverHeaderRow,
          defval: '' 
      });

      const tempDrivers: (Driver & { _village?: string })[] = driverJson.map((row, index): (Driver & { _village?: string }) | null => {
        const name = extractName(
            row, 
            ['Adı Soyadı', 'Şoför Adı', 'Ad Soyad', 'Sürücü', 'Şoför', 'İsim'], 
            ['Adı', 'Ad'], 
            ['Soyadı', 'Soyad']
        );
        
        if (!name) return null;

        const route = findColumnValue(row, ['Güzergah', 'Güzergahı', 'Hat', 'Rota']);
        const village = findColumnValue(row, ['Köy', 'Köyü', 'Yerleşim Yeri', 'Hizmet Bölgesi']);
        
        const routes: string[] = [];
        if (route) routes.push(route);
        if (!route && village) routes.push(village); // Use village as route name if route not defined

        return {
          id: `drv-${Date.now()}-${index}`,
          name: name,
          plateNumber: findColumnValue(row, ['Araç Plaka No', 'Plaka', 'Araç Plakası', 'Plakası', 'Araç']),
          routes: routes,
          _village: village 
        };
      }).filter((d): d is (Driver & { _village?: string }) => d !== null);

      if (tempStudents.length === 0) throw new Error("Öğrenci dosyasında okunabilir veri bulunamadı. Lütfen dosyanın boş olmadığından ve doğru formatta olduğundan emin olunuz.");
      
      // --- 3. MATCHING LOGIC ---
      let matches = 0;
      
      // Build lookup maps for drivers based on Route Name and Village Name
      const routeMap = new Map<string, string>();   
      const villageMap = new Map<string, string>(); 

      tempDrivers.forEach(d => {
          d.routes.forEach(r => routeMap.set(normalizeKey(r), d.name));
          if (d._village) villageMap.set(normalizeKey(d._village), d.name);
      });

      const matchedStudents = tempStudents.map(s => {
          let assignedDriver = '';
          const sRoute = normalizeKey(s.route);
          const sVillage = normalizeKey(s.village);

          // Priority 1: Match by Route Name
          if (sRoute && routeMap.has(sRoute)) {
              assignedDriver = routeMap.get(sRoute)!;
          } 
          // Priority 2: Match by Village Name
          else if (sVillage && villageMap.has(sVillage)) {
              assignedDriver = villageMap.get(sVillage)!;
          }

          if (assignedDriver) matches++;
          return { ...s, driver: assignedDriver };
      });

      setParsedStudents(matchedStudents);
      setParsedDrivers(tempDrivers);
      setMatchCount(matches);
      setStep(2);
      setStatus('idle');

    } catch (error) {
      console.error(error);
      setErrorMessage(error instanceof Error ? error.message : "Dosyalar işlenirken bilinmeyen bir hata oluştu.");
      setStatus('error');
    }
  };

  const handleFinalSave = () => {
      onDataMerged(parsedStudents, parsedDrivers);
      setStep(3);
  };

  const resetAll = () => {
      setStudentFile(null);
      setDriverFile(null);
      setParsedStudents([]);
      setParsedDrivers([]);
      setStep(1);
      setStatus('idle');
      if (studentInputRef.current) studentInputRef.current.value = '';
      if (driverInputRef.current) driverInputRef.current.value = '';
  };

  return (
    <div className="max-w-5xl mx-auto animate-fade-in space-y-8 pb-12">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-slate-800">Detaylı Veri Yükleme ve Birleştirme</h1>
        <p className="text-slate-500 max-w-2xl mx-auto">
          Farklı Excel (XLS, XLSX, CSV) formatlarındaki Öğrenci ve Şoför listelerini yükleyin. Sistem, sütun isimlerini otomatik algılar (Ad, Soyad, Sınıf vb.), eksik verileri boş geçer ve <strong>Güzergah/Köy</strong> bilgisine göre eşleştirme yapar.
        </p>
      </div>

      {step === 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Öğrenci Yükleme Kartı */}
          <div className={`bg-white p-6 rounded-2xl border-2 transition-all relative overflow-hidden group ${studentFile ? 'border-green-400 shadow-md' : 'border-slate-200 shadow-sm hover:border-blue-300'}`}>
             <div className="flex items-center gap-3 mb-4">
                <div className={`p-3 rounded-full ${studentFile ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                   <Users size={24} />
                </div>
                <div>
                   <h3 className="font-bold text-slate-800">1. Öğrenci Listesi</h3>
                   <div className="text-[10px] text-slate-500 mt-1 flex flex-wrap gap-1">
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded">Ad Soyad</span>
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded">Sınıf</span>
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded">Cinsiyet (K/E)</span>
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded">Köy</span>
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded">Güzergah</span>
                   </div>
                </div>
             </div>
             
             <div 
               onClick={() => studentInputRef.current?.click()}
               className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${studentFile ? 'border-green-300 bg-green-50' : 'border-slate-300 hover:bg-slate-50'}`}
             >
                <input type="file" ref={studentInputRef} className="hidden" accept=".xlsx,.xls,.xlt,.xltx,.csv" onChange={handleStudentFileChange} />
                {studentFile ? (
                    <div className="flex flex-col items-center text-green-700 animate-slide-in-up">
                        <CheckCircle size={32} className="mb-2" />
                        <span className="font-bold text-sm">{studentFile.name}</span>
                        <span className="text-xs mt-1">Dosya Hazır</span>
                    </div>
                ) : (
                    <div className="flex flex-col items-center text-slate-400">
                        <FileSpreadsheet size={32} className="mb-2 group-hover:scale-110 transition-transform" />
                        <span className="font-medium">Dosya Seçin veya Sürükleyin</span>
                        <span className="text-[10px] mt-1 text-slate-400">XLS, XLSX, CSV</span>
                    </div>
                )}
             </div>
          </div>

          {/* Şoför Yükleme Kartı */}
          <div className={`bg-white p-6 rounded-2xl border-2 transition-all relative overflow-hidden group ${driverFile ? 'border-green-400 shadow-md' : 'border-slate-200 shadow-sm hover:border-orange-300'}`}>
             <div className="flex items-center gap-3 mb-4">
                <div className={`p-3 rounded-full ${driverFile ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                   <Bus size={24} />
                </div>
                <div>
                   <h3 className="font-bold text-slate-800">2. Şoför & Araç Listesi</h3>
                   <div className="text-[10px] text-slate-500 mt-1 flex flex-wrap gap-1">
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded">Ad Soyad</span>
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded">Plaka</span>
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded">Güzergah/Köy</span>
                   </div>
                </div>
             </div>
             
             <div 
               onClick={() => driverInputRef.current?.click()}
               className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${driverFile ? 'border-green-300 bg-green-50' : 'border-slate-300 hover:bg-slate-50'}`}
             >
                <input type="file" ref={driverInputRef} className="hidden" accept=".xlsx,.xls,.xlt,.xltx,.csv" onChange={handleDriverFileChange} />
                {driverFile ? (
                    <div className="flex flex-col items-center text-green-700 animate-slide-in-up">
                        <CheckCircle size={32} className="mb-2" />
                        <span className="font-bold text-sm">{driverFile.name}</span>
                        <span className="text-xs mt-1">Dosya Hazır</span>
                    </div>
                ) : (
                    <div className="flex flex-col items-center text-slate-400">
                        <FileSpreadsheet size={32} className="mb-2 group-hover:scale-110 transition-transform" />
                        <span className="font-medium">Dosya Seçin veya Sürükleyin</span>
                        <span className="text-[10px] mt-1 text-slate-400">XLS, XLSX, CSV</span>
                    </div>
                )}
             </div>
          </div>
        </div>
      )}

      {/* İşlem Butonları ve Durum Mesajları */}
      <div className="flex flex-col items-center justify-center pt-2">
         {status === 'error' && (
             <div className="mb-6 bg-red-50 text-red-700 px-6 py-4 rounded-xl border border-red-200 flex items-center gap-3 w-full max-w-2xl animate-shake">
                 <AlertCircle size={24} className="shrink-0" />
                 <div>
                    <h4 className="font-bold">Bir Sorun Oluştu</h4>
                    <p className="text-sm">{errorMessage}</p>
                 </div>
             </div>
         )}

         {step === 1 && (
             <div className="space-y-4 text-center">
                <button 
                    onClick={processFiles}
                    disabled={status === 'processing'}
                    className="flex items-center gap-3 px-10 py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-xl hover:bg-blue-700 hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                    {status === 'processing' ? (
                        <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Dosyalar Analiz Ediliyor...
                        </>
                    ) : (
                        <>
                        <Merge size={20} />
                        Analiz Et ve Birleştir
                        </>
                    )}
                </button>
                <p className="text-xs text-slate-400">
                   <HelpCircle size={12} className="inline mr-1"/>
                   Eksik sütunlar (örn: Cinsiyet) boş bırakılır, sistem çalışmaya devam eder.
                </p>
             </div>
         )}

         {step === 2 && (
             <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-slide-in-up">
                 <div className="bg-slate-50 p-5 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <CheckCircle className="text-green-500" /> Analiz Sonucu
                    </h3>
                    <button onClick={resetAll} className="px-4 py-2 text-sm text-slate-600 hover:text-red-600 bg-white border border-slate-300 hover:border-red-300 rounded-lg transition-colors">İptal / Yeniden Başla</button>
                 </div>
                 
                 <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8 text-center relative">
                    <div className="relative z-10">
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Öğrenci Listesi</p>
                        <p className="text-4xl font-black text-blue-600">{parsedStudents.length}</p>
                        <p className="text-xs text-slate-500 mt-1">Kişi Bulundu</p>
                    </div>
                    
                    {/* Ortadaki Ok */}
                    <div className="hidden md:flex flex-col items-center justify-center absolute inset-0 z-0 opacity-20 pointer-events-none">
                       <ArrowRight size={48} className="text-slate-400" />
                    </div>

                    <div className="relative z-10">
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Şoför Listesi</p>
                        <p className="text-4xl font-black text-orange-600">{parsedDrivers.length}</p>
                        <p className="text-xs text-slate-500 mt-1">Araç/Şoför Bulundu</p>
                    </div>
                    
                    <div className="relative z-10 bg-green-50 rounded-xl p-2 border border-green-100">
                        <p className="text-sm font-bold text-green-700 uppercase tracking-wider mb-2">Otomatik Eşleşen</p>
                        <p className="text-4xl font-black text-green-600">{matchCount}</p>
                        <p className="text-xs text-green-700 mt-1">Öğrenciye Şoför Atandı</p>
                    </div>
                 </div>

                 <div className="bg-blue-50 p-5 text-sm text-blue-800 border-t border-blue-100 flex items-start gap-3">
                    <div className="bg-white p-1.5 rounded-full shadow-sm text-blue-600 shrink-0"><RefreshCw size={16} /></div>
                    <div>
                        <p className="font-bold mb-1">Eşleştirme Mantığı:</p>
                        <ul className="list-disc list-inside space-y-1 opacity-80 text-xs">
                            <li>Önce <strong>Güzergah</strong> isimleri (harf büyüklüğüne bakılmaksızın) kontrol edildi.</li>
                            <li>Eğer güzergah eşleşmezse, <strong>Köy/Mahalle</strong> isimlerine bakıldı.</li>
                            <li>Eşleşmeyen {parsedStudents.length - matchCount} öğrenci sisteme kaydedilir ancak şoför bilgisi boş bırakılır. Daha sonra manuel atama yapabilirsiniz.</li>
                        </ul>
                    </div>
                 </div>

                 <div className="p-6 flex justify-center bg-slate-50 border-t border-slate-200">
                    <button 
                        onClick={handleFinalSave}
                        className="flex items-center gap-2 px-12 py-4 bg-green-600 text-white font-bold rounded-xl shadow-lg hover:bg-green-700 hover:scale-105 transition-all text-lg"
                    >
                        <UploadIcon size={24} />
                        Verileri Sisteme Kaydet
                    </button>
                 </div>
             </div>
         )}

         {step === 3 && (
             <div className="bg-green-50 border border-green-200 p-10 rounded-3xl text-center animate-fade-in shadow-lg max-w-lg mx-auto">
                 <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                     <CheckCircle size={40} />
                 </div>
                 <h2 className="text-2xl font-bold text-green-800 mb-2">Yükleme Başarılı!</h2>
                 <p className="text-green-700 mb-8 leading-relaxed">
                    Tüm veriler sisteme başarıyla aktarıldı ve birleştirildi. <br/>
                    Şimdi listeleri kontrol edebilir veya rapor alabilirsiniz.
                 </p>
                 <div className="flex gap-4 justify-center">
                    <button 
                        onClick={resetAll}
                        className="px-6 py-2.5 bg-white text-green-700 border border-green-300 rounded-xl hover:bg-green-50 font-medium transition-colors"
                    >
                        Yeni Yükleme Yap
                    </button>
                 </div>
             </div>
         )}
      </div>
    </div>
  );
};
