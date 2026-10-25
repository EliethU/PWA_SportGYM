import React from "react";
import { QrCode } from "lucide-react";
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
  Bell,
  Database,
  Palette,
} from "lucide-react";
import Encabezado from "../Components/Encabezado";
import AdminSidebar from "../Components/AdminSidebar";
import CambioContrasenaForm from "../Components/CambioContrasenaForm";
import "../Styles/Home.css";
import "../Styles/Configuracion.css";

export default function Configuracion() {

  return (
    <div className="app">

      {/* =========================
          BARRA LATERAL
      ========================== */}
      <AdminSidebar />

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

            <CambioContrasenaForm />

            {/* BOTÓN GUARDAR */}
            <div className="configActions">
              <button className="saveButton">
                <span>Guardar cambios</span>
              </button>
            </div>

          </div>

        </section>

      </main>
    </div>
  );
}