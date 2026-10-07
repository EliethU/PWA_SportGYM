import React, { useEffect, useMemo, useState } from "react";
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
  Search,
  Plus,
  CalendarDays,
  CircleDollarSign,
  ChartNoAxesCombined,
  Trophy,
  Eye,
  Download,
  X,
  UserRound,
  PackagePlus,
  LoaderCircle,
  Pencil,
  Trash2,
  Check,
  Clock3,
} from "lucide-react";
import { collection, onSnapshot } from "firebase/firestore";
import Encabezado from "../Components/Encabezado";
import FacturaVenta from "../Components/FacturaVenta";
import { db } from "../assets/database/firebaseconfig.jsx";
import { createSale, subscribeToSales } from "../services/ventasService.js";
import { downloadSaleInvoice } from "../services/salesInvoice.js";
import "../Styles/Home.css";
import "../Styles/Ventas.css";

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

const getLocalDateValue = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getLocalTimeValue = (date) => `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;

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
    ? new Intl.DateTimeFormat("es-NI", { day: "2-digit", month: "short", year: "numeric" }).format(date)
    : "-";
};

const formatMoney = (amount) =>
  new Intl.NumberFormat("es-NI", { style: "currency", currency: "NIO" }).format(Number(amount) || 0);

const normalize = (value) => String(value ?? "")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLocaleLowerCase();

const getSaleDate = (sale) => sale.fechaVenta || sale.fecha || sale.creadoEn;
const getSaleClient = (sale) => sale.nombreCliente || sale.clienteNombre || sale.cliente || "Cliente";
const getSaleTotal = (sale) => Number(sale.total ?? sale.totalVenta ?? sale.monto ?? 0);
const getSaleItems = (sale) => {
  if (Array.isArray(sale.items)) return sale.items;
  if (Array.isArray(sale.productos)) return sale.productos;
  const name = sale.nombreProducto || sale.productoNombre || sale.producto;
  return name ? [{ nombre: name, cantidad: sale.cantidad, precioUnitario: sale.precioUnitario }] : [];
};
const getItemName = (item) => item.nombreProducto || item.productoNombre || item.nombre || item.name || item.producto || "Producto";
const getSaleProductNames = (sale) => getSaleItems(sale).map(getItemName).join(", ") || "Producto";
const getClientName = (client) => [client.nombre, client.apellido].filter(Boolean).join(" ") || client.usuario || "Cliente sin nombre";

export default function Ventas() {
  const navigate = useNavigate();
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const [sales, setSales] = useState([]);
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [startDate, setStartDate] = useState(getLocalDateValue(monthStart));
  const [endDate, setEndDate] = useState(getLocalDateValue(today));
  const [searchTerm, setSearchTerm] = useState("");
  const [searchFilter, setSearchFilter] = useState("todos");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [selectedSale, setSelectedSale] = useState(null);
  const [isSaleFormOpen, setIsSaleFormOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [clientQuery, setClientQuery] = useState("");
  const [productQuery, setProductQuery] = useState("");
  const [saleItems, setSaleItems] = useState([]);
  const [editingItemId, setEditingItemId] = useState("");
  const [saleDate, setSaleDate] = useState(() => getLocalDateValue(new Date()));
  const [saleTime, setSaleTime] = useState(() => getLocalTimeValue(new Date()));
  const [observations, setObservations] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Efectivo");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => subscribeToSales(
    (updatedSales) => {
      setSales(updatedSales);
      setIsLoading(false);
      setError("");
    },
    (snapshotError) => {
      console.error("Error al cargar las ventas:", snapshotError);
      setError("No se pudieron cargar las ventas. Verifica tu conexión y los permisos de Firestore.");
      setIsLoading(false);
    },
  ), []);

  useEffect(() => {
    const unsubscribeClients = onSnapshot(
      collection(db, "clientes"),
      (snapshot) => setClients(snapshot.docs.map((client) => ({ id: client.id, ...client.data() }))),
      (snapshotError) => console.error("Error al cargar clientes para una venta:", snapshotError),
    );
    const unsubscribeProducts = onSnapshot(
      collection(db, "productos"),
      (snapshot) => setProducts(snapshot.docs.map((product) => ({ id: product.id, ...product.data() }))),
      (snapshotError) => console.error("Error al cargar productos para una venta:", snapshotError),
    );
    return () => {
      unsubscribeClients();
      unsubscribeProducts();
    };
  }, []);

  const periodSales = useMemo(() => sales.filter((sale) => {
    const date = parseDate(getSaleDate(sale));
    if (!date) return false;
    const dateValue = getLocalDateValue(date);
    return dateValue >= startDate && dateValue <= endDate;
  }), [sales, startDate, endDate]);

  const filteredSales = useMemo(() => {
    const query = normalize(searchTerm.trim());
    return periodSales.filter((sale) => {
      if (!query) return true;
      if (searchFilter === "cliente") return normalize(getSaleClient(sale)).includes(query);
      if (searchFilter === "producto") return normalize(getSaleProductNames(sale)).includes(query);
      return normalize(`${getSaleClient(sale)} ${getSaleProductNames(sale)}`).includes(query);
    }).sort((first, second) => (parseDate(getSaleDate(second))?.getTime() || 0) - (parseDate(getSaleDate(first))?.getTime() || 0));
  }, [periodSales, searchTerm, searchFilter]);

  const periodTotal = periodSales.reduce((total, sale) => total + getSaleTotal(sale), 0);
  const averageSale = periodSales.length ? periodTotal / periodSales.length : 0;
  const productCounts = periodSales.reduce((counts, sale) => {
    getSaleItems(sale).forEach((item) => {
      const name = getItemName(item);
      counts[name] = (counts[name] || 0) + Number(item.cantidad || item.quantity || 1);
    });
    return counts;
  }, {});
  const bestSeller = Object.entries(productCounts).sort((first, second) => second[1] - first[1])[0];
  const availableProducts = products.filter((product) => Number(product.stock) > 0);
  const matchingClients = clients.filter((client) => normalize(`${getClientName(client)} ${client.telefono || ""} ${client.correo || ""}`).includes(normalize(clientQuery.trim())));
  const matchingProducts = availableProducts.filter((product) => normalize(`${product.name || ""} ${product.brand || ""} ${product.category || ""}`).includes(normalize(productQuery.trim())));
  const saleSubtotal = saleItems.reduce((total, item) => total + Number(item.precioUnitario) * Number(item.cantidad), 0);
  const selectedClient = clients.find((client) => client.id === selectedClientId);

  const resetSaleForm = () => {
    setSelectedClientId("");
    setClientQuery("");
    setProductQuery("");
    setSaleItems([]);
    setEditingItemId("");
    setSaleDate(getLocalDateValue(new Date()));
    setSaleTime(getLocalTimeValue(new Date()));
    setObservations("");
    setPaymentMethod("Efectivo");
  };

  const addProductToSale = (product) => {
    setSaleItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.productoId === product.id);
      if (existingItem) {
        if (existingItem.cantidad >= Number(product.stock)) return currentItems;
        return currentItems.map((item) => item.productoId === product.id ? { ...item, cantidad: item.cantidad + 1 } : item);
      }
      return [...currentItems, {
        productoId: product.id,
        nombreProducto: product.name || "Producto",
        precioUnitario: Number(product.salePrice ?? product.price ?? 0),
        cantidad: 1,
        stockDisponible: Number(product.stock),
      }];
    });
    setProductQuery("");
    setError("");
  };

  const updateSaleItemQuantity = (productId, value) => {
    const nextQuantity = Number(value);
    setSaleItems((currentItems) => currentItems.map((item) => item.productoId === productId
      ? { ...item, cantidad: nextQuantity }
      : item));
  };

  const handleCreateSale = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    if (!selectedClient || !saleDate || !saleTime || !saleItems.length
      || saleItems.some((item) => !Number.isInteger(Number(item.cantidad)) || Number(item.cantidad) < 1 || Number(item.cantidad) > item.stockDisponible)) {
      setError("Completa la fecha y hora, selecciona un cliente y agrega productos con cantidades válidas.");
      return;
    }

    setIsSaving(true);
    try {
      const result = await createSale({
        clienteId: selectedClientId,
        items: saleItems,
        fechaVenta: saleDate,
        horaVenta: saleTime,
        observaciones: observations.trim(),
        metodoPago: paymentMethod,
      });
      setIsSaleFormOpen(false);
      resetSaleForm();
      setNotice(`Venta ${result.numeroFactura} registrada correctamente.`);
    } catch (saveError) {
      console.error("Error al registrar la venta:", saveError);
      setError(saveError.message || "No se pudo registrar la venta. Verifica los permisos de administrador.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadInvoice = async (sale) => {
    try {
      await downloadSaleInvoice(sale);
    } catch (downloadError) {
      console.error("Error al descargar la factura de venta:", downloadError);
      setError("No se pudo generar la factura PDF.");
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
                className={`menuItem ${item.name === "Ventas" ? "activeMenu" : ""} ${item.name === "Cerrar sesión" ? "logoutMenuItem" : ""}`}
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
        <Encabezado title="Ventas" description="Consulta y administra las ventas del gimnasio" />
        <section className="content salesContent">
          <div className="salesTopbar">
            <div className="salesPeriodControls">
              <label><span>Desde</span><CalendarDays size={16} /><input aria-label="Fecha inicial" type="date" value={startDate} max={endDate} onChange={(event) => setStartDate(event.target.value)} /></label>
              <label><span>Hasta</span><CalendarDays size={16} /><input aria-label="Fecha final" type="date" value={endDate} min={startDate} onChange={(event) => setEndDate(event.target.value)} /></label>
            </div>
            <button type="button" className="salesNewButton" onClick={() => { setError(""); setIsSaleFormOpen(true); }}>
              <Plus size={18} /><span>Nueva venta</span>
            </button>
          </div>

          <div className="salesStats">
            <article className="salesStat salesStatRevenue">
              <span className="salesStatIcon"><CircleDollarSign size={21} /></span>
              <strong>{formatMoney(periodTotal)}</strong>
              <span>Ventas del período</span>
            </article>
            <article className="salesStat salesStatCount">
              <span className="salesStatIcon"><ChartNoAxesCombined size={21} /></span>
              <strong>{sales.length}</strong>
              <span>Ventas realizadas en total</span>
            </article>
            <article className="salesStat salesStatAverage">
              <span className="salesStatIcon"><Receipt size={21} /></span>
              <strong>{formatMoney(averageSale)}</strong>
              <span>Promedio por venta</span>
            </article>
            <article className="salesStat salesStatBest">
              <span className="salesStatIcon"><Trophy size={21} /></span>
              <strong title={bestSeller?.[0] || "Sin ventas"}>{bestSeller?.[0] || "-"}</strong>
              <span>{bestSeller ? `${bestSeller[1]} unidades vendidas` : "Producto más vendido"}</span>
            </article>
          </div>

          <div className="salesToolbar">
            <label className="salesSearch" htmlFor="sales-search">
              <Search size={18} aria-hidden="true" />
              <input id="sales-search" type="search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Buscar cliente o producto" />
            </label>
            <select aria-label="Buscar por" className="salesFilter" value={searchFilter} onChange={(event) => setSearchFilter(event.target.value)}>
              <option value="todos">Cliente y producto</option>
              <option value="cliente">Cliente</option>
              <option value="producto">Producto</option>
            </select>
          </div>

          {error && <p className="salesNotice salesNoticeError" role="alert">{error}</p>}
          {notice && <p className="salesNotice salesNoticeSuccess" role="status">{notice}</p>}

          <div className="salesTableContainer">
            <div className="salesTableHeading">
              <h2>Historial de ventas</h2>
              <span>{filteredSales.length} {filteredSales.length === 1 ? "venta" : "ventas"}</span>
            </div>
            <div className="salesTableWrapper">
              <table className="salesTable">
                <thead><tr><th>Fecha</th><th>Cliente</th><th>Producto</th><th>Total</th><th>Acciones</th></tr></thead>
                <tbody>
                  {filteredSales.length ? filteredSales.map((sale) => (
                    <tr key={sale.id}>
                      <td>{formatDate(getSaleDate(sale))}</td>
                      <td className="salesClientCell">{getSaleClient(sale)}</td>
                      <td className="salesProductCell">{getSaleProductNames(sale)}</td>
                      <td className="salesAmountCell">{formatMoney(getSaleTotal(sale))}</td>
                      <td>
                        <div className="salesActions">
                          <button type="button" className="salesActionButton salesViewButton" onClick={() => setSelectedSale(sale)} title="Ver factura" aria-label={`Ver factura de ${getSaleClient(sale)}`}><Eye size={17} /></button>
                          <button type="button" className="salesActionButton salesDownloadButton" onClick={() => handleDownloadInvoice(sale)} title="Descargar factura PDF" aria-label={`Descargar factura de ${getSaleClient(sale)}`}><Download size={17} /></button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan="5" className="salesEmptyCell">{isLoading ? "Cargando ventas..." : sales.length ? "No hay ventas que coincidan con los filtros." : "Aún no hay ventas registradas."}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>

      {isSaleFormOpen && (
        <div className="salesDialogBackdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !isSaving) { setIsSaleFormOpen(false); resetSaleForm(); } }}>
          <section className="salesDialog salesRegisterDialog" role="dialog" aria-modal="true" aria-labelledby="new-sale-title">
            <div className="salesDialogHeader">
              <div><span>NUEVA VENTA</span><h2 id="new-sale-title">Registrar venta</h2></div>
              <button type="button" className="salesCloseButton" onClick={() => { setIsSaleFormOpen(false); resetSaleForm(); }} aria-label="Cerrar" disabled={isSaving}><X size={19} /></button>
            </div>
            <form className="salesForm" onSubmit={handleCreateSale}>
              {error && <p className="salesNotice salesNoticeError" role="alert">{error}</p>}
              <div className="salesDateTimeFields">
                <label><span><CalendarDays size={16} /> Fecha de la venta</span><input type="date" required value={saleDate} onChange={(event) => setSaleDate(event.target.value)} /></label>
                <label><span><Clock3 size={16} /> Hora de la venta</span><input type="time" required value={saleTime} onChange={(event) => setSaleTime(event.target.value)} /></label>
              </div>
              <label className="salesFormField"><span><UserRound size={16} /> Cliente</span>
                <div className="salesLookup"><Search size={17} aria-hidden="true" /><input autoComplete="off" required value={selectedClient ? getClientName(selectedClient) : clientQuery} onChange={(event) => { setSelectedClientId(""); setClientQuery(event.target.value); }} placeholder="Buscar cliente por nombre, teléfono o correo" /></div>
                {!selectedClientId && clientQuery.trim() && <div className="salesLookupResults">{matchingClients.length ? matchingClients.slice(0, 6).map((client) => <button type="button" key={client.id} onClick={() => { setSelectedClientId(client.id); setClientQuery(getClientName(client)); }}>{getClientName(client)}<span>{client.telefono || client.correo || "Cliente"}</span></button>) : <p>No hay clientes que coincidan con la búsqueda.</p>}</div>}
              </label>
              <label className="salesFormField"><span><PackagePlus size={16} /> Productos</span>
                <div className="salesLookup"><Search size={17} aria-hidden="true" /><input autoComplete="off" value={productQuery} onChange={(event) => setProductQuery(event.target.value)} placeholder="Buscar producto para agregar" /></div>
                {productQuery.trim() && <div className="salesLookupResults salesProductResults">{matchingProducts.length ? matchingProducts.slice(0, 7).map((product) => <button type="button" key={product.id} onClick={() => addProductToSale(product)}><span>{product.name || "Producto"}<small>Stock: {Number(product.stock)}</small></span><strong>{formatMoney(product.salePrice ?? product.price)}</strong></button>) : <p>No hay productos disponibles que coincidan.</p>}</div>}
              </label>
              <div className="salesCartTableWrapper"><table className="salesCartTable"><thead><tr><th>Nombre del producto</th><th>Precio</th><th>Cantidad</th><th>Subtotal</th><th>Acciones</th></tr></thead><tbody>
                {saleItems.length ? saleItems.map((item) => <tr key={item.productoId}>
                  <td className="salesCartProduct">{item.nombreProducto}</td>
                  <td>{formatMoney(item.precioUnitario)}</td>
                  <td>{editingItemId === item.productoId ? <input className="salesQuantityInput" aria-label={`Cantidad de ${item.nombreProducto}`} type="number" min="1" max={item.stockDisponible} step="1" value={item.cantidad} onChange={(event) => updateSaleItemQuantity(item.productoId, event.target.value)} /> : item.cantidad}</td>
                  <td className="salesAmountCell">{formatMoney(item.precioUnitario * item.cantidad)}</td>
                  <td><div className="salesActions">{editingItemId === item.productoId ? <><button type="button" className="salesActionButton salesDownloadButton" title="Guardar cantidad" aria-label={`Guardar cantidad de ${item.nombreProducto}`} onClick={() => setEditingItemId("")}><Check size={16} /></button><button type="button" className="salesActionButton salesRemoveButton" title="Cancelar edición" aria-label="Cancelar edición" onClick={() => setEditingItemId("")}><X size={16} /></button></> : <button type="button" className="salesActionButton salesViewButton" title="Editar cantidad" aria-label={`Editar ${item.nombreProducto}`} onClick={() => setEditingItemId(item.productoId)}><Pencil size={16} /></button>}<button type="button" className="salesActionButton salesRemoveButton" title="Eliminar producto" aria-label={`Eliminar ${item.nombreProducto}`} onClick={() => { setSaleItems((currentItems) => currentItems.filter((currentItem) => currentItem.productoId !== item.productoId)); setEditingItemId(""); }}><Trash2 size={16} /></button></div></td>
                </tr>) : <tr><td colSpan="5" className="salesCartEmpty">Busca y agrega uno o más productos.</td></tr>}
              </tbody></table></div>
              <div className="salesSaleDetails">
                <label><span>Observaciones</span><textarea rows="3" value={observations} onChange={(event) => setObservations(event.target.value)} placeholder="Notas adicionales de la venta" /></label>
                <div className="salesSaleTotals">
                  <label><span>Método de pago</span><select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}><option>Efectivo</option><option>Tarjeta</option><option>Transferencia</option></select></label>
                  <div className="salesSaleTotalLine"><span>Subtotal</span><strong>{formatMoney(saleSubtotal)}</strong></div>
                  <div className="salesSaleTotalLine salesSaleGrandTotal"><span>Total</span><strong>{formatMoney(saleSubtotal)}</strong></div>
                </div>
              </div>
              <div className="salesFormActions">
                <button type="button" className="salesCancelButton" onClick={() => { setIsSaleFormOpen(false); resetSaleForm(); }} disabled={isSaving}>Cancelar</button>
                <button type="submit" className="salesNewButton" disabled={isSaving || !clients.length || !availableProducts.length || !saleItems.length}>{isSaving ? <LoaderCircle className="salesSpinner" size={17} /> : <Plus size={17} />}<span>{isSaving ? "Guardando..." : "Registrar"}</span></button>
              </div>
              {!clients.length && <p className="salesFormHint">Registra al menos un cliente para realizar una venta.</p>}
              {clients.length > 0 && !availableProducts.length && <p className="salesFormHint">No hay productos con existencias disponibles.</p>}
            </form>
          </section>
        </div>
      )}

      {selectedSale && (
        <div className="salesDialogBackdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedSale(null); }}>
          <section className="salesInvoiceDialog" role="dialog" aria-modal="true" aria-labelledby="sale-invoice-title">
            <div className="salesDialogHeader">
              <div><span>{selectedSale.numeroFactura || `VEN-${selectedSale.id.slice(0, 8).toUpperCase()}`}</span><h2 id="sale-invoice-title">Factura de venta</h2></div>
              <button type="button" className="salesCloseButton" onClick={() => setSelectedSale(null)} aria-label="Cerrar"><X size={19} /></button>
            </div>
            <FacturaVenta sale={selectedSale} />
            <div className="salesInvoiceActions"><button type="button" className="salesCancelButton" onClick={() => setSelectedSale(null)}>Cerrar</button><button type="button" className="salesNewButton" onClick={() => handleDownloadInvoice(selectedSale)}><Download size={17} /><span>Descargar PDF</span></button></div>
          </section>
        </div>
      )}
    </div>
  );
}