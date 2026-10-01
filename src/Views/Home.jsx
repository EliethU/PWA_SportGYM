import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Home as HomeIcon,
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
  DollarSign,
  AlertCircle,
  Clock,
  UserPlus,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import "../Styles/Home.css";
import Encabezado from "../Components/Encabezado";

/* ------------------------------------------------------------------ */
/*  TOKENS DE DISEÑO                                                   */
/* ------------------------------------------------------------------ */
const DESIGN_TOKENS = {
  colors: {
    fondo: '#F2F5F0',
    tarjeta: '#FFFFFF',
    borde: '#E1E8DD',
    tinta: '#14201F',
    tintaSuave: '#66756F',
    verde: '#4C9A3A',
    verdeOscuro: '#173230',
    verdeClaro: '#E6F2E1',
    azul: '#2F80B8',
    azulClaro: '#E3F0F8',
    rojo: '#D64545',
    rojoClaro: '#FBE7E7',
    ambar: '#E0902B',
    ambarClaro: '#FCF0DD',
  },
  spacing: {
    chico: 10,
    medio: 16,
    grande: 22,
  }
};

const menuItems = [
  { name: "Inicio", icon: HomeIcon, path: "/home" },
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

/* ------------------------------------------------------------------ */
/*  DATOS MOCKUP (reemplaza con datos reales de tu API)                */
/* ------------------------------------------------------------------ */
const MOCK_DATA = {
  clientesActivos: 0,
  nuevosClientes: 0,
  membresiasPorVencer: 0,
  membresiasVencidas: 0,
  ingresosHoy: 0,
  ingresosSemanales: 0,
  ingresosMensuales: 0,
  gastosMensuales: 0,
  ganancia: 0,
};

const formatCurrency = (n) => 'C$ ' + n.toLocaleString('en-US');

/* ------------------------------------------------------------------ */
/*  COMPONENTES REUTILIZABLES                                          */
/* ------------------------------------------------------------------ */
function KpiCard({ titulo, valor, icono: Icon, color, fondo, acento }) {
  return (
    <div className={`kpi-card ${acento ? 'kpi-card-accent' : ''}`} style={{ '--accent-color': color }}>
      <div className="kpi-icon" style={{ backgroundColor: fondo }}>
        <Icon size={22} color={color} />
      </div>
      <div className="kpi-content">
        <h3 className="kpi-title">{titulo}</h3>
        <p className="kpi-value">{valor}</p>
      </div>
    </div>
  );
}

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
        <Encabezado
          title="Inicio"
          description="Panel administrativo"
        />

        {/* =========================
            CONTENIDO DASHBOARD
        ========================== */}
        <section className="content">

          {/* HÉROE: Ganancia aproximada */}
          <div className="hero-section">
            <div className="hero-circle hero-circle-1" />
            <div className="hero-circle hero-circle-2" />
            <div className="hero-content">
              <div className="hero-header">
                <div className="hero-icon">
                  <DollarSign size={26} color="#fff" />
                </div>
                <h2 className="hero-title">Ganancia aproximada</h2>
              </div>
              <p className="hero-value">{formatCurrency(MOCK_DATA.ganancia)}</p>
              <div className="hero-footer">
                <div className="hero-mini">
                  <span className="hero-mini-label">Ingresos del mes</span>
                  <span className="hero-mini-value">{formatCurrency(MOCK_DATA.ingresosMensuales)}</span>
                </div>
                <div className="hero-divider" />
                <div className="hero-mini">
                  <span className="hero-mini-label">Gastos del mes</span>
                  <span className="hero-mini-value">{formatCurrency(MOCK_DATA.gastosMensuales)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* CLIENTES */}
          <h3 className="section-group">Clientes</h3>
          <div className="kpi-grid">
            <KpiCard
              titulo="Clientes activos"
              valor={String(MOCK_DATA.clientesActivos)}
              icono={Users}
              color={DESIGN_TOKENS.colors.azul}
              fondo={DESIGN_TOKENS.colors.azulClaro}
            />
            <KpiCard
              titulo="Nuevos clientes"
              valor={String(MOCK_DATA.nuevosClientes)}
              icono={UserPlus}
              color={DESIGN_TOKENS.colors.verde}
              fondo={DESIGN_TOKENS.colors.verdeClaro}
            />
            <KpiCard
              titulo="Membresías por vencer"
              valor={String(MOCK_DATA.membresiasPorVencer)}
              icono={Clock}
              color={DESIGN_TOKENS.colors.ambar}
              fondo={DESIGN_TOKENS.colors.ambarClaro}
              acento
            />
            <KpiCard
              titulo="Membresías vencidas"
              valor={String(MOCK_DATA.membresiasVencidas).padStart(2, '0')}
              icono={AlertCircle}
              color={DESIGN_TOKENS.colors.rojo}
              fondo={DESIGN_TOKENS.colors.rojoClaro}
              acento
            />
          </div>

          {/* DINERO */}
          <h3 className="section-group">Dinero</h3>
          <div className="kpi-grid">
            <KpiCard
              titulo="Ingresos hoy"
              valor={formatCurrency(MOCK_DATA.ingresosHoy)}
              icono={TrendingUp}
              color={DESIGN_TOKENS.colors.verde}
              fondo={DESIGN_TOKENS.colors.verdeClaro}
            />
            <KpiCard
              titulo="Ingresos semanales"
              valor={formatCurrency(MOCK_DATA.ingresosSemanales)}
              icono={TrendingUp}
              color={DESIGN_TOKENS.colors.verde}
              fondo={DESIGN_TOKENS.colors.verdeClaro}
            />
            <KpiCard
              titulo="Ingresos mensuales"
              valor={formatCurrency(MOCK_DATA.ingresosMensuales)}
              icono={TrendingUp}
              color={DESIGN_TOKENS.colors.verde}
              fondo={DESIGN_TOKENS.colors.verdeClaro}
            />
            <KpiCard
              titulo="Gastos mensuales"
              valor={formatCurrency(MOCK_DATA.gastosMensuales)}
              icono={TrendingDown}
              color={DESIGN_TOKENS.colors.rojo}
              fondo={DESIGN_TOKENS.colors.rojoClaro}
            />
          </div>

          {/* GRÁFICOS */}
          <h3 className="section-group">Resumen</h3>
          <div className="charts-container">

            {/* GRÁFICO DE INGRESOS VS GASTOS */}
            <div className="chart-card">
              <div className="chart-header">
                <h3 className="chart-title">Ingresos vs. gastos</h3>
                <div className="chart-legend">
                  <div className="legend-item">
                    <div className="legend-dot" style={{ backgroundColor: DESIGN_TOKENS.colors.verde }} />
                    <span className="legend-text">Ingresos</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-dot" style={{ backgroundColor: DESIGN_TOKENS.colors.azul }} />
                    <span className="legend-text">Gastos</span>
                  </div>
                </div>
              </div>
              <div className="chart-content">
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={[
                    { name: 'Ene', ingresos: 0, gastos: 0 },
                    { name: 'Feb', ingresos: 0, gastos: 0 },
                    { name: 'Mar', ingresos: 0, gastos: 0 },
                    { name: 'Abr', ingresos: 0, gastos: 0 },
                    { name: 'May', ingresos: 0, gastos: 0 },
                    { name: 'Jun', ingresos: 0, gastos: 0 },
                    { name: 'Jul', ingresos: 0, gastos: 0 },
                    { name: 'Ago', ingresos: 0, gastos: 0 },
                    { name: 'Sep', ingresos: 0, gastos: 0 },
                    { name: 'Oct', ingresos: 0, gastos: 0 },
                    { name: 'Nov', ingresos: 0, gastos: 0 },
                    { name: 'Dic', ingresos: 0, gastos: 0 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e5e5" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#7b8788' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#7b8788' }} />
                    <Tooltip cursor={{ fill: 'rgba(76, 154, 58, 0.1)' }} />
                    <Bar dataKey="ingresos" fill={DESIGN_TOKENS.colors.verde} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="gastos" fill={DESIGN_TOKENS.colors.azul} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* INVENTARIO BAJO */}
            <div className="inventory-card">
              <div className="card-header-section">
                <h3 className="section-title-card">Productos con bajo inventario</h3>
                <div className="alert-chip">
                  <span className="alert-chip-text">4 productos</span>
                </div>
              </div>
              <div className="inventory-list">
                {[
                  { nombre: 'Proteína Whey', cantidad: 0, maximo: 40 },
                  { nombre: 'Creatina', cantidad: 0, maximo: 40 },
                  { nombre: 'Botellas de agua', cantidad: 0, maximo: 60 },
                  { nombre: 'Raptor', cantidad: 0, maximo: 40 },
                ].map((producto, index) => {
                  const porcentaje = Math.min(100, (producto.cantidad / producto.maximo) * 100);
                  const critico = producto.cantidad <= 5;
                  const color = critico ? DESIGN_TOKENS.colors.rojo : DESIGN_TOKENS.colors.ambar;
                  return (
                    <div key={producto.nombre} className="inventory-item">
                      <div className="inventory-item-top">
                        <span className="product-name">{producto.nombre}</span>
                        <span className="product-quantity" style={{ color }}>{producto.cantidad} uds</span>
                      </div>
                      <div className="progress-track">
                        <div
                          className="progress-bar"
                          style={{ width: `${porcentaje}%`, backgroundColor: color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* ACTIVIDAD RECIENTE */}
          <h3 className="section-group">Actividad reciente</h3>
          <div className="recent-activity">
            <div className="activity-list">
              <div className="activity-item">
                <div className="activity-icon" style={{ backgroundColor: DESIGN_TOKENS.colors.verde }}>
                  <CreditCard size={16} color="#fff" />
                </div>
                <div className="activity-info">
                  <span className="activity-text">Sin actividad reciente</span>
                  <span className="activity-time">-</span>
                </div>
              </div>
            </div>
          </div>

        </section>

      </main>
    </div>
  );
}
