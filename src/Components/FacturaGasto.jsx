import React from "react";
import logoPortGym from "../Imagen/logo-port-gym.png.png";
import { formatPaymentDate, formatPaymentMoney, formatPaymentTime } from "../services/paymentInvoice.js";
import "../Styles/FacturaPago.css";

const getExpenseDate = (expense) => expense.fecha || expense.fechaGasto || expense.creadoEn;

export default function FacturaGasto({ expense }) {
  return (
    <article className="paymentInvoice expenseInvoice">
      <header className="paymentInvoiceHeader">
        <div className="paymentInvoiceBrand">
          <span className="paymentInvoiceLogo"><img src={logoPortGym} alt="Port Gym" /></span>
          <div>
            <span className="paymentInvoiceEyebrow">PORT GYM</span>
            <h3 id="expense-invoice-title">Factura de gasto</h3>
          </div>
        </div>
        <div className="paymentInvoiceNumber">
          <span>Número de factura</span>
          <strong>{expense.numeroFactura || `GAS-${String(expense.id || "").slice(0, 8).toUpperCase()}`}</strong>
        </div>
      </header>

      <p className="paymentInvoiceIssued">
        Emitida el {formatPaymentDate(expense.creadoEn || getExpenseDate(expense))}
        {" a las "}{formatPaymentTime(expense)}
      </p>

      <section className="paymentInvoicePeople">
        <div>
          <span>Proveedor</span>
          <strong>{expense.proveedor || "-"}</strong>
        </div>
        <div>
          <span>Estado</span>
          <strong>{expense.estado || "Pendiente"}</strong>
        </div>
      </section>

      <section className="paymentInvoicePeriod" aria-label="Detalle del gasto">
        <div>
          <span>Fecha del gasto</span>
          <strong>{formatPaymentDate(getExpenseDate(expense))}</strong>
        </div>
        <div>
          <span>Categoría</span>
          <strong>{expense.categoria || "Sin categoría"}</strong>
        </div>
      </section>

      <section className="expenseInvoiceConcept">
        <span>Concepto</span>
        <strong>{expense.concepto || expense.descripcion || "Gasto"}</strong>
      </section>

      <section className="paymentInvoiceTotal">
        <div>
          <span>Método de pago</span>
          <strong>{expense.metodo || expense.metodoPago || "-"}</strong>
        </div>
        <div className="paymentInvoiceAmount">
          <span>Total del gasto</span>
          <strong>{formatPaymentMoney(expense.monto ?? expense.total)}</strong>
        </div>
      </section>

      {expense.imageUrl && (
        <section className="expenseInvoiceReceipt">
          <span>Comprobante</span>
          <a href={expense.imageUrl} target="_blank" rel="noreferrer" aria-label="Abrir imagen del comprobante en una pestaña nueva">
            <img src={expense.imageUrl} alt={`Comprobante de ${expense.concepto || "gasto"}`} />
          </a>
        </section>
      )}

      {expense.observaciones?.trim() && (
        <section className="paymentInvoiceNotes">
          <span>Observaciones</span>
          <p>{expense.observaciones}</p>
        </section>
      )}

      <footer className="paymentInvoiceFooter">
        <strong>Comprobante de gasto</strong>
        <span>PORT GYM</span>
      </footer>
    </article>
  );
}
