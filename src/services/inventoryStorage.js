const PRODUCTS_KEY = "sportgym-inventory-products";
const CATEGORIES_KEY = "sportgym-inventory-categories";
const DEFAULT_CATEGORIES = ["Suplementos", "Bebidas", "Snacks", "Accesorios", "Ropa", "Otros"];

const readList = (key, fallback) => {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return Array.isArray(value) ? value : fallback;
  } catch {
    return fallback;
  }
};

export const getInventoryProducts = () => readList(PRODUCTS_KEY, []);

export const saveInventoryProducts = (products) => {
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
};

export const getInventoryCategoryRecords = (fallback = DEFAULT_CATEGORIES) => readList(CATEGORIES_KEY, fallback)
  .map((category) => typeof category === "string"
    ? { name: category, description: "" }
    : { name: category.name, description: category.description || "" })
  .filter((category) => category.name);

export const getInventoryCategories = (fallback = DEFAULT_CATEGORIES) => getInventoryCategoryRecords(fallback)
  .map((category) => category.name);

export const saveInventoryCategories = (categories) => {
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
};

export const saveInventoryCategoryRecords = (categories) => {
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
};