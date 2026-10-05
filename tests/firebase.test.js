describe('🔥 Firebase Configuration', () => {
  test('archivo de configuración de Firebase existe', () => {
    const fs = require('fs');
    const path = require('path');
    const raiz = path.resolve(__dirname, '..');
    const existe = (ruta) => fs.existsSync(path.join(raiz, ruta));
    expect(existe('src/assets/database/firebaseconfig.jsx')).toBe(true);
  });

  test('el archivo de configuración tiene las importaciones correctas', () => {
    const fs = require('fs');
    const path = require('path');
    const raiz = path.resolve(__dirname, '..');
    const firebaseConfig = fs.readFileSync(
      path.join(raiz, 'src/assets/database/firebaseconfig.jsx'),
      'utf8'
    );
    expect(firebaseConfig).toContain('initializeApp');
    expect(firebaseConfig).toContain('getFirestore');
    expect(firebaseConfig).toContain('getAuth');
    expect(firebaseConfig).toContain('getStorage');
  });

  test('la configuración tiene las credenciales necesarias', () => {
    const fs = require('fs');
    const path = require('path');
    const raiz = path.resolve(__dirname, '..');
    const firebaseConfig = fs.readFileSync(
      path.join(raiz, 'src/assets/database/firebaseconfig.jsx'),
      'utf8'
    );
    expect(firebaseConfig).toContain('apiKey');
    expect(firebaseConfig).toContain('authDomain');
    expect(firebaseConfig).toContain('projectId');
    expect(firebaseConfig).toContain('storageBucket');
    expect(firebaseConfig).toContain('messagingSenderId');
    expect(firebaseConfig).toContain('appId');
  });
});
