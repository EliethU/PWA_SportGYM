jest.mock("firebase/firestore", () => ({
  collection: jest.fn(() => ({})),
  onSnapshot: jest.fn(() => jest.fn()),
}));

jest.mock("firebase/functions", () => ({
  getFunctions: jest.fn(() => ({})),
  httpsCallable: jest.fn(() => jest.fn()),
}));

jest.mock("../src/assets/database/firebaseconfig", () => ({
  appfirebase: {},
  db: {},
}));

import { subscribeToAttendances, registerClientAttendance } from "../src/services/asistenciasService";

describe("📅 Asistencias Service", () => {
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
});
