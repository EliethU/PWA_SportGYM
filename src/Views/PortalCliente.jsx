import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { CalendarDays, CheckCircle2, CreditCard, LogOut, UserRound } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "../assets/database/authcontext";
import { db } from "../assets/database/firebaseconfig";
import CambioContrasenaForm from "../Components/CambioContrasenaForm";
import logoPortGym from "../Imagen/logo-port-gym.png.png";
import { registerClientAttendance } from "../services/asistenciasService";
import "../Styles/PortalCliente.css";

const formatDate = (value) => {
  if (!value) return "-";
  const date = value?.toDate ? value.toDate() : new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("es", { day: "2-digit", month: "long", year: "numeric" }).format(date);
};

export default function PortalCliente() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [client, setClient] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [attendanceMessage, setAttendanceMessage] = useState("");
  const [attendanceError, setAttendanceError] = useState("");
  const [isRegisteringAttendance, setIsRegisteringAttendance] = useState(false);
  const automaticAttendanceAttempted = useRef(false);

  const recordAttendance = useCallback(async () => {
    setAttendanceError("");
    setAttendanceMessage("");
    setIsRegisteringAttendance(true);
    try {
      const result = await registerClientAttendance(client, user.uid);
      setAttendanceMessage(result.alreadyRegistered
        ? `Tu asistencia de hoy ya estaba registrada (${result.hora}).`
        : `Asistencia registrada correctamente a las ${result.hora}.`);
      return true;
    } catch (attendanceRequestError) {
      console.error("No se pudo registrar la asistencia del cliente:", attendanceRequestError);
      const errorCode = typeof attendanceRequestError?.code === "string"
        ? attendanceRequestError.code.split("/").pop()
        : "";
      const errorMessages = {
        "unauthenticated": "Tu sesión no está activa. Inicia sesión con la cuenta del cliente y vuelve a escanear el QR.",
        "permission-denied": "Esta cuenta no puede registrar asistencia. Verifica que su perfil tenga una membresía pagada y vigente.",
        "failed-precondition": "No se encontró un perfil de cliente válido vinculado a esta cuenta.",
        "unavailable": "No hay conexión con Firebase. Revisa internet e inténtalo de nuevo.",
      };
      setAttendanceError(
        errorMessages[errorCode]
          || attendanceRequestError.message
          || "No se pudo registrar tu asistencia. Inténtalo de nuevo.",
      );
      return false;
    } finally {
      setIsRegisteringAttendance(false);
    }
  }, [client, user.uid]);

  useEffect(() => {
    let active = true;

    const loadClient = async () => {
      try {
        const userProfile = await getDoc(doc(db, "usuarios", user.uid));
        const clientId = userProfile.data()?.clienteId;
        if (!clientId) throw new Error("No se encontró el perfil del cliente.");

        const clientSnapshot = await getDoc(doc(db, "clientes", clientId));
        if (!clientSnapshot.exists()) throw new Error("No se encontró el perfil del cliente.");
        if (active) setClient({ ...clientSnapshot.data(), id: clientSnapshot.id });
      } catch (loadError) {
        console.error("Error al cargar el perfil del cliente:", loadError);
        if (active) setError("No se pudo cargar tu información. Contacta al administrador.");
      } finally {
        if (active) setIsLoading(false);
      }
    };

    loadClient();
    return () => {
      active = false;
    };
  }, [user.uid]);

  useEffect(() => {
    const isQrAttendanceRequest = location.pathname === "/cliente/registrar-asistencia"
      || searchParams.get("registrarAsistencia") === "1";
    if (!client || !isQrAttendanceRequest || automaticAttendanceAttempted.current) return;
    automaticAttendanceAttempted.current = true;
    recordAttendance().then((registered) => {
      if (registered) navigate("/cliente", { replace: true });
    });
  }, [client, location.pathname, navigate, recordAttendance, searchParams]);

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  return (
    <main className="clientPortal">
      <header className="clientPortalHeader">
        <img src={logoPortGym} alt="Port Gym" />
        <button type="button" className="clientPortalLogout" onClick={handleLogout}>
          <LogOut size={17} />
          <span>Cerrar sesión</span>
        </button>
      </header>

      <section className="clientPortalContent">
        <p className="clientPortalEyebrow">MI CUENTA</p>
        <h1>Hola, {client?.nombre || user.displayName || "cliente"}</h1>
        <p className="clientPortalIntro">Consulta los datos de tu membresía.</p>

        {isLoading && <p className="clientPortalMessage">Cargando tu información...</p>}
        {error && <p className="clientPortalError" role="alert">{error}</p>}
        {attendanceMessage && <p className="clientPortalAttendanceSuccess" role="status">{attendanceMessage}</p>}
        {attendanceError && <p className="clientPortalError" role="alert">{attendanceError}</p>}

        {client && (
          <>
          <section className="clientMembershipPanel" aria-label="Información de membresía">
            <div className="clientMembershipHeader">
              <div className="clientMembershipIcon"><CreditCard size={20} /></div>
              <div>
                <span>Membresía</span>
                <h2>{client.membresia || "Sin membresía"}</h2>
              </div>
              <span className={`clientPortalStatus ${String(client.estadoPago || "pendiente").toLowerCase()}`}>
                {client.estadoPago || "pendiente"}
              </span>
            </div>

            <div className="clientMembershipDetails">
              <div>
                <CalendarDays size={17} />
                <span>Fecha de inicio</span>
                <strong>{formatDate(client.fechaInicio)}</strong>
              </div>
              <div>
                <UserRound size={17} />
                <span>Correo de acceso</span>
                <strong>{client.correo || user.email}</strong>
              </div>
            </div>
          </section>
          <section className="clientAttendancePanel" aria-label="Registrar asistencia">
            <div>
              <h2>Asistencia al gimnasio</h2>
                  <p>Registra tu visita con tu cuenta. Si ya fue anotada manualmente, el escaneo del QR agrega tu registro.</p>
            </div>
            <button
              type="button"
              className="clientAttendanceButton"
              onClick={() => void recordAttendance()}
              disabled={isRegisteringAttendance}
            >
              <CheckCircle2 size={18} />
              {isRegisteringAttendance ? "Registrando..." : "Registrar asistencia"}
            </button>
          </section>
          <CambioContrasenaForm />
          </>
        )}
      </section>
    </main>
  );
}