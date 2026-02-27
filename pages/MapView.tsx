
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Student, Driver, AppSettings } from '../types';
import { MapPin, Navigation, Edit, Check, Search, Route, User, School, X, Users, GraduationCap, ChevronDown } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';

// Fix for default Leaflet icons in React
const iconPerson = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const iconStudent = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const iconSchool = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [35, 57], // Larger
    iconAnchor: [17, 57],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const iconSearch = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const iconVillage = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

interface MapViewProps {
    students: Student[];
    drivers: Driver[];
    onUpdateStudent: (student: Student) => void;
    settings: AppSettings;
    onUpdateSettings: (settings: AppSettings) => void;
}

const normalizeText = (text: string): string => {
    if (!text) return "";
    return text.toLocaleLowerCase('tr-TR')
        .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
        .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
        .replace(/[^a-z0-9]/g, '');
};

// Component to handle map centering programmatically
const MapController = ({ center, zoom, bounds }: { center?: [number, number], zoom?: number, bounds?: L.LatLngBoundsExpression }) => {
    const map = useMap();
    useEffect(() => {
        if (bounds) {
            map.fitBounds(bounds, { padding: [50, 50] });
        } else if (center) {
            map.flyTo(center, zoom || map.getZoom());
        }
    }, [center, zoom, bounds, map]);
    return null;
};

