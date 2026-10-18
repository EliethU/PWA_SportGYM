const fs = require('fs');
const path = require('path');

const raiz = path.resolve(__dirname, '..');
const existe = (ruta) => fs.existsSync(path.join(raiz, ruta));
const pkg = JSON.parse(fs.readFileSync(path.join(raiz, 'package.json'), 'utf8'));

describe('🏗️ Estructura del proyecto', () => {
  test.each([
    'index.html',
    'vite.config.js',
    'babel.config.js',
    'jest.config.js',
    'scanner.js',
    'src',
    'src/main.jsx',
    'src/App.jsx',
    'tests'
  ])('existe %s', (ruta) => {
    expect(existe(ruta)).toBe(true);
  });

  test('existe directorio de componentes', () => {
    expect(existe('src/Components')).toBe(true);
  });

  test('existe directorio de vistas', () => {
    expect(existe('src/Views')).toBe(true);
  });

  test('existe directorio de servicios', () => {
    expect(existe('src/services')).toBe(true);
  });
});

describe('📦 Dependencias principales', () => {
  test.each([
    'react',
    'react-dom',
    'firebase',
    'react-router-dom',
    'bootstrap',
    'react-bootstrap'
  ])('%s está declarada en package.json', (dep) => {
    expect(pkg.dependencies[dep]).toBeDefined();
  });

  test('Jest está instalado como dependencia de desarrollo', () => {
    expect(pkg.devDependencies['jest']).toBeDefined();
  });

  test('Babel está configurado para Jest', () => {
    expect(pkg.devDependencies['babel-jest']).toBeDefined();
    expect(pkg.devDependencies['@babel/preset-react']).toBeDefined();
  });
});

describe('🔥 Configuración de Firebase', () => {
  test('existe archivo de configuración de Firebase', () => {
    expect(existe('src/assets/database/firebaseconfig.jsx')).toBe(true);
  });

  test('el archivo de Firebase exporta las instancias necesarias', () => {
    const firebaseConfig = fs.readFileSync(
      path.join(raiz, 'src/assets/database/firebaseconfig.jsx'),
      'utf8'
    );
    expect(firebaseConfig).toContain('initializeApp');
    expect(firebaseConfig).toContain('getFirestore');
    expect(firebaseConfig).toContain('getAuth');
    expect(firebaseConfig).toContain('getStorage');
    expect(firebaseConfig).toContain('export');
  });

  test('las credenciales de Firebase están presentes', () => {
    const firebaseConfig = fs.readFileSync(
      path.join(raiz, 'src/assets/database/firebaseconfig.jsx'),
      'utf8'
    );
    expect(firebaseConfig).toContain('apiKey');
    expect(firebaseConfig).toContain('authDomain');
    expect(firebaseConfig).toContain('projectId');
    expect(firebaseConfig).toContain('storageBucket');
  });
});

describe('🗂️ Scripts de npm', () => {
  test('script "dev" está configurado', () => {
    expect(pkg.scripts.dev).toBe('vite');
  });

  test('script "build" está configurado', () => {
    expect(pkg.scripts.build).toBe('vite build');
  });

  test('script "test" está configurado para Jest', () => {
    expect(pkg.scripts.test).toBe('jest');
  });

  test('script "test:cobertura" está configurado', () => {
    expect(pkg.scripts['test:cobertura']).toBe('jest --coverage');
  });

  test('script "scan" está configurado', () => {
    expect(pkg.scripts.scan).toBe('node scanner.js');
  });
});

describe('📂 Archivos de servicios', () => {
  test.each([
    'src/services/productosService.js',
    'src/services/ventasService.js',
    'src/services/gastosService.js',
    'src/services/planesService.js',
    'src/services/reportsPdf.js',
    'src/services/asistenciasService.js',
    'src/services/inventoryStorage.js',
    'src/services/paymentInvoice.js',
    'src/services/salesInvoice.js',
    'src/services/recetaPdf.js'
  ])('existe servicio %s', (ruta) => {
    expect(existe(ruta)).toBe(true);
  });
});

describe('📂 Archivos de vistas principales', () => {
  test.each([
    'src/Views/Home.jsx',
    'src/Views/Clientes.jsx',
    'src/Views/Membresias.jsx',
    'src/Views/Inventario.jsx',
    'src/Views/Ventas.jsx',
    'src/Views/Pagos.jsx',
    'src/Views/Gastos.jsx',
    'src/Views/Analisis.jsx',
    'src/Views/Reportes.jsx'
  ])('existe vista %s', (ruta) => {
    expect(existe(ruta)).toBe(true);
  });
});

describe('📂 Archivos de componentes', () => {
  test.each([
    'src/Components/Encabezado.jsx',
    'src/Components/Modal.jsx',
    'src/Components/FacturaVenta.jsx',
    'src/Components/FacturaPago.jsx',
    'src/Components/FacturaGasto.jsx',
    'src/Components/Pagination.jsx',
    'src/Components/AdminSidebar.jsx',
    'src/Components/ProductoDetalleModal.jsx',
    'src/Components/ClientesView.jsx'
  ])('existe componente %s', (ruta) => {
    expect(existe(ruta)).toBe(true);
  });
});
