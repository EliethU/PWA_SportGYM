import React from "react";
import { ChevronDown } from "lucide-react";
import "../Styles/Home.css";

const Encabezado = ({ title = "Inicio", description = "Panel administrativo" }) => {
  return (
    <header className="header">

      <div>
        <h2 className="pageTitle">{title}</h2>
        <p className="pageDescription">
          {description}
        </p>
      </div>

      {/* USUARIO */}
      <button className="userButton">
        <div className="avatar">
          A
        </div>

        <div className="userInfo">
          <strong>Administrador</strong>
          <span>Administrador</span>
        </div>

        <ChevronDown size={17} />
      </button>

    </header>
  );
};

export default Encabezado;
