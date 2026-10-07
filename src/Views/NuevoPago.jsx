import React, { useEffect, useState } from "react";
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
  ArrowLeft,
  CalendarDays,
  UserRound,
  Save,
  X,
} from "lucide-react";
import { collection, doc, onSnapshot, runTransaction, serverTimestamp } from "firebase/firestore";
import Encabezado from "../Components/Encabezado";
import { db } from "../assets/database/firebaseconfig.jsx";
import "../Styles/Home.css";
import "../Styles/NuevoPago.css";

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

const getLocalDateValue = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseDate = (value) => {
  if (!value) return null;
  if (value?.toDate) return value.toDate();
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const addDaysToDate = (value, days) => {
  const date = parseDate(value);
  const duration = Number(days);
  if (!date || !Number.isFinite(duration) || duration < 1) return "";
  date.setDate(date.getDate() + duration);
  return getLocalDateValue(date);
};

const formatDate = (value) => {
  const date = parseDate(value);
  return date
    ? new Intl.DateTimeFormat("es-NI", { day: "2-digit", month: "long", year: "numeric" }).format(date)
    : "-";
};

const normalize = (value) => String(value || "")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLocaleLowerCase();

const getClientName = (client) => [client.nombre, client.apellido].filter(Boolean).join(" ") || "Cliente sin nombre";

const getEmissionTime = (date) => new Intl.DateTimeFormat("es-NI", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
}).format(date);

export default function NuevoPago() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [clientQuery, setClientQuery] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [isClientListOpen, setIsClientListOpen] = useState(false);
  const [formData, setFormData] = useState({
    membresiaId: "",
    fechaPago: getLocalDateValue(),
    monto: "",
    metodoPago: "",
    notas: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [dataError, setDataError] = useState("");

  useEffect(() => {
    const unsubscribeClients = onSnapshot(
      collection(db, "clientes"),
      (snapshot) => setClients(snapshot.docs.map((client) => ({ id: client.id, ...client.data() }))),
      (snapshotError) => {
        console.error("Error al cargar los clientes:", snapshotError);
        setDataError("No se pudieron cargar los clientes.");
      },
    );
    const unsubscribeMemberships = onSnapshot(
      collection(db, "membresias"),
      (snapshot) => setMemberships(snapshot.docs.map((membership) => ({ id: membership.id, ...membership.data() }))),
      (snapshotError) => {
        console.error("Error al cargar las membresías:", snapshotError);
        setDataError("No se pudieron cargar las membresías.");
      },
    );

    return () => {
      unsubscribeClients();
      unsubscribeMemberships();
    };
  }, []);

  const selectedClient = clients.find((client) => client.id === selectedClientId);
  const selectedMembership = memberships.find((membership) => membership.id === formData.membresiaId);
  const expirationDate = selectedMembership
    ? addDaysToDate(formData.fechaPago, selectedMembership.duracion)
    : "";
  const filteredClients = clients.filter((client) =>
    normalize(`${getClientName(client)} ${client.telefono || ""} ${client.correo || ""}`)
      .includes(normalize(clientQuery.trim())),
  );

  const selectClient = (client) => {
    const matchingMembership = memberships.find((membership) =>
      normalize(membership.nombre) === normalize(client.membresia || client.tipoMembresia),
    );
    setSelectedClientId(client.id);
    setClientQuery("");
    setIsClientListOpen(false);
    setFormData((currentData) => ({
      ...currentData,
      membresiaId: matchingMembership?.id || "",
      monto: matchingMembership ? String(matchingMembership.precio ?? "") : "",
    }));
    setError("");
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((currentData) => {
      if (name === "membresiaId") {
        const membership = memberships.find((item) => item.id === value);
        return {
          ...currentData,
          membresiaId: value,
          monto: membership ? String(membership.precio ?? "") : "",
        };
      }
      return { ...currentData, [name]: value };
    });
    setError("");
  };

  const clearClient = () => {
    setSelectedClientId("");
    setClientQuery("");
    setFormData((currentData) => ({ ...currentData, membresiaId: "", monto: "" }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const client = clients.find((item) => item.id === selectedClientId);
    const membership = memberships.find((item) => item.id === formData.membresiaId);
    const amount = Number(formData.monto);
    if (!client || !membership || !expirationDate || !formData.fechaPago || !formData.metodoPago
      || !Number.isFinite(amount) || amount < 0) {
      setError("Completa los campos obligatorios con datos válidos.");
      return;
    }

    setIsSaving(true);
    try {
      const issuedAt = new Date();
      const paymentRef = doc(collection(db, "pagos"));
      const counterRef = doc(db, "contadores", "pagos");
      const clientRef = doc(db, "clientes", client.id);

      await runTransaction(db, async (transaction) => {
        const counterSnapshot = await transaction.get(counterRef);
        const nextNumber = Number(counterSnapshot.data()?.ultimoNumero || 0) + 1;
        const invoiceNumber = `PAY-${String(nextNumber).padStart(6, "0")}`;
        transaction.set(counterRef, {
          ultimoNumero: nextNumber,
          actualizadoEn: serverTimestamp(),
        }, { merge: true });
        transaction.set(paymentRef, {
          clienteId: client.id,
          nombreCliente: getClientName(client),
          membresiaId: membership.id,
          nombreMembresia: membership.nombre || "Membresía",
          monto: amount,
          fechaPago: formData.fechaPago,
          fechaVencimiento: expirationDate,
          metodoPago: formData.metodoPago,
          notas: formData.notas.trim(),
          numeroFactura: invoiceNumber,
          fechaEmision: getLocalDateValue(issuedAt),
          horaEmision: getEmissionTime(issuedAt),
          creadoEn: serverTimestamp(),
        });
        transaction.update(clientRef, {
          membresia: membership.nombre || "",
          estadoPago: "pagado",
          fechaInicio: formData.fechaPago,
          fechaVencimiento: expirationDate,
        });
      });

      navigate("/pagos", { state: { feedback: "El pago se registró correctamente." } });
    } catch (saveError) {
      console.error("Error al registrar el pago:", saveError);
      setError("No se pudo registrar el pago. Verifica la sesión y los permisos de administrador.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="logoContainer">
          <img src="/logo-port-gym.png" alt="Port Gym" className="logoImage" />
        </div>
        <nav className="menu">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.name}
                className={`menuItem ${item.name === "Pagos" ? "activeMenu" : ""} ${item.name === "Cerrar sesión" ? "logoutMenuItem" : ""}`}
                onClick={() => navigate(item.path)}
              >
                <Icon size={18} strokeWidth={2} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="main">
        <Encabezado title="Nuevo pago" description="Registra el pago de una membresía" />
        <section className="content">
          <button type="button" className="newPaymentBackButton" onClick={() => navigate("/pagos")}>
            <ArrowLeft size={17} />
            <span>Volver a pagos</span>
          </button>

          <div className="newPaymentContent">
            <div className="newPaymentHeading">
              <div>
                <span className="newPaymentEyebrow">REGISTRO DE PAGO</span>
                <h2>Información del pago</h2>
              </div>
              <span className="newPaymentRequired">* Campos obligatorios</span>
            </div>

            {dataError && <p className="newPaymentNotice newPaymentNoticeError" role="alert">{dataError}</p>}

            <form className="newPaymentForm" onSubmit={handleSubmit}>
              <section className="newPaymentSection">
                <h3 className="newPaymentSectionTitle"><UserRound size={17} /> Cliente y membresía</h3>
                <div className="newPaymentFields">
                  <div className="newPaymentGroup">
                    <label className="newPaymentLabel" htmlFor="payment-client-search">Cliente <span>*</span></label>
                    {selectedClient ? (
                      <div className="newPaymentSelectedClient">
                        <div>
                          <strong>{getClientName(selectedClient)}</strong>
                          <span>{selectedClient.telefono || selectedClient.correo || "Cliente seleccionado"}</span>
                        </div>
                        <button type="button" onClick={clearClient} aria-label="Cambiar cliente" title="Cambiar cliente">
                          <X size={17} />
                        </button>
                      </div>
                    ) : (
                      <div className="newPaymentClientSearch">
                        <Search size={17} aria-hidden="true" />
                        <input
                          id="payment-client-search"
                          type="search"
                          autoComplete="off"
                          value={clientQuery}
                          onChange={(event) => {
                            setClientQuery(event.target.value);
                            setIsClientListOpen(true);
                          }}
                          onFocus={() => setIsClientListOpen(true)}
                          placeholder="Buscar por nombre, teléfono o correo"
                          aria-expanded={isClientListOpen}
                          aria-controls="payment-client-options"
                          required={!selectedClient}
                        />
                        {isClientListOpen && (
                          <div className="newPaymentClientOptions" id="payment-client-options" role="listbox">
                            {filteredClients.length ? filteredClients.slice(0, 8).map((client) => (
                              <button
                                key={client.id}
                                type="button"
                                role="option"
                                aria-selected="false"
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => selectClient(client)}
                              >
                                <strong>{getClientName(client)}</strong>
                                <span>{client.telefono || client.correo || "Sin datos de contacto"}</span>
                              </button>
                            )) : (
                              <p>{clients.length ? "No se encontraron clientes." : "No hay clientes registrados."}</p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="newPaymentGroup">
                    <label className="newPaymentLabel" htmlFor="payment-membership">Membresía <span>*</span></label>
                    <select
                      id="payment-membership"
                      name="membresiaId"
                      className="newPaymentInput"
                      value={formData.membresiaId}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Selecciona una membresía</option>
                      {memberships.map((membership) => (
                        <option key={membership.id} value={membership.id}>
                          {membership.nombre} · {membership.duracion} días
                        </option>
                      ))}
                    </select>
                    {!memberships.length && <span className="newPaymentFieldHint">Registra una membresía antes de cobrar.</span>}
                  </div>
                </div>
              </section>

              <section className="newPaymentSection">
                <h3 className="newPaymentSectionTitle"><CalendarDays size={17} /> Periodo y pago</h3>
                <div className="newPaymentFields">
                  <label className="newPaymentGroup" htmlFor="payment-date">
                    <span className="newPaymentLabel">Fecha del pago <span>*</span></span>
                    <input
                      id="payment-date"
                      name="fechaPago"
                      type="date"
                      className="newPaymentInput"
                      value={formData.fechaPago}
                      onChange={handleChange}
                      required
                    />
                  </label>
                  <div className="newPaymentGroup">
                    <span className="newPaymentLabel">Fecha de vencimiento</span>
                    <div className={`newPaymentExpiration ${expirationDate ? "isCalculated" : ""}`} aria-live="polite">
                      <CalendarDays size={17} />
                      <strong>{expirationDate ? formatDate(expirationDate) : "Selecciona una membresía"}</strong>
                    </div>
                    {selectedMembership && <span className="newPaymentFieldHint">Periodo de {selectedMembership.duracion} días</span>}
                  </div>
                  <label className="newPaymentGroup" htmlFor="payment-amount">
                    <span className="newPaymentLabel">Monto (C$) <span>*</span></span>
                    <input
                      id="payment-amount"
                      name="monto"
                      type="number"
                      min="0"
                      step="0.01"
                      className="newPaymentInput"
                      value={formData.monto}
                      onChange={handleChange}
                      required
                    />
                  </label>
                  <label className="newPaymentGroup" htmlFor="payment-method">
                    <span className="newPaymentLabel">Método de pago <span>*</span></span>
                    <select
                      id="payment-method"
                      name="metodoPago"
                      className="newPaymentInput"
                      value={formData.metodoPago}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Selecciona un método</option>
                      <option value="Efectivo">Efectivo</option>
                      <option value="Transferencia">Transferencia</option>
                    </select>
                  </label>
                </div>
              </section>

              <section className="newPaymentSection newPaymentNotesSection">
                <label className="newPaymentGroup" htmlFor="payment-notes">
                  <span className="newPaymentLabel">Notas <span className="newPaymentOptional">Opcional</span></span>
                  <textarea
                    id="payment-notes"
                    name="notas"
                    className="newPaymentInput newPaymentTextarea"
                    rows={3}
                    maxLength={500}
                    placeholder="Agrega una nota para este pago"
                    value={formData.notas}
                    onChange={handleChange}
                  />
                </label>
              </section>

              {error && <p className="newPaymentNotice newPaymentNoticeError" role="alert">{error}</p>}

              <div className="newPaymentActions">
                <button type="button" className="newPaymentCancelButton" onClick={() => navigate("/pagos")}>
                  Cancelar
                </button>
                <button type="submit" className="newPaymentSaveButton" disabled={isSaving || !clients.length || !memberships.length}>
                  <Save size={17} />
                  <span>{isSaving ? "Registrando..." : "Registrar pago"}</span>
                </button>
              </div>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}