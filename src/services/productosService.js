import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../assets/database/firebaseconfig";

export const MAX_PRODUCT_IMAGE_SIZE = 700 * 1024;
const PRODUCT_IMAGE_TYPES = new Set(["image/jpeg", "image/png"]);

export const normalizeProductImageUrl = (url) => {
  return typeof url === "string" ? url.trim() : "";
};

export const validateProductImageFile = (file) => {
  if (!file) return "";
  if (!PRODUCT_IMAGE_TYPES.has(file.type)) return "La imagen debe estar en formato JPG o PNG.";
  if (file.size > MAX_PRODUCT_IMAGE_SIZE) return "La imagen no puede superar los 700 KB para guardarse en Firestore.";
  return "";
};

export const productImageFileToDataUrl = (file) => new Promise((resolve, reject) => {
  const validationError = validateProductImageFile(file);
  if (validationError) {
    reject(new Error(validationError));
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    if (typeof reader.result === "string") {
      resolve(reader.result);
    } else {
      reject(new Error("No se pudo leer el archivo de imagen."));
    }
  };
  reader.onerror = () => reject(reader.error || new Error("No se pudo leer el archivo de imagen."));
  reader.readAsDataURL(file);
});

export const validateProductImageUrl = (url) => {
  if (typeof url !== "string" || !url.trim()) return "";
  const imageUrl = url.trim();
  if (imageUrl.startsWith("data:")) {
    const dataUrlMatch = imageUrl.match(/^data:image\/(?:jpeg|png);base64,([A-Za-z0-9+/]+={0,2})$/);
    const maxBase64Length = Math.ceil(MAX_PRODUCT_IMAGE_SIZE / 3) * 4;
    return dataUrlMatch && dataUrlMatch[1].length <= maxBase64Length
      ? ""
      : "La imagen incrustada no es válida o supera los 700 KB.";
  }
  try {
    const parsedUrl = new URL(imageUrl);
    if (parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:") return "";
  } catch {
    return "Ingresa una URL válida para la imagen.";
  }
  return "La URL de la imagen debe comenzar con http:// o https://.";
};

export const subscribeToProducts = (onProducts, onError) => onSnapshot(
  collection(db, "productos"),
  (snapshot) => onProducts(snapshot.docs.map((productDoc) => ({ id: productDoc.id, ...productDoc.data() }))),
  onError,
);

export const createProduct = async (product) => {
  const imageUrl = typeof product.imageUrl === "string" ? product.imageUrl.trim() : "";
  const documentRef = await addDoc(collection(db, "productos"), {
    ...product,
    imageUrl,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return documentRef.id;
};

export const updateProduct = async (productId, product) => {
  const imageUrl = typeof product.imageUrl === "string" ? product.imageUrl.trim() : "";
  await updateDoc(doc(db, "productos", productId), {
    ...product,
    imageUrl,
    updatedAt: serverTimestamp(),
  });
};

export const deleteProduct = async (productId) => {
  await deleteDoc(doc(db, "productos", productId));
};