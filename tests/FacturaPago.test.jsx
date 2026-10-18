import React from "react";
import { render, screen } from "@testing-library/react";
import FacturaPago from "../src/Components/FacturaPago";

jest.mock("../src/services/paymentInvoice.js", () => ({
  formatPaymentDate: jest.fn((date) => date || "2026-10-17"),
  formatPaymentMoney: jest.fn((amount) => `$${amount}`),
  formatPaymentTime: jest.fn(() => "10:00"),
}));

jest.mock("../src/Imagen/logo-port-gym.png.png", () => "mock-logo.png");

describe("FacturaPago", () => {
  const mockPayment = {
    id: "12345",
    numeroFactura: "PAY-001",
    fechaPago: "2026-10-17",
    fechaEmision: "2026-10-17",
    nombreCliente: "María García",
    tipoMembresia: "Mensual",
    monto: 100,
    metodoPago: "Efectivo",
  };

  test("renderiza la factura de pago con información básica", () => {
    render(<FacturaPago payment={mockPayment} />);
    expect(screen.getByText("Factura de pago")).toBeInTheDocument();
    expect(screen.getByText("PORT GYM")).toBeInTheDocument();
    expect(screen.getByText("PAY-001")).toBeInTheDocument();
    expect(screen.getByText("María García")).toBeInTheDocument();
    expect(screen.getByText("Mensual")).toBeInTheDocument();
  });

  test("renderiza el monto del pago", () => {
    render(<FacturaPago payment={mockPayment} />);
    expect(screen.getByText("Monto del pago")).toBeInTheDocument();
    expect(screen.getByText("$100")).toBeInTheDocument();
  });

  test("renderiza el método de pago", () => {
    render(<FacturaPago payment={mockPayment} />);
    expect(screen.getByText("Método de pago")).toBeInTheDocument();
    expect(screen.getByText("Efectivo")).toBeInTheDocument();
  });

  test("renderiza observaciones si están presentes", () => {
    const paymentWithNotes = { ...mockPayment, observaciones: "Pago adelantado" };
    render(<FacturaPago payment={paymentWithNotes} />);
    expect(screen.getByText("Observaciones")).toBeInTheDocument();
    expect(screen.getByText("Pago adelantado")).toBeInTheDocument();
  });

  test("no renderiza observaciones si no están presentes", () => {
    render(<FacturaPago payment={mockPayment} />);
    expect(screen.queryByText("Observaciones")).not.toBeInTheDocument();
  });

  test("renderiza el comprobante si está presente", () => {
    const paymentWithReceipt = { ...mockPayment, comprobanteUrl: "https://example.com/receipt.jpg" };
    render(<FacturaPago payment={paymentWithReceipt} />);
    expect(screen.getByAltText("Comprobante")).toBeInTheDocument();
  });

  test("no renderiza el comprobante si no está presente", () => {
    render(<FacturaPago payment={mockPayment} />);
    expect(screen.queryByAltText("Comprobante")).not.toBeInTheDocument();
  });

  test("genera número de factura si no se proporciona", () => {
    const paymentWithoutInvoiceNumber = { ...mockPayment, numeroFactura: undefined };
    render(<FacturaPago payment={paymentWithoutInvoiceNumber} />);
    expect(screen.getByText(/PAY-/)).toBeInTheDocument();
  });
});
