import React, { useEffect, useMemo, useState } from "react";
import { QrCode } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Wallet,
  ShoppingCart,
  Package,
  Receipt,
  FileText,
  Settings,
  LogOut,
  Search,
  Plus,
  TriangleAlert,
  CircleX,
  LayoutGrid,
  List,
  Pencil,
  PackageCheck,
} from "lucide-react";
import Encabezado from "../Components/Encabezado";
import ProductoDetalleModal from "../Components/ProductoDetalleModal";
import { getInventoryCategories } from "../services/inventoryStorage";
import { deleteProduct, normalizeProductImageUrl, subscribeToProducts, updateProduct } from "../services/productosService";
import "../Styles/Home.css";
import "../Styles/Inventario.css";

const menuItems = [
  { name: "Inicio", icon: LayoutDashboard, path: "/home" },
  { name: "Asistencia", icon: QrCode, path: "/asistencia" },
  { name: "Clientes", icon: Users, path: "/clientes" },
  { name: "Membresías", icon: CreditCard, path: "/membresias" },
  { name: "Pagos", icon: Wallet, path: "/pagos" },
  { name: "Ventas", icon: ShoppingCart, path: "/ventas" },
  { name: "Inventario", icon: Package, path: "/inventario" },
  { name: "Gastos", icon: Receipt, path: "/gastos" },
  { name: "Análisis y estadísticas", icon: FileText, path: "/analisis" },
  { name: "Reportes", icon: FileText, path: "/reportes" },
  { name: "Nutrición", icon: FileText, path: "/nutricion" },
  { name: "Cerrar sesión", icon: LogOut, path: "/" },
];

const defaultCategories = ["Suplementos", "Bebidas", "Snacks", "Accesorios", "Ropa", "Otros"];

