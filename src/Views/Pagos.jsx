import React, { useEffect, useState } from "react";
import { QrCode } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
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
  Search,
  Plus,
  Eye,
  Download,
  X,
} from "lucide-react";
import { collection, onSnapshot } from "firebase/firestore";
import Encabezado from "../Components/Encabezado";
import FacturaPago from "../Components/FacturaPago";
import { db } from "../assets/database/firebaseconfig.jsx";
import { downloadPaymentInvoice } from "../services/paymentInvoice.js";
import "../Styles/Home.css";
import "../Styles/Pagos.css";

const menuItems = [
  { name: "Inicio", icon: LayoutDashboard, path: "/home" },
  { name: "Asistencia", icon: QrCode, path: "/asistencia" },
  { name: "Clientes", icon: Users, path: "/clientes" },
  { name: "Membresías", icon: CreditCard, path: "/membresias" },
  { name: "Pagos", icon: Wallet, path: "/pagos" },
  { name: "Ventas", icon: ShoppingCart, path: "/ventas" },
  { name: "Inventario", icon: Package, path: "/inventario" },
  { name: "Gastos", icon: Receipt, path: "/gastos" },
  { name: "Análisis y estadísticas", icon: FileText, path: "/analisis" },
  { name: "Reportes", icon: FileText, path: "/reportes" },
  { name: "Cerrar sesión", icon: LogOut, path: "/" },
];

const parseDate = (value) => {
  if (!value) return null;
  if (value?.toDate) return value.toDate();
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDate = (value) => {
  const date = parseDate(value);
  return date
    ? new Intl.DateTimeFormat("es-NI", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date)
    : "-";
};

const formatMoney = (amount) =>
  new Intl.NumberFormat("es-NI", { style: "currency", currency: "NIO" }).format(Number(amount) || 0);

const normalizeSearchValue = (value) => String(value ?? "")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLocaleLowerCase();

const getPaymentClientName = (payment) => payment.nombreCliente || payment.clienteNombre || payment.cliente || "Cliente";
const getPaymentMembership = (payment) => payment.nombreMembresia || payment.membresia || payment.concepto || "Membresía";
const getPaymentDate = (payment) => payment.fechaPago || payment.fecha || payment.creadoEn;

export default function Pagos() {
  const navigate = useNavigate();
  const location = useLocation();
  const [payments, setPayments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [error, setError] = useState("");
  const [feedback] = useState(location.state?.feedback || "");

  useEffect(() => {
    if (location.state?.feedback) {
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location, navigate]);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "pagos"),
      (snapshot) => {
        setPayments(snapshot.docs.map((payment) => ({ id: payment.id, ...payment.data() })));
        setError("");
      },
      (snapshotError) => {
        console.error("Error al cargar los pagos:", snapshotError);
        setError("No se pudieron cargar los pagos. Revisa la conexión con Firebase.");
      },
    );

    return () => unsubscribe();
  }, []);

  const filteredPayments = payments.filter((payment) => {
    const query = normalizeSearchValue(searchTerm.trim());
    return !query || [
      getPaymentClientName(payment),
      getPaymentMembership(payment),
      payment.monto,
      formatMoney(payment.monto),
    ].some((value) => normalizeSearchValue(value).includes(query));
  });

  const handleDownloadInvoice = async (payment) => {
    try {
      await downloadPaymentInvoice(payment);
    } catch (downloadError) {
      console.error("Error al descargar la factura:", downloadError);
      setError("No se pudo generar la factura PDF.");
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
                className={`menuItem ${item.name === "Pagos" ? 'activeMenu' : ''} ${item.name === "Cerrar sesión" ? "logoutMenuItem" : ""}`}
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
        <Encabezado title="Pagos" description="Gestiona los pagos del gimnasio" />

        {/* =========================
            CONTENIDO PAGOS
        ========================== */}
        <section className="content">
          <div className="paymentsToolbar">
            <label className="paymentsSearch" htmlFor="payments-search">
              <Search size={18} aria-hidden="true" />
              <input
                id="payments-search"
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar cliente, membresía o monto"
              />
            </label>
            <button type="button" className="paymentNewButton" onClick={() => navigate("/nuevo-pago")}>
              <Plus size={18} />
              <span>Nuevo pago</span>
            </button>
          </div>

          {error && <p className="paymentNotice paymentNoticeError" role="alert">{error}</p>}
          {feedback && <p className="paymentNotice paymentNoticeSuccess" role="status">{feedback}</p>}

          <div className="paymentsTableContainer">
            <div className="paymentsTableHeading">
              <h3 className="paymentsTableTitle">Historial de pagos</h3>
              <span className="paymentsCount">{filteredPayments.length} {filteredPayments.length === 1 ? "pago" : "pagos"}</span>
            </div>
            <div className="paymentsTableWrapper">
              <table className="paymentsTable">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Membresía</th>
                    <th>Monto</th>
                    <th>Fecha del pago</th>
                    <th>Vencimiento</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.length ? filteredPayments.map((payment) => (
                    <tr key={payment.id}>
                      <td className="paymentClientCell">{getPaymentClientName(payment)}</td>
                      <td>{getPaymentMembership(payment)}</td>
                      <td className="paymentAmountCell">{formatMoney(payment.monto)}</td>
                      <td>{formatDate(getPaymentDate(payment))}</td>
                      <td>{formatDate(payment.fechaVencimiento || payment.vencimiento)}</td>
                      <td>
                        <div className="paymentActions">
                          <button type="button" className="paymentActionButton paymentViewButton" onClick={() => setSelectedPayment(payment)} title="Visualizar pago" aria-label={`Visualizar pago de ${getPaymentClientName(payment)}`}>
                            <Eye size={17} />
                          </button>
                          <button type="button" className="paymentActionButton paymentDownloadButton" onClick={() => handleDownloadInvoice(payment)} title="Descargar factura PDF" aria-label={`Descargar factura de ${getPaymentClientName(payment)}`}>
                            <Download size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr className="paymentsEmptyRow">
                      <td colSpan="6" className="paymentsEmptyCell">
                        {searchTerm ? "No hay pagos que coincidan con la búsqueda." : "Aún no hay pagos registrados."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

      </main>

      {selectedPayment && (
        <div className="paymentDialogBackdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setSelectedPayment(null);
        }}>
          <section className="paymentDialog" role="dialog" aria-modal="true" aria-labelledby="payment-detail-title">
            <div className="paymentDialogHeader">
              <div>
                <span className="paymentDialogEyebrow">{selectedPayment.numeroFactura || `PAY-${selectedPayment.id.slice(0, 8).toUpperCase()}`}</span>
                <h2 id="payment-detail-title">Detalle del pago</h2>
              </div>
              <button type="button" className="paymentCloseButton" onClick={() => setSelectedPayment(null)} aria-label="Cerrar">
                <X size={19} />
              </button>
            </div>
            <FacturaPago payment={selectedPayment} />
            <div className="paymentDialogActions paymentDetailActions">
              <button type="button" className="paymentCancelButton" onClick={() => setSelectedPayment(null)}>Cerrar</button>
              <button type="button" className="paymentSaveButton" onClick={() => handleDownloadInvoice(selectedPayment)}>
                <Download size={17} />
                <span>Descargar factura</span>
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}