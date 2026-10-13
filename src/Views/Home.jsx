import React, { useEffect, useState } from "react";
import { QrCode } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { collection, onSnapshot } from "firebase/firestore";
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
import AdminSidebar from "../Components/AdminSidebar";
import "../Styles/Home.css";
import Encabezado from "../Components/Encabezado";
import { db } from "../assets/database/firebaseconfig";
import { subscribeToExpenses } from "../services/gastosService";
import { subscribeToProducts } from "../services/productosService";
import { subscribeToSales } from "../services/ventasService";

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

const DASHBOARD_SOURCES = ["clientes", "pagos", "ventas", "gastos", "productos"];
const MONTH_NAMES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const formatCurrency = (value) => `C$ ${Number(value || 0).toLocaleString("es-NI")}`;
const getDocumentData = (snapshot) => snapshot.docs.map((document) => ({ id: document.id, ...document.data() }));

const parseDate = (value) => {
  if (!value) return null;
  if (typeof value.toDate === "function") {
    const date = value.toDate();
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : new Date(value);
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
      ? date
      : null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const getPaymentDate = (payment) => payment.fechaPago || payment.fecha || payment.creadoEn;
const getSaleDate = (sale) => sale.fechaVenta || sale.fecha || sale.creadoEn;
const getExpenseDate = (expense) => expense.fecha || expense.fechaGasto || expense.creadoEn;
const getIncomeAmount = (record) => {
  const amount = Number(record.monto ?? record.total ?? record.subtotal ?? 0);
  return Number.isFinite(amount) ? amount : 0;
};
const getExpenseAmount = (expense) => {
  const amount = Number(expense.monto ?? expense.total ?? 0);
  return Number.isFinite(amount) ? amount : 0;
};
const normalizeStatus = (value) => String(value || "")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLocaleLowerCase();

const getClientExpirationDate = (client) =>
  parseDate(client.fechaVencimiento || client.fechaFin || client.fechaExpiracion);

const isClientExpired = (client, today) => {
  const status = normalizeStatus(client.estadoPago || client.pagoEstado || client.estadoTransaccion || client.estado);
  const expirationDate = getClientExpirationDate(client);
  return status.includes("vencid")
    || status.includes("expir")
    || Boolean(expirationDate && startOfDay(expirationDate) < today);
};

const getClientName = (client) =>
  [client.nombre, client.apellido].filter(Boolean).join(" ") || client.usuario || "Cliente";

const getActivityDateLabel = (date) => new Intl.DateTimeFormat("es-NI", {
  dateStyle: "short",
  timeStyle: "short",
}).format(date);

const createMonthlyChartData = (payments, sales, expenses, year) => {
  const monthlyData = MONTH_NAMES.map((name) => ({ name, ingresos: 0, gastos: 0 }));

  const addIncome = (records, getRecordDate) => records.forEach((record) => {
    const date = parseDate(getRecordDate(record));
    if (date?.getFullYear() === year) monthlyData[date.getMonth()].ingresos += getIncomeAmount(record);
  });
  addIncome(payments, getPaymentDate);
  addIncome(sales, getSaleDate);

  expenses.forEach((expense) => {
    const date = parseDate(getExpenseDate(expense));
    if (date?.getFullYear() === year) {
      monthlyData[date.getMonth()].gastos += getExpenseAmount(expense);
    }
  });

  return monthlyData;
};

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
  const [clients, setClients] = useState([]);
  const [payments, setPayments] = useState([]);
  const [sales, setSales] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [products, setProducts] = useState([]);
  const [loadingSources, setLoadingSources] = useState(DASHBOARD_SOURCES);
  const [loadErrors, setLoadErrors] = useState({});

  useEffect(() => {
    const handleData = (source, setData) => (records) => {
      setData(records);
      setLoadingSources((current) => current.filter((item) => item !== source));
      setLoadErrors((current) => {
        if (!current[source]) return current;
        const next = { ...current };
        delete next[source];
        return next;
      });
    };
    const handleError = (source) => (error) => {
      console.error(`Error al cargar ${source} en el panel de inicio:`, error);
      setLoadingSources((current) => current.filter((item) => item !== source));
      setLoadErrors((current) => ({ ...current, [source]: true }));
    };

    const unsubscribeClients = onSnapshot(
      collection(db, "clientes"),
      (snapshot) => handleData("clientes", setClients)(getDocumentData(snapshot)),
      handleError("clientes"),
    );
    const unsubscribePayments = onSnapshot(
      collection(db, "pagos"),
      (snapshot) => handleData("pagos", setPayments)(getDocumentData(snapshot)),
      handleError("pagos"),
    );
    const unsubscribeSales = subscribeToSales(
      handleData("ventas", setSales),
      handleError("ventas"),
    );
    const unsubscribeExpenses = subscribeToExpenses(
      handleData("gastos", setExpenses),
      handleError("gastos"),
    );
    const unsubscribeProducts = subscribeToProducts(
      handleData("productos", setProducts),
      handleError("productos"),
    );

    return () => {
      unsubscribeClients();
      unsubscribePayments();
      unsubscribeSales();
      unsubscribeExpenses();
      unsubscribeProducts();
    };
  }, []);

  const isLoading = loadingSources.length > 0;
  const dataError = Object.keys(loadErrors).length > 0;
  const now = new Date();
  const today = startOfDay(now);
  const year = now.getFullYear();
  const monthStart = new Date(year, now.getMonth(), 1);
  const nextMonthStart = new Date(year, now.getMonth() + 1, 1);
  const endOfNow = new Date(now.getTime() + 1);
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  const nextWeekStart = new Date(today);
  nextWeekStart.setDate(today.getDate() + 7);

  const paymentRecords = payments.map((payment) => ({
    amount: getIncomeAmount(payment),
    date: parseDate(getPaymentDate(payment)),
  })).filter((record) => record.date);
  const saleRecords = sales.map((sale) => ({
    amount: getIncomeAmount(sale),
    date: parseDate(getSaleDate(sale)),
  })).filter((record) => record.date);
  const incomeRecords = [...paymentRecords, ...saleRecords];
  const getIncomeBetween = (start, end) => incomeRecords
    .filter(({ date }) => date >= start && date < end)
    .reduce((total, { amount }) => total + amount, 0);
  const monthlyExpenses = expenses
    .filter((expense) => {
      const date = parseDate(getExpenseDate(expense));
      return date && date >= monthStart && date < endOfNow;
    })
    .reduce((total, expense) => total + getExpenseAmount(expense), 0);
  const expiredMemberships = clients.filter((client) => isClientExpired(client, today));
  const expiringMemberships = clients.filter((client) => {
    if (isClientExpired(client, today)) return false;
    const expirationDate = getClientExpirationDate(client);
    return expirationDate && startOfDay(expirationDate) >= today && startOfDay(expirationDate) < nextWeekStart;
  });
  const activeClients = clients.filter((client) => {
    const status = normalizeStatus(client.estado);
    return (status === "activo" || status === "active") && !isClientExpired(client, today);
  });
  const newClients = clients.filter((client) => {
    const registeredAt = parseDate(client.creadoEn || client.fechaInscripcion || client.fechaRegistro);
    return registeredAt && registeredAt >= monthStart && registeredAt < nextMonthStart;
  });
  const monthlyChartData = createMonthlyChartData(payments, sales, expenses, year);
  const lowStockProducts = products
    .map((product) => ({
      ...product,
      quantity: Number(product.stock ?? 0),
      minimumStock: Number(product.minimumStock ?? 5),
    }))
    .filter((product) => Number.isFinite(product.quantity)
      && Number.isFinite(product.minimumStock)
      && (product.status === "Stock bajo" || product.quantity <= product.minimumStock))
    .sort((first, second) => first.quantity - second.quantity)
    .slice(0, 4);
  const lowStockCount = products.filter((product) => {
    const quantity = Number(product.stock ?? 0);
    const minimumStock = Number(product.minimumStock ?? 5);
    return Number.isFinite(quantity) && Number.isFinite(minimumStock)
      && (product.status === "Stock bajo" || quantity <= minimumStock);
  }).length;
  const activities = [
    ...payments.map((payment) => ({
      id: `payment-${payment.id}`,
      type: "payment",
      text: `Pago de ${payment.nombreCliente || payment.clienteNombre || "Cliente"} · ${formatCurrency(getIncomeAmount(payment))}`,
      date: parseDate(getPaymentDate(payment)),
    })),
    ...sales.map((sale) => ({
      id: `sale-${sale.id}`,
      type: "sale",
      text: `Venta a ${sale.nombreCliente || "Cliente"} · ${formatCurrency(getIncomeAmount(sale))}`,
      date: parseDate(getSaleDate(sale)),
    })),
    ...expenses.map((expense) => ({
      id: `expense-${expense.id}`,
      type: "expense",
      text: `Gasto: ${expense.concepto || expense.descripcion || "Gasto"} · ${formatCurrency(getExpenseAmount(expense))}`,
      date: parseDate(getExpenseDate(expense)),
    })),
    ...clients.map((client) => ({
      id: `client-${client.id}`,
      type: "client",
      text: `Nuevo cliente: ${getClientName(client)}`,
      date: parseDate(client.creadoEn || client.fechaInscripcion || client.fechaRegistro),
    })),
  ].filter((activity) => activity.date)
    .sort((first, second) => second.date - first.date)
    .slice(0, 5);
  const activityTypes = {
    payment: { icon: CreditCard, color: DESIGN_TOKENS.colors.verde },
    sale: { icon: ShoppingCart, color: DESIGN_TOKENS.colors.azul },
    expense: { icon: Receipt, color: DESIGN_TOKENS.colors.rojo },
    client: { icon: UserPlus, color: DESIGN_TOKENS.colors.ambar },
  };

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
        <Encabezado
          title="Inicio"
          description="Panel administrativo"
        />

        {/* =========================
            CONTENIDO DASHBOARD
        ========================== */}
        <section className="content">
          {dataError && (
            <p className="dashboard-error" role="alert">
              No se pudieron cargar algunos datos del panel ({Object.keys(loadErrors).join(", ")}).
              Verifica tu conexión y los permisos de Firestore.
            </p>
          )}

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
              <p className="hero-value">
                {isLoading ? "Cargando..." : formatCurrency(getIncomeBetween(monthStart, endOfNow) - monthlyExpenses)}
              </p>
              <div className="hero-footer">
                <div className="hero-mini">
                  <span className="hero-mini-label">Ingresos del mes</span>
                  <span className="hero-mini-value">
                    {isLoading ? "Cargando..." : formatCurrency(getIncomeBetween(monthStart, endOfNow))}
                  </span>
                </div>
                <div className="hero-divider" />
                <div className="hero-mini">
                  <span className="hero-mini-label">Gastos del mes</span>
                  <span className="hero-mini-value">{isLoading ? "Cargando..." : formatCurrency(monthlyExpenses)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* CLIENTES */}
          <h3 className="section-group">Clientes</h3>
          <div className="kpi-grid">
            <KpiCard
              titulo="Clientes activos"
              valor={isLoading ? "..." : String(activeClients.length)}
              icono={Users}
              color={DESIGN_TOKENS.colors.azul}
              fondo={DESIGN_TOKENS.colors.azulClaro}
            />
            <KpiCard
              titulo="Nuevos clientes"
              valor={isLoading ? "..." : String(newClients.length)}
              icono={UserPlus}
              color={DESIGN_TOKENS.colors.verde}
              fondo={DESIGN_TOKENS.colors.verdeClaro}
            />
            <KpiCard
              titulo="Membresías por vencer"
              valor={isLoading ? "..." : String(expiringMemberships.length)}
              icono={Clock}
              color={DESIGN_TOKENS.colors.ambar}
              fondo={DESIGN_TOKENS.colors.ambarClaro}
              acento
            />
            <KpiCard
              titulo="Membresías vencidas"
              valor={isLoading ? "..." : String(expiredMemberships.length).padStart(2, '0')}
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
              valor={isLoading ? "Cargando..." : formatCurrency(getIncomeBetween(today, endOfNow))}
              icono={TrendingUp}
              color={DESIGN_TOKENS.colors.verde}
              fondo={DESIGN_TOKENS.colors.verdeClaro}
            />
            <KpiCard
              titulo="Ingresos semanales"
              valor={isLoading ? "Cargando..." : formatCurrency(getIncomeBetween(weekStart, endOfNow))}
              icono={TrendingUp}
              color={DESIGN_TOKENS.colors.verde}
              fondo={DESIGN_TOKENS.colors.verdeClaro}
            />
            <KpiCard
              titulo="Ingresos mensuales"
              valor={isLoading ? "Cargando..." : formatCurrency(getIncomeBetween(monthStart, endOfNow))}
              icono={TrendingUp}
              color={DESIGN_TOKENS.colors.verde}
              fondo={DESIGN_TOKENS.colors.verdeClaro}
            />
            <KpiCard
              titulo="Gastos mensuales"
              valor={isLoading ? "Cargando..." : formatCurrency(monthlyExpenses)}
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
                <h3 className="chart-title">Ingresos vs. gastos · {year}</h3>
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
                  <BarChart data={monthlyChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e5e5" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#7b8788' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#7b8788' }} tickFormatter={(value) => `C$ ${value}`} />
                    <Tooltip
                      cursor={{ fill: 'rgba(76, 154, 58, 0.1)' }}
                      formatter={(value, name) => [formatCurrency(value), name === "ingresos" ? "Ingresos" : "Gastos"]}
                      labelFormatter={(label) => `${label} ${year}`}
                    />
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
                  <span className="alert-chip-text">{lowStockCount} productos</span>
                </div>
              </div>
              <div className="inventory-list">
                {loadingSources.includes("productos") ? (
                  <p className="dashboard-empty">Cargando inventario...</p>
                ) : lowStockProducts.length ? lowStockProducts.map((product) => {
                  const percentage = Math.min(100, (product.quantity / Math.max(product.minimumStock, 1)) * 100);
                  const color = product.quantity === 0 ? DESIGN_TOKENS.colors.rojo : DESIGN_TOKENS.colors.ambar;
                  return (
                    <div key={product.id} className="inventory-item">
                      <div className="inventory-item-top">
                        <span className="product-name">{product.name || product.nombre || "Producto"}</span>
                        <span className="product-quantity" style={{ color }}>{product.quantity} uds</span>
                      </div>
                      <div className="progress-track">
                        <div
                          className="progress-bar"
                          style={{ width: `${percentage}%`, backgroundColor: color }}
                        />
                      </div>
                    </div>
                  );
                }) : <p className="dashboard-empty">No hay productos con bajo inventario.</p>}
              </div>
            </div>

          </div>

          {/* ACTIVIDAD RECIENTE */}
          <h3 className="section-group">Actividad reciente</h3>
          <div className="recent-activity">
            <div className="activity-list">
              {isLoading ? <p className="dashboard-empty">Cargando actividad...</p> : activities.length ? activities.map((activity) => {
                const { icon: Icon, color } = activityTypes[activity.type];
                return (
                  <div key={activity.id} className="activity-item">
                    <div className="activity-icon" style={{ backgroundColor: color }}>
                      <Icon size={16} color="#fff" />
                    </div>
                    <div className="activity-info">
                      <span className="activity-text">{activity.text}</span>
                      <span className="activity-time">{getActivityDateLabel(activity.date)}</span>
                    </div>
                  </div>
                );
              }) : <p className="dashboard-empty">Sin actividad reciente.</p>}
            </div>
          </div>

        </section>

      </main>
    </div>
  );
}
