import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Apple,
  CreditCard,
  FileText,
  House,
  LogOut,
  Package,
  QrCode,
  Receipt,
  ShoppingCart,
  Users,
  Wallet,
} from "lucide-react";
import "../Styles/Home.css";

const menuIcons = {
  Inicio: House,
  Asistencia: QrCode,
  Clientes: Users,
  "Membresías": CreditCard,
  Pagos: Wallet,
  Ventas: ShoppingCart,
  Inventario: Package,
  Gastos: Receipt,
  "Análisis y estadísticas": FileText,
  Reportes: FileText,
  "Nutrición": Apple,
  "Cerrar sesión": LogOut,
};

const menuItems = [
  { name: "Inicio", path: "/home" },
  { name: "Asistencia", path: "/asistencia" },
  { name: "Clientes", path: "/clientes" },
  { name: "Membresías", path: "/membresias" },
  { name: "Pagos", path: "/pagos" },
  { name: "Ventas", path: "/ventas" },
  { name: "Inventario", path: "/inventario" },
  { name: "Gastos", path: "/gastos" },
  { name: "Análisis y estadísticas", path: "/analisis" },
  { name: "Reportes", path: "/reportes" },
  { name: "Nutrición", path: "/nutricion" },
  { name: "Cerrar sesión", path: "/" },
];

const parentRoutes = {
  "/nuevo-cliente": "/clientes",
  "/nuevo-pago": "/pagos",
  "/nuevo-producto": "/inventario",
  "/nueva-categoria": "/inventario",
  "/registrar-gasto": "/gastos",
  "/nueva-receta": "/nutricion",
};

export default function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const activePath = location.pathname.startsWith("/editar-receta/")
    ? "/nutricion"
    : parentRoutes[location.pathname] || location.pathname;

  return (
    <aside className="sidebar">
      <div className="logoContainer">
        <img src="/logo-port-gym.png" alt="Port Gym" className="logoImage" />
      </div>

      <nav className="menu" aria-label="Navegación principal">
        {menuItems.map((item) => {
          const Icon = menuIcons[item.name];
          const isActive = item.path === activePath;

          return (
            <button
              key={item.name}
              type="button"
              className={`menuItem ${isActive ? "activeMenu" : ""} ${item.name === "Cerrar sesión" ? "logoutMenuItem" : ""}`}
              onClick={() => navigate(item.path)}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon size={18} strokeWidth={2} />
              <span>{item.name}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