// Helper to fetch route from OSRM (Open Source Routing Machine)
const getOSRMRoute = async (start: [number, number], end: [number, number]) => {
    try {
        const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`);
        const data = await response.json();
        if (data.code === 'Ok' && data.routes && data.routes[0]) {
            return {
                coordinates: data.routes[0].geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]]), // Flip to [lat, lng]
                distance: (data.routes[0].distance / 1000).toFixed(1) + ' km',
                duration: (data.routes[0].duration / 60).toFixed(0) + ' dk'
            };
        }
        return null;
    } catch (error) {
        console.error("OSRM Error:", error);
        return null;
    }
};

export const MapView: React.FC<MapViewProps> = ({ students, drivers, onUpdateStudent, settings, onUpdateSettings }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [studentFilterTerm, setStudentFilterTerm] = useState('');
    const [isEditingLocation, setIsEditingLocation] = useState(false);
    const [isEditingVillages, setIsEditingVillages] = useState(false); // New state for village editing
    const [searchMarker, setSearchMarker] = useState<[number, number] | null>(null);

    // Student Dropdown & Edit States
    const [studentSearchTerm, setStudentSearchTerm] = useState('');
    const [isStudentDropdownOpen, setIsStudentDropdownOpen] = useState(false);
    const studentDropdownRef = useRef<HTMLDivElement>(null);
    const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
    const [tempVillageName, setTempVillageName] = useState('');

    // Analysis States
    const [viewMode, setViewMode] = useState<'driver' | 'student'>('driver');
    const [selectedDriver, setSelectedDriver] = useState<string>('');
    const [selectedStudentId, setSelectedStudentId] = useState<string>('');
    const [analysisResult, setAnalysisResult] = useState<{ distance: string, time: string, route: [number, number][] } | null>(null);
    const [mapBounds, setMapBounds] = useState<L.LatLngBoundsExpression | undefined>(undefined);

    const centerCoord: [number, number] = useMemo(() => [
        settings.mapCenterLat || 37.5350,
        settings.mapCenterLng || 36.1950
    ], [settings.mapCenterLat, settings.mapCenterLng]);

    // Filter Students for Markers (Driver Mode)
    const filteredStudents = useMemo(() => students.filter(s => {
        if (viewMode === 'driver') {
            if (selectedDriver && s.driver !== selectedDriver) return false;
        }
        if (studentFilterTerm && !s.name.toLocaleLowerCase('tr-TR').includes(studentFilterTerm.toLocaleLowerCase('tr-TR')) && !s.village.toLocaleLowerCase('tr-TR').includes(studentFilterTerm.toLocaleLowerCase('tr-TR'))) return false;
        return true;
    }), [students, selectedDriver, studentFilterTerm, viewMode]);

    // Generate simulated coordinates for students based on village hash (consistent simulation)
    const getStudentLocation = (student: Student): [number, number] => {
        // Check if village has a stored location
        if (settings.villageLocations && settings.villageLocations[student.village]) {
            const villageLoc = settings.villageLocations[student.village];
            // Add small random jitter to prevent stacking
            // Use student ID hash for consistent jitter
            let hash = 0;
            for (let i = 0; i < student.id.length; i++) hash = student.id.charCodeAt(i) + ((hash << 5) - hash);
            const jitterLat = (hash % 1000) / 500000; // Small offset ~20m
            const jitterLng = ((hash >> 1) % 1000) / 500000;
            return [villageLoc.lat + jitterLat, villageLoc.lng + jitterLng];
        }

        // Fallback to hash simulation if no location set
        const normalized = normalizeText(student.village);
        let hash = 0;
        for (let i = 0; i < normalized.length; i++) hash = normalized.charCodeAt(i) + ((hash << 5) - hash);
        const radius = 0.03 + (Math.abs(hash % 100) / 1000);
        const angle = (Math.abs(hash) % 360) * (Math.PI / 180);

        const lat = centerCoord[0] + radius * Math.cos(angle);
        const lng = centerCoord[1] + radius * Math.sin(angle);
        return [lat, lng];
    };

    // Calculate unique village locations for editing
    const villageMarkers = useMemo(() => {
        if (!isEditingVillages) return [];
        const uniqueVillages: string[] = Array.from(new Set(students.map(s => s.village).filter(Boolean)));
        return uniqueVillages.map((village: string) => {
            let position: [number, number];
            if (settings.villageLocations && settings.villageLocations[village]) {
                position = [settings.villageLocations[village].lat, settings.villageLocations[village].lng];
            } else {
                // Use the first student's simulated location as default
                const student = students.find(s => s.village === village);
                position = student ? getStudentLocation(student) : centerCoord;
            }
            return { name: village, position };
        });
    }, [students, settings.villageLocations, isEditingVillages, centerCoord]);

    const handleVillageDragEnd = (villageName: string, e: any) => {
        const marker = e.target;
        const position = marker.getLatLng();
        const newLocations = {
            ...(settings.villageLocations || {}),
            [villageName]: { lat: position.lat, lng: position.lng }
        };
        onUpdateSettings({
            ...settings,
            villageLocations: newLocations
        });
    };

    // Auto-resolve village location
    const resolveVillageLocation = async (villageName: string) => {
        if (!villageName) return;

        // Check if already exists
        if (settings.villageLocations && settings.villageLocations[villageName]) return;

        try {
            let query = villageName;
            if (settings.district && settings.province) {
                query = `${villageName}, ${settings.district}, ${settings.province}`;
            }

            // Add country for better precision
            query += ", Turkey";

            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
            const data = await response.json();

            if (data && data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lng = parseFloat(data[0].lon);

                onUpdateSettings({
                    ...settings,
                    villageLocations: {
                        ...(settings.villageLocations || {}),
                        [villageName]: { lat, lng }
                    }
                });
            }
        } catch (e) {
            console.error("Auto-resolve failed", e);
        }
    };

    // Effect to auto-resolve selected student's village
    useEffect(() => {
        if (viewMode === 'student' && selectedStudentId) {
            const student = students.find(s => s.id === selectedStudentId);
            if (student && student.village) {
                resolveVillageLocation(student.village);
            }
        }
    }, [selectedStudentId, viewMode, students, settings.villageLocations]);

    const studentMarkers = useMemo(() => {
        // If student mode, only show the selected student
        if (viewMode === 'student' && selectedStudentId) {
            const s = students.find(stu => stu.id === selectedStudentId);
            if (s) {
                const loc = getStudentLocation(s);
                return [{ ...s, lat: loc[0], lng: loc[1] }];
            }
            return [];
        }
        // If driver mode, show filtered students
        return filteredStudents.map(student => {
            const loc = getStudentLocation(student);
            return { ...student, lat: loc[0], lng: loc[1] };
        });
    }, [filteredStudents, centerCoord, viewMode, selectedStudentId, students]);

    // Calculate Route when selection changes
    useEffect(() => {
        let startPoint: [number, number] | null = null;

        if (viewMode === 'driver' && selectedDriver && studentMarkers.length > 0) {
            // Calculate route for driver (simple demo: pick first student to school)
            // In real world, this would be a multi-stop route
            startPoint = [studentMarkers[0].lat, studentMarkers[0].lng];
        } else if (viewMode === 'student' && selectedStudentId) {
            // Calculate student to school
            const sMarker = studentMarkers.find(s => s.id === selectedStudentId);
            if (sMarker) {
                startPoint = [sMarker.lat, sMarker.lng];
            }
        } else {
            setAnalysisResult(null);
            setMapBounds(undefined);
            return;
        }

        if (startPoint) {
            getOSRMRoute(startPoint, centerCoord).then(res => {
                if (res) {
                    setAnalysisResult({
                        distance: res.distance,
                        time: res.duration,
                        route: res.coordinates as [number, number][]
                    });
                    // Fit bounds to route
                    const lats = res.coordinates.map((c: any) => c[0]);
                    const lngs = res.coordinates.map((c: any) => c[1]);
                    setMapBounds([
                        [Math.min(...lats), Math.min(...lngs)],
                        [Math.max(...lats), Math.max(...lngs)]
                    ]);
                }
            });
        }
    }, [selectedDriver, selectedStudentId, viewMode, studentMarkers, centerCoord]);

    // Handle Search using Nominatim (OpenStreetMap Search)
    const handleMapSearch = async () => {
        if (!searchTerm) return;
        try {
            // Try with district/province first
            let query = searchTerm;
            if (settings.district && settings.province) {
                query = `${searchTerm}, ${settings.district}, ${settings.province}`;
            }

            let response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
            let data = await response.json();

            // If no results, try global search or just the term
            if ((!data || data.length === 0) && (settings.district || settings.province)) {
                response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchTerm)}`);
                data = await response.json();
            }

            if (data && data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lon = parseFloat(data[0].lon);
                setSearchMarker([lat, lon]);
            } else {
                alert("Konum bulunamadı.");
            }
        } catch (e) {
            alert("Arama servisine erişilemedi.");
        }
    };

    const startEditingVillage = (student: Student) => {
        setEditingStudentId(student.id);
        setTempVillageName(student.village);
    };

    const saveVillage = () => {
        if (editingStudentId) {
            const student = students.find(s => s.id === editingStudentId);
            if (student) {
                const updatedStudent = { ...student, village: tempVillageName };
                onUpdateStudent(updatedStudent);

                // Update quickVillages if new village is not in the list
                if (settings.quickVillages && !settings.quickVillages.includes(tempVillageName)) {
                    onUpdateSettings({
                        ...settings,
                        quickVillages: [...settings.quickVillages, tempVillageName].sort()
                    });
                }
            }
            setEditingStudentId(null);
        }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (studentDropdownRef.current && !studentDropdownRef.current.contains(event.target as Node)) {
                setIsStudentDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const uniqueDrivers = useMemo(() => drivers.map(d => d.name), [drivers]);
    const sortedStudents = useMemo(() => [...students].sort((a, b) => a.name.localeCompare(b.name)), [students]);

    const dropdownStudents = useMemo(() => {
        if (!studentSearchTerm) return sortedStudents;
        const lowerTerm = studentSearchTerm.toLocaleLowerCase('tr-TR');
        return sortedStudents.filter(s =>
            s.name.toLocaleLowerCase('tr-TR').includes(lowerTerm) ||
            s.village.toLocaleLowerCase('tr-TR').includes(lowerTerm)
        );
    }, [sortedStudents, studentSearchTerm]);

    const handleSchoolDragEnd = (e: any) => {
        const marker = e.target;
        const position = marker.getLatLng();
        if (isEditingLocation) {
            onUpdateSettings({
                ...settings,
                mapCenterLat: position.lat,
                mapCenterLng: position.lng
            });
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-theme(spacing.24))] relative -m-4 lg:-m-8">

            {/* Top Bar */}
            <div className="bg-white border-b border-slate-200 p-4 shadow-sm z-20 flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                    <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2 whitespace-nowrap">
                        <Route className="text-blue-600" /> Analiz
                    </h1>

                    <div className="flex bg-slate-100 rounded-lg p-1 border border-slate-200">
                        <button onClick={() => { setViewMode('driver'); setAnalysisResult(null); }} className={`px-3 py-1.5 text-xs font-medium rounded transition-colors flex items-center gap-1 ${viewMode === 'driver' ? 'bg-white shadow text-blue-700' : 'text-slate-500 hover:bg-white/50'}`}>
                            <Users size={14} /> Şoför Bazlı
                        </button>
                        <button onClick={() => { setViewMode('student'); setAnalysisResult(null); }} className={`px-3 py-1.5 text-xs font-medium rounded transition-colors flex items-center gap-1 ${viewMode === 'student' ? 'bg-white shadow text-blue-700' : 'text-slate-500 hover:bg-white/50'}`}>
                            <GraduationCap size={14} /> Öğrenci Bazlı
                        </button>
                    </div>

                    <div className="relative w-full md:w-64">
                        {viewMode === 'driver' ? (
                            <>
                                <select
                                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                                    value={selectedDriver}
                                    onChange={(e) => setSelectedDriver(e.target.value)}
                                >
                                    <option value="">Tüm Öğrencileri Göster</option>
                                    {uniqueDrivers.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                                <User className="absolute left-3 top-2.5 text-slate-400" size={16} />
                            </>
                        ) : (
                            <div ref={studentDropdownRef} className="relative">
                                <div
                                    className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-medium cursor-pointer flex items-center justify-between hover:bg-white transition-colors"
                                    onClick={() => setIsStudentDropdownOpen(!isStudentDropdownOpen)}
                                >
                                    <span className="truncate">
                                        {selectedStudentId
                                            ? sortedStudents.find(s => s.id === selectedStudentId)?.name
                                            : "Öğrenci Seçiniz..."}
                                    </span>
                                    <ChevronDown size={14} className="text-slate-400" />
                                </div>
                                <GraduationCap className="absolute left-3 top-2.5 text-slate-400" size={16} />

                                {isStudentDropdownOpen && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-[500] max-h-64 flex flex-col">
                                        <div className="p-2 border-b border-slate-100 sticky top-0 bg-white rounded-t-lg z-10">
                                            <div className="relative">
                                                <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                                                <input
                                                    type="text"
                                                    className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-blue-500 bg-slate-50"
                                                    placeholder="Öğrenci veya köy ara..."
                                                    value={studentSearchTerm}
                                                    onChange={(e) => setStudentSearchTerm(e.target.value)}
                                                    autoFocus
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </div>
                                        </div>
                                        <div className="overflow-y-auto flex-1 p-1">
                                            {dropdownStudents.length > 0 ? (
                                                dropdownStudents.map(s => (
                                                    <div
                                                        key={s.id}
                                                        className={`px-3 py-2 text-sm rounded-md cursor-pointer flex justify-between items-center ${selectedStudentId === s.id ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50 text-slate-700'}`}
                                                        onClick={() => {
                                                            setSelectedStudentId(s.id);
                                                            setIsStudentDropdownOpen(false);
                                                            setStudentSearchTerm('');
                                                        }}
                                                    >
                                                        <span className="font-medium">{s.name}</span>
                                                        <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{s.village}</span>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="p-3 text-center text-xs text-slate-400">
                                                    Sonuç bulunamadı.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    {settings.province && settings.district && (
                        <div className="hidden lg:flex items-center gap-1 text-[10px] text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-200 mr-2">
                            <MapPin size={12} />
                            <span>Bölge: <strong>{settings.province}/{settings.district}</strong></span>
                        </div>
                    )}

                    {viewMode === 'driver' && (
                        <div className="relative flex-1 md:w-48">
                            <input
                                type="text"
                                placeholder="Öğrenci Ara..."
                                className="w-full pl-8 pr-8 py-2 bg-white border border-slate-300 rounded-lg text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                value={studentFilterTerm}
                                onChange={(e) => setStudentFilterTerm(e.target.value)}
                            />
                            <User className="absolute left-2.5 top-2.5 text-slate-400" size={14} />
                            {studentFilterTerm && (
                                <button onClick={() => setStudentFilterTerm('')} className="absolute right-2 top-2 text-slate-400 hover:text-slate-600">
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                    )}

                    <div className="relative flex-1 md:w-48">
                        <input
                            type="text"
                            placeholder="Haritada Konum Ara..."
                            className="w-full pl-8 pr-8 py-2 bg-white border border-slate-300 rounded-lg text-xs outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleMapSearch()}
                        />
                        <Search className="absolute left-2.5 top-2.5 text-slate-400" size={14} />
                        {searchTerm && (
                            <button onClick={() => { setSearchTerm(''); setSearchMarker(null); }} className="absolute right-2 top-2 text-slate-400 hover:text-slate-600">
                                <X size={14} />
                            </button>
                        )}
                    </div>
                    <button
                        onClick={handleMapSearch}
                        className="bg-violet-600 text-white p-2 rounded-lg hover:bg-violet-700 transition-colors shadow-sm"
                        title="Haritada Ara"
                    >
                        <Search size={18} />
                    </button>

                    <div className="w-px h-8 bg-slate-200 mx-2"></div>

                    <button
                        onClick={() => { setIsEditingVillages(!isEditingVillages); setIsEditingLocation(false); }}
                        className={`p-2 rounded-lg border transition-colors ${isEditingVillages ? 'bg-orange-500 text-white border-orange-600' : 'bg-white text-slate-600 border-slate-200'}`}
                        title="Köy Konumlarını Düzenle"
                    >
                        <MapPin size={18} />
                    </button>

                    <button
                        onClick={() => { setIsEditingLocation(!isEditingLocation); setIsEditingVillages(false); }}
                        className={`p-2 rounded-lg border transition-colors ${isEditingLocation ? 'bg-blue-500 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200'}`}
                        title="Okul Konumunu Düzenle"
                    >
                        <School size={18} />
                    </button>
                </div>
            </div>

            {/* Map Container */}
            <div className="flex-1 relative bg-slate-100 z-0">
                <MapContainer
                    center={centerCoord}
                    zoom={12}
                    scrollWheelZoom={true}
                    style={{ height: "100%", width: "100%" }}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    <MapController center={searchMarker || centerCoord} zoom={searchMarker ? 14 : undefined} bounds={mapBounds} />

                    {/* Village Markers (Draggable) */}
                    {isEditingVillages && villageMarkers.map((village) => (
                        <Marker
                            key={village.name}
                            position={village.position}
                            icon={iconVillage}
                            draggable={true}
                            eventHandlers={{
                                dragend: (e) => handleVillageDragEnd(village.name, e)
                            }}
                        >
                            <Popup>
                                <div className="text-center">
                                    <strong>{village.name}</strong>
                                    <div className="text-xs text-slate-500 mt-1">Konumu güncellemek için sürükleyin</div>
                                </div>
                            </Popup>
                        </Marker>
                    ))}

                    {/* School Marker */}
                    <Marker
                        position={centerCoord}
                        icon={iconSchool}
                        draggable={isEditingLocation}
                        eventHandlers={{
                            dragend: handleSchoolDragEnd,
                        }}
                    >
                        <Popup>{settings.schoolName}</Popup>
                    </Marker>

                    {/* Search Marker */}
                    {searchMarker && (
                        <Marker position={searchMarker} icon={iconSearch}>
                            <Popup>{searchTerm}</Popup>
                        </Marker>
                    )}

                    {/* Student Markers */}
                    {studentMarkers.map((student) => (
                        <Marker
                            key={student.id}
                            position={[student.lat, student.lng]}
                            icon={viewMode === 'student' ? iconStudent : iconPerson}
                        >
                            <Popup>
                                <div className="text-sm min-w-[180px]">
                                    <strong className="block mb-1 text-base text-slate-800">{student.name}</strong>

                                    {editingStudentId === student.id ? (
                                        <div className="flex items-center gap-1 mt-1 mb-2">
                                            <input
                                                type="text"
                                                className="w-full px-2 py-1 text-xs border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                value={tempVillageName}
                                                onChange={(e) => setTempVillageName(e.target.value)}
                                                autoFocus
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') saveVillage();
                                                    if (e.key === 'Escape') setEditingStudentId(null);
                                                }}
                                            />
                                            <button
                                                onClick={saveVillage}
                                                className="p-1.5 bg-green-100 text-green-600 rounded hover:bg-green-200 transition-colors"
                                                title="Kaydet"
                                            >
                                                <Check size={14} />
                                            </button>
                                            <button
                                                onClick={() => setEditingStudentId(null)}
                                                className="p-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
                                                title="İptal"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between gap-2 group mb-1 p-1 -ml-1 rounded hover:bg-slate-50">
                                            <div className="flex items-center gap-1.5 text-slate-600">
                                                <MapPin size={12} className="text-slate-400" />
                                                <span>{student.village}</span>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    startEditingVillage(student);
                                                }}
                                                className="opacity-0 group-hover:opacity-100 p-1 text-blue-500 hover:bg-blue-100 rounded transition-all"
                                                title="Köyü Düzenle"
                                            >
                                                <Edit size={12} />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    resolveVillageLocation(student.village);
                                                }}
                                                className="opacity-0 group-hover:opacity-100 p-1 text-green-500 hover:bg-green-100 rounded transition-all"
                                                title="Konumu Otomatik Bul"
                                            >
                                                <Search size={12} />
                                            </button>
                                        </div>
                                    )}

                                    <div className="text-xs text-slate-500 flex items-center gap-1.5 pt-2 border-t border-slate-100">
                                        <User size={12} className="text-slate-400" />
                                        {student.driver ? (
                                            <span className="font-medium text-slate-700">{student.driver}</span>
                                        ) : (
                                            <span className="italic text-slate-400">Şoför Atanmamış</span>
                                        )}
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    ))}

                    {/* Route Line */}
                    {analysisResult && (
                        <Polyline
                            positions={analysisResult.route}
                            color="blue"
                            weight={4}
                            opacity={0.6}
                        />
                    )}

                </MapContainer>

                {/* Info Panel */}
                {analysisResult && (
                    <div className="absolute bottom-6 left-6 right-6 md:right-auto md:w-80 bg-white rounded-xl shadow-2xl p-4 z-[400] border border-slate-100 animate-slide-in-up">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-3 mb-3">
                            <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                                {viewMode === 'student' ? <GraduationCap size={20} /> : <User size={20} />}
                            </div>
                            <div>
                                <div className="text-xs text-slate-500 font-bold uppercase">
                                    {viewMode === 'student' ? 'Öğrenci Mesafesi' : 'Seçili Şoför'}
                                </div>
                                <div className="font-bold text-slate-800 text-sm truncate w-48">
                                    {viewMode === 'student'
                                        ? students.find(s => s.id === selectedStudentId)?.name
                                        : selectedDriver}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg">
                                <span className="text-xs text-slate-500 flex items-center gap-1"><School size={12} /> Mesafe</span>
                                <span className="font-black text-xl text-blue-600">{analysisResult.distance}</span>
                            </div>
                            <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg">
                                <span className="text-xs text-slate-500 flex items-center gap-1"><Navigation size={12} /> Süre</span>
                                <span className="font-bold text-slate-700">{analysisResult.time}</span>
                            </div>
                            <div className="text-xs text-slate-400 text-center">
                                (Tahmini verilerdir - OSRM)
                            </div>
                        </div>
                    </div>
                )}

                {isEditingLocation && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg z-[400] flex items-center gap-2 animate-bounce">
                        <School size={16} />
                        <span className="text-xs font-bold">Okul ikonunu doğru konuma sürükleyin</span>
                    </div>
                )}

                {isEditingVillages && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-orange-600 text-white px-4 py-2 rounded-full shadow-lg z-[400] flex items-center gap-2 animate-bounce">
                        <MapPin size={16} />
                        <span className="text-xs font-bold">Köy ikonlarını doğru konumlara sürükleyin</span>
                    </div>
                )}

                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-2 py-1 rounded text-[10px] text-slate-500 z-[400] border border-slate-200">
                    OpenStreetMap & Leaflet
                </div>
            </div>
        </div>
    );
};
