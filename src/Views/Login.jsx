import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../Styles/Login.css";
import "bootstrap-icons/font/bootstrap-icons.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validación de credenciales inventadas
    if (email === "sportgym26@gmail.com" && password === "123456") {
      // Login exitoso - redirigir al Home
      navigate("/home");
    } else {
      // Credenciales incorrectas
      setError("Usuario o contraseña incorrectos");
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

            {/* USUARIO */}
            <div className="input-group">
              <span className="input-icon">
                <i className="bi bi-person"></i>
              </span>

              <input
                type="email"
                placeholder="Usuario"
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
            <button type="submit" className="login-button">
              Iniciar sesión
              <span>→</span>
            </button>

          </form>

        </div>


        {/* LADO DERECHO */}
        <div className="login-image">

          <div className="image-background"></div>

          <img
            src="/login-gym.png"
            alt="Port Gym"
            className="gym-image"
          />

        </div>

      </div>

    </div>
  );
};

export default Login;
