import { Outlet, Link, useLocation } from "react-router-dom";

export default function DashboardLayout({ usuario }) {
  const location = useLocation();

  // Condición para saber si el usuario actual es un chofer
  const esChofer = usuario?.id_rol === 3;

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans antialiased">
      {/* SIDEBAR FIXED */}
      <aside className="w-64 bg-slate-900 text-slate-200 flex flex-col justify-between border-r border-slate-800 shrink-0">
        <div>
          <div className="h-16 flex items-center px-6 border-b border-slate-800 space-x-3">
            <span className="text-lg font-bold text-white">
              Logística <span className="text-blue-500">Ágil</span>
            </span>
          </div>

          <nav className="p-4 space-y-1.5">
            {/* VISTA EXCLUSIVA PARA EL CHOFER */}
            {esChofer ? (
              <Link
                to="/rutas" // O la ruta que le hayas asignado al ChoferDashboard en tus rutas
                className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  location.pathname === "/rutas"
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-slate-400 hover:bg-slate-800"
                }`}
              >
                <span>🚚</span> <span>Mi Viaje Activo</span>
              </Link>
            ) : (
              /* VISTAS PARA ADMINISTRADORES / OPERADORES */
              <>
                {/* HOJAS DE RUTA */}
                <Link
                  to="/rutas"
                  className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    location.pathname === "/rutas"
                      ? "bg-blue-600 text-white shadow-md"
                      : "text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  <span>📋</span> <span>Hojas de Ruta</span>
                </Link>

                {/* GESTIÓN DE PEDIDOS */}
                <Link
                  to="/pedidos"
                  className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    location.pathname === "/pedidos"
                      ? "bg-blue-600 text-white shadow-md"
                      : "text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  <span>📦</span> <span>Órdenes de Pedidos</span>
                </Link>

                {/* CONTROL DE USUARIOS (SÓLO ADMIN) */}
                {usuario.id_rol === 1 && (
                  <Link
                    to="/usuarios"
                    className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      location.pathname === "/usuarios"
                        ? "bg-blue-600 text-white shadow-md"
                        : "text-slate-400 hover:bg-slate-800"
                    }`}
                  >
                    <span>👤</span> <span>Control de Usuarios</span>
                  </Link>
                )}

                {/* CONTROL DE CLIENTES */}
                {usuario.id_rol === 1 && (
                  <Link
                    to="/clientes"
                    className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      location.pathname === "/clientes"
                        ? "bg-blue-600 text-white shadow-md"
                        : "text-slate-400 hover:bg-slate-800"
                    }`}
                  >
                    <span>👥</span> <span>Control de Clientes</span>
                  </Link>
                )}

                {/* CONTROL DE FLOTA */}
                {usuario.id_rol === 1 && (
                  <Link
                    to="/vehiculos"
                    className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      location.pathname === "/vehiculos"
                        ? "bg-blue-600 text-white shadow-md"
                        : "text-slate-400 hover:bg-slate-800"
                    }`}
                  >
                    <span>🚚</span> <span>Control de Flota</span>
                  </Link>
                )}
              </>
            )}
          </nav>
        </div>

        {/* PERFIL DE USUARIO LOGUEADO */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <p className="text-xs font-bold text-slate-400 uppercase">
            {usuario.rol}
          </p>
          <p className="text-sm font-medium text-white truncate">
            {usuario.nombre}
          </p>
        </div>
      </aside>

      {/* CONTENIDO DINÁMICO */}
      <div className="flex-1 h-screen overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
}
