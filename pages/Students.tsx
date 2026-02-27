
import React, { useState, useMemo, useRef } from 'react';
import { Student, AppSettings, Driver } from '../types';
import { Search, Plus, Edit, Trash2, X, Filter, Printer, FileText, ArrowRightLeft, CheckSquare, Square, Download, MapPin, Route, User, Users, Bus, GraduationCap, School } from 'lucide-react';
import { PrintPreview } from '../components/PrintPreview';

// Globals for html2pdf
declare var html2pdf: any;

interface StudentsProps {
  students: Student[];
  drivers: Driver[];
  onDelete: (id: string) => void;
  onBulkDelete: (ids: string[]) => void;
  onUpdate: (student: Student) => void;
  onAdd: (student: Student) => void;
  settings: AppSettings;
  onUpdateSettings?: (settings: AppSettings) => void;
}

// Helper for initials
const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
};

export const PrintableStudentList: React.FC<{
  students: Student[];
  classFilter: string;
  routeFilter: string;
  orientation?: 'portrait' | 'landscape';
}> = ({ students, classFilter, routeFilter, orientation = 'portrait' }) => {
  return (
    <div className="bg-white p-4 font-sans text-black">
      <style>{`
        @page { size: ${orientation}; margin: 5mm; }
        body { background-color: white !important; }
        table, th, td { border: 1px solid black !important; border-collapse: collapse !important; }
      `}</style>
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold">ÖĞRENCİ LİSTESİ</h2>
        <div className="flex justify-center gap-4 text-sm mt-1">
          {classFilter !== 'all' && <span>Sınıf: <strong>{classFilter}</strong></span>}
          {routeFilter !== 'all' && <span>Güzergah: <strong>{routeFilter}</strong></span>}
        </div>
      </div>
      <table className="w-full text-xs text-center">
        <thead>
          <tr className="bg-slate-100 font-bold">
            <th className="p-1 w-8">S.No</th>
            <th className="p-1 w-16">Okul No</th>
            <th className="p-1 text-left">Adı Soyadı</th>
            <th className="p-1 text-left">Okul</th>
            <th className="p-1 w-16">Sınıf</th>
            <th className="p-1 w-16">Cinsiyet</th>
            <th className="p-1">Köy / Mahalle</th>
            <th className="p-1">Güzergah</th>
            <th className="p-1">Şoför</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student, index) => (
            <tr key={student.id}>
              <td className="p-1 font-bold">{index + 1}</td>
              <td className="p-1">{student.studentNumber || ''}</td>
              <td className="p-1 text-left">{student.name}</td>
              <td className="p-1 text-left">{student.schoolName}</td>
              <td className="p-1">{student.className}</td>
              <td className="p-1">{student.gender}</td>
              <td className="p-1">{student.village}</td>
              <td className="p-1">{student.route}</td>
              <td className="p-1">{student.driver}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const Students: React.FC<StudentsProps> = ({ students, drivers, onDelete, onBulkDelete, onUpdate, onAdd, settings, onUpdateSettings }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filters
  const [classFilter, setClassFilter] = useState('all');
  const [routeFilter, setRouteFilter] = useState('all');

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [isDownloading, setIsDownloading] = useState(false);
  const hiddenPrintRef = useRef<HTMLDivElement>(null);

  // New student state
  const [newStudent, setNewStudent] = useState<Partial<Student>>({
    schoolName: settings.schoolName,
    className: '',
    gender: 'KIZ',
    route: '',
    village: '',
    driver: '',
    studentNumber: '',
    sn: 0
  });

  // Stats Calculation
  const stats = useMemo(() => {
    const total = students.length;
    const girls = students.filter(s => s.gender === 'KIZ').length;
    const boys = students.filter(s => s.gender === 'ERKEK').length;
    const transported = students.filter(s => s.route).length;
    return [
      { label: 'Toplam Öğrenci', value: total, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
      { label: 'Kız Öğrenci', value: girls, icon: User, color: 'text-pink-600', bg: 'bg-pink-50' },
      { label: 'Erkek Öğrenci', value: boys, icon: User, color: 'text-indigo-600', bg: 'bg-indigo-50' },
      { label: 'Taşımalı', value: transported, icon: Bus, color: 'text-orange-600', bg: 'bg-orange-50' },
    ];
  }, [students]);

  // Extract unique values for filters and autocomplete
  const uniqueClasses = useMemo(() => Array.from(new Set(students.map(s => s.className).filter(Boolean))).sort(), [students]);
  const uniqueRoutes = useMemo(() => {
    const routes = new Set(students.map(s => s.route).filter(Boolean));
    // Add routes from drivers prop as well
    drivers.forEach(d => d.routes.forEach(r => routes.add(r)));
    return Array.from(routes).sort();
  }, [students, drivers]);
  const uniqueVillages = useMemo(() => Array.from(new Set(students.map(s => s.village).filter(Boolean))).sort(), [students]);
  const uniqueDrivers = useMemo(() => drivers.map(d => d.name).sort(), [drivers]);

  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchesSearch =
        student.name.toLocaleLowerCase('tr-TR').includes(searchTerm.toLocaleLowerCase('tr-TR')) ||
        student.className.toLocaleLowerCase('tr-TR').includes(searchTerm.toLocaleLowerCase('tr-TR')) ||
        student.village.toLocaleLowerCase('tr-TR').includes(searchTerm.toLocaleLowerCase('tr-TR')) ||
        (student.driver && student.driver.toLocaleLowerCase('tr-TR').includes(searchTerm.toLocaleLowerCase('tr-TR'))) ||
        (student.studentNumber && student.studentNumber.includes(searchTerm));

      const matchesClass = classFilter === 'all' || student.className === classFilter;
      const matchesRoute = routeFilter === 'all' || student.route === routeFilter;

      return matchesSearch && matchesClass && matchesRoute;
    }).sort((a, b) => a.name.localeCompare(b.name, 'tr-TR'));
  }, [students, searchTerm, classFilter, routeFilter]);

  // Selection Logic
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredStudents.length && filteredStudents.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredStudents.map(s => s.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkDeleteClick = () => {
    if (selectedIds.size === 0) return;
    if (window.confirm(`${selectedIds.size} adet öğrenci kaydını silmek istediğinize emin misiniz?`)) {
      onBulkDelete(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  };

  const handleDeleteClick = (student: Student, e: React.MouseEvent) => {
    if (window.confirm(`${student.name} isimli öğrenciyi silmek istediğinize emin misiniz?`)) {
      onDelete(student.id);
    }
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStudent) {
      onUpdate(editingStudent);
      setEditingStudent(null);
    }
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newStudent.name && newStudent.className) {
      const studentToAdd: Student = {
        id: `s-${Date.now()}`,
        sn: students.length + 1,
        schoolName: newStudent.schoolName || settings.schoolName,
        name: newStudent.name,
        className: newStudent.className,
        gender: (newStudent.gender as any) || 'KIZ',
        village: newStudent.village || '',
        route: newStudent.route || '',
        driver: newStudent.driver || '',
        studentNumber: newStudent.studentNumber || ''
      };
      onAdd(studentToAdd);
      setIsAddModalOpen(false);
      setNewStudent({
        schoolName: settings.schoolName,
        className: '',
        gender: 'KIZ',
        route: '',
        village: '',
        driver: '',
        studentNumber: '',
        sn: 0
      });
    }
  };

  const handleDownloadPDF = () => {
    if (!hiddenPrintRef.current) return;
    setIsDownloading(true);

    const element = hiddenPrintRef.current;
    const opt = {
      margin: 5,
      filename: 'Ogrenci_Listesi.pdf',
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
    <div className="space-y-8 animate-fade-in">
      {isPreviewing && (
        <PrintPreview
          title="Öğrenci Listesi"
          onBack={() => setIsPreviewing(false)}
          orientation={orientation}
        >
          <PrintableStudentList
            students={filteredStudents}
            classFilter={classFilter}
            routeFilter={routeFilter}
            orientation={orientation}
          />
        </PrintPreview>
      )}

      {/* Hidden for PDF generation */}
      <div className="hidden">
        <div ref={hiddenPrintRef}>
          <PrintableStudentList
            students={filteredStudents}
            classFilter={classFilter}
            routeFilter={routeFilter}
            orientation={orientation}
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <div>
              <div className="text-slate-500 text-xs font-medium uppercase tracking-wide">{stat.label}</div>
              <div className="text-2xl font-bold text-slate-800">{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Header & Controls */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Öğrenci Yönetimi</h1>
            <p className="text-slate-500 text-sm mt-1">
              Toplam <strong className="text-slate-900">{students.length}</strong> öğrenciden <strong className="text-blue-600">{filteredStudents.length}</strong> tanesi görüntüleniyor
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {selectedIds.size > 0 && (
              <button
                onClick={handleBulkDeleteClick}
                className="flex items-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition-colors font-medium animate-fade-in"
              >
                <Trash2 size={18} />
                <span>{selectedIds.size} Sil</span>
              </button>
            )}

            <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
              <button onClick={() => setOrientation('portrait')} className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${orientation === 'portrait' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}><FileText size={14} /> Dikey</button>
              <button onClick={() => setOrientation('landscape')} className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${orientation === 'landscape' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}><ArrowRightLeft size={14} /> Yatay</button>
            </div>

            <div className="h-8 w-px bg-slate-200 mx-1 hidden md:block"></div>

            <button onClick={() => setIsPreviewing(true)} className="flex items-center gap-2 px-4 py-2.5 bg-white text-slate-700 hover:bg-slate-50 hover:text-blue-600 rounded-xl border border-slate-200 transition-all font-medium shadow-sm group">
              <Printer size={18} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
              <span>Yazdır</span>
            </button>

            <button onClick={handleDownloadPDF} disabled={isDownloading} className="flex items-center gap-2 px-4 py-2.5 bg-white text-slate-700 hover:bg-slate-50 hover:text-red-600 rounded-xl border border-slate-200 transition-all font-medium shadow-sm group">
              <Download size={18} className="text-slate-400 group-hover:text-red-600 transition-colors" />
              <span>PDF</span>
            </button>

            <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200 transition-all font-medium shadow-md active:scale-95">
              <Plus size={20} />
              <span>Yeni Öğrenci</span>
            </button>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-2 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-3.5 text-slate-400 pointer-events-none" size={18} />
            <input
              type="text"
              placeholder="Öğrenci adı, numara, köy veya şoför ara..."
              className="w-full pl-11 pr-4 py-3 bg-transparent rounded-xl text-sm focus:bg-slate-50 outline-none transition-colors placeholder:text-slate-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto p-1">
            <div className="h-8 w-px bg-slate-200 hidden md:block mx-2"></div>

            <div className="relative group">
              <select
                className="appearance-none w-full md:w-48 pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none cursor-pointer hover:bg-white transition-colors"
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
              >
                <option value="all">Tüm Sınıflar</option>
                {uniqueClasses.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <Filter size={14} className="absolute right-3 top-3.5 text-slate-400 pointer-events-none" />
            </div>

            <div className="relative group">
              <select
                className="appearance-none w-full md:w-56 pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none cursor-pointer hover:bg-white transition-colors"
                value={routeFilter}
                onChange={(e) => setRouteFilter(e.target.value)}
              >
                <option value="all">Tüm Güzergahlar</option>
                {uniqueRoutes.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <Route size={14} className="absolute right-3 top-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Student List Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <th className="px-4 py-4 w-12 text-center">
                  <button onClick={toggleSelectAll} className="flex items-center justify-center text-slate-400 hover:text-blue-600 transition-colors">
                    {selectedIds.size > 0 && selectedIds.size === filteredStudents.length ? <CheckSquare size={20} className="text-blue-600" /> : <Square size={20} />}
                  </button>
                </th>
                <th className="px-6 py-4">Öğrenci Bilgileri</th>
                <th className="px-6 py-4">Eğitim Durumu</th>
                <th className="px-6 py-4">Ulaşım Detayları</th>
                <th className="px-6 py-4 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length > 0 ? (filteredStudents.map((student, index) => {
                const isSelected = selectedIds.has(student.id);
                return (
                  <tr key={student.id} className={`group transition-all duration-200 ${isSelected ? 'bg-blue-50/40' : 'hover:bg-slate-50/60'}`}>
                    <td className="px-4 py-4 text-center">
                      <button onClick={() => toggleSelect(student.id)} className="flex items-center justify-center text-slate-300 hover:text-blue-600 transition-colors">
                        {isSelected ? <CheckSquare size={20} className="text-blue-600" /> : <Square size={20} />}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold shrink-0 shadow-sm border-2 border-white ${student.gender === 'KIZ' ? 'bg-gradient-to-br from-pink-100 to-pink-50 text-pink-600' : 'bg-gradient-to-br from-blue-100 to-blue-50 text-blue-600'}`}>
                          {getInitials(student.name)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 text-base">{student.name}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">#{student.sn}</span>
                            {student.studentNumber && <span className="text-xs text-slate-500">No: {student.studentNumber}</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wide border ${student.schoolName.includes('Ortaokul') ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-orange-50 text-orange-700 border-orange-100'}`}>
                            {student.schoolName.includes('Ortaokul') ? 'ORTAOKUL' : 'İLKOKUL'}
                          </span>
                          <span className="text-sm font-semibold text-slate-700">{student.className}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <School size={12} className="text-slate-400" />
                          {student.schoolName}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                          <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                            <MapPin size={12} />
                          </div>
                          <span className="font-medium">{student.village || '-'}</span>
                        </div>
                        <div className="flex items-center gap-3 pl-1">
                          <div className="flex items-center gap-1.5 text-xs text-slate-500" title={`Güzergah: ${student.route}`}>
                            <Route size={12} className="text-slate-400" />
                            <span className="truncate max-w-[120px]">{student.route || 'Yok'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500" title={`Şoför: ${student.driver}`}>
                            <User size={12} className="text-slate-400" />
                            <span className="truncate max-w-[100px]">{student.driver || 'Yok'}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                        <button type="button" onClick={() => setEditingStudent(student)} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Düzenle">
                          <Edit size={18} />
                        </button>
                        <button type="button" onClick={(e) => handleDeleteClick(student, e)} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Sil">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })) : (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <Search size={32} className="text-slate-300" />
                      </div>
                      <p className="text-lg font-medium text-slate-600">Öğrenci bulunamadı</p>
                      <p className="text-sm mt-1">Arama kriterlerinizi değiştirerek tekrar deneyin.</p>
                      <button onClick={() => { setSearchTerm(''); setClassFilter('all'); setRouteFilter('all'); }} className="mt-4 text-blue-600 hover:text-blue-700 font-medium text-sm">
                        Filtreleri Temizle
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Datalists for Autocomplete */}
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

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-lg">Yeni Öğrenci Ekle</h3>
              <button onClick={() => setIsAddModalOpen(false)}><X className="text-slate-400 hover:text-slate-600" /></button>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Adı Soyadı</label>
                  <input required type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={newStudent.name || ''} onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Okul No</label>
                  <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={newStudent.studentNumber || ''} onChange={(e) => setNewStudent({ ...newStudent, studentNumber: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Okul</label>
                  <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={newStudent.schoolName || ''} onChange={(e) => setNewStudent({ ...newStudent, schoolName: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Sınıf / Şube</label>
                  <input required type="text" list="classOptions" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={newStudent.className || ''} onChange={(e) => setNewStudent({ ...newStudent, className: e.target.value })} placeholder="Seç veya Yaz (Örn: 5/A)" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Cinsiyet</label>
                  <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={newStudent.gender} onChange={(e) => setNewStudent({ ...newStudent, gender: e.target.value as any })}>
                    <option value="KIZ">KIZ</option>
                    <option value="ERKEK">ERKEK</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Köy / Mahalle</label>
                  <input type="text" list="villageOptions" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={newStudent.village || ''} onChange={(e) => setNewStudent({ ...newStudent, village: e.target.value })} placeholder="Seç veya Yaz" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Güzergah</label>
                  <input type="text" list="routeOptions" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={newStudent.route || ''} onChange={(e) => setNewStudent({ ...newStudent, route: e.target.value })} placeholder="Seç veya Yaz" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Şoför</label>
                  <input type="text" list="driverOptions" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={newStudent.driver || ''} onChange={(e) => setNewStudent({ ...newStudent, driver: e.target.value })} placeholder="Seç veya Yaz" />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 font-medium">İptal</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-lg">Öğrenci Düzenle</h3>
              <button onClick={() => setEditingStudent(null)}><X className="text-slate-400 hover:text-slate-600" /></button>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Adı Soyadı</label>
                  <input required type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={editingStudent.name} onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Okul No</label>
                  <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={editingStudent.studentNumber || ''} onChange={(e) => setEditingStudent({ ...editingStudent, studentNumber: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Okul</label>
                  <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={editingStudent.schoolName} onChange={(e) => setEditingStudent({ ...editingStudent, schoolName: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Sınıf / Şube</label>
                  <input required type="text" list="classOptions" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={editingStudent.className} onChange={(e) => setEditingStudent({ ...editingStudent, className: e.target.value })} placeholder="Örn: 5/A" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Cinsiyet</label>
                  <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={editingStudent.gender} onChange={(e) => setEditingStudent({ ...editingStudent, gender: e.target.value as any })}>
                    <option value="KIZ">KIZ</option>
                    <option value="ERKEK">ERKEK</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Köy / Mahalle</label>
                  <input type="text" list="villageOptions" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={editingStudent.village} onChange={(e) => setEditingStudent({ ...editingStudent, village: e.target.value })} placeholder="Seç veya Yaz" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Güzergah</label>
                  <input type="text" list="routeOptions" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={editingStudent.route} onChange={(e) => setEditingStudent({ ...editingStudent, route: e.target.value })} placeholder="Seç veya Yaz" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Şoför</label>
                  <input type="text" list="driverOptions" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={editingStudent.driver || ''} onChange={(e) => setEditingStudent({ ...editingStudent, driver: e.target.value })} placeholder="Seç veya Yaz" />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setEditingStudent(null)} className="px-4 py-2 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 font-medium">İptal</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">Güncelle</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
