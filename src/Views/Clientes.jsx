import React, { useEffect, useMemo, useState } from "react";
import { QrCode } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { collection, deleteDoc, doc, onSnapshot, updateDoc } from "firebase/firestore";
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
  Pencil,
  Trash2,
  X,
  Save,
  Eye,
  EyeOff,
} from "lucide-react";
import Encabezado from "../Components/Encabezado";
import { db } from "../assets/database/firebaseconfig";
import Pagination, { PAGE_SIZE } from "../Components/Pagination";
import AdminSidebar from "../Components/AdminSidebar";
import "../Styles/Home.css";
import "../Styles/Clientes.css";

const getClientPaymentStatus = (client) => {
  const rawStatus = String(
    client.estadoPago || client.pagoEstado || client.estadoTransaccion || client.estado || "",
  )
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (rawStatus.includes("vencid") || rawStatus.includes("expir")) return "vencido";

  const expirationValue = client.fechaVencimiento || client.fechaFin || client.fechaExpiracion;
  const expirationDate = expirationValue?.toDate
    ? expirationValue.toDate()
    : typeof expirationValue === "string" && /^\d{4}-\d{2}-\d{2}$/.test(expirationValue)
      ? new Date(`${expirationValue}T00:00:00`)
      : expirationValue
        ? new Date(expirationValue)
        : null;

  if (expirationDate && !Number.isNaN(expirationDate.getTime())) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expirationDate.setHours(0, 0, 0, 0);
    if (expirationDate < today) return "vencido";
  }

  if (rawStatus.includes("pagad") || rawStatus.includes("paid")) return "pagado";
  if (rawStatus.includes("pend") || rawStatus.includes("pending")) return "pendiente";
  return "pendiente";
};

const formatDate = (value) => {
  if (!value) return "-";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [, year, month, day] = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return `${day}/${month}/${year}`;
  }

  const date = value?.toDate ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("es", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
};

const formatMembership = (membership) =>
  membership ? membership.charAt(0).toUpperCase() + membership.slice(1) : "-";

export default function Clientes() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [editingClient, setEditingClient] = useState(null);
  const [editData, setEditData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [deletingClientId, setDeletingClientId] = useState("");
  const [visiblePasswords, setVisiblePasswords] = useState(() => new Set());

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "clientes"),
      (snapshot) => {
        setClients(snapshot.docs.map((client) => ({ id: client.id, ...client.data() })));
        setError("");
      },
      (snapshotError) => {
        console.error("Error al cargar los clientes:", snapshotError);
        setError("No se pudieron cargar los clientes. Revisa la conexión con Firebase.");
      },
    );

    return () => unsubscribe();
  }, []);

  const filteredClients = useMemo(() => clients.filter((client) =>
    [client.nombre, client.telefono, client.correo]
      .some((value) => String(value || "").toLowerCase().includes(searchTerm.toLowerCase())),
  ).sort((first, second) => String(first.nombre || first.usuario || "").localeCompare(
    String(second.nombre || second.usuario || ""),
    "es",
    { sensitivity: "base" },
  )), [clients, searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, Math.max(1, Math.ceil(filteredClients.length / PAGE_SIZE))));
  }, [filteredClients.length]);

  const paginatedClients = filteredClients.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const openEditDialog = (client) => {
    setEditingClient(client);
    setEditData({
      nombre: client.nombre || "",
      telefono: client.telefono || "",
      correo: client.correo || "",
      membresia: client.membresia || "",
      fechaInicio: client.fechaInicio || "",
      estadoPago: getClientPaymentStatus(client),
    });
    setError("");
    setFeedback("");
  };

  const handleEditChange = (event) => {
    const { name, value } = event.target;
    setEditData((currentData) => ({ ...currentData, [name]: value }));
  };

  const togglePasswordVisibility = (clientId) => {
    setVisiblePasswords((currentVisiblePasswords) => {
      const nextVisiblePasswords = new Set(currentVisiblePasswords);
      if (nextVisiblePasswords.has(clientId)) {
        nextVisiblePasswords.delete(clientId);
      } else {
        nextVisiblePasswords.add(clientId);
      }
      return nextVisiblePasswords;
    });
  };

  const handlePasswordVisibility = (client) => {
    if (client.contrasena) {
      togglePasswordVisibility(client.id);
      setFeedback("");
      return;
    }

    setFeedback("Este cliente no tiene una contraseña guardada en su registro de clientes.");
  };

  const handleUpdateClient = async (event) => {
    event.preventDefault();
    if (!editingClient) return;

    setIsSaving(true);
    setError("");
    try {
      await updateDoc(doc(db, "clientes", editingClient.id), editData);
      setEditingClient(null);
      setFeedback("Los datos del cliente se actualizaron.");
    } catch (updateError) {
      console.error("Error al actualizar el cliente:", updateError);
      setError("No se pudo actualizar el cliente. Revisa la conexión con Firebase.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClient = async (client) => {
    const confirmed = window.confirm(`¿Eliminar a ${client.nombre || "este cliente"}? Esta acción no se puede deshacer.`);
    if (!confirmed) return;

    setDeletingClientId(client.id);
    setError("");
    setFeedback("");
    try {
      await deleteDoc(doc(db, "clientes", client.id));
      setFeedback("El cliente se eliminó correctamente.");
    } catch (deleteError) {
      console.error("Error al eliminar el cliente:", deleteError);
      setError("No se pudo eliminar el cliente. Revisa la conexión con Firebase.");
    } finally {
      setDeletingClientId("");
    }
  };

  return (
    <div className="app">

      {/* =========================
          BARRA LATERAL
      ========================== */}
      <AdminSidebar />

      {/* =========================
          ÁREA PRINCIPAL
      ========================== */}
      <main className="main">

        {/* ENCABEZADO SUPERIOR */}
        <Encabezado title="Gestión de clientes" description="Administra los clientes del gimnasio" />

        {/* =========================
            CONTENIDO CLIENTES
        ========================== */}
        <section className="content">

          {/* BARRA DE BÚSQUEDA Y BOTÓN NUEVO */}
          <div className="clientsHeader">
            <div className="searchContainer">
              <Search size={18} className="searchIcon" />
              <input
                type="text"
                placeholder="Buscar cliente..."
                className="searchInput"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
            <button className="newButton" onClick={() => navigate("/nuevo-cliente")}>
              <Plus size={18} />
              <span>Nuevo</span>
            </button>
          </div>

          {/* TABLA DE CLIENTES */}
          <div className="clientsTableContainer">
            <div className="clientsTableHeading">
              <h3 className="tableTitle">Clientes registrados</h3>
              <span className="clientCount">{filteredClients.length} clientes</span>
            </div>
            <div className="tableWrapper">
              <table className="clientsTable">
                <thead>
                  <tr>
                    <th>Nombre completo</th>
                    <th>Teléfono</th>
                    <th>Correo</th>
                    <th>Usuario</th>
                    <th>Contraseña</th>
                    <th>Fecha de inscripción</th>
                    <th>Tipo de membresía</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.length > 0 ? (
                    paginatedClients.map((client) => (
                      <tr key={client.id}>
                        <td className="clientNameCell">{client.nombre || "-"}</td>
                        <td>{client.telefono || "-"}</td>
                        <td>{client.correo || "-"}</td>
                        <td>{client.usuario || "-"}</td>
                        <td>
                          {client.contrasena || client.uid || client.correo ? (
                            <div className="clientPasswordCell">
                              <span>{visiblePasswords.has(client.id) && client.contrasena ? client.contrasena : "••••••••"}</span>
                              <button
                                type="button"
                                className="passwordVisibilityButton"
                                onClick={() => handlePasswordVisibility(client)}
                                aria-label={visiblePasswords.has(client.id) && client.contrasena ? "Ocultar contraseña" : "Mostrar contraseña"}
                                title={client.contrasena ? (visiblePasswords.has(client.id) ? "Ocultar contraseña" : "Mostrar contraseña") : "Este registro no tiene una contraseña guardada"}
                              >
                                {visiblePasswords.has(client.id) && client.contrasena ? <EyeOff size={15} /> : <Eye size={15} />}
                              </button>
                            </div>
                          ) : "-"}
                        </td>
                        <td>{formatDate(client.fechaInscripcion || client.creadoEn || client.fechaRegistro)}</td>
                        <td>{formatMembership(client.membresia)}</td>
                        <td>
                          <span className={`paymentStatus ${getClientPaymentStatus(client)}`}>
                            {getClientPaymentStatus(client)}
                          </span>
                        </td>
                        <td>
                          <div className="clientActions">
                            <button
                              type="button"
                              className="clientActionButton editAction"
                              onClick={() => openEditDialog(client)}
                              aria-label={`Editar a ${client.nombre || "cliente"}`}
                              title="Editar cliente"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              type="button"
                              className="clientActionButton deleteAction"
                              onClick={() => handleDeleteClient(client)}
                              disabled={deletingClientId === client.id}
                              aria-label={`Eliminar a ${client.nombre || "cliente"}`}
                              title="Eliminar cliente"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr className="emptyRow">
                      <td colSpan="9" className="emptyCell">
                        {searchTerm ? "No se encontraron clientes" : "No hay clientes registrados"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pagination currentPage={currentPage} onPageChange={setCurrentPage} totalItems={filteredClients.length} />
            {error && <p className="clientsError">{error}</p>}
            {feedback && <p className="clientsFeedback" role="status">{feedback}</p>}
          </div>

        </section>

      </main>

      {editingClient && (
        <div className="clientDialogBackdrop">
          <section className="clientDialog" role="dialog" aria-modal="true" aria-labelledby="edit-client-title">
            <div className="clientDialogHeader">
              <div>
                <span className="dialogEyebrow">CLIENTES</span>
                <h2 id="edit-client-title">Editar cliente</h2>
              </div>
              <button
                type="button"
                className="dialogCloseButton"
                onClick={() => setEditingClient(null)}
                aria-label="Cerrar edición"
              >
                <X size={19} />
              </button>
            </div>

            <form className="clientEditForm" onSubmit={handleUpdateClient}>
              <div className="formGroup">
                <label className="formLabel" htmlFor="edit-client-name">Nombre completo</label>
                <input id="edit-client-name" name="nombre" className="formInput" value={editData.nombre} onChange={handleEditChange} required />
              </div>
              <div className="formRow">
                <div className="formGroup">
                  <label className="formLabel" htmlFor="edit-client-phone">Teléfono</label>
                  <input id="edit-client-phone" name="telefono" type="tel" className="formInput" value={editData.telefono} onChange={handleEditChange} />
                </div>
                <div className="formGroup">
                  <label className="formLabel" htmlFor="edit-client-email">Correo</label>
                  <input id="edit-client-email" name="correo" type="email" className="formInput" value={editData.correo} onChange={handleEditChange} />
                </div>
              </div>
              <div className="formRow">
                <div className="formGroup">
                  <label className="formLabel" htmlFor="edit-client-membership">Tipo de membresía</label>
                  <select id="edit-client-membership" name="membresia" className="formSelect" value={editData.membresia} onChange={handleEditChange} required>
                    <option value="">Seleccione membresía</option>
                    <option value="premium">Premium</option>
                    <option value="mensual">Mensual</option>
                    <option value="semanal">Semanal</option>
                    <option value="diaria">Diaria</option>
                  </select>
                </div>
                <div className="formGroup">
                  <label className="formLabel" htmlFor="edit-client-start">Fecha de inicio</label>
                  <input id="edit-client-start" name="fechaInicio" type="date" className="formInput" value={editData.fechaInicio} onChange={handleEditChange} />
                </div>
              </div>
              <div className="formGroup">
                <label className="formLabel" htmlFor="edit-client-status">Estado de pago</label>
                <select id="edit-client-status" name="estadoPago" className="formSelect" value={editData.estadoPago} onChange={handleEditChange}>
                  <option value="pagado">Pagado</option>
                  <option value="pendiente">Pendiente</option>
                  <option value="vencido">Vencido</option>
                </select>
              </div>
              {error && <p className="formError" role="alert">{error}</p>}
              <div className="clientDialogActions">
                <button type="button" className="cancelButton" onClick={() => setEditingClient(null)}>Cancelar</button>
                <button type="submit" className="saveButton" disabled={isSaving}>
                  <Save size={17} />
                  <span>{isSaving ? "Guardando..." : "Guardar cambios"}</span>
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}