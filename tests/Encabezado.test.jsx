import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Encabezado from "../src/Components/Encabezado";

describe("Encabezado", () => {
  test("renderiza el título y descripción proporcionados", () => {
    render(<MemoryRouter><Encabezado title="Dashboard" description="Panel de control" /></MemoryRouter>);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Panel de control")).toBeInTheDocument();
  });

  test("usa valores por defecto cuando no se proporcionan props", () => {
    render(<MemoryRouter><Encabezado /></MemoryRouter>);
    expect(screen.getByText("Inicio")).toBeInTheDocument();
    expect(screen.getByText("Panel administrativo")).toBeInTheDocument();
  });

  test("muestra el botón de usuario con avatar", () => {
    render(<MemoryRouter><Encabezado /></MemoryRouter>);
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getAllByText("Administrador")).toHaveLength(2);
  });

  test("abre el menú al hacer clic en el botón de usuario", () => {
    render(<MemoryRouter><Encabezado /></MemoryRouter>);
    const userButton = screen.getByRole("button");
    fireEvent.click(userButton);
    expect(screen.getByText("Configuración")).toBeInTheDocument();
  });

  test("cierra el menú al hacer clic fuera del menú", () => {
    render(<MemoryRouter><Encabezado /></MemoryRouter>);
    const userButton = screen.getByRole("button");
    fireEvent.click(userButton);
    expect(screen.getByText("Configuración")).toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByText("Configuración")).not.toBeInTheDocument();
  });

  test("muestra las opciones del menú de administrador", () => {
    render(<MemoryRouter><Encabezado /></MemoryRouter>);
    const userButton = screen.getByRole("button");
    fireEvent.click(userButton);
    expect(screen.getByText("Información general")).toBeInTheDocument();
    expect(screen.getByText("Notificaciones")).toBeInTheDocument();
    expect(screen.getByText("Seguridad")).toBeInTheDocument();
  });

  test("muestra los botones de acción del menú", () => {
    render(<MemoryRouter><Encabezado /></MemoryRouter>);
    const userButton = screen.getByRole("button");
    fireEvent.click(userButton);
    expect(screen.getByText("Guardar cambios")).toBeInTheDocument();
    expect(screen.getByText("Cerrar sesión")).toBeInTheDocument();
  });

  test("el atributo aria-expanded se actualiza al abrir/cerrar el menú", () => {
    render(<MemoryRouter><Encabezado /></MemoryRouter>);
    const userButton = screen.getByRole("button");
    expect(userButton).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(userButton);
    expect(userButton).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(userButton);
    expect(userButton).toHaveAttribute("aria-expanded", "false");
  });
});
