import React from "react";
import logoPortGym from "../Imagen/logo-port-gym.png.png";
import { formatPaymentDate, formatPaymentMoney, formatPaymentTime } from "../services/paymentInvoice.js";
import "../Styles/FacturaPago.css";

const getSaleItems = (sale) => {
  if (Array.isArray(sale.items)) return sale.items;
  if (Array.isArray(sale.productos)) return sale.productos;
  return [{
    nombreProducto: sale.nombreProducto || sale.productoNombre || sale.producto || "Producto",
    cantidad: sale.cantidad || 1,
    precioUnitario: sale.precioUnitario ?? sale.total ?? sale.monto ?? 0,
    subtotal: sale.total ?? sale.monto ?? 0,
  }];
};

const getItemName = (item) => item.nombreProducto || item.productoNombre || item.nombre || item.name || item.producto || "Producto";
const getItemQuantity = (item) => Number(item.cantidad ?? item.quantity ?? 1);
const getItemPrice = (item) => Number(item.precioUnitario ?? item.precio ?? item.price ?? 0);
const getItemSubtotal = (item) => Number(item.subtotal ?? item.subTotal ?? getItemQuantity(item) * getItemPrice(item));

export default function FacturaVenta({ sale }) {
  const items = getSaleItems(sale);
  const subtotal = Number(sale.subtotal ?? sale.total ?? sale.totalVenta ?? sale.monto ?? 0);
  const saleDate = sale.fechaVenta || sale.fecha || sale.creadoEn;

  return (
    <article className="paymentInvoice">
      <header className="paymentInvoiceHeader">
        <div className="paymentInvoiceBrand">
          <span className="paymentInvoiceLogo"><img src={logoPortGym} alt="Port Gym" /></span>
          <div>
            <span className="paymentInvoiceEyebrow">PORT GYM</span>
            <h3>Factura de venta</h3>
          </div>
        </div>
        <div className="paymentInvoiceNumber">
          <span>Número de factura</span>
          <strong>{sale.numeroFactura || `VEN-${String(sale.id || "").slice(0, 8).toUpperCase()}`}</strong>
        </div>
      </header>

      <p className="paymentInvoiceIssued">
        Emitida el {formatPaymentDate(sale.fechaEmision || saleDate)} a las {formatPaymentTime(sale)}
      </p>

      <section className="paymentInvoicePeople">
        <div>
          <span>Cliente</span>
          <strong>{sale.nombreCliente || sale.clienteNombre || sale.cliente || "Cliente"}</strong>
        </div>
        <div>
          <span>Método de pago</span>
          <strong>{sale.metodoPago || "-"}</strong>
        </div>
      </section>

      <section className="salesInvoiceDetail" aria-label="Detalle de la compra">
        <h4>Detalle de la compra</h4>
        <div className="salesInvoiceDetailHeader"><span>Producto</span><span>Precio</span><span>Cantidad</span><span>Subtotal</span></div>
        {items.map((item, index) => (
          <div className="salesInvoiceDetailRow" key={`${getItemName(item)}-${index}`}>
            <strong>{getItemName(item)}</strong>
            <span>{formatPaymentMoney(getItemPrice(item))}</span>
            <span>{getItemQuantity(item)}</span>
            <span>{formatPaymentMoney(getItemSubtotal(item))}</span>
          </div>
        ))}
      </section>

      <section className="salesInvoiceTotals">
        <div><span>Subtotal</span><strong>{formatPaymentMoney(subtotal)}</strong></div>
        <div className="salesInvoiceGrandTotal"><span>Total pagado</span><strong>{formatPaymentMoney(sale.total ?? sale.totalVenta ?? sale.monto ?? subtotal)}</strong></div>
      </section>

      {sale.observaciones?.trim() && (
        <section className="paymentInvoiceNotes">
          <span>Observaciones</span>
          <p>{sale.observaciones}</p>
        </section>
      )}

      <footer className="paymentInvoiceFooter">
        <strong>¡Gracias por tu compra!</strong>
        <span>Tu compromiso con la salud nos inspira.</span>
      </footer>
    </article>
  );
}