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
  Save,
} from "lucide-react";
import Encabezado from "../Components/Encabezado";
import { getInventoryCategoryRecords, saveInventoryCategoryRecords } from "../services/inventoryStorage";
import "../Styles/Home.css";
import "../Styles/NuevaCategoria.css";

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

export default function NuevaCategoria() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    if (name === "name") setError("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const name = formData.name.trim();
    const categories = getInventoryCategoryRecords();
    if (categories.some((category) => category.name.toLocaleLowerCase() === name.toLocaleLowerCase())) {
      setError("Ya existe una categoría con ese nombre.");
      return;
    }

    saveInventoryCategoryRecords([...categories, { name, description: formData.description.trim() }]);
    navigate("/inventario");
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
        <Encabezado title="Nueva categoría" description="Organiza los productos del inventario" />
        <section className="content newCategoryContent">
          <button type="button" className="categoryBackButton" onClick={() => navigate("/inventario")}><ArrowLeft size={18} /> Volver al inventario</button>
          <form className="newCategoryForm" onSubmit={handleSubmit}>
            <div className="newCategoryFormHeading"><h2>Información de la categoría</h2><span><b>*</b> Campo obligatorio</span></div>
            <div className="newCategoryFields">
              <label className="newCategoryField">Nombre de categoría <b>*</b><input autoFocus required maxLength="60" name="name" value={formData.name} onChange={handleChange} placeholder="Ej. Proteínas" aria-describedby={error ? "category-form-error" : undefined} /></label>
              {error && <p className="newCategoryError" id="category-form-error" role="alert">{error}</p>}
              <label className="newCategoryField">Descripción <span>(opcional)</span><textarea maxLength="240" name="description" value={formData.description} onChange={handleChange} rows="4" placeholder="Describe los productos que pertenecen a esta categoría" /></label>
            </div>
            <div className="newCategoryFormActions"><button type="button" className="categoryCancelButton" onClick={() => navigate("/inventario")}>Cancelar</button><button className="categorySaveButton" type="submit"><Save size={17} /> Guardar categoría</button></div>
          </form>
        </section>
      </main>
    </div>
  );
}
