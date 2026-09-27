import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, CreditCard, LogOut, UserRound } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "../assets/database/authcontext";
import { db } from "../assets/database/firebaseconfig";
import "../Styles/PortalCliente.css";

const formatDate = (value) => {
  if (!value) return "-";
  const date = value?.toDate ? value.toDate() : new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("es", { day: "2-digit", month: "long", year: "numeric" }).format(date);
};

export default function PortalCliente() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const loadClient = async () => {
      try {
        const userProfile = await getDoc(doc(db, "usuarios", user.uid));
        const clientId = userProfile.data()?.clienteId;
        if (!clientId) throw new Error("No se encontró el perfil del cliente.");

        const clientSnapshot = await getDoc(doc(db, "clientes", clientId));
        if (!clientSnapshot.exists()) throw new Error("No se encontró el perfil del cliente.");
        if (active) setClient(clientSnapshot.data());
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

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  return (
    <main className="clientPortal">
      <header className="clientPortalHeader">
        <img src="/logo-port-gym.png" alt="Port Gym" />
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

        {client && (
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
        )}
      </section>
    </main>
  );
}