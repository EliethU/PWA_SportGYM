import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import Pagination, { PAGE_SIZE } from "../src/Components/Pagination";

describe("Pagination", () => {
  test("no se renderiza cuando hay solo una página", () => {
    render(<Pagination currentPage={1} onPageChange={jest.fn()} totalItems={10} />);
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });

  test("se renderiza cuando hay múltiples páginas", () => {
    render(<Pagination currentPage={1} onPageChange={jest.fn()} totalItems={60} />);
    expect(screen.getByRole("navigation")).toBeInTheDocument();
    expect(screen.getByText("Mostrando 1-30 de 60")).toBeInTheDocument();
  });

  test("muestra el resumen correcto de items", () => {
    render(<Pagination currentPage={2} onPageChange={jest.fn()} totalItems={75} />);
    expect(screen.getByText("Mostrando 31-60 de 75")).toBeInTheDocument();
  });

  test("llama a onPageChange con la página correcta al hacer clic en un número de página", () => {
    const onPageChange = jest.fn();
    render(<Pagination currentPage={1} onPageChange={onPageChange} totalItems={90} />);
    fireEvent.click(screen.getByRole("button", { name: "Página 2" }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  test("el botón 'Anterior' está deshabilitado en la primera página", () => {
    render(<Pagination currentPage={1} onPageChange={jest.fn()} totalItems={60} />);
    const previousButton = screen.getByRole("button", { name: "Página anterior" });
    expect(previousButton).toBeDisabled();
  });

  test("el botón 'Siguiente' está deshabilitado en la última página", () => {
    render(<Pagination currentPage={2} onPageChange={jest.fn()} totalItems={60} />);
    const nextButton = screen.getByRole("button", { name: "Página siguiente" });
    expect(nextButton).toBeDisabled();
  });

  test("llama a onPageChange con la página anterior al hacer clic en 'Anterior'", () => {
    const onPageChange = jest.fn();
    render(<Pagination currentPage={3} onPageChange={onPageChange} totalItems={90} />);
    fireEvent.click(screen.getByRole("button", { name: "Página anterior" }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  test("llama a onPageChange con la página siguiente al hacer clic en 'Siguiente'", () => {
    const onPageChange = jest.fn();
    render(<Pagination currentPage={1} onPageChange={onPageChange} totalItems={90} />);
    fireEvent.click(screen.getByRole("button", { name: "Página siguiente" }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  test("muestra elipsis cuando hay muchas páginas", () => {
    render(<Pagination currentPage={5} onPageChange={jest.fn()} totalItems={300} />);
    expect(screen.getAllByText("…")).toHaveLength(2);
  });

  test("la página actual tiene la clase activa", () => {
    render(<Pagination currentPage={3} onPageChange={jest.fn()} totalItems={90} />);
    const activeButton = screen.getByRole("button", { name: "Página 3" });
    expect(activeButton).toHaveClass("listPaginationButtonActive");
  });

  test("PAGE_SIZE constante es 30", () => {
    expect(PAGE_SIZE).toBe(30);
  });
});
