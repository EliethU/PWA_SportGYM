import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import Login from "../src/Views/Login";
import PortalCliente from "../src/Views/PortalCliente";
import {
  createProduct,
  deleteProduct,
  updateProduct,
} from "../src/services/productosService";
import { registerClientAttendance } from "../src/services/asistenciasService";
import { useAuth } from "../src/assets/database/authcontext";

const mockSignIn = jest.fn();
const mockSignOut = jest.fn();
const mockGetDoc = jest.fn();
const mockDoc = jest.fn((_, collectionName, id) => ({ collectionName, id }));
const mockCollection = jest.fn((_, collectionName) => ({ collectionName }));
const mockAddDoc = jest.fn();
const mockUpdateDoc = jest.fn();
const mockDeleteDoc = jest.fn();
const mockServerTimestamp = jest.fn(() => "mock-timestamp");
const mockHttpsCallable = jest.fn();
const mockUseAuth = jest.fn();

jest.mock("firebase/auth", () => ({
  signInWithEmailAndPassword: (...args) => mockSignIn(...args),
  signOut: (...args) => mockSignOut(...args),
}));

jest.mock("firebase/firestore", () => ({
  addDoc: (...args) => mockAddDoc(...args),
  collection: (...args) => mockCollection(...args),
  deleteDoc: (...args) => mockDeleteDoc(...args),
  doc: (...args) => mockDoc(...args),
  getDoc: (...args) => mockGetDoc(...args),
  serverTimestamp: (...args) => mockServerTimestamp(...args),
  updateDoc: (...args) => mockUpdateDoc(...args),
}));

jest.mock("firebase/functions", () => ({
  getFunctions: jest.fn(() => ({})),
  httpsCallable: (...args) => mockHttpsCallable(...args),
}));

jest.mock("../src/assets/database/firebaseconfig", () => ({
  appfirebase: {},
  auth: {},
  db: {},
}));

jest.mock("../src/assets/database/authcontext", () => ({
  useAuth: (...args) => mockUseAuth(...args),
}));

jest.mock("../src/Imagen/inicio.jpg", () => "inicio-mock.jpg");

function CurrentPath() {
  const location = useLocation();
  return <span data-testid="current-path">{location.pathname}</span>;
}

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={["/login"]}>
      <Routes>
        <Route
          path="*"
          element={(
            <>
              <Login />
              <CurrentPath />
            </>
          )}
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("Casos de prueba PWA e integración", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("PWA-001: acceso autorizado y rechazo de credenciales inválidas", () => {
    test("permite el acceso válido y dirige al usuario según su rol", async () => {
      mockSignIn.mockResolvedValue({ user: { uid: "admin-1" } });
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ rol: "admin" }),
      });

      renderLogin();
      fireEvent.change(screen.getByPlaceholderText("Correo electrónico"), {
        target: { value: "admin@example.com" },
      });
      fireEvent.change(screen.getByPlaceholderText("Contraseña"), {
        target: { value: "password-correcta" },
      });
      fireEvent.click(screen.getByRole("button", { name: /Iniciar sesión/ }));

      await waitFor(() => {
        expect(screen.getByTestId("current-path")).toHaveTextContent("/terminos");
      });
      expect(mockSignIn).toHaveBeenCalledWith({}, "admin@example.com", "password-correcta");
    });

    test("rechaza credenciales inválidas y muestra un error", async () => {
      const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
      mockSignIn.mockRejectedValue({ code: "auth/invalid-credential" });

      try {
        renderLogin();
        fireEvent.change(screen.getByPlaceholderText("Correo electrónico"), {
          target: { value: "usuario@example.com" },
        });
        fireEvent.change(screen.getByPlaceholderText("Contraseña"), {
          target: { value: "incorrecta" },
        });
        fireEvent.click(screen.getByRole("button", { name: /Iniciar sesión/ }));

        expect(await screen.findByText(/Correo\/contraseña incorrectos/)).toBeInTheDocument();
        expect(screen.getByTestId("current-path")).toHaveTextContent("/login");
        expect(mockSignOut).not.toHaveBeenCalled();
      } finally {
        consoleError.mockRestore();
      }
    });
  });

  describe("PWA-005: operaciones CRUD de producto", () => {
    test("crea, actualiza y elimina el documento del producto", async () => {
      mockAddDoc.mockResolvedValue({ id: "producto-1" });
      mockUpdateDoc.mockResolvedValue(undefined);
      mockDeleteDoc.mockResolvedValue(undefined);
      const product = {
        nombre: "Proteína",
        precio: 50,
        cantidad: 4,
        imageUrl: " https://example.com/proteina.png ",
      };

      const productId = await createProduct(product);
      await updateProduct(productId, { ...product, precio: 55 });
      await deleteProduct(productId);

      expect(productId).toBe("producto-1");
      expect(mockAddDoc).toHaveBeenCalledWith(
        { collectionName: "productos" },
        expect.objectContaining({
          nombre: "Proteína",
          imageUrl: "https://example.com/proteina.png",
          createdAt: "mock-timestamp",
          updatedAt: "mock-timestamp",
        }),
      );
      expect(mockUpdateDoc).toHaveBeenCalledWith(
        { collectionName: "productos", id: "producto-1" },
        expect.objectContaining({ precio: 55, updatedAt: "mock-timestamp" }),
      );
      expect(mockDeleteDoc).toHaveBeenCalledWith({
        collectionName: "productos",
        id: "producto-1",
      });
    });
  });

  describe("INT-003: asistencia visible y aviso de duplicidad", () => {
    test("informa que la asistencia diaria ya estaba registrada", async () => {
      mockUseAuth.mockReturnValue({
        user: { uid: "cliente-1", displayName: "Cliente A", email: "a@example.com" },
        logout: jest.fn(),
      });
      mockGetDoc.mockImplementation(async (reference) => {
        if (reference.collectionName === "usuarios") {
          return { data: () => ({ clienteId: "perfil-cliente-1" }) };
        }
        return {
          exists: () => true,
          data: () => ({
            nombre: "Cliente A",
            membresia: "Mensual",
            estadoPago: "pagado",
            correo: "a@example.com",
          }),
        };
      });
      const registerAttendance = jest.fn().mockResolvedValue({
        data: {
          alreadyRegistered: true,
          hora: "08:30",
        },
      });
      mockHttpsCallable.mockReturnValue(registerAttendance);

      render(
        <MemoryRouter initialEntries={["/cliente"]}>
          <PortalCliente />
        </MemoryRouter>,
      );

      fireEvent.click(await screen.findByRole("button", { name: /Registrar asistencia/ }));

      expect(await screen.findByText(/ya estaba registrada \(08:30\)/)).toBeInTheDocument();
      expect(registerAttendance).toHaveBeenCalledTimes(1);
    });
  });

  describe("INT-005: aislamiento de los datos del cliente en el portal", () => {
    test("carga el perfil vinculado al usuario autenticado, no otro cliente", async () => {
      mockUseAuth.mockReturnValue({
        user: { uid: "cliente-a-uid", displayName: "Cliente A", email: "a@example.com" },
        logout: jest.fn(),
      });
      mockGetDoc.mockImplementation(async (reference) => {
        if (reference.collectionName === "usuarios") {
          return { data: () => ({ clienteId: "perfil-cliente-a" }) };
        }
        return {
          exists: () => true,
          data: () => ({
            nombre: "Cliente A",
            membresia: "Mensual",
            estadoPago: "pagado",
            correo: "a@example.com",
          }),
        };
      });

      render(
        <MemoryRouter initialEntries={["/cliente"]}>
          <PortalCliente />
        </MemoryRouter>,
      );

      expect(await screen.findByText("Hola, Cliente A")).toBeInTheDocument();
      expect(mockDoc).toHaveBeenCalledWith({}, "usuarios", "cliente-a-uid");
      expect(mockDoc).toHaveBeenCalledWith({}, "clientes", "perfil-cliente-a");
      expect(mockDoc).not.toHaveBeenCalledWith({}, "clientes", "perfil-cliente-b");
      expect(screen.queryByText("Cliente B")).not.toBeInTheDocument();
    });
  });
});

describe("Exportaciones de servicios referenciadas por los casos", () => {
  test("expone las operaciones CRUD y el registro de asistencia", () => {
    expect(typeof createProduct).toBe("function");
    expect(typeof updateProduct).toBe("function");
    expect(typeof deleteProduct).toBe("function");
    expect(typeof registerClientAttendance).toBe("function");
  });
});
