import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './assets/database/authcontext';
import Login from './Views/Login';
import Home from './Views/Home';
import Clientes from './Views/Clientes';
import PortalCliente from './Views/PortalCliente';
import NuevoCliente from './Views/NuevoCliente';
import Membresias from './Views/Membresias';
import Pagos from './Views/Pagos';
import Inventario from './Views/Inventario';
import Ventas from './Views/Ventas';
import Gastos from './Views/Gastos';
import RegistrarGasto from './Views/RegistrarGasto';
import Reportes from './Views/Reportes';
import Configuracion from './Views/Configuracion';
import Terminos from './Views/Terminos';
import './App.css';

function ProtectedRoute({ requiredRole }) {
  const { user, role, isLoading } = useAuth();

  if (isLoading) return <div className="authLoading">Cargando...</div>;
  if (!user) return <Navigate to="/" replace />;
  if (role !== requiredRole) {
    return <Navigate to={role === 'cliente' ? '/cliente' : role === 'admin' ? '/home' : '/'} replace />;
  }
  return <Outlet />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<Login />} />
            <Route element={<ProtectedRoute requiredRole="cliente" />}>
              <Route path="/cliente" element={<PortalCliente />} />
            </Route>
            <Route element={<ProtectedRoute requiredRole="admin" />}>
              <Route path="/terminos" element={<Terminos />} />
              <Route path="/home" element={<Home />} />
              <Route path="/clientes" element={<Clientes />} />
              <Route path="/nuevo-cliente" element={<NuevoCliente />} />
              <Route path="/membresias" element={<Membresias />} />
              <Route path="/pagos" element={<Pagos />} />
              <Route path="/inventario" element={<Inventario />} />
              <Route path="/ventas" element={<Ventas />} />
              <Route path="/gastos" element={<Gastos />} />
              <Route path="/registrar-gasto" element={<RegistrarGasto />} />
              <Route path="/reportes" element={<Reportes />} />
              <Route path="/configuracion" element={<Configuracion />} />
            </Route>
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;