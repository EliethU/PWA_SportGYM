import React, { useState } from "react";
import { ImagePlus, Save, Trash2, X } from "lucide-react";
import {
  normalizeProductImageUrl,
  productImageFileToDataUrl,
  validateProductImageUrl,
} from "../services/productosService";

export default function ProductoDetalleModal({ product, categories, onClose, onSave, onDelete, isSaving, error }) {
  const [draft, setDraft] = useState({
    name: product.name || "",
    category: product.category || categories[0] || "",
    description: product.description || "",
    brand: product.brand || "",
    status: product.status || "Disponible",
    salePrice: String(product.salePrice ?? product.price ?? ""),
    stock: String(product.stock ?? "0"),
    minimumStock: String(product.minimumStock ?? "0"),
    imageUrl: normalizeProductImageUrl(product.imageUrl || ""),
  });
  const [imageLoadError, setImageLoadError] = useState(false);
  const [imageError, setImageError] = useState("");
  const [isReadingImage, setIsReadingImage] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setDraft((current) => ({ ...current, [name]: value }));
    if (name === "imageUrl") {
      setImageLoadError(false);
      setImageError("");
    }
  };

  const handleImageChange = async (event) => {
    const imageFile = event.target.files?.[0];
    event.target.value = "";
    if (!imageFile) return;

    setImageError("");
    setImageLoadError(false);
    setIsReadingImage(true);
    try {
      const imageUrl = await productImageFileToDataUrl(imageFile);
      setDraft((current) => ({ ...current, imageUrl }));
    } catch (loadError) {
      setImageError(loadError.message);
    } finally {
      setIsReadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setDraft((current) => ({ ...current, imageUrl: "" }));
    setImageLoadError(false);
    setImageError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isReadingImage) return;
    const urlError = validateProductImageUrl(draft.imageUrl);
    if (urlError) {
      setImageError(urlError);
      return;
    }
    setImageError("");
    await onSave({
      name: draft.name.trim(),
      category: draft.category,
      description: draft.description.trim(),
      brand: draft.brand.trim(),
      status: draft.status,
      salePrice: Number(draft.salePrice),
      stock: Number(draft.stock),
      minimumStock: Number(draft.minimumStock),
      imageUrl: draft.imageUrl.trim(),
    });
  };

  const categoryOptions = [...new Set([product.category, ...categories].filter(Boolean))];

  return (
    <div className="inventoryModalBackdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="productDetailModal" role="dialog" aria-modal="true" aria-labelledby="productDetailTitle">
        <form onSubmit={handleSubmit}>
          <h2 id="productDetailTitle">Detalle del producto</h2>
          <div className="productDetailLayout">
            <div className="productDetailImage">
              {draft.imageUrl && !imageLoadError ? (
                <img
                  src={normalizeProductImageUrl(draft.imageUrl)}
                  alt={`Imagen de ${product.name}`}
                  referrerPolicy="no-referrer"
                  onError={() => setImageLoadError(true)}
                />
              ) : (
                <div className="productDetailImagePlaceholder"><ImagePlus size={36} strokeWidth={1.5} /><span>{imageLoadError ? "No se pudo cargar esta URL" : "Vista previa"}</span></div>
              )}
              <label htmlFor="edit-product-image-file">Imagen del producto</label>
              <input
                id="edit-product-image-file"
                className="productDetailImageUrl"
                type="file"
                accept="image/jpeg,image/png"
                onChange={handleImageChange}
                disabled={isReadingImage}
              />
              <small className="productDetailImageHelp">{isReadingImage ? "Preparando imagen..." : "JPG o PNG · Máximo 700 KB · Se guarda como URL base64 en productos.imageUrl."}</small>
              {draft.imageUrl && <button className="removeProductImage" type="button" onClick={handleRemoveImage}><X size={14} /> Quitar imagen</button>}
            </div>
            <div className="productDetailFields">
              <label>Nombre del producto<input required maxLength="100" name="name" value={draft.name} onChange={handleChange} /></label>
              <label>Categoría<select required name="category" value={draft.category} onChange={handleChange}>{categoryOptions.map((category) => <option key={category}>{category}</option>)}</select></label>
              <label className="detailFieldWide">Descripción<textarea maxLength="500" name="description" rows="2" value={draft.description} onChange={handleChange} /></label>
              <label>Marca<input maxLength="80" name="brand" value={draft.brand} onChange={handleChange} /></label>
              <label>Estado<select name="status" value={draft.status} onChange={handleChange}><option>Disponible</option><option>Stock bajo</option><option>Agotado</option></select></label>
              <label>Precio<input required min="0" step="0.01" type="number" name="salePrice" value={draft.salePrice} onChange={handleChange} /></label>
              <label>Stock actual<input required min="0" step="1" type="number" name="stock" value={draft.stock} onChange={handleChange} /></label>
              <label>Stock mínimo<input required min="0" step="1" type="number" name="minimumStock" value={draft.minimumStock} onChange={handleChange} /></label>
            </div>
          </div>
          {(imageError || error) && <p className="productDetailError" role="alert">{imageError || error}</p>}
          <div className="productDetailActions">
            <button type="button" className="detailCancelButton" onClick={onClose}><X size={17} /> Cancelar</button>
            <button type="button" className="detailDeleteButton" disabled={isSaving} onClick={() => { if (window.confirm(`¿Eliminar ${product.name}?`)) onDelete(); }}><Trash2 size={17} /> Eliminar</button>
            <button type="submit" className="detailSaveButton" disabled={isSaving || isReadingImage}><Save size={17} /> {isSaving ? "Guardando..." : isReadingImage ? "Preparando imagen..." : "Guardar cambios"}</button>
          </div>
        </form>
      </section>
    </div>
  );
}