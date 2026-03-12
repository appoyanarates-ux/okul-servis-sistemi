
import React, { useState, useMemo, useEffect } from 'react';
import { Driver, Student, AppSettings } from '../types';
import { Calendar, Search, CheckSquare, Square, Check, X as XIcon, Eye, CheckCircle, Users, XCircle, RotateCcw, FileText, Scissors, FileSpreadsheet } from 'lucide-react';
import { PrintPreview } from '../components/PrintPreview';
import * as XLSX from 'xlsx';

interface VehicleInspectionProps {
  drivers: Driver[];
  students: Student[];
  settings: AppSettings;
}

const INSPECTION_ITEMS = [
  "Aracın yaşı “Okul Servis Araçları Yönetmeliğinde” yer alan yaş şartına uygun mu?",
  "Okul servis aracı temiz, bakımlı, güvenli ve her fırsatta havalandırılmış vaziyette bulunduruluyor mu? (Okul Servis Araçları Yönetmeliği 4/1-e)",
  "Taşıma işinin gerçekleştirildiği okul servis aracı, yüklenici tarafından idareye bildirilen araç mı? (Teknik Şartname)",
  "Taşımayı gerçekleştiren şoför idareye bildirilen kişi mi? (Teknik Şartname)",
  "“Sürücü Belgesi” taşıma hizmeti veren aracın kullanımı için yeterli ve uygun mu?",
  "Aracın camları, “Okul servis araçlarının camlarının üzerine renkli film tabakaları yapıştırılması yasaktır.” hükmüne uygun mu?",
  "Aracın arkasında \"OKUL TAŞITI\" yazısını kapsayan numunesine uygun renk, ebat ve şekilde reflektif (yansıtıcı) bir kuşak var mı?",
  "En az 30 cm çapında kırmızı ışık veren bir lamba ve bu lambanın yakılması halinde üzerinde siyah renkte büyük harflerle \"DUR\" yazısı okunacak şekilde tesis edilmiş mi? (Okul Servis Araçları Yönetmeliği 4/1-b)",
  "Öğrencilerin emniyet kemeri takmaları sağlanıyor mu? (Millî Eğitim Bakanlığı Taşıma Yoluyla Eğitime Erişim Yönetmeliği 15/2-ğ)",
  "Araca taşıma kapasitesi üzerinde öğrenci/kursiyer/veli alınıyor mu? (Teknik Şartname)",
  "Taşıma merkezi okul/kurum müdürlüğünce düzenlenen ve takibi yapılan puantaj cetvelleri günlük düzenli olarak imzalanıyor mu? (Millî Eğitim Bakanlığı Taşıma Yoluyla Eğitime Erişim Yönetmeliği 15/2-e / Teknik Şartname)",
  "Şoför, temiz ve işe uygun kıyafetlerle çalışıyor mu? (Teknik Şartname)",
  "Şoför, öğrencilerin oturarak, güvenli ve rahat bir yolculuk yapmalarını sağlayacak tedbirleri alarak taahhüt ettiği şekilde valilikçe belirlenecek okul açılış ve kapanış saatlerine göre, Millî Eğitim Bakanlığınca belirlenen azami sürelere uymak suretiyle taşıyor mu? (Okul Servis Araçları Yönetmeliği 9/1-ö)",
  "Rehber personel, (özel eğitim ihtiyacı olan öğrenci varsa) temiz ve işe uygun kıyafetler ile TS EN ISO 20471 standardına uygun, sarı renkte ve üzerinde reflektif (yansıtıcı) şeritler yer alan ve ön ve arka kısmında “REHBER” yazılı ikaz yeleğini kullanıyor mu? (Okul Servis Araçları Yönetmeliği 9/2-f)",
  "Servis aracında “İlkyardım Çantası” bulunuyor mu? (Teknik Şartname)",
  "Servis aracında “Trafik Seti” bulunuyor mu? (Teknik Şartname)",
  "Servis aracında; bakımlı ve son kullanma tarihi geçmemiş yangın söndürme tüpü bulunuyor mu? (Teknik Şartname)",
  "Araçta öğrencilerin kolayca yetişebileceği camlar ve pencereler sabit mi? (Okul Servis Araçları Yönetmeliği 4/1-c)",
  "Aracın iç düzenlemesinde, varsa açıkta olan demir aksam yaralanmaya sebebiyet vermeyecek yumuşak bir madde ile kaplanmış mı? (Okul Servis Araçları Yönetmeliği 4/1-c)"
];

