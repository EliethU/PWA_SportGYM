const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

initializeApp();

const db = getFirestore();
const auth = getAuth();

exports.registrarCliente = onCall(async (request) => {
  try {
    // ==========================================
    // 1. COMPROBAR QUE EL ADMIN ESTÁ AUTENTICADO
    // ==========================================

    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "Debes iniciar sesión como administrador."
      );
    }

    // ==========================================
    // 2. RECIBIR DATOS DESDE LA PWA
    // ==========================================

    const {
      nombre,
      apellido,
      telefono,
      fechaNacimiento,
      tipoMembresia,
      fechaInicio,
      fechaVencimiento,
    } = request.data;

    // ==========================================
    // 3. VALIDAR CAMPOS OBLIGATORIOS
    // ==========================================

    if (
      !nombre ||
      !apellido ||
      !telefono ||
      !tipoMembresia ||
      !fechaInicio ||
      !fechaVencimiento
    ) {
      throw new HttpsError(
        "invalid-argument",
        "Faltan datos obligatorios del cliente."
      );
    }

    // ==========================================
    // 4. GENERAR USERNAME
    // ==========================================

    const username = await generarUsername(nombre, apellido);

    // ==========================================
    // 5. GENERAR CONTRASEÑA TEMPORAL
    // ==========================================

    const password = generarPassword();

    // ==========================================
    // 6. CREAR USUARIO EN FIREBASE AUTHENTICATION
    // ==========================================

    const email = `${username}@sportgym.app`;

    const userRecord = await auth.createUser({
      email: email,
      password: password,
      displayName: `${nombre} ${apellido}`,
      disabled: false,
    });

    const uid = userRecord.uid;

    // ==========================================
    // 7. CREAR DOCUMENTO EN CLIENTES
    // ==========================================

    const clienteRef = await db.collection("clientes").add({
      uid: uid,
      username: username,

      nombre: nombre,
      apellido: apellido,
      telefono: telefono,

      fechaNacimiento: fechaNacimiento || null,

      fechaRegistro: FieldValue.serverTimestamp(),

      tipoMembresia: tipoMembresia,

      fechaInicio: fechaInicio,
      fechaVencimiento: fechaVencimiento,

      estado: "activo",
    });

    // ==========================================
    // 8. DEVOLVER INFORMACIÓN A LA PWA
    // ==========================================

    return {
      success: true,

      clienteId: clienteRef.id,

      uid: uid,

      username: username,

      password: password,

      email: email,

      mensaje: "Cliente registrado correctamente.",
    };

  } catch (error) {

    console.error("Error registrando cliente:", error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError(
      "internal",
      "No fue posible registrar el cliente."
    );
  }
});


// ======================================================
// GENERAR USERNAME
// ======================================================

async function generarUsername(nombre, apellido) {

  const nombreLimpio = limpiarTexto(nombre);
  const apellidoLimpio = limpiarTexto(apellido);

  let usernameBase = `${nombreLimpio}.${apellidoLimpio}`;

  let username = usernameBase;
  let contador = 1;

  while (true) {

    const snapshot = await db
      .collection("clientes")
      .where("username", "==", username)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return username;
    }

    username = `${usernameBase}${contador}`;

    contador++;
  }
}


// ======================================================
// LIMPIAR TEXTO
// ======================================================

function limpiarTexto(texto) {

  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}


// ======================================================
// GENERAR CONTRASEÑA TEMPORAL
// ======================================================

function generarPassword() {

  const caracteres =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";

  let password = "";

  for (let i = 0; i < 10; i++) {

    const posicion = Math.floor(
      Math.random() * caracteres.length
    );

    password += caracteres[posicion];
  }

  return password;
}