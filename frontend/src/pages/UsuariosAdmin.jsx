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
    if (!esAdmin) {
      Swal.fire({
        title: "Acción restringida",
        text: "No tienes privilegios suficientes para dar de alta colaboradores.",
        icon: "error",
        confirmButtonColor: "#3b82f6",
      });
      return;
    }

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
    if (!esAdmin) {
      Swal.fire({
        title: "Acción restringida",
        text: "No tienes privilegios para modificar fichas de personal.",
        icon: "error",
        confirmButtonColor: "#3b82f6",
      });
      return;
    }

    setEditingId(usuario.id_usuario); // Guardamos el ID que estamos editando

    // Mapeamos los datos de la fila al formulario
    setFormData({
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      email: usuario.email,
      password: "---",
      id_rol: usuario.id_rol,
      activo: usuario.activo,
      // Mapeo de los campos nuevos
      dni: usuario.dni || "",
      licencia_conducir: usuario.licencia_conducir || "",
      telefono: usuario.telefono || "",
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
    if (!esAdmin) {
      Swal.fire({
        title: "Error",
        text: "Acción denegada por el sistema.",
        icon: "error",
        confirmButtonColor: "#3b82f6",
      });
      return;
    }

    const datosAEnviar = { ...formData };

    // Si el rol NO es chofer (suponiendo que 3 es el id de chofer)
    // eliminamos los campos específicos de chofer para que el backend
    // no los procese erróneamente.
    if (parseInt(datosAEnviar.id_rol) !== 3) {
      delete datosAEnviar.dni;
      delete datosAEnviar.licencia_conducir;
      delete datosAEnviar.telefono;
    }

    const esEdicion = editingId !== null;
    const url = esEdicion
      ? `${API_URL}/api/usuarios/${editingId}` // URL con ID para el PUT
      : `${API_URL}/api/usuarios`;
    const metodo = esEdicion ? "PUT" : "POST";

    console.log(datosAEnviar);

    fetch(url, {
      method: metodo,
      headers: {
        "Content-Type": "application/json",
        "x-id-rol": usuario?.id_rol, // Cabecera de seguridad para Express
      },
      body: JSON.stringify(datosAEnviar),
    })
      .then((res) => {
        if (!res.ok)
          throw new Error("Error al procesar la actualización del usuario.");
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
          dni: "", // Nuevo
          licencia_conducir: "", // Nuevo
          telefono: "",
          id_rol: "",
        });

        Swal.fire({
          title: esEdicion
            ? "¡Credenciales Actualizadas!"
            : "¡Colaborador Registrado!",
          text: esEdicion
            ? "Los cambios en los permisos fueron guardados."
            : "El usuario ya puede iniciar sesión en la plataforma.",
          icon: "success",
          confirmButtonColor: "#3b82f6",
        });

        cargarDatos(); // Recargar la tabla
      })
      .catch((err) => {
        Swal.fire({
          title: "Error de Guardado",
          text: err.message,
          icon: "error",
          confirmButtonColor: "#3b82f6",
        });
      });
  };

  const handleBorrar = (id) => {
    if (!esAdmin) {
      Swal.fire({
        title: "Error",
        text: "Solo los administradores pueden revocar accesos.",
        icon: "error",
        confirmButtonColor: "#3b82f6",
      });
      return;
    }

    Swal.fire({
      title: "¿Revocar acceso de usuario?",
      text: "Esta acción eliminará de forma permanente el usuario seleccionado. No podrá volver a ingresar al sistema.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Sí, eliminar acceso",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        fetch(`${API_URL}/api/usuarios/${id}`, {
          method: "DELETE",
        })
          .then((res) => {
            if (!res.ok)
              throw new Error(
                "No tienes permisos suficientes o el operador no existe."
              );

            Swal.fire({
              title: "¡Acceso Eliminado!",
              text: "Las credenciales fueron revocadas con éxito.",
              icon: "success",
              confirmButtonColor: "#3b82f6",
            });

            cargarDatos(); // Recargar tabla
          })
          .catch((err) => {
            Swal.fire({
              title: "Error de Eliminación",
              text: err.message,
              icon: "error",
              confirmButtonColor: "#3b82f6",
            });
          });
      }
    });
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

          <button
            onClick={abrirModalCrear}
            className="mt-4 md:mt-0 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-xl text-sm shadow cursor-pointer"
          >
            + Nuevo Usuario
          </button>
        </div>

        {/* Tabla */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
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
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                          u.activo
                            ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        {u.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    {esAdmin && (
                      <td className="px-6 py-4 text-sm space-x-3 whitespace-nowrap">
                        <button
                          onClick={() => abrirModalEditar(u)}
                          className="text-blue-600 hover:text-blue-900 font-bold cursor-pointer"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleBorrar(u.id_usuario)}
                          className="text-rose-600 hover:text-rose-900 font-bold cursor-pointer"
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
              <h3 className="text-base font-bold text-slate-900">
                {editingId
                  ? "Modificar Colaborador"
                  : "Registrar Nuevo Colaborador"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 font-bold text-xl cursor-pointer hover:text-slate-600"
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
              {parseInt(formData.id_rol) === 3 && (
                <div className="grid grid-cols-1 gap-4 p-4 mt-2 bg-slate-50 rounded-xl border border-slate-200 animate-in fade-in zoom-in duration-200">
                  <h4 className="text-xs font-bold text-slate-900 uppercase">
                    Datos de Chofer
                  </h4>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      DNI
                    </label>
                    <input
                      type="text"
                      name="dni"
                      value={formData.dni}
                      onChange={handleInputChange}
                      required
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Licencia
                      </label>
                      <input
                        type="text"
                        name="licencia_conducir"
                        value={formData.licencia_conducir}
                        onChange={handleInputChange}
                        required
                        className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Teléfono
                      </label>
                      <input
                        type="text"
                        name="telefono"
                        value={formData.telefono}
                        onChange={handleInputChange}
                        required
                        className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}
              {editingId && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    name="activo"
                    id="activo"
                    checked={!!formData.activo}
                    onChange={(e) =>
                      setFormData({ ...formData, activo: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-blue-600 border-slate-300 accent-blue-600"
                  />
                  <label
                    htmlFor="activo"
                    className="text-sm font-semibold text-slate-700 cursor-pointer"
                  >
                    Usuario Activo
                  </label>
                </div>
              )}
              <div className="flex space-x-3 pt-4 border-t border-slate-100">
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
