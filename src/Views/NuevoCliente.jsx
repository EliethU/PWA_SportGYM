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
  ArrowLeft,
  Save,
  Phone,
  Mail,
  User,
  Calendar,
} from "lucide-react";
import Encabezado from "../Components/Encabezado";
import "../Styles/Home.css";
import "../Styles/NuevoCliente.css";

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

export default function NuevoCliente() {
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
        <Encabezado title="Nuevo cliente" description="Agrega un nuevo cliente al sistema" />

        {/* =========================
            CONTENIDO NUEVO CLIENTE
        ========================== */}
        <section className="content">

          {/* BOTÓN VOLVER */}
          <button className="backButton" onClick={() => navigate("/clientes")}>
            <ArrowLeft size={18} />
            <span>Volver a clientes</span>
          </button>

          {/* FORMULARIO DE CLIENTE */}
          <div className="clientFormContainer">
            <h3 className="formTitle">Información del cliente</h3>
            
            <form className="clientForm">
              <div className="formSection">
                <h4 className="formSectionTitle">Datos personales</h4>
                
                <div className="formGroup">
                  <label className="formLabel">
                    <User size={16} className="labelIcon" />
                    Nombre completo
                  </label>
                  <input
                    type="text"
                    className="formInput"
                    placeholder="Nombre del cliente"
                  />
                </div>

                <div className="formRow">
                  <div className="formGroup">
                    <label className="formLabel">
                      <Phone size={16} className="labelIcon" />
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      className="formInput"
                      placeholder="Número de teléfono"
                    />
                  </div>

                  <div className="formGroup">
                    <label className="formLabel">
                      <Mail size={16} className="labelIcon" />
                      Correo electrónico
                    </label>
                    <input
                      type="email"
                      className="formInput"
                      placeholder="correo@ejemplo.com"
                    />
                  </div>
                </div>
              </div>

              <div className="formSection">
                <h4 className="formSectionTitle">Información de membresía</h4>
                
                <div className="formRow">
                  <div className="formGroup">
                    <label className="formLabel">Tipo de membresía</label>
                    <select className="formSelect">
                      <option value="">Seleccionar membresía</option>
                      <option value="premium">Premium</option>
                      <option value="mensual">Mensual</option>
                      <option value="semanal">Semanal</option>
                      <option value="diaria">Diaria</option>
                    </select>
                  </div>

                  <div className="formGroup">
                    <label className="formLabel">
                      <Calendar size={16} className="labelIcon" />
                      Fecha de inicio
                    </label>
                    <input
                      type="date"
                      className="formInput"
                    />
                  </div>
                </div>
              </div>

              <div className="formSection">
                <h4 className="formSectionTitle">Información adicional</h4>
                
                <div className="formGroup">
                  <label className="formLabel">Notas adicionales</label>
                  <textarea
                    className="formTextarea"
                    placeholder="Observaciones o notas sobre el cliente..."
                    rows={3}
                  />
                </div>
              </div>

              <div className="formActions">
                <button type="button" className="cancelButton" onClick={() => navigate("/clientes")}>
                  Cancelar
                </button>
                <button type="submit" className="saveButton">
                  <Save size={18} />
                  <span>Guardar cliente</span>
                </button>
              </div>
            </form>
          </div>

        </section>

      </main>
    </div>
  );
}