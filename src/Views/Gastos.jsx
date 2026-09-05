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
  Dumbbell,
  Apple,
  Tag,
  FileText,
  Settings,
  Plus,
} from "lucide-react";
import Encabezado from "../Components/Encabezado";
import "../Styles/Home.css";
import "../Styles/Gastos.css";

const menuItems = [
  { name: "Dashboard", icon: LayoutDashboard, path: "/home" },
  { name: "Clientes", icon: Users, path: "/clientes" },
  { name: "Membresías", icon: CreditCard, path: "/membresias" },
  { name: "Pagos", icon: Wallet, path: "/pagos" },
  { name: "Ventas", icon: ShoppingCart, path: "/ventas" },
  { name: "Inventario", icon: Package, path: "/inventario" },
  { name: "Gastos", icon: Receipt, path: "/gastos" },
  { name: "Asistencia IA", icon: Dumbbell, path: "/asistencia" },
  { name: "Entrenamiento", icon: Dumbbell, path: "/entrenamiento" },
  { name: "Nutrición", icon: Apple, path: "/nutricion" },
  { name: "Promociones", icon: Tag, path: "/promociones" },
  { name: "Reportes", icon: FileText, path: "/reportes" },
  { name: "Configuración", icon: Settings, path: "/configuracion" },
];

export default function Gastos() {
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
                className={`menuItem ${item.name === "Gastos" ? 'activeMenu' : ''}`}
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
        <Encabezado title="Gastos" description="Gestiona los gastos del negocio" />

        {/* =========================
            CONTENIDO GASTOS
        ========================== */}
        <section className="content">

          {/* BOTÓN NUEVO */}
          <div className="gastosHeader">
            <button className="newButton" onClick={() => navigate("/registrar-gasto")}>
              <Plus size={18} />
              <span>Registrar gasto</span>
            </button>
          </div>

          {/* TABLA DE GASTOS */}
          <div className="gastosTableContainer">
            <h3 className="tableTitle">Gastos del negocio</h3>
            <div className="tableWrapper">
              <table className="gastosTable">
                <thead>
                  <tr>
                    <th>Concepto</th>
                    <th>Categoría</th>
                    <th>Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Datos vacíos - sin base de datos */}
                  <tr className="emptyRow">
                    <td colSpan="3" className="emptyCell">
                      No hay gastos registrados
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </section>

      </main>
    </div>
  );
}