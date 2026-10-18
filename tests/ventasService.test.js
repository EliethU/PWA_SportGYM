jest.mock("firebase/firestore", () => ({
  collection: jest.fn(() => ({})),
  doc: jest.fn(),
  onSnapshot: jest.fn(() => jest.fn()),
  runTransaction: jest.fn(),
  serverTimestamp: jest.fn(() => new Date()),
}));

jest.mock("../src/assets/database/firebaseconfig", () => ({ db: {} }));

import { subscribeToSales } from "../src/services/ventasService";

describe("🛒 Ventas Service", () => {
  test("subscribeToSales - función existe", () => {
    expect(typeof subscribeToSales).toBe("function");
  });

  test("subscribeToSales - suscripción correcta", () => {
    const onSales = jest.fn();
    const unsubscribe = subscribeToSales(onSales, jest.fn());

    expect(typeof unsubscribe).toBe("function");
  });
});
