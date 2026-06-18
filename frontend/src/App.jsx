import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import DashboardLayout from "./components/DashboardLayout";
import HojasRuta from "./pages/HojasRuta";
import UsuariosAdmin from "./pages/UsuariosAdmin";
import ClientesPage from "./pages/ClientesPage";
import VehiculosPage from "./pages/VehiculosPage";
import ChoferDashboard from "./components/ChoferDashboard";
import Login from "./pages/Login";
import Pedidos from "./pages/Pedidos";

function App() {
  // Guardamos el usuario logueado en un estado de React. Arranca deslogueado (null)
  const [usuario, setUsuario] = useState(null);

  const handleLoginSuccess = (usuarioSimulado) => {
    setUsuario(usuarioSimulado);
  };

  const handleLogout = () => {
    setUsuario(null);
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
          <Route
            element={
              <DashboardLayout usuario={usuario} onLogout={handleLogout} />
            }
          >
            <Route path="/" element={<Navigate to="/rutas" replace />} />

            {/* Le pasamos el usuario logueado a la pantalla de rutas */}
            <Route
              path="/rutas"
              element={
                Number(usuario?.id_rol) === 3 ? (
                  <ChoferDashboard usuario={usuario} />
                ) : (
                  <HojasRuta usuario={usuario} />
                )
              }
            />
            <Route
              path="/usuarios"
              element={<UsuariosAdmin usuario={usuario} />}
            />
            <Route path="/pedidos" element={<Pedidos usuario={usuario} />} />
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
          </Route>
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
