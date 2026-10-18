jest.mock("firebase/firestore", () => ({
  addDoc: jest.fn(),
  collection: jest.fn(() => ({})),
  getDocs: jest.fn(),
  serverTimestamp: jest.fn(() => new Date()),
}));

jest.mock("../src/assets/database/firebaseconfig", () => ({ db: {} }));

import { obtenerPlanes, crearPlan } from "../src/services/planesService";

describe("📋 Planes Service", () => {
  test("obtenerPlanes - función existe", () => {
    expect(typeof obtenerPlanes).toBe("function");
  });

  test("crearPlan - función existe", () => {
    expect(typeof crearPlan).toBe("function");
  });
});
