import React, { useEffect, useState } from "react";
import { QrCode } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword, deleteUser, getAuth, signOut } from "firebase/auth";
import { collection, doc, getDocs, onSnapshot, query, serverTimestamp, setDoc, where, writeBatch } from "firebase/firestore";
import { getApp, getApps, initializeApp } from "firebase/app";
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
import { appfirebase, auth, db } from "../assets/database/firebaseconfig";
import "../Styles/Home.css";
import "../Styles/NuevoCliente.css";

const menuItems = [
  { name: "Inicio", icon: LayoutDashboard, path: "/home" },
  { name: "Asistencia", icon: QrCode, path: "/asistencia" },
  { name: "Clientes", icon: Users, path: "/clientes" },
  { name: "Membresías", icon: CreditCard, path: "/membresias" },
  { name: "Pagos", icon: Wallet, path: "/pagos" },
  { name: "Ventas", icon: ShoppingCart, path: "/ventas" },
  { name: "Inventario", icon: Package, path: "/inventario" },
  { name: "Gastos", icon: Receipt, path: "/gastos" },
  { name: "Reportes", icon: FileText, path: "/reportes" },
  { name: "Nutrición", icon: FileText, path: "/nutricion" },
  { name: "Configuración", icon: Settings, path: "/configuracion" },
  { name: "Cerrar sesión", icon: LogOut, path: "/" },
];

const registrationAppName = "client-account-provisioning";
const registrationApp = getApps().some((firebaseApp) => firebaseApp.name === registrationAppName)
  ? getApp(registrationAppName)
  : initializeApp(appfirebase.options, registrationAppName);
const registrationAuth = getAuth(registrationApp);

const createUsernameBase = (name) =>
  name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const createTemporaryPassword = () => {
  const letters = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  const values = new Uint32Array(8);
  crypto.getRandomValues(values);
  const passwordCharacters = [
    ...Array.from(values.slice(0, 5), (value) => letters[value % letters.length]),
    ...Array.from(values.slice(5), (value) => digits[value % digits.length]),
  ];

  for (let index = passwordCharacters.length - 1; index > 0; index -= 1) {
    const swapIndex = values[index] % (index + 1);
    [passwordCharacters[index], passwordCharacters[swapIndex]] = [
      passwordCharacters[swapIndex],
      passwordCharacters[index],
    ];
  }

  return passwordCharacters.join("");
};

export default function NuevoCliente() {
  const navigate = useNavigate();
  const [memberships, setMemberships] = useState([]);
  const [isLoadingMemberships, setIsLoadingMemberships] = useState(true);
  const [membershipError, setMembershipError] = useState("");
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

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "membresias"),
      (snapshot) => {
        setMemberships(snapshot.docs
          .map((membership) => ({ id: membership.id, ...membership.data() }))
          .filter((membership) => typeof membership.nombre === "string" && membership.nombre.trim()));
        setIsLoadingMemberships(false);
        setMembershipError("");
      },
      (snapshotError) => {
        console.error("Error al cargar las membresías:", snapshotError);
        setMembershipError("No se pudieron cargar las membresías disponibles.");
        setIsLoadingMemberships(false);
      },
    );

    return unsubscribe;
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((currentData) => ({ ...currentData, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSaving(true);

    let newAuthUser = null;
    let profileSaved = false;
    try {
      const usernameBase = createUsernameBase(formData.nombre);
      const existingUsers = await getDocs(
        query(collection(db, "clientes"), where("usuario", ">=", usernameBase), where("usuario", "<", `${usernameBase}\uf8ff`)),
      );
      const existingUsernames = new Set(existingUsers.docs.map((client) => client.data().usuario));
      let username = usernameBase;
      let suffix = 2;
      while (existingUsernames.has(username)) {
        username = `${usernameBase} ${suffix}`;
        suffix += 1;
      }

      const password = createTemporaryPassword();
      const userCredential = await createUserWithEmailAndPassword(
        registrationAuth,
        formData.correo.trim().toLowerCase(),
        password,
      );
      newAuthUser = userCredential.user;

      const clientRef = doc(collection(db, "clientes"));
      const batch = writeBatch(db);
      batch.set(clientRef, {
        uid: newAuthUser.uid,
        ...formData,
        correo: formData.correo.trim().toLowerCase(),
        usuario: username,
        estado: "Activo",
        estadoPago: "pendiente",
        creadoEn: serverTimestamp(),
      });
      batch.set(doc(db, "usuarios", newAuthUser.uid), {
        uid: newAuthUser.uid,
        email: formData.correo.trim().toLowerCase(),
        rol: "cliente",
        clienteId: clientRef.id,
        creadoEn: serverTimestamp(),
      });
      await batch.commit();
      profileSaved = true;
      await signOut(registrationAuth).catch((signOutError) => {
        console.error("No se pudo cerrar la sesión de registro secundaria:", signOutError);
      });

      setCredentials({
        username,
        email: formData.correo.trim().toLowerCase(),
        password,
      });
    } catch (saveError) {
      console.error("Error al registrar el cliente:", saveError);
      if (newAuthUser && !profileSaved) {
        await deleteUser(newAuthUser).catch((cleanupError) => {
          console.error("No se pudo limpiar la cuenta incompleta:", cleanupError);
        });
      }
      await signOut(registrationAuth).catch(() => {});

      const messages = {
        "auth/email-already-in-use": "Ya existe una cuenta con ese correo.",
        "auth/invalid-email": "El correo no es válido.",
        "auth/operation-not-allowed": "Habilita el proveedor Correo/contraseña en Firebase Authentication.",
        "auth/weak-password": "No se pudo generar una contraseña válida. Inténtalo otra vez.",
        "permission-denied": "Firebase Authentication creó la cuenta, pero Firestore rechazó el perfil. Publica las reglas y verifica que la sesión tenga rol administrador.",
        "unavailable": "No hay conexión con Firebase. Revisa tu conexión e inténtalo de nuevo.",
      };
      setError(messages[saveError.code] || "No se pudo completar el registro. Revisa la consola del navegador para ver el error de Firebase.");
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
                className={`menuItem ${item.path === "/clientes" && ["/clientes", "/nuevo-cliente"].includes(window.location.pathname) ? 'activeMenu' : ''} ${item.name === "Cerrar sesión" ? "logoutMenuItem" : ""}`}
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
                      <option value="">
                        {isLoadingMemberships ? "Cargando membresías..." : "Seleccione membresía"}
                      </option>
                      {memberships.map((membership) => (
                        <option key={membership.id} value={membership.nombre}>
                          {membership.nombre}
                        </option>
                      ))}
                    </select>
                    {membershipError && <p className="formError" role="alert">{membershipError}</p>}
                    {!isLoadingMemberships && !membershipError && memberships.length === 0 && (
                      <p className="sectionHint">No hay membresías registradas. Crea una antes de registrar clientes.</p>
                    )}
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