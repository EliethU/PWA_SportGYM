import React, { useState } from "react";
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
  ArrowLeft,
  ImagePlus,
  Save,
  X,
} from "lucide-react";
import Encabezado from "../Components/Encabezado";
import { getInventoryCategories } from "../services/inventoryStorage";
import {
  createProduct,
  normalizeProductImageUrl,
  productImageFileToDataUrl,
  validateProductImageUrl,
} from "../services/productosService";
import "../Styles/Home.css";
import "../Styles/NuevoProducto.css";

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
const initialForm = (categories) => ({
  name: "",
  description: "",
  category: categories[0] || "",
  brand: "",
  purchasePrice: "",
  salePrice: "",
  stock: "0",
  minimumStock: "0",
  status: "Disponible",
  expirationDate: "",
  size: "",
  imageUrl: "",
});

const errorForProductSave = (error) => {
  if (error.code === "permission-denied" || error.code === "unauthenticated") {
    return "Firebase no autorizó guardar el producto. Verifica que hayas iniciado sesión con una cuenta administradora.";
  }
  return "No se pudo guardar el producto. Comprueba tu conexión e inténtalo de nuevo.";
};

export default function NuevoProducto() {
  const navigate = useNavigate();
  const [categories] = useState(() => getInventoryCategories(defaultCategories));
  const [formData, setFormData] = useState(() => initialForm(categories));
  const [imageLoadError, setImageLoadError] = useState(false);
  const [imageFileName, setImageFileName] = useState("");
  const [isReadingImage, setIsReadingImage] = useState(false);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const profit = Number(formData.salePrice || 0) - Number(formData.purchasePrice || 0);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    if (name === "imageUrl") {
      setImageLoadError(false);
      setError("");
    }
  };

  const handleImageChange = async (event) => {
    const imageFile = event.target.files?.[0];
    event.target.value = "";
    if (!imageFile) return;

    setError("");
    setImageLoadError(false);
    setIsReadingImage(true);
    try {
      const imageUrl = await productImageFileToDataUrl(imageFile);
      setFormData((current) => ({ ...current, imageUrl }));
      setImageFileName(imageFile.name);
    } catch (imageError) {
      setError(imageError.message);
    } finally {
      setIsReadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setFormData((current) => ({ ...current, imageUrl: "" }));
    setImageFileName("");
    setImageLoadError(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (isReadingImage) return;
    const imageUrlError = validateProductImageUrl(formData.imageUrl);
    if (imageUrlError) {
      setError(imageUrlError);
      return;
    }
    setIsSaving(true);
    try {
      await createProduct({
        ...formData,
        name: formData.name.trim(),
        description: formData.description.trim(),
        brand: formData.brand.trim(),
        purchasePrice: Number(formData.purchasePrice),
        salePrice: Number(formData.salePrice),
        stock: Number(formData.stock),
        minimumStock: Number(formData.minimumStock),
        size: formData.size.trim(),
        imageUrl: formData.imageUrl.trim(),
      });
      navigate("/inventario");
    } catch (saveError) {
      console.error("Error al guardar el producto:", saveError);
      setError(errorForProductSave(saveError));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="logoContainer"><img src="/logo-port-gym.png" alt="Port Gym" className="logoImage" /></div>
        <nav className="menu">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return <button key={item.name} className={`menuItem ${item.path === "/inventario" && ["/inventario", "/nuevo-producto", "/nueva-categoria"].includes(window.location.pathname) ? "activeMenu" : ""} ${item.name === "Cerrar sesión" ? "logoutMenuItem" : ""}`} onClick={() => navigate(item.path)}><Icon size={18} strokeWidth={2} /><span>{item.name}</span></button>;
          })}
        </nav>
      </aside>

      <main className="main">
        <Encabezado title="Nuevo producto" description="Agrega un producto al inventario" />
        <section className="content newProductContent">
          <button type="button" className="productBackButton" onClick={() => navigate("/inventario")}><ArrowLeft size={18} /> Volver al inventario</button>
          <form className="newProductForm productEditorForm" onSubmit={handleSubmit}>
            <section className="productEditorPanel productBasicPanel">
              <h2>Información básica</h2>
              <label className="productField">Nombre <b>*</b><input autoFocus required maxLength="100" name="name" value={formData.name} onChange={handleChange} placeholder="Nombre del producto..." /></label>
              <label className="productField">Descripción<textarea maxLength="500" name="description" value={formData.description} onChange={handleChange} rows="3" placeholder="Descripción del producto..." /></label>
              <label className="productField">Categoría <b>*</b><select required name="category" value={formData.category} onChange={handleChange}>{categories.map((category) => <option key={category} value={category}>{category}</option>)}</select></label>
              <label className="productField">Marca <b>*</b><input required maxLength="80" name="brand" value={formData.brand} onChange={handleChange} placeholder="Marca" /></label>
            </section>

            <section className="productEditorPanel productImagePanel">
              <div className="productUploadFrame">
                {formData.imageUrl && !imageLoadError ? (
                  <img
                    className="productUploadPreview"
                    src={normalizeProductImageUrl(formData.imageUrl)}
                    alt="Vista previa del producto"
                    onError={() => setImageLoadError(true)}
                    onLoad={(event) => {
                      event.currentTarget.style.display = "block";
                      const fallback = event.currentTarget.nextElementSibling;
                      if (fallback) fallback.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="productUploadPlaceholder"><ImagePlus size={36} strokeWidth={1.5} /><span>{imageLoadError ? "No se pudo cargar esta URL" : "Vista previa de la imagen"}</span></div>
                )}
              </div>
              <label className="productField productImageFileField">Imagen del producto (opcional)
                <input type="file" accept="image/jpeg,image/png" onChange={handleImageChange} disabled={isReadingImage} />
                <small>{isReadingImage ? "Preparando imagen..." : imageFileName ? `${imageFileName} · Se guardará como URL base64 en productos.imageUrl.` : "JPG o PNG, máximo 700 KB. Se guarda en Firestore, no en Storage."}</small>
              </label>
              {formData.imageUrl && <button className="removeProductImage" type="button" onClick={handleRemoveImage}><X size={14} /> Quitar imagen</button>}
            </section>

            <section className="productEditorPanel productPricingPanel">
              <h2>Precios</h2>
              <div className="productCompactFields">
                <label className="productField">Precio de compra C$ <b>*</b><div className="currencyInput"><span>C$</span><input aria-label="Precio de compra" required min="0" step="0.01" type="number" name="purchasePrice" value={formData.purchasePrice} onChange={handleChange} placeholder="0.00" /></div></label>
                <label className="productField">Precio de venta C$ <b>*</b><div className="currencyInput"><span>C$</span><input aria-label="Precio de venta" required min="0" step="0.01" type="number" name="salePrice" value={formData.salePrice} onChange={handleChange} placeholder="0.00" /></div></label>
              </div>
              <p className={`estimatedProfit ${profit < 0 ? "negative" : ""}`}>Ganancia estimada por unidad: C$ {profit.toLocaleString("es-NI", { minimumFractionDigits: 2 })}</p>
            </section>

            <section className="productEditorPanel productStockPanel">
              <h2>Inventario</h2>
              <div className="productCompactFields productStockFields">
                <label className="productField">Stock actual <b>*</b><input required min="0" step="1" type="number" name="stock" value={formData.stock} onChange={handleChange} /></label>
                <label className="productField">Stock mínimo <b>*</b><input required min="0" step="1" type="number" name="minimumStock" value={formData.minimumStock} onChange={handleChange} /></label>
                <label className="productField">Estado <b>*</b><select required name="status" value={formData.status} onChange={handleChange}><option>Disponible</option><option>Stock bajo</option><option>Agotado</option></select></label>
              </div>
            </section>

            <section className="productEditorPanel productAdditionalPanel">
              <h2>Información adicional</h2>
              <div className="productCompactFields">
                <label className="productField">Vencimiento <b>*</b><input required type="date" name="expirationDate" value={formData.expirationDate} onChange={handleChange} /></label>
                <label className="productField">Peso/Tamaño <b>*</b><input required maxLength="40" name="size" value={formData.size} onChange={handleChange} placeholder="Ej. 1 kg, 500 ml" /></label>
              </div>
            </section>

            {error && <p className="productSaveError" role="alert">{error}</p>}
            <div className="newProductFormActions productEditorActions"><button type="button" className="productCancelButton" onClick={() => navigate("/inventario")}><X size={17} /> Cancelar</button><button className="productSaveButton" type="submit" disabled={isSaving || isReadingImage}><Save size={17} /> {isSaving ? "Guardando..." : isReadingImage ? "Preparando imagen..." : "Guardar"}</button></div>
          </form>
        </section>
      </main>
    </div>
  );
}