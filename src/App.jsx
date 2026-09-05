import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './Views/Login';
import Home from './Views/Home';
import Clientes from './Views/Clientes';
import NuevoCliente from './Views/NuevoCliente';
import Membresias from './Views/Membresias';
import Pagos from './Views/Pagos';
import Inventario from './Views/Inventario';
import Ventas from './Views/Ventas';
import Gastos from './Views/Gastos';
import RegistrarGasto from './Views/RegistrarGasto';
import Asistencia from './Views/Asistencia';
import Entrenamiento from './Views/Entrenamiento';
import Nutricion from './Views/Nutricion';
import Promociones from './Views/Promociones';
import Reportes from './Views/Reportes';
import Configuracion from './Views/Configuracion';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/home" element={<Home />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/nuevo-cliente" element={<NuevoCliente />} />
          <Route path="/membresias" element={<Membresias />} />
          <Route path="/pagos" element={<Pagos />} />
          <Route path="/inventario" element={<Inventario />} />
          <Route path="/ventas" element={<Ventas />} />
          <Route path="/gastos" element={<Gastos />} />
          <Route path="/registrar-gasto" element={<RegistrarGasto />} />
          <Route path="/asistencia" element={<Asistencia />} />
          <Route path="/entrenamiento" element={<Entrenamiento />} />
          <Route path="/nutricion" element={<Nutricion />} />
          <Route path="/promociones" element={<Promociones />} />
          <Route path="/reportes" element={<Reportes />} />
          <Route path="/configuracion" element={<Configuracion />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;