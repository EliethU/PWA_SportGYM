import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { db, storage } from "../assets/database/firebaseconfig";

const IMAGE_LIMIT = 5 * 1024 * 1024;
const IMAGE_TYPES = new Set(["image/jpeg", "image/png"]);

export const normalizeProductImageUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("gs://")) {
    const bucket = "sportgym-2b2f8.firebasestorage.app";
    const objectPath = encodeURIComponent(url.replace(/^gs:\/\/[^/]+\//, ""));
    return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${objectPath}?alt=media`;
  }
  return url;
};

const uploadFileWithTimeout = (imageRef, file) => new Promise((resolve, reject) => {
  const uploadTask = uploadBytesResumable(imageRef, file, { contentType: file.type });
  const timeout = setTimeout(() => {
    uploadTask.cancel();
    const error = new Error("La carga de imagen superó el tiempo máximo.");
    error.code = "storage/timeout";
    reject(error);
  }, 60_000);

  uploadTask.on(
    "state_changed",
    undefined,
    (error) => {
      clearTimeout(timeout);
      reject(error);
    },
    () => {
      clearTimeout(timeout);
      resolve(uploadTask.snapshot);
    },
  );
});


export const validateProductImage = (file) => {
  if (!file) return "";
  if (!IMAGE_TYPES.has(file.type)) return "La imagen debe estar en formato JPG o PNG.";
  if (file.size > IMAGE_LIMIT) return "La imagen no puede superar los 5 MB.";
  return "";
};

const uploadProductImage = async (file) => {
  const extension = file.type === "image/png" ? "png" : "jpg";
  const uniqueId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const imagePath = `productos/${uniqueId}.${extension}`;
  const imageRef = ref(storage, imagePath);
  await uploadFileWithTimeout(imageRef, file);
  return { imagePath, imageUrl: await getDownloadURL(imageRef) };
};

const removeProductImage = async (imagePath) => {
  if (!imagePath) return;
  try {
    await deleteObject(ref(storage, imagePath));
  } catch (error) {
    if (error.code !== "storage/object-not-found") throw error;
  }
};

export const subscribeToProducts = (onProducts, onError) => onSnapshot(
  collection(db, "productos"),
  (snapshot) => onProducts(snapshot.docs.map((productDoc) => ({ id: productDoc.id, ...productDoc.data() }))),
  onError,
);

export const createProduct = async (product, imageFile) => {
  let uploadedImage = null;
  try {
    if (imageFile) uploadedImage = await uploadProductImage(imageFile);
    const documentRef = await addDoc(collection(db, "productos"), {
      ...product,
      ...(uploadedImage || { imageUrl: "", imagePath: "" }),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return documentRef.id;
  } catch (error) {
    if (uploadedImage) await removeProductImage(uploadedImage.imagePath).catch(() => {});
    throw error;
  }
};

export const updateProduct = async (productId, product, imageFile, previousImagePath) => {
  let uploadedImage = null;
  try {
    if (imageFile) uploadedImage = await uploadProductImage(imageFile);
    await updateDoc(doc(db, "productos", productId), {
      ...product,
      ...(uploadedImage || {}),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    if (uploadedImage) await removeProductImage(uploadedImage.imagePath).catch(() => {});
    throw error;
  }
  if (uploadedImage && previousImagePath) await removeProductImage(previousImagePath).catch((error) => console.error("No se pudo eliminar la imagen anterior:", error));
};

export const deleteProduct = async (productId, imagePath) => {
  await deleteDoc(doc(db, "productos", productId));
  await removeProductImage(imagePath).catch((error) => console.error("No se pudo eliminar la imagen del producto:", error));
};