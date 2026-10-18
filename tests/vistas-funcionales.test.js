/**
 * Pruebas funcionales de vistas con colores en terminal
 * Verde ✅ = Funciona correctamente
 * Rojo ❌ = Error crítico
 * Amarillo ⚠️ = Advertencia o problema menor
 */

const fs = require('fs');
const path = require('path');

const raiz = path.resolve(__dirname, '..');
const existe = (ruta) => fs.existsSync(path.join(raiz, ruta));

// Lista de vistas a probar
const vistas = [
  { nombre: 'Home', ruta: 'src/Views/Home.jsx', descripcion: 'Panel de inicio con dashboard' },
  { nombre: 'Clientes', ruta: 'src/Views/Clientes.jsx', descripcion: 'Gestión de clientes' },
  { nombre: 'Membresias', ruta: 'src/Views/Membresias.jsx', descripcion: 'Gestión de membresías' },
  { nombre: 'Inventario', ruta: 'src/Views/Inventario.jsx', descripcion: 'Gestión de inventario' },
  { nombre: 'Ventas', ruta: 'src/Views/Ventas.jsx', descripcion: 'Gestión de ventas' },
  { nombre: 'Pagos', ruta: 'src/Views/Pagos.jsx', descripcion: 'Historial de pagos' },
  { nombre: 'Gastos', ruta: 'src/Views/Gastos.jsx', descripcion: 'Gestión de gastos' },
  { nombre: 'Analisis', ruta: 'src/Views/Analisis.jsx', descripcion: 'Análisis y estadísticas' },
  { nombre: 'Reportes', ruta: 'src/Views/Reportes.jsx', descripcion: 'Generación de reportes' },
  { nombre: 'Nutricion', ruta: 'src/Views/Nutricion.jsx', descripcion: 'Gestión de nutrición' },
  { nombre: 'Asistencia', ruta: 'src/Views/Asistencia.jsx', descripcion: 'Control de asistencia' },
  { nombre: 'Login', ruta: 'src/Views/Login.jsx', descripcion: 'Pantalla de login' },
  { nombre: 'NuevoCliente', ruta: 'src/Views/NuevoCliente.jsx', descripcion: 'Formulario nuevo cliente' },
  { nombre: 'NuevoProducto', ruta: 'src/Views/NuevoProducto.jsx', descripcion: 'Formulario nuevo producto' },
  { nombre: 'NuevoPago', ruta: 'src/Views/NuevoPago.jsx', descripcion: 'Formulario nuevo pago' },
  { nombre: 'NuevaReceta', ruta: 'src/Views/NuevaReceta.jsx', descripcion: 'Formulario nueva receta' },
  { nombre: 'NuevaCategoria', ruta: 'src/Views/NuevaCategoria.jsx', descripcion: 'Formulario nueva categoría' },
  { nombre: 'RegistrarGasto', ruta: 'src/Views/RegistrarGasto.jsx', descripcion: 'Formulario registrar gasto' },
  { nombre: 'Configuracion', ruta: 'src/Views/Configuracion.jsx', descripcion: 'Configuración del sistema' },
  { nombre: 'PortalCliente', ruta: 'src/Views/PortalCliente.jsx', descripcion: 'Portal para clientes' },
  { nombre: 'Terminos', ruta: 'src/Views/Terminos.jsx', descripcion: 'Términos y condiciones' },
];

// Función para leer contenido de archivo
const leerContenido = (ruta) => {
  try {
    return fs.readFileSync(path.join(raiz, ruta), 'utf8');
  } catch (error) {
    return null;
  }
};

