const crypto = require("node:crypto");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

initializeApp();

const db = getFirestore();
const auth = getAuth();

exports.registrarCliente = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Debes iniciar sesión como administrador.");
  }

  const adminProfile = await db.collection("usuarios").doc(request.auth.uid).get();
  if (!adminProfile.exists || adminProfile.data().rol !== "admin") {
    throw new HttpsError("permission-denied", "Solo el administrador puede registrar clientes.");
  }

  const { nombre, telefono, correo, membresia, fechaInicio, notas = "" } = request.data || {};
  const email = String(correo || "").trim().toLowerCase();

  if (!nombre?.trim() || !email || !/^\S+@\S+\.\S+$/.test(email) || !membresia || !fechaInicio) {
    throw new HttpsError("invalid-argument", "Completa el nombre, correo, membresía y fecha de inicio.");
  }

  const usernameBase = createUsernameBase(nombre);
  if (!usernameBase) {
    throw new HttpsError("invalid-argument", "El nombre no permite generar un usuario.");
  }

  const usuario = await getAvailableUsername(usernameBase);
  const contrasenaTemporal = crypto.randomBytes(18).toString("base64url");
  let userRecord;

  try {
    userRecord = await auth.createUser({
      email,
      password: contrasenaTemporal,
      displayName: nombre.trim(),
      disabled: false,
    });

    const clienteRef = db.collection("clientes").doc();
    const batch = db.batch();
    batch.set(clienteRef, {
      uid: userRecord.uid,
      nombre: nombre.trim(),
      telefono: String(telefono || "").trim(),
      correo: email,
      usuario,
      membresia,
      fechaInicio,
      notas: String(notas).trim(),
      estado: "Activo",
      estadoPago: "pendiente",
      creadoEn: FieldValue.serverTimestamp(),
    });
    batch.set(db.collection("usuarios").doc(userRecord.uid), {
      uid: userRecord.uid,
      email,
      rol: "cliente",
      clienteId: clienteRef.id,
      creadoEn: FieldValue.serverTimestamp(),
    });
    await batch.commit();

    return {
      clienteId: clienteRef.id,
      uid: userRecord.uid,
      usuario,
      correo: email,
      contrasenaTemporal,
    };
  } catch (error) {
    if (userRecord) {
      await auth.deleteUser(userRecord.uid).catch((cleanupError) => {
        console.error("No se pudo limpiar la cuenta Auth incompleta:", cleanupError);
      });
    }

    if (error.code === "auth/email-already-exists") {
      throw new HttpsError("already-exists", "Ya existe una cuenta con ese correo.");
    }

    if (error instanceof HttpsError) throw error;

    console.error("Error registrando cliente:", error);
    throw new HttpsError("internal", "No fue posible registrar el cliente.");
  }
});

function getManaguaDateKey(date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Managua",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function getManaguaTime(date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Managua",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.hour}:${values.minute}`;
}

exports.registrarAsistencia = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Inicia sesión para registrar tu asistencia.");
  }

  try {
    const uid = request.auth.uid;
    const profileSnapshot = await db.collection("usuarios").doc(uid).get();
    const profile = profileSnapshot.data();
    if (!profileSnapshot.exists || profile?.rol !== "cliente" || typeof profile.clienteId !== "string") {
      throw new HttpsError("permission-denied", "Solo una cuenta de cliente puede registrar asistencia.");
    }

    const clientSnapshot = await db.collection("clientes").doc(profile.clienteId).get();
    const client = clientSnapshot.data();
    if (!clientSnapshot.exists || client?.uid !== uid) {
      throw new HttpsError("failed-precondition", "No se encontró un perfil de cliente válido.");
    }

    const now = new Date();
    const dateKey = getManaguaDateKey(now);
    const hora = getManaguaTime(now);
    const attendanceRef = db.collection("asistencias").doc(`${dateKey}_${uid}`);
    return await db.runTransaction(async (transaction) => {
      const existingAttendance = await transaction.get(attendanceRef);
      if (existingAttendance.exists) {
        return { alreadyRegistered: true, hora: existingAttendance.data().hora, dateKey };
      }

      transaction.create(attendanceRef, {
        uid,
        clienteId: profile.clienteId,
        nombre: String(client.nombre || "").trim(),
        usuario: String(client.usuario || client.username || "").trim(),
        membresia: String(client.membresia || client.tipoMembresia || "").trim(),
        estadoMembresia: String(client.estadoPago || client.estado || "Activa").trim(),
        fechaClave: dateKey,
        hora,
        creadoEn: FieldValue.serverTimestamp(),
      });
      return { alreadyRegistered: false, hora, dateKey };
    });
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    console.error("Error registrando asistencia:", error);
    throw new HttpsError("internal", "No fue posible registrar la asistencia.");
  }
});

function createUsernameBase(name) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

async function getAvailableUsername(usernameBase) {
  let username = usernameBase;
  let suffix = 2;

  while (true) {
    const snapshot = await db.collection("clientes").where("usuario", "==", username).limit(1).get();
    if (snapshot.empty) return username;
    username = `${usernameBase} ${suffix}`;
    suffix += 1;
  }
}