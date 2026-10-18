import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import Modal from "../src/Components/Modal";

describe("Modal", () => {
  test("no se renderiza cuando isOpen es false", () => {
    render(<Modal isOpen={false} onClose={jest.fn()} title="Test Modal"><p>Contenido del modal</p></Modal>);
    expect(screen.queryByText("Test Modal")).not.toBeInTheDocument();
  });

  test("se renderiza cuando isOpen es true", () => {
    render(<Modal isOpen={true} onClose={jest.fn()} title="Test Modal"><p>Contenido del modal</p></Modal>);
    expect(screen.getByText("Test Modal")).toBeInTheDocument();
    expect(screen.getByText("Contenido del modal")).toBeInTheDocument();
  });

  test("llama a onClose al hacer clic en el overlay", () => {
    const onClose = jest.fn();
    render(<Modal isOpen={true} onClose={onClose} title="Test Modal"><p>Contenido</p></Modal>);
    const overlay = screen.getByText("Test Modal").closest(".modal-overlay");
    fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalled();
  });

  test("llama a onClose al hacer clic en el botón de cerrar", () => {
    const onClose = jest.fn();
    render(<Modal isOpen={true} onClose={onClose} title="Test Modal"><p>Contenido</p></Modal>);
    const closeButton = screen.getByRole("button");
    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalled();
  });

  test("no llama a onClose al hacer clic dentro del contenido del modal", () => {
    const onClose = jest.fn();
    render(<Modal isOpen={true} onClose={onClose} title="Test Modal"><p>Contenido</p></Modal>);
    const content = screen.getByText("Contenido").closest(".modal-content");
    fireEvent.click(content);
    expect(onClose).not.toHaveBeenCalled();
  });

  test("aplica la clase de tamaño correcta", () => {
    const { rerender } = render(<Modal isOpen={true} onClose={jest.fn()} title="Test" size="small"><p>Contenido</p></Modal>);
    expect(screen.getByText("Test").closest(".modal-content")).toHaveClass("modal-small");
    rerender(<Modal isOpen={true} onClose={jest.fn()} title="Test" size="large"><p>Contenido</p></Modal>);
    expect(screen.getByText("Test").closest(".modal-content")).toHaveClass("modal-large");
  });

  test("tamaño por defecto es medium", () => {
    render(<Modal isOpen={true} onClose={jest.fn()} title="Test"><p>Contenido</p></Modal>);
    expect(screen.getByText("Test").closest(".modal-content")).toHaveClass("modal-medium");
  });
});
