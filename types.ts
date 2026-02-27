
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
  principalName: string; // Okul Müdürü 1
  principalName2?: string; // Okul Müdürü 2
  vicePrincipal1: string; // Müdür Yrd 1
  vicePrincipal2: string; // Müdür Yrd 2
  vicePrincipal3?: string; // Müdür Yrd 3
  vicePrincipal4?: string; // Müdür Yrd 4
  dutyTeachers: string[]; // Nöbetçi Öğretmenler (5 gün için)
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

export interface AppState {
  students: Student[];
  drivers: Driver[];
  routes: Route[];
}

export interface AIAnalysisResult {
  summary: string;
  insights: string[];
}
