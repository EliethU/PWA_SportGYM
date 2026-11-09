const mockTransaction = {
  get: jest.fn(),
  create: jest.fn(),
};
const mockDb = {
  collection: jest.fn(),
  runTransaction: jest.fn(),
};
const mockAdminAuth = {};

jest.mock("firebase-functions/v2/https", () => ({
  onCall: jest.fn((handler) => handler),
  HttpsError: class HttpsError extends Error {
    constructor(code, message) {
      super(message);
      this.code = code;
    }
  },
}), { virtual: true });

jest.mock("firebase-admin/app", () => ({
  initializeApp: jest.fn(),
}), { virtual: true });

jest.mock("firebase-admin/auth", () => ({
  getAuth: jest.fn(() => mockAdminAuth),
}), { virtual: true });

jest.mock("firebase-admin/firestore", () => ({
  getFirestore: jest.fn(() => mockDb),
  FieldValue: { serverTimestamp: jest.fn(() => "server-timestamp") },
}), { virtual: true });

const { registrarAsistencia } = require("../functions/index");

const snapshot = (exists, data = {}) => ({
  exists,
  data: () => data,
});

describe("Cloud Function registrarAsistencia", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockDb.collection.mockImplementation((name) => {
      if (name === "usuarios") {
        return {
          doc: () => ({ get: async () => snapshot(true, { rol: "cliente", clienteId: "client-1" }) }),
        };
      }
      if (name === "clientes") {
        return {
          doc: () => ({
            get: async () => snapshot(true, {
              uid: "uid-1",
              nombre: "Ana",
              membresia: "Mensual",
              estadoPago: "pagado",
              fechaVencimiento: "2099-12-31",
            }),
          }),
        };
      }
      return {
        doc: (id) => ({ id, path: `asistencias/${id}` }),
      };
    });
    mockDb.runTransaction.mockImplementation((callback) => callback(mockTransaction));
    mockTransaction.get.mockImplementation(async (reference) => {
      if (reference.id.endsWith("_qr")) return snapshot(false);
      if (reference.id.endsWith("_client-1")) {
        return snapshot(true, { registroManual: true, hora: "08:00" });
      }
      return snapshot(false);
    });
  });

  test("registra una asistencia QR separada si ya existe un registro manual", async () => {
    const result = await registrarAsistencia({ auth: { uid: "uid-1" } });

    expect(result).toEqual(expect.objectContaining({
      alreadyRegistered: false,
      qrAfterManual: true,
    }));
    expect(mockTransaction.create).toHaveBeenCalledWith(
      expect.objectContaining({ id: expect.stringMatching(/_client-1_qr$/) }),
      expect.objectContaining({
        clienteId: "client-1",
        uid: "uid-1",
        registroQr: true,
      }),
    );
  });

  test("no permite repetir el escaneo QR después del registro manual", async () => {
    mockTransaction.get.mockImplementation(async (reference) => {
      if (reference.id.endsWith("_qr")) return snapshot(true, { hora: "08:30" });
      if (reference.id.endsWith("_client-1")) {
        return snapshot(true, { registroManual: true, hora: "08:00" });
      }
      return snapshot(false);
    });

    const result = await registrarAsistencia({ auth: { uid: "uid-1" } });

    expect(result).toEqual(expect.objectContaining({
      alreadyRegistered: true,
      hora: "08:30",
    }));
    expect(mockTransaction.create).not.toHaveBeenCalled();
  });

  test("rechaza el registro QR cuando la membresía no está pagada", async () => {
    mockDb.collection.mockImplementation((name) => {
      if (name === "usuarios") {
        return {
          doc: () => ({ get: async () => snapshot(true, { rol: "cliente", clienteId: "client-1" }) }),
        };
      }
      if (name === "clientes") {
        return {
          doc: () => ({
            get: async () => snapshot(true, {
              uid: "uid-1",
              membresia: "Mensual",
              estadoPago: "pendiente",
            }),
          }),
        };
      }
      return { doc: (id) => ({ id, path: `asistencias/${id}` }) };
    });

    await expect(registrarAsistencia({ auth: { uid: "uid-1" } }))
      .rejects.toMatchObject({ code: "permission-denied" });
    expect(mockDb.runTransaction).not.toHaveBeenCalled();
  });
});
