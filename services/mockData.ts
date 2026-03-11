
import { Student, Driver, AppSettings } from '../types';

export const INITIAL_STUDENTS: Student[] = [];

export const INITIAL_DRIVERS: Driver[] = [];

export const INITIAL_SETTINGS: AppSettings = {
  schoolName: 'YOĞUNOLUK İLKOKULU + YOĞUNOLUK ORTAOKULU',
  province: 'OSMANİYE',
  district: 'KADİRLİ',
  educationYear: '2025 - 2026',
  firmName: 'DOĞAN GÜNEŞ', // Varsayılan Firma
  principals: ['Gökhan CANSEVER'],
  vicePrincipals: ['Abdullah YANARATEŞ', 'Ümmet YAĞIZ'],
  dutyTeachers: ['', '', '', '', ''], // Pzt, Sal, Çar, Per, Cum için boş başlangıç
  mapCenterLat: 37.5350,
  mapCenterLng: 36.1950,
  mapAddress: '',
  googleApiKey: ''
};
