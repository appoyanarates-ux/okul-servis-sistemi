
import { Student, Driver, AppSettings, SavedPlanning } from '../types';
import { INITIAL_STUDENTS, INITIAL_DRIVERS, INITIAL_SETTINGS } from './mockData';

const KEYS = {
  STUDENTS: 'okulservis_students_v1',
  DRIVERS: 'okulservis_drivers_v1',
  SETTINGS: 'okulservis_settings_v1',
  TRANSPORT_PLAN: 'okulservis_transport_plan_v1',
  DISTANCE_REPORT: 'okulservis_distance_report_v1',
  SAVED_PLANNINGS: 'okulservis_saved_plannings_v1'
};

export const loadStudents = (): Student[] => {
  try {
    const data = localStorage.getItem(KEYS.STUDENTS);
    if (!data) return INITIAL_STUDENTS;
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : INITIAL_STUDENTS;
  } catch (error) {
    console.error("Öğrenci verileri yüklenirken hata oluştu:", error);
    return INITIAL_STUDENTS;
  }
};

export const saveStudents = (students: Student[]) => {
  try {
    localStorage.setItem(KEYS.STUDENTS, JSON.stringify(students));
  } catch (error) {
    console.error("Öğrenci verileri kaydedilirken hata oluştu:", error);
  }
};

export const loadDrivers = (): Driver[] => {
  try {
    const data = localStorage.getItem(KEYS.DRIVERS);
    if (!data) return INITIAL_DRIVERS;
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : INITIAL_DRIVERS;
  } catch (error) {
    console.error("Şoför verileri yüklenirken hata oluştu:", error);
    return INITIAL_DRIVERS;
  }
};

export const saveDrivers = (drivers: Driver[]) => {
  try {
    localStorage.setItem(KEYS.DRIVERS, JSON.stringify(drivers));
  } catch (error) {
    console.error("Şoför verileri kaydedilirken hata oluştu:", error);
  }
};

export const loadSettings = (): AppSettings => {
  try {
    const data = localStorage.getItem(KEYS.SETTINGS);
    if (!data) return INITIAL_SETTINGS;
    const parsed = JSON.parse(data);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return INITIAL_SETTINGS;
    }
    // Merge with initial settings to ensure all fields exist if new ones are added later
    return { ...INITIAL_SETTINGS, ...parsed };
  } catch (error) {
    console.error("Ayarlar yüklenirken hata oluştu:", error);
    return INITIAL_SETTINGS;
  }
};

export const saveSettings = (settings: AppSettings) => {
  try {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  } catch (error) {
    console.error("Ayarlar kaydedilirken hata oluştu:", error);
  }
};

// --- Yeni Eklenen Depolama Fonksiyonları ---

export const loadTransportPlanData = (): Record<string, any> => {
  try {
    const data = localStorage.getItem(KEYS.TRANSPORT_PLAN);
    if (!data) return {};
    const parsed = JSON.parse(data);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return {};
    }
    return parsed;
  } catch (error) {
    return {};
  }
};

export const saveTransportPlanData = (data: Record<string, any>) => {
  try {
    localStorage.setItem(KEYS.TRANSPORT_PLAN, JSON.stringify(data));
  } catch (error) {
    console.error("Planlama verileri kaydedilemedi", error);
  }
};

export const loadDistanceReportData = (): any[] => {
  try {
    const data = localStorage.getItem(KEYS.DISTANCE_REPORT);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
};

export const saveDistanceReportData = (data: any[]) => {
  try {
    localStorage.setItem(KEYS.DISTANCE_REPORT, JSON.stringify(data));
  } catch (error) {
    console.error("Mesafe raporu kaydedilemedi", error);
  }
};

export const loadSavedPlannings = (): SavedPlanning[] => {
  try {
    const data = localStorage.getItem(KEYS.SAVED_PLANNINGS);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Kayıtlı planlamalar yüklenirken hata oluştu:", error);
    return [];
  }
};

export const saveSavedPlannings = (plannings: SavedPlanning[]) => {
  try {
    localStorage.setItem(KEYS.SAVED_PLANNINGS, JSON.stringify(plannings));
  } catch (error) {
    console.error("Kayıtlı planlamalar kaydedilirken hata oluştu:", error);
  }
};