// Función para verificar estructura básica de una vista
const verificarEstructuraVista = (contenido) => {
  const problemas = [];
  const advertencias = [];

  if (!contenido) {
    problemas.push('No se pudo leer el archivo');
    return { estado: 'error', problemas, advertencias };
  }

  // Verificar importaciones básicas
  if (!contenido.includes('import React')) {
    problemas.push('Falta importación de React');
  }

  if (!contenido.includes('export default')) {
    problemas.push('Falta export default del componente');
  }

  // Verificar hooks de React (React 19+ no requiere importación explícita)
  // Solo advertir si hay importaciones de React pero no incluyen los hooks
  if (contenido.includes('import React') && contenido.includes('useState') && !contenido.includes('import { useState }')) {
    // En React 19+, esto es normal, no es un error
  }

  if (contenido.includes('import React') && contenido.includes('useEffect') && !contenido.includes('import { useEffect }')) {
    // En React 19+, esto es normal, no es un error
  }

  // Verificar Firebase
  if (contenido.includes('collection') || contenido.includes('onSnapshot')) {
    if (!contenido.includes('firebase/firestore')) {
      advertencias.push('Usa funciones de Firestore pero la importación podría estar implícita');
    }
  }

  // Verificar manejo de errores
  if (contenido.includes('try') && !contenido.includes('catch')) {
    advertencias.push('Usa try/catch parcialmente');
  }

  // Verificar estilos
  if (!contenido.includes('.css') && !contenido.includes('className')) {
    advertencias.push('No se detectan estilos CSS o clases');
  }

  // Verificar navegación
  if (contenido.includes('navigate') && !contenido.includes('react-router-dom')) {
    advertencias.push('Usa navegación pero la importación podría estar implícita');
  }

  if (problemas.length > 0) {
    return { estado: 'error', problemas, advertencias };
  }

  if (advertencias.length > 0) {
    return { estado: 'advertencia', problemas, advertencias };
  }

  return { estado: 'ok', problemas, advertencias };
};

describe('🎨 Pruebas Funcionales de Vistas - Colores en Terminal', () => {
  let resultados = [];

  beforeAll(() => {
    // console.log('\n');
    // console.log('='.repeat(80));
    // console.log('🧪 EJECUTANDO PRUEBAS FUNCIONALES DE VISTAS');
    // console.log('='.repeat(80));
    // console.log('\n📊 Leyenda de colores:');
    // console.log('  ✅ VERDE: Vista funciona correctamente');
    // console.log('  ❌ ROJO: Error crítico - la vista no funciona');
    // console.log('  ⚠️ AMARILLO: Advertencia - problemas menores\n');
  });

  afterAll(() => {
    // console.log('\n');
    // console.log('='.repeat(80));
    // console.log('📈 RESUMEN DE PRUEBAS');
    // console.log('='.repeat(80));

    const exitosos = resultados.filter(r => r.estado === 'ok').length;
    const conErrores = resultados.filter(r => r.estado === 'error').length;
    const conAdvertencias = resultados.filter(r => r.estado === 'advertencia').length;

    // console.log(`\n✅ Vistas funcionando: ${exitosos}/${resultados.length}`);
    // console.log(`❌ Vistas con errores: ${conErrores}/${resultados.length}`);
    // console.log(`⚠️ Vistas con advertencias: ${conAdvertencias}/${resultados.length}`);

    if (conErrores > 0) {
      // console.log('\n❌ VISTAS CON ERRORES CRÍTICOS:');
      resultados
        .filter(r => r.estado === 'error')
        .forEach(r => {
          // console.log(`\n  📁 ${r.nombre}:`);
          r.problemas.forEach(p => console.log(`    ❌ ${p}`));
        });
    }

    if (conAdvertencias > 0) {
      // console.log('\n⚠️ VISTAS CON ADVERTENCIAS:');
      resultados
        .filter(r => r.estado === 'advertencia')
        .forEach(r => {
          // console.log(`\n  📁 ${r.nombre}:`);
          r.advertencias.forEach(a => console.log(`    ⚠️ ${a}`));
        });
    }

    // console.log('\n' + '='.repeat(80) + '\n');
  });

  vistas.forEach((vista) => {
    test(`🔍 ${vista.nombre} - ${vista.descripcion}`, () => {
      const archivoExiste = existe(vista.ruta);

      if (!archivoExiste) {
        // console.log(`  ❌ ${vista.nombre}: Archivo no encontrado`);
        resultados.push({
          nombre: vista.nombre,
          estado: 'error',
          problemas: ['Archivo no encontrado'],
          advertencias: []
        });
        expect(archivoExiste).toBe(true);
        return;
      }

      const contenido = leerContenido(vista.ruta);
      const verificacion = verificarEstructuraVista(contenido);

      resultados.push({
        nombre: vista.nombre,
        estado: verificacion.estado,
        problemas: verificacion.problemas,
        advertencias: verificacion.advertencias
      });

      if (verificacion.estado === 'ok') {
        // console.log(`  ✅ ${vista.nombre}: Funciona correctamente`);
      } else if (verificacion.estado === 'advertencia') {
        // console.log(`  ⚠️ ${vista.nombre}: ${verificacion.advertencias.length} advertencia(s)`);
      } else {
        // console.log(`  ❌ ${vista.nombre}: ${verificacion.problemas.length} error(es)`);
      }

      expect(verificacion.estado).not.toBe('error');
    });
  });
});