// --- Single Printable Page Component ---
const InspectionFormPage: React.FC<{
  driver: Driver;
  studentCount: number | string;
  totalVehicles: number | string;
  settings: AppSettings;
  answers: ('yes' | 'no' | null)[];
  extraData: { licenseInfo: string; inspectionDate: string; routeOverride: string };
  isBlankMode?: boolean;
  pageIndex: number;
  totalPages: number;
}> = ({ driver, studentCount, totalVehicles, settings, answers, extraData, isBlankMode, pageIndex, totalPages }) => {

  const formattedRoute = extraData.routeOverride || (driver?.routes ? driver.routes.join(' + ') : '');

  // Prepare Signatories List dynamically
  const signatories = [
      ...settings.vicePrincipals.map(name => ({ name, title: 'Müdür Yardımcısı' })),
      ...settings.principals.map(name => ({ name, title: 'Okul Müdürü' })),
  ];

  return (
    <div className="bg-white p-8 font-['Times_New_Roman'] text-black text-[11px] leading-tight min-h-[297mm] relative box-border">
      {/* Header */}
      <div className="text-center font-bold text-[12px] mb-4 border border-black p-2">
        <p className="uppercase">{settings.province} İLİ {settings.district} İLÇESİ {settings.schoolName} TAŞIMA</p>
        <p>YOLUYLA EĞİTİME ERİŞİM YÖNETMELİĞİ KAPSAMINDA HİZMET SUNAN</p>
        <p>OKUL SERVİS ARACI DENETİM FORMU</p>
        <p className="text-[10px]">(TAŞIMA MERKEZİ OKUL/KURUM MÜDÜRLÜĞÜNCE KULLANILACAK)</p>
      </div>

      {/* Info Table */}
      <table className="w-full mb-1 text-[11px] border-collapse border border-black">
        <tbody>
          <tr><td className="font-bold p-1 w-[25%] bg-gray-100 border border-black">ARACIN MODEL YILI</td><td className="p-1 w-[25%] text-center border border-black">{driver?.vehicleYear || ''}</td><td className="font-bold p-1 w-[25%] bg-gray-100 border border-black">TELEFON GSM</td><td className="p-1 w-[25%] text-center border border-black">{driver?.phone}</td></tr>
          <tr><td className="font-bold p-1 bg-gray-100 border border-black">ARACIN PLAKASI</td><td className="p-1 font-bold text-center border border-black">{driver?.plateNumber}</td><td className="font-bold p-1 bg-gray-100 border border-black">ÖĞRENCİ SAYISI</td><td className="p-1 text-center font-bold border border-black">{studentCount}</td></tr>
          <tr><td className="font-bold p-1 bg-gray-100 border border-black">SÜRÜCÜ BELGESİNİN ALINDIĞI YIL VE SINIFI</td><td className="p-1 text-center border border-black">{extraData.licenseInfo}</td><td className="font-bold p-1 bg-gray-100 text-[10px] border border-black">OKULA KURUMA GELEN ARAÇ SAYISI</td><td className="p-1 text-center border border-black">{totalVehicles}</td></tr>
          <tr><td className="font-bold p-1 bg-gray-100 border border-black">ŞOFÖRÜN ADI/SOYADI</td><td className="p-1 font-bold text-center border border-black">{driver?.name}</td><td className="font-bold p-1 bg-gray-100 border border-black">DENETLEME TARİHİ</td><td className="p-1 text-center border border-black">{extraData.inspectionDate}</td></tr>
          <tr><td className="font-bold p-1 bg-gray-100 border border-black">T.C.KİMLİK NO</td><td className="p-1 text-center border border-black" colSpan={3}>{driver?.tcNumber}</td></tr>
          <tr><td className="font-bold p-1 bg-gray-100 border border-black">ARACIN GÜZERGAHI</td><td className="p-1 text-[10px] text-center border border-black" colSpan={3}>{formattedRoute}</td></tr>
        </tbody>
      </table>

      {/* Checklist Table */}
      <table className="w-full text-[10px] border-collapse border border-black">
        <thead>
          <tr className="bg-gray-100 font-bold text-center"><td className="p-1 text-left border border-black">DENETLEME KONULARI</td><td className="p-1 w-10 border border-black">EVET</td><td className="p-1 w-10 border border-black">HAYIR</td><td className="p-1 w-24 border border-black">AÇIKLAMALAR</td></tr>
        </thead>
        <tbody>
          {INSPECTION_ITEMS.map((item, idx) => (
            <tr key={idx}><td className="p-1 px-2 border border-black">{item}</td><td className="border border-black text-center font-bold text-xs">{answers[idx] === 'yes' ? 'X' : ''}</td><td className="border border-black text-center font-bold text-xs">{answers[idx] === 'no' ? 'X' : ''}</td><td className="border border-black"></td></tr>
          ))}
        </tbody>
      </table>

      {/* Footer Notes */}
      <div className="border border-black border-t-0 p-2 text-[10px]">
        <p className="mb-1"><strong>Not:</strong>1) Okul servis araçları her haftanın ilk iş günü denetlenip bu form tutanak haline getirilerek ay sonu puantajları ile birlikte milli eğitim müdürlüğüne bildirilecek ve okul/kurum müdürlüğü dosyasında imzalı ve onaylı bir şekilde saklanacaktır. (bkz. Teknik Şartname)</p>
        <p>2) Çizelgede yer alan denetim maddeleri ile ilgili “Evet / Hayır” bölümü işaretlendikten sonra gerek duyulması halinde “AÇIKLAMALAR” bölümü kullanılacak.</p>
        <p className="mt-2">......./......./20......</p>

        {/* Dynamic Signatures */}
        <div className="flex flex-wrap justify-between mt-8 px-4 text-center items-end gap-y-4">
            {signatories.map((signer, idx) => (
                <div key={idx} className="flex flex-col gap-1 min-w-[120px]">
                    <div>Denetleyen</div>
                    <div className="font-bold">{signer?.name}</div>
                    <div>{signer?.title}</div>
                </div>
            ))}
        </div>
      </div>

      {/* Page Number */}
      <div className="absolute bottom-2 right-4 text-[9px] text-slate-500">
          Sayfa {pageIndex} / {totalPages}
      </div>
    </div>
  );
};

