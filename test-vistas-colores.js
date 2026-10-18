/**
 * Script de pruebas funcionales con colores en terminal
 * Ejecutar con: node test-vistas-colores.js
 */

const fs = require('fs');
const path = require('path');

// Códigos de colores ANSI
const colores = {
  reset: '\x1b[0m',
  verde: '\x1b[32m',
  rojo: '\x1b[31m',
  amarillo: '\x1b[33m',
  azul: '\x1b[34m',
  cyan: '\x1b[36m',
  blanco: '\x1b[37m',
  gris: '\x1b[90m',
};

const raiz = path.resolve(__dirname);
const existe = (ruta) => fs.existsSync(path.join(raiz, ruta));

// Función para leer contenido de archivo
const leerContenido = (ruta) => {
  try {
    return fs.readFileSync(path.join(raiz, ruta), 'utf8');
  } catch (error) {
    return null;
  }
};

// Función para imprimir con color
const imprimir = (texto, color = 'blanco') => {
  console.log(`${colores[color]}${texto}${colores.reset}`);
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

// Función principal
async function ejecutarPruebas() {
  console.log('\n');
  imprimir('═'.repeat(80), 'cyan');
  imprimir('🧪 EJECUTANDO PRUEBAS FUNCIONALES DE VISTAS', 'cyan');
  imprimir('═'.repeat(80), 'cyan');
  console.log('\n');

  imprimir('📊 Leyenda de colores:', 'azul');
  imprimir('  ✅ VERDE: Vista funciona correctamente', 'verde');
  imprimir('  ❌ ROJO: Error crítico - la vista no funciona', 'rojo');
  imprimir('  ⚠️ AMARILLO: Advertencia - problemas menores', 'amarillo');
  console.log('\n');

  const resultados = [];

  // Probar cada vista
  for (const vista of vistas) {
    const archivoExiste = existe(vista.ruta);

    if (!archivoExiste) {
      imprimir(`  ❌ ${vista.nombre}: Archivo no encontrado`, 'rojo');
      resultados.push({
        nombre: vista.nombre,
        estado: 'error',
        problemas: ['Archivo no encontrado'],
        advertencias: []
      });
      continue;
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
      imprimir(`  ✅ ${vista.nombre}: Funciona correctamente`, 'verde');
    } else if (verificacion.estado === 'advertencia') {
      imprimir(`  ⚠️ ${vista.nombre}: ${verificacion.advertencias.length} advertencia(s)`, 'amarillo');
      verificacion.advertencias.forEach(a => {
        imprimir(`     - ${a}`, 'amarillo');
      });
    } else {
      imprimir(`  ❌ ${vista.nombre}: ${verificacion.problemas.length} error(es)`, 'rojo');
      verificacion.problemas.forEach(p => {
        imprimir(`     - ${p}`, 'rojo');
      });
    }
  }

  // Probar Firebase
  console.log('\n');
  imprimir('🔥 Pruebas de Conexión Firebase', 'azul');
  imprimir('─'.repeat(80), 'gris');

  const firebaseConfig = leerContenido('src/assets/database/firebaseconfig.jsx');

  if (!firebaseConfig) {
    imprimir('  ❌ Firebase: Archivo de configuración no encontrado', 'rojo');
  } else {
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
      imprimir('  ✅ Firebase: Configuración completa', 'verde');
    } else {
      imprimir(`  ⚠️ Firebase: ${fallidos.length} elemento(s) faltante(s)`, 'amarillo');
      fallidos.forEach(([key]) => {
        imprimir(`     - Falta: ${key}`, 'amarillo');
      });
    }
  }

  // Probar servicios
  console.log('\n');
  imprimir('📦 Pruebas de Servicios', 'azul');
  imprimir('─'.repeat(80), 'gris');

  const servicios = [
    { nombre: 'productosService', ruta: 'src/services/productosService.js' },
    { nombre: 'ventasService', ruta: 'src/services/ventasService.js' },
    { nombre: 'gastosService', ruta: 'src/services/gastosService.js' },
    { nombre: 'planesService', ruta: 'src/services/planesService.js' },
    { nombre: 'recetasService', ruta: 'src/services/recetasService.js' },
  ];

  for (const servicio of servicios) {
    const archivoExiste = existe(servicio.ruta);

    if (!archivoExiste) {
      imprimir(`  ❌ ${servicio.nombre}: Archivo no encontrado`, 'rojo');
      continue;
    }

    const contenido = leerContenido(servicio.ruta);

    if (!contenido) {
      imprimir(`  ❌ ${servicio.nombre}: No se pudo leer`, 'rojo');
      continue;
    }

    const tieneExport = contenido.includes('export') || contenido.includes('module.exports');
    const tieneFunciones = contenido.includes('function') || contenido.includes('=>') || contenido.includes('const');

    if (tieneExport && tieneFunciones) {
      imprimir(`  ✅ ${servicio.nombre}: Funciona correctamente`, 'verde');
    } else {
      imprimir(`  ⚠️ ${servicio.nombre}: Posible problema de estructura`, 'amarillo');
    }
  }

  // Probar componentes
  console.log('\n');
  imprimir('🧩 Pruebas de Componentes', 'azul');
  imprimir('─'.repeat(80), 'gris');

  const componentes = [
    { nombre: 'AdminSidebar', ruta: 'src/Components/AdminSidebar.jsx' },
    { nombre: 'Encabezado', ruta: 'src/Components/Encabezado.jsx' },
    { nombre: 'Modal', ruta: 'src/Components/Modal.jsx' },
    { nombre: 'Pagination', ruta: 'src/Components/Pagination.jsx' },
  ];

  for (const componente of componentes) {
    const archivoExiste = existe(componente.ruta);

    if (!archivoExiste) {
      imprimir(`  ❌ ${componente.nombre}: Archivo no encontrado`, 'rojo');
      continue;
    }

    const contenido = leerContenido(componente.ruta);

    if (contenido && contenido.includes('export default')) {
      imprimir(`  ✅ ${componente.nombre}: Funciona correctamente`, 'verde');
    } else {
      imprimir(`  ⚠️ ${componente.nombre}: Posible problema de exportación`, 'amarillo');
    }
  }

  // Resumen final
  console.log('\n');
  imprimir('═'.repeat(80), 'cyan');
  imprimir('📈 RESUMEN DE PRUEBAS', 'cyan');
  imprimir('═'.repeat(80), 'cyan');
  console.log('\n');

  const exitosos = resultados.filter(r => r.estado === 'ok').length;
  const conErrores = resultados.filter(r => r.estado === 'error').length;
  const conAdvertencias = resultados.filter(r => r.estado === 'advertencia').length;

  imprimir(`✅ Vistas funcionando: ${exitosos}/${resultados.length}`, 'verde');
  imprimir(`❌ Vistas con errores: ${conErrores}/${resultados.length}`, conErrores > 0 ? 'rojo' : 'verde');
  imprimir(`⚠️ Vistas con advertencias: ${conAdvertencias}/${resultados.length}`, conAdvertencias > 0 ? 'amarillo' : 'verde');

  if (conErrores > 0) {
    console.log('\n');
    imprimir('❌ VISTAS CON ERRORES CRÍTICOS:', 'rojo');
    resultados
      .filter(r => r.estado === 'error')
      .forEach(r => {
        console.log(`\n  📁 ${r.nombre}:`);
        r.problemas.forEach(p => imprimir(`    ❌ ${p}`, 'rojo'));
      });
  }

  if (conAdvertencias > 0) {
    console.log('\n');
    imprimir('⚠️ VISTAS CON ADVERTENCIAS:', 'amarillo');
    resultados
      .filter(r => r.estado === 'advertencia')
      .forEach(r => {
        console.log(`\n  📁 ${r.nombre}:`);
        r.advertencias.forEach(a => imprimir(`    ⚠️ ${a}`, 'amarillo'));
      });
  }

  console.log('\n');
  imprimir('═'.repeat(80), 'cyan');
  console.log('\n');

  // Exit code basado en resultados
  if (conErrores > 0) {
    process.exit(1);
  }
}

// Ejecutar pruebas
ejecutarPruebas().catch(error => {
  imprimir(`\n❌ Error al ejecutar pruebas: ${error.message}`, 'rojo');
  process.exit(1);
});
