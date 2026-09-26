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
  TrendingUp,
  TrendingDown,
  LogOut,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import "../Styles/Home.css";
import Encabezado from "../Components/Encabezado";

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

export default function Home() {
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
                className={`menuItem ${index === 0 ? 'activeMenu' : ''} ${item.name === "Cerrar sesión" ? "logoutMenuItem" : ""}`}
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
        <Encabezado title="Inicio" description="Panel administrativo" />

        {/* =========================
            CONTENIDO DASHBOARD
        ========================== */}
        <section className="content">

          <div className="welcome">
            <h1>Bienvenido a SPORT GYM</h1>
            <p>
              Administra fácilmente las operaciones de tu gimnasio.
            </p>
          </div>

          {/* TARJETAS DE RESUMEN */}
          <div className="summaryCards">

            <div className="summaryCard income">
              <div className="cardHeader">
                <span className="cardTitle">Ingresos</span>
                <TrendingUp size={18} className="cardIcon" />
              </div>
              <strong className="cardNumber">C$ 0</strong>
              <span className="cardDescription">
                Ingresos del mes
              </span>
            </div>

            <div className="summaryCard sales">
              <div className="cardHeader">
                <span className="cardTitle">Ventas</span>
                <TrendingUp size={18} className="cardIcon" />
              </div>
              <strong className="cardNumber">C$ 0</strong>
              <span className="cardDescription">
                Ventas del mes
              </span>
            </div>

            <div className="summaryCard expenses">
              <div className="cardHeader">
                <span className="cardTitle">Gastos</span>
                <TrendingDown size={18} className="cardIcon" />
              </div>
              <strong className="cardNumber">C$ 0</strong>
              <span className="cardDescription">
                Gastos del mes
              </span>
            </div>

            <div className="summaryCard utility">
              <div className="cardHeader">
                <span className="cardTitle">Utilidad</span>
                <TrendingUp size={18} className="cardIcon" />
              </div>
              <strong className="cardNumber">C$ 0</strong>
              <span className="cardDescription">
                Utilidad del mes
              </span>
            </div>

          </div>

          {/* GRÁFICOS */}
          <div className="chartsContainer">

            {/* GRÁFICO DE INGRESOS VS GASTOS */}
            <div className="chartCard">
              <h3 className="chartTitle">Ingresos vs. gastos</h3>
              <div className="chartContent">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[]}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e5e5" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#7b8788' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#7b8788' }} />
                    <Tooltip cursor={{ fill: 'rgba(76, 154, 58, 0.1)' }} />
                    <Bar dataKey="ingresos" fill="#4c9a3a" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="gastos" fill="#e74c3c" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* GRÁFICO DE INGRESOS POR CATEGORÍA */}
            <div className="chartCard">
              <h3 className="chartTitle">Ingresos por categoría</h3>
              <div className="chartContent">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[]} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e0e5e5" />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#7b8788' }} />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#7b8788' }} width={80} />
                    <Tooltip cursor={{ fill: 'rgba(76, 154, 58, 0.1)' }} />
                    <Bar dataKey="value" fill="#4c9a3a" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* ACTIVIDAD RECIENTE */}
          <div className="recentActivity">
            <h3 className="sectionTitle">Actividad reciente</h3>
            <div className="activityList">
              <div className="activityItem">
                <div className="activityIcon">
                  <CreditCard size={16} />
                </div>
                <div className="activityInfo">
                  <span className="activityText">Pago membresía Juan Pérez - C$0</span>
                  <span className="activityTime">Hace 0 minutos</span>
                </div>
              </div>
              <div className="activityItem">
                <div className="activityIcon">
                  <ShoppingCart size={16} />
                </div>
                <div className="activityInfo">
                  <span className="activityText">Venta suplemento - Proteína 2 lb - C$0</span>
                  <span className="activityTime">Hace 0 minutos</span>
                </div>
              </div>
              <div className="activityItem">
                <div className="activityIcon">
                  <Receipt size={16} />
                </div>
                <div className="activityInfo">
                  <span className="activityText">Gasto energía eléctrica - C$0</span>
                  <span className="activityTime">Hace 0 minutos</span>
                </div>
              </div>
            </div>
          </div>

        </section>

      </main>
    </div>
  );
}
