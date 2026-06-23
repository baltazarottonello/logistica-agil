import { Outlet, Link, useLocation } from "react-router-dom";

export default function DashboardLayout({ usuario, onLogout }) {
  const location = useLocation();

  // Condición para saber si el usuario actual es un chofer
  const esChofer = usuario?.id_rol === 3;

  // Manejo del cierre de sesión unificado con la estética del sistema
  const handleLogout = () => {
    Swal.fire({
      title: "¿Cerrar sesión en la plataforma?",
      text: "Deberá ingresar sus credenciales nuevamente para acceder al panel.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3b82f6",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Sí, salir",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        // 1. Limpiamos las credenciales del almacenamiento local
        localStorage.removeItem("usuario_sesion");
        localStorage.removeItem("token");

        // 2. Le avisamos a App.jsx que cambie el estado a null
        if (typeof onLogout === "function") {
          onLogout();
        } else {
          // Si por alguna razón la prop no llegó, forzamos un reinicio limpio del navegador
          window.location.href = "/";
        }
      }
    });
  };

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
                to="/viaje"
                className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  location.pathname === "/viaje"
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
                {usuario?.id_rol === 1 && (
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
                {usuario?.id_rol === 1 && (
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
                {usuario?.id_rol === 1 && (
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

        {/* PERFIL DE USUARIO LOGUEADO Y DESCONEXIÓN */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 space-y-3">
          <div className="flex items-center justify-between">
            <div className="truncate pr-2">
              <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                {usuario?.rol || "Usuario"}
              </p>
              <p className="text-sm font-medium text-white truncate">
                {usuario?.nombre || "Operador"}
              </p>
            </div>
            <button
              onClick={handleLogout}
              title="Cerrar Sesión"
              className="p-2 rounded-lg bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer border border-slate-700/60"
            >
              🚪
            </button>
          </div>
        </div>
      </aside>

      {/* CONTENIDO DINÁMICO */}
      <div className="flex-1 h-screen overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
}
