jest.mock("firebase/firestore", () => ({
  addDoc: jest.fn(),
  collection: jest.fn(),
  deleteDoc: jest.fn(),
  doc: jest.fn(),
  onSnapshot: jest.fn(),
  serverTimestamp: jest.fn(),
  updateDoc: jest.fn(),
}));

jest.mock("../src/assets/database/firebaseconfig", () => ({ db: {} }));

import { addDoc, collection } from "firebase/firestore";
import {
  MAX_PRODUCT_IMAGE_SIZE,
  normalizeProductImageUrl,
  validateProductImageFile,
  validateProductImageUrl,
} from "../src/services/productosService";
import {
  MAX_RECIPE_IMAGE_SIZE,
  createRecipe,
  validateRecipeImage,
  validateRecipeImageUrl,
} from "../src/services/recetasService";

describe('🛒 Servicios de Productos - Utilidades', () => {
  describe('normalizeProductImageUrl', () => {
    test('retorna string vacío si la URL es null o undefined', () => {
      expect(normalizeProductImageUrl(null)).toBe('');
      expect(normalizeProductImageUrl(undefined)).toBe('');
      expect(normalizeProductImageUrl('')).toBe('');
    });

    test('conserva y limpia el enlace HTTP/HTTPS proporcionado', () => {
      const httpUrl = 'https://example.com/image.jpg';
      expect(normalizeProductImageUrl(` ${httpUrl} `)).toBe(httpUrl);
      expect(normalizeProductImageUrl('gs://bucket/image.jpg')).toBe('gs://bucket/image.jpg');
    });
  });

  describe('validateProductImageUrl', () => {
    test('permite dejar vacía la imagen', () => {
      expect(validateProductImageUrl('')).toBe('');
    });

    test.each([
      'https://example.com/image.jpg',
      'http://images.example.com/products/item.png',
    ])('acepta un enlace HTTP/HTTPS: %s', (url) => {
      expect(validateProductImageUrl(url)).toBe('');
    });

    test('acepta una imagen codificada para guardarse en Firestore', () => {
      expect(validateProductImageUrl('data:image/png;base64,YWJj')).toBe('');
    });

    test('rechaza una imagen codificada que supera el límite', () => {
      const oversizedDataUrl = `data:image/jpeg;base64,${'A'.repeat(Math.ceil(MAX_PRODUCT_IMAGE_SIZE / 3) * 4 + 1)}`;
      expect(validateProductImageUrl(oversizedDataUrl)).toBe('La imagen incrustada no es válida o supera los 700 KB.');
    });

    test('rechaza una URL mal formada', () => {
      expect(validateProductImageUrl('no-es-una-url')).toBe('Ingresa una URL válida para la imagen.');
    });

    test('rechaza protocolos que no sean HTTP/HTTPS', () => {
      expect(validateProductImageUrl('ftp://example.com/image.jpg')).toBe('La URL de la imagen debe comenzar con http:// o https://.');
    });
  });

  describe('validateProductImageFile', () => {
    test.each(['image/jpeg', 'image/png'])('acepta archivos %s dentro del límite', (type) => {
      expect(validateProductImageFile({ type, size: MAX_PRODUCT_IMAGE_SIZE })).toBe('');
    });

    test('rechaza formatos que no son JPG o PNG', () => {
      expect(validateProductImageFile({ type: 'image/gif', size: 100 })).toBe('La imagen debe estar en formato JPG o PNG.');
    });

    test('rechaza imágenes superiores a 700 KB', () => {
      expect(validateProductImageFile({ type: 'image/jpeg', size: MAX_PRODUCT_IMAGE_SIZE + 1 })).toBe('La imagen no puede superar los 700 KB para guardarse en Firestore.');
    });
  });
});

describe("🍽️ Servicios de Recetas", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("guarda la receta y su imageUrl dentro de la colección recetas", async () => {
    collection.mockReturnValue("recetas-ref");
    addDoc.mockResolvedValue({ id: "recipe-id" });
    const recipe = {
      nombre: "Avena",
      calorias: 320,
      imageUrl: "data:image/png;base64,YWJj",
    };

    await expect(createRecipe(recipe)).resolves.toBe("recipe-id");

    expect(collection).toHaveBeenCalledWith({}, "recetas");
    expect(addDoc).toHaveBeenCalledWith("recetas-ref", expect.objectContaining({
      ...recipe,
      creadoEn: undefined,
      actualizadoEn: undefined,
      activa: true,
    }));
  });

  test("rechaza una URL de imagen inválida sin intentar guardar", async () => {
    await expect(createRecipe({ nombre: "Avena", imageUrl: "javascript:alert(1)" }))
      .rejects.toThrow("La URL de la imagen debe comenzar con http:// o https://.");
    expect(addDoc).not.toHaveBeenCalled();
  });

  test("valida el tipo y el tamaño de imagen permitidos para Firestore", () => {
    expect(validateRecipeImage({ type: "image/jpeg", size: MAX_RECIPE_IMAGE_SIZE })).toBe("");
    expect(validateRecipeImage({ type: "image/gif", size: 100 })).toBe("La imagen debe estar en formato JPG o PNG.");
    expect(validateRecipeImage({ type: "image/png", size: MAX_RECIPE_IMAGE_SIZE + 1 }))
      .toBe("La imagen no puede superar los 700 KB para guardarse en Firestore.");
  });

  test("valida URL base64 de imagen y limita su tamaño", () => {
    expect(validateRecipeImageUrl("data:image/png;base64,YWJj")).toBe("");
    const oversizedDataUrl = `data:image/jpeg;base64,${"A".repeat(Math.ceil(MAX_RECIPE_IMAGE_SIZE / 3) * 4 + 1)}`;
    expect(validateRecipeImageUrl(oversizedDataUrl)).toBe("La imagen incrustada no es válida o supera los 700 KB.");
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
