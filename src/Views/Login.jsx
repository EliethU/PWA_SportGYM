import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../assets/database/firebaseconfig";
import inicioImage from "../Imagen/inicio.jpg";
import "../Styles/Login.css";
import "bootstrap-icons/font/bootstrap-icons.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSigningIn(true);

    try {
      const { user } = await signInWithEmailAndPassword(auth, email.trim(), password);

      let profile;
      try {
        profile = await getDoc(doc(db, "usuarios", user.uid));
      } catch (profileError) {
        console.error("No se pudo leer el perfil de acceso:", profileError);
        await signOut(auth);
        setError("Firebase Authentication aceptó la cuenta, pero Firestore no permitió leer su perfil. Revisa las reglas de Firestore.");
        return;
      }

      if (!profile.exists()) {
        await signOut(auth);
        setError(`La cuenta existe en Authentication, pero falta el perfil usuarios/${user.uid} con su rol.`);
        return;
      }

      const role = profile.exists() ? profile.data().rol : null;

      if (role === "admin") {
        navigate("/terminos");
      } else if (role === "cliente") {
        navigate("/cliente");
      } else {
        await signOut(auth);
        setError("La cuenta no tiene un perfil de acceso válido. Contacta al administrador.");
      }
    } catch (signInError) {
      console.error("Error al iniciar sesión:", signInError);
      const messages = {
        "auth/invalid-credential": "Correo/contraseña incorrectos o la cuenta aún no existe en Firebase Authentication.",
        "auth/user-not-found": "La cuenta aún no existe en Firebase Authentication.",
        "auth/wrong-password": "La contraseña no coincide con la cuenta.",
        "auth/operation-not-allowed": "El proveedor Correo/contraseña no está habilitado en Firebase Authentication.",
        "auth/too-many-requests": "Demasiados intentos. Inténtalo de nuevo más tarde.",
        "auth/network-request-failed": "No se pudo conectar con Firebase. Revisa tu conexión.",
      };
      setError(messages[signInError.code] || "No se pudo iniciar sesión. Revisa la configuración de Firebase Authentication.");
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="login-page">

      <div className="login-container">

        {/* LADO IZQUIERDO */}
        <div className="login-form">

          {/* LOGO */}
          <img
            src="/logo-port-gym.png"
            alt="Port Gym"
            className="login-logo"
          />

          <h1>Iniciar sesión</h1>

          <p className="login-subtitle">
            Ingresa a tu cuenta para continuar
          </p>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit}>

            {/* CORREO */}
            <div className="input-group">
              <span className="input-icon">
                <i className="bi bi-person"></i>
              </span>

              <input
                type="email"
                placeholder="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* CONTRASEÑA */}
            <div className="input-group">
              <span className="input-icon">
                <i className="bi bi-lock"></i>
              </span>

              <input
                type={showPassword ? "text" : "password"}
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                <i className={showPassword ? "bi bi-eye" : "bi bi-eye-slash"}></i>
              </button>
            </div>

            {/* BOTÓN */}
            <button type="submit" className="login-button" disabled={isSigningIn}>
              {isSigningIn ? "Ingresando..." : "Iniciar sesión"}
              <span>→</span>
            </button>

          </form>

        </div>


        {/* LADO DERECHO */}
        <div className="login-image">

          <div className="image-background"></div>

          <img
            src={inicioImage}
            alt="Port Gym"
            className="gym-image"
          />

        </div>

      </div>

    </div>
  );
};

export default Login;
