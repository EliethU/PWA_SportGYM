import logoPortGym from "../Imagen/logo-port-gym.png.png";

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
  return date ? new Intl.DateTimeFormat("es-NI", { day: "2-digit", month: "long", year: "numeric" }).format(date) : "-";
};

const formatMoney = (amount) =>
  new Intl.NumberFormat("es-NI", { style: "currency", currency: "NIO" }).format(Number(amount) || 0);

const loadLogo = async () => {
  const response = await fetch(logoPortGym);
  if (!response.ok) throw new Error("No se pudo cargar el logo de la factura.");
  const imageBlob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(imageBlob);
  });
};

export const downloadSaleInvoice = async (sale) => {
  const [{ jsPDF }, logoData] = await Promise.all([import("jspdf"), loadLogo()]);
  const invoice = new jsPDF();
  const pageWidth = invoice.internal.pageSize.getWidth();
  const invoiceNumber = sale.numeroFactura || `VEN-${String(sale.id || "").slice(0, 8).toUpperCase()}`;
  const saleDate = formatDate(sale.fechaVenta || sale.fecha || sale.creadoEn);
  const saleTime = sale.horaVenta || sale.horaEmision || "-";
  const items = Array.isArray(sale.items) ? sale.items : Array.isArray(sale.productos) ? sale.productos : [{
    nombreProducto: sale.nombreProducto || sale.productoNombre || sale.producto || "Producto",
    cantidad: sale.cantidad || 1,
    precioUnitario: sale.precioUnitario ?? sale.total ?? sale.monto ?? 0,
    subtotal: sale.total ?? sale.monto ?? 0,
  }];

  invoice.setFillColor(23, 50, 48);
  invoice.rect(0, 0, pageWidth, 56, "F");
  invoice.setFillColor(255, 255, 255);
  invoice.roundedRect(17, 14, 43, 28, 3, 3, "F");
  invoice.addImage(logoData, "PNG", 20, 17, 37, 22, undefined, "FAST");
  invoice.setFont("helvetica", "bold");
  invoice.setFontSize(17);
  invoice.setTextColor(255, 255, 255);
  invoice.text("FACTURA DE VENTA", 68, 27);
  invoice.setFont("helvetica", "normal");
  invoice.setFontSize(9);
  invoice.setTextColor(221, 235, 217);
  invoice.text("PORT GYM · PRODUCTOS", 68, 36);
  invoice.setFont("helvetica", "bold");
  invoice.setFontSize(11);
  invoice.setTextColor(255, 255, 255);
  invoice.text(invoiceNumber, pageWidth - 18, 28, { align: "right" });
  invoice.setFont("helvetica", "normal");
  invoice.setFontSize(9);
  invoice.setTextColor(221, 235, 217);
  invoice.text("NÚMERO DE FACTURA", pageWidth - 18, 36, { align: "right" });

  invoice.setFontSize(9);
  invoice.setTextColor(83, 97, 96);
  invoice.text(`Emitida el ${saleDate}  ·  Hora: ${saleTime}`, 18, 69);
  invoice.setDrawColor(225, 232, 221);
  invoice.setFillColor(248, 250, 247);
  invoice.roundedRect(16, 79, pageWidth - 32, 31, 2, 2, "FD");
  invoice.setFont("helvetica", "bold");
  invoice.setFontSize(8);
  invoice.setTextColor(76, 154, 58);
  invoice.text("CLIENTE", 23, 90);
  invoice.setFont("helvetica", "normal");
  invoice.setFontSize(11);
  invoice.setTextColor(23, 35, 38);
  invoice.text(invoice.splitTextToSize(sale.nombreCliente || sale.clienteNombre || sale.cliente || "Cliente", 90).slice(0, 1), 23, 100);
  invoice.setFont("helvetica", "bold");
  invoice.setFontSize(8);
  invoice.setTextColor(76, 154, 58);
  invoice.text("MÉTODO DE PAGO", 120, 90);
  invoice.setFont("helvetica", "normal");
  invoice.setFontSize(10);
  invoice.setTextColor(23, 35, 38);
  invoice.text(sale.metodoPago || "-", 120, 100);

  const drawTableHeader = (y) => {
    invoice.setFillColor(23, 50, 48);
    invoice.rect(16, y, pageWidth - 32, 12, "F");
    invoice.setFont("helvetica", "bold");
    invoice.setFontSize(8);
    invoice.setTextColor(255, 255, 255);
    invoice.text("PRODUCTO", 21, y + 8);
    invoice.text("PRECIO", 113, y + 8, { align: "right" });
    invoice.text("CANT.", 145, y + 8, { align: "right" });
    invoice.text("SUBTOTAL", pageWidth - 21, y + 8, { align: "right" });
  };

  let rowY = 122;
  drawTableHeader(rowY);
  rowY += 21;
  items.forEach((item) => {
    const name = item.nombreProducto || item.productoNombre || item.nombre || item.name || item.producto || "Producto";
    const amount = Number(item.cantidad || item.quantity || 1);
    const price = Number(item.precioUnitario ?? item.precio ?? item.price ?? 0);
    const itemSubtotal = Number(item.subtotal ?? item.subTotal ?? amount * price);
    const nameLines = invoice.splitTextToSize(name, 76).slice(0, 2);
    const rowHeight = Math.max(13, nameLines.length * 5 + 5);
    if (rowY + rowHeight > 255) {
      invoice.addPage();
      rowY = 20;
      drawTableHeader(rowY);
      rowY += 21;
    }
    invoice.setFont("helvetica", "normal");
    invoice.setFontSize(9);
    invoice.setTextColor(57, 70, 66);
    invoice.text(nameLines, 21, rowY);
    invoice.text(formatMoney(price), 113, rowY, { align: "right" });
    invoice.text(String(amount), 145, rowY, { align: "right" });
    invoice.text(formatMoney(itemSubtotal), pageWidth - 21, rowY, { align: "right" });
    invoice.setDrawColor(225, 232, 221);
    invoice.line(18, rowY + rowHeight - 3, pageWidth - 18, rowY + rowHeight - 3);
    rowY += rowHeight;
  });

  if (rowY > 224) {
    invoice.addPage();
    rowY = 24;
  }
  const subtotal = Number(sale.subtotal ?? sale.total ?? sale.totalVenta ?? sale.monto ?? 0);
  const totalY = rowY + 12;
  invoice.setFont("helvetica", "normal");
  invoice.setFontSize(9);
  invoice.setTextColor(83, 97, 96);
  invoice.text("Subtotal", pageWidth - 23, totalY, { align: "right" });
  invoice.setFont("helvetica", "bold");
  invoice.setTextColor(23, 35, 38);
  invoice.text(formatMoney(subtotal), pageWidth - 23, totalY + 7, { align: "right" });
  invoice.setFont("helvetica", "normal");
  invoice.setFontSize(9);
  invoice.setTextColor(83, 97, 96);
  invoice.text("TOTAL PAGADO", pageWidth - 23, totalY + 19, { align: "right" });
  invoice.setFont("helvetica", "bold");
  invoice.setFontSize(16);
  invoice.setTextColor(47, 125, 39);
  invoice.text(formatMoney(sale.total ?? sale.totalVenta ?? sale.monto ?? subtotal), pageWidth - 23, totalY + 29, { align: "right" });
  invoice.setDrawColor(225, 232, 221);
  invoice.line(18, totalY + 38, pageWidth - 18, totalY + 38);
  let footerY = totalY + 53;
  if (sale.observaciones?.trim()) {
    invoice.setFont("helvetica", "bold");
    invoice.setFontSize(8);
    invoice.setTextColor(102, 117, 111);
    invoice.text("OBSERVACIONES", 18, footerY);
    invoice.setFont("helvetica", "normal");
    invoice.setFontSize(9);
    invoice.setTextColor(57, 70, 66);
    const noteLines = invoice.splitTextToSize(sale.observaciones.trim(), pageWidth - 36).slice(0, 3);
    invoice.text(noteLines, 18, footerY + 8);
    footerY += 8 + noteLines.length * 5;
  }
  if (footerY > 270) {
    invoice.addPage();
    footerY = 30;
  }
  invoice.setDrawColor(225, 232, 221);
  invoice.line(18, footerY, pageWidth - 18, footerY);
  invoice.setFont("helvetica", "bold");
  invoice.setFontSize(12);
  invoice.setTextColor(23, 50, 48);
  invoice.text("¡Gracias por tu compra!", pageWidth / 2, footerY + 15, { align: "center" });
  invoice.save(`factura-${invoiceNumber}.pdf`);
};