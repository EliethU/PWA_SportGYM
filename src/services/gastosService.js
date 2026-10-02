import { addDoc, collection, doc, onSnapshot, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "../assets/database/firebaseconfig";

const RECEIPT_LIMIT = 5 * 1024 * 1024;
const RECEIPT_TYPES = new Set(["image/jpeg", "image/png"]);
const EXPENSE_CATEGORIES = "categoriasGastos";
const EXPENSE_PROVIDERS = "proveedoresGastos";

export const validateExpenseReceipt = (file) => {
  if (!file) return "Debes adjuntar la imagen del comprobante.";
  if (!RECEIPT_TYPES.has(file.type)) return "El comprobante debe estar en formato JPG o PNG.";
  if (file.size > RECEIPT_LIMIT) return "La imagen del comprobante no puede superar los 5 MB.";
  return "";
};

export const subscribeToExpenses = (onExpenses, onError) => onSnapshot(
  collection(db, "gastos"),
  (snapshot) => onExpenses(snapshot.docs.map((expense) => ({ id: expense.id, ...expense.data() }))),
  onError,
);

const subscribeToExpenseOptions = (collectionName, onOptions, onError) => onSnapshot(
  collection(db, collectionName),
  (snapshot) => onOptions(snapshot.docs.map((option) => ({ id: option.id, ...option.data() }))),
  onError,
);

export const subscribeToExpenseCategories = (onCategories, onError) => subscribeToExpenseOptions(
  EXPENSE_CATEGORIES,
  onCategories,
  onError,
);

export const subscribeToExpenseProviders = (onProviders, onError) => subscribeToExpenseOptions(
  EXPENSE_PROVIDERS,
  onProviders,
  onError,
);

export const createExpenseCategory = async (name) => addDoc(collection(db, EXPENSE_CATEGORIES), {
  nombre: name,
  creadoEn: serverTimestamp(),
});

export const createExpenseProvider = async (name) => addDoc(collection(db, EXPENSE_PROVIDERS), {
  nombre: name,
  creadoEn: serverTimestamp(),
});

const uploadExpenseReceipt = async (file) => {
  const extension = file.type === "image/png" ? "png" : "jpg";
  const uniqueId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const imagePath = `comprobantes-gastos/${uniqueId}.${extension}`;
  const imageRef = ref(storage, imagePath);
  await uploadBytes(imageRef, file, { contentType: file.type });
  return { imagePath, imageUrl: await getDownloadURL(imageRef) };
};

export const createExpense = async (expense, receiptFile) => {
  const receiptError = validateExpenseReceipt(receiptFile);
  if (receiptError) throw new Error(receiptError);

  const expenseRef = doc(collection(db, "gastos"));
  await setDoc(expenseRef, {
    ...expense,
    imageUrl: "",
    imagePath: "",
    comprobanteEstado: "Pendiente de carga",
    numeroFactura: `GAS-${expenseRef.id.slice(0, 8).toUpperCase()}`,
    creadoEn: serverTimestamp(),
  });

  let uploadedReceipt;
  try {
    uploadedReceipt = await uploadExpenseReceipt(receiptFile);
    await updateDoc(expenseRef, {
      ...uploadedReceipt,
      comprobanteEstado: "Cargado",
      actualizadoEn: serverTimestamp(),
    });
    return { id: expenseRef.id, receiptUploaded: true };
  } catch (receiptUploadError) {
    if (uploadedReceipt?.imagePath) {
      try {
        await deleteObject(ref(storage, uploadedReceipt.imagePath));
      } catch (cleanupError) {
        console.error("No se pudo limpiar la imagen del comprobante:", cleanupError);
      }
    }
    console.error("El gasto se guardó en Firestore, pero no se pudo guardar el comprobante:", receiptUploadError);
    return { id: expenseRef.id, receiptUploaded: false };
  }
};

export const markExpenseAsPaid = async (expenseId, metodo) => updateDoc(doc(db, "gastos", expenseId), {
  estado: "Pagado",
  metodo,
  pagadoEn: serverTimestamp(),
});
