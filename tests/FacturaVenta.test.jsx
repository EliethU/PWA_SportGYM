import React from "react";
import { render, screen } from "@testing-library/react";
import FacturaVenta from "../src/Components/FacturaVenta";

jest.mock("../src/services/paymentInvoice.js", () => ({
  formatPaymentDate: jest.fn((date) => date || "2026-10-17"),
  formatPaymentMoney: jest.fn((amount) => `$${amount}`),
  formatPaymentTime: jest.fn(() => "10:00"),
}));

jest.mock("../src/Imagen/logo-port-gym.png.png", () => "mock-logo.png");

describe("FacturaVenta", () => {
  const mockSale = {
    id: "12345",
    numeroFactura: "VEN-001",
    fechaVenta: "2026-10-17",
    fechaEmision: "2026-10-17",
    nombreCliente: "Juan Pérez",
    metodoPago: "Efectivo",
    subtotal: 100,
    total: 100,
    items: [{ nombreProducto: "Proteína", cantidad: 2, precioUnitario: 50, subtotal: 100 }],
  };

  test("renderiza la factura de venta con información básica", () => {
    render(<FacturaVenta sale={mockSale} />);
    expect(screen.getByText("Factura de venta")).toBeInTheDocument();
    expect(screen.getAllByText("PORT GYM")).toHaveLength(2);
    expect(screen.getByText("VEN-001")).toBeInTheDocument();
    expect(screen.getByText("Juan Pérez")).toBeInTheDocument();
    expect(screen.getByText("Efectivo")).toBeInTheDocument();
  });

  test("renderiza los items de la venta", () => {
    render(<FacturaVenta sale={mockSale} />);
    expect(screen.getByText("Proteína")).toBeInTheDocument();
    expect(screen.getByText("$50")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getAllByText("$100")).toHaveLength(3);
  });

  test("renderiza el total pagado", () => {
    render(<FacturaVenta sale={mockSale} />);
    expect(screen.getByText("Total pagado")).toBeInTheDocument();
    expect(screen.getAllByText("$100")).toHaveLength(3);
  });

  test("renderiza observaciones si están presentes", () => {
    const saleWithNotes = { ...mockSale, observaciones: "Venta con descuento" };
    render(<FacturaVenta sale={saleWithNotes} />);
    expect(screen.getByText("Observaciones")).toBeInTheDocument();
    expect(screen.getByText("Venta con descuento")).toBeInTheDocument();
  });

  test("no renderiza observaciones si no están presentes", () => {
    render(<FacturaVenta sale={mockSale} />);
    expect(screen.queryByText("Observaciones")).not.toBeInTheDocument();
  });

  test("renderiza el mensaje de agradecimiento", () => {
    render(<FacturaVenta sale={mockSale} />);
    expect(screen.getByText("¡Gracias por tu compra!")).toBeInTheDocument();
    expect(screen.getByText("Tu compromiso con la salud nos inspira.")).toBeInTheDocument();
  });

  test("maneja diferentes estructuras de items", () => {
    const saleWithProductos = { ...mockSale, items: undefined, productos: [{ productoNombre: "Creatina", cantidad: 1, precio: 60, subTotal: 60 }] };
    render(<FacturaVenta sale={saleWithProductos} />);
    expect(screen.getByText("Creatina")).toBeInTheDocument();
  });

  test("genera número de factura si no se proporciona", () => {
    const saleWithoutInvoiceNumber = { ...mockSale, numeroFactura: undefined };
    render(<FacturaVenta sale={saleWithoutInvoiceNumber} />);
    expect(screen.getByText(/VEN-/)).toBeInTheDocument();
  });
});
