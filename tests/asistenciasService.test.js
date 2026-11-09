jest.mock("firebase/firestore", () => ({
  collection: jest.fn((_database, name) => ({ path: name })),
  doc: jest.fn((parent, id) => ({ parent, id, path: `${parent.path}/${id}` })),
  onSnapshot: jest.fn(() => jest.fn()),
  runTransaction: jest.fn(),
  serverTimestamp: jest.fn(() => "server-timestamp"),
}));

jest.mock("../src/assets/database/firebaseconfig", () => ({
  appfirebase: {},
  db: {},
}));

import {
  subscribeToAttendances,
  registerClientAttendance,
  registerManualAttendance,
  isClientMembershipActive,
} from "../src/services/asistenciasService";
import { collection, doc, runTransaction, serverTimestamp } from "firebase/firestore";

describe("📅 Asistencias Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("subscribeToAttendances - función existe", () => {
    expect(typeof subscribeToAttendances).toBe("function");
  });

  test("subscribeToAttendances - suscripción correcta", () => {
    const onAttendances = jest.fn();
    const unsubscribe = subscribeToAttendances(onAttendances, jest.fn());

    expect(typeof unsubscribe).toBe("function");
  });

  test("registerClientAttendance - función existe", () => {
    expect(typeof registerClientAttendance).toBe("function");
  });

  test("registerClientAttendance - guarda asistencia QR del cliente autenticado", async () => {
    const transaction = {
      get: jest.fn().mockResolvedValue({ exists: () => false }),
      set: jest.fn(),
    };
    runTransaction.mockImplementation(async (_database, callback) => callback(transaction));
    const client = {
      id: "client-123",
      uid: "uid-123",
      nombre: "Ana Cliente",
      membresia: "Mensual",
      estadoPago: "pagado",
      fechaVencimiento: "2099-12-31",
    };

    const result = await registerClientAttendance(client, "uid-123");

    expect(collection).toHaveBeenCalledWith({}, "asistencias");
    expect(doc).toHaveBeenNthCalledWith(1, { path: "asistencias" }, expect.stringMatching(/_client-123$/));
    expect(doc).toHaveBeenNthCalledWith(2, { path: "asistencias" }, expect.stringMatching(/_client-123_qr$/));
    expect(transaction.get).toHaveBeenCalledTimes(3);
    expect(transaction.set).toHaveBeenCalledWith(expect.any(Object), expect.objectContaining({
      clienteId: "client-123",
      uid: "uid-123",
      registroQr: true,
      creadoEn: "server-timestamp",
    }));
    expect(transaction.set.mock.calls[0][0].id).toMatch(/_client-123_qr$/);
    expect(result).toEqual(expect.objectContaining({ alreadyRegistered: false, dateKey: expect.any(String) }));
  });

  test("registerClientAttendance - registra QR independiente si ya existe asistencia manual", async () => {
    const transaction = {
      get: jest.fn()
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({ registroManual: true, hora: "08:00" }),
        })
        .mockResolvedValueOnce({ exists: () => false })
        .mockResolvedValueOnce({ exists: () => false }),
      set: jest.fn(),
    };
    runTransaction.mockImplementation(async (_database, callback) => callback(transaction));

    const result = await registerClientAttendance({
      id: "client-123",
      uid: "uid-123",
      nombre: "Ana Cliente",
      membresia: "Mensual",
      estadoPago: "pagado",
      fechaVencimiento: "2099-12-31",
    }, "uid-123");

    expect(transaction.set).toHaveBeenCalledWith(
      expect.objectContaining({ id: expect.stringMatching(/_client-123_qr$/) }),
      expect.objectContaining({ registroQr: true }),
    );
    expect(result).toEqual(expect.objectContaining({
      alreadyRegistered: false,
      qrAfterManual: true,
    }));
  });

  test("registerClientAttendance - no duplica el registro QR", async () => {
    const transaction = {
      get: jest.fn()
        .mockResolvedValueOnce({ exists: () => false })
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({ hora: "08:30" }),
        })
        .mockResolvedValueOnce({ exists: () => false }),
      set: jest.fn(),
    };
    runTransaction.mockImplementation(async (_database, callback) => callback(transaction));

    const result = await registerClientAttendance({
      id: "client-123",
      uid: "uid-123",
      membresia: "Mensual",
      estadoPago: "pagado",
      fechaVencimiento: "2099-12-31",
    }, "uid-123");

    expect(result).toEqual(expect.objectContaining({ alreadyRegistered: true, hora: "08:30" }));
    expect(transaction.set).not.toHaveBeenCalled();
  });

  test("registerClientAttendance - rechaza una cuenta distinta a la del cliente", async () => {
    await expect(registerClientAttendance({
      id: "client-123",
      uid: "other-uid",
      membresia: "Mensual",
      estadoPago: "pagado",
    }, "uid-123")).rejects.toThrow("Esta cuenta no está vinculada al perfil de cliente.");
    expect(runTransaction).not.toHaveBeenCalled();
  });

  test("registerClientAttendance - no registra membresías vencidas", async () => {
    await expect(registerClientAttendance({
      id: "client-123",
      uid: "uid-123",
      membresia: "Mensual",
      estadoPago: "pagado",
      fechaVencimiento: "2000-01-01",
    }, "uid-123")).rejects.toThrow("Solo se puede registrar asistencia con una membresía activa.");
    expect(runTransaction).not.toHaveBeenCalled();
  });

  test("registerManualAttendance - función existe", () => {
    expect(typeof registerManualAttendance).toBe("function");
  });

  test("isClientMembershipActive - solo considera membresías pagadas y vigentes", () => {
    const now = new Date("2026-11-06T12:00:00-06:00");

    expect(isClientMembershipActive({
      membresia: "Mensual",
      estadoPago: "pagado",
      fechaVencimiento: "2026-11-06",
      estado: "Activo",
    }, now)).toBe(true);
    expect(isClientMembershipActive({
      membresia: "Mensual",
      estadoPago: "pagado",
      fechaVencimiento: "2026-11-05",
    }, now)).toBe(false);
    expect(isClientMembershipActive({
      membresia: "Mensual",
      estadoPago: "pendiente",
    }, now)).toBe(false);
    expect(isClientMembershipActive({
      estadoPago: "pagado",
    }, now)).toBe(false);
  });

  test("registerManualAttendance - guarda asistencia del cliente seleccionado", async () => {
    const transaction = {
      get: jest.fn().mockResolvedValue({ exists: () => false }),
      set: jest.fn(),
    };
    runTransaction.mockImplementation(async (_database, callback) => callback(transaction));
    const client = {
      id: "client-123",
      uid: "uid-123",
      nombre: "Ana Cliente",
      membresia: "Mensual",
      estadoPago: "pagado",
    };

    const result = await registerManualAttendance(client);

    expect(collection).toHaveBeenCalledWith({}, "asistencias");
    expect(doc).toHaveBeenNthCalledWith(1, { path: "asistencias" }, expect.stringMatching(/_client-123$/));
    expect(doc).toHaveBeenNthCalledWith(2, { path: "asistencias" }, expect.stringMatching(/_uid-123$/));
    expect(transaction.get).toHaveBeenCalledTimes(2);
    expect(transaction.set).toHaveBeenCalledWith(expect.any(Object), expect.objectContaining({
      clienteId: "client-123",
      nombre: "Ana Cliente",
      membresia: "Mensual",
      estadoMembresia: "pagado",
      registroManual: true,
      creadoEn: "server-timestamp",
    }));
    expect(serverTimestamp).toHaveBeenCalled();
    expect(result).toEqual(expect.objectContaining({ alreadyRegistered: false, dateKey: expect.any(String), hora: expect.any(String) }));
  });

  test("registerManualAttendance - no duplica si ya existe el registro", async () => {
    const transaction = {
      get: jest.fn().mockResolvedValue({ exists: () => true, data: () => ({ hora: "08:30" }) }),
      set: jest.fn(),
    };
    runTransaction.mockImplementation(async (_database, callback) => callback(transaction));

    const result = await registerManualAttendance({
      id: "client-123",
      uid: "uid-123",
      membresia: "Mensual",
      estadoPago: "pagado",
    });

    expect(result).toEqual(expect.objectContaining({ alreadyRegistered: true, hora: "08:30" }));
    expect(transaction.set).not.toHaveBeenCalled();
  });

  test("registerManualAttendance - no escribe con un identificador inválido", async () => {
    await expect(registerManualAttendance({ id: "invalid/client" })).rejects.toThrow("Selecciona un cliente válido.");
    expect(runTransaction).not.toHaveBeenCalled();
  });

  test("registerManualAttendance - rechaza clientes sin membresía activa", async () => {
    await expect(registerManualAttendance({
      id: "client-123",
      nombre: "Ana Cliente",
      membresia: "Mensual",
      estadoPago: "pendiente",
    })).rejects.toThrow("Solo se puede registrar asistencia a clientes con membresía activa.");
    expect(runTransaction).not.toHaveBeenCalled();
  });
});
