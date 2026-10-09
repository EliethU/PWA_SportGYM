import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../assets/database/firebaseconfig";

const RECIPE_CATEGORIES = "categoriasRecetas";
const RECIPE_MEAL_TYPES = "tiposComidaRecetas";
const RECIPE_GOALS = "objetivosNutricionales";
export const MAX_RECIPE_IMAGE_SIZE = 700 * 1024;
const RECIPE_IMAGE_TYPES = new Set(["image/jpeg", "image/png"]);

export const validateRecipeImage = (file) => {
  if (!file) return "";
  if (!RECIPE_IMAGE_TYPES.has(file.type)) return "La imagen debe estar en formato JPG o PNG.";
  if (file.size > MAX_RECIPE_IMAGE_SIZE) return "La imagen no puede superar los 700 KB para guardarse en Firestore.";
  return "";
};

export const recipeImageFileToDataUrl = (file) => new Promise((resolve, reject) => {
  const validationError = validateRecipeImage(file);
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

export const validateRecipeImageUrl = (url) => {
  if (typeof url !== "string" || !url.trim()) return "";
  const imageUrl = url.trim();
  if (imageUrl.startsWith("data:")) {
    const dataUrlMatch = imageUrl.match(/^data:image\/(?:jpeg|png);base64,([A-Za-z0-9+/]+={0,2})$/);
    const maxBase64Length = Math.ceil(MAX_RECIPE_IMAGE_SIZE / 3) * 4;
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

export const subscribeToRecipes = (onRecipes, onError) => onSnapshot(
  collection(db, "recetas"),
  (snapshot) => onRecipes(snapshot.docs.map((recipe) => ({ id: recipe.id, ...recipe.data() }))),
  onError,
);

const subscribeToOptions = (collectionName, onOptions, onError) => onSnapshot(
  collection(db, collectionName),
  (snapshot) => onOptions(snapshot.docs.map((option) => ({ id: option.id, ...option.data() }))),
  onError,
);

export const subscribeToRecipeCategories = (onOptions, onError) => subscribeToOptions(
  RECIPE_CATEGORIES,
  onOptions,
  onError,
);

export const subscribeToRecipeMealTypes = (onOptions, onError) => subscribeToOptions(
  RECIPE_MEAL_TYPES,
  onOptions,
  onError,
);

export const subscribeToRecipeGoals = (onOptions, onError) => subscribeToOptions(
  RECIPE_GOALS,
  onOptions,
  onError,
);

export const createRecipeOption = async (type, name) => {
  const collectionName = {
    category: RECIPE_CATEGORIES,
    mealType: RECIPE_MEAL_TYPES,
    goal: RECIPE_GOALS,
  }[type];
  if (!collectionName) throw new Error("El tipo de opción de receta no es válido.");

  return addDoc(collection(db, collectionName), {
    nombre: name,
    creadoEn: serverTimestamp(),
  });
};

export const createRecipe = async (recipe) => {
  const imageUrl = typeof recipe.imageUrl === "string" ? recipe.imageUrl.trim() : "";
  const imageError = validateRecipeImageUrl(imageUrl);
  if (imageError) throw new Error(imageError);

  const documentRef = await addDoc(collection(db, "recetas"), {
    ...recipe,
    imageUrl,
    creadoEn: serverTimestamp(),
    actualizadoEn: serverTimestamp(),
    activa: true,
  });
  return documentRef.id;
};

export const updateRecipe = async (recipeId, recipe) => {
  const imageUrl = typeof recipe.imageUrl === "string" ? recipe.imageUrl.trim() : "";
  const imageError = validateRecipeImageUrl(imageUrl);
  if (imageError) throw new Error(imageError);

  await updateDoc(doc(db, "recetas", recipeId), {
    ...recipe,
    imageUrl,
    actualizadoEn: serverTimestamp(),
  });
};

export const updateRecipeStatus = async (recipeId, isActive) => updateDoc(doc(db, "recetas", recipeId), {
  activa: isActive,
  actualizadoEn: serverTimestamp(),
});
