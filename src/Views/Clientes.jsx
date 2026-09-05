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
  Search,
  Plus,
} from "lucide-react";
import Encabezado from "../Components/Encabezado";
import "../Styles/Home.css";
import "../Styles/Clientes.css";

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

export default function Clientes() {
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
                className={`menuItem ${item.name === "Clientes" ? 'activeMenu' : ''}`}
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
        <Encabezado title="Gestión de clientes" description="Administra los clientes del gimnasio" />

        {/* =========================
            CONTENIDO CLIENTES
        ========================== */}
        <section className="content">

          {/* BARRA DE BÚSQUEDA Y BOTÓN NUEVO */}
          <div className="clientsHeader">
            <div className="searchContainer">
              <Search size={18} className="searchIcon" />
              <input
                type="text"
                placeholder="Buscar cliente..."
                className="searchInput"
              />
            </div>
            <button className="newButton" onClick={() => navigate("/nuevo-cliente")}>
              <Plus size={18} />
              <span>Nuevo</span>
            </button>
          </div>

          {/* TABLA DE CLIENTES */}
          <div className="clientsTableContainer">
            <h3 className="tableTitle">Clientes registrados</h3>
            <div className="tableWrapper">
              <table className="clientsTable">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Membresía</th>
                    <th>Estado</th>
                    <th>Último pago</th>
                    <th>Asistencia</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Datos vacíos - sin base de datos */}
                  <tr className="emptyRow">
                    <td colSpan="5" className="emptyCell">
                      No hay clientes registrados
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