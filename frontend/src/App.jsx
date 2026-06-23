import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import DashboardLayout from "./components/DashboardLayout";
import HojasRuta from "./pages/HojasRuta";
import UsuariosAdmin from "./pages/UsuariosAdmin";
import ClientesPage from "./pages/ClientesPage";
import VehiculosPage from "./pages/VehiculosPage";
import ChoferDashboard from "./components/ChoferDashboard";
import Login from "./pages/Login";
import Pedidos from "./pages/Pedidos";

function App() {
  // Guardamos el usuario logueado en un estado de React.
  const [usuario, setUsuario] = useState(() => {
    // Intentamos recuperar la sesión al inicializar para evitar deslogueos al refrescar (F5)
    const sesionGuardada = localStorage.getItem("usuario_sesion");
    return sesionGuardada ? JSON.parse(sesionGuardada) : null;
  });

  const handleLoginSuccess = (usuarioSimulado) => {
    setUsuario(usuarioSimulado);
    localStorage.setItem("usuario_sesion", JSON.stringify(usuarioSimulado));
  };

  const handleLogout = () => {
    setUsuario(null);
    localStorage.removeItem("usuario_sesion");
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* RUTA DE LOGIN (Si no está logueado, cualquier URL renderiza esto) */}
        {!usuario ? (
          <Route
            path="*"
            element={<Login onLoginSuccess={handleLoginSuccess} />}
          />
        ) : (
          /* CONTENEDOR PRINCIPAL CON EL SIDEBAR */
          <Route
            element={
              <DashboardLayout usuario={usuario} onLogout={handleLogout} />
            }
          >
            {/* Redirección inicial por defecto hacia las hojas de ruta */}
            <Route
              index
              element={
                usuario?.id_rol === 3 ? (
                  <Navigate to="/viaje" replace />
                ) : (
                  <Navigate to="/rutas" replace />
                )
              }
            />

            {/* Panel dinámico de Hojas de Ruta según el Rol (Chofer vs Operador/Admin) */}
            <Route path="/rutas" element={<HojasRuta usuario={usuario} />} />

            <Route
              path="/viaje"
              element={<ChoferDashboard usuario={usuario} />}
            />

            {/* Administración de Colaboradores y Accesos */}
            <Route
              path="/usuarios"
              element={<UsuariosAdmin usuario={usuario} />}
            />

            {/* Órdenes y Carga de Pedidos */}
            <Route path="/pedidos" element={<Pedidos usuario={usuario} />} />

            {/* Control de Cuentas Corrientes y Clientes (Protegido para Admin) */}
            <Route
              path="/clientes"
              element={
                usuario.id_rol === 1 ? (
                  <ClientesPage usuario={usuario} />
                ) : (
                  <Navigate to="/rutas" replace />
                )
              }
            />

            {/* Inventario Técnico de la Flota (Protegido para Admin) */}
            <Route
              path="/vehiculos"
              element={
                usuario.id_rol === 1 ? (
                  <VehiculosPage usuario={usuario} />
                ) : (
                  <Navigate to="/rutas" replace />
                )
              }
            />

            {/* Comodín para redirigir cualquier ruta inexistente estando logueado */}
            <Route path="*" element={<Navigate to="/rutas" replace />} />
          </Route>
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
