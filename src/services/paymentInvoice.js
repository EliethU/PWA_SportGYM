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

export const formatPaymentDate = (value) => {
  const date = parseDate(value);
  return date
    ? new Intl.DateTimeFormat("es-NI", { day: "2-digit", month: "long", year: "numeric" }).format(date)
    : "-";
};

export const formatPaymentMoney = (amount) =>
  new Intl.NumberFormat("es-NI", { style: "currency", currency: "NIO" }).format(Number(amount) || 0);

export const formatPaymentTime = (payment) => {
  if (payment.horaEmision) return payment.horaEmision;
  const createdAt = parseDate(payment.creadoEn);
  return createdAt
    ? new Intl.DateTimeFormat("es-NI", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(createdAt)
    : "-";
};

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

export const downloadPaymentInvoice = async (payment) => {
  const [{ jsPDF }, logoData] = await Promise.all([import("jspdf"), loadLogo()]);
  const invoice = new jsPDF();
  const invoiceNumber = payment.numeroFactura || "PAY-SIN-FOLIO";
  const pageWidth = invoice.internal.pageSize.getWidth();
  const invoiceDate = formatPaymentDate(payment.fechaEmision || payment.creadoEn);
  const paymentDate = formatPaymentDate(payment.fechaPago || payment.fecha || payment.creadoEn);
  const expirationDate = formatPaymentDate(payment.fechaVencimiento || payment.vencimiento);

  invoice.setFillColor(23, 50, 48);
  invoice.rect(0, 0, pageWidth, 56, "F");
  invoice.setFillColor(255, 255, 255);
  invoice.roundedRect(17, 14, 43, 28, 3, 3, "F");
  invoice.addImage(logoData, "PNG", 20, 17, 37, 22, undefined, "FAST");

  invoice.setFont("helvetica", "bold");
  invoice.setFontSize(17);
  invoice.setTextColor(255, 255, 255);
  invoice.text("FACTURA DE PAGO", 68, 27);
  invoice.setFont("helvetica", "normal");
  invoice.setFontSize(9);
  invoice.setTextColor(221, 235, 217);
  invoice.text("PORT GYM · MEMBRESÍAS", 68, 36);
  invoice.setFont("helvetica", "bold");
  invoice.setFontSize(11);
  invoice.setTextColor(255, 255, 255);
  invoice.text(invoiceNumber, pageWidth - 18, 28, { align: "right" });
  invoice.setFont("helvetica", "normal");
  invoice.setFontSize(9);
  invoice.setTextColor(221, 235, 217);
  invoice.text("NÚMERO DE FACTURA", pageWidth - 18, 36, { align: "right" });

  invoice.setTextColor(83, 97, 96);
  invoice.setFontSize(9);
  invoice.text(`Fecha de emisión: ${invoiceDate}  ·  Hora: ${formatPaymentTime(payment)}`, 18, 68);

  invoice.setDrawColor(225, 232, 221);
  invoice.setFillColor(248, 250, 247);
  invoice.roundedRect(16, 78, pageWidth - 32, 35, 2, 2, "FD");
  invoice.setFont("helvetica", "bold");
  invoice.setFontSize(8);
  invoice.setTextColor(76, 154, 58);
  invoice.text("CLIENTE", 23, 89);
  invoice.text("MEMBRESÍA", 110, 89);
  invoice.setFont("helvetica", "normal");
  invoice.setFontSize(11);
  invoice.setTextColor(23, 35, 38);
  invoice.text(invoice.splitTextToSize(payment.nombreCliente || payment.clienteNombre || payment.cliente || "Cliente", 75).slice(0, 2), 23, 98);
  invoice.text(invoice.splitTextToSize(payment.nombreMembresia || payment.membresia || payment.concepto || "Membresía", 72).slice(0, 2), 110, 98);

  invoice.setFont("helvetica", "bold");
  invoice.setFontSize(8);
  invoice.setTextColor(102, 117, 111);
  invoice.text("DETALLE DEL PERIODO", 18, 128);
  invoice.setDrawColor(225, 232, 221);
  invoice.line(18, 132, pageWidth - 18, 132);

  invoice.setFont("helvetica", "normal");
  invoice.setFontSize(10);
  invoice.setTextColor(83, 97, 96);
  invoice.text("Fecha del pago", 20, 145);
  invoice.text("Vigencia hasta", 110, 145);
  invoice.setFont("helvetica", "bold");
  invoice.setTextColor(23, 35, 38);
  invoice.text(paymentDate, 20, 153);
  invoice.text(expirationDate, 110, 153);

  invoice.setDrawColor(225, 232, 221);
  invoice.setFillColor(245, 250, 243);
  invoice.roundedRect(16, 166, pageWidth - 32, 31, 2, 2, "FD");
  invoice.setFont("helvetica", "normal");
  invoice.setFontSize(9);
  invoice.setTextColor(83, 97, 96);
  invoice.text("Método de pago", 23, 178);
  invoice.setFont("helvetica", "bold");
  invoice.setFontSize(11);
  invoice.setTextColor(23, 35, 38);
  invoice.text(payment.metodoPago || "-", 23, 189);
  invoice.setFont("helvetica", "normal");
  invoice.setFontSize(9);
  invoice.setTextColor(83, 97, 96);
  invoice.text("TOTAL PAGADO", pageWidth - 23, 178, { align: "right" });
  invoice.setFont("helvetica", "bold");
  invoice.setFontSize(15);
  invoice.setTextColor(47, 125, 39);
  invoice.text(formatPaymentMoney(payment.monto), pageWidth - 23, 190, { align: "right" });

  let footerY = 232;
  if (payment.notas?.trim()) {
    invoice.setFont("helvetica", "bold");
    invoice.setFontSize(8);
    invoice.setTextColor(102, 117, 111);
    invoice.text("NOTAS", 18, 211);
    invoice.setFont("helvetica", "normal");
    invoice.setFontSize(9);
    invoice.setTextColor(57, 70, 66);
    const noteLines = invoice.splitTextToSize(payment.notas.trim(), pageWidth - 36).slice(0, 3);
    invoice.text(noteLines, 18, 219);
    footerY = Math.max(232, 219 + noteLines.length * 5);
  }

  invoice.setDrawColor(225, 232, 221);
  invoice.line(18, footerY, pageWidth - 18, footerY);
  invoice.setFont("helvetica", "bold");
  invoice.setFontSize(12);
  invoice.setTextColor(23, 50, 48);
  invoice.text("¡Gracias por tu pago!", pageWidth / 2, footerY + 15, { align: "center" });
  invoice.setFont("helvetica", "normal");
  invoice.setFontSize(9);
  invoice.setTextColor(102, 117, 111);
  invoice.text("Tu compromiso con la salud nos inspira.", pageWidth / 2, footerY + 22, { align: "center" });
  invoice.save(`factura-${invoiceNumber}.pdf`);
};