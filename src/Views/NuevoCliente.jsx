import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { addDoc, collection, getDocs, query, serverTimestamp, where } from "firebase/firestore";
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
  Phone,
  Mail,
  User,
  Calendar,
} from "lucide-react";
import Encabezado from "../Components/Encabezado";
import { db } from "../assets/database/firebaseconfig";
import "../Styles/Home.css";
import "../Styles/NuevoCliente.css";

const menuItems = [
  { name: "Dashboard", icon: LayoutDashboard, path: "/home" },
  { name: "Clientes", icon: Users, path: "/clientes" },
  { name: "Membresías", icon: CreditCard, path: "/membresias" },
  { name: "Pagos", icon: Wallet, path: "/pagos" },
  { name: "Ventas", icon: ShoppingCart, path: "/ventas" },
  { name: "Inventario", icon: Package, path: "/inventario" },
  { name: "Gastos", icon: Receipt, path: "/gastos" },
  { name: "Reportes", icon: FileText, path: "/reportes" },
  { name: "Configuración", icon: Settings, path: "/configuracion" },
  { name: "Cerrar sesión", icon: LogOut, path: "/" },
];

const createUsernameBase = (name) =>
  name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.|\.$/g, "");

const createPassword = () => {
  const length = Math.floor(Math.random() * 3) + 6;
  const randomValues = new Uint32Array(length);
  crypto.getRandomValues(randomValues);
  return Array.from(randomValues, (value) => value % 10).join("");
};

export default function NuevoCliente() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombre: "",
    telefono: "",
    correo: "",
    membresia: "",
    fechaInicio: "",
    notas: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [credentials, setCredentials] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((currentData) => ({ ...currentData, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSaving(true);

    try {
      const usernameBase = createUsernameBase(formData.nombre);
      const existingUsers = await getDocs(
        query(collection(db, "clientes"), where("usuario", ">=", usernameBase), where("usuario", "<", `${usernameBase}\uf8ff`)),
      );
      const existingUsernames = new Set(existingUsers.docs.map((client) => client.data().usuario));
      let username = usernameBase;
      let suffix = 2;

      while (existingUsernames.has(username)) {
        username = `${usernameBase}${suffix}`;
        suffix += 1;
      }

      const password = createPassword();
      await addDoc(collection(db, "clientes"), {
        ...formData,
        usuario: username,
        contrasena: password,
        estado: "Activo",
        creadoEn: serverTimestamp(),
      });
      setCredentials({ username, password });
    } catch (saveError) {
      console.error("Error al registrar el cliente:", saveError);
      setError("No se pudo registrar el cliente. Revisa la conexión con Firebase.");
    } finally {
      setIsSaving(false);
    }
  };

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
          {menuItems.map((item, index) => {
            const Icon = item.icon;

            return (
              <button
                key={item.name}
                className={`menuItem ${item.name === "Clientes" ? 'activeMenu' : ''} ${item.name === "Cerrar sesión" ? "logoutMenuItem" : ""}`}
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
        <Encabezado title="Nuevo cliente" description="Agrega un nuevo cliente al sistema" />

        {/* =========================
            CONTENIDO NUEVO CLIENTE
        ========================== */}
        <section className="content">

          {/* BOTÓN VOLVER */}
          <button className="backButton" onClick={() => navigate("/clientes")}>
            <ArrowLeft size={18} />
            <span>Volver a clientes</span>
          </button>

          {/* FORMULARIO DE CLIENTE */}
          <div className="clientFormContainer">
            <h3 className="formTitle">Información del cliente</h3>

            {credentials && (
              <div className="credentialsBox">
                <h4 className="credentialsTitle">Cliente registrado</h4>
                <p>Guarda estas credenciales para entregárselas al cliente.</p>
                <div className="credentialsRow">
                  <strong>Usuario:</strong>
                  <span>{credentials.username}</span>
                </div>
                <div className="credentialsRow">
                  <strong>Contraseña:</strong>
                  <span>{credentials.password}</span>
                </div>
                <button type="button" className="newClientButton" onClick={() => navigate("/clientes")}>
                  Ir a clientes
                </button>
              </div>
            )}
            
            {!credentials && <form className="clientForm" onSubmit={handleSubmit}>
              <div className="formSection">
                <h4 className="formSectionTitle">Datos personales</h4>
                
                <div className="formGroup">
                  <label className="formLabel">
                    <User size={16} className="labelIcon" />
                    Nombre completo
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    className="formInput"
                    placeholder="Nombre del cliente"
                    value={formData.nombre}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="formRow">
                  <div className="formGroup">
                    <label className="formLabel">
                      <Phone size={16} className="labelIcon" />
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      name="telefono"
                      className="formInput"
                      placeholder="Número de teléfono"
                      value={formData.telefono}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="formGroup">
                    <label className="formLabel">
                      <Mail size={16} className="labelIcon" />
                      Correo electrónico
                    </label>
                    <input
                      type="email"
                      name="correo"
                      className="formInput"
                      placeholder="correo@ejemplo.com"
                      value={formData.correo}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              <div className="formSection">
                <h4 className="formSectionTitle">Información de membresía</h4>
                
                <div className="formRow">
                  <div className="formGroup">
                    <label className="formLabel">Tipo de membresía</label>
                    <select
                      name="membresia"
                      className="formSelect"
                      value={formData.membresia}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Seleccionar membresía</option>
                      <option value="premium">Premium</option>
                      <option value="mensual">Mensual</option>
                      <option value="semanal">Semanal</option>
                      <option value="diaria">Diaria</option>
                    </select>
                  </div>

                  <div className="formGroup">
                    <label className="formLabel">
                      <Calendar size={16} className="labelIcon" />
                      Fecha de inicio
                    </label>
                    <input
                      type="date"
                      name="fechaInicio"
                      className="formInput"
                      value={formData.fechaInicio}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="formSection">
                <h4 className="formSectionTitle">Información adicional</h4>
                
                <div className="formGroup">
                  <label className="formLabel">Notas adicionales</label>
                  <textarea
                    name="notas"
                    className="formTextarea"
                    placeholder="Observaciones o notas sobre el cliente..."
                    rows={3}
                    value={formData.notas}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {error && <p className="formError">{error}</p>}

              <div className="formActions">
                <button type="button" className="cancelButton" onClick={() => navigate("/clientes")}>
                  Cancelar
                </button>
                <button type="submit" className="saveButton" disabled={isSaving}>
                  <Save size={18} />
                  <span>{isSaving ? "Guardando..." : "Guardar cliente"}</span>
                </button>
              </div>
            </form>}
          </div>

        </section>

      </main>
    </div>
  );
}