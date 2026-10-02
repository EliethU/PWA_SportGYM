import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, onSnapshot } from "firebase/firestore";
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
  CalendarDays,
  Download,
  TrendingUp,
  TrendingDown,
  BadgeDollarSign,
  CircleDollarSign,
  ChartNoAxesCombined,
  LoaderCircle,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Encabezado from "../Components/Encabezado";
import { db } from "../assets/database/firebaseconfig";
import { subscribeToExpenses } from "../services/gastosService";
import { subscribeToSales } from "../services/ventasService";
import "../Styles/Home.css";
import "../Styles/Analisis.css";

const menuItems = [
  { name: "Inicio", icon: LayoutDashboard, path: "/home" },
  { name: "Clientes", icon: Users, path: "/clientes" },
  { name: "Membresías", icon: CreditCard, path: "/membresias" },
  { name: "Pagos", icon: Wallet, path: "/pagos" },
  { name: "Ventas", icon: ShoppingCart, path: "/ventas" },
  { name: "Inventario", icon: Package, path: "/inventario" },
  { name: "Gastos", icon: Receipt, path: "/gastos" },
  { name: "Análisis y estadísticas", icon: ChartNoAxesCombined, path: "/analisis" },
  { name: "Reportes", icon: FileText, path: "/reportes" },
  { name: "Cerrar sesión", icon: LogOut, path: "/" },
];

const CHART_COLORS = ["#4C9A3A", "#2F80B8", "#E0902B", "#8A63D2", "#D64545", "#25A18E"];
const PERIOD_OPTIONS = [
  { value: "30", label: "Últimos 30 días", days: 30 },
  { value: "15", label: "Últimos 15 días", days: 15 },
  { value: "7", label: "Últimos 7 días", days: 7 },
  { value: "1", label: "Hoy", days: 1 },
];
const getLocalDateValue = (date) => (
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
);
const parseDate = (value) => {
  if (!value) return null;
  if (typeof value?.toDate === "function") return parseDate(value.toDate());
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
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
const dateValue = (value) => {
  const date = parseDate(value);
  return date ? getLocalDateValue(date) : "";
};
const isWithinRange = (value, startDate, endDate) => {
  const date = dateValue(value);
  return Boolean(startDate && endDate && startDate <= endDate && date >= startDate && date <= endDate);
};
const getSaleDate = (sale) => sale.fechaVenta || sale.fecha || sale.creadoEn;
const getExpenseDate = (expense) => expense.fecha || expense.fechaGasto || expense.creadoEn;
const getPaymentDate = (payment) => payment.fechaPago || payment.fecha || payment.creadoEn;
const getMoney = (record) => {
  const amount = Number(record.total ?? record.totalVenta ?? record.monto ?? record.subtotal ?? 0);
  return Number.isFinite(amount) ? amount : 0;
};
const getExpenseAmount = (expense) => {
  const amount = Number(expense.monto ?? expense.total ?? 0);
  return Number.isFinite(amount) ? amount : 0;
};
const getItems = (sale) => {
  if (Array.isArray(sale.items)) return sale.items;
  if (Array.isArray(sale.productos)) return sale.productos;
  const name = sale.nombreProducto || sale.productoNombre || sale.producto;
  return name ? [{
    nombreProducto: name,
    cantidad: sale.cantidad || 1,
    precioUnitario: sale.precioUnitario ?? sale.monto ?? sale.total ?? 0,
  }] : [];
};
const getItemName = (item) => (
  item.nombreProducto || item.productoNombre || item.nombre || item.name || item.producto || "Producto"
);
const getItemQuantity = (item) => {
  const quantity = Number(item.cantidad ?? item.quantity ?? 1);
  return Number.isFinite(quantity) ? quantity : 0;
};
const getItemRevenue = (item) => {
  const quantity = getItemQuantity(item);
  const unitPrice = Number(item.precioUnitario ?? item.precio ?? item.price ?? 0);
  const subtotal = Number(item.subtotal ?? item.subTotal);
  return Number.isFinite(subtotal) ? subtotal : quantity * (Number.isFinite(unitPrice) ? unitPrice : 0);
};
const getClientName = (client) => (
  client.nombreCliente || client.clienteNombre || [client.nombre, client.apellido].filter(Boolean).join(" ")
  || client.usuario || client.cliente || "Cliente"
);
const normalize = (value) => String(value ?? "")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .trim()
  .toLocaleLowerCase();
const formatMoney = (amount) => new Intl.NumberFormat("es-NI", {
  style: "currency",
  currency: "NIO",
  maximumFractionDigits: 2,
}).format(Number(amount) || 0);
const formatShortDate = (value) => {
  const date = parseDate(value);
  return date ? new Intl.DateTimeFormat("es-NI", { day: "2-digit", month: "short" }).format(date) : "";
};
const formatRange = (start, end) => {
  const format = (value) => {
    const date = parseDate(value);
    return date ? new Intl.DateTimeFormat("es-NI", { day: "2-digit", month: "long", year: "numeric" }).format(date) : value;
  };
  return `${format(start)} — ${format(end)}`;
};
const toRecords = (snapshot) => snapshot.docs.map((document) => ({ id: document.id, ...document.data() }));

function MetricCard({ title, value, icon: Icon, tone }) {
  return (
    <article className={`analyticsMetric analyticsMetric-${tone}`}>
      <div className="analyticsMetricIcon"><Icon size={21} strokeWidth={2} /></div>
      <div className="analyticsMetricCopy">
        <span>{title}</span>
        <strong>{value}</strong>
      </div>
    </article>
  );
}

function EmptyChart({ message }) {
  return <div className="analyticsEmpty">{message}</div>;
}

export default function Analisis() {
  const navigate = useNavigate();
  const todayValue = getLocalDateValue(new Date());
  const [startDate, setStartDate] = useState(() => {
    const start = new Date();
    start.setDate(start.getDate() - 29);
    return getLocalDateValue(start);
  });
  const [endDate, setEndDate] = useState(todayValue);
  const [selectedPeriod, setSelectedPeriod] = useState("30");
  const [sales, setSales] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [payments, setPayments] = useState([]);
  const [clients, setClients] = useState([]);
  const [loadingSources, setLoadingSources] = useState(["ventas", "gastos", "pagos", "clientes"]);
  const [loadErrors, setLoadErrors] = useState({});
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  useEffect(() => {
    const updateSource = (source, setter) => (records) => {
      setter(records);
      setLoadingSources((current) => current.filter((item) => item !== source));
      setLoadErrors((current) => {
        if (!current[source]) return current;
        const next = { ...current };
        delete next[source];
        return next;
      });
    };
    const failSource = (source) => (error) => {
      console.error(`Error al cargar ${source} para análisis:`, error);
      setLoadingSources((current) => current.filter((item) => item !== source));
      setLoadErrors((current) => ({ ...current, [source]: true }));
    };

    const unsubscribeSales = subscribeToSales(updateSource("ventas", setSales), failSource("ventas"));
    const unsubscribeExpenses = subscribeToExpenses(updateSource("gastos", setExpenses), failSource("gastos"));
    const unsubscribePayments = onSnapshot(
      collection(db, "pagos"),
      (snapshot) => updateSource("pagos", setPayments)(toRecords(snapshot)),
      failSource("pagos"),
    );
    const unsubscribeClients = onSnapshot(
      collection(db, "clientes"),
      (snapshot) => updateSource("clientes", setClients)(toRecords(snapshot)),
      failSource("clientes"),
    );

    return () => {
      unsubscribeSales();
      unsubscribeExpenses();
      unsubscribePayments();
      unsubscribeClients();
    };
  }, []);

  const setPreset = (value) => {
    setSelectedPeriod(value);
    const option = PERIOD_OPTIONS.find((item) => item.value === value);
    if (!option) return;
    const end = new Date();
    const start = new Date(end);
    start.setDate(start.getDate() - option.days + 1);
    setStartDate(getLocalDateValue(start));
    setEndDate(getLocalDateValue(end));
  };

  const handleDateChange = (setter) => (event) => {
    setter(event.target.value);
    setSelectedPeriod("custom");
  };

  const validDateRange = Boolean(startDate && endDate && startDate <= endDate);
  const periodSales = useMemo(
    () => sales.filter((sale) => isWithinRange(getSaleDate(sale), startDate, endDate)),
    [sales, startDate, endDate],
  );
  const periodExpenses = useMemo(
    () => expenses.filter((expense) => isWithinRange(getExpenseDate(expense), startDate, endDate)),
    [expenses, startDate, endDate],
  );
  const periodPayments = useMemo(
    () => payments.filter((payment) => isWithinRange(getPaymentDate(payment), startDate, endDate)),
    [payments, startDate, endDate],
  );

  const analytics = useMemo(() => {
    const productTotals = new Map();
    const clientTotals = new Map();
    const dailyTotals = new Map();
    let salesIncome = 0;
    let paymentIncome = 0;
    let expenseTotal = 0;

    const addDailyAmount = (date, field, amount) => {
      const key = dateValue(date);
      if (!key) return;
      const current = dailyTotals.get(key) || { date: key, ingresos: 0, gastos: 0 };
      current[field] += amount;
      dailyTotals.set(key, current);
    };
    periodSales.forEach((sale) => {
      const total = getMoney(sale);
      salesIncome += total;
      addDailyAmount(getSaleDate(sale), "ingresos", total);
      const clientKey = sale.clienteId || normalize(getClientName(sale));
      const clientTotal = clientTotals.get(clientKey) || { name: getClientName(sale), purchases: 0, payments: 0 };
      clientTotal.name = getClientName(sale);
      clientTotal.purchases += 1;
      clientTotals.set(clientKey, clientTotal);
      getItems(sale).forEach((item) => {
        const name = getItemName(item);
        const entry = productTotals.get(name) || { name, quantity: 0, revenue: 0 };
        entry.quantity += getItemQuantity(item);
        entry.revenue += getItemRevenue(item);
        productTotals.set(name, entry);
      });
    });
    periodPayments.forEach((payment) => {
      const amount = getMoney(payment);
      paymentIncome += amount;
      addDailyAmount(getPaymentDate(payment), "ingresos", amount);
      const key = payment.clienteId || normalize(getClientName(payment));
      const paymentClient = clients.find((client) => client.id === payment.clienteId);
      const clientTotal = clientTotals.get(key) || {
        name: paymentClient ? getClientName(paymentClient) : getClientName(payment),
        purchases: 0,
        payments: 0,
      };
      clientTotal.payments += amount;
      clientTotals.set(key, clientTotal);
    });
    periodExpenses.forEach((expense) => {
      const amount = getExpenseAmount(expense);
      expenseTotal += amount;
      addDailyAmount(getExpenseDate(expense), "gastos", amount);
    });

    const dayCursor = parseDate(startDate);
    const end = parseDate(endDate);
    const chartData = [];
    if (dayCursor && end && validDateRange) {
      while (dayCursor <= end && chartData.length < 366) {
        const key = getLocalDateValue(dayCursor);
        chartData.push({ date: key, name: formatShortDate(key), ...(dailyTotals.get(key) || { ingresos: 0, gastos: 0 }) });
        dayCursor.setDate(dayCursor.getDate() + 1);
      }
    }
    const productsByQuantity = [...productTotals.values()].sort((a, b) => b.quantity - a.quantity || b.revenue - a.revenue);
    const clientsByPayments = [...clientTotals.values()].sort((a, b) => b.payments - a.payments || b.purchases - a.purchases);
    const income = salesIncome + paymentIncome;
    return {
      income,
      expenseTotal,
      netProfit: income - expenseTotal,
      salesCount: periodSales.length,
      chartData,
      products: productsByQuantity,
      productChart: productsByQuantity.slice(0, 6),
      clients: clientsByPayments,
      salesIncome,
      paymentIncome,
    };
  }, [periodSales, periodExpenses, periodPayments, clients, startDate, endDate, validDateRange]);

  const isLoading = loadingSources.length > 0;
  const dataError = Object.keys(loadErrors).length > 0;

  const handleExport = async () => {
    setIsExporting(true);
    setExportError("");
    try {
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 16;
      let y = 20;
      const ensureSpace = (height = 8) => {
        if (y + height > pageHeight - 16) {
          pdf.addPage();
          y = 20;
        }
      };
      const writeSection = (title) => {
        ensureSpace(16);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(12);
        pdf.setTextColor(23, 50, 48);
        pdf.text(title, margin, y);
        y += 8;
      };
      const writeRows = (headers, rows, widths) => {
        const rowHeight = 7;
        ensureSpace(10);
        pdf.setFillColor(23, 50, 48);
        pdf.rect(margin, y - 4, pageWidth - margin * 2, rowHeight, "F");
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8);
        pdf.setTextColor(255, 255, 255);
        let x = margin + 2;
        headers.forEach((header, index) => {
          pdf.text(String(header), x, y);
          x += widths[index];
        });
        y += rowHeight;
        rows.forEach((row) => {
          ensureSpace(rowHeight);
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(8);
          pdf.setTextColor(57, 70, 66);
          let cellX = margin + 2;
          row.forEach((cell, index) => {
            const content = pdf.splitTextToSize(String(cell), Math.max(widths[index] - 3, 10))[0] || "";
            pdf.text(content, cellX, y);
            cellX += widths[index];
          });
          y += rowHeight;
        });
        y += 5;
      };

      pdf.setFillColor(23, 50, 48);
      pdf.rect(0, 0, pageWidth, 34, "F");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(17);
      pdf.setTextColor(255, 255, 255);
      pdf.text("ANÁLISIS Y ESTADÍSTICAS", margin, 16);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(221, 235, 217);
      pdf.text(`Período: ${formatRange(startDate, endDate)}`, margin, 25);
      y = 46;

      writeSection("Resumen financiero");
      writeRows(
        ["Ingresos", "Gastos", "Ganancia neta", "Ventas"],
        [[formatMoney(analytics.income), formatMoney(analytics.expenseTotal), formatMoney(analytics.netProfit), String(analytics.salesCount)]],
        [43, 43, 48, 35],
      );
      writeSection("Ingresos vs. gastos por día");
      writeRows(
        ["Fecha", "Ingresos", "Gastos"],
        analytics.chartData.map((day) => [day.date, formatMoney(day.ingresos), formatMoney(day.gastos)]),
        [45, 65, 65],
      );
      writeSection("Productos más vendidos");
      writeRows(
        ["Producto", "Cantidad", "Ingreso"],
        analytics.products.map((product) => [product.name, String(product.quantity), formatMoney(product.revenue)]),
        [95, 35, 45],
      );
      writeSection("Top clientes");
      writeRows(
        ["Cliente", "Compras", "Total de pagos"],
        analytics.clients.map((client) => [client.name, String(client.purchases), formatMoney(client.payments)]),
        [95, 35, 45],
      );
      pdf.save(`analisis-estadisticas-${startDate}-${endDate}.pdf`);
    } catch (error) {
      console.error("Error al exportar el análisis a PDF:", error);
      setExportError("No se pudo generar el PDF. Inténtalo de nuevo.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="logoContainer">
          <img src="/logo-port-gym.png" alt="Port Gym" className="logoImage" />
        </div>
        <nav className="menu">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.name}
                className={`menuItem ${item.name === "Análisis y estadísticas" ? "activeMenu" : ""} ${item.name === "Cerrar sesión" ? "logoutMenuItem" : ""}`}
                onClick={() => navigate(item.path)}
              >
                <Icon size={18} strokeWidth={2} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>
      </aside>
      <main className="main">
        <Encabezado title="Análisis y estadísticas" description="Consulta el rendimiento financiero y comercial" />
        <section className="content analyticsContent">
          <div className="analyticsToolbar">
            <div className="analyticsDateFields">
              <label className="analyticsDateField">
                <span><CalendarDays size={15} /> Desde</span>
                <input type="date" value={startDate} max={endDate || undefined} onChange={handleDateChange(setStartDate)} />
              </label>
              <label className="analyticsDateField">
                <span><CalendarDays size={15} /> Hasta</span>
                <input type="date" value={endDate} min={startDate || undefined} max={todayValue} onChange={handleDateChange(setEndDate)} />
              </label>
              <label className="analyticsPeriodField">
                <span>Período rápido</span>
                <select value={selectedPeriod} onChange={(event) => setPreset(event.target.value)}>
                  {PERIOD_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  <option value="custom">Personalizado</option>
                </select>
              </label>
            </div>
            <button className="analyticsExportButton" type="button" onClick={handleExport} disabled={isExporting || !validDateRange}>
              {isExporting ? <LoaderCircle className="analyticsSpinner" size={17} /> : <Download size={17} />}
              {isExporting ? "Generando PDF..." : "Exportar todo en PDF"}
            </button>
          </div>
          {!validDateRange && <p className="analyticsMessage analyticsMessageError">La fecha de inicio debe ser anterior o igual a la fecha de fin.</p>}
          {dataError && <p className="analyticsMessage analyticsMessageError">No se pudieron cargar algunos datos. Los resultados podrían estar incompletos.</p>}
          {exportError && <p className="analyticsMessage analyticsMessageError">{exportError}</p>}
          {isLoading && <p className="analyticsMessage"><LoaderCircle className="analyticsSpinner" size={16} /> Cargando datos financieros y comerciales…</p>}

          <div className="analyticsMetrics">
            <MetricCard title="Ingresos totales" value={formatMoney(analytics.income)} icon={TrendingUp} tone="income" />
            <MetricCard title="Gastos totales" value={formatMoney(analytics.expenseTotal)} icon={TrendingDown} tone="expense" />
            <MetricCard title="Ganancia neta" value={formatMoney(analytics.netProfit)} icon={BadgeDollarSign} tone="profit" />
            <MetricCard title="Ventas realizadas" value={analytics.salesCount.toLocaleString("es-NI")} icon={CircleDollarSign} tone="sales" />
          </div>

          <div className="analyticsCharts">
            <article className="analyticsPanel">
              <div className="analyticsPanelHeading">
                <div>
                  <h2>Ingresos vs. gastos</h2>
                  <p>Comparativo diario · {formatRange(startDate, endDate)}</p>
                </div>
                <ChartNoAxesCombined size={19} />
              </div>
              {analytics.chartData.length ? (
                <div className="analyticsBarChart">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.chartData} margin={{ top: 8, right: 8, left: 4, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E1E8DD" />
                      <XAxis dataKey="name" tick={{ fill: "#66756F", fontSize: 10 }} interval="preserveStartEnd" minTickGap={14} />
                      <YAxis tick={{ fill: "#66756F", fontSize: 10 }} tickFormatter={(value) => (value >= 1000 ? `${Number((value / 1000).toFixed(1))}k` : value)} width={42} />
                      <Tooltip formatter={(value, name) => [formatMoney(value), name === "ingresos" ? "Ingresos" : "Gastos"]} labelFormatter={(label, payload) => payload?.[0]?.payload?.date || label} />
                      <Legend formatter={(value) => value === "ingresos" ? "Ingresos" : "Gastos"} />
                      <Bar dataKey="ingresos" name="ingresos" fill="#4C9A3A" radius={[4, 4, 0, 0]} maxBarSize={22} />
                      <Bar dataKey="gastos" name="gastos" fill="#E0902B" radius={[4, 4, 0, 0]} maxBarSize={22} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : <EmptyChart message="No hay datos para mostrar en este período." />}
            </article>

            <article className="analyticsPanel">
              <div className="analyticsPanelHeading">
                <div>
                  <h2>Ventas por producto</h2>
                  <p>Distribución por unidades vendidas</p>
                </div>
                <ShoppingCart size={19} />
              </div>
              {analytics.productChart.length ? (
                <>
                  <div className="analyticsDonutChart">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={analytics.productChart} dataKey="quantity" nameKey="name" innerRadius="57%" outerRadius="83%" paddingAngle={3} stroke="none">
                          {analytics.productChart.map((product, index) => <Cell key={product.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(value, name) => [`${value} unidades`, name]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="analyticsDonutLegend">
                    {analytics.productChart.map((product, index) => (
                      <div className="analyticsLegendRow" key={product.name}>
                        <span className="analyticsLegendName"><i style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />{product.name}</span>
                        <strong>{product.quantity}</strong>
                      </div>
                    ))}
                  </div>
                </>
              ) : <EmptyChart message="Aún no hay productos vendidos en este período." />}
            </article>
          </div>

          <div className="analyticsTables">
            <article className="analyticsPanel analyticsTablePanel">
              <div className="analyticsPanelHeading">
                <div>
                  <h2>Productos más vendidos</h2>
                  <p>Unidades e ingreso generado</p>
                </div>
                <Package size={19} />
              </div>
              <div className="analyticsTableScroll">
                <table className="analyticsTable">
                  <thead><tr><th>Producto</th><th>Cantidad</th><th>Ingreso</th></tr></thead>
                  <tbody>
                    {analytics.products.slice(0, 8).map((product) => (
                      <tr key={product.name}><td>{product.name}</td><td>{product.quantity}</td><td>{formatMoney(product.revenue)}</td></tr>
                    ))}
                    {!analytics.products.length && <tr><td className="analyticsNoRows" colSpan="3">No hay productos vendidos en este período.</td></tr>}
                  </tbody>
                </table>
              </div>
            </article>
            <article className="analyticsPanel analyticsTablePanel">
              <div className="analyticsPanelHeading">
                <div>
                  <h2>Top clientes</h2>
                  <p>Compras y total de pagos del período</p>
                </div>
                <Users size={19} />
              </div>
              <div className="analyticsTableScroll">
                <table className="analyticsTable">
                  <thead><tr><th>Cliente</th><th>Compras</th><th>Total de pagos</th></tr></thead>
                  <tbody>
                    {analytics.clients.slice(0, 8).map((client, index) => (
                      <tr key={`${client.name}-${index}`}><td>{client.name}</td><td>{client.purchases}</td><td>{formatMoney(client.payments)}</td></tr>
                    ))}
                    {!analytics.clients.length && <tr><td className="analyticsNoRows" colSpan="3">No hay actividad de clientes en este período.</td></tr>}
                  </tbody>
                </table>
              </div>
            </article>
          </div>
        </section>
      </main>
    </div>
  );
}
