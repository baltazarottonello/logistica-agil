import { useEffect, useState } from "react";
import API_URL from "../config/api.js";

export default function UsuariosAdmin({ usuario }) {
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    password: "",
    id_rol: "",
  });
  const [editingId, setEditingId] = useState(null); // null = Crear, número = Editar

  // Modificamos el botón de "Nuevo Usuario" y el acceso usando `sesionUsuario`
  const esAdmin = usuario?.id_rol === 1;

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/usuarios`);
      const data = await res.json();
      setUsuarios(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const abrirModalCrear = async () => {
    if (!esAdmin) return alert("No tienes permisos para realizar esta acción.");

    setEditingId(null); // Indicamos que NO estamos editando
    setFormData({
      nombre: "",
      apellido: "",
      email: "",
      password: "",
      id_rol: "",
    });
    setIsModalOpen(true);

    // Cargamos los roles de la DB para el select
    try {
      const res = await fetch(`${API_URL}/api/usuarios/roles`);
      const data = await res.json();
      setRoles(data);
    } catch (err) {
      console.error(err);
    }
  };

  const abrirModalEditar = async (usuario) => {
    if (!esAdmin) return alert("No tienes permisos para realizar esta acción.");

    setEditingId(usuario.id_usuario); // Guardamos el ID que estamos editando

    // Mapeamos los datos de la fila al formulario.
    // Como id_rol viene del backend, necesitamos asegurarnos de pasar el id correcto.
    setFormData({
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      email: usuario.email,
      password: "---", // Enviamos un valor dummy ya que no editaremos la pass aquí
      id_rol: usuario.id_rol, // Si tu consulta SQL no trae el id_rol numérico, asignamos uno temporal o el correspondiente
      activo: usuario.activo,
    });

    setIsModalOpen(true);

    // Cargamos los roles para el select
    try {
      const res = await fetch(`${API_URL}/api/usuarios/roles`);
      const data = await res.json();
      setRoles(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!esAdmin) return alert("Acción denegada.");

    const esEdicion = editingId !== null;
    const url = esEdicion
      ? `${API_URL}/api/usuarios/${editingId}` // URL con ID para el PUT
      : `${API_URL}/api/usuarios`;
    const metodo = esEdicion ? "PUT" : "POST";

    fetch(url, {
      method: metodo,
      headers: {
        "Content-Type": "application/json",
        "x-id-rol": usuario?.id_rol, // Cabecera de seguridad para Express
      },
      body: JSON.stringify(formData),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Error al procesar el usuario.");
        return res.json();
      })
      .then(() => {
        setIsModalOpen(false);
        setEditingId(null);
        setFormData({
          nombre: "",
          apellido: "",
          email: "",
          password: "",
          id_rol: "",
        });
        cargarDatos(); // Recargar la tabla
      })
      .catch((err) => alert(err.message));
  };

  // Función para simular el borrado (si lo implementas en el backend)
  const handleBorrar = (id) => {
    if (!esAdmin) return alert("Solo los administradores pueden borrar.");
    if (confirm("¿Seguro que deseas eliminar este usuario?")) {
      fetch(`${API_URL}/api/usuarios/${id}`, {
        method: "DELETE",
      })
        .then((res) => {
          if (!res.ok)
            throw new Error("No tienes permisos o el usuario no existe.");
          cargarDatos(); // Recargar tabla
        })
        .catch((err) => alert(err.message));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Encabezado */}
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Control de Usuarios
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Gestión de credenciales y permisos de la plataforma.
            </p>
          </div>

          {/* CAMBIO: El botón de agregar solo aparece si eres Admin */}
          <button
            onClick={abrirModalCrear} // <-- CAMBIO AQUÍ
            className="mt-4 md:mt-0 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-xl text-sm shadow cursor-pointer"
          >
            + Nuevo Usuario
          </button>
        </div>

        {/* Tabla */}
        {loading ? (
          <p className="text-center text-slate-500">Cargando usuarios...</p>
        ) : (
          <div className="bg-white shadow-sm border border-slate-200 rounded-2xl overflow-hidden">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                    Usuario
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                    Roles Asignados
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                    Alta
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                    Estado
                  </th>
                  {/* CAMBIO: Columna de acciones solo visible para Admin */}
                  {esAdmin && (
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                      Acciones
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {usuarios.map((u) => (
                  <tr key={u.id_usuario} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                      {u.apellido}, {u.nombre}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {u.email}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-md font-medium text-xs">
                        {u.roles || "Sin Rol"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(u.fecha_creacion).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          u.activo
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {u.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    {/* CAMBIO: Botón de borrar condicional */}
                    {esAdmin && (
                      <td className="px-6 py-4 text-sm space-x-3">
                        <button
                          onClick={() => abrirModalEditar(u)} // <-- AGREGA ESTO
                          className="text-blue-600 hover:text-blue-900 font-bold cursor-pointer"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleBorrar(u.id_usuario)}
                          className="text-red-600 hover:text-red-900 font-bold cursor-pointer"
                        >
                          Borrar
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL CREAR USUARIO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-900">
                {editingId
                  ? "Modificar Colaborador"
                  : "Registrar Nuevo Colaborador"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 font-bold text-xl cursor-pointer"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nombre
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    required
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Apellido
                  </label>
                  <input
                    type="text"
                    name="apellido"
                    value={formData.apellido}
                    onChange={handleInputChange}
                    required
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Institucional
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              {!editingId && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Contraseña Temporal
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Rol en el Sistema
                </label>
                <select
                  name="id_rol"
                  value={formData.id_rol}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 bg-white text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- Seleccionar Rol --</option>
                  {roles.map((r) => (
                    <option key={r.id_rol} value={r.id_rol}>
                      {r.nombre}
                    </option>
                  ))}
                </select>
              </div>
              {editingId && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="activo"
                    id="activo"
                    checked={!!formData.activo}
                    onChange={(e) =>
                      setFormData({ ...formData, activo: e.target.checked })
                    }
                    className="w-4 h-4 accent-blue-600"
                  />
                  <label
                    htmlFor="activo"
                    className="text-xs font-bold text-slate-700"
                  >
                    Usuario Activo
                  </label>
                </div>
              )}
              <div className="flex space-x-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-1/2 border border-slate-300 text-slate-700 font-semibold py-2 rounded-xl text-sm hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-blue-600 text-white font-semibold py-2 rounded-xl text-sm hover:bg-blue-700 shadow-sm cursor-pointer"
                >
                  {editingId ? "Guardar Cambios" : "Dar de Alta"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
