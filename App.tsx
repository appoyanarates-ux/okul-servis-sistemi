
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Students } from './pages/Students';
import { DriversRoutes } from './pages/DriversRoutes';
import { Upload } from './pages/Upload';
import { DistanceReport } from './pages/DistanceReport';
import { TransportPlanning } from './pages/TransportPlanning';
import { Reports } from './pages/Reports';
import { BackupRestore } from './pages/BackupRestore';
import { Settings } from './pages/Settings';
import { MapView } from './pages/MapView';
import { About } from './pages/About';
import { Scorecard } from './pages/Scorecard';
import { ServiceStudentList } from './pages/ServiceStudentList';
import { TransportReport } from './pages/TransportReport';
import { VehicleInspection } from './pages/VehicleInspection';
import { Student, Driver, AppSettings } from './types';
import { loadStudents, saveStudents, loadDrivers, saveDrivers, loadSettings, saveSettings } from './services/storage';

export default function App() {
  // State başlatılırken verileri LocalStorage'dan çekiyoruz
  const [students, setStudents] = useState<Student[]>(() => loadStudents());
  const [drivers, setDrivers] = useState<Driver[]>(() => loadDrivers());
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());

  // Students state'i her değiştiğinde LocalStorage'a kaydediyoruz
  useEffect(() => {
    saveStudents(students);
  }, [students]);

  // Drivers state'i her değiştiğinde LocalStorage'a kaydediyoruz
  useEffect(() => {
    saveDrivers(drivers);
  }, [drivers]);

  // Settings state'i her değiştiğinde LocalStorage'a kaydediyoruz
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const handleUploadData = (newStudents: Student[], mode: 'merge' | 'replace') => {
    // Extract unique villages and classes from new students
    const newVillages = Array.from(new Set(newStudents.map(s => s.village).filter(Boolean)));
    const newClasses = Array.from(new Set(newStudents.map(s => s.className).filter(Boolean)));

    setSettings(prev => {
        const existingVillages = prev.quickVillages || [];
        const combinedVillages = Array.from(new Set([...existingVillages, ...newVillages])).sort();

        const existingClasses = prev.quickClasses || [];
        const combinedClasses = Array.from(new Set([...existingClasses, ...newClasses])).sort();

        return { ...prev, quickVillages: combinedVillages, quickClasses: combinedClasses };
    });

    if (mode === 'replace') {
        // REPLACE MODE: Tamamen sil ve yenisini yükle
        setStudents(newStudents);

        // Şoförleri de sıfırdan oluştur
        const newDrivers = new Set(newStudents.map(s => s.driver));
        const driversToAdd: Driver[] = [];
        newDrivers.forEach(name => {
            if (name) {
                driversToAdd.push({
                    id: `d-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    name: name,
                    routes: [],
                    plateNumber: ''
                });
            }
        });
        setDrivers(driversToAdd);
    } else {
        // MERGE MODE (Geliştirilmiş Akıllı Birleştirme)
        setStudents(prev => {
            // Benzersiz Anahtar Oluşturma Fonksiyonu
            // Farklı okullarda aynı öğrenci numarası olabileceği için (örn: İlkokul 100, Ortaokul 100),
            // benzersizlik kontrolünü "İsim + Öğrenci No" kombinasyonu ile yapıyoruz.
            const generateUniqueKey = (s: Student) => {
                const nameKey = s.name.trim().toLocaleLowerCase('tr-TR');
                if (s.studentNumber && s.studentNumber.trim() !== '') {
                    return `${nameKey}_${s.studentNumber.trim()}`;
                }
                return nameKey;
            };

            const studentMap = new Map<string, Student>(
              prev.map(s => [generateUniqueKey(s), s])
            );

            newStudents.forEach(ns => {
                const key = generateUniqueKey(ns);
                const existing = studentMap.get(key);

                if (existing) {
                    // EŞLEŞME VAR: Mevcut ID'yi koru, SADECE DOLU OLAN YENİ VERİLERİ GÜNCELLE
                    // Boş gelen Excel verileri mevcut veriyi silmesin (Tahribatsız Güncelleme)
                    studentMap.set(key, {
                        id: existing.id,
                        sn: ns.sn || existing.sn,
                        studentNumber: ns.studentNumber || existing.studentNumber,
                        name: ns.name, // İsim aynıdır (normalize), ama yeni formattaki harf büyüklüğünü al
                        schoolName: ns.schoolName || existing.schoolName,
                        className: ns.className || existing.className,
                        gender: ns.gender || existing.gender,
                        village: ns.village || existing.village,
                        route: ns.route || existing.route,
                        driver: ns.driver || existing.driver
                    });
                } else {
                    // YENİ KAYIT: Listeye ekle
                    studentMap.set(key, ns);
                }
            });

            return Array.from(studentMap.values());
        });

        // Şoförleri de birleştir (Mevcutları koru, yenileri ekle)
        setDrivers(prev => {
            const existingDriverNames = new Set(prev.map(d => d.name.trim().toLocaleLowerCase('tr-TR')));
            const driversToAdd: Driver[] = [];

            newStudents.forEach(s => {
                const dName = s.driver ? s.driver.trim() : '';
                const dKey = dName.toLocaleLowerCase('tr-TR');

                if (dName && !existingDriverNames.has(dKey)) {
                     existingDriverNames.add(dKey);
                     driversToAdd.push({
                        id: `d-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        name: dName, // Orijinal ismi kullan (case koru)
                        routes: [],
                        plateNumber: ''
                    });
                }
            });

            return [...prev, ...driversToAdd];
        });
    }
  };

  const handleAddStudent = (student: Student) => {
    setStudents(prev => [...prev, student]);
  };

  const handleDeleteStudent = (id: string) => {
    setStudents(prev => prev.filter(s => s.id !== id));
  };

  const handleBulkDeleteStudents = (ids: string[]) => {
    setStudents(prev => prev.filter(s => !ids.includes(s.id)));
  };

  const handleBulkUpdateStudents = (updatedStudents: Student[]) => {
    setStudents(prev => {
      const updatedMap = new Map(updatedStudents.map(s => [s.id, s]));
      return prev.map(s => updatedMap.has(s.id) ? updatedMap.get(s.id)! : s);
    });
  };

  const handleUpdateStudent = (updatedStudent: Student) => {
    setStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
  };

  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
  };

  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard students={students} drivers={drivers} setStudents={setStudents} setDrivers={setDrivers} settings={settings} />} />
          <Route
            path="/students"
            element={
              <Students
                students={students}
                drivers={drivers}
                onDelete={handleDeleteStudent}
                onBulkDelete={handleBulkDeleteStudents}
                onBulkUpdate={handleBulkUpdateStudents}
                onUpdate={handleUpdateStudent}
                onAdd={handleAddStudent}
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
              />
            }
          />
          <Route
            path="/service-lists"
            element={
              <ServiceStudentList
                students={students}
                drivers={drivers}
                settings={settings}
              />
            }
          />
          <Route
            path="/transport-report"
            element={
              <TransportReport
                students={students}
                drivers={drivers}
                settings={settings}
              />
            }
          />
          <Route
            path="/vehicle-inspection"
            element={
              <VehicleInspection
                drivers={drivers}
                students={students}
                settings={settings}
              />
            }
          />
          <Route
            path="/drivers"
            element={
              <DriversRoutes
                students={students}
                setStudents={setStudents}
                drivers={drivers}
                setDrivers={setDrivers}
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
              />
            }
          />
          <Route
            path="/scorecard"
            element={
              <Scorecard
                students={students}
                drivers={drivers}
                settings={settings}
              />
            }
          />
          <Route
            path="/map"
            element={
              <MapView
                students={students}
                drivers={drivers}
                onUpdateStudent={handleUpdateStudent}
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
              />
            }
          />
          <Route path="/reports" element={<Reports students={students} drivers={drivers} settings={settings} />} />
          <Route path="/planning" element={<TransportPlanning students={students} drivers={drivers} settings={settings} />} />
          <Route path="/distance-report" element={<DistanceReport students={students} drivers={drivers} settings={settings} />} />
          <Route path="/upload" element={<Upload onDataLoaded={handleUploadData} students={students} drivers={drivers} />} />
          <Route path="/about" element={<About />} />
          <Route
            path="/backup"
            element={
              <BackupRestore
                students={students}
                drivers={drivers}
                setStudents={setStudents}
                setDrivers={setDrivers}
              />
            }
          />
          <Route
            path="/settings"
            element={
              <Settings
                settings={settings}
                setSettings={setSettings}
              />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
}
