import { getDocs, collection } from "firebase/firestore";
import { db } from "../assets/database/firebaseconfig";

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

const formatDate = (value) => {
  const date = parseDate(value);
  return date
    ? new Intl.DateTimeFormat("es-NI", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date)
    : "Sin fecha";
};

const formatMoney = (value) => new Intl.NumberFormat("es-NI", {
  style: "currency",
  currency: "NIO",
}).format(Number(value) || 0);

const getRecords = async (collectionName) => {
  const snapshot = await getDocs(collection(db, collectionName));
  return snapshot.docs.map((document) => ({ id: document.id, ...document.data() }));
};

const getAmount = (record) => {
  const amount = Number(record.total ?? record.totalVenta ?? record.monto ?? record.subtotal ?? 0);
  return Number.isFinite(amount) ? amount : 0;
};

const getPaymentDate = (payment) => payment.fechaPago || payment.fecha || payment.creadoEn;
const getSaleDate = (sale) => sale.fechaVenta || sale.fecha || sale.creadoEn;
const getClientName = (record) => record.nombreCliente || record.clienteNombre || record.cliente
  || [record.nombre, record.apellido].filter(Boolean).join(" ") || record.usuario || "Sin nombre";

const getSaleItems = (sale) => {
  if (Array.isArray(sale.items)) return sale.items;
  if (Array.isArray(sale.productos)) return sale.productos;
  const name = sale.nombreProducto || sale.productoNombre || sale.producto;
  return name ? [{ nombreProducto: name, cantidad: sale.cantidad }] : [];
};

const getReportData = async (reportId) => {
  if (reportId === "ingresos") {
    const [payments, sales] = await Promise.all([getRecords("pagos"), getRecords("ventas")]);
    const months = new Map();
    let totalPayments = 0;
    let totalSales = 0;

    [...payments.map((record) => ({ ...record, source: "Pago de membresía", date: getPaymentDate(record) })),
      ...sales.map((record) => ({ ...record, source: "Venta", date: getSaleDate(record) }))]
      .forEach((record) => {
        const date = parseDate(record.date);
        const month = date
          ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
          : "Sin fecha";
        const amount = getAmount(record);
        const totals = months.get(month) || { payments: 0, sales: 0, count: 0 };
        if (record.source === "Venta") {
          totals.sales += amount;
          totalSales += amount;
        } else {
          totals.payments += amount;
          totalPayments += amount;
        }
        totals.count += 1;
        months.set(month, totals);
      });

    const rows = [...months.entries()]
      .sort(([first], [second]) => first.localeCompare(second))
      .map(([month, totals]) => [
        month === "Sin fecha" ? month : new Intl.DateTimeFormat("es-NI", { month: "long", year: "numeric" })
          .format(new Date(`${month}-01T12:00:00`)),
        formatMoney(totals.payments),
        formatMoney(totals.sales),
        formatMoney(totals.payments + totals.sales),
        String(totals.count),
      ]);

    return {
      title: "Reporte de ingresos",
      subtitle: "Ingresos agrupados por mes: pagos de membresía y ventas",
      columns: ["Mes", "Pagos", "Ventas", "Total", "Operaciones"],
      widths: [24, 20, 20, 20, 16],
      rows,
      summary: [
        `Pagos de membresía: ${formatMoney(totalPayments)}`,
        `Ventas: ${formatMoney(totalSales)}`,
        `Ingresos totales: ${formatMoney(totalPayments + totalSales)}`,
      ],
      fileName: "reporte-ingresos",
    };
  }

  if (reportId === "clientes") {
    const clients = await getRecords("clientes");
    return {
      title: "Reporte de clientes",
      subtitle: `Listado de clientes registrados: ${clients.length}`,
      columns: ["Nombre", "Teléfono", "Correo", "Membresía", "Estado de pago"],
      widths: [25, 16, 27, 20, 18],
      rows: clients.map((client) => [
        getClientName(client),
        client.telefono || "—",
        client.correo || client.email || "—",
        client.membresia || client.nombreMembresia || "—",
        client.estadoPago || client.pagoEstado || client.estado || "—",
      ]),
      summary: [`Clientes registrados: ${clients.length}`],
      fileName: "reporte-clientes",
    };
  }

  if (reportId === "gastos") {
    const expenses = await getRecords("gastos");
    const total = expenses.reduce((sum, expense) => sum + getAmount(expense), 0);
    return {
      title: "Reporte de gastos",
      subtitle: `Desglose de gastos registrados: ${expenses.length}`,
      columns: ["Fecha", "Concepto", "Categoría", "Proveedor", "Monto", "Estado"],
      widths: [16, 26, 18, 22, 18, 16],
      rows: expenses.map((expense) => [
        formatDate(expense.fecha || expense.fechaGasto || expense.creadoEn),
        expense.concepto || expense.descripcion || "Gasto",
        expense.categoria || "Sin categoría",
        expense.proveedor || "—",
        formatMoney(getAmount(expense)),
        expense.estado || "Pendiente",
      ]),
      summary: [`Gastos registrados: ${expenses.length}`, `Total de gastos: ${formatMoney(total)}`],
      fileName: "reporte-gastos",
    };
  }

  if (reportId === "asistencia") {
    const attendance = await getRecords("asistencias");
    return {
      title: "Reporte de asistencia",
      subtitle: `Registros de asistencia disponibles: ${attendance.length}`,
      columns: ["Fecha", "Cliente", "Identificador", "Estado"],
      widths: [22, 30, 28, 22],
      rows: attendance.map((record) => [
        formatDate(record.fecha || record.fechaAsistencia || record.creadoEn),
        getClientName(record),
        record.clienteId || record.id || "—",
        record.estado || record.tipo || "Asistencia registrada",
      ]),
      summary: [`Asistencias registradas: ${attendance.length}`],
      fileName: "reporte-asistencia",
    };
  }

  if (reportId === "ventas") {
    const sales = await getRecords("ventas");
    const total = sales.reduce((sum, sale) => sum + getAmount(sale), 0);
    return {
      title: "Reporte de ventas",
      subtitle: `Análisis de ventas registradas: ${sales.length}`,
      columns: ["Fecha", "Factura", "Cliente", "Productos", "Total"],
      widths: [17, 19, 24, 37, 25],
      rows: sales.map((sale) => [
        formatDate(getSaleDate(sale)),
        sale.numeroFactura || sale.id,
        getClientName(sale),
        getSaleItems(sale).map((item) => item.nombreProducto || item.productoNombre || item.nombre || item.producto || "Producto")
          .join(", ") || "—",
        formatMoney(getAmount(sale)),
      ]),
      summary: [`Ventas registradas: ${sales.length}`, `Ingresos por ventas: ${formatMoney(total)}`],
      fileName: "reporte-ventas",
    };
  }

  if (reportId === "inventario") {
    const products = await getRecords("productos");
    const totalStock = products.reduce((sum, product) => sum + (Number(product.stock) || 0), 0);
    return {
      title: "Reporte de inventario",
      subtitle: `Estado de productos registrados: ${products.length}`,
      columns: ["Producto", "Categoría", "Marca", "Existencias", "Precio venta", "Estado"],
      widths: [27, 20, 20, 15, 20, 17],
      rows: products.map((product) => [
        product.name || product.nombre || "Sin nombre",
        product.category || product.categoria || "—",
        product.brand || product.marca || "—",
        String(Number(product.stock) || 0),
        formatMoney(product.salePrice ?? product.price ?? product.precio),
        product.status || "—",
      ]),
      summary: [`Productos registrados: ${products.length}`, `Unidades en inventario: ${totalStock}`],
      fileName: "reporte-inventario",
    };
  }

  throw new Error("El tipo de reporte solicitado no es válido.");
};

const drawTableHeader = (pdf, columns, widths, margin, y) => {
  const rowHeight = 9;
  pdf.setFillColor(23, 50, 48);
  pdf.rect(margin, y - 5.5, widths.reduce((sum, width) => sum + width, 0), rowHeight, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(255, 255, 255);
  let x = margin + 2;
  columns.forEach((column, index) => {
    pdf.text(String(column), x, y);
    x += widths[index];
  });
};

export const downloadReportPdf = async (reportId) => {
  const report = await getReportData(reportId);
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ orientation: "landscape" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 12;
  const tableWidth = pageWidth - margin * 2;
  const totalWeight = report.widths.reduce((sum, width) => sum + width, 0);
  const widths = report.widths.map((width) => (width / totalWeight) * tableWidth);
  const bottom = pageHeight - 16;
  let y = 48;

  pdf.setFillColor(23, 50, 48);
  pdf.rect(0, 0, pageWidth, 35, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(17);
  pdf.setTextColor(255, 255, 255);
  pdf.text(report.title.toLocaleUpperCase("es-NI"), margin, 16);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(221, 235, 217);
  pdf.text(report.subtitle, margin, 25);
  pdf.setTextColor(57, 70, 66);
  pdf.text(`Generado: ${new Intl.DateTimeFormat("es-NI", { dateStyle: "long" }).format(new Date())}`, pageWidth - margin, 25, { align: "right" });

  report.summary.forEach((item) => {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.text(item, margin, y);
    y += 6;
  });
  y += 4;
  drawTableHeader(pdf, report.columns, widths, margin, y);
  y += 10;

  const rows = report.rows.length ? report.rows : [["No hay registros disponibles para este reporte."]];
  rows.forEach((row) => {
    const cells = report.rows.length ? row : [rows[0][0], ...report.columns.slice(1).map(() => "")];
    const lines = cells.map((cell, index) => pdf.splitTextToSize(String(cell ?? "—"), Math.max(widths[index] - 4, 10)));
    const rowHeight = Math.max(7, ...lines.map((cellLines) => cellLines.length * 4 + 2));
    if (y + rowHeight > bottom) {
      pdf.addPage();
      y = 20;
      drawTableHeader(pdf, report.columns, widths, margin, y);
      y += 10;
    }
    pdf.setDrawColor(224, 229, 229);
    pdf.line(margin, y + rowHeight - 2, pageWidth - margin, y + rowHeight - 2);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(57, 70, 66);
    let x = margin + 2;
    lines.forEach((cellLines, index) => {
      pdf.text(cellLines, x, y);
      x += widths[index];
    });
    y += rowHeight;
  });

  const pageCount = pdf.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    pdf.setPage(page);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(120, 130, 130);
    pdf.text(`Página ${page} de ${pageCount}`, pageWidth - margin, pageHeight - 7, { align: "right" });
  }
  pdf.save(`${report.fileName}-${new Date().toISOString().slice(0, 10)}.pdf`);
};
