
import React, { useMemo, useState, useEffect } from 'react';
import { Student, Driver, AppSettings } from '../types';
import { User, Edit, MapPin, Plus, X, Trash2, Save, AlertTriangle, Printer, ArrowRightLeft, UserPlus, Milestone, Search, Filter, Briefcase, FileText, CheckSquare, Square, GripHorizontal, List, Hash, Calendar, Armchair } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PrintPreview } from '../components/PrintPreview';

interface DriversRoutesProps {
    students: Student[];
    setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
    drivers: Driver[];
    setDrivers: React.Dispatch<React.SetStateAction<Driver[]>>;
    settings: AppSettings;
    onUpdateSettings?: (settings: AppSettings) => void;
}

export const PrintableDriversRoutes: React.FC<{
    activeTab: 'drivers' | 'routes' | 'assign';
    driversData: any[];
    uniqueRoutes: string[];
    orientation: 'portrait' | 'landscape';
}> = ({ activeTab, driversData, uniqueRoutes, orientation }) => {
    const isDriverTab = activeTab === 'drivers';
    return (
        <div className="bg-white p-4 font-sans">
            <style>{`
        @page { size: A4 ${orientation}; margin: 5mm; }
        body { background-color: white !important; }
        table, th, td { border: 1px solid black !important; border-collapse: collapse !important; }
        .break-inside-avoid { page-break-inside: avoid; }
      `}</style>
            <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-black">
                    {isDriverTab ? 'TAŞIMA MERKEZİ ŞOFÖR LİSTESİ' : 'TAŞIMA MERKEZİ GÜZERGAH LİSTESİ'}
                </h2>
            </div>
            {isDriverTab ? (
                <table className="w-full border-collapse border border-black text-[10px]">
                    <thead><tr className="bg-slate-100"><th className="p-1 w-10 text-center">S.No</th><th className="p-1 text-left">Adı Soyadı / TC</th><th className="p-1 text-left">Telefon</th><th className="p-1 text-left">Plaka</th><th className="p-1 text-center">Model</th><th className="p-1 text-center">Koltuk</th><th className="p-1 text-left">Güzergahlar</th><th className="p-1 w-16 text-center">Öğrenci</th></tr></thead>
                    <tbody>{driversData.map((d, idx) => (<tr key={d.id} className="break-inside-avoid"><td className="p-1 text-center">{idx + 1}</td><td className="p-1 font-medium">{d.name}<br /><span className="text-[9px] text-slate-500">{d.tcNumber}</span></td><td className="p-1">{d.phone}</td><td className="p-1">{d.plateNumber}</td><td className="p-1 text-center">{d.vehicleYear || '-'}</td><td className="p-1 text-center">{d.seatCount || '-'}</td><td className="p-1">{d.displayRoutes.join(', ')}</td><td className="p-1 text-center">{d.studentCount}</td></tr>))}</tbody>
                </table>
            ) : (
                <table className="w-full border-collapse border border-black text-[10px]">
                    <thead><tr className="bg-slate-100"><th className="p-1 w-10 text-center">S.No</th><th className="p-1 text-left">Güzergah Adı</th><th className="p-1 text-left">Atanan Şoför</th></tr></thead>
                    <tbody>{uniqueRoutes.map((route, idx) => {
                        const assignedDriver = driversData.find(dd => dd.displayRoutes.includes(route));
                        return (<tr key={idx} className="break-inside-avoid"><td className="p-1 text-center">{idx + 1}</td><td className="p-1">{route}</td><td className="p-1">{assignedDriver ? assignedDriver.name : '-'}</td></tr>);
                    })}</tbody>
                </table>
            )}
        </div>
    );
};


