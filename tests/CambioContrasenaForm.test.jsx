import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import CambioContrasenaForm from "../src/Components/CambioContrasenaForm";
import { auth } from "../src/assets/database/firebaseconfig";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";

jest.mock("firebase/auth", () => ({
  EmailAuthProvider: {
    credential: jest.fn(() => ({ providerId: "password" })),
  },
  reauthenticateWithCredential: jest.fn(),
  updatePassword: jest.fn(),
}));

jest.mock("../src/assets/database/firebaseconfig", () => ({
  auth: {
    currentUser: { email: "cliente@example.com" },
  },
}));

describe("CambioContrasenaForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    reauthenticateWithCredential.mockResolvedValue({});
    updatePassword.mockResolvedValue({});
  });

  test("actualiza la contraseña después de reautenticar al usuario", async () => {
    render(<CambioContrasenaForm />);

    fireEvent.change(screen.getByLabelText("Contraseña actual"), {
      target: { value: "actual123" },
    });
    fireEvent.change(screen.getByLabelText("Nueva contraseña"), {
      target: { value: "nueva123" },
    });
    fireEvent.change(screen.getByLabelText("Confirmar contraseña"), {
      target: { value: "nueva123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Cambiar contraseña" }));

    await waitFor(() => {
      expect(EmailAuthProvider.credential).toHaveBeenCalledWith(
        "cliente@example.com",
        "actual123",
      );
      expect(reauthenticateWithCredential).toHaveBeenCalledWith(
        auth.currentUser,
        { providerId: "password" },
      );
      expect(updatePassword).toHaveBeenCalledWith(auth.currentUser, "nueva123");
    });
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Tu contraseña se cambió correctamente.",
    );
  });

  test("no actualiza si la confirmación no coincide", async () => {
    render(<CambioContrasenaForm />);

    fireEvent.change(screen.getByLabelText("Contraseña actual"), {
      target: { value: "actual123" },
    });
    fireEvent.change(screen.getByLabelText("Nueva contraseña"), {
      target: { value: "nueva123" },
    });
    fireEvent.change(screen.getByLabelText("Confirmar contraseña"), {
      target: { value: "distinta123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Cambiar contraseña" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "La confirmación no coincide con la nueva contraseña.",
    );
    expect(reauthenticateWithCredential).not.toHaveBeenCalled();
    expect(updatePassword).not.toHaveBeenCalled();
  });
});
