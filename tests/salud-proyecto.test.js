/**
 * Pruebas de salud del proyecto
 * Verifica la integridad y funcionalidad básica del proyecto
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

// Mock de React Router
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/home' }),
}));

describe('🏥 Salud del Proyecto - Componentes Principales', () => {
  test('AdminSidebar - importación', () => {
    const { default: AdminSidebar } = require('../src/Components/AdminSidebar');
    expect(typeof AdminSidebar).toBe('function');
  });

  test('Encabezado - importación', () => {
    const { default: Encabezado } = require('../src/Components/Encabezado');
    expect(typeof Encabezado).toBe('function');
  });

  test('Pagination - importación', () => {
    const { default: Pagination } = require('../src/Components/Pagination');
    expect(typeof Pagination).toBe('function');
  });

  test('Modal - importación', () => {
    const { default: Modal } = require('../src/Components/Modal');
    expect(typeof Modal).toBe('function');
  });

  test('FacturaVenta - importación', () => {
    const { default: FacturaVenta } = require('../src/Components/FacturaVenta');
    expect(typeof FacturaVenta).toBe('function');
  });

  test('FacturaPago - importación', () => {
    const { default: FacturaPago } = require('../src/Components/FacturaPago');
    expect(typeof FacturaPago).toBe('function');
  });

  test('FacturaGasto - importación', () => {
    const { default: FacturaGasto } = require('../src/Components/FacturaGasto');
    expect(typeof FacturaGasto).toBe('function');
  });
});

describe('🏥 Salud del Proyecto - Vistas Principales', () => {
  test('Home - importación', () => {
    const { default: Home } = require('../src/Views/Home');
    expect(typeof Home).toBe('function');
  });

  test('Clientes - importación', () => {
    const { default: Clientes } = require('../src/Views/Clientes');
    expect(typeof Clientes).toBe('function');
  });

  test('Inventario - importación', () => {
    const { default: Inventario } = require('../src/Views/Inventario');
    expect(typeof Inventario).toBe('function');
  });

  test('Ventas - importación', () => {
    const { default: Ventas } = require('../src/Views/Ventas');
    expect(typeof Ventas).toBe('function');
  });

  test('Pagos - importación', () => {
    const { default: Pagos } = require('../src/Views/Pagos');
    expect(typeof Pagos).toBe('function');
  });

  test('Gastos - importación', () => {
    const { default: Gastos } = require('../src/Views/Gastos');
    expect(typeof Gastos).toBe('function');
  });

  test('Analisis - importación', () => {
    const { default: Analisis } = require('../src/Views/Analisis');
    expect(typeof Analisis).toBe('function');
  });

  test('Reportes - importación', () => {
    const { default: Reportes } = require('../src/Views/Reportes');
    expect(typeof Reportes).toBe('function');
  });

  test('Nutricion - importación', () => {
    const { default: Nutricion } = require('../src/Views/Nutricion');
    expect(typeof Nutricion).toBe('function');
  });

  test('Login - importación', () => {
    const { default: Login } = require('../src/Views/Login');
    expect(typeof Login).toBe('function');
  });

  test('Configuracion - importación', () => {
    const { default: Configuracion } = require('../src/Views/Configuracion');
    expect(typeof Configuracion).toBe('function');
  });
});

describe('🏥 Salud del Proyecto - Vistas Secundarias', () => {
  test('NuevoCliente - importación', () => {
    const { default: NuevoCliente } = require('../src/Views/NuevoCliente');
    expect(typeof NuevoCliente).toBe('function');
  });

  test('NuevoPago - importación', () => {
    const { default: NuevoPago } = require('../src/Views/NuevoPago');
    expect(typeof NuevoPago).toBe('function');
  });

  test('NuevoProducto - importación', () => {
    const { default: NuevoProducto } = require('../src/Views/NuevoProducto');
    expect(typeof NuevoProducto).toBe('function');
  });

  test('NuevaCategoria - importación', () => {
    const { default: NuevaCategoria } = require('../src/Views/NuevaCategoria');
    expect(typeof NuevaCategoria).toBe('function');
  });

  test('NuevaReceta - importación', () => {
    const { default: NuevaReceta } = require('../src/Views/NuevaReceta');
    expect(typeof NuevaReceta).toBe('function');
  });

  test('Membresias - importación', () => {
    const { default: Membresias } = require('../src/Views/Membresias');
    expect(typeof Membresias).toBe('function');
  });

  test('RegistrarGasto - importación', () => {
    const { default: RegistrarGasto } = require('../src/Views/RegistrarGasto');
    expect(typeof RegistrarGasto).toBe('function');
  });

  test('PortalCliente - importación', () => {
    const { default: PortalCliente } = require('../src/Views/PortalCliente');
    expect(typeof PortalCliente).toBe('function');
  });

  test('Terminos - importación', () => {
    const { default: Terminos } = require('../src/Views/Terminos');
    expect(typeof Terminos).toBe('function');
  });
});

describe('🏥 Salud del Proyecto - Servicios Core', () => {
  test('productosService - importación', () => {
    const service = require('../src/services/productosService');
    expect(service).toBeDefined();
    expect(typeof service.subscribeToProducts).toBe('function');
  });

  test('ventasService - importación', () => {
    const service = require('../src/services/ventasService');
    expect(service).toBeDefined();
    expect(typeof service.subscribeToSales).toBe('function');
  });

  test('gastosService - importación', () => {
    const service = require('../src/services/gastosService');
    expect(service).toBeDefined();
    expect(typeof service.subscribeToExpenses).toBe('function');
  });

  test('recetasService - importación', () => {
    const service = require('../src/services/recetasService');
    expect(service).toBeDefined();
    expect(typeof service.subscribeToRecipes).toBe('function');
  });

  test('inventoryStorage - importación', () => {
    const service = require('../src/services/inventoryStorage');
    expect(service).toBeDefined();
    expect(typeof service.getInventoryCategories).toBe('function');
  });

  test('planesService - importación', () => {
    const service = require('../src/services/planesService');
    expect(service).toBeDefined();
    expect(typeof service.obtenerPlanes).toBe('function');
  });
});

describe('🏥 Salud del Proyecto - Servicios PDF', () => {
  test('paymentInvoice - importación', () => {
    const service = require('../src/services/paymentInvoice');
    expect(service).toBeDefined();
    expect(typeof service.downloadPaymentInvoice).toBe('function');
  });

  test('salesInvoice - importación', () => {
    const service = require('../src/services/salesInvoice');
    expect(service).toBeDefined();
    expect(typeof service.downloadSaleInvoice).toBe('function');
  });

  test('recetaPdf - importación', () => {
    const service = require('../src/services/recetaPdf');
    expect(service).toBeDefined();
    expect(typeof service.downloadRecipePdf).toBe('function');
  });

  test('reportsPdf - importación', () => {
    const service = require('../src/services/reportsPdf');
    expect(service).toBeDefined();
    expect(typeof service.downloadReportPdf).toBe('function');
  });
});

describe('🏥 Salud del Proyecto - Utilidades', () => {
  test('AuthProvider - importación', () => {
    const { AuthProvider } = require('../src/assets/database/authcontext');
    expect(typeof AuthProvider).toBe('function');
  });

  test('AuthContext - tiene funciones', () => {
    const { useAuth } = require('../src/assets/database/authcontext');
    expect(typeof useAuth).toBe('function');
  });
});

describe('🏥 Salud del Proyecto - Funciones de Utilidad', () => {
  test('productosService - normalizeProductImageUrl', () => {
    const service = require('../src/services/productosService');
    expect(service.normalizeProductImageUrl(null)).toBe('');
    expect(service.normalizeProductImageUrl('')).toBe('');
    expect(service.normalizeProductImageUrl('https://example.com/img.jpg')).toBe('https://example.com/img.jpg');
  });

  test('productosService - validateProductImageUrl', () => {
    const service = require('../src/services/productosService');
    expect(service.validateProductImageUrl('')).toBe('');
    expect(service.validateProductImageUrl('https://example.com/img.jpg')).toBe('');
  });

  test('recetasService - validateRecipeImage', () => {
    const service = require('../src/services/recetasService');
    expect(service.validateRecipeImage(null)).toBe('');
    expect(service.validateRecipeImage({})).toBe('La imagen debe estar en formato JPG o PNG.');
  });

  test('recetasService - validateRecipeImageUrl', () => {
    const service = require('../src/services/recetasService');
    expect(service.validateRecipeImageUrl('')).toBe('');
  });

  test('inventoryStorage - getInventoryCategories', () => {
    const service = require('../src/services/inventoryStorage');
    const categorias = service.getInventoryCategories(['Test1', 'Test2']);
    expect(Array.isArray(categorias)).toBe(true);
    expect(categorias.length).toBeGreaterThan(0);
  });

  test('Pagination - PAGE_SIZE constante', () => {
    const { PAGE_SIZE } = require('../src/Components/Pagination');
    expect(typeof PAGE_SIZE).toBe('number');
    expect(PAGE_SIZE).toBeGreaterThan(0);
  });
});

describe('🏥 Salud del Proyecto - Integración Firebase', () => {
  test('productosService - subscribeToProducts retorna función', () => {
    const service = require('../src/services/productosService');
    const callback = jest.fn();
    const unsubscribe = service.subscribeToProducts(callback);
    expect(typeof unsubscribe).toBe('function');
  });

  test('ventasService - subscribeToSales retorna función', () => {
    const service = require('../src/services/ventasService');
    const callback = jest.fn();
    const unsubscribe = service.subscribeToSales(callback);
    expect(typeof unsubscribe).toBe('function');
  });
});
