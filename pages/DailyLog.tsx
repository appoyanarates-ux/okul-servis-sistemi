
import React, { useState, useMemo } from 'react';
import { Driver, AppSettings } from '../types';
import { FileSpreadsheet, Plus, Minus } from 'lucide-react';
import * as XLSX from 'xlsx';

interface DailyLogProps {
  drivers: Driver[];
  settings: AppSettings;
}

export const PrintableDailyLog: React.FC<{ drivers: Driver[]; weekDates: string[]; settings: AppSettings; orientation?: 'portrait' | 'landscape'; }> = ({ drivers, weekDates, settings, orientation = 'landscape' }) => {
  const [signatureHeight, setSignatureHeight] = useState(40);
  const [nameFontSize, setNameFontSize] = useState(9);

  return (
    <div className="bg-white p-2 font-sans">
      <style>{`
        @page { size: ${orientation}; margin: 5mm; }
        body { background-color: white !important; }
        .vertical-text-header { writing-mode: vertical-lr; transform: rotate(180deg); white-space: nowrap; height: 60px; text-align: center; margin: 0 auto; display: block; }
        .dotted-line { border-bottom-style: dotted !important; border-color: #000 !important; }
        table, th, td { border: 1px solid black !important; border-collapse: collapse !important; }
        .break-inside-avoid { page-break-inside: avoid; }
        @media print {
            .no-print { display: none !important; }
        }
      `}</style>
      <div className="no-print mb-4 flex flex-wrap items-center justify-center gap-4 bg-slate-50 p-2 rounded border border-slate-200">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-600">İmza Alanı Yüksekliği:</span>
          <button onClick={() => setSignatureHeight(h => Math.max(20, h - 5))} className="p-1 hover:bg-slate-200 rounded text-slate-600"><Minus size={14} /></button>
          <span className="text-xs w-8 text-center font-mono">{signatureHeight}px</span>
          <button onClick={() => setSignatureHeight(h => Math.min(150, h + 5))} className="p-1 hover:bg-slate-200 rounded text-slate-600"><Plus size={14} /></button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-600">İsim Yazı Boyutu:</span>
          <button onClick={() => setNameFontSize(s => Math.max(6, s - 1))} className="p-1 hover:bg-slate-200 rounded text-slate-600"><Minus size={14} /></button>
          <span className="text-xs w-8 text-center font-mono">{nameFontSize}px</span>
          <button onClick={() => setNameFontSize(s => Math.min(16, s + 1))} className="p-1 hover:bg-slate-200 rounded text-slate-600"><Plus size={14} /></button>
        </div>
      </div>

      <div className="text-center mb-2">
        <h2 className="font-bold text-base uppercase">{settings.schoolName} GÜNLÜK İMZA ÇİZELGESİ</h2>
      </div>
      <table className="w-full border-collapse border border-black text-[9px] text-center leading-tight">
        <thead>
          <tr><th className="p-[1px]" rowSpan={2} style={{ width: '25px' }}>NO</th><th className="p-[1px]" rowSpan={2} style={{ width: '140px' }}>ADI SOYADI</th><th className="p-[1px]" rowSpan={2} style={{ width: '70px' }}>ARAÇ PLAKASI</th><th className="p-[1px] h-20 w-6" rowSpan={2}><div className="vertical-text-header">İLK OKUL</div></th><th className="p-[1px] h-20 w-6" rowSpan={2}><div className="vertical-text-header">ORTA OKUL</div></th>{weekDates.map((date, index) => (
            <th key={index} colSpan={4} className="p-[1px] bg-slate-50 font-bold text-[9px]">{date}</th>
          ))}</tr>
          <tr>{weekDates.map((_, index) => (
            <React.Fragment key={index}><th className="p-[1px] h-24 w-5 font-normal"><div className="vertical-text-header">TESLİM ALINAN</div></th><th className="p-[1px] h-24 w-5 font-normal"><div className="vertical-text-header">TESLİM EDİLEN</div></th><th className="p-[1px] w-14 font-bold text-[8px]">ŞOFÖR İMZA SABAH</th><th className="p-[1px] w-14 font-bold text-[8px]">ŞOFÖR İMZA AKŞAM</th></React.Fragment>
          ))}</tr>
        </thead>
        <tbody>
          {drivers.map((driver, index) => (
            <tr key={driver.id} className="h-8"><td className="font-bold p-[1px]">{index + 1}</td><td className="font-bold px-1 whitespace-nowrap text-left p-[1px]">{driver.name}</td><td className="font-bold whitespace-nowrap p-[1px]">{driver.plateNumber || '-'}</td><td></td><td></td>{Array.from({ length: 5 }).map((_, i) => (<React.Fragment key={i}><td /><td /><td /><td /></React.Fragment>))}</tr>
          ))}
          <tr><td colSpan={3 + 2 + (5 * 4)} className="h-2 bg-slate-100"></td></tr>
          <tr className="h-8"><td className="text-right pr-2 font-bold" colSpan={3}>TOPLAM</td><td className="bg-slate-200" colSpan={2}></td>{weekDates.map((_, i) => {
            const teachers = (settings.dutyTeachers[i] || '').split(/[\n,]/).map(t => t.trim()).filter(t => t);
            const displayTeachers = teachers.length > 0 ? teachers : [];

            return (
              <td key={i} colSpan={4} className="text-center align-middle p-0">
                {displayTeachers.length > 0 ? (
                  <div className="flex flex-col w-full h-full">
                    {displayTeachers.map((teacher, idx) => (
                      <div key={idx} className={`flex flex-col w-full ${idx > 0 ? 'border-t border-black' : ''}`}>
                        <div style={{ fontSize: `${nameFontSize}px` }} className="font-bold leading-tight py-1 px-1 whitespace-normal break-words">{teacher}</div>
                        <div style={{ height: `${signatureHeight}px` }} className="relative w-full flex items-center justify-center">
                          {settings.teacherSignatures?.[teacher] ? (
                            <img src={settings.teacherSignatures[teacher]} alt="İmza" className="max-h-full max-w-full object-contain" />
                          ) : (
                            // Boş imza alanı
                            <div className="w-full h-full"></div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-2">
                    <div className="text-[8px] text-slate-300">Nöbetçi</div>
                  </div>
                )}
              </td>
            )
          })}</tr>
        </tbody>
      </table>

      {/* İmza Bloğu - Compact Version */}
      <div className="mt-2 flex justify-around items-start text-[9px] text-center break-inside-avoid px-2 page-break-inside-avoid">
        {/* Müdür Yardımcıları (Varsa) */}
        {settings.vicePrincipal1 && (
          <div className="flex flex-col gap-6 min-w-[100px]">
            <div className="font-bold">KONTROL EDEN</div>
            <div className="flex flex-col">
              <span className="font-bold">{settings.vicePrincipal1}</span>
              <span>Müdür Yardımcısı</span>
            </div>
          </div>
        )}

        {settings.vicePrincipal2 && (
          <div className="flex flex-col gap-6 min-w-[100px]">
            <div className="font-bold">KONTROL EDEN</div>
            <div className="flex flex-col">
              <span className="font-bold">{settings.vicePrincipal2}</span>
              <span>Müdür Yardımcısı</span>
            </div>
          </div>
        )}

        {/* Okul Müdürü */}
        <div className="flex flex-col gap-6 min-w-[100px]">
          <div className="font-bold">TASDİK OLUNUR</div>
          <div className="flex flex-col">
            <span className="font-bold">{settings.principalName}</span>
            <span>Okul Müdürü</span>
          </div>
        </div>

        {/* 2. Okul Müdürü (Varsa) */}
        {settings.principalName2 && (
          <div className="flex flex-col gap-6 min-w-[100px]">
            <div className="font-bold">TASDİK OLUNUR</div>
            <div className="flex flex-col">
              <span className="font-bold">{settings.principalName2}</span>
              <span>Okul Müdürü</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


export const DailyLog: React.FC<DailyLogProps> = ({ drivers, settings }) => {
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(today.setDate(diff)).toISOString().split('T')[0];
  });

  const weekDates = useMemo(() => {
    const dates = [];
    const current = new Date(startDate);
    for (let i = 0; i < 5; i++) {
      const d = new Date(current);
      d.setDate(current.getDate() + i);
      dates.push(d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' }));
    }
    return dates;
  }, [startDate]);

  const exportToExcel = () => {
    const headerRow1 = ['NO', 'ADI SOYADI', 'ARAÇ PLAKASI', 'İLKOKUL', 'ORTAOKUL'];
    const headerRow2 = ['', '', '', '', ''];
    weekDates.forEach(date => { headerRow1.push(date, '', '', ''); headerRow2.push('TESLİM ALINAN', 'TESLİM EDİLEN', 'SABAH İMZA', 'AKŞAM İMZA'); });
    const dataRows = drivers.map((driver, index) => { const row = [(index + 1).toString(), driver.name, driver.plateNumber || '', '', '']; for (let i = 0; i < 20; i++) row.push(''); return row; });
    const footerRow = ["", "", "TOPLAM", "", ""];

    // Add duty teachers to footer row in Excel
    settings.dutyTeachers.forEach((teachers, idx) => {
      const teacherStr = teachers.replace(/\n/g, ', ');
      footerRow.push(teacherStr || 'Nöbetçi Öğretmen', '', '', '');
    });

    const allData = [headerRow1, headerRow2, ...dataRows, footerRow];
    const worksheet = XLSX.utils.aoa_to_sheet(allData);
    const merges = [{ s: { r: 0, c: 0 }, e: { r: 1, c: 0 } }, { s: { r: 0, c: 1 }, e: { r: 1, c: 1 } }, { s: { r: 0, c: 2 }, e: { r: 1, c: 2 } }, { s: { r: 0, c: 3 }, e: { r: 1, c: 3 } }, { s: { r: 0, c: 4 }, e: { r: 1, c: 4 } },];
    for (let i = 0; i < 5; i++) { const startCol = 5 + (i * 4); merges.push({ s: { r: 0, c: startCol }, e: { r: 0, c: startCol + 3 } }); }
    worksheet['!merges'] = merges;
    const cols = [{ wch: 4 }, { wch: 20 }, { wch: 12 }, { wch: 4 }, { wch: 4 },];
    for (let i = 0; i < 20; i++) cols.push({ wch: 8 });
    worksheet['!cols'] = cols;
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Gunluk_Imza_Cizelgesi");
    XLSX.writeFile(workbook, `Gunluk_Imza_Formu_${startDate}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col xl:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-4 w-full xl:w-auto">
          <div className="w-full">
            <label className="block text-sm font-medium text-slate-700 mb-1">Hafta Başlangıç Tarihi (Pazartesi)</label>
            <input type="date" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
        </div>
        <div className="flex items-center gap-2 w-full xl:w-auto justify-end">
          <button onClick={exportToExcel} className="flex items-center space-x-2 bg-green-50 text-green-700 hover:bg-green-100 px-3 py-2 rounded-lg transition-colors font-medium border border-green-200" type="button"><FileSpreadsheet size={16} /><span className="hidden sm:inline">Excel</span></button>
          <p className="text-sm text-slate-500">Raporlar sayfasından Word/PDF çıktısı alabilirsiniz.</p>
        </div>
      </div>

      <div className="text-center text-xs text-slate-500 bg-blue-50 p-2 rounded border border-blue-100">
        <span className="font-bold">Bilgi:</span> Raporlar sayfasından PDF olarak kaydederken "Yatay" (Landscape) seçeneğini işaretleyiniz.
      </div>

      <div className="overflow-x-auto bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <PrintableDailyLog drivers={drivers} weekDates={weekDates} settings={settings} />
      </div>
    </div>
  );
};
