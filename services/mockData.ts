
import { Student, Driver, AppSettings } from '../types';

export const INITIAL_STUDENTS: Student[] = [];

export const INITIAL_DRIVERS: Driver[] = [];

export const INITIAL_SETTINGS: AppSettings = {
  schoolName: 'YOĞUNOLUK İLKOKULU + YOĞUNOLUK ORTAOKULU',
  province: 'OSMANİYE',
  district: 'KADİRLİ',
  educationYear: '2025 - 2026',
  firmName: 'DOĞAN GÜNEŞ', // Varsayılan Firma
  principalName: 'Gökhan CANSEVER', // Varsayılan Müdür
  principalName2: '',
  vicePrincipal1: 'Abdullah YANARATEŞ', // Varsayılan Md Yrd
  vicePrincipal2: 'Ümmet YAĞIZ', // Varsayılan Md Yrd 2
  vicePrincipal3: '',
  vicePrincipal4: '',
  dutyTeachers: ['', '', '', '', ''], // Pzt, Sal, Çar, Per, Cum için boş başlangıç
  mapCenterLat: 37.5350,
  mapCenterLng: 36.1950,
  mapAddress: '',
  googleApiKey: ''
};
