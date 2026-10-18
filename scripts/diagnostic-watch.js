const { spawn } = require('child_process');
const path = require('path');

const C = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  redBright: '\x1b[91m',
  white: '\x1b[97m',
};

const jestPath = path.join(__dirname, '../node_modules/jest/bin/jest.js');

const jest = spawn(
  'node',
  [
    jestPath,
    'tests/coverage-real.test.js',
    '--coverage',
    '--colors',
    '--watchAll',
  ],
  {
    cwd: path.join(__dirname, '..'),
    stdio: ['inherit', 'pipe', 'pipe']
  }
);

function processOutput(data) {
  let output = data.toString();

  // Reemplazar todos los códigos de color rojo por blanco
  // Jest usa códigos como \x1b[31m, \x1b[91m, \x1b[31;1m, \x1b[91;1m, etc.
  output = output.replace(/\x1b\[3[19](;1)?m/g, C.white);

  process.stdout.write(output);
}

jest.stdout.on('data', processOutput);
jest.stderr.on('data', processOutput);

jest.on('close', (code) => {
  process.exit(code);
});

process.on('SIGINT', () => {
  console.log('\n🛑 Deteniendo diagnóstico...');
  jest.kill('SIGINT');
  process.exit(0);
});
