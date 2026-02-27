import React, { useState, useMemo } from 'react';
import { Student, AppSettings } from '../types';
import { Search, Plus, FileSpreadsheet, Edit, Trash2, Check, X, Filter, Printer, FileText, ArrowRightLeft } from 'lucide-react';
import * as XLSX from 'xlsx';
import { PrintPreview } from '../components/PrintPreview';

interface StudentsProps {
  students: Student[];
  onDelete: (id: string) => void;
  onBulkDelete: (ids: string[]) => void;
  onUpdate: (student: Student) => void;
  onAdd: (student: Student) => void;
  settings: AppSettings;
}

export const PrintableStudentList: React.FC<{
  students: Student[];
  classFilter: string;
  orientation?: 'portrait' | 'landscape';
}> = ({ students, classFilter, orientation = 'portrait' }) => {
  return (
    <div className="bg-white p-4 font-sans text-black">
      <style>{`
        @page { size: ${orientation}; margin: 10mm; }
        body { background-color: white !important; }
        table, th, td { border: 1px solid black !important; border-collapse: collapse !important; }
      `}</style>
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold">ÖĞRENCİ LİSTESİ</h2>
        {classFilter !== 'all' && <p className="text-sm mt-1">Sınıf: {classFilter}</p>}
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-slate-100">
            <th className="p-1 w-8">S.No</th>
            <th className="p-1">Adı Soyadı</th>
            <th className="p-1">Okul</th>
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
              <td className="p-1 text-center">{index + 1}</td>
              <td className="p-1">{student.name}</td>
              <td className="p-1">{student.schoolName}</td>
              <td className="p-1 text-center">{student.className}</td>
              <td className="p-1 text-center">{student.gender}</td>
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

export const Students: React.FC<StudentsProps> = ({ students, onDelete, onBulkDelete, onUpdate, onAdd, settings }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  
  // New student state
  const [newStudent, setNewStudent] = useState<Partial<Student>>({
    schoolName: settings.schoolName,
    className: '',
    gender: 'KIZ',
    route: '',
    village: '',
    driver: '',
    sn: 0
  });

  const filteredStudents = useMemo(() => {
    return students.filter(student => 
      student.name.toLocaleLowerCase('tr-TR').includes(searchTerm.toLocaleLowerCase('tr-TR')) ||
      student.className.toLocaleLowerCase('tr-TR').includes(searchTerm.toLocaleLowerCase('tr-TR')) ||
      student.village.toLocaleLowerCase('tr-TR').includes(searchTerm.toLocaleLowerCase('tr-TR')) ||
      (student.driver && student.driver.toLocaleLowerCase('tr-TR').includes(searchTerm.toLocaleLowerCase('tr-TR')))
    ).sort((a,b) => a.name.localeCompare(b.name, 'tr-TR'));
  }, [students, searchTerm]);

  const handleDeleteClick = (student: Student, e: React.MouseEvent) => {
    if(window.confirm(`${student.name} isimli öğrenciyi silmek istediğinize emin misiniz?`)) {
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
        driver: newStudent.driver || ''
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
        sn: 0
      });
    }
  };

  const exportToExcel = () => {
    const data = filteredStudents.map((s, i) => ({
      'Sıra No': i + 1,
      'Adı Soyadı': s.name,
      'Okul': s.schoolName,
      'Sınıf': s.className,
      'Cinsiyet': s.gender,
      'Köy/Mahalle': s.village,
      'Güzergah': s.route,
      'Şoför': s.driver
    }));
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ogrenci_Listesi");
    XLSX.writeFile(wb, "Ogrenci_Listesi.xlsx");
  };

  return (
    <div className="space-y-6">
      {isPreviewing && (
        <PrintPreview 
          title="Öğrenci Listesi" 
          onBack={() => setIsPreviewing(false)}
        >
          <PrintableStudentList students={filteredStudents} classFilter="Tümü" orientation={orientation} />
        </PrintPreview>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Öğrenci Listesi</h1>
          <p className="text-slate-500 text-sm">{filteredStudents.length} öğrenci listeleniyor</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Öğrenci ara..." 
              className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          </div>
          
          <button onClick={() => setIsPreviewing(true)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-300 transition-colors" title="Yazdır">
            <Printer size={20} />
          </button>
          
          <button onClick={exportToExcel} className="p-2 text-green-600 hover:bg-green-50 rounded-lg border border-green-200 transition-colors" title="Excel İndir">
            <FileSpreadsheet size={20} />
          </button>
          
          <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
            <Plus size={18} />
            <span>Öğrenci Ekle</span>
          </button>
        </div>
      </div>

      {/* Student List Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">#</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">SN</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Öğrenci Adı</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Okul</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Cinsiyet</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Sınıf</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Köy</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Güzergah</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Şoför</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length > 0 ? (filteredStudents.map((student, index) => (<tr key={student.id} className="hover:bg-slate-50 transition-colors group"><td className="px-6 py-4 text-slate-700 font-bold font-mono text-xs">{index + 1}</td><td className="px-6 py-4 text-slate-400 text-xs">{student.sn}</td><td className="px-6 py-4 font-medium text-slate-800 student-name">{student.name}</td><td className="px-6 py-4"><span className={`px-2 py-1 rounded text-xs font-semibold border ${student.schoolName.includes('Ortaokul') ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>{student.schoolName.includes('Ortaokul') ? 'Ortaokul' : 'İlkokul'}</span></td><td className="px-6 py-4">{student.gender ? <span className={`px-2 py-1 rounded-full text-xs font-semibold ${student.gender === 'KIZ' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'}`}>{student.gender}</span> : <span className="px-2 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500">-</span>}</td><td className="px-6 py-4 text-slate-600"><span className="bg-slate-100 text-slate-700 px-2 py-1 rounded border border-slate-200">{student.className}</span></td><td className="px-6 py-4 text-slate-600">{student.village}</td><td className="px-6 py-4 text-slate-500 max-w-xs truncate" title={student.route}>{student.route}</td><td className="px-6 py-4 text-slate-700 font-medium">{student.driver}</td><td className="px-6 py-4"><div className="flex items-center justify-end space-x-2"><button type="button" onClick={() => setEditingStudent(student)} className="flex items-center space-x-1 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md transition-colors font-medium text-xs" title="Düzenle"><Edit size={14} /><span>Düzenle</span></button><button type="button" onClick={(e) => handleDeleteClick(student, e)} className="p-1.5 text-red-500 hover:bg-red-100 rounded-md transition-colors" title="Sil"><Trash2 size={16} /></button></div></td></tr>))) : (<tr><td colSpan={10} className="px-6 py-12 text-center text-slate-400">Arama kriterlerine uygun öğrenci bulunamadı.</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
      
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
                        <input required type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={newStudent.name || ''} onChange={(e) => setNewStudent({...newStudent, name: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Okul</label>
                        <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={newStudent.schoolName || ''} onChange={(e) => setNewStudent({...newStudent, schoolName: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Sınıf</label>
                        <input required type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={newStudent.className || ''} onChange={(e) => setNewStudent({...newStudent, className: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Cinsiyet</label>
                        <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={newStudent.gender} onChange={(e) => setNewStudent({...newStudent, gender: e.target.value as any})}>
                            <option value="KIZ">KIZ</option>
                            <option value="ERKEK">ERKEK</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Köy</label>
                        <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={newStudent.village || ''} onChange={(e) => setNewStudent({...newStudent, village: e.target.value})} />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Güzergah</label>
                        <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={newStudent.route || ''} onChange={(e) => setNewStudent({...newStudent, route: e.target.value})} />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Şoför</label>
                        <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={newStudent.driver || ''} onChange={(e) => setNewStudent({...newStudent, driver: e.target.value})} />
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
                        <input required type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={editingStudent.name} onChange={(e) => setEditingStudent({...editingStudent, name: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Okul</label>
                        <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={editingStudent.schoolName} onChange={(e) => setEditingStudent({...editingStudent, schoolName: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Sınıf</label>
                        <input required type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={editingStudent.className} onChange={(e) => setEditingStudent({...editingStudent, className: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Cinsiyet</label>
                        <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={editingStudent.gender} onChange={(e) => setEditingStudent({...editingStudent, gender: e.target.value as any})}>
                            <option value="KIZ">KIZ</option>
                            <option value="ERKEK">ERKEK</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Köy</label>
                        <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={editingStudent.village} onChange={(e) => setEditingStudent({...editingStudent, village: e.target.value})} />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Güzergah</label>
                        <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={editingStudent.route} onChange={(e) => setEditingStudent({...editingStudent, route: e.target.value})} />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Şoför</label>
                        <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={editingStudent.driver || ''} onChange={(e) => setEditingStudent({...editingStudent, driver: e.target.value})} />
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