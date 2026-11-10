import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import Pagos from "../src/Views/Pagos";

function PaymentEditDestination() {
  const location = useLocation();
  return <p>Pago seleccionado: {location.state.payment.id} {location.search}</p>;
}

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(() => ({})),
  onSnapshot: jest.fn((_paymentsCollection, onNext) => {
    onNext({
      docs: Array.from({ length: 31 }, (_, index) => ({
        id: `payment-${index + 1}`,
        data: () => ({
          nombreCliente: `Cliente ${String(index + 1).padStart(2, "0")}`,
          monto: 100,
          fechaPago: "2026-10-12",
        }),
      })),
    });
    return jest.fn();
  }),
}));

jest.mock("../src/assets/database/firebaseconfig.jsx", () => ({ db: {} }));
jest.mock("../src/Components/AdminSidebar", () => jest.fn(() => null));

describe("Pagos", () => {
  test("renders the screen and makes every payment reachable through pagination", () => {
    render(
      <MemoryRouter>
        <Pagos />
      </MemoryRouter>,
    );

    expect(screen.getByText("Historial de pagos")).toBeInTheDocument();
    expect(screen.getByText("Mostrando 1-30 de 31")).toBeInTheDocument();
    expect(screen.getAllByRole("row")).toHaveLength(31);

    fireEvent.click(screen.getByRole("button", { name: "Página siguiente" }));

    expect(screen.getByText("Mostrando 31-31 de 31")).toBeInTheDocument();
    expect(screen.getByText("Cliente 31")).toBeInTheDocument();
    expect(screen.getAllByRole("row")).toHaveLength(2);
  });

  test("opens the selected payment in edit mode from the actions", () => {
    render(
      <MemoryRouter initialEntries={["/pagos"]}>
        <Routes>
          <Route path="/pagos" element={<Pagos />} />
          <Route path="/nuevo-pago" element={<PaymentEditDestination />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Editar pago de Cliente 01" }));

    expect(screen.getByText("Pago seleccionado: payment-1 ?editar=payment-1")).toBeInTheDocument();
  });
});
