import React from "react";
import { render, screen } from "@testing-library/react";
import FacturaGasto from "../src/Components/FacturaGasto";

jest.mock("../src/services/paymentInvoice.js", () => ({
  formatPaymentDate: jest.fn((date) => date || "2026-10-17"),
  formatPaymentMoney: jest.fn((amount) => `$${amount}`),
  formatPaymentTime: jest.fn(() => "10:00"),
}));

jest.mock("../src/Imagen/logo-port-gym.png.png", () => "mock-logo.png");

describe("FacturaGasto", () => {
  const mockExpense = {
    id: "12345",
    numeroFactura: "GAS-001",
    fechaGasto: "2026-10-17",
    fechaEmision: "2026-10-17",
    proveedor: "Proveedor XYZ",
    categoria: "Equipamiento",
    concepto: "Compra de pesas",
    monto: 500,
    metodoPago: "Transferencia",
    estado: "Pagado",
  };

  test("renderiza la factura de gasto con información básica", () => {
    render(<FacturaGasto expense={mockExpense} />);
    expect(screen.getByText("Factura de gasto")).toBeInTheDocument();
    expect(screen.getByText("GAS-001")).toBeInTheDocument();
    expect(screen.getByText("Proveedor XYZ")).toBeInTheDocument();
    expect(screen.getByText("Equipamiento")).toBeInTheDocument();
  });

  test("renderiza el concepto del gasto", () => {
    render(<FacturaGasto expense={mockExpense} />);
    expect(screen.getByText("Concepto")).toBeInTheDocument();
    expect(screen.getByText("Compra de pesas")).toBeInTheDocument();
  });

  test("renderiza el monto del gasto", () => {
    render(<FacturaGasto expense={mockExpense} />);
    expect(screen.getByText("Total del gasto")).toBeInTheDocument();
    expect(screen.getByText("$500")).toBeInTheDocument();
  });

  test("renderiza el método de pago", () => {
    render(<FacturaGasto expense={mockExpense} />);
    expect(screen.getByText("Método de pago")).toBeInTheDocument();
    expect(screen.getByText("Transferencia")).toBeInTheDocument();
  });

  test("renderiza el estado del gasto", () => {
    render(<FacturaGasto expense={mockExpense} />);
    expect(screen.getByText("Estado")).toBeInTheDocument();
    expect(screen.getByText("Pagado")).toBeInTheDocument();
  });

  test("renderiza observaciones si están presentes", () => {
    const expenseWithNotes = { ...mockExpense, observaciones: "Gasto para mantenimiento" };
    render(<FacturaGasto expense={expenseWithNotes} />);
    expect(screen.getByText("Observaciones")).toBeInTheDocument();
    expect(screen.getByText("Gasto para mantenimiento")).toBeInTheDocument();
  });

  test("no renderiza observaciones si no están presentes", () => {
    render(<FacturaGasto expense={mockExpense} />);
    expect(screen.queryByText("Observaciones")).not.toBeInTheDocument();
  });

  test("renderiza el comprobante si está presente", () => {
    const expenseWithReceipt = { ...mockExpense, comprobanteUrl: "https://example.com/receipt.jpg" };
    render(<FacturaGasto expense={expenseWithReceipt} />);
    expect(screen.getByAltText("Comprobante")).toBeInTheDocument();
  });

  test("no renderiza el comprobante si no está presente", () => {
    render(<FacturaGasto expense={mockExpense} />);
    expect(screen.queryByAltText("Comprobante")).not.toBeInTheDocument();
  });

  test("renderiza el footer del comprobante", () => {
    render(<FacturaGasto expense={mockExpense} />);
    expect(screen.getByText("Comprobante de gasto")).toBeInTheDocument();
    expect(screen.getAllByText("PORT GYM")).toHaveLength(2);
  });

  test("genera número de factura si no se proporciona", () => {
    const expenseWithoutInvoiceNumber = { ...mockExpense, numeroFactura: undefined };
    render(<FacturaGasto expense={expenseWithoutInvoiceNumber} />);
    expect(screen.getByText(/GAS-/)).toBeInTheDocument();
  });
});
