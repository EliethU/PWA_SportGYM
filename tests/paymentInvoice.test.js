jest.mock("../src/Imagen/logo-port-gym.png.png", () => "mock-logo.png");

import {
  formatPaymentDate,
  formatPaymentMoney,
  formatPaymentTime,
} from "../src/services/paymentInvoice";

describe("💳 Payment Invoice Service", () => {
  describe("formatPaymentDate", () => {
    test("formatea fecha válida correctamente", () => {
      const date = new Date("2026-10-17");
      const formatted = formatPaymentDate(date);
      expect(formatted).toMatch(/de octubre de 2026/);
    });

    test("formatea fecha string ISO correctamente", () => {
      const formatted = formatPaymentDate("2026-10-17");
      expect(formatted).toMatch(/17 de octubre de 2026/);
    });

    test("retorna guión cuando la fecha es null", () => {
      const formatted = formatPaymentDate(null);
      expect(formatted).toBe("-");
    });

    test("retorna guión cuando la fecha es undefined", () => {
      const formatted = formatPaymentDate(undefined);
      expect(formatted).toBe("-");
    });

    test("retorna guión cuando la fecha es inválida", () => {
      const formatted = formatPaymentDate("fecha-invalida");
      expect(formatted).toBe("-");
    });
  });

  describe("formatPaymentMoney", () => {
    test("formatea monto numérico correctamente", () => {
      const formatted = formatPaymentMoney(100);
      expect(formatted).toContain("100");
    });

    test("formatea monto con decimales correctamente", () => {
      const formatted = formatPaymentMoney(99.99);
      expect(formatted).toMatch(/99\.99/);
    });

    test("formatea cero correctamente", () => {
      const formatted = formatPaymentMoney(0);
      expect(formatted).toContain("0");
    });

    test("maneja null correctamente", () => {
      const formatted = formatPaymentMoney(null);
      expect(formatted).toContain("0");
    });

    test("maneja undefined correctamente", () => {
      const formatted = formatPaymentMoney(undefined);
      expect(formatted).toContain("0");
    });
  });

  describe("formatPaymentTime", () => {
    test("formatea hora desde horaEmision", () => {
      const payment = { horaEmision: "10:30" };
      const formatted = formatPaymentTime(payment);
      expect(formatted).toBe("10:30");
    });

    test("formatea hora desde creadoEn con fecha válida", () => {
      const payment = { creadoEn: new Date("2026-10-17T10:30:00") };
      const formatted = formatPaymentTime(payment);
      expect(formatted).toMatch(/10:30/);
    });

    test("retorna guión cuando no hay hora disponible", () => {
      const payment = {};
      const formatted = formatPaymentTime(payment);
      expect(formatted).toBe("-");
    });

    test("retorna guión cuando creadoEn es null", () => {
      const payment = { creadoEn: null };
      const formatted = formatPaymentTime(payment);
      expect(formatted).toBe("-");
    });
  });
});
