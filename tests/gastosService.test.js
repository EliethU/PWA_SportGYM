jest.mock("firebase/firestore", () => ({
  addDoc: jest.fn(),
  collection: jest.fn(() => ({})),
  doc: jest.fn(),
  onSnapshot: jest.fn(() => jest.fn()),
  serverTimestamp: jest.fn(() => new Date()),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
}));

jest.mock("firebase/storage", () => ({
  deleteObject: jest.fn(),
  getDownloadURL: jest.fn(),
  ref: jest.fn(),
  uploadBytes: jest.fn(),
}));

jest.mock("../src/assets/database/firebaseconfig", () => ({
  db: {},
  storage: {},
}));

import {
  subscribeToExpenses,
  subscribeToExpenseCategories,
  subscribeToExpenseProviders,
  validateExpenseReceipt,
} from "../src/services/gastosService";

describe("💰 Gastos Service", () => {
  describe("validateExpenseReceipt", () => {
    test("requiere un archivo de comprobante", () => {
      expect(validateExpenseReceipt(null)).toBe("Debes adjuntar la imagen del comprobante.");
      expect(validateExpenseReceipt(undefined)).toBe("Debes adjuntar la imagen del comprobante.");
    });

    test("valida formato de comprobante aceptado (JPG)", () => {
      const validFile = { type: "image/jpeg", size: 1000 };
      expect(validateExpenseReceipt(validFile)).toBe("");
    });

    test("valida formato de comprobante aceptado (PNG)", () => {
      const validFile = { type: "image/png", size: 1000 };
      expect(validateExpenseReceipt(validFile)).toBe("");
    });

    test("rechaza formatos no permitidos", () => {
      const invalidFile = { type: "image/gif", size: 1000 };
      expect(validateExpenseReceipt(invalidFile)).toBe("El comprobante debe estar en formato JPG o PNG.");
    });

    test("rechaza comprobantes mayores a 5MB", () => {
      const largeFile = { type: "image/jpeg", size: 6 * 1024 * 1024 };
      expect(validateExpenseReceipt(largeFile)).toBe("La imagen del comprobante no puede superar los 5 MB.");
    });

    test("acepta comprobantes de exactamente 5MB", () => {
      const maxSizeFile = { type: "image/jpeg", size: 5 * 1024 * 1024 };
      expect(validateExpenseReceipt(maxSizeFile)).toBe("");
    });
  });

  test("subscribeToExpenses - función existe", () => {
    expect(typeof subscribeToExpenses).toBe("function");
  });

  test("subscribeToExpenses - suscripción correcta", () => {
    const onExpenses = jest.fn();
    const unsubscribe = subscribeToExpenses(onExpenses, jest.fn());

    expect(typeof unsubscribe).toBe("function");
  });

  test("subscribeToExpenseCategories - función existe", () => {
    expect(typeof subscribeToExpenseCategories).toBe("function");
  });

  test("subscribeToExpenseProviders - función existe", () => {
    expect(typeof subscribeToExpenseProviders).toBe("function");
  });
});
