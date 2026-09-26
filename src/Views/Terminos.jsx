import { useState } from "react";
import { useNavigate } from "react-router-dom";
import terminosImage from "../Imagen/terminos.png";
import "../Styles/Terminos.css";

const Terminos = () => {
  const [accepted, setAccepted] = useState(false);
  const navigate = useNavigate();

  const handleContinue = (event) => {
    event.preventDefault();
    if (accepted) {
      navigate("/home");
    }
  };

  return (
    <main className="terms-page">
      <section className="terms-card" aria-labelledby="terms-title">
        <img
          className="terms-banner"
          src={terminosImage}
          alt="Términos y condiciones de SportGYM"
        />

        <div className="terms-content">
          <div className="terms-copy" id="terms-title">
            <p>
              <strong>1. Aceptación de los términos</strong>
              <br />
              Al acceder y utilizar la plataforma de SportGYM, aceptas cumplir con los presentes
              Términos y Condiciones. Si no estás de acuerdo con alguno de ellos, no debes utilizar
              el servicio.
            </p>
            <p>
              <strong>2. Uso de la plataforma</strong>
              <br />
              La plataforma está diseñada para el uso exclusivo del personal administrativo y
              clientes del gimnasio. El acceso es personal e intransferible. No se permite el uso
              indebido, la suplantación de identidad ni la distribución de información sin
              autorización.
            </p>
            <p>
              <strong>3. Responsabilidad del usuario</strong>
              <br />
              El usuario se compromete a proporcionar información veraz y actualizada. SportGYM no
              se hace responsable por datos falsos o incompletos que puedan afectar el uso de los
              servicios.
            </p>
            <p>
              <strong>4. Privacidad y datos personales</strong>
              <br />
              La información personal será tratada de acuerdo con nuestra Política de Privacidad.
              <br />
              SportGYM se compromete a proteger tus datos y utilizarlos únicamente para fines
              relacionados con la gestión del gimnasio.
            </p>
            <p>
              <strong>5. Modificaciones</strong>
              <br />
              SportGYM se reserva el derecho de actualizar estos términos en cualquier momento.
              <br />
              Las modificaciones serán notificadas a través de la plataforma.
            </p>
            <p>
              <strong>6. Contacto</strong>
              <br />
              Si tienes dudas o consultas sobre estos términos, puedes comunicarte con el equipo
              administrativo del gimnasio.
            </p>
          </div>

          <form className="terms-actions" onSubmit={handleContinue}>
            <label className="terms-acceptance">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(event) => setAccepted(event.target.checked)}
              />
              <span>He leído y acepto los Términos y Condiciones de SportGYM.</span>
            </label>
            <button className="terms-continue" type="submit" disabled={!accepted}>
              Continuar
              <span aria-hidden="true">→</span>
            </button>
          </form>
        </div>
      </section>
    </main>
  );
};

export default Terminos;