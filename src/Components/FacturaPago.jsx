import React from "react";
import logoPortGym from "../Imagen/logo-port-gym.png.png";
import { formatPaymentDate, formatPaymentMoney, formatPaymentTime } from "../services/paymentInvoice.js";
import "../Styles/FacturaPago.css";

export default function FacturaPago({ payment }) {
  return (
    <article className="paymentInvoice">
      <header className="paymentInvoiceHeader">
        <div className="paymentInvoiceBrand">
          <span className="paymentInvoiceLogo"><img src={logoPortGym} alt="Port Gym" /></span>
          <div>
            <span className="paymentInvoiceEyebrow">PORT GYM</span>
            <h3>Factura de pago</h3>
          </div>
        </div>
        <div className="paymentInvoiceNumber">
          <span>Número de factura</span>
          <strong>{payment.numeroFactura || "PAY-SIN-FOLIO"}</strong>
        </div>
      </header>

      <p className="paymentInvoiceIssued">
      Emitida el {formatPaymentDate(payment.fechaEmision || payment.creadoEn)} a las {formatPaymentTime(payment)}
      </p>

      <section className="paymentInvoicePeople">
        <div>
          <span>Cliente</span>
          <strong>{payment.nombreCliente || payment.clienteNombre || payment.cliente || "Cliente"}</strong>
        </div>
        <div>
          <span>Membresía</span>
          <strong>{payment.nombreMembresia || payment.membresia || payment.concepto || "Membresía"}</strong>
        </div>
      </section>

      <section className="paymentInvoicePeriod" aria-label="Periodo de membresía">
        <div>
          <span>Fecha del pago</span>
          <strong>{formatPaymentDate(payment.fechaPago || payment.fecha || payment.creadoEn)}</strong>
        </div>
        <div>
          <span>Vigente hasta</span>
          <strong>{formatPaymentDate(payment.fechaVencimiento || payment.vencimiento)}</strong>
        </div>
      </section>

      <section className="paymentInvoiceTotal">
        <div>
          <span>Método de pago</span>
          <strong>{payment.metodoPago || "-"}</strong>
        </div>
        <div className="paymentInvoiceAmount">
          <span>Total pagado</span>
          <strong>{formatPaymentMoney(payment.monto)}</strong>
        </div>
      </section>

      {payment.notas?.trim() && (
        <section className="paymentInvoiceNotes">
          <span>Notas</span>
          <p>{payment.notas}</p>
        </section>
      )}

      <footer className="paymentInvoiceFooter">
        <strong>¡Gracias por tu pago!</strong>
        <span>Tu compromiso con la salud nos inspira.</span>
      </footer>
    </article>
  );
}