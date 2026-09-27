import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getFunctions, httpsCallable } from "firebase/functions";
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
  ShieldCheck,
  KeyRound,
  History,
  ReceiptText,
} from "lucide-react";
import Encabezado from "../Components/Encabezado";
import { appfirebase } from "../assets/database/firebaseconfig";
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

const registrarCliente = httpsCallable(getFunctions(appfirebase, "us-central1"), "registrarCliente");

const createUsernameBase = (name) =>
  name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.|\.$/g, "");

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
      const result = await registrarCliente(formData);
      setCredentials({
        username: result.data.usuario,
        email: result.data.correo,
        password: result.data.contrasenaTemporal,
      });
    } catch (saveError) {
      console.error("Error al registrar el cliente:", saveError);
      setError(
        saveError.code === "functions/already-exists"
          ? "Ya existe una cuenta con ese correo."
          : "No se pudo registrar el cliente. Verifica que la sesión de administrador esté activa y que la función esté desplegada.",
      );
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
            <div className="clientFormHeading">
              <div>
                <span className="clientFormEyebrow">REGISTRO DE CLIENTE</span>
                <h3 className="formTitle">Información del cliente</h3>
              </div>
              <span className="requiredHint">* Campos obligatorios</span>
            </div>

            {credentials && (
              <div className="credentialsBox">
                <h4 className="credentialsTitle">Cliente registrado</h4>
                <p>Guarda estas credenciales para entregárselas al cliente.</p>
                <div className="credentialsRow">
                  <strong>Usuario:</strong>
                  <span>{credentials.username}</span>
                </div>
                <div className="credentialsRow">
                  <strong>Correo:</strong>
                  <span>{credentials.email}</span>
                </div>
                <div className="credentialsRow">
                  <strong>Contraseña:</strong>
                  <span>{credentials.password}</span>
                </div>
                <p className="credentialsSecurityNote">La contraseña temporal solo se muestra ahora. Entrégasela al cliente de forma segura.</p>
                <button type="button" className="newClientButton" onClick={() => navigate("/clientes")}>
                  Ir a clientes
                </button>
              </div>
            )}
            
            {!credentials && <form className="clientForm" onSubmit={handleSubmit}>
              <div className="formSectionsGrid">
                <section className="formSection">
                  <h4 className="formSectionTitle">
                    <span className="sectionIcon"><User size={17} /></span>
                    Datos personales
                  </h4>

                  <div className="formGroup">
                    <label className="formLabel" htmlFor="client-name">Nombre completo <span>*</span></label>
                    <input
                      id="client-name"
                      type="text"
                      name="nombre"
                      className="formInput"
                      placeholder="Nombre del cliente"
                      value={formData.nombre}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="formGroup">
                    <label className="formLabel" htmlFor="client-phone">Teléfono</label>
                    <div className="inputWithIcon">
                      <Phone size={17} />
                      <input
                        id="client-phone"
                        type="tel"
                        name="telefono"
                        className="formInput"
                        placeholder="Número de teléfono"
                        value={formData.telefono}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="formGroup">
                    <label className="formLabel" htmlFor="client-email">Correo electrónico <span>*</span></label>
                    <div className="inputWithIcon">
                      <Mail size={17} />
                      <input
                        id="client-email"
                        type="email"
                        name="correo"
                        className="formInput"
                        placeholder="correo@ejemplo.com"
                        value={formData.correo}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="formGroup">
                    <label className="formLabel" htmlFor="client-notes">Notas adicionales</label>
                    <textarea
                      id="client-notes"
                      name="notas"
                      className="formTextarea"
                      placeholder="Observaciones sobre el cliente"
                      rows={2}
                      value={formData.notas}
                      onChange={handleChange}
                    />
                  </div>
                </section>

                <section className="formSection">
                  <h4 className="formSectionTitle">
                    <span className="sectionIcon"><Calendar size={17} /></span>
                    Información de membresía
                  </h4>

                  <div className="formGroup">
                    <label className="formLabel" htmlFor="client-membership">Tipo de membresía <span>*</span></label>
                    <select
                      id="client-membership"
                      name="membresia"
                      className="formSelect"
                      value={formData.membresia}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Seleccione membresía</option>
                      <option value="premium">Premium</option>
                      <option value="mensual">Mensual</option>
                      <option value="semanal">Semanal</option>
                      <option value="diaria">Diaria</option>
                    </select>
                  </div>

                  <div className="formGroup">
                    <label className="formLabel" htmlFor="client-start-date">Fecha de inicio <span>*</span></label>
                    <div className="inputWithIcon">
                      <Calendar size={17} />
                      <input
                        id="client-start-date"
                        type="date"
                        name="fechaInicio"
                        className="formInput"
                        value={formData.fechaInicio}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                  <p className="sectionHint">La membresía y la fecha se utilizarán para iniciar el registro del cliente.</p>
                </section>

                <section className="formSection accountSection">
                  <h4 className="formSectionTitle">
                    <span className="sectionIcon"><ShieldCheck size={17} /></span>
                    Datos de cuenta
                  </h4>
                  <div className="formRow">
                    <div className="formGroup">
                      <label className="formLabel" htmlFor="client-username">Usuario</label>
                      <div className="inputWithIcon">
                        <User size={17} />
                        <input
                          id="client-username"
                          className="formInput"
                          value={formData.nombre ? createUsernameBase(formData.nombre) : ""}
                          placeholder="Nombre usuario"
                          readOnly
                        />
                      </div>
                    </div>
                    <div className="formGroup">
                      <label className="formLabel" htmlFor="client-password">Contraseña</label>
                      <div className="inputWithIcon">
                        <KeyRound size={17} />
                        <input
                          id="client-password"
                          className="formInput"
                          value=""
                          placeholder="Se genera al guardar"
                          readOnly
                        />
                      </div>
                    </div>
                  </div>
                  <p className="sectionHint">El usuario se crea con este correo. La contraseña temporal se genera en Firebase Authentication y no se guarda en Firestore.</p>
                </section>
              </div>

              <section className="transactionsSection">
                <div className="transactionsHeading">
                  <h4 className="formSectionTitle">
                    <span className="sectionIcon"><History size={17} /></span>
                    Historial reciente de transacciones
                  </h4>
                  <span className="transactionCount">0 transacciones</span>
                </div>
                <div className="transactionEmptyState">
                  <ReceiptText size={21} />
                  <span>No hay transacciones registradas para este cliente.</span>
                </div>
              </section>

              {error && <p className="formError" role="alert">{error}</p>}

              <div className="formActions">
                <button type="button" className="cancelButton" onClick={() => navigate("/clientes")}>
                  <ArrowLeft size={17} />
                  <span>Cancelar</span>
                </button>
                <button type="submit" className="saveButton" disabled={isSaving}>
                  <Save size={18} />
                  <span>{isSaving ? "Guardando..." : "Guardar"}</span>
                </button>
              </div>
            </form>}
          </div>

        </section>

      </main>
    </div>
  );
}