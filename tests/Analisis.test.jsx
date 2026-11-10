import React from "react";
import { act, render, screen } from "@testing-library/react";
import Analisis from "../src/Views/Analisis";
import { subscribeToSales } from "../src/services/ventasService";

let mockSalesListener;
let mockSales = [];

jest.mock("firebase/firestore", () => ({
  collection: jest.fn((_database, name) => ({ name })),
  onSnapshot: jest.fn((reference, onUpdate) => {
    const records = reference.name === "pagos"
      ? [
        { id: "payment-alice", clienteId: "alice", nombreCliente: "Ana", monto: 10 },
        { id: "payment-bob", clienteId: "bob", nombreCliente: "Beto", monto: 10000 },
      ]
      : [{ id: "alice", nombre: "Ana" }, { id: "bob", nombre: "Beto" }];
    onUpdate({ docs: records.map((record) => ({ id: record.id, data: () => record })) });
    return jest.fn();
  }),
}));

jest.mock("../src/assets/database/firebaseconfig", () => ({ db: {} }));
jest.mock("../src/services/ventasService", () => ({
  subscribeToSales: jest.fn((onUpdate) => {
    mockSalesListener = onUpdate;
    onUpdate(mockSales);
    return jest.fn();
  }),
}));
jest.mock("../src/services/gastosService", () => ({
  subscribeToExpenses: jest.fn((onUpdate) => {
    onUpdate([]);
    return jest.fn();
  }),
}));
jest.mock("../src/Components/AdminSidebar", () => () => <nav />);
jest.mock("../src/Components/Encabezado", () => ({ title }) => <h1>{title}</h1>);
jest.mock("recharts", () => {
  const ReactForCharts = require("react");
  const chart = ({ children }) => ReactForCharts.createElement("div", null, children);
  return {
    Bar: chart,
    BarChart: chart,
    CartesianGrid: chart,
    Cell: chart,
    Line: chart,
    LineChart: chart,
    ResponsiveContainer: chart,
    Tooltip: chart,
    XAxis: chart,
    YAxis: chart,
  };
});

describe("Analisis", () => {
  const today = new Date();
  const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const aliceSales = [1, 2].map((id) => ({
    id: `alice-sale-${id}`,
    clienteId: "alice",
    nombreCliente: "Ana",
    fechaVenta: date,
    total: 1,
  }));
  const bobSales = [{
    id: "bob-sale-1",
    clienteId: "bob",
    nombreCliente: "Beto",
    fechaVenta: date,
    total: 1,
  }];

  beforeEach(() => {
    jest.clearAllMocks();
    mockSales = [...aliceSales, ...bobSales];
  });

  test("reordena el top de clientes al aumentar la frecuencia de compra", () => {
    render(<Analisis />);

    const topClients = screen.getByRole("heading", { name: "Top clientes" }).closest("article");
    const getFirstClient = () => topClients.querySelector("tbody tr td").textContent;
    expect(getFirstClient()).toBe("Ana");

    act(() => {
      mockSalesListener([...aliceSales, ...bobSales, ...[2, 3].map((id) => ({
        ...bobSales[0],
        id: `bob-sale-${id}`,
      }))]);
    });

    expect(getFirstClient()).toBe("Beto");
    expect(topClients.querySelector("tbody tr").textContent).toContain("Alta");
    expect(subscribeToSales).toHaveBeenCalled();
  });
});
