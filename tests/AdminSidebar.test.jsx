import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import AdminSidebar from "../src/Components/AdminSidebar";

function CurrentPath() {
  const location = useLocation();
  return <span data-testid="current-path">{location.pathname}</span>;
}

function renderSidebar(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="*"
          element={(
            <>
              <AdminSidebar />
              <CurrentPath />
            </>
          )}
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("AdminSidebar", () => {
  test("shows the same menu items in the reference order", () => {
    renderSidebar("/clientes");

    expect(screen.getAllByRole("button").map((button) => button.textContent)).toEqual([
      "Inicio",
      "Asistencia",
      "Clientes",
      "Membresías",
      "Pagos",
      "Ventas",
      "Inventario",
      "Gastos",
      "Análisis y estadísticas",
      "Reportes",
      "Nutrición",
      "Cerrar sesión",
    ]);
    expect(screen.getByRole("button", { name: "Clientes" })).toHaveClass("activeMenu");
  });

  test("keeps the inventory section active on its related screens", () => {
    renderSidebar("/nuevo-producto");

    expect(screen.getByRole("button", { name: "Inventario" })).toHaveClass("activeMenu");
    expect(screen.getByRole("button", { name: "Inicio" })).not.toHaveClass("activeMenu");
  });

  test("updates the active item when navigating", () => {
    renderSidebar("/home");

    fireEvent.click(screen.getByRole("button", { name: "Nutrición" }));

    expect(screen.getByTestId("current-path")).toHaveTextContent("/nutricion");
    expect(screen.getByRole("button", { name: "Nutrición" })).toHaveClass("activeMenu");
    expect(screen.getByRole("button", { name: "Inicio" })).not.toHaveClass("activeMenu");
  });
});
