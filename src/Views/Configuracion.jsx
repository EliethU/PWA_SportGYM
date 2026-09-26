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
  Save,
  Bell,
  Shield,
  Database,
  Palette,
} from "lucide-react";
import Encabezado from "../Components/Encabezado";
import "../Styles/Home.css";
import "../Styles/Configuracion.css";

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
];

export default function Configuracion() {
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
                className={`menuItem ${item.name === "Configuración" ? 'activeMenu' : ''}`}
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
        <Encabezado title="Configuración" description="Ajustes del sistema" />

        {/* =========================
            CONTENIDO CONFIGURACIÓN
        ========================== */}
        <section className="content">

          <div className="configContainer">
            
            {/* INFORMACIÓN GENERAL */}
            <div className="configSection">
              <div className="configSectionHeader">
                <Bell size={20} className="sectionIcon" />
                <h3 className="configSectionTitle">Información general</h3>
              </div>
              
              <div className="configForm">
                <div className="formGroup">
                  <label className="formLabel">Nombre del gimnasio</label>
                  <input
                    type="text"
                    className="formInput"
                    placeholder="SPORT GYM"
                  />
                </div>

                <div className="formGroup">
                  <label className="formLabel">Dirección</label>
                  <input
                    type="text"
                    className="formInput"
                    placeholder="Dirección del gimnasio"
                  />
                </div>

                <div className="formRow">
                  <div className="formGroup">
                    <label className="formLabel">Teléfono</label>
                    <input
                      type="tel"
                      className="formInput"
                      placeholder="Número de teléfono"
                    />
                  </div>

                  <div className="formGroup">
                    <label className="formLabel">Correo</label>
                    <input
                      type="email"
                      className="formInput"
                      placeholder="correo@ejemplo.com"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* NOTIFICACIONES */}
            <div className="configSection">
              <div className="configSectionHeader">
                <Bell size={20} className="sectionIcon" />
                <h3 className="configSectionTitle">Notificaciones</h3>
              </div>
              
              <div className="configForm">
                <div className="toggleItem">
                  <div className="toggleInfo">
                    <span className="toggleLabel">Notificaciones de pagos</span>
                    <span className="toggleDescription">Recibir alertas de pagos vencidos</span>
                  </div>
                  <label className="toggleSwitch">
                    <input type="checkbox" />
                    <span className="toggleSlider"></span>
                  </label>
                </div>

                <div className="toggleItem">
                  <div className="toggleInfo">
                    <span className="toggleLabel">Notificaciones de membresías</span>
                    <span className="toggleDescription">Alertas de vencimiento de membresías</span>
                  </div>
                  <label className="toggleSwitch">
                    <input type="checkbox" />
                    <span className="toggleSlider"></span>
                  </label>
                </div>

                <div className="toggleItem">
                  <div className="toggleInfo">
                    <span className="toggleLabel">Notificaciones de inventario</span>
                    <span className="toggleDescription">Alertas de stock bajo</span>
                  </div>
                  <label className="toggleSwitch">
                    <input type="checkbox" />
                    <span className="toggleSlider"></span>
                  </label>
                </div>
              </div>
            </div>

            {/* SEGURIDAD */}
            <div className="configSection">
              <div className="configSectionHeader">
                <Shield size={20} className="sectionIcon" />
                <h3 className="configSectionTitle">Seguridad</h3>
              </div>
              
              <div className="configForm">
                <div className="formGroup">
                  <label className="formLabel">Contraseña actual</label>
                  <input
                    type="password"
                    className="formInput"
                    placeholder="••••••••"
                  />
                </div>

                <div className="formRow">
                  <div className="formGroup">
                    <label className="formLabel">Nueva contraseña</label>
                    <input
                      type="password"
                      className="formInput"
                      placeholder="••••••••"
                    />
                  </div>

                  <div className="formGroup">
                    <label className="formLabel">Confirmar contraseña</label>
                    <input
                      type="password"
                      className="formInput"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* BOTÓN GUARDAR */}
            <div className="configActions">
              <button className="saveButton">
                <Save size={18} />
                <span>Guardar cambios</span>
              </button>
            </div>

          </div>

        </section>

      </main>
    </div>
  );
}