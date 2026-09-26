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
  Search,
  Plus,
} from "lucide-react";
import Encabezado from "../Components/Encabezado";
import "../Styles/Home.css";
import "../Styles/Inventario.css";

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

export default function Inventario() {
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
                className={`menuItem ${item.name === "Inventario" ? 'activeMenu' : ''} ${item.name === "Cerrar sesión" ? "logoutMenuItem" : ""}`}
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
        <Encabezado title="Inventario" description="Gestiona el inventario del gimnasio" />

        {/* =========================
            CONTENIDO INVENTARIO
        ========================== */}
        <section className="content">

          {/* BARRA DE BÚSQUEDA Y BOTÓN NUEVO */}
          <div className="inventoryHeader">
            <div className="searchContainer">
              <Search size={18} className="searchIcon" />
              <input
                type="text"
                placeholder="Buscar producto..."
                className="searchInput"
              />
            </div>
            <button className="newButton">
              <Plus size={18} />
              <span>Nuevo producto</span>
            </button>
          </div>

          {/* TABLA DE INVENTARIO */}
          <div className="inventoryTableContainer">
            <h3 className="tableTitle">Bebidas y suplementos</h3>
            <div className="tableWrapper">
              <table className="inventoryTable">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Tipo</th>
                    <th>Cantidad</th>
                    <th>Precio</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Datos vacíos - sin base de datos */}
                  <tr className="emptyRow">
                    <td colSpan="5" className="emptyCell">
                      No hay productos en el inventario
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