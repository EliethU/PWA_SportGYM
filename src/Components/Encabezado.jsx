import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronDown,
  Bell,
  Shield,
  Settings,
  Save,
  LogOut,
} from "lucide-react";
import "../Styles/Home.css";

const adminMenuOptions = [
  {
    title: "Información general",
    description: "Nombre, dirección y contacto del gimnasio.",
    icon: Settings,
    path: "/configuracion",
  },
  {
    title: "Notificaciones",
    description: "Alertas de pagos, membresías e inventario.",
    icon: Bell,
    path: "/configuracion",
  },
  {
    title: "Seguridad",
    description: "Cambios de contraseña y acceso del administrador.",
    icon: Shield,
    path: "/configuracion",
  },
];

const Encabezado = ({ title = "Inicio", description = "Panel administrativo" }) => {
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);

  useEffect(() => {
    if (!isAdminMenuOpen) return undefined;

    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsAdminMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isAdminMenuOpen]);

  const handleMenuSelection = (path) => {
    setIsAdminMenuOpen(false);
    navigate(path);
  };

  return (
    <header className="header">

      <div>
        <h2 className="pageTitle">{title}</h2>
        <p className="pageDescription">
          {description}
        </p>
      </div>

      <div className="userMenuWrapper" ref={menuRef}>
        <button
          type="button"
          className="userButton"
          onClick={() => setIsAdminMenuOpen((open) => !open)}
          aria-expanded={isAdminMenuOpen}
          aria-controls="admin-menu-panel"
        >
          <div className="avatar">
            A
          </div>

          <div className="userInfo">
            <strong>Administrador</strong>
            <span>Administrador</span>
          </div>

          <ChevronDown size={17} />
        </button>

        {isAdminMenuOpen && (
          <div className="adminMenuPanel" id="admin-menu-panel" role="menu" aria-label="Menú de administrador">
            <div className="adminMenuHeader">
              <div>
                <span className="adminMenuEyebrow">Panel</span>
                <h3>Configuración</h3>
              </div>
            </div>

            <div className="adminMenuItems">
              {adminMenuOptions.map(({ title, description, icon: Icon, path }) => (
                <button
                  key={title}
                  type="button"
                  className="adminMenuItem"
                  onClick={() => handleMenuSelection(path)}
                  role="menuitem"
                >
                  <span className="adminMenuIcon">
                    <Icon size={16} />
                  </span>
                  <span className="adminMenuText">
                    <strong>{title}</strong>
                    <small>{description}</small>
                  </span>
                </button>
              ))}
            </div>

            <button
              type="button"
              className="adminMenuAction"
              onClick={() => handleMenuSelection("/configuracion")}
            >
              <Save size={16} />
              <span>Guardar cambios</span>
            </button>

            <button
              type="button"
              className="adminMenuLogout"
              onClick={() => handleMenuSelection("/")}
            >
              <LogOut size={16} />
              <span>Cerrar sesión</span>
            </button>
          </div>
        )}
      </div>

    </header>
  );
};

export default Encabezado;
