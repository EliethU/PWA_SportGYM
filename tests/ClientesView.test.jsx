import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import ClientesView from "../src/Components/ClientesView";

jest.mock("../src/Components/Modal", () => ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return <div data-testid="modal"><h2>{title}</h2>{children}</div>;
});

jest.mock("../src/Components/NuevoClienteView", () => () => <div data-testid="nuevo-cliente-view">NuevoClienteView</div>, { virtual: true });

describe("ClientesView", () => {
  const defaultProps = { onNuevo: jest.fn(), onEditar: jest.fn(), onEliminar: jest.fn() };

  test("renderiza el título y contador de clientes", () => {
    render(<ClientesView {...defaultProps} />);
    expect(screen.getByText("Clientes")).toBeInTheDocument();
    expect(screen.getByText("0 clientes registrados")).toBeInTheDocument();
  });

  test("renderiza el botón de nuevo cliente", () => {
    render(<ClientesView {...defaultProps} />);
    expect(screen.getByText("Nuevo cliente")).toBeInTheDocument();
  });

  test("renderiza el buscador", () => {
    render(<ClientesView {...defaultProps} />);
    expect(screen.getByPlaceholderText("Buscar por nombre o teléfono")).toBeInTheDocument();
  });

  test("actualiza el estado de búsqueda al escribir", () => {
    render(<ClientesView {...defaultProps} />);
    const searchInput = screen.getByPlaceholderText("Buscar por nombre o teléfono");
    fireEvent.change(searchInput, { target: { value: "Juan" } });
    expect(searchInput.value).toBe("Juan");
  });

  test("muestra el botón de limpiar búsqueda cuando hay texto", () => {
    render(<ClientesView {...defaultProps} />);
    const searchInput = screen.getByPlaceholderText("Buscar por nombre o teléfono");
    fireEvent.change(searchInput, { target: { value: "Juan" } });
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBe(2);
  });

  test("muestra el mensaje de 'No hay resultados' cuando no hay clientes", () => {
    render(<ClientesView {...defaultProps} />);
    expect(screen.getByText("No hay resultados")).toBeInTheDocument();
    expect(screen.getByText("Prueba con otro nombre o número de teléfono.")).toBeInTheDocument();
  });

  test("abre el modal al hacer clic en 'Nuevo cliente'", () => {
    render(<ClientesView {...defaultProps} />);
    const nuevoButton = screen.getByText("Nuevo cliente");
    fireEvent.click(nuevoButton);
    expect(defaultProps.onNuevo).toHaveBeenCalled();
  });

  test("renderiza los encabezados de la tabla", () => {
    render(<ClientesView {...defaultProps} />);
    expect(screen.getByText("Nombre completo")).toBeInTheDocument();
    expect(screen.getByText("Teléfono")).toBeInTheDocument();
    expect(screen.getByText("Inscripción")).toBeInTheDocument();
    expect(screen.getByText("Membresía")).toBeInTheDocument();
    expect(screen.getByText("Estado")).toBeInTheDocument();
    expect(screen.getByText("Acciones")).toBeInTheDocument();
  });

  test("actualiza el estado de enfoque del buscador", () => {
    render(<ClientesView {...defaultProps} />);
    const searchInput = screen.getByPlaceholderText("Buscar por nombre o teléfono");
    fireEvent.focus(searchInput);
    const container = searchInput.closest(".buscador");
    expect(container).toHaveClass("buscador-enfoque");
    fireEvent.blur(searchInput);
    expect(container).not.toHaveClass("buscador-enfoque");
  });
});
