import React, { useEffect, useState } from "react";
import { QrCode } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { addDoc, arrayUnion, collection, deleteDoc, doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
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
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
} from "lucide-react";
import Encabezado from "../Components/Encabezado";
import { db } from "../assets/database/firebaseconfig.jsx";
import "../Styles/Home.css";
import "../Styles/Membresias.css";

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
  { name: "Cerrar sesión", icon: LogOut, path: "/" },
];

const normalizeMembershipName = (name) => String(name || "").trim().toLocaleLowerCase();

const getMembershipNames = (membership) => [
  membership.nombre,
  ...(Array.isArray(membership.nombresAnteriores) ? membership.nombresAnteriores : []),
].map(normalizeMembershipName);

const countEnrolledClients = (membership, clients) => {
  const names = getMembershipNames(membership);
  return clients.filter((client) =>
    [client.membresia, client.tipoMembresia]
      .some((name) => names.includes(normalizeMembershipName(name))),
  ).length;
};

const formatPrice = (price) =>
  new Intl.NumberFormat("es-NI", { style: "currency", currency: "NIO" }).format(Number(price) || 0);

export default function Membresias() {
  const navigate = useNavigate();
  const [memberships, setMemberships] = useState([]);
  const [clients, setClients] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMembership, setEditingMembership] = useState(null);
  const [formData, setFormData] = useState({ nombre: "", precio: "", duracion: "" });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    const unsubscribeMemberships = onSnapshot(
      collection(db, "membresias"),
      (snapshot) => setMemberships(snapshot.docs.map((membership) => ({ ...membership.data(), id: membership.id }))),
      (snapshotError) => {
        console.error("Error al cargar las membresías:", snapshotError);
        setError("No se pudieron cargar las membresías. Revisa la conexión con Firebase.");
      },
    );
    const unsubscribeClients = onSnapshot(
      collection(db, "clientes"),
      (snapshot) => setClients(snapshot.docs.map((client) => ({ id: client.id, ...client.data() }))),
      (snapshotError) => {
        console.error("Error al cargar los clientes:", snapshotError);
        setError("No se pudo calcular cuántos clientes tienen cada membresía.");
      },
    );

    return () => {
      unsubscribeMemberships();
      unsubscribeClients();
    };
  }, []);

  const openMembershipForm = (membership = null) => {
    setEditingMembership(membership);
    setFormData({
      nombre: membership?.nombre || "",
      precio: membership?.precio ?? "",
      duracion: membership?.duracion ?? "",
    });
    setError("");
    setFeedback("");
    setIsFormOpen(true);
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormData((currentData) => ({ ...currentData, [name]: value }));
  };

  const handleSaveMembership = async (event) => {
    event.preventDefault();
    setError("");
    const membershipData = {
      nombre: formData.nombre.trim(),
      precio: Number(formData.precio),
      duracion: Number(formData.duracion),
    };
    const duplicateName = memberships.some((membership) =>
      membership.id !== editingMembership?.id
      && getMembershipNames(membership).includes(normalizeMembershipName(membershipData.nombre)),
    );
    if (duplicateName) {
      setError("Ya existe una membresía con ese nombre.");
      return;
    }

    setIsSaving(true);

    try {
      if (editingMembership) {
        const membershipRef = doc(db, "membresias", editingMembership.id);
        const oldName = normalizeMembershipName(editingMembership.nombre);
        const newName = normalizeMembershipName(membershipData.nombre);
        const membershipUpdates = { ...membershipData };
        if (oldName !== newName) {
          membershipUpdates.nombresAnteriores = arrayUnion(editingMembership.nombre.trim());
        }
        await setDoc(membershipRef, membershipUpdates, { merge: true });
      } else {
        await addDoc(collection(db, "membresias"), {
          ...membershipData,
          creadoEn: serverTimestamp(),
        });
      }
      setIsFormOpen(false);
      setEditingMembership(null);
      setFeedback(editingMembership ? "La membresía se actualizó correctamente." : "La membresía se registró correctamente.");
    } catch (saveError) {
      console.error("Error al guardar la membresía:", saveError);
      setError(saveError.code
        ? `No se pudo guardar la membresía (${saveError.code}). Verifica la sesión y los permisos de administrador.`
        : "No se pudo guardar la membresía. Revisa la conexión con Firebase.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteMembership = async (membership) => {
    const enrolled = countEnrolledClients(membership, clients);
    const enrollmentNote = enrolled
      ? ` Hay ${enrolled} cliente(s) con este nombre; sus registros de cliente no se eliminarán.`
      : "";
    if (!window.confirm(`¿Eliminar la membresía ${membership.nombre}? Esta acción no se puede deshacer.${enrollmentNote}`)) return;

    setError("");
    setFeedback("");
    try {
      await deleteDoc(doc(db, "membresias", membership.id));
      setFeedback("La membresía se eliminó correctamente.");
    } catch (deleteError) {
      console.error("Error al eliminar la membresía:", deleteError);
      setError("No se pudo eliminar la membresía. Revisa la conexión con Firebase.");
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
                className={`menuItem ${item.name === "Membresías" ? 'activeMenu' : ''} ${item.name === "Cerrar sesión" ? "logoutMenuItem" : ""}`}
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
        <Encabezado title="Membresías" description="Gestiona las membresías del gimnasio" />

        {/* =========================
            CONTENIDO MEMBRESÍAS
        ========================== */}
        <section className="content">
          <div className="membresiasHeader">
            <button className="newMembershipButton" onClick={() => openMembershipForm()}>
              <Plus size={18} />
              <span>Nueva membresía</span>
            </button>
          </div>

          {error && <p className="membershipNotice membershipNoticeError" role="alert">{error}</p>}
          {feedback && <p className="membershipNotice membershipNoticeSuccess" role="status">{feedback}</p>}

          {/* TABLA DE MEMBRESÍAS */}
          <div className="membresiasTableContainer">
            <h3 className="tableTitle">Membresías registradas</h3>
            <div className="tableWrapper">
              <table className="membresiasTable">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Precio</th>
                    <th>Duración</th>
                    <th>Inscritos</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {memberships.length ? memberships.map((membership) => {
                    const enrolled = countEnrolledClients(membership, clients);
                    return (
                      <tr key={membership.id}>
                        <td className="membershipNameCell">{membership.nombre}</td>
                        <td>{formatPrice(membership.precio)}</td>
                        <td>{membership.duracion} días</td>
                        <td>{enrolled}</td>
                        <td>
                          <div className="membershipActions">
                            <button type="button" className="membershipActionButton membershipEditButton" onClick={() => openMembershipForm(membership)} title="Editar membresía" aria-label={`Editar ${membership.nombre}`}>
                              <Pencil size={17} />
                            </button>
                            <button type="button" className="membershipActionButton membershipDeleteButton" onClick={() => handleDeleteMembership(membership)} title="Eliminar membresía" aria-label={`Eliminar ${membership.nombre}`}>
                              <Trash2 size={17} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr className="emptyRow">
                      <td colSpan="5" className="emptyCell">No hay membresías registradas</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </section>

      </main>

      {isFormOpen && (
        <div className="membershipDialogBackdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setIsFormOpen(false);
        }}>
          <section className="membershipDialog" role="dialog" aria-modal="true" aria-labelledby="membership-dialog-title">
            <div className="membershipDialogHeader">
              <div>
                <span className="membershipDialogEyebrow">MEMBRESÍAS</span>
                <h2 id="membership-dialog-title">{editingMembership ? "Editar membresía" : "Nueva membresía"}</h2>
              </div>
              <button type="button" className="membershipCloseButton" onClick={() => setIsFormOpen(false)} aria-label="Cerrar">
                <X size={19} />
              </button>
            </div>
            <form className="membershipForm" onSubmit={handleSaveMembership}>
              <label className="membershipFormGroup" htmlFor="membership-name">
                <span>Nombre</span>
                <input id="membership-name" name="nombre" value={formData.nombre} onChange={handleFormChange} maxLength={80} required autoFocus />
              </label>
              <div className="membershipFormRow">
                <label className="membershipFormGroup" htmlFor="membership-price">
                  <span>Precio</span>
                  <input id="membership-price" name="precio" type="number" min="0" step="0.01" value={formData.precio} onChange={handleFormChange} required />
                </label>
                <label className="membershipFormGroup" htmlFor="membership-duration">
                  <span>Duración (días)</span>
                  <input id="membership-duration" name="duracion" type="number" min="1" step="1" value={formData.duracion} onChange={handleFormChange} required />
                </label>
              </div>
              {error && <p className="membershipNotice membershipNoticeError" role="alert">{error}</p>}
              <div className="membershipDialogActions">
                <button type="button" className="membershipCancelButton" onClick={() => setIsFormOpen(false)}>Cancelar</button>
                <button type="submit" className="membershipSaveButton" disabled={isSaving}>
                  <Save size={17} />
                  <span>{isSaving ? "Guardando..." : "Guardar"}</span>
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}