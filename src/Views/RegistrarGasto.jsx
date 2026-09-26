import React from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Wallet,
  ShoppingCart,
  Package,
  Receipt,
  FileText,
  Settings,
  LogOut,
  ArrowLeft,
  Save,
} from "lucide-react";
import Encabezado from "../Components/Encabezado";
import "../Styles/Home.css";
import "../Styles/RegistrarGasto.css";

const menuItems = [
  { name: "Dashboard", icon: LayoutDashboard, path: "/home" },
  { name: "Clientes", icon: Users, path: "/clientes" },
  { name: "Membresías", icon: CreditCard, path: "/membresias" },
  { name: "Pagos", icon: Wallet, path: "/pagos" },
  { name: "Ventas", icon: ShoppingCart, path: "/ventas" },
  { name: "Inventario", icon: Package, path: "/inventario" },
  { name: "Gastos", icon: Receipt, path: "/gastos" },
  { name: "Reportes", icon: FileText, path: "/reportes" },
  { name: "Configuración", icon: Settings, path: "/configuracion" },
  { name: "Cerrar sesión", icon: LogOut, path: "/" },
];

export default function RegistrarGasto() {
  const navigate = useNavigate();

  return (
    <div className="app">

      {/* =========================
          BARRA LATERAL
      ========================== */}
      <aside className="sidebar">

        {/* LOGO */}
        <div className="logoContainer">
          <img
            src="/logo-port-gym.png"
            alt="Port Gym"
            className="logoImage"
          />
        </div>

        {/* MENÚ */}
        <nav className="menu">
          {menuItems.map((item, index) => {
            const Icon = item.icon;

            return (
              <button
                key={item.name}
                className={`menuItem ${item.name === "Gastos" ? 'activeMenu' : ''} ${item.name === "Cerrar sesión" ? "logoutMenuItem" : ""}`}
                onClick={() => navigate(item.path)}
              >
                <Icon size={18} strokeWidth={2} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* =========================
          ÁREA PRINCIPAL
      ========================== */}
      <main className="main">

        {/* ENCABEZADO SUPERIOR */}
        <Encabezado title="Registrar gasto" description="Agrega un nuevo gasto al sistema" />

        {/* =========================
            CONTENIDO REGISTRAR GASTO
        ========================== */}
        <section className="content">

          {/* BOTÓN VOLVER */}
          <button className="backButton" onClick={() => navigate("/gastos")}>
            <ArrowLeft size={18} />
            <span>Volver a gastos</span>
          </button>

          {/* FORMULARIO DE GASTO */}
          <div className="expenseFormContainer">
            <h3 className="formTitle">Información del gasto</h3>
            
            <form className="expenseForm">
              <div className="formGroup">
                <label className="formLabel">Categoría</label>
                <select className="formSelect">
                  <option value="">Seleccionar categoría</option>
                  <option value="servicios">Servicios</option>
                  <option value="inventario">Inventario</option>
                  <option value="operativos">Operativos</option>
                  <option value="mantenimiento">Mantenimiento</option>
                  <option value="otros">Otros</option>
                </select>
              </div>

              <div className="formGroup">
                <label className="formLabel">Descripción</label>
                <input
                  type="text"
                  className="formInput"
                  placeholder="Descripción del gasto"
                />
              </div>

              <div className="formGroup">
                <label className="formLabel">Monto</label>
                <input
                  type="text"
                  className="formInput"
                  placeholder="C$ 0.00"
                />
              </div>

              <div className="formGroup">
                <label className="formLabel">Fecha</label>
                <input
                  type="date"
                  className="formInput"
                />
              </div>

              <div className="formGroup">
                <label className="formLabel">Proveedor</label>
                <input
                  type="text"
                  className="formInput"
                  placeholder="Nombre del proveedor"
                />
              </div>

              <div className="formActions">
                <button type="button" className="cancelButton" onClick={() => navigate("/gastos")}>
                  Cancelar
                </button>
                <button type="submit" className="saveButton">
                  <Save size={18} />
                  <span>Guardar gasto</span>
                </button>
              </div>
            </form>
          </div>

        </section>

      </main>
    </div>
  );
}