jest.mock("../src/assets/database/firebaseconfig", () => ({}));

import {
  getInventoryProducts,
  saveInventoryProducts,
  getInventoryCategories,
  saveInventoryCategories,
  getInventoryCategoryRecords,
  saveInventoryCategoryRecords,
} from "../src/services/inventoryStorage";

describe("📦 Inventory Storage Service", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test("getInventoryProducts - retorna array vacío por defecto", () => {
    const products = getInventoryProducts();
    expect(Array.isArray(products)).toBe(true);
    expect(products.length).toBe(0);
  });

  test("saveInventoryProducts - guarda productos en localStorage", () => {
    const products = [{ id: "1", name: "Proteína" }];
    saveInventoryProducts(products);

    const saved = getInventoryProducts();
    expect(saved).toEqual(products);
  });

  test("getInventoryCategories - retorna categorías por defecto", () => {
    const categories = getInventoryCategories();
    expect(Array.isArray(categories)).toBe(true);
    expect(categories.length).toBeGreaterThan(0);
  });

  test("getInventoryCategories - usa fallback personalizado", () => {
    const customCategories = getInventoryCategories(["Cat1", "Cat2"]);
    expect(customCategories).toEqual(["Cat1", "Cat2"]);
  });

  test("saveInventoryCategories - guarda categorías en localStorage", () => {
    const categories = ["Suplementos", "Ropa"];
    saveInventoryCategories(categories);

    const saved = getInventoryCategories();
    expect(saved).toEqual(categories);
  });

  test("getInventoryCategoryRecords - retorna objetos con name y description", () => {
    const records = getInventoryCategoryRecords();
    expect(Array.isArray(records)).toBe(true);
    expect(records[0]).toHaveProperty("name");
    expect(records[0]).toHaveProperty("description");
  });

  test("getInventoryCategoryRecords - convierte strings a objetos", () => {
    const records = getInventoryCategoryRecords(["Cat1", "Cat2"]);
    expect(records).toEqual([
      { name: "Cat1", description: "" },
      { name: "Cat2", description: "" },
    ]);
  });

  test("saveInventoryCategoryRecords - guarda registros en localStorage", () => {
    const records = [{ name: "Cat1", description: "Descripción" }];
    saveInventoryCategoryRecords(records);

    const saved = getInventoryCategoryRecords();
    expect(saved).toEqual(records);
  });
});
