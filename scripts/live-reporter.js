const path = require('path');

// ─── Colores ────────────────────────────────────────────────
const C = {
  reset: '\x1b[0m', bold: '\x1b[1m',
  white: '\x1b[97m',   // normal
  green: '\x1b[92m',   // excelente
  yellow: '\x1b[93m',  // problemas pero bien
  red: '\x1b[91m',     // errores / malo
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

// ─── Configuración (ajústala aquí) ──────────────────────────
const NIVELES = { excelente: 80, normal: 50, problemas: 30 };
// false = los números de líneas sin cubrir salen completos, siempre en su fila
// true  = se recortan con "…" para que la tabla nunca se rompa en terminales angostas
const RECORTAR_SIN_CUBRIR = false;

const colorDe = (p) =>
  p >= NIVELES.excelente ? C.green :
  p >= NIVELES.normal ? C.white :
  p >= NIVELES.problemas ? C.yellow : C.red;

const W_NUM = 8;    // ancho de columnas numéricas
const W_DELTA = 9;  // ancho de la columna Δ

// Convierte [5,6,7,10,12,13] → "5-7,10,12-13"
function rangos(lineas) {
  const out = [];
  let ini = null, prev = null;
  const cerrar = () => out.push(ini === prev ? `${ini}` : `${ini}-${prev}`);
  for (const n of lineas) {
    if (ini === null) { ini = prev = n; }
    else if (n === prev + 1) { prev = n; }
    else { cerrar(); ini = prev = n; }
  }
  if (ini !== null) cerrar();
  return out.join(',');
}

const pctDe = (cubierto, total) => (total === 0 ? 100 : (cubierto / total) * 100);

class LiveReporter {
  constructor() {
    this.prev = {};
    this.runs = 0;
  }

  onRunComplete(_contexts, results) {
    this.runs++;
    const out = [];
    const hora = new Date().toLocaleTimeString();
    const barra = `${C.white}│${C.reset}`;

    out.push(`${C.cyan}${'═'.repeat(90)}${C.reset}`);
    out.push(`${C.white}🚀 DIAGNÓSTICO EN TIEMPO REAL  |  corrida #${this.runs}  |  ${hora}${C.reset}`);
    out.push(`${C.cyan}${'═'.repeat(90)}${C.reset}`);
    out.push(
      `${C.white}⚪ Normal (${NIVELES.normal}-${NIVELES.excelente - 1}%)${C.reset}  ` +
      `${C.green}🟢 Excelente (≥${NIVELES.excelente}%)${C.reset}  ` +
      `${C.yellow}🟡 Con problemas (${NIVELES.problemas}-${NIVELES.normal - 1}%)${C.reset}  ` +
      `${C.red}🔴 Errores/malo (<${NIVELES.problemas}%)${C.reset}`
    );
    out.push(`${C.gray}Δ = cambio en % Lines vs. la corrida anterior${C.reset}`);
    out.push('');

    // Resumen de pruebas
    const fallo = results.numFailedTests > 0;
    out.push(
      `${fallo ? C.red : C.green}Pruebas: ${results.numPassedTests} pasaron / ` +
      `${results.numFailedTests} fallaron / ${results.numTotalTests} total${C.reset}`
    );
    results.testResults.forEach((t) => {
      if (t.failureMessage) out.push(`${C.red}${t.failureMessage}${C.reset}`);
    });
    out.push('');

    const map = results.coverageMap;
    if (!map) {
      out.push(`${C.yellow}Sin datos de cobertura (¿falta --coverage?)${C.reset}`);
      console.clear();
      console.log(out.join('\n'));
      return;
    }

    // ─── Agrupar archivos por carpeta ───────────────────────
    const carpetas = {};
    map.files().forEach((f) => {
      const rel = path.relative(process.cwd(), f).split(path.sep).join('/');
      const dir = path.posix.dirname(rel);
      (carpetas[dir] = carpetas[dir] || []).push({ rel, nombre: path.posix.basename(rel), fc: map.fileCoverageFor(f) });
    });

    const filas = []; // { tipo, nombre, st, br, fn, ln, delta, unc }
    Object.keys(carpetas).sort().forEach((dir) => {
      const archivos = carpetas[dir].sort((a, b) => a.nombre.localeCompare(b.nombre));
      const t = { st: [0, 0], br: [0, 0], fn: [0, 0], ln: [0, 0] };
      archivos.forEach(({ fc }) => {
        const s = fc.toSummary();
        t.st[0] += s.statements.covered; t.st[1] += s.statements.total;
        t.br[0] += s.branches.covered;   t.br[1] += s.branches.total;
        t.fn[0] += s.functions.covered;  t.fn[1] += s.functions.total;
        t.ln[0] += s.lines.covered;      t.ln[1] += s.lines.total;
      });
      filas.push({
        tipo: 'carpeta', nombre: dir,
        st: pctDe(...t.st), br: pctDe(...t.br), fn: pctDe(...t.fn), ln: pctDe(...t.ln),
        delta: '', unc: '',
      });

      archivos.forEach(({ rel, nombre, fc }) => {
        const s = fc.toSummary();
        const ln = s.lines.pct;
        const antes = this.prev[rel];
        let delta = '=';
        if (antes !== undefined && antes !== ln) {
          const d = ln - antes;
          delta = d > 0 ? `▲ +${d.toFixed(2)}` : `▼ ${d.toFixed(2)}`;
        }
        this.prev[rel] = ln;
        const sinCubrir = rangos(fc.getUncoveredLines().map(Number).sort((a, b) => a - b));
        filas.push({
          tipo: 'archivo', nombre: '  ' + nombre,
          st: s.statements.pct, br: s.branches.pct, fn: s.functions.pct, ln,
          delta, unc: sinCubrir,
        });
      });
    });

    const g = map.getCoverageSummary();
    const global = {
      tipo: 'global', nombre: 'TODOS LOS ARCHIVOS',
      st: g.statements.pct, br: g.branches.pct, fn: g.functions.pct, ln: g.lines.pct,
      delta: '', unc: '',
    };

    // ─── Anchos de columna ──────────────────────────────────
    const wNombre = Math.min(44, Math.max(10, ...filas.concat(global).map((f) => f.nombre.length)));
    const encUnc = 'Líneas sin cubrir';
    let wUnc = Math.max(encUnc.length, ...filas.map((f) => f.unc.length));

    const fijo = 1 + (wNombre + 3) + 4 * (W_NUM + 3) + (W_DELTA + 3); // todo menos la última columna
    if (RECORTAR_SIN_CUBRIR) {
      const disponible = (process.stdout.columns || 120) - fijo - 3;
      wUnc = Math.max(encUnc.length, Math.min(wUnc, disponible));
    }

    const anchos = [wNombre, W_NUM, W_NUM, W_NUM, W_NUM, W_DELTA, wUnc];
    const linea = (izq, med, der) =>
      `${C.white}${izq}${anchos.map((w) => '─'.repeat(w + 2)).join(med)}${der}${C.reset}`;

    const celdaTxt = (txt, w, color = C.white) => {
      let t = txt;
      if (t.length > w) t = t.slice(0, w - 1) + '…';
      return `${color}${t.padEnd(w)}${C.reset}`;
    };
    const celdaNum = (p) => `${colorDe(p)}${p.toFixed(2).padStart(W_NUM)}${C.reset}`;
    const celdaDelta = (txt) => {
      const color = txt.startsWith('▲') ? C.green : txt.startsWith('▼') ? C.red : C.gray;
      return `${color}${txt.padEnd(W_DELTA)}${C.reset}`;
    };

    const fila = (f) => {
      const colorNombre = f.tipo === 'archivo' ? C.white : C.bold + C.white;
      return barra + [
        celdaTxt(f.nombre, wNombre, colorNombre),
        celdaNum(f.st), celdaNum(f.br), celdaNum(f.fn), celdaNum(f.ln),
        celdaDelta(f.delta),
        celdaTxt(f.unc, wUnc),
      ].join(barra) + barra;
    };

    // ─── Dibujar tabla (todo pegado, sin saltos extra) ──────
    out.push(linea('┌', '┬', '┐'));
    out.push(barra + [
      celdaTxt('Archivo', wNombre, C.bold + C.white),
      celdaTxt('% Stmts', W_NUM, C.bold + C.white),
      celdaTxt('% Branch', W_NUM, C.bold + C.white),
      celdaTxt('% Funcs', W_NUM, C.bold + C.white),
      celdaTxt('% Lines', W_NUM, C.bold + C.white),
      celdaTxt('Δ Lines', W_DELTA, C.bold + C.white),
      celdaTxt(encUnc, wUnc, C.bold + C.white),
    ].join(barra) + barra);
    out.push(linea('├', '┼', '┤'));
    out.push(fila(global));
    out.push(linea('├', '┼', '┤'));
    filas.forEach((f) => out.push(fila(f)));
    out.push(linea('└', '┴', '┘'));
    out.push(`${C.gray}⏱️ Guarda un archivo y se actualiza solo. Ctrl+C para salir.${C.reset}`);

    console.clear();
    console.log(out.join('\n')); // una sola impresión = filas pegadas
  }
}

module.exports = LiveReporter;
