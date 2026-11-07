import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Apple,
  CreditCard,
  FileText,
  House,
  LogOut,
  Menu as MenuIcon,
  Package,
  QrCode,
  Receipt,
  ShoppingCart,
  Users,
  Wallet,
  X,
} from "lucide-react";
import logoPortGym from "../Imagen/logo-port-gym.png.png";
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const activePath = location.pathname.startsWith("/editar-receta/")
    ? "/nutricion"
    : parentRoutes[location.pathname] || location.pathname;

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isMobileMenuOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setIsMobileMenuOpen(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isMobileMenuOpen]);

  return (
    <>
      <button
        type="button"
        className="mobileMenuToggle"
        aria-label={isMobileMenuOpen ? "Cerrar menú de navegación" : "Abrir menú de navegación"}
        aria-expanded={isMobileMenuOpen}
        aria-controls="admin-navigation"
        onClick={() => setIsMobileMenuOpen((isOpen) => !isOpen)}
      >
        {isMobileMenuOpen ? <X size={22} /> : <MenuIcon size={22} />}
      </button>

      {isMobileMenuOpen && (
        <button
          type="button"
          className="mobileMenuBackdrop"
          aria-label="Cerrar panel de navegación"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside className={`sidebar ${isMobileMenuOpen ? "mobileMenuOpen" : ""}`}>
        <div className="logoContainer">
          <img src={logoPortGym} alt="Port Gym" className="logoImage" />
        </div>

        <nav className="menu" id="admin-navigation" aria-label="Navegación principal">
          {menuItems.map((item) => {
            const Icon = menuIcons[item.name];
            const isActive = item.path === activePath;

            return (
              <button
                key={item.name}
                type="button"
                className={`menuItem ${isActive ? "activeMenu" : ""} ${item.name === "Cerrar sesión" ? "logoutMenuItem" : ""}`}
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  navigate(item.path);
                }}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon size={18} strokeWidth={2} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
