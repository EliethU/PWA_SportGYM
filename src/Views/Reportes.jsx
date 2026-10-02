import React, { useState } from "react";
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
  FileText,
  Settings,
  LogOut,
  Download,
} from "lucide-react";
import Encabezado from "../Components/Encabezado";
import { downloadReportPdf } from "../services/reportsPdf";
import "../Styles/Home.css";
import "../Styles/Reportes.css";

const menuItems = [
  { name: "Inicio", icon: LayoutDashboard, path: "/home" },
  { name: "Clientes", icon: Users, path: "/clientes" },
  { name: "Membresías", icon: CreditCard, path: "/membresias" },
  { name: "Pagos", icon: Wallet, path: "/pagos" },
  { name: "Ventas", icon: ShoppingCart, path: "/ventas" },
  { name: "Inventario", icon: Package, path: "/inventario" },
  { name: "Gastos", icon: Receipt, path: "/gastos" },
  { name: "Análisis y estadísticas", icon: FileText, path: "/analisis" },
  { name: "Reportes", icon: FileText, path: "/reportes" },
  { name: "Configuración", icon: Settings, path: "/configuracion" },
  { name: "Cerrar sesión", icon: LogOut, path: "/" },
];

export default function Reportes() {
  const navigate = useNavigate();
  const [generatingReport, setGeneratingReport] = useState("");
  const [error, setError] = useState("");

  const handleGenerateReport = async (reportId) => {
    if (generatingReport) return;
    setGeneratingReport(reportId);
    setError("");
    try {
      await downloadReportPdf(reportId);
    } catch (reportError) {
      console.error("Error al generar el reporte PDF:", reportError);
      setError("No se pudo generar el reporte. Verifica la conexión y los permisos de Firebase e inténtalo de nuevo.");
    } finally {
      setGeneratingReport("");
    }
  };

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
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.name}
                className={`menuItem ${item.name === "Reportes" ? 'activeMenu' : ''} ${item.name === "Cerrar sesión" ? "logoutMenuItem" : ""}`}
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
        <Encabezado title="Reportes" description="Genera y descarga reportes" />

        {/* =========================
            CONTENIDO REPORTES
        ========================== */}
        <section className="content">
          {error && <p className="reportError" role="alert">{error}</p>}

          {/* TARJETAS DE REPORTES */}
          <div className="reportsGrid">

            <div className="reportCard">
              <div className="reportIcon">
                <FileText size={32} />
              </div>
              <h4 className="reportTitle">Reporte de ingresos</h4>
              <p className="reportDescription">Análisis de ingresos mensuales</p>
              <button type="button" className="reportButton" onClick={() => handleGenerateReport("ingresos")} disabled={Boolean(generatingReport)}>
                <Download size={16} />
                <span>{generatingReport === "ingresos" ? "Generando..." : "Generar"}</span>
              </button>
            </div>

            <div className="reportCard">
              <div className="reportIcon">
                <Users size={32} />
              </div>
              <h4 className="reportTitle">Reporte de clientes</h4>
              <p className="reportDescription">Estadísticas de clientes</p>
              <button type="button" className="reportButton" onClick={() => handleGenerateReport("clientes")} disabled={Boolean(generatingReport)}>
                <Download size={16} />
                <span>{generatingReport === "clientes" ? "Generando..." : "Generar"}</span>
              </button>
            </div>

            <div className="reportCard">
              <div className="reportIcon">
                <Receipt size={32} />
              </div>
              <h4 className="reportTitle">Reporte de gastos</h4>
              <p className="reportDescription">Desglose de gastos operativos</p>
              <button type="button" className="reportButton" onClick={() => handleGenerateReport("gastos")} disabled={Boolean(generatingReport)}>
                <Download size={16} />
                <span>{generatingReport === "gastos" ? "Generando..." : "Generar"}</span>
              </button>
            </div>

            <div className="reportCard">
              <div className="reportIcon">
                <Dumbbell size={32} />
              </div>
              <h4 className="reportTitle">Reporte de asistencia</h4>
              <p className="reportDescription">Registro de asistencias</p>
              <button type="button" className="reportButton" onClick={() => handleGenerateReport("asistencia")} disabled={Boolean(generatingReport)}>
                <Download size={16} />
                <span>{generatingReport === "asistencia" ? "Generando..." : "Generar"}</span>
              </button>
            </div>

            <div className="reportCard">
              <div className="reportIcon">
                <ShoppingCart size={32} />
              </div>
              <h4 className="reportTitle">Reporte de ventas</h4>
              <p className="reportDescription">Análisis de ventas</p>
              <button type="button" className="reportButton" onClick={() => handleGenerateReport("ventas")} disabled={Boolean(generatingReport)}>
                <Download size={16} />
                <span>{generatingReport === "ventas" ? "Generando..." : "Generar"}</span>
              </button>
            </div>

            <div className="reportCard">
              <div className="reportIcon">
                <Package size={32} />
              </div>
              <h4 className="reportTitle">Reporte de inventario</h4>
              <p className="reportDescription">Estado del inventario</p>
              <button type="button" className="reportButton" onClick={() => handleGenerateReport("inventario")} disabled={Boolean(generatingReport)}>
                <Download size={16} />
                <span>{generatingReport === "inventario" ? "Generando..." : "Generar"}</span>
              </button>
            </div>

          </div>

        </section>

      </main>
    </div>
  );
}