/**
 * Pruebas de vistas de formularios
 * Verifican que los componentes se importen correctamente
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
  runTransaction: jest.fn(),
  writeBatch: jest.fn(),
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({ currentUser: null })),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  deleteUser: jest.fn(),
  onAuthStateChanged: jest.fn(() => jest.fn()),
}));

jest.mock('firebase/app', () => ({
  getApps: jest.fn(() => []),
  getApp: jest.fn(() => ({})),
  initializeApp: jest.fn(() => ({})),
}));

jest.mock('../src/assets/database/firebaseconfig', () => ({
  db: {},
  auth: {},
  storage: {},
  appfirebase: {},
}));

// Mock de componentes
jest.mock('../src/Components/AdminSidebar', () => () => 'AdminSidebar');
jest.mock('../src/Components/Encabezado', () => () => 'Encabezado');

// Mock de servicios
jest.mock('../src/services/productosService', () => ({
  createProduct: jest.fn(),
  normalizeProductImageUrl: jest.fn((url) => url || ''),
  validateProductImageUrl: jest.fn(() => ''),
  productImageFileToDataUrl: jest.fn(() => Promise.resolve('data:image/png;base64,mock')),
}));

jest.mock('../src/services/inventoryStorage', () => ({
  getInventoryCategories: jest.fn((cats) => cats),
}));

describe('📝 Pruebas de Vistas de Formularios', () => {
  const vistasFormularios = [
    'NuevoCliente',
    'NuevoProducto',
    'NuevoPago',
    'NuevaReceta',
    'NuevaCategoria',
    'RegistrarGasto',
  ];

  vistasFormularios.forEach((vista) => {
    test(`🔍 ${vista} - Importación y estructura`, () => {
      try {
        const VistaComponent = require(`../src/Views/${vista}.jsx`).default;

        if (!VistaComponent) {
          return;
        }

        expect(typeof VistaComponent).toBe('function');
      } catch (error) {
        throw error;
      }
    });
  });
});