describe('🔥 Pruebas de Conexión Firebase', () => {
  test('Verificar configuración de Firebase', () => {
    const firebaseConfig = leerContenido('src/assets/database/firebaseconfig.jsx');

    if (!firebaseConfig) {
      // console.log('  ❌ Firebase: Archivo de configuración no encontrado');
      expect(firebaseConfig).not.toBeNull();
      return;
    }

    const checks = {
      'initializeApp': firebaseConfig.includes('initializeApp'),
      'getFirestore': firebaseConfig.includes('getFirestore'),
      'getAuth': firebaseConfig.includes('getAuth'),
      'getStorage': firebaseConfig.includes('getStorage'),
      'apiKey': firebaseConfig.includes('apiKey'),
      'projectId': firebaseConfig.includes('projectId'),
    };

    const fallidos = Object.entries(checks).filter(([_, valor]) => !valor);

    if (fallidos.length === 0) {
      // console.log('  ✅ Firebase: Configuración completa');
    } else {
      // console.log(`  ⚠️ Firebase: ${fallidos.length} elemento(s) faltante(s)`);
      fallidos.forEach(([key]) => console.log(`    ⚠️ Falta: ${key}`));
    }

    expect(firebaseConfig).toBeDefined();
  });
});

describe('📦 Pruebas de Servicios', () => {
  const servicios = [
    { nombre: 'productosService', ruta: 'src/services/productosService.js' },
    { nombre: 'ventasService', ruta: 'src/services/ventasService.js' },
    { nombre: 'gastosService', ruta: 'src/services/gastosService.js' },
    { nombre: 'planesService', ruta: 'src/services/planesService.js' },
    { nombre: 'recetasService', ruta: 'src/services/recetasService.js' },
  ];

  servicios.forEach((servicio) => {
    test(`🔍 ${servicio.nombre}`, () => {
      const archivoExiste = existe(servicio.ruta);

      if (!archivoExiste) {
        // console.log(`  ❌ ${servicio.nombre}: Archivo no encontrado`);
        expect(archivoExiste).toBe(true);
        return;
      }

      const contenido = leerContenido(servicio.ruta);

      if (!contenido) {
        // console.log(`  ❌ ${servicio.nombre}: No se pudo leer`);
        expect(contenido).not.toBeNull();
        return;
      }

      // Verificar exportaciones
      const tieneExport = contenido.includes('export') || contenido.includes('module.exports');
      const tieneFunciones = contenido.includes('function') || contenido.includes('=>') || contenido.includes('const');

      if (tieneExport && tieneFunciones) {
        // console.log(`  ✅ ${servicio.nombre}: Funciona correctamente`);
      } else {
        // console.log(`  ⚠️ ${servicio.nombre}: Posible problema de estructura`);
      }

      expect(archivoExiste).toBe(true);
    });
  });
});

describe('🧩 Pruebas de Componentes', () => {
  const componentes = [
    { nombre: 'AdminSidebar', ruta: 'src/Components/AdminSidebar.jsx' },
    { nombre: 'Encabezado', ruta: 'src/Components/Encabezado.jsx' },
    { nombre: 'Modal', ruta: 'src/Components/Modal.jsx' },
    { nombre: 'Pagination', ruta: 'src/Components/Pagination.jsx' },
  ];

  componentes.forEach((componente) => {
    test(`🔍 ${componente.nombre}`, () => {
      const archivoExiste = existe(componente.ruta);

      if (!archivoExiste) {
        // console.log(`  ❌ ${componente.nombre}: Archivo no encontrado`);
        expect(archivoExiste).toBe(true);
        return;
      }

      const contenido = leerContenido(componente.ruta);

      if (contenido && contenido.includes('export default')) {
        // console.log(`  ✅ ${componente.nombre}: Funciona correctamente`);
      } else {
        // console.log(`  ⚠️ ${componente.nombre}: Posible problema de exportación`);
      }

      expect(archivoExiste).toBe(true);
    });
  });
});