// --- Container for Bulk Printing ---
export const PrintableVehicleInspection: React.FC<{
  selectedDriverIds: string[];
  drivers: Driver[];
  students: Student[];
  settings: AppSettings;
  answersMap: Record<string, ('yes'|'no'|null)[]>;
  extraData: { licenseInfo: string; inspectionDate: string; routeOverride: string };
  isBlankMode?: boolean;
}> = ({ selectedDriverIds, drivers, students, settings, answersMap, extraData, isBlankMode }) => {

  const totalPages = isBlankMode ? 1 : selectedDriverIds.length;

  // If Blank Mode is active, render just one empty form
  if (isBlankMode) {
      return (
        <div>
            <style>{`
                @page { size: A4 portrait; margin: 10mm; }
                body { background-color: white !important; }
                .bg-gray-100 { background-color: #f3f4f6 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            `}</style>
            <InspectionFormPage
                driver={{ id: 'blank', name: '', routes: [], plateNumber: '', phone: '', tcNumber: '' } as Driver}
                studentCount={''}
                totalVehicles={''}
                settings={settings}
                answers={Array(INSPECTION_ITEMS.length).fill(null)}
                extraData={{ licenseInfo: '', inspectionDate: '', routeOverride: '' }}
                isBlankMode={true}
                pageIndex={1}
                totalPages={1}
            />
        </div>
      );
  }

  return (
    <div>
        <style>{`
            @page { size: A4 portrait; margin: 10mm; }
            body { background-color: white !important; }
            .page-break { page-break-after: always; break-after: page; }
            .bg-gray-100 { background-color: #f3f4f6 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        `}</style>
        {selectedDriverIds.map((driverId, index) => {
            const driver = drivers.find(d => d.id === driverId);
            if (!driver) return null;

            const studentCount = students.filter(s => s.driver === driver.name).length;
            const driverAnswers = answersMap[driverId] || Array(INSPECTION_ITEMS.length).fill(null);
            const isLast = index === selectedDriverIds.length - 1;

            return (
                <div key={driverId} className={!isLast ? 'page-break' : ''}>
                    <InspectionFormPage
                        driver={driver}
                        studentCount={studentCount}
                        totalVehicles={drivers.length}
                        settings={settings}
                        answers={driverAnswers}
                        extraData={extraData}
                        pageIndex={index + 1}
                        totalPages={totalPages}
                    />

                    {/* Visual Separator for Preview (Hidden in Print) */}
                    {!isLast && (
                        <div className="print:hidden flex items-center justify-center h-12 bg-slate-100 border-y border-slate-300 w-[calc(100%+2rem)] -mx-4 my-0 gap-2">
                            <Scissors size={14} className="text-slate-400 rotate-90" />
                            <div className="border-b-2 border-dashed border-slate-300 w-1/4"></div>
                            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Sonraki Sayfa ({index + 2} / {totalPages})</span>
                            <div className="border-b-2 border-dashed border-slate-300 w-1/4"></div>
                            <Scissors size={14} className="text-slate-400 -rotate-90" />
                        </div>
                    )}
                </div>
            );
        })}
    </div>
  );
};