export const DriversRoutes: React.FC<DriversRoutesProps> = ({ students, setStudents, drivers, setDrivers, settings, onUpdateSettings }) => {
    const [activeTab, setActiveTab] = useState<'drivers' | 'routes' | 'assign'>('drivers');

    // Modals for Actions
    const [isAddDriverOpen, setIsAddDriverOpen] = useState(false);
    const [isAddRouteOpen, setIsAddRouteOpen] = useState(false);
    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

    const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
    const [isPreviewing, setIsPreviewing] = useState(false);
    const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
    const location = useLocation();
    const navigate = useNavigate();

    const [driverRouteInput, setDriverRouteInput] = useState('');
    const [editingRoute, setEditingRoute] = useState<string | null>(null);
    const [editRouteName, setEditRouteName] = useState('');

    // New Driver Inputs
    const [newDriverName, setNewDriverName] = useState('');
    const [newDriverPhone, setNewDriverPhone] = useState('');
    const [newDriverTC, setNewDriverTC] = useState('');
    const [newDriverPlate, setNewDriverPlate] = useState('');
    const [newDriverYear, setNewDriverYear] = useState('');
    const [newDriverSeat, setNewDriverSeat] = useState('');

    // New Route State
    const [newRouteName, setNewRouteName] = useState('');
    const [newRouteDriver, setNewRouteDriver] = useState('');

    // New Route Detail States (Updated for Multi-Stop)
    const [routeStops, setRouteStops] = useState<string[]>([]);
    const [currentStopInput, setCurrentStopInput] = useState('');

    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; type: 'driver' | 'route' | null; id: string; name: string; }>({ isOpen: false, type: null, id: '', name: '' });

    // Bulk Assign State
    const [bulkFilterVillage, setBulkFilterVillage] = useState('all');
    const [bulkFilterClass, setBulkFilterClass] = useState('all');
    const [bulkFilterDriver, setBulkFilterDriver] = useState('all');
    const [bulkFilterRoute, setBulkFilterRoute] = useState('all');
    const [bulkFilterUnassigned, setBulkFilterUnassigned] = useState(false);
    const [bulkSearchTerm, setBulkSearchTerm] = useState('');
    const [bulkSelection, setBulkSelection] = useState<Set<string>>(new Set());
    const [bulkTargetDriver, setBulkTargetDriver] = useState('');
    const [bulkTargetRoute, setBulkTargetRoute] = useState('');
    const [bulkTargetVillage, setBulkTargetVillage] = useState('');
    const [newAddressName, setNewAddressName] = useState('');

    useEffect(() => {
        if (location.state) {
            if ((location.state as any).action === 'add-route') {
                setActiveTab('routes');
                setIsAddRouteOpen(true);
                navigate(location.pathname, { replace: true, state: {} });
            } else if ((location.state as any).activeTab) {
                setActiveTab((location.state as any).activeTab);
            }
        }
    }, [location, navigate]);

    // Auto-generate route name when stops change
    useEffect(() => {
        if (isAddRouteOpen && routeStops.length > 0) {
            setNewRouteName(routeStops.join(' - '));
        }
    }, [routeStops, isAddRouteOpen]);

    const handleAddStop = () => {
        if (currentStopInput.trim()) {
            setRouteStops([...routeStops, currentStopInput.trim()]);
            setCurrentStopInput('');
        }
    };

    const handleRemoveStop = (index: number) => {
        setRouteStops(routeStops.filter((_, i) => i !== index));
    };

    const driversData = useMemo(() => {
        return drivers.map(driver => {
            const studentCount = students.filter(s => s.driver === driver.name).length;
            const routes = new Set([...driver.routes]);
            students.filter(s => s.driver === driver.name).forEach(s => routes.add(s.route));
            return { ...driver, studentCount, displayRoutes: Array.from(routes).filter(r => r && r.trim() !== '') };
        }).sort((a, b) => b.studentCount - a.studentCount);
    }, [students, drivers]);

    const uniqueRoutes = useMemo(() => {
        const routesSet = new Set<string>();
        drivers.forEach(d => d.routes.forEach(r => routesSet.add(r)));
        students.forEach(s => routesSet.add(s.route));
        routesSet.delete('');
        return Array.from(routesSet).sort();
    }, [students, drivers]);

    const uniqueDriverNames = useMemo(() => drivers.map(d => d.name), [drivers]);
    const uniqueVillages = useMemo(() => Array.from(new Set(students.map(s => s.village).filter(Boolean))).sort(), [students]);
    const uniqueClasses = useMemo(() => Array.from(new Set(students.map(s => s.className).filter(Boolean))).sort(), [students]); // NEW CLASS LIST

    // Bulk Assign Filtering
    const bulkFilteredStudents = useMemo(() => {
        return students.filter(s => {
            if (bulkFilterUnassigned && s.driver) return false;
            if (bulkFilterVillage !== 'all' && s.village !== bulkFilterVillage) return false;
            if (bulkFilterClass !== 'all' && s.className !== bulkFilterClass) return false; // Filter by Class
            if (bulkFilterDriver !== 'all' && s.driver !== bulkFilterDriver) return false;
            if (bulkFilterRoute !== 'all' && s.route !== bulkFilterRoute) return false;
            // Search Logic
            if (bulkSearchTerm && !s.name.toLocaleLowerCase('tr-TR').includes(bulkSearchTerm.toLocaleLowerCase('tr-TR'))) return false;

            return true;
        }).sort((a, b) => a.name.localeCompare(b.name));
    }, [students, bulkFilterVillage, bulkFilterUnassigned, bulkSearchTerm, bulkFilterClass, bulkFilterDriver, bulkFilterRoute]);

    // Select/Deselect All in Bulk
    const toggleBulkSelectAll = () => {
        if (bulkSelection.size === bulkFilteredStudents.length) {
            setBulkSelection(new Set());
        } else {
            setBulkSelection(new Set(bulkFilteredStudents.map(s => s.id)));
        }
    };

    const toggleBulkSelection = (id: string) => {
        const newSet = new Set(bulkSelection);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setBulkSelection(newSet);
    };

    const handleBulkAssign = () => {
        if (!bulkTargetDriver && !bulkTargetRoute && !bulkTargetVillage) {
            alert("Lütfen atanacak en az bir bilgi (Şoför, Güzergah veya Adres) seçiniz.");
            return;
        }
        if (bulkSelection.size === 0) { alert("Lütfen en az bir öğrenci seçiniz."); return; }

        // Update Students
        setStudents(prev => prev.map(s => {
            if (bulkSelection.has(s.id)) {
                return {
                    ...s,
                    driver: bulkTargetDriver || s.driver,
                    route: bulkTargetRoute || s.route,
                    village: bulkTargetVillage || s.village
                };
            }
            return s;
        }));

        // Update Driver Routes if new route added
        if (bulkTargetDriver && bulkTargetRoute) {
            setDrivers(prev => prev.map(d => {
                if (d.name === bulkTargetDriver && !d.routes.includes(bulkTargetRoute)) {
                    return { ...d, routes: [...d.routes, bulkTargetRoute] };
                }
                return d;
            }));
        }

        setBulkSelection(new Set());
        alert("Atama işlemi başarıyla tamamlandı.");
    };

    const targetDriverRoutes = useMemo(() => {
        const drv = driversData.find(d => d.name === bulkTargetDriver);
        return drv ? drv.displayRoutes : [];
    }, [bulkTargetDriver, driversData]);

    const handleSaveDriver = () => {
        if (!newDriverName) return;
        const newDriver: Driver = {
            id: `d${Date.now()}`,
            name: newDriverName,
            phone: newDriverPhone,
            tcNumber: newDriverTC,
            plateNumber: newDriverPlate,
            vehicleYear: newDriverYear ? parseInt(newDriverYear) : undefined,
            seatCount: newDriverSeat ? parseInt(newDriverSeat) : undefined,
            routes: []
        };
        setDrivers(prev => [...prev, newDriver]);
        setIsAddDriverOpen(false);
        setNewDriverName(''); setNewDriverPhone(''); setNewDriverTC(''); setNewDriverPlate(''); setNewDriverYear(''); setNewDriverSeat('');
    };

    const handleUpdateDriver = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingDriver) return;

        // Şoför ismi değiştiyse, öğrencilerin kayıtlarını da güncelle
        const originalDriver = drivers.find(d => d.id === editingDriver.id);
        if (originalDriver && originalDriver.name !== editingDriver.name) {
            if (window.confirm(`Şoför ismini "${originalDriver.name}" -> "${editingDriver.name}" olarak değiştirmek üzeresiniz. Bu şoföre atanmış tüm öğrencilerin kayıtları da güncellenecektir. Onaylıyor musunuz?`)) {
                setStudents(prev => prev.map(s => s.driver === originalDriver.name ? { ...s, driver: editingDriver.name } : s));
            } else {
                // Kullanıcı iptal ederse işlemi durdur
                return;
            }
        }

        setDrivers(prev => prev.map(d => d.id === editingDriver.id ? editingDriver : d));
        setEditingDriver(null);
        setDriverRouteInput('');
    };

    const handleAddRouteToDriver = () => {
        if (!editingDriver || !driverRouteInput.trim()) return;
        if (editingDriver.routes.includes(driverRouteInput.trim())) { alert("Bu güzergah zaten şoföre tanımlı."); return; }
        setEditingDriver({ ...editingDriver, routes: [...editingDriver.routes, driverRouteInput.trim()] });
        setDriverRouteInput('');
    };

    const handleRemoveRouteFromDriver = (routeToRemove: string) => {
        if (!editingDriver) return;
        setEditingDriver({ ...editingDriver, routes: editingDriver.routes.filter(r => r !== routeToRemove) });
    };

    const initiateDeleteDriver = (id: string, name: string) => setDeleteConfirm({ isOpen: true, type: 'driver', id, name });
    const initiateDeleteRoute = (route: string) => setDeleteConfirm({ isOpen: true, type: 'route', id: route, name: route });

    const performDelete = () => {
        if (deleteConfirm.type === 'driver') { setDrivers(prev => prev.filter(d => d.id !== deleteConfirm.id)); }
        else if (deleteConfirm.type === 'route') { const routeName = deleteConfirm.id; setStudents(prev => prev.map(s => s.route === routeName ? { ...s, route: '' } : s)); setDrivers(prev => prev.map(d => ({ ...d, routes: d.routes.filter(r => r !== routeName) }))); }
        setDeleteConfirm({ isOpen: false, type: null, id: '', name: '' });
    };

    const handleSaveRoute = () => {
        if (!newRouteName) return;
        if (newRouteDriver) {
            setDrivers(prev => prev.map(d => d.name === newRouteDriver ? { ...d, routes: [...d.routes, newRouteName] } : d));
        } else { alert("Lütfen bu güzergahı bir şoföre atayınız veya önce şoför ekleyiniz."); return; }

        setRouteStops([]); setCurrentStopInput(''); setNewRouteName(''); setNewRouteDriver('');
        setIsAddRouteOpen(false);
    };

    const startEditRoute = (route: string) => { setEditingRoute(route); setEditRouteName(route); };

    const saveRouteEdit = () => {
        if (!editingRoute || !editRouteName) return;
        if (editingRoute === editRouteName) { setEditingRoute(null); return; }
        if (window.confirm(`"${editingRoute}" güzergahının adını "${editRouteName}" olarak değiştirmek tüm kayıtları güncelleyecektir. Onaylıyor musunuz?`)) {
            setStudents(prev => prev.map(s => s.route === editingRoute ? { ...s, route: editRouteName } : s));
            setDrivers(prev => prev.map(d => ({ ...d, routes: d.routes.map(r => r === editingRoute ? editRouteName : r) })));
        }
        setEditingRoute(null);
    };

    const handleAddAddress = (e: React.FormEvent) => {
        e.preventDefault();
        if (newAddressName.trim() && onUpdateSettings) {
            const currentVillages = settings.quickVillages || [];
            if (!currentVillages.includes(newAddressName.trim())) {
                onUpdateSettings({
                    ...settings,
                    quickVillages: [...currentVillages, newAddressName.trim()]
                });
            }
            setNewAddressName('');
        }
    };

    const handleRemoveAddress = (addressToRemove: string) => {
        if (onUpdateSettings) {
            const currentVillages = settings.quickVillages || [];
            onUpdateSettings({
                ...settings,
                quickVillages: currentVillages.filter(v => v !== addressToRemove)
            });
        }
    };

    const renderDeleteConfirmModal = () => {
        if (!deleteConfirm.isOpen) return null;
        return (<div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"><div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden transform scale-100 transition-all"><div className="flex items-center justify-between p-4 border-b border-slate-100"><h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><AlertTriangle className="text-red-500" size={24} />Silme Onayı</h3><button onClick={() => setDeleteConfirm({ ...deleteConfirm, isOpen: false })} className="text-slate-400 hover:text-slate-600"><X size={20} /></button></div><div className="p-6"><p className="text-slate-600"><span className="font-bold text-slate-800">{deleteConfirm.name}</span> isimli {deleteConfirm.type === 'driver' ? 'şoförü' : 'güzergahı'} silmek istediğinize emin misiniz?</p>{deleteConfirm.type === 'route' && (<p className="text-xs text-red-500 mt-2 bg-red-50 p-2 rounded border border-red-100">Dikkat: Bu işlem ilgili öğrencilerin güzergah bilgisini temizleyecektir.</p>)}</div><div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end space-x-3"><button onClick={() => setDeleteConfirm({ ...deleteConfirm, isOpen: false })} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors">İptal</button><button onClick={performDelete} className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors shadow-sm flex items-center gap-2"><Trash2 size={18} /><span>Evet, Sil</span></button></div></div></div>);
    };

    const renderAddDriverModal = () => {
        if (!isAddDriverOpen) return null;
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                    <div className="flex items-center justify-between p-4 border-b border-slate-100">
                        <h3 className="text-lg font-bold text-slate-800">Yeni Şoför Ekle</h3>
                        <button onClick={() => setIsAddDriverOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Ad Soyad</label>
                            <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Örn: Ahmet Yılmaz" value={newDriverName} onChange={(e) => setNewDriverName(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1"><Hash size={14} /> TC Kimlik No (Opsiyonel)</label>
                            <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="11 Haneli TC No" value={newDriverTC} onChange={(e) => setNewDriverTC(e.target.value)} maxLength={11} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Telefon</label>
                                <input type="tel" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="05XX" value={newDriverPhone} onChange={(e) => setNewDriverPhone(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Plaka</label>
                                <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="34 ABC 123" value={newDriverPlate} onChange={(e) => setNewDriverPlate(e.target.value)} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-1"><Calendar size={12} /> Araç Yılı (Opsiyonel)</label>
                                <input type="number" className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none" placeholder="2015" value={newDriverYear} onChange={(e) => setNewDriverYear(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-1"><Armchair size={12} /> Koltuk Sayısı (Opsiyonel)</label>
                                <input type="number" className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none" placeholder="16" value={newDriverSeat} onChange={(e) => setNewDriverSeat(e.target.value)} />
                            </div>
                        </div>
                    </div>
                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end space-x-3">
                        <button onClick={() => setIsAddDriverOpen(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors">İptal</button>
                        <button onClick={handleSaveDriver} className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm">Kaydet</button>
                    </div>
                </div>
            </div>
        );
    };

    const renderEditDriverModal = () => {
        if (!editingDriver) return null;
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                    <div className="flex items-center justify-between p-4 border-b border-slate-100">
                        <h3 className="text-lg font-bold text-slate-800">Şoför Düzenle</h3>
                        <button onClick={() => setEditingDriver(null)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                    </div>
                    <div className="overflow-y-auto p-6 space-y-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Ad Soyad</label>
                                <input type="text" required className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={editingDriver.name} onChange={(e) => setEditingDriver({ ...editingDriver, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1"><Hash size={14} /> TC Kimlik No</label>
                                <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={editingDriver.tcNumber || ''} onChange={(e) => setEditingDriver({ ...editingDriver, tcNumber: e.target.value })} maxLength={11} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Telefon</label>
                                    <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={editingDriver.phone || ''} onChange={(e) => setEditingDriver({ ...editingDriver, phone: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Araç Plakası</label>
                                    <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={editingDriver.plateNumber || ''} onChange={(e) => setEditingDriver({ ...editingDriver, plateNumber: e.target.value })} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-1"><Calendar size={12} /> Araç Yılı</label>
                                    <input type="number" className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none" value={editingDriver.vehicleYear || ''} onChange={(e) => setEditingDriver({ ...editingDriver, vehicleYear: parseInt(e.target.value) || undefined })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-1"><Armchair size={12} /> Koltuk Sayısı</label>
                                    <input type="number" className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none" value={editingDriver.seatCount || ''} onChange={(e) => setEditingDriver({ ...editingDriver, seatCount: parseInt(e.target.value) || undefined })} />
                                </div>
                            </div>
                        </div>
                        <div className="border-t border-slate-100 pt-4">
                            <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><MapPin size={18} className="text-blue-500" />Güzergah Yönetimi</h4>
                            <div className="flex gap-2 mb-3">
                                <input type="text" placeholder="Yeni güzergah adı..." className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" value={driverRouteInput} onChange={(e) => setDriverRouteInput(e.target.value)} />
                                <button type="button" onClick={handleAddRouteToDriver} className="px-3 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"><Plus size={20} /></button>
                            </div>
                            <div className="bg-slate-50 rounded-lg border border-slate-200 p-2 space-y-2 max-h-40 overflow-y-auto">
                                {editingDriver.routes.length > 0 ? (editingDriver.routes.map((route, idx) => (<div key={idx} className="flex items-center justify-between bg-white p-2 rounded border border-slate-100 shadow-sm text-sm"><span className="text-slate-700 truncate">{route}</span><button type="button" onClick={() => handleRemoveRouteFromDriver(route)} className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1 rounded transition-colors"><X size={16} /></button></div>))) : (<div className="text-center text-slate-400 text-xs py-2 italic">Henüz atanmış güzergah yok.</div>)}
                            </div>
                        </div>
                    </div>
                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end space-x-3">
                        <button type="button" onClick={() => setEditingDriver(null)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg">İptal</button>
                        <button type="button" onClick={handleUpdateDriver} className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-sm">Güncelle</button>
                    </div>
                </div>
            </div>
        );
    };

    const renderEditRouteModal = () => {
        if (!editingRoute) return null;
        return (<div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"><div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"><div className="flex items-center justify-between p-4 border-b border-slate-100"><h3 className="text-lg font-bold text-slate-800">Güzergah Adını Düzenle</h3><button onClick={() => setEditingRoute(null)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button></div><div className="p-6 space-y-4"><div className="bg-orange-50 text-orange-700 p-3 rounded-lg text-sm flex items-start gap-2"><AlertTriangle size={16} className="mt-0.5 flex-shrink-0" /><p>Dikkat: Güzergah ismini değiştirdiğinizde, bu güzergaha kayıtlı tüm öğrencilerin ve şoförlerin bilgileri güncellenecektir.</p></div><div><label className="block text-sm font-medium text-slate-700 mb-1">Güzergah Adı</label><input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={editRouteName} onChange={(e) => setEditRouteName(e.target.value)} /></div></div><div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end space-x-3"><button onClick={() => setEditingRoute(null)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors">İptal</button><button onClick={saveRouteEdit} className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm">Kaydet</button></div></div></div>);
    };

    const renderAddRouteModal = () => {
        if (!isAddRouteOpen) return null;
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
                    <div className="flex items-center justify-between p-4 border-b border-slate-100">
                        <h3 className="text-lg font-bold text-slate-800">Yeni Güzergah Oluştur</h3>
                        <button onClick={() => setIsAddRouteOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                    </div>

                    <div className="px-6 pt-4">
                        <div className="bg-yellow-50 p-2 text-xs text-yellow-800 rounded border border-yellow-200 flex items-center gap-2">
                            <MapPin size={14} className="shrink-0" />
                            <span>
                                Şu an <strong>{settings.province} / {settings.district}</strong> bölgesi için güzergah oluşturuyorsunuz.
                            </span>
                        </div>
                    </div>

                    <div className="p-6 space-y-4">

                        {/* Route Stops Builder */}
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4">
                            <label className="block text-xs font-bold text-blue-800 mb-2 uppercase flex items-center gap-1"><Milestone size={14} /> Güzergah Durakları / Köyler</label>
                            <div className="flex gap-2 mb-2">
                                <input
                                    type="text"
                                    className="flex-1 px-2 py-1.5 border border-blue-200 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                                    placeholder="Köy veya Mahalle Adı..."
                                    value={currentStopInput}
                                    onChange={(e) => setCurrentStopInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddStop()}
                                />
                                <button onClick={handleAddStop} className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition-colors">Ekle</button>
                            </div>

                            <div className="flex flex-wrap gap-2 min-h-[40px] p-2 bg-white rounded border border-blue-100 max-h-[120px] overflow-y-auto">
                                {routeStops.length > 0 ? (
                                    routeStops.map((stop, idx) => (
                                        <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium border border-blue-200">
                                            <span className="w-4 h-4 flex items-center justify-center bg-white rounded-full text-[10px] mr-1 border border-blue-200">{idx + 1}</span>
                                            {stop}
                                            <button onClick={() => handleRemoveStop(idx)} className="ml-1 text-blue-400 hover:text-red-500"><X size={12} /></button>
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-slate-400 text-xs italic p-1">Henüz durak eklenmedi. Birden fazla köy ekleyebilirsiniz.</span>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Güzergah Adı (Otomatik)</label>
                            <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800 bg-slate-50" placeholder="Örn: Köy A - Köy B" value={newRouteName} onChange={(e) => setNewRouteName(e.target.value)} />
                            <p className="text-[10px] text-slate-400 mt-1">Durakları ekledikçe isim otomatik oluşur, isterseniz elle düzeltebilirsiniz.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Atanacak Şoför (Zorunlu)</label>
                            <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={newRouteDriver} onChange={(e) => setNewRouteDriver(e.target.value)}>
                                <option value="">Seçiniz</option>
                                {uniqueDriverNames.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end space-x-3">
                        <button onClick={() => setIsAddRouteOpen(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors">İptal</button>
                        <button onClick={handleSaveRoute} className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm">Kaydet</button>
                    </div>
                </div>
            </div>
        );
    };

    const renderAddressModal = () => {
        if (!isAddressModalOpen) return null;
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="font-bold text-lg flex items-center gap-2"><MapPin className="text-emerald-600" /> Adres / Köy Yönetimi</h3>
                        <button onClick={() => setIsAddressModalOpen(false)}><X className="text-slate-400 hover:text-slate-600" /></button>
                    </div>

                    <div className="p-6 space-y-6">
                        <form onSubmit={handleAddAddress} className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Yeni Köy/Mahalle/Sokak Adı..."
                                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                value={newAddressName}
                                onChange={e => setNewAddressName(e.target.value)}
                            />
                            <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium">Ekle</button>
                        </form>

                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 max-h-60 overflow-y-auto flex flex-wrap gap-2">
                            {(settings.quickVillages || []).length > 0 ? (
                                settings.quickVillages!.map(v => (
                                    <span key={v} className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-slate-200 rounded-md text-sm shadow-sm">
                                        {v}
                                        <button onClick={() => handleRemoveAddress(v)} className="text-slate-400 hover:text-red-500"><X size={14} /></button>
                                    </span>
                                ))
                            ) : (
                                <span className="text-sm text-slate-400 italic">Henüz adres eklenmemiş.</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderBulkAssignView = () => {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-full flex flex-col">
                {/* Toolbar */}
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder="Öğrenci ara..."
                                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                value={bulkSearchTerm}
                                onChange={(e) => setBulkSearchTerm(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={() => setBulkFilterUnassigned(!bulkFilterUnassigned)}
                            className={`p-2 rounded-lg border transition-colors ${bulkFilterUnassigned ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-white text-slate-600 border-slate-300'}`}
                            title="Sadece Atanmamışları Göster"
                        >
                            <AlertTriangle size={18} />
                        </button>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                        <select
                            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                            value={bulkFilterVillage}
                            onChange={(e) => setBulkFilterVillage(e.target.value)}
                        >
                            <option value="all">Tüm Köyler</option>
                            {(settings.quickVillages || []).map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                        <select
                            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                            value={bulkFilterClass}
                            onChange={(e) => setBulkFilterClass(e.target.value)}
                        >
                            <option value="all">Tüm Sınıflar</option>
                            {uniqueClasses.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <select
                            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                            value={bulkFilterDriver}
                            onChange={(e) => setBulkFilterDriver(e.target.value)}
                        >
                            <option value="all">Tüm Şoförler</option>
                            {uniqueDriverNames.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                        <select
                            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                            value={bulkFilterRoute}
                            onChange={(e) => setBulkFilterRoute(e.target.value)}
                        >
                            <option value="all">Tüm Güzergahlar</option>
                            {uniqueRoutes.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Student List */}
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                        <div className="flex items-center justify-between mb-2 px-2">
                            <div className="flex items-center gap-2">
                                <button onClick={toggleBulkSelectAll} className="text-slate-500 hover:text-blue-600">
                                    {bulkSelection.size > 0 && bulkSelection.size === bulkFilteredStudents.length ? <CheckSquare size={20} className="text-blue-600" /> : <Square size={20} />}
                                </button>
                                <span className="text-sm font-bold text-slate-700">
                                    {bulkSelection.size} / {bulkFilteredStudents.length} Seçili
                                </span>
                            </div>
                        </div>

                        <div className="space-y-1">
                            {bulkFilteredStudents.map(student => {
                                const isSelected = bulkSelection.has(student.id);
                                return (
                                    <div
                                        key={student.id}
                                        onClick={() => toggleBulkSelection(student.id)}
                                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${isSelected ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200 hover:border-blue-300'}`}
                                    >
                                        <div className={`shrink-0 ${isSelected ? 'text-blue-600' : 'text-slate-300'}`}>
                                            {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between">
                                                <span className="font-bold text-slate-800 text-sm">{student.name}</span>
                                                <span className="text-xs text-slate-500">{student.className}</span>
                                            </div>
                                            <div className="flex justify-between mt-1">
                                                <span className="text-xs text-slate-600">{student.village}</span>
                                                {student.driver ? (
                                                    <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">{student.driver}</span>
                                                ) : (
                                                    <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">Atanmamış</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            {bulkFilteredStudents.length === 0 && (
                                <div className="text-center py-12 text-slate-400">
                                    Kriterlere uygun öğrenci bulunamadı.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Panel: Assignment Action */}
                    <div className="w-80 bg-slate-50 border-l border-slate-200 p-4 flex flex-col gap-4 overflow-y-auto">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <UserPlus size={18} className="text-blue-600" />
                            Toplu Atama İşlemleri
                        </h3>

                        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                            <div className="flex justify-between items-center mb-1">
                                <label className="block text-xs font-bold text-slate-500">Hedef Adres / Köy</label>
                                <button onClick={() => setIsAddressModalOpen(true)} className="text-[10px] text-emerald-600 hover:underline flex items-center gap-0.5"><Plus size={10} />Yeni Ekle</button>
                            </div>
                            <select
                                className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                value={bulkTargetVillage}
                                onChange={(e) => setBulkTargetVillage(e.target.value)}
                            >
                                <option value="">Mevcut Adresi Koru</option>
                                {(settings.quickVillages || []).map(v => <option key={v} value={v}>{v}</option>)}
                            </select>
                        </div>

                        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                            <label className="block text-xs font-bold text-slate-500 mb-1">Hedef Şoför</label>
                            <select
                                className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                value={bulkTargetDriver}
                                onChange={(e) => {
                                    setBulkTargetDriver(e.target.value);
                                    setBulkTargetRoute(''); // Reset route when driver changes
                                }}
                            >
                                <option value="">Mevcut Şoförü Koru</option>
                                {uniqueDriverNames.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>

                        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                            <label className="block text-xs font-bold text-slate-500 mb-1">Hedef Güzergah</label>
                            <select
                                className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                value={bulkTargetRoute}
                                onChange={(e) => setBulkTargetRoute(e.target.value)}
                            >
                                <option value="">Mevcut Güzergahı Koru</option>
                                {(bulkTargetDriver ? targetDriverRoutes : uniqueRoutes).map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>

                        <div className="mt-auto pt-4">
                            <div className="bg-blue-100 text-blue-800 p-3 rounded-lg text-xs mb-3">
                                <span className="font-bold">{bulkSelection.size}</span> öğrenci seçildi.
                                <br />
                                Seçili öğrencilerin bilgileri güncellenecek.
                            </div>
                            <button
                                onClick={handleBulkAssign}
                                disabled={bulkSelection.size === 0 || (!bulkTargetDriver && !bulkTargetRoute && !bulkTargetVillage)}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg shadow transition-colors flex items-center justify-center gap-2"
                            >
                                <Save size={18} />
                                Atamayı Tamamla
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6 flex flex-col h-full">
            {isPreviewing && (activeTab === 'drivers' || activeTab === 'routes') && (
                <PrintPreview title={activeTab === 'drivers' ? 'Şoför Listesi' : 'Güzergah Listesi'} onBack={() => setIsPreviewing(false)}>
                    <PrintableDriversRoutes activeTab={activeTab} driversData={driversData} uniqueRoutes={uniqueRoutes} orientation={orientation} />
                </PrintPreview>
            )}
            {renderAddDriverModal()}
            {renderAddRouteModal()}
            {renderEditDriverModal()}
            {renderEditRouteModal()}
            {renderDeleteConfirmModal()}
            {renderAddressModal()}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Taşıma Yönetimi</h1>
                    <p className="text-slate-500 text-sm">Şoförler, güzergahlar ve öğrenci atama işlemleri</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">

                    {/* Action Menu Group */}
                    <div className="flex flex-wrap items-center bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                        {/* 1. Şoför Listesi (Tab) */}
                        <button
                            onClick={() => setActiveTab('drivers')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium text-sm ${activeTab === 'drivers' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                        >
                            <User size={16} />
                            <span>Şoför Listesi</span>
                        </button>

                        {/* 2. Güzergah Listesi (Tab) */}
                        <button
                            onClick={() => setActiveTab('routes')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium text-sm ${activeTab === 'routes' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                        >
                            <List size={16} />
                            <span>Güzergah Listesi</span>
                        </button>

                        <div className="w-px h-6 bg-slate-200 mx-1"></div>

                        {/* 3. Toplu Atama (Tab) */}
                        <button
                            onClick={() => setActiveTab('assign')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium text-sm ${activeTab === 'assign' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                        >
                            <UserPlus size={16} />
                            <span>Toplu Atama Sihirbazı</span>
                        </button>
                    </div>

                    {/* Contextual Action Buttons */}
                    {activeTab === 'drivers' && (
                        <button onClick={() => setIsAddDriverOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200 font-medium text-sm">
                            <Plus size={16} />
                            <span>Şoför Ekle</span>
                        </button>
                    )}

                    {activeTab === 'routes' && (
                        <button onClick={() => setIsAddRouteOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm">
                            <MapPin size={16} />
                            <span>Güzergah Ekle</span>
                        </button>
                    )}

                    {/* Print Controls (Only for Lists) */}
                    {(activeTab === 'drivers' || activeTab === 'routes') && (
                        <div className="flex items-center gap-2 border-l border-slate-200 pl-4 ml-2">
                            <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1">
                                <button
                                    onClick={() => setOrientation('portrait')}
                                    className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1 transition-colors ${orientation === 'portrait' ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-50'}`}
                                    title="Dikey"
                                >
                                    <FileText size={14} />
                                    <span>Dikey</span>
                                </button>
                                <button
                                    onClick={() => setOrientation('landscape')}
                                    className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1 transition-colors ${orientation === 'landscape' ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-50'}`}
                                    title="Yatay"
                                >
                                    <ArrowRightLeft size={14} />
                                    <span>Yatay</span>
                                </button>
                            </div>
                            <button onClick={() => setIsPreviewing(true)} className="flex items-center space-x-2 bg-white text-slate-600 hover:bg-slate-50 px-3 py-2 rounded-lg transition-colors font-medium border border-slate-200 shadow-sm" title="Önizle & Yazdır">
                                <Printer size={18} />
                                <span className="hidden xl:inline">Yazdır</span>
                            </button>
                        </div>
                    )}

                </div>
            </div>

            <div className="flex-1 min-h-0 animate-fade-in">
                {activeTab === 'drivers' && (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-full flex flex-col">
                        <div className="overflow-x-auto flex-1">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200 sticky top-0 z-10">
                                    <tr><th className="px-6 py-4 bg-slate-50">Adı Soyadı</th><th className="px-6 py-4 bg-slate-50">Telefon</th><th className="px-6 py-4 bg-slate-50">Plaka</th><th className="px-6 py-4 text-center bg-slate-50">Model</th><th className="px-6 py-4 text-center bg-slate-50">Koltuk</th><th className="px-6 py-4 bg-slate-50">Güzergahlar</th><th className="px-6 py-4 text-center bg-slate-50">Öğrenci Sayısı</th><th className="px-6 py-4 text-center bg-slate-50">İşlemler</th></tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {driversData.map((driver) => (<tr key={driver.id} className="hover:bg-slate-50 transition-colors"><td className="px-6 py-4"><div className="flex items-center space-x-3"><div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center"><User size={16} /></div><div><div className="font-semibold text-slate-800">{driver.name}</div><div className="text-xs text-slate-400">{driver.tcNumber}</div></div></div></td><td className="px-6 py-4 text-slate-600">{driver.phone || <span className="text-slate-300 italic">Girilmeyen</span>}</td><td className="px-6 py-4"><span className="font-mono bg-slate-100 px-2 py-1 rounded text-slate-700 border border-slate-200">{driver.plateNumber || '---'}</span></td><td className="px-6 py-4 text-center text-slate-600">{driver.vehicleYear || '-'}</td><td className="px-6 py-4 text-center text-slate-600">{driver.seatCount || '-'}</td><td className="px-6 py-4"><div className="space-y-1">{driver.displayRoutes.length > 0 ? (driver.displayRoutes.map((route, idx) => (<div key={idx} className="text-xs text-slate-600 flex items-center gap-1"><MapPin size={10} className="text-orange-400" /><span className="truncate max-w-[200px]" title={route}>{route}</span></div>))) : (<span className="text-slate-300 italic text-xs">Tanımlı yok</span>)}</div></td><td className="px-6 py-4 text-center"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{driver.studentCount}</span></td><td className="px-6 py-4"><div className="flex items-center justify-center space-x-2"><button onClick={() => setEditingDriver(driver)} className="p-1.5 text-blue-500 hover:bg-blue-100 rounded-md transition-colors" title="Düzenle"><Edit size={16} /></button><button onClick={() => initiateDeleteDriver(driver.id, driver.name)} className="p-1.5 text-red-500 hover:bg-red-100 rounded-md transition-colors" title="Sil"><Trash2 size={16} /></button></div></td></tr>))}
                                    {driversData.length === 0 && (<tr><td colSpan={8} className="px-6 py-12 text-center text-slate-400">Henüz kayıtlı şoför bulunmuyor.</td></tr>)}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'routes' && (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-full flex flex-col">
                        <div className="overflow-x-auto flex-1">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200 sticky top-0 z-10">
                                    <tr><th className="px-6 py-4 w-12 bg-slate-50">#</th><th className="px-6 py-4 bg-slate-50">Güzergah Adı</th><th className="px-6 py-4 bg-slate-50">Atanan Şoför</th><th className="px-6 py-4 text-center bg-slate-50">Durum</th><th className="px-6 py-4 text-center bg-slate-50">İşlemler</th></tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {uniqueRoutes.map((route, idx) => {
                                        const assignedDriver = drivers.find(d => d.routes.includes(route) || driversData.find(dd => dd.name === d.name)?.displayRoutes.includes(route));
                                        return (<tr key={idx} className="hover:bg-slate-50 transition-colors"><td className="px-6 py-4 text-slate-400"><GripHorizontal size={16} /></td><td className="px-6 py-4 font-medium text-slate-800">{route}</td><td className="px-6 py-4">{assignedDriver ? (<div className="flex items-center space-x-2"><User size={16} className="text-emerald-500" /><span className="text-slate-700">{assignedDriver.name}</span></div>) : (<span className="text-slate-400 italic">Atanmamış</span>)}</td><td className="px-6 py-4 text-center"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Aktif</span></td><td className="px-6 py-4 text-center"><div className="flex items-center justify-center space-x-2"><button onClick={() => startEditRoute(route)} className="p-1.5 text-blue-500 hover:bg-blue-100 rounded-md transition-colors" title="Düzenle"><Edit size={16} /></button><button onClick={() => initiateDeleteRoute(route)} className="p-1.5 text-red-500 hover:bg-red-100 rounded-md transition-colors" title="Sil"><Trash2 size={16} /></button></div></td></tr>);
                                    })}
                                    {uniqueRoutes.length === 0 && (<tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">Henüz tanımlı bir güzergah bulunmuyor.</td></tr>)}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'assign' && renderBulkAssignView()}
            </div>
        </div>
    );
};
