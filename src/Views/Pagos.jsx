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
} from "lucide-react";
import Encabezado from "../Components/Encabezado";
import "../Styles/Home.css";
import "../Styles/Pagos.css";

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

export default function Pagos() {
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
                className={`menuItem ${item.name === "Pagos" ? 'activeMenu' : ''} ${item.name === "Cerrar sesión" ? "logoutMenuItem" : ""}`}
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
        <Encabezado title="Pagos" description="Gestiona los pagos del gimnasio" />

        {/* =========================
            CONTENIDO PAGOS
        ========================== */}
        <section className="content">

          {/* DETALLE DEL PAGO */}
          <div className="paymentDetails">
            <h3 className="sectionTitle">Detalle del pago</h3>
            <div className="paymentInfo">
              <div className="paymentField">
                <span className="fieldLabel">Cliente:</span>
                <span className="fieldValue">-</span>
              </div>
              <div className="paymentField">
                <span className="fieldLabel">Concepto:</span>
                <span className="fieldValue">-</span>
              </div>
              <div className="paymentField">
                <span className="fieldLabel">Monto:</span>
                <span className="fieldValue">C$ 0.00</span>
              </div>
              <div className="paymentField">
                <span className="fieldLabel">Fecha:</span>
                <span className="fieldValue">-</span>
              </div>
              <div className="paymentField">
                <span className="fieldLabel">Método:</span>
                <span className="fieldValue">-</span>
              </div>
              <div className="paymentField">
                <span className="fieldLabel">Estado:</span>
                <span className="fieldValue">-</span>
              </div>
            </div>
          </div>

          {/* COMPROBANTE */}
          <div className="receiptSection">
            <h3 className="sectionTitle">COMPROBANTE</h3>
            <div className="receiptInfo">
              <span className="receiptLabel">#PAY-</span>
              <span className="receiptNumber">-</span>
            </div>
          </div>

        </section>

      </main>
    </div>
  );
}