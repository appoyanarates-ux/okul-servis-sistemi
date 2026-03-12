
export interface Student {
  id: string;
  sn: number; // Sıra No (Listede kaçıncı sırada olduğu)
  studentNumber?: string; // Okul Numarası (Örn: 1234)
  schoolName: string;
  name: string;
  gender: 'KIZ' | 'ERKEK' | ''; // Boş string eklendi
  className: string; // Sınıf
  village: string; // Köy
  route: string; // Güzergah
  driver: string; // Şoför
}

export interface Driver {
  id: string;
  name: string;
  phone?: string;
  tcNumber?: string; // TC Kimlik No (Opsiyonel)
  plateNumber?: string;
  vehicleYear?: number; // Araç Yılı (Opsiyonel)
  seatCount?: number;   // Koltuk Sayısı (Opsiyonel)
  routes: string[];
}

export interface Route {
  id: string;
  name: string;
  stops: string[];
  assignedDriverId?: string;
}

export interface AppSettings {
  schoolName: string;
  province: string;
  district: string;
  educationYear: string;
  firmName: string; // Taşıma Yapan Firma Adı
  principals: string[]; // Okul Müdürleri
  vicePrincipals: string[]; // Müdür Yardımcıları
  dutyTeachers: string[]; // Nöbetçi Öğretmenler (5 gün için)
  teacherSignatures?: Record<string, string>; // Öğretmen İmzaları (Base64)
  // Harita Ayarları
  mapCenterLat?: number;
  mapCenterLng?: number;
  mapAddress?: string; // Açık Adres veya Plus Code
  villageLocations?: Record<string, { lat: number; lng: number }>; // Köy Konumları
  // Yapay Zeka
  googleApiKey?: string;
  // Hızlı Köy Listesi
  quickVillages?: string[];
}

export interface SavedPlanning {
  id: string;
  name: string;
  createdAt: string;
  students: Student[];
  drivers: Driver[];
}

export interface AppState {
  students: Student[];
  drivers: Driver[];
  routes: Route[];
}

export interface AIAnalysisResult {
  summary: string;
  insights: string[];
}