export default function Inventario() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories] = useState(() => getInventoryCategories(defaultCategories));
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState("todos");
  const [view, setView] = useState("grid");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [editingProduct, setEditingProduct] = useState(null);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [productError, setProductError] = useState("");

  useEffect(() => subscribeToProducts(
    (updatedProducts) => {
      setProducts(updatedProducts);
      setIsLoading(false);
      setLoadError("");
    },
    (error) => {
      console.error("Error al cargar productos:", error);
      setLoadError("No se pudieron cargar los productos. Verifica tu conexión y los permisos de Firestore.");
      setIsLoading(false);
    },
  ), []);

  const isOutOfStock = (product) => product.status === "Agotado" || Number(product.stock) <= 0;
  const isLowStock = (product) => !isOutOfStock(product) && (product.status === "Stock bajo" || Number(product.stock) <= Number(product.minimumStock ?? 5));
  const getProductStatus = (product) => isOutOfStock(product) ? "agotado" : isLowStock(product) ? "bajo" : "disponible";

  const handleSaveProduct = async (changes) => {
    setIsSavingProduct(true);
    setProductError("");
    try {
      await updateProduct(editingProduct.id, changes);
      setEditingProduct(null);
    } catch (error) {
      console.error("Error al actualizar el producto:", error);
      if (error.code === "permission-denied" || error.code === "unauthenticated") {
        setProductError("No tienes permisos para guardar cambios. Inicia sesión con una cuenta administradora.");
      } else if (error.code === "not-found") {
        setProductError("Este producto ya no existe. Actualiza el inventario e inténtalo de nuevo.");
      } else {
        setProductError("No se pudieron guardar los cambios en Firestore. Revisa tu conexión e inténtalo de nuevo.");
      }
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleDeleteProduct = async () => {
    setIsSavingProduct(true);
    setProductError("");
    try {
      await deleteProduct(editingProduct.id);
      setEditingProduct(null);
    } catch (error) {
      console.error("Error al eliminar el producto:", error);
      setProductError("No se pudo eliminar el producto. Verifica los permisos de Firestore.");
    } finally {
      setIsSavingProduct(false);
    }
  };

  const filteredProducts = useMemo(() => products.filter((product) => {
    const matchesCategory = activeCategory === "Todos" || product.category === activeCategory || (activeCategory === "Otros" && product.category === "Otro");
    const matchesSearch = `${product.name || ""} ${product.category || ""} ${product.brand || ""}`.toLowerCase().includes(search.toLowerCase());
    const matchesStock = stockFilter === "todos" || getProductStatus(product) === stockFilter;
    return matchesCategory && matchesSearch && matchesStock;
  }), [products, activeCategory, search, stockFilter]);

  return (
    <div className="app">

      {/* =========================
          BARRA LATERAL
      ========================== */}
      <aside className="sidebar">

        {/* LOGO */}
        <div className="logoContainer">
          <img
            src="/logo-port-gym.png"
            alt="Port Gym"
            className="logoImage"
          />
        </div>

        {/* MENÚ */}
        <nav className="menu">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.name}
                className={`menuItem ${item.path === "/inventario" && ["/inventario", "/nuevo-producto", "/nueva-categoria"].includes(window.location.pathname) ? 'activeMenu' : ''} ${item.name === "Cerrar sesión" ? "logoutMenuItem" : ""}`}
                onClick={() => navigate(item.path)}
              >
                <Icon size={18} strokeWidth={2} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* =========================
          ÁREA PRINCIPAL
      ========================== */}
      <main className="main">

        {/* ENCABEZADO SUPERIOR */}
        <Encabezado title="Inventario" description="Gestiona el inventario del gimnasio" />

        {/* =========================
            CONTENIDO INVENTARIO
        ========================== */}
        <section className="content inventoryContent">
              <div className="inventoryActions inventoryPageActions">
                <button className="categoryButton" onClick={() => navigate("/nueva-categoria")}><Plus size={17} /> Nueva categoría</button>
                <button className="newButton" onClick={() => navigate("/nuevo-producto")}><Plus size={18} /> Nuevo producto</button>
          </div>

          <div className="inventoryStats">
            <article className="inventoryStat statTotal"><span className="statIcon"><PackageCheck size={21} /></span><strong>{products.length}</strong><span>Productos totales</span></article>
            <article className="inventoryStat statLow"><span className="statIcon"><TriangleAlert size={21} /></span><strong>{products.filter(isLowStock).length}</strong><span>Stock bajo</span></article>
            <article className="inventoryStat statOut"><span className="statIcon"><CircleX size={21} /></span><strong>{products.filter(isOutOfStock).length}</strong><span>Agotado</span></article>
          </div>

          <div className="inventoryToolbar">
            <label className="searchContainer"><Search size={19} className="searchIcon" /><input type="search" placeholder="Buscar producto..." className="searchInput" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
            <select aria-label="Filtrar por estado" className="inventorySelect" value={stockFilter} onChange={(event) => setStockFilter(event.target.value)}>
              <option value="todos">Estado: todos</option><option value="bajo">Stock bajo</option><option value="agotado">Agotado</option><option value="disponible">Disponible</option>
            </select>
            <div className="viewToggle" aria-label="Vista de productos">
              <button className={view === "grid" ? "selected" : ""} title="Vista de cuadrícula" aria-label="Vista de cuadrícula" onClick={() => setView("grid")}><LayoutGrid size={21} /></button>
              <button className={view === "list" ? "selected" : ""} title="Vista de lista" aria-label="Vista de lista" onClick={() => setView("list")}><List size={21} /></button>
            </div>
          </div>

          <div className="categoryFilters" role="group" aria-label="Filtrar por categoría">
            {["Todos", ...categories].map((category) => <button key={category} className={activeCategory === category ? "active" : ""} onClick={() => setActiveCategory(category)}>{category}</button>)}
          </div>

          {loadError && <p className="inventoryLoadError" role="alert">{loadError}</p>}

          <div className={`productGrid ${view === "list" ? "listView" : ""}`}>
            {filteredProducts.map((product) => {
              const productImageUrl = normalizeProductImageUrl(product.imageUrl);
              return (
                <article className="productCard" key={product.id}>
                  <div className="productImage">
                    {productImageUrl ? (
                      <img
                        src={productImageUrl}
                        alt={product.name || "Producto"}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        crossOrigin="anonymous"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                          const fallback = event.currentTarget.nextElementSibling;
                          if (fallback) fallback.style.display = "flex";
                        }}
                        onLoad={(event) => {
                          event.currentTarget.style.display = "block";
                          const fallback = event.currentTarget.nextElementSibling;
                          if (fallback) fallback.style.display = "none";
                        }}
                      />
                    ) : null}
                    <Package size={30} aria-hidden="true" style={{ display: productImageUrl ? "none" : "flex" }} />
                  </div>
                  <h2>{product.name || "Producto"}</h2>
                  <span className="productCategory">{product.category || "Sin categoría"}</span>
                  <strong className="productPrice">C$ {Number(product.salePrice ?? product.price ?? 0).toLocaleString("es-NI")}</strong>
                  <span className={`productStock ${getProductStatus(product)}`}><i /> Stock: {Number(product.stock || 0)}</span>
                  <div className="productCardActions">
                    <button aria-label={`Editar ${product.name}`} title="Editar producto" onClick={() => { setProductError(""); setEditingProduct(product); }}><Pencil size={15} /></button>
                  </div>
                </article>
              );
            })}
            {filteredProducts.length === 0 && <div className="inventoryEmpty"><Package size={28} /><strong>{isLoading ? "Cargando productos..." : products.length === 0 ? "Aún no hay productos" : "No encontramos productos"}</strong><span>{isLoading ? "" : products.length === 0 ? "Agrega un producto para que aparezca aquí." : "Prueba otra búsqueda o categoría."}</span></div>}
          </div>
        </section>

        {editingProduct && <ProductoDetalleModal
          key={editingProduct.id}
          product={editingProduct}
          categories={categories}
          onClose={() => setEditingProduct(null)}
          onSave={handleSaveProduct}
          onDelete={handleDeleteProduct}
          isSaving={isSavingProduct}
          error={productError}
        />}
      </main>
    </div>
  );
}