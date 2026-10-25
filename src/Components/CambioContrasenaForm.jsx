import React, { useState } from "react";
import { reauthenticateWithCredential, EmailAuthProvider, updatePassword } from "firebase/auth";
import { Shield } from "lucide-react";
import { auth } from "../assets/database/firebaseconfig";
import "../Styles/Configuracion.css";

export default function CambioContrasenaForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [isChanging, setIsChanging] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");

    if (newPassword.length < 6) {
      setMessageType("error");
      setMessage("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessageType("error");
      setMessage("La confirmación no coincide con la nueva contraseña.");
      return;
    }

    const user = auth.currentUser;
    if (!user?.email) {
      setMessageType("error");
      setMessage("No se encontró una sesión con correo y contraseña. Inicia sesión de nuevo.");
      return;
    }

    setIsChanging(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessageType("success");
      setMessage("Tu contraseña se cambió correctamente.");
    } catch (error) {
      console.error("No se pudo cambiar la contraseña:", error);
      const messages = {
        "auth/invalid-credential": "La contraseña actual no es correcta.",
        "auth/wrong-password": "La contraseña actual no es correcta.",
        "auth/weak-password": "La nueva contraseña debe tener al menos 6 caracteres.",
        "auth/requires-recent-login": "Por seguridad, cierra sesión e inicia sesión de nuevo antes de cambiar la contraseña.",
        "auth/network-request-failed": "No se pudo conectar con Firebase. Revisa tu conexión.",
        "auth/too-many-requests": "Demasiados intentos. Inténtalo de nuevo más tarde.",
        "auth/operation-not-allowed": "El cambio de contraseña no está habilitado para este tipo de cuenta.",
      };
      setMessageType("error");
      setMessage(messages[error.code] || "No se pudo cambiar la contraseña. Inténtalo de nuevo.");
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <section className="configSection" aria-labelledby="change-password-title">
      <div className="configSectionHeader">
        <Shield size={20} className="sectionIcon" />
        <h3 id="change-password-title" className="configSectionTitle">Cambiar contraseña</h3>
      </div>

      <form className="configForm" onSubmit={handleSubmit}>
        <p className="changePasswordDescription">
          Confirma tu contraseña actual para establecer una nueva.
        </p>

        <div className="formGroup">
          <label className="formLabel" htmlFor="current-password">Contraseña actual</label>
          <input
            id="current-password"
            type="password"
            className="formInput"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            required
          />
        </div>

        <div className="formRow">
          <div className="formGroup">
            <label className="formLabel" htmlFor="new-password">Nueva contraseña</label>
            <input
              id="new-password"
              type="password"
              className="formInput"
              autoComplete="new-password"
              minLength={6}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              required
            />
          </div>

          <div className="formGroup">
            <label className="formLabel" htmlFor="confirm-password">Confirmar contraseña</label>
            <input
              id="confirm-password"
              type="password"
              className="formInput"
              autoComplete="new-password"
              minLength={6}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
            />
          </div>
        </div>

        {message && (
          <p className={`changePasswordMessage ${messageType}`} role={messageType === "error" ? "alert" : "status"}>
            {message}
          </p>
        )}

        <div className="configActions">
          <button type="submit" className="saveButton" disabled={isChanging}>
            <span>{isChanging ? "Cambiando..." : "Cambiar contraseña"}</span>
          </button>
        </div>
      </form>
    </section>
  );
}
