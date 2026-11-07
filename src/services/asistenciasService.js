import { getFunctions, httpsCallable } from "firebase/functions";
import {
  collection,
  doc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { appfirebase, db } from "../assets/database/firebaseconfig";

const functions = getFunctions(appfirebase);
const MANAGUA_TIME_ZONE = "America/Managua";
const normalizeStatus = (value) => String(value || "")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLocaleLowerCase();

const getManaguaAttendanceTime = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: MANAGUA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return {
    dateKey: `${values.year}-${values.month}-${values.day}`,
    hora: `${values.hour}:${values.minute}`,
  };
};

const getDateKeyInManagua = (date) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: MANAGUA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
};

const getMembershipExpirationDateKey = (value) => {
  if (!value) return null;
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const date = typeof value?.toDate === "function"
    ? value.toDate()
    : value instanceof Date
      ? value
      : new Date(value);
  return Number.isNaN(date.getTime()) ? "" : getDateKeyInManagua(date);
};

export const isClientMembershipActive = (client, now = new Date()) => {
  const membership = String(client?.membresia || client?.tipoMembresia || "").trim();
  const paymentStatus = normalizeStatus(
    client?.estadoPago || client?.pagoEstado || client?.estadoTransaccion,
  );
  const clientStatus = normalizeStatus(client?.estado);
  const expirationValue = client?.fechaVencimiento || client?.fechaFin || client?.fechaExpiracion;
  const expirationDateKey = getMembershipExpirationDateKey(expirationValue);
  const activePaymentStatus = ["activa", "activo", "pagad", "paid", "vigente"];

  return Boolean(
    membership
      && activePaymentStatus.some((status) => paymentStatus.includes(status))
      && !["inactiv", "suspendid"].some((status) => clientStatus.includes(status))
      && expirationDateKey !== ""
      && (!expirationDateKey || expirationDateKey >= getDateKeyInManagua(now)),
  );
};

export const subscribeToAttendances = (onAttendances, onError) => onSnapshot(
  collection(db, "asistencias"),
  (snapshot) => onAttendances(snapshot.docs.map((attendance) => ({
    ...attendance.data(),
    id: attendance.id,
  }))),
  onError,
);

export const registerClientAttendance = async () => {
  const registerAttendance = httpsCallable(functions, "registrarAsistencia");
  const response = await registerAttendance();
  return response.data;
};

export const registerManualAttendance = async (client) => {
  const clientId = typeof client?.id === "string" ? client.id.trim() : "";
  if (!clientId || clientId.length > 128 || clientId.includes("/")) {
    throw new Error("Selecciona un cliente válido.");
  }
  if (!isClientMembershipActive(client)) {
    throw new Error("Solo se puede registrar asistencia a clientes con membresía activa.");
  }

  const uid = typeof client.uid === "string" && !client.uid.includes("/") ? client.uid : "";
  const { dateKey, hora } = getManaguaAttendanceTime();
  const attendanceCollection = collection(db, "asistencias");
  const attendanceReference = doc(attendanceCollection, `${dateKey}_${clientId}`);
  const legacyAttendanceReference = uid
    ? doc(attendanceCollection, `${dateKey}_${uid}`)
    : null;

  return runTransaction(db, async (transaction) => {
    const existingAttendance = await transaction.get(attendanceReference);
    const legacyAttendance = legacyAttendanceReference
      && legacyAttendanceReference.path !== attendanceReference.path
      ? await transaction.get(legacyAttendanceReference)
      : null;
    const previousAttendance = existingAttendance.exists()
      ? existingAttendance
      : legacyAttendance?.exists()
        ? legacyAttendance
        : null;

    if (previousAttendance) {
      return { alreadyRegistered: true, hora: previousAttendance.data()?.hora || "—", dateKey };
    }

    transaction.set(attendanceReference, {
      uid,
      clienteId: clientId,
      nombre: String(client.nombre || "").trim(),
      usuario: String(client.usuario || client.username || "").trim(),
      membresia: String(client.membresia || client.tipoMembresia || "").trim(),
      estadoMembresia: String(client.estadoPago || client.estado || "Activa").trim(),
      fechaClave: dateKey,
      hora,
      registroManual: true,
      creadoEn: serverTimestamp(),
    });

    return { alreadyRegistered: false, hora, dateKey };
  });
};
