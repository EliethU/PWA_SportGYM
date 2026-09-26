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
  Plus,
  Trash2,
  LogOut,
} from "lucide-react";
import Encabezado from "../Components/Encabezado";
import "../Styles/Home.css";
import "../Styles/Ventas.css";

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

export default function Ventas() {
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
                className={`menuItem ${item.name === "Ventas" ? 'activeMenu' : ''} ${item.name === "Cerrar sesión" ? "logoutMenuItem" : ""}`}
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
        <Encabezado title="Ventas" description="Registra y gestiona las ventas" />

        {/* =========================
            CONTENIDO VENTAS
        ========================== */}
        <section className="content">

          <div className="salesContainer">
            {/* LISTA DE PRODUCTOS */}
            <div className="salesList">
              <h3 className="sectionTitle">Registrar nueva venta</h3>
              
              <div className="salesItems">
                {/* Datos vacíos - sin base de datos */}
                <div className="emptySales">
                  <ShoppingCart size={48} className="emptyIcon" />
                  <p>No hay productos en la venta</p>
                  <button className="addProductButton">
                    <Plus size={18} />
                    <span>Agregar producto</span>
                  </button>
                </div>
              </div>
            </div>

            {/* RESUMEN DE VENTA */}
            <div className="salesSummary">
              <h3 className="sectionTitle">Resumen</h3>
              
              <div className="summaryDetails">
                <div className="summaryRow">
                  <span className="summaryLabel">Subtotal:</span>
                  <span className="summaryValue">C$ 0.00</span>
                </div>
                <div className="summaryRow">
                  <span className="summaryLabel">Impuestos:</span>
                  <span className="summaryValue">C$ 0.00</span>
                </div>
                <div className="summaryRow total">
                  <span className="summaryLabel">TOTAL:</span>
                  <span className="summaryValue">C$ 0.00</span>
                </div>
              </div>

              <button className="completeSaleButton">
                Completar venta
              </button>
            </div>
          </div>

        </section>

      </main>
    </div>
  );
}