import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  CalendarDays,
  Camera,
  CheckCircle2,
  Clock3,
  CreditCard,
  LogOut,
  QrCode,
  UserRound,
  X,
} from "lucide-react";
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

const getManaguaDateKey = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Managua",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
};

const isAttendanceQrCode = (value) => {
  try {
    const url = new URL(value);
    return url.pathname.replace(/\/+$/, "") === "/cliente/registrar-asistencia"
      || url.searchParams.get("registrarAsistencia") === "1";
  } catch {
    return false;
  }
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
  const [currentAttendances, setCurrentAttendances] = useState([]);
  const [isAttendanceLoading, setIsAttendanceLoading] = useState(true);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerError, setScannerError] = useState("");
  const automaticAttendanceAttempted = useRef(false);
  const scannerHandledCode = useRef(false);

  const recordAttendance = useCallback(async () => {
    setAttendanceError("");
    setAttendanceMessage("");
    setIsRegisteringAttendance(true);
    try {
      const result = await registerClientAttendance(client, user.uid);
      setCurrentAttendances((previous) => {
        const attendanceDateKey = result.dateKey || getManaguaDateKey();
        const attendanceId = `${attendanceDateKey}_${client.id}_qr`;
        const currentQrAttendance = previous.find((attendance) => attendance.id === attendanceId);
        return [
          ...previous.filter((attendance) => attendance.id !== attendanceId),
          {
            ...currentQrAttendance,
            id: attendanceId,
            fechaClave: attendanceDateKey,
            hora: result.hora,
            membresia: String(client.membresia || client.tipoMembresia || "").trim(),
            registroQr: true,
            tipoRegistro: "QR",
          },
        ];
      });
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
    if (!isScannerOpen || !client) return undefined;

    let active = true;
    let scanner;
    const startScanner = async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (!active) return;
        scanner = new Html5Qrcode("client-attendance-qr-reader", { verbose: false });
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          async (decodedText) => {
            if (!active || scannerHandledCode.current) return;
            if (!isAttendanceQrCode(decodedText)) {
              setScannerError("Este no es el código QR de asistencia del gimnasio.");
              return;
            }

            scannerHandledCode.current = true;
            try {
              await scanner.stop();
              scanner.clear();
            } catch (stopError) {
              console.error("No se pudo detener la cámara después del escaneo:", stopError);
            }
            if (!active) return;
            setIsScannerOpen(false);
            await recordAttendance();
          },
          () => {},
        );
        if (!active && scanner.isScanning) await scanner.stop();
      } catch (scannerStartError) {
        console.error("No se pudo iniciar el lector QR:", scannerStartError);
        if (active) {
          setScannerError(
            scannerStartError?.name === "NotAllowedError"
              ? "Permite el acceso a la cámara en el navegador e inténtalo de nuevo."
              : "No se pudo abrir la cámara. Usa una conexión segura y revisa sus permisos.",
          );
        }
      }
    };

    startScanner();
    return () => {
      active = false;
      if (scanner?.isScanning) {
        scanner.stop()
          .then(() => scanner.clear())
          .catch((stopError) => console.error("No se pudo cerrar el lector QR:", stopError));
      }
    };
  }, [client, isScannerOpen, recordAttendance]);

  useEffect(() => {
    let active = true;

    const loadClient = async () => {
      try {
        const userProfile = await getDoc(doc(db, "usuarios", user.uid));
        const clientId = userProfile.data()?.clienteId;
        if (!clientId) throw new Error("No se encontró el perfil del cliente.");

        const clientSnapshot = await getDoc(doc(db, "clientes", clientId));
        if (!clientSnapshot.exists()) throw new Error("No se encontró el perfil del cliente.");
        const loadedClient = { ...clientSnapshot.data(), id: clientSnapshot.id };
        if (active) setClient(loadedClient);

        const dateKey = getManaguaDateKey();
        const attendanceReferences = [
          { reference: doc(db, "asistencias", `${dateKey}_${loadedClient.id}`), tipoRegistro: "Manual" },
          { reference: doc(db, "asistencias", `${dateKey}_${loadedClient.id}_qr`), tipoRegistro: "QR" },
          ...(loadedClient.uid && loadedClient.uid !== loadedClient.id
            ? [{ reference: doc(db, "asistencias", `${dateKey}_${loadedClient.uid}`), tipoRegistro: "Manual" }]
            : []),
        ];
        try {
          const attendanceSnapshots = await Promise.all(
            attendanceReferences.map(({ reference }) => getDoc(reference)),
          );
          if (active) {
            const loadedAttendances = attendanceSnapshots.flatMap((snapshot, index) => {
              if (!snapshot.exists()) return [];
              const attendance = snapshot.data();
              if (attendance.fechaClave !== dateKey || !attendance.hora) return [];
              return [{
                ...attendance,
                id: snapshot.id,
                membresia: attendance.membresia
                  || loadedClient.membresia
                  || loadedClient.tipoMembresia
                  || "",
                tipoRegistro: attendance.registroQr
                  ? "QR"
                  : attendanceReferences[index].tipoRegistro,
              }];
            });
            setCurrentAttendances(loadedAttendances);
          }
        } catch (attendanceLoadError) {
          console.error("No se pudo cargar la asistencia actual del cliente:", attendanceLoadError);
          if (active) {
            setAttendanceError("No se pudo consultar la asistencia de hoy. Revisa tu conexión e inténtalo de nuevo.");
          }
        } finally {
          if (active) setIsAttendanceLoading(false);
        }
      } catch (loadError) {
        console.error("Error al cargar el perfil del cliente:", loadError);
        if (active) setError("No se pudo cargar tu información. Contacta al administrador.");
      } finally {
        if (active) {
          setIsLoading(false);
          setIsAttendanceLoading(false);
        }
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
              <p>Escanea el código QR del gimnasio para registrar tu visita y guardar la hora.</p>
            </div>
            <div className="clientAttendanceActions">
              <button
                type="button"
                className="clientAttendanceButton"
                onClick={() => {
                  scannerHandledCode.current = false;
                  setScannerError("");
                  setIsScannerOpen(true);
                }}
                disabled={isRegisteringAttendance || isScannerOpen}
              >
                <Camera size={18} />
                {isScannerOpen ? "Cámara activa..." : "Escanear código QR"}
              </button>
              <button
                type="button"
                className="clientAttendanceButton clientAttendanceButtonSecondary"
                onClick={() => void recordAttendance()}
                disabled={isRegisteringAttendance || isScannerOpen}
              >
                <CheckCircle2 size={18} />
                {isRegisteringAttendance ? "Registrando..." : "Registrar sin escanear"}
              </button>
            </div>
          </section>
          {isScannerOpen && (
            <section className="clientQrScanner" aria-label="Lector QR de asistencia">
              <div className="clientQrScannerHeading">
                <div>
                  <h2>Escanea el código del gimnasio</h2>
                  <p>Apunta la cámara al QR de asistencia.</p>
                </div>
                <button
                  type="button"
                  className="clientQrScannerClose"
                  aria-label="Cerrar cámara"
                  onClick={() => setIsScannerOpen(false)}
                >
                  <X size={20} />
                </button>
              </div>
              <div id="client-attendance-qr-reader" />
              {scannerError && <p className="clientPortalError" role="alert">{scannerError}</p>}
            </section>
          )}
          <section className="clientCurrentAttendance" aria-label="Asistencia actual">
            <div className="clientCurrentAttendanceHeading">
              <Clock3 size={19} />
              <div>
                <h2>Asistencia de hoy</h2>
                <p>{new Intl.DateTimeFormat("es-NI", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  timeZone: "America/Managua",
                }).format(new Date(`${getManaguaDateKey()}T12:00:00-06:00`))}</p>
              </div>
            </div>
            {isAttendanceLoading ? (
              <p className="clientCurrentAttendanceEmpty">Consultando tus registros...</p>
            ) : currentAttendances.length ? (
              <div className="clientCurrentAttendanceList">
                {currentAttendances.map((attendance) => (
                  <div className="clientCurrentAttendanceItem" key={attendance.id}>
                    <span className="clientCurrentAttendanceType">
                      {attendance.tipoRegistro === "QR" ? <QrCode size={16} /> : <UserRound size={16} />}
                      {attendance.tipoRegistro}
                    </span>
                    <div className="clientCurrentAttendanceDetails">
                      <strong>{attendance.hora}</strong>
                      <span>{attendance.membresia || "Sin membresía"}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="clientCurrentAttendanceEmpty">Todavía no tienes asistencias registradas hoy.</p>
            )}
          </section>
          <CambioContrasenaForm />
          </>
        )}
      </section>
    </main>
  );
}