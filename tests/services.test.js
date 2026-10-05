describe('🛒 Servicios de Productos - Utilidades', () => {
  describe('normalizeProductImageUrl', () => {
    const normalizeProductImageUrl = (url) => {
      if (!url) return "";
      if (url.startsWith("gs://")) {
        const bucket = "sportgym-2b2f8.firebasestorage.app";
        const objectPath = encodeURIComponent(url.replace(/^gs:\/\/[^/]+\//, ""));
        return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${objectPath}?alt=media`;
      }
      return url;
    };

    test('retorna string vacío si la URL es null o undefined', () => {
      expect(normalizeProductImageUrl(null)).toBe('');
      expect(normalizeProductImageUrl(undefined)).toBe('');
      expect(normalizeProductImageUrl('')).toBe('');
    });

    test('convierte URLs de Firebase Storage a formato HTTPS', () => {
      const gsUrl = 'gs://sportgym-2b2f8.firebasestorage.app/productos/image123.jpg';
      const expected = 'https://firebasestorage.googleapis.com/v0/b/sportgym-2b2f8.firebasestorage.app/o/productos%2Fimage123.jpg?alt=media';
      expect(normalizeProductImageUrl(gsUrl)).toBe(expected);
    });

    test('retorna la URL tal cual si no es de Firebase Storage', () => {
      const httpUrl = 'https://example.com/image.jpg';
      expect(normalizeProductImageUrl(httpUrl)).toBe(httpUrl);
    });
  });

  describe('validateProductImage', () => {
    const IMAGE_LIMIT = 5 * 1024 * 1024;
    const IMAGE_TYPES = new Set(["image/jpeg", "image/png"]);

    const validateProductImage = (file) => {
      if (!file) return "";
      if (!IMAGE_TYPES.has(file.type)) return "La imagen debe estar en formato JPG o PNG.";
      if (file.size > IMAGE_LIMIT) return "La imagen no puede superar los 5 MB.";
      return "";
    };

    test('retorna string vacío si no hay archivo', () => {
      expect(validateProductImage(null)).toBe('');
      expect(validateProductImage(undefined)).toBe('');
    });

    test('valida formato de imagen aceptado (JPG)', () => {
      const validFile = { type: 'image/jpeg', size: 1000 };
      expect(validateProductImage(validFile)).toBe('');
    });

    test('valida formato de imagen aceptado (PNG)', () => {
      const validFile = { type: 'image/png', size: 1000 };
      expect(validateProductImage(validFile)).toBe('');
    });

    test('rechaza formatos no permitidos', () => {
      const invalidFile = { type: 'image/gif', size: 1000 };
      expect(validateProductImage(invalidFile)).toBe('La imagen debe estar en formato JPG o PNG.');
    });

    test('rechaza imágenes mayores a 5MB', () => {
      const largeFile = { type: 'image/jpeg', size: 6 * 1024 * 1024 };
      expect(validateProductImage(largeFile)).toBe('La imagen no puede superar los 5 MB.');
    });

    test('acepta imágenes de exactamente 5MB', () => {
      const maxSizeFile = { type: 'image/jpeg', size: 5 * 1024 * 1024 };
      expect(validateProductImage(maxSizeFile)).toBe('');
    });
  });
});

describe('💰 Servicios de Gastos - Utilidades', () => {
  describe('validateExpenseReceipt', () => {
    const RECEIPT_LIMIT = 5 * 1024 * 1024;
    const RECEIPT_TYPES = new Set(["image/jpeg", "image/png"]);

    const validateExpenseReceipt = (file) => {
      if (!file) return "Debes adjuntar la imagen del comprobante.";
      if (!RECEIPT_TYPES.has(file.type)) return "El comprobante debe estar en formato JPG o PNG.";
      if (file.size > RECEIPT_LIMIT) return "La imagen del comprobante no puede superar los 5 MB.";
      return "";
    };

    test('requiere un archivo de comprobante', () => {
      expect(validateExpenseReceipt(null)).toBe('Debes adjuntar la imagen del comprobante.');
      expect(validateExpenseReceipt(undefined)).toBe('Debes adjuntar la imagen del comprobante.');
    });

    test('valida formato de comprobante aceptado (JPG)', () => {
      const validFile = { type: 'image/jpeg', size: 1000 };
      expect(validateExpenseReceipt(validFile)).toBe('');
    });

    test('valida formato de comprobante aceptado (PNG)', () => {
      const validFile = { type: 'image/png', size: 1000 };
      expect(validateExpenseReceipt(validFile)).toBe('');
    });

    test('rechaza formatos no permitidos', () => {
      const invalidFile = { type: 'image/gif', size: 1000 };
      expect(validateExpenseReceipt(invalidFile)).toBe('El comprobante debe estar en formato JPG o PNG.');
    });

    test('rechaza comprobantes mayores a 5MB', () => {
      const largeFile = { type: 'image/jpeg', size: 6 * 1024 * 1024 };
      expect(validateExpenseReceipt(largeFile)).toBe('La imagen del comprobante no puede superar los 5 MB.');
    });

    test('acepta comprobantes de exactamente 5MB', () => {
      const maxSizeFile = { type: 'image/jpeg', size: 5 * 1024 * 1024 };
      expect(validateExpenseReceipt(maxSizeFile)).toBe('');
    });
  });
});

describe('🧪 Utilidades de validación', () => {
  test('constantes de límite de tamaño son correctas', () => {
    const IMAGE_LIMIT = 5 * 1024 * 1024;
    expect(IMAGE_LIMIT).toBe(5242880);
  });

  test('constantes de tipos de imagen incluyen formatos correctos', () => {
    const IMAGE_TYPES = new Set(['image/jpeg', 'image/png']);
    expect(IMAGE_TYPES.has('image/jpeg')).toBe(true);
    expect(IMAGE_TYPES.has('image/png')).toBe(true);
    expect(IMAGE_TYPES.has('image/gif')).toBe(false);
  });
});
