import React, { useEffect, useRef, useState } from "react";
import { ImagePlus, Save, Trash2, X } from "lucide-react";
import { normalizeProductImageUrl, validateProductImage } from "../services/productosService";

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
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(normalizeProductImageUrl(product.imageUrl || ""));
  const [imageError, setImageError] = useState("");
  const imagePreviewRef = useRef("");

  useEffect(() => {
    return () => {
      if (imagePreviewRef.current) URL.revokeObjectURL(imagePreviewRef.current);
    };
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setDraft((current) => ({ ...current, [name]: value }));
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0] || null;
    const validationError = validateProductImage(file);
    setImageError(validationError);
    const acceptedFile = validationError ? null : file;
    if (imagePreviewRef.current) URL.revokeObjectURL(imagePreviewRef.current);
    imagePreviewRef.current = acceptedFile ? URL.createObjectURL(acceptedFile) : "";
    setImagePreview(normalizeProductImageUrl(imagePreviewRef.current || product.imageUrl || ""));
    setImageFile(acceptedFile);
    if (validationError) event.target.value = "";
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave({
      name: draft.name.trim(),
      category: draft.category,
      description: draft.description.trim(),
      brand: draft.brand.trim(),
      status: draft.status,
      salePrice: Number(draft.salePrice),
      stock: Number(draft.stock),
      minimumStock: Number(draft.minimumStock),
    }, imageFile);
  };

  const categoryOptions = [...new Set([product.category, ...categories].filter(Boolean))];

  return (
    <div className="inventoryModalBackdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="productDetailModal" role="dialog" aria-modal="true" aria-labelledby="productDetailTitle">
        <form onSubmit={handleSubmit}>
          <h2 id="productDetailTitle">Detalle del producto</h2>
          <div className="productDetailLayout">
            <div className="productDetailImage">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt={`Imagen de ${product.name}`}
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
              <div style={{ display: imagePreview ? "none" : "flex" }}><ImagePlus size={36} strokeWidth={1.5} /></div>
              <label htmlFor="edit-product-image"><ImagePlus size={16} /> Cambiar imagen</label>
              <input id="edit-product-image" type="file" accept="image/jpeg,image/png" onChange={handleImageChange} />
            </div>
            <div className="productDetailFields">
              <label>Nombre del producto<input required maxLength="100" name="name" value={draft.name} onChange={handleChange} /></label>
              <label>Categoría<select required name="category" value={draft.category} onChange={handleChange}>{categoryOptions.map((category) => <option key={category}>{category}</option>)}</select></label>
              <label className="detailFieldWide">Descripción<textarea maxLength="500" name="description" rows="2" value={draft.description} onChange={handleChange} /></label>
              <label>Marca<input required maxLength="80" name="brand" value={draft.brand} onChange={handleChange} /></label>
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
            <button type="submit" className="detailSaveButton" disabled={isSaving}><Save size={17} /> {isSaving ? "Guardando..." : "Guardar"}</button>
          </div>
        </form>
      </section>
    </div>
  );
}