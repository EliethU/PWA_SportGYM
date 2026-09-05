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
  Camera,
  User,
} from "lucide-react";
import Encabezado from "../Components/Encabezado";
import "../Styles/Home.css";
import "../Styles/Asistencia.css";

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

export default function Asistencia() {
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
                className={`menuItem ${item.name === "Asistencia IA" ? 'activeMenu' : ''}`}
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
        <Encabezado title="Asistencia con IA" description="Control de asistencia con reconocimiento facial" />

        {/* =========================
            CONTENIDO ASISTENCIA
        ========================== */}
        <section className="content">

          <div className="assistanceContainer">
            {/* ÁREA DE CÁMARA */}
            <div className="cameraSection">
              <h3 className="sectionTitle">CÁMARA / IA</h3>
              <div className="cameraPlaceholder">
                <Camera size={64} className="cameraIcon" />
                <p>Cámara desactivada</p>
                <span className="cameraHint">Conecta una cámara para usar reconocimiento facial</span>
              </div>
            </div>

            {/* LISTA DE ASISTENCIA */}
            <div className="attendanceList">
              <h3 className="sectionTitle">Asistencias de hoy</h3>
              
              <div className="attendanceItems">
                {/* Datos vacíos - sin base de datos */}
                <div className="emptyAttendance">
                  <User size={48} className="emptyIcon" />
                  <p>No hay asistencias registradas hoy</p>
                </div>
              </div>
            </div>
          </div>

        </section>

      </main>
    </div>
  );
}