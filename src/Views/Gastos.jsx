import React, { useEffect, useMemo, useState } from "react";
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
  Plus,
  Search,
  Eye,
  X,
  CircleDollarSign,
} from "lucide-react";
import Encabezado from "../Components/Encabezado";
import FacturaGasto from "../Components/FacturaGasto";
import Pagination, { PAGE_SIZE } from "../Components/Pagination";
import { markExpenseAsPaid, subscribeToExpenses } from "../services/gastosService";
import AdminSidebar from "../Components/AdminSidebar";
import "../Styles/Home.css";
import "../Styles/Gastos.css";

const getLocalDateValue = (date) => (
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
);

const parseDate = (value) => {
  if (!value) return null;
  if (typeof value?.toDate === "function") return value.toDate();
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getExpenseDate = (expense) => expense.fecha || expense.fechaGasto || expense.creadoEn;
const getExpenseStatus = (expense) => {
  const value = String(expense.estado || "Pendiente").toLocaleLowerCase();
  return value === "pagado" ? "Pagado" : "Pendiente";
};
const getExpenseMethod = (expense) => expense.metodo || expense.metodoPago || "";
const getExpenseConcept = (expense) => expense.concepto || expense.descripcion || "Gasto";
const getExpenseCategory = (expense) => expense.categoria || "Sin categoría";
const getExpenseAmount = (expense) => Number(expense.monto ?? expense.total ?? 0);
const formatMoney = (amount) => new Intl.NumberFormat("es-NI", {
  style: "currency",
  currency: "NIO",
}).format(Number(amount) || 0);
const formatDate = (value) => {
  const date = parseDate(value);
  return date
    ? new Intl.DateTimeFormat("es-NI", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date)
    : "-";
};
const normalize = (value) => String(value ?? "")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLocaleLowerCase();

export default function Gastos() {
  const navigate = useNavigate();
  const location = useLocation();
  const [expenses, setExpenses] = useState([]);
  const today = new Date();
  const [startDate, setStartDate] = useState(getLocalDateValue(new Date(today.getFullYear(), today.getMonth(), 1)));
  const [endDate, setEndDate] = useState(getLocalDateValue(today));
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState(location.state?.feedback || "");
  const [feedbackType] = useState(location.state?.feedbackType || "success");
  const [updatingExpenseId, setUpdatingExpenseId] = useState("");

  useEffect(() => subscribeToExpenses(
    (updatedExpenses) => {
      setExpenses(updatedExpenses);
      setIsLoading(false);
      setError("");
    },
    (snapshotError) => {
      console.error("Error al cargar los gastos:", snapshotError);
      setError("No se pudieron cargar los gastos. Verifica tu conexión y los permisos de Firestore.");
      setIsLoading(false);
    },
  ), []);

  useEffect(() => {
    if (!location.state?.feedback) return;
    navigate(location.pathname, { replace: true, state: null });
  }, [location, navigate]);

  const categories = useMemo(
    () => [...new Set(expenses.map((expense) => expense.categoria).filter(Boolean))].sort((a, b) => a.localeCompare(b, "es")),
    [expenses],
  );

  const currentMonthExpenses = useMemo(() => {
    const now = new Date();
    return expenses.filter((expense) => {
      const date = parseDate(getExpenseDate(expense));
      return date && date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
    });
  }, [expenses]);

  const filteredExpenses = useMemo(() => expenses.filter((expense) => {
    const date = parseDate(getExpenseDate(expense));
    const dateValue = date ? getLocalDateValue(date) : "";
    const matchesDate = (!startDate || (dateValue && dateValue >= startDate))
      && (!endDate || (dateValue && dateValue <= endDate));
    const matchesCategory = !categoryFilter || getExpenseCategory(expense) === categoryFilter;
    const matchesStatus = !statusFilter || getExpenseStatus(expense) === statusFilter;
    const matchesMethod = !methodFilter || getExpenseMethod(expense) === methodFilter;
    const query = normalize(searchTerm.trim());
    const matchesSearch = !query || normalize([
      getExpenseConcept(expense),
      getExpenseCategory(expense),
      expense.proveedor,
      getExpenseAmount(expense),
      formatMoney(getExpenseAmount(expense)),
    ].join(" ")).includes(query);
    return matchesDate && matchesCategory && matchesStatus && matchesMethod && matchesSearch;
  }).sort((first, second) => getExpenseConcept(first).localeCompare(getExpenseConcept(second), "es", { sensitivity: "base" })), [
    expenses,
    startDate,
    endDate,
    categoryFilter,
    statusFilter,
    methodFilter,
    searchTerm,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [startDate, endDate, categoryFilter, statusFilter, methodFilter, searchTerm]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, Math.max(1, Math.ceil(filteredExpenses.length / PAGE_SIZE))));
  }, [filteredExpenses.length]);

  const paginatedExpenses = filteredExpenses.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleRegisterPayment = async (expense) => {
    setUpdatingExpenseId(expense.id);
    setError("");
    try {
      await markExpenseAsPaid(expense.id, getExpenseMethod(expense) || "Efectivo");
      setFeedback("El pago del gasto se registró correctamente.");
    } catch (paymentError) {
      console.error("Error al registrar el pago del gasto:", paymentError);
      setError("No se pudo registrar el pago. Verifica la conexión y los permisos de Firestore.");
    } finally {
      setUpdatingExpenseId("");
    }
  };

  return (
    <div className="app">
      <AdminSidebar />

      <main className="main">
        <Encabezado title="Gastos" description="Gestiona los gastos del negocio" />
        <section className="content expensesContent">
          <div className="gastosHeader">
            <button className="newExpenseButton" onClick={() => navigate("/registrar-gasto")}>
              <Plus size={18} />
              <span>Registrar gasto</span>
            </button>
          </div>

          <div className="expenseStats">
            <article className="expenseStat expenseStatCount">
              <span className="expenseStatIcon"><Receipt size={20} /></span>
              <strong>{currentMonthExpenses.length}</strong>
              <span>Gastos registrados este mes</span>
            </article>
            <article className="expenseStat expenseStatTotal">
              <span className="expenseStatIcon"><CircleDollarSign size={20} /></span>
              <strong>{formatMoney(currentMonthExpenses.reduce((total, expense) => total + getExpenseAmount(expense), 0))}</strong>
              <span>Total de gasto de este mes</span>
            </article>
          </div>

          <div className="expensesFilters">
            <label className="expenseFilterField">
              <span>Desde</span>
              <input aria-label="Fecha inicial" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
            </label>
            <label className="expenseFilterField">
              <span>Hasta</span>
              <input aria-label="Fecha final" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
            </label>
            <label className="expenseFilterField">
              <span>Categoría</span>
              <select aria-label="Filtrar por categoría" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
                <option value="">Todas</option>
                {categories.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
            </label>
            <label className="expenseFilterField">
              <span>Estado</span>
              <select aria-label="Filtrar por estado" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="">Todos</option>
                <option value="Pagado">Pagado</option>
                <option value="Pendiente">Pendiente</option>
              </select>
            </label>
            <label className="expenseFilterField">
              <span>Método</span>
              <select aria-label="Filtrar por método" value={methodFilter} onChange={(event) => setMethodFilter(event.target.value)}>
                <option value="">Todos</option>
                <option value="Efectivo">Efectivo</option>
                <option value="Transferencia">Transferencia</option>
              </select>
            </label>
            <label className="expenseSearchField">
              <span className="srOnly">Buscar gastos</span>
              <Search size={17} aria-hidden="true" />
              <input type="search" placeholder="Buscar gasto..." value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} />
            </label>
          </div>

          {error && <p className="expensesNotice expensesNoticeError" role="alert">{error}</p>}
          {feedback && <p className={`expensesNotice ${feedbackType === "warning" ? "expensesNoticeWarning" : "expensesNoticeSuccess"}`} role={feedbackType === "warning" ? "alert" : "status"}>{feedback}</p>}

          <div className="gastosTableContainer">
            <div className="expensesTableHeading">
              <h3 className="tableTitle">Gastos del negocio</h3>
              <span>{filteredExpenses.length} {filteredExpenses.length === 1 ? "gasto" : "gastos"}</span>
            </div>
            <div className="tableWrapper">
              <table className="gastosTable expensesTable">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Concepto</th>
                    <th>Categoría</th>
                    <th>Monto</th>
                    <th>Estado</th>
                    <th>Método</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan="7" className="emptyCell">Cargando gastos...</td></tr>
                  ) : filteredExpenses.length ? paginatedExpenses.map((expense) => {
                    const status = getExpenseStatus(expense);
                    return (
                      <tr key={expense.id}>
                        <td>{formatDate(getExpenseDate(expense))}</td>
                        <td className="expenseConceptCell">{getExpenseConcept(expense)}</td>
                        <td>{getExpenseCategory(expense)}</td>
                        <td className="expenseAmountCell">{formatMoney(getExpenseAmount(expense))}</td>
                        <td><span className={`expenseStatusBadge ${status === "Pagado" ? "expenseStatusPaid" : "expenseStatusPending"}`}>{status}</span></td>
                        <td>{getExpenseMethod(expense) || "-"}</td>
                        <td>
                          <div className="expenseActions">
                            <button type="button" className="expenseViewButton" onClick={() => setSelectedExpense(expense)} title="Visualizar factura" aria-label={`Visualizar factura de ${getExpenseConcept(expense)}`}>
                              <Eye size={17} />
                            </button>
                            {status === "Pendiente" && (
                              <button type="button" className="expensePayButton" onClick={() => handleRegisterPayment(expense)} disabled={updatingExpenseId === expense.id}>
                                {updatingExpenseId === expense.id ? "Guardando..." : "Registrar pago"}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr className="emptyRow">
                      <td colSpan="7" className="emptyCell">{error ? "No fue posible cargar los gastos." : "No hay gastos para los filtros seleccionados."}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pagination currentPage={currentPage} onPageChange={setCurrentPage} totalItems={filteredExpenses.length} />
          </div>
        </section>
      </main>

      {selectedExpense && (
        <div className="expenseInvoiceOverlay" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setSelectedExpense(null);
        }}>
          <section className="expenseInvoiceDialog" role="dialog" aria-modal="true" aria-labelledby="expense-invoice-title">
            <button type="button" className="expenseInvoiceClose" onClick={() => setSelectedExpense(null)} aria-label="Cerrar factura"><X size={20} /></button>
            <FacturaGasto expense={selectedExpense} />
          </section>
        </div>
      )}
    </div>
  );
}
