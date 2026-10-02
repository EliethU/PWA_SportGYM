import {
  collection,
  doc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../assets/database/firebaseconfig";

const getLocalDateValue = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getLocalTimeValue = (date) => new Intl.DateTimeFormat("es-NI", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
}).format(date);

const getClientName = (client) => [client.nombre, client.apellido].filter(Boolean).join(" ") || client.usuario || "Cliente";

export const subscribeToSales = (onSales, onError) => onSnapshot(
  collection(db, "ventas"),
  (snapshot) => onSales(snapshot.docs.map((sale) => ({ id: sale.id, ...sale.data() }))),
  onError,
);

export const createSale = async ({ clienteId, items, fechaVenta, horaVenta, observaciones, metodoPago }) => {
  const saleRef = doc(collection(db, "ventas"));
  const counterRef = doc(db, "contadores", "ventas");
  const clientRef = doc(db, "clientes", clienteId);
  const productRefs = items.map((item) => ({ item, ref: doc(db, "productos", item.productoId) }));

  return runTransaction(db, async (transaction) => {
    const [clientSnapshot, counterSnapshot, ...productSnapshots] = await Promise.all([
      transaction.get(clientRef),
      transaction.get(counterRef),
      ...productRefs.map(({ ref }) => transaction.get(ref)),
    ]);
    if (!clientSnapshot.exists()) throw new Error("El cliente seleccionado ya no existe.");
    const client = clientSnapshot.data();
    const saleItems = productRefs.map(({ item, ref }, index) => {
      const productSnapshot = productSnapshots[index];
      if (!productSnapshot.exists()) throw new Error(`El producto ${item.nombreProducto || "seleccionado"} ya no existe.`);
      const product = productSnapshot.data();
      const stock = Number(product.stock || 0);
      const quantity = Number(item.cantidad);
      const price = Number(product.salePrice ?? product.price ?? 0);
      if (!Number.isInteger(quantity) || quantity < 1) throw new Error("La cantidad debe ser un número entero mayor que cero.");
      if (stock < quantity) throw new Error(`No hay existencias suficientes de ${product.name || "un producto"}.`);
      if (!Number.isFinite(price) || price < 0) throw new Error(`El producto ${product.name || "seleccionado"} no tiene un precio de venta válido.`);
      return { ref, product, productId: item.productoId, stock, quantity, price, subtotal: price * quantity };
    });

    const nextNumber = Number(counterSnapshot.data()?.ultimoNumero || 0) + 1;
    const numeroFactura = `VEN-${String(nextNumber).padStart(6, "0")}`;
    const subtotal = saleItems.reduce((sum, item) => sum + item.subtotal, 0);
    const savedItems = saleItems.map(({ product, productId, quantity, price, subtotal: itemSubtotal }) => ({
      productoId: productId,
      nombreProducto: product.name || "Producto",
      cantidad: quantity,
      precioUnitario: price,
      subtotal: itemSubtotal,
    }));

    transaction.set(counterRef, { ultimoNumero: nextNumber, actualizadoEn: serverTimestamp() }, { merge: true });
    saleItems.forEach(({ ref, product, stock, quantity }) => {
      const remainingStock = stock - quantity;
      const minimumStock = Number(product.minimumStock ?? 5);
      const status = remainingStock <= 0 ? "Agotado" : remainingStock <= minimumStock ? "Stock bajo" : "Disponible";
      transaction.update(ref, { stock: remainingStock, status, updatedAt: serverTimestamp() });
    });
    transaction.set(saleRef, {
      numeroFactura,
      clienteId,
      nombreCliente: getClientName(client),
      items: savedItems,
      subtotal,
      total: subtotal,
      metodoPago,
      observaciones,
      fechaVenta: fechaVenta || getLocalDateValue(new Date()),
      fechaEmision: fechaVenta || getLocalDateValue(new Date()),
      horaVenta: horaVenta || getLocalTimeValue(new Date()),
      horaEmision: horaVenta || getLocalTimeValue(new Date()),
      creadoEn: serverTimestamp(),
    });
    return { id: saleRef.id, numeroFactura, total: subtotal };
  });
};