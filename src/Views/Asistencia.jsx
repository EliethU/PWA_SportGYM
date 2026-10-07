import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Check,
  Clock3,
  CreditCard,
  Download,
  FileText,
  Home as HomeIcon,
  LogOut,
  Maximize2,
  Package,
  Printer,
  QrCode,
  Receipt,
  Search,
  ShoppingCart,
  Users,
  Wallet,
} from "lucide-react";
import QRCode from "qrcode";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../assets/database/firebaseconfig";
import { subscribeToAttendances } from "../services/asistenciasService";
import Encabezado from "../Components/Encabezado";
import "../Styles/Home.css";
import "../Styles/Asistencia.css";

const TZ = "America/Managua";
const menuItems = [
  { name: "Inicio", icon: HomeIcon, path: "/home" },
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

const getDateKey = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
};

const getPreviousDateKey = (dateKey) => {
  const [year, month, day] = dateKey.split("-").map(Number);
  return getDateKey(new Date(Date.UTC(year, month - 1, day - 1, 18)));
};

const formatDate = (dateKey) => new Intl.DateTimeFormat("es-NI", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: TZ,
}).format(new Date(`${dateKey}T12:00:00-06:00`));

const formatTime = (attendance) => {
  const date = attendance.creadoEn?.toDate?.();
  if (date) {
    return new Intl.DateTimeFormat("es-NI", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: TZ,
    }).format(date);
  }
  return attendance.hora || "—";
};

const getInitials = (name = "") => name
  .trim()
  .split(/\s+/)
  .slice(0, 2)
  .map((part) => part[0] || "")
  .join("")
  .toUpperCase();

const csvValue = (value) => {
  const safeValue = /^[=+\-@\t\r]/.test(String(value ?? "")) ? `'${value}` : String(value ?? "");
  return `"${safeValue.replaceAll('"', '""')}"`;
};

const hourSlots = Array.from({ length: 15 }, (_, index) => index + 6);

export default function Asistencia() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(getDateKey);
  const [attendances, setAttendances] = useState([]);
  const [previousCount, setPreviousCount] = useState(0);
  const [clients, setClients] = useState([]);
  const [isClientsLoading, setIsClientsLoading] = useState(true);
  const [qrData, setQrData] = useState("");
  const qrUrl = useMemo(() => {
    const appUrl = (import.meta.env.VITE_APP_URL || window.location.origin).replace(/\/+$/, "");
    return `${appUrl}/cliente?registrarAsistencia=1`;
  }, []);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const unsubscribeToday = subscribeToAttendances(
      selectedDate,
      (records) => {
        setAttendances(records);
        setIsLoading(false);
      },
      (loadError) => {
        console.error("No se pudieron cargar las asistencias:", loadError);
        setError("No se pudieron cargar las asistencias. Revisa tus permisos y conexión.");
        setIsLoading(false);
      },
    );
    const unsubscribeYesterday = subscribeToAttendances(
      getPreviousDateKey(selectedDate),
      (records) => setPreviousCount(records.length),
      (loadError) => {
        console.error("No se pudieron cargar las asistencias del día anterior:", loadError);
      },
    );
    const unsubscribeClients = onSnapshot(
      collection(db, "clientes"),
      (snapshot) => {
        setClients(snapshot.docs.map((client) => ({ id: client.id, ...client.data() })));
        setIsClientsLoading(false);
      },
      (loadError) => {
        console.error("No se pudo cargar el total de clientes:", loadError);
        setError("No se pudieron cargar los datos de clientes. Revisa tus permisos y conexión.");
        setIsClientsLoading(false);
      },
    );

    return () => {
      unsubscribeToday();
      unsubscribeYesterday();
      unsubscribeClients();
    };
  }, [selectedDate]);

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(qrUrl, {
      width: 280,
      margin: 2,
      errorCorrectionLevel: "H",
      color: { dark: "#111827", light: "#FFFFFF" },
    }).then((dataUrl) => {
      if (active) setQrData(dataUrl);
    }).catch((qrError) => {
      console.error("No se pudo generar el código QR permanente:", qrError);
      if (active) setError("No se pudo generar el código QR.");
    });
    return () => {
      active = false;
    };
  }, [qrUrl]);

  const sortedAttendances = useMemo(
    () => [...attendances].sort((first, second) => String(first.hora || "").localeCompare(String(second.hora || ""))),
    [attendances],
  );
  const filteredAttendances = useMemo(() => {
    const value = search.trim().toLocaleLowerCase();
    if (!value) return sortedAttendances;
    return sortedAttendances.filter((attendance) =>
      [attendance.nombre, attendance.usuario, attendance.clienteId, attendance.uid]
        .some((field) => String(field || "").toLocaleLowerCase().includes(value)),
    );
  }, [search, sortedAttendances]);
  const recentAttendances = [...sortedAttendances].reverse().slice(0, 4);
  const activeClients = clients.filter((client) =>
    String(client.estado || "").toLocaleLowerCase() === "activo",
  ).length;
  const firstAttendance = sortedAttendances[0];
  const lastAttendance = sortedAttendances.at(-1);
  const hourlyCounts = hourSlots.map((hour) => ({
    hour,
    count: sortedAttendances.filter((attendance) => Number(String(attendance.hora || "").slice(0, 2)) === hour).length,
  }));
  const maxHourlyCount = Math.max(1, ...hourlyCounts.map(({ count }) => count));
  const comparison = previousCount
    ? `${Math.round(((attendances.length - previousCount) / previousCount) * 100)}%`
    : attendances.length ? "Nuevo" : "0%";

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(qrUrl);
      setNotice("Enlace permanente copiado.");
    } catch (copyError) {
      console.error("No se pudo copiar el enlace de asistencia:", copyError);
      setNotice("No se pudo copiar el enlace. Comprueba los permisos del navegador.");
    }
  };

  const handleDownloadQr = () => {
    if (!qrData) return;
    const download = document.createElement("a");
    download.href = qrData;
    download.download = "codigo-qr-asistencia.png";
    download.click();
  };

  const handleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch (fullscreenError) {
      console.error("No se pudo cambiar a pantalla completa:", fullscreenError);
      setNotice("El navegador no permitió activar la pantalla completa.");
    }
  };

  const handleExport = () => {
    const lines = [
      ["Hora", "Cliente", "ID cliente", "Usuario", "Membresía", "UID"],
      ...sortedAttendances.map((attendance) => [
        attendance.hora,
        attendance.nombre,
        attendance.clienteId,
        attendance.usuario,
        attendance.membresia,
        attendance.uid,
      ]),
    ];
    const csv = `\uFEFF${lines.map((line) => line.map(csvValue).join(",")).join("\r\n")}`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const download = document.createElement("a");
    download.href = url;
    download.download = `asistencias-${selectedDate}.csv`;
    download.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
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
                type="button"
                className={`menuItem ${item.name === "Asistencia" ? "activeMenu" : ""} ${item.name === "Cerrar sesión" ? "logoutMenuItem" : ""}`}
                onClick={() => navigate(item.path)}
              >
                <Icon size={18} strokeWidth={2} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="main attendanceMain">
        <Encabezado title="Control de asistencia" description="Registra y consulta las visitas de tus clientes." />
        <section className="attendancePage">
          <header className="attendanceHeading attendance-no-print">
            <div className="attendanceTitle">
              <span className="attendanceTitleIcon"><CalendarDays size={21} /></span>
              <div>
                <h1>Control de asistencia</h1>
                <p>El QR es permanente; cada cliente se identifica con su cuenta.</p>
              </div>
            </div>
            <label className="attendanceDatePicker">
              <CalendarDays size={17} />
              <span className="sr-only">Fecha de asistencias</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(event) => {
                  if (!event.target.value) return;
                  setIsLoading(true);
                  setError("");
                  setSelectedDate(event.target.value);
                }}
              />
            </label>
          </header>

          {error && <div className="attendanceAlert" role="alert">{error}</div>}
          {notice && <div className="attendanceNotice" role="status">{notice}</div>}

          <div className="attendanceTopGrid">
            <section className="attendancePanel attendanceQrPanel">
              <div className="attendanceSectionHeading">
                <span className="attendanceSectionIcon"><QrCode size={19} /></span>
                <div>
                  <h2>Código QR de asistencia</h2>
                  <p>Enlace fijo para todos tus clientes</p>
                </div>
                <span className="attendancePermanent"><i /> Permanente</span>
              </div>

              <div className="attendanceQrFrame">
                {qrData
                  ? <img src={qrData} alt="Código QR permanente para registrar asistencia" />
                  : <div className="attendanceQrLoading">Generando código QR...</div>}
              </div>

              <p className="attendanceQrHint">El cliente debe iniciar sesión en la app para registrar su visita.</p>
              <div className="attendanceQrActions attendance-no-print">
                <button type="button" className="attendanceButton attendanceButtonPrimary" onClick={handleCopyLink}>
                  <Check size={16} /> Copiar enlace
                </button>
                <button type="button" className="attendanceButton" onClick={handleDownloadQr} disabled={!qrData}>
                  <Download size={16} /> Descargar
                </button>
                <button type="button" className="attendanceButton" onClick={() => window.print()}>
                  <Printer size={16} /> Imprimir
                </button>
                <button type="button" className="attendanceButton" onClick={() => void handleFullscreen()}>
                  <Maximize2 size={16} /> Pantalla completa
                </button>
              </div>
              <div className="attendanceQrInfo">
                <span><Clock3 size={17} /></span>
                <p><strong>Sin vencimiento ni rotación.</strong> Conserva este código impreso en la entrada del gimnasio.</p>
              </div>
            </section>

            <div className="attendanceRightColumn">
              <section className="attendanceStatsGrid">
                <article className="attendanceStatCard attendanceStatGreen">
                  <span className="attendanceStatIcon"><Users size={19} /></span>
                  <div><p>Asistencias del día</p><strong>{isLoading ? "—" : attendances.length}</strong><small>{comparison} vs. día anterior</small></div>
                </article>
                <article className="attendanceStatCard attendanceStatBlue">
                  <span className="attendanceStatIcon"><Users size={19} /></span>
                  <div><p>Miembros activos</p><strong>{isClientsLoading ? "—" : activeClients}</strong><small>de {isClientsLoading ? "—" : clients.length} clientes</small></div>
                </article>
                <article className="attendanceStatCard attendanceStatAmber">
                  <span className="attendanceStatIcon"><Clock3 size={19} /></span>
                  <div><p>Primera asistencia</p><strong>{firstAttendance ? formatTime(firstAttendance) : "—"}</strong><small>{firstAttendance?.nombre || "Sin registros"}</small></div>
                </article>
                <article className="attendanceStatCard attendanceStatRose">
                  <span className="attendanceStatIcon"><Clock3 size={19} /></span>
                  <div><p>Última asistencia</p><strong>{lastAttendance ? formatTime(lastAttendance) : "—"}</strong><small>{lastAttendance?.nombre || "Sin registros"}</small></div>
                </article>
              </section>

              <section className="attendancePanel attendanceTablePanel">
                <div className="attendanceTableHeading">
                  <div className="attendanceSectionHeading">
                    <span className="attendanceSectionIcon"><CalendarDays size={18} /></span>
                    <div>
                      <h2>Asistencias del {selectedDate === getDateKey() ? "día" : "día seleccionado"}</h2>
                      <p>{formatDate(selectedDate)}</p>
                    </div>
                  </div>
                  <div className="attendanceTableTools attendance-no-print">
                    <label className="attendanceSearch">
                      <Search size={16} />
                      <input
                        type="search"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Buscar cliente o código..."
                        aria-label="Buscar por cliente, usuario o código"
                      />
                    </label>
                    <button type="button" className="attendanceExport" onClick={handleExport}>
                      <Download size={16} /> Exportar
                    </button>
                  </div>
                </div>
                <div className="attendanceTableScroll">
                  <table className="attendanceTable">
                    <thead><tr><th>#</th><th>Hora</th><th>Cliente</th><th>ID</th><th>Membresía</th><th>Estado</th></tr></thead>
                    <tbody>
                      {filteredAttendances.map((attendance, index) => {
                        const membershipStatus = String(attendance.estadoMembresia || "").toLocaleLowerCase();
                        const membershipClass = membershipStatus.includes("venc") || membershipStatus.includes("pend")
                          ? "attendanceMembershipWarning"
                          : "attendanceMembershipActive";
                        return (
                          <tr key={attendance.id}>
                            <td>{index + 1}</td>
                            <td>{formatTime(attendance)}</td>
                            <td><span className="attendanceClientCell"><span className="attendanceAvatar">{getInitials(attendance.nombre)}</span><strong>{attendance.nombre || "Cliente"}</strong></span></td>
                            <td>{attendance.clienteId || "—"}</td>
                            <td><span className={`attendanceMembership ${membershipClass}`}>{attendance.membresia || "Sin membresía"}</span></td>
                            <td><span className="attendanceRegistered"><i /> Registrada</span></td>
                          </tr>
                        );
                      })}
                      {!isLoading && filteredAttendances.length === 0 && (
                        <tr><td colSpan="6" className="attendanceEmpty">{search ? "No hay resultados para esta búsqueda." : "Todavía no hay asistencias para esta fecha."}</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {isLoading && <p className="attendanceLoading">Cargando asistencias...</p>}
              </section>
            </div>
          </div>

          <div className="attendanceBottomGrid">
            <section className="attendancePanel attendanceChartPanel">
              <div className="attendanceBottomHeading">
                <div className="attendanceSectionHeading">
                  <span className="attendanceChartIcon"><Clock3 size={18} /></span>
                  <div><h2>Asistencias por hora</h2><p>Distribución de visitas del día</p></div>
                </div>
                <span className="attendanceTodayTag">{selectedDate === getDateKey() ? "Hoy" : "Histórico"}</span>
              </div>
              <div className="attendanceChart" role="img" aria-label="Gráfico de asistencias registradas por hora">
                {hourlyCounts.map(({ hour, count }) => (
                  <div className="attendanceChartColumn" key={hour} title={`${hour}:00 — ${count} asistencias`}>
                    <span className="attendanceChartCount">{count || ""}</span>
                    <div className="attendanceChartTrack">
                      <div className="attendanceChartBar" style={{ height: `${Math.max(count ? 8 : 0, (count / maxHourlyCount) * 100)}%` }} />
                    </div>
                    <span className="attendanceChartLabel">{hour >= 12 ? `${hour === 12 ? 12 : hour - 12} p. m.` : `${hour} a. m.`}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="attendancePanel attendanceRecentPanel">
              <div className="attendanceBottomHeading">
                <div className="attendanceSectionHeading">
                  <span className="attendanceSectionIcon"><Check size={18} /></span>
                  <div><h2>Últimas asistencias registradas</h2><p>Actividad más reciente</p></div>
                </div>
                <span className="attendanceRecentCount">{recentAttendances.length}</span>
              </div>
              <div className="attendanceRecentList">
                {recentAttendances.map((attendance) => (
                  <div className="attendanceRecentItem" key={attendance.id}>
                    <span className="attendanceAvatar">{getInitials(attendance.nombre)}</span>
                    <strong>{attendance.nombre || "Cliente"}</strong>
                    <span className="attendanceRecentId">ID: {attendance.clienteId || "—"}</span>
                    <time>{formatTime(attendance)}</time>
                    <span className="attendanceRegistered"><i /> Registrada</span>
                  </div>
                ))}
                {!recentAttendances.length && <p className="attendanceEmpty">No hay asistencias recientes.</p>}
              </div>
            </section>
          </div>
        </section>
      </main>
    </div>
  );
}
