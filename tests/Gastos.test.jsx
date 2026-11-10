import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import Gastos from "../src/Views/Gastos";
import { subscribeToExpenses, updateExpense } from "../src/services/gastosService";

jest.mock("react-router-dom", () => ({
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: "/gastos", state: null }),
}));

jest.mock("../src/Components/AdminSidebar", () => () => <nav />);
jest.mock("../src/Components/Encabezado", () => ({ title }) => <h1>{title}</h1>);
jest.mock("../src/services/gastosService", () => ({
  markExpenseAsPaid: jest.fn(),
  subscribeToExpenses: jest.fn(),
  updateExpense: jest.fn(),
}));

describe("Gastos", () => {
  const today = new Date();
  const localToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const expense = {
    id: "expense-1",
    fecha: localToday,
    concepto: "Mantenimiento",
    categoria: "Servicios",
    proveedor: "Proveedor Uno",
    monto: 250,
    estado: "Pendiente",
    metodo: "Efectivo",
    observaciones: "Revisión mensual",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    subscribeToExpenses.mockImplementation((onExpenses) => {
      onExpenses([expense]);
      return jest.fn();
    });
    updateExpense.mockResolvedValue(undefined);
  });

  test("permite editar un gasto desde las acciones de la tabla", async () => {
    render(<Gastos />);

    fireEvent.click(await screen.findByRole("button", { name: "Editar Mantenimiento" }));
    expect(screen.getByRole("dialog", { name: "Editar gasto" })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Concepto *"), { target: { value: "Mantenimiento del local" } });
    fireEvent.change(screen.getByLabelText("Monto *"), { target: { value: "350" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));

    await waitFor(() => expect(updateExpense).toHaveBeenCalledWith("expense-1", expect.objectContaining({
      fecha: expense.fecha,
      concepto: "Mantenimiento del local",
      categoria: "Servicios",
      proveedor: "Proveedor Uno",
      monto: 350,
      estado: "Pendiente",
      metodo: "Efectivo",
      observaciones: "Revisión mensual",
    }), undefined));
    expect(await screen.findByText("El gasto se actualizó correctamente.")).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "Editar gasto" })).not.toBeInTheDocument();
  });
});
