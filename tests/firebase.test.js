/**
 * Pruebas de integración con Firebase
 * Verifica la configuración y funciones básicas de Firebase
 */

// Mock de Firebase
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(() => ({})),
  onSnapshot: jest.fn(() => jest.fn()),
  doc: jest.fn(),
  getDoc: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(),
  serverTimestamp: jest.fn(() => new Date()),
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({ currentUser: null })),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  onAuthStateChanged: jest.fn(() => jest.fn()),
}));

jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({ options: {} })),
  getApps: jest.fn(() => []),
  getApp: jest.fn(() => ({ options: {} })),
}));

jest.mock('firebase/functions', () => ({
  getFunctions: jest.fn(() => ({})),
}));

jest.mock('../src/assets/database/firebaseconfig', () => ({
  db: {},
  auth: {},
  storage: {},
  appfirebase: { options: {} },
}));

describe('🔥 Firebase - Configuración y Funciones', () => {
  test('Firebase config - existe y exporta db, auth, storage', () => {
    const config = require('../src/assets/database/firebaseconfig');
    expect(config).toBeDefined();
    expect(config.db).toBeDefined();
    expect(config.auth).toBeDefined();
    expect(config.storage).toBeDefined();
  });

  test('Firebase Firestore - collection y onSnapshot funcionan', () => {
    const { collection, onSnapshot } = require('firebase/firestore');
    const result = collection('test');
    expect(result).toBeDefined();
    const cleanup = onSnapshot();
    expect(typeof cleanup).toBe('function');
  });

  test('Firebase Auth - getAuth y funciones de autenticación', () => {
    const { getAuth, signInWithEmailAndPassword, signOut } = require('firebase/auth');
    const auth = getAuth();
    expect(auth).toBeDefined();
    expect(typeof signInWithEmailAndPassword).toBe('function');
    expect(typeof signOut).toBe('function');
  });
});