// --- MAIN PAGE COMPONENT ---
export const VehicleInspection: React.FC<VehicleInspectionProps> = ({ drivers, students, settings }) => {
  // State
  const [selectedDriverIds, setSelectedDriverIds] = useState<Set<string>>(new Set());
  const [activeDriverId, setActiveDriverId] = useState<string | null>(null); // Currently displayed in editor
  const [answersMap, setAnswersMap] = useState<Record<string, ('yes'|'no'|null)[]>>({});

  const [searchTerm, setSearchTerm] = useState('');
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isBlankMode, setIsBlankMode] = useState(false);

  // Extra Fields
  const [licenseInfo, setLicenseInfo] = useState('');
  const [inspectionDate, setInspectionDate] = useState(new Date().toLocaleDateString('tr-TR'));
  const [routeOverride, setRouteOverride] = useState('');

  // Initial Selection
  useEffect(() => {
      if (drivers.length > 0 && !activeDriverId) {
          setActiveDriverId(drivers[0].id);
          setSelectedDriverIds(new Set([drivers[0].id]));
      }
  }, [drivers]);

  // Derived Data
  const filteredDrivers = useMemo(() => {
      return drivers.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [drivers, searchTerm]);

  const activeDriver = useMemo(() => drivers.find(d => d.id === activeDriverId), [drivers, activeDriverId]);

  const activeStudentCount = useMemo(() => {
      if (!activeDriver) return 0;
      return students.filter(s => s.driver === activeDriver.name).length;
  }, [students, activeDriver]);

  // Update Route Override when switching drivers (only if empty)
  useEffect(() => {
      if (activeDriver) {
          // Reset or keep? Let's auto-fill if not manually edited for THIS session
          // For simplicity, we just auto-fill current route
          setRouteOverride(activeDriver.routes.join(' + '));
      }
  }, [activeDriver]);

  // Handlers
  const toggleSelectDriver = (id: string) => {
      const newSet = new Set(selectedDriverIds);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      setSelectedDriverIds(newSet);
  };

  const toggleSelectAll = () => {
      if (selectedDriverIds.size === filteredDrivers.length) {
          setSelectedDriverIds(new Set());
      } else {
          setSelectedDriverIds(new Set(filteredDrivers.map(d => d.id)));
      }
  };

  const handleAnswerChange = (driverId: string, index: number, value: 'yes' | 'no') => {
      setAnswersMap(prev => {
          const currentAnswers = [...(prev[driverId] || Array(INSPECTION_ITEMS.length).fill(null))];
          currentAnswers[index] = currentAnswers[index] === value ? null : value; // Toggle
          return { ...prev, [driverId]: currentAnswers };
      });
  };

  const handleMarkAllYes = (driverId: string) => {
      setAnswersMap(prev => ({
          ...prev,
          [driverId]: Array(INSPECTION_ITEMS.length).fill('yes')
      }));
  };

  const handleMarkAllNo = (driverId: string) => {
      setAnswersMap(prev => ({
          ...prev,
          [driverId]: Array(INSPECTION_ITEMS.length).fill('no')
      }));
  };

  const handleResetAnswers = (driverId: string) => {
      setAnswersMap(prev => {
          const newMap = { ...prev };
          delete newMap[driverId]; // Remove answers for this driver
          return newMap;
      });
  };

  const openPreview = (blankMode: boolean = false) => {
      setIsBlankMode(blankMode);
      setIsPreviewing(true);
  };

  // --- EXCEL EXPORT ---
  const exportToExcel = () => {
      const driversToExport = isBlankMode
          ? [{ id: 'blank', name: '', routes: [], plateNumber: '', phone: '', tcNumber: '', vehicleYear: '', seatCount: '' } as unknown as Driver]
          : Array.from(selectedDriverIds).map(id => drivers.find(d => d.id === id)).filter(Boolean) as Driver[];

      if (driversToExport.length === 0) {
          alert("Lütfen en az bir şoför seçiniz.");
          return;
      }

      const wb = XLSX.utils.book_new();
      let allRows: any[] = [];
      let merges: any[] = [];
      let rowOffset = 0;
      let rowBreaks: number[] = [];

      driversToExport.forEach((driver, idx) => {
          const sCount = isBlankMode ? '' : students.filter(s => s.driver === driver.name).length.toString();
          const dAnswers = answersMap[driver.id] || Array(INSPECTION_ITEMS.length).fill(null);
          const routeName = routeOverride || (driver.routes ? driver.routes.join(' + ') : '');
          const totalV = isBlankMode ? '' : drivers.length.toString();

          // Header Data
          const headerRows = [
              [`${settings.province} İLİ ${settings.district} İLÇESİ ${settings.schoolName} TAŞIMA YOLUYLA EĞİTİME ERİŞİM YÖNETMELİĞİ KAPSAMINDA HİZMET SUNAN OKUL SERVİS ARACI DENETİM FORMU`, null, null, null],
              ["(TAŞIMA MERKEZİ OKUL/KURUM MÜDÜRLÜĞÜNCE KULLANILACAK)", null, null, null],
              [],
              ["ARACIN MODEL YILI", driver.vehicleYear || '', "TELEFON GSM", driver.phone || ''],
              ["ARACIN PLAKASI", driver.plateNumber || '', "ÖĞRENCİ SAYISI", sCount],
              ["SÜRÜCÜ BELGESİNİN ALINDIĞI YIL VE SINIFI", licenseInfo, "OKULA KURUMA GELEN ARAÇ SAYISI", totalV],
              ["ŞOFÖRÜN ADI/SOYADI", driver.name, "DENETLEME TARİHİ", inspectionDate],
              ["T.C.KİMLİK NO", driver.tcNumber || '', null, null],
              ["ARACIN GÜZERGAHI", routeName, null, null],
              [],
              ["DENETLEME KONULARI", "EVET", "HAYIR", "AÇIKLAMALAR"]
          ];

          // Add checklist items
          const checkListRows = INSPECTION_ITEMS.map((item, i) => ([
              item,
              dAnswers[i] === 'yes' ? 'X' : '',
              dAnswers[i] === 'no' ? 'X' : '',
              ''
          ]));

          // Add Footer
          const footerRows = [
              [],
              ["Not: 1) Okul servis araçları her haftanın ilk iş günü denetlenip bu form tutanak haline getirilerek ay sonu puantajları ile birlikte milli eğitim müdürlüğüne bildirilecek ve okul/kurum müdürlüğü dosyasında imzalı ve onaylı bir şekilde saklanacaktır. (bkz. Teknik Şartname)"],
              ["2) Çizelgede yer alan denetim maddeleri ile ilgili “Evet / Hayır” bölümü işaretlendikten sonra gerek duyulması halinde “AÇIKLAMALAR” bölümü kullanılacak."],
              [`......./......./20......`],
              [],
              ["DENETLEYEN", null, "ONAYLAYAN", null],
              [settings.vicePrincipal1 || "Müdür Yrd.", null, settings.principalName || "Okul Müdürü", null],
              [],
              [`Sayfa ${idx + 1} / ${driversToExport.length}`]
          ];

          // Calculate Merges
          // Header title merges (Rows 0, 1)
          merges.push({ s: { r: rowOffset, c: 0 }, e: { r: rowOffset, c: 3 } });
          merges.push({ s: { r: rowOffset + 1, c: 0 }, e: { r: rowOffset + 1, c: 3 } });

          // Info table merges (last two rows span columns)
          // TC Kimlik No Row: Label(Col 0), Value(Col 1-3)
          merges.push({ s: { r: rowOffset + 7, c: 1 }, e: { r: rowOffset + 7, c: 3 } });
          // Route Row: Label(Col 0), Value(Col 1-3)
          merges.push({ s: { r: rowOffset + 8, c: 1 }, e: { r: rowOffset + 8, c: 3 } });

          // Footer text merges
          // Note 1
          merges.push({ s: { r: rowOffset + 10 + checkListRows.length + 1, c: 0 }, e: { r: rowOffset + 10 + checkListRows.length + 1, c: 3 } });
          // Note 2
          merges.push({ s: { r: rowOffset + 10 + checkListRows.length + 2, c: 0 }, e: { r: rowOffset + 10 + checkListRows.length + 2, c: 3 } });
          // Page Number
          merges.push({ s: { r: rowOffset + 10 + checkListRows.length + 8, c: 0 }, e: { r: rowOffset + 10 + checkListRows.length + 8, c: 3 } });

          // Combine rows
          const driverRows = [...headerRows, ...checkListRows, ...footerRows];
          allRows.push(...driverRows);

          // Update Offset for next driver
          rowOffset += driverRows.length;

          // Add Page Break (Row Index) - Don't add for the last one
          if (idx < driversToExport.length - 1) {
              rowBreaks.push(rowOffset); // SheetJS uses 0-based index for row breaks
              // Add visible empty rows as spacer if needed, but rowBreak handles printing logic
              allRows.push([]);
              rowOffset++;
          }
      });

      const ws = XLSX.utils.aoa_to_sheet(allRows);

      // Set Column Widths (A=Wide, B=Small, C=Small, D=Medium)
      ws['!cols'] = [
          { wch: 80 }, // Question (Wider)
          { wch: 8 },  // Yes
          { wch: 8 },  // No
          { wch: 25 }  // Notes
      ];

      // Apply Merges
      ws['!merges'] = merges;

      // Apply Page Breaks
      if (rowBreaks.length > 0) {
          ws['!rowbreaks'] = rowBreaks.map(r => ({ id: r })); // Correct format for SheetJS
      }

      // Page Setup for Printing
      ws['!pageSetup'] = { paperSize: 9, orientation: 'portrait', scale: 100 }; // 9 = A4

      XLSX.utils.book_append_sheet(wb, ws, "Denetim Formları");
      XLSX.writeFile(wb, "Arac_Denetim_Formlari.xlsx");
  };

  return (
    <div className="h-[calc(100vh-theme(spacing.24))] flex flex-col animate-fade-in">
      {isPreviewing && (
        <PrintPreview
          title={isBlankMode ? "Araç Denetim Formu (Boş Şablon - 1 Sayfa)" : `Araç Denetim Formları (Toplam ${selectedDriverIds.size} Sayfa)`}
          onBack={() => setIsPreviewing(false)}
          orientation="portrait"
        >
          <PrintableVehicleInspection
            selectedDriverIds={Array.from(selectedDriverIds)}
            drivers={drivers}
            students={students}
            settings={settings}
            answersMap={answersMap}
            extraData={{ licenseInfo, inspectionDate, routeOverride }}
            isBlankMode={isBlankMode}
          />
        </PrintPreview>
      )}

      {/* Toolbar */}
      <div className="bg-white border-b border-slate-200 p-4 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
          <div>
              <h1 className="text-xl font-bold text-slate-800">Araç Denetim Formu</h1>
              <p className="text-xs text-slate-500">Seçili şoförler için denetim formu oluşturun ve yazdırın.</p>
          </div>

          <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 text-blue-800 text-sm">
                  <span className="font-bold">{selectedDriverIds.size}</span>
                  <span className="text-xs">Şoför Seçildi</span>
              </div>

              <button
                  onClick={exportToExcel}
                  disabled={selectedDriverIds.size === 0 && !isBlankMode}
                  className="flex items-center gap-2 bg-green-50 text-green-700 border border-green-200 px-3 py-2 rounded-lg hover:bg-green-100 shadow-sm font-medium transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Excel İndir (A4 Uyumlu)"
              >
                  <FileSpreadsheet size={18} />
                  Excel
              </button>

              <button
                  onClick={() => openPreview(true)}
                  className="flex items-center gap-2 bg-white text-slate-600 border border-slate-300 px-3 py-2 rounded-lg hover:bg-slate-50 shadow-sm font-medium transition-colors text-sm"
                  title="Elle doldurmak için boş form yazdır"
              >
                  <FileText size={16} />
                  Boş Şablon
              </button>

              <button
                  onClick={() => openPreview(false)}
                  disabled={selectedDriverIds.size === 0}
                  className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm font-medium transition-colors text-sm"
              >
                  <Eye size={18} />
                  Önizle ve Yazdır
              </button>
          </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
          {/* Sidebar: Driver List */}
          <div className="w-80 bg-white border-r border-slate-200 flex flex-col shrink-0">
              <div className="p-3 border-b border-slate-100">
                  <div className="relative">
                      <input
                        type="text"
                        placeholder="Şoför Ara..."
                        className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      <Search className="absolute left-2.5 top-2.5 text-slate-400" size={14} />
                  </div>
                  <div className="flex justify-between items-center mt-3 px-1">
                      <button onClick={toggleSelectAll} className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
                          {selectedDriverIds.size === filteredDrivers.length ? <CheckSquare size={14} /> : <Square size={14} />}
                          Tümünü Seç
                      </button>
                      <span className="text-xs text-slate-400">{filteredDrivers.length} Kişi</span>
                  </div>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                  {filteredDrivers.map(driver => {
                      const isSelected = selectedDriverIds.has(driver.id);
                      const isActive = activeDriverId === driver.id;
                      const hasAnswers = answersMap[driver.id]?.some(a => a !== null);

                      return (
                          <div
                              key={driver.id}
                              className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer border transition-all ${isActive ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200' : 'bg-white border-transparent hover:bg-slate-50'}`}
                              onClick={() => setActiveDriverId(driver.id)}
                          >
                              <div
                                onClick={(e) => { e.stopPropagation(); toggleSelectDriver(driver.id); }}
                                className={`shrink-0 text-slate-400 hover:text-blue-600 p-1 rounded-md transition-colors ${isSelected ? 'text-blue-600' : ''}`}
                              >
                                  {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                              </div>
                              <div className="flex-1 min-w-0">
                                  <div className="flex justify-between items-center">
                                      <span className={`text-sm font-medium truncate ${isActive ? 'text-blue-800' : 'text-slate-700'}`}>{driver.name}</span>
                                      {hasAnswers && <CheckCircle size={12} className="text-green-500" />}
                                  </div>
                                  <div className="text-[10px] text-slate-500 truncate">{driver.plateNumber}</div>
                              </div>
                          </div>
                      );
                  })}
              </div>
          </div>

          {/* Main Content: Interactive Form */}
          <div className="flex-1 bg-slate-50 overflow-y-auto p-4 md:p-8 custom-scrollbar">
              {activeDriver ? (
                  <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                      {/* Form Header / Metadata Controls */}
                      <div className="bg-slate-100 p-4 border-b border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Denetim Tarihi</label>
                              <div className="relative">
                                  <input type="text" className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none" value={inspectionDate} onChange={(e) => setInspectionDate(e.target.value)} />
                                  <Calendar className="absolute left-2.5 top-2 text-slate-400" size={14} />
                              </div>
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Ehliyet Bilgisi</label>
                              <input type="text" placeholder="Yıl / Sınıf" className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none" value={licenseInfo} onChange={(e) => setLicenseInfo(e.target.value)} />
                          </div>
                          <div className="flex flex-col gap-2 justify-end">
                              <label className="block text-xs font-bold text-slate-500 uppercase">Toplu İşlemler</label>
                              <div className="flex gap-2">
                                <button onClick={() => handleMarkAllYes(activeDriver.id)} className="flex-1 py-1.5 bg-green-100 text-green-700 hover:bg-green-200 rounded border border-green-200 text-xs font-bold transition-colors flex items-center justify-center gap-1" title="Tümünü Evet İşaretle">
                                    <CheckCircle size={14} /> Evet
                                </button>
                                <button onClick={() => handleMarkAllNo(activeDriver.id)} className="flex-1 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded border border-red-200 text-xs font-bold transition-colors flex items-center justify-center gap-1" title="Tümünü Hayır İşaretle">
                                    <XCircle size={14} /> Hayır
                                </button>
                                <button onClick={() => handleResetAnswers(activeDriver.id)} className="py-1.5 px-3 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded border border-slate-200 text-xs font-bold transition-colors" title="Seçimleri Temizle">
                                    <RotateCcw size={14} />
                                </button>
                              </div>
                          </div>
                          <div className="md:col-span-3">
                              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Görüntülenecek Güzergah</label>
                              <input type="text" className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none" value={routeOverride} onChange={(e) => setRouteOverride(e.target.value)} />
                          </div>
                      </div>

                      {/* Interactive Checklist */}
                      <div className="p-6">
                          <div className="flex justify-between items-end mb-6 border-b border-slate-100 pb-4">
                              <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold text-xl">
                                      {activeDriver.name.charAt(0)}
                                  </div>
                                  <div>
                                      <h2 className="text-lg font-bold text-slate-800">{activeDriver.name}</h2>
                                      <div className="flex gap-3 text-xs text-slate-500 mt-1">
                                          <span className="bg-slate-100 px-2 py-0.5 rounded">{activeDriver.plateNumber}</span>
                                          <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{activeStudentCount} Öğrenci</span>
                                      </div>
                                  </div>
                              </div>
                              <div className="text-right">
                                  <div className="text-xs text-slate-400">Durum</div>
                                  <div className="font-bold text-slate-700">
                                      {(answersMap[activeDriver.id]?.filter(a => a === 'yes').length || 0)} / {INSPECTION_ITEMS.length} Uygun
                                  </div>
                              </div>
                          </div>

                          <div className="space-y-1">
                              {INSPECTION_ITEMS.map((item, idx) => {
                                  const currentAnswer = answersMap[activeDriver.id]?.[idx];
                                  return (
                                      <div key={idx} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg group transition-colors border border-transparent hover:border-slate-100">
                                          <div className="flex-1 text-sm text-slate-700 pr-4">
                                              <span className="font-bold text-slate-400 mr-2">{idx + 1}.</span>
                                              {item}
                                          </div>
                                          <div className="flex items-center gap-2 shrink-0">
                                              <button
                                                  onClick={() => handleAnswerChange(activeDriver.id, idx, 'yes')}
                                                  className={`flex items-center gap-1 px-3 py-1.5 rounded-md border transition-all ${currentAnswer === 'yes' ? 'bg-green-600 text-white border-green-600 shadow-sm' : 'bg-white text-slate-400 border-slate-200 hover:border-green-300 hover:text-green-600'}`}
                                              >
                                                  <Check size={16} />
                                                  <span className="text-xs font-bold">EVET</span>
                                              </button>
                                              <button
                                                  onClick={() => handleAnswerChange(activeDriver.id, idx, 'no')}
                                                  className={`flex items-center gap-1 px-3 py-1.5 rounded-md border transition-all ${currentAnswer === 'no' ? 'bg-red-600 text-white border-red-600 shadow-sm' : 'bg-white text-slate-400 border-slate-200 hover:border-red-300 hover:text-red-600'}`}
                                              >
                                                  <XIcon size={16} />
                                                  <span className="text-xs font-bold">HAYIR</span>
                                              </button>
                                          </div>
                                      </div>
                                  );
                              })}
                          </div>
                      </div>
                  </div>
              ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400">
                      <Users size={64} className="mb-4 opacity-20" />
                      <p>İşlem yapmak için soldaki listeden bir şoför seçiniz.</p>
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};
