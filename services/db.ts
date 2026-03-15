import Dexie, { Table } from 'dexie';
import { Student, Driver, AppSettings, SavedPlanning } from '../types';

export class MyDatabase extends Dexie {
  students!: Table<Student>;
  drivers!: Table<Driver>;
  settings!: Table<AppSettings, number>; // Assuming settings is a single object
  transportPlan!: Table<any, string>; // Using route as key
  distanceReport!: Table<any, string>; // Using route as key
  savedPlannings!: Table<SavedPlanning>;

  constructor() {
    super('OkulServisDB');
    this.version(1).stores({
      students: 'id', // Assuming Student has an 'id' field
      drivers: 'id', // Assuming Driver has an 'id' field
      settings: '++id',
      transportPlan: 'route',
      distanceReport: 'route',
      savedPlannings: 'id'
    });
  }
}

export const db = new MyDatabase();
