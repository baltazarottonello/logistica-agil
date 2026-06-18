// pages/ClientesPage.jsx
import { useEffect, useState } from "react";

export default function ClientesPage({ usuario }) {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados del Formulario y Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    razon_social: "",
    cuit: "",
    telefono: "",
    email: "",
    direccion: "",
    codigo_postal: "",
    activo: true,
  });

  const cargarClientes = () => {
    setLoading(true);
    fetch("http://localhost:5000/api/clientes", {
      headers: { "x-id-rol": usuario?.id_rol },
    })
      .then((res) => {
        if (!res.ok)
          throw new Error("No tienes permisos o el servidor no responde.");
        return res.json();
      })
      .then((data) => {
        setClientes(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    cargarClientes();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const abrirModalCrear = () => {
    setEditingId(null);
    setFormData({
      razon_social: "",
      cuit: "",
      telefono: "",
      email: "",
      direccion: "",
      codigo_postal: "",
      activo: true,
    });
    setIsModalOpen(true);
  };

  const abrirModalEditar = (cliente) => {
    setEditingId(cliente.id_cliente);
    setFormData({
      razon_social: cliente.razon_social,
      cuit: cliente.cuit || "",
      telefono: cliente.telefono || "",
      email: cliente.email || "",
      direccion: cliente.direccion,
      codigo_postal: cliente.codigo_postal || "",
      activo: Boolean(cliente.activo),
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const esEdicion = editingId !== null;
    const url = esEdicion
      ? `http://localhost:5000/api/clientes/${editingId}`
      : "http://localhost:5000/api/clientes";
    const metodo = esEdicion ? "PUT" : "POST";

    fetch(url, {
      method: metodo,
      headers: {
        "Content-Type": "application/json",
        "x-id-rol": usuario?.id_rol,
      },
      body: JSON.stringify(formData),
    })
      .then((res) => {
        if (!res.ok)
          throw new Error("Error procesando la solicitud del cliente.");
        return res.json();
      })
      .then(() => {
        setIsModalOpen(false);
        cargarClientes();
      })
      .catch((err) => alert(err.message));
  };

  const handleBorrar = (id) => {
    if (confirm("¿Estás seguro de eliminar permanentemente este cliente?")) {
      fetch(`http://localhost:5000/api/clientes/${id}`, {
        method: "DELETE",
        headers: { "x-id-rol": usuario?.id_rol },
      })
        .then(async (res) => {
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Error al borrar.");
          cargarClientes();
        })
        .catch((err) => alert(err.message));
    }
  };

  return (
    <main className="p-8 max-w-7xl w-full mx-auto">
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Control de Clientes
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Administración de cuentas corrientes, empresas remitentes y
            destinatarios.
          </p>
        </div>
        <button
          onClick={abrirModalCrear}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-xl text-sm shadow cursor-pointer"
        >
          + Nuevo Cliente
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="bg-rose-50 text-rose-800 p-4 rounded-xl border border-rose-200">
          {error}
        </div>
      ) : (
        <div className="bg-white shadow-sm border border-slate-200 rounded-2xl overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                  Razón Social
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                  CUIT
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                  Contacto
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                  Dirección
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                  Estado
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {clientes.map((c) => (
                <tr key={c.id_cliente} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                    {c.razon_social}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 font-mono">
                    {c.cuit || "---"}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    <div className="text-slate-900">
                      {c.email || "Sin email"}
                    </div>
                    <div className="text-xs">{c.telefono || ""}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {c.direccion}{" "}
                    <span className="text-xs text-slate-400 font-mono">
                      ({c.codigo_postal || "C.P."})
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${
                        c.activo
                          ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                          : "bg-slate-100 text-slate-500 border-slate-200"
                      }`}
                    >
                      {c.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium space-x-3 whitespace-nowrap">
                    <button
                      onClick={() => abrirModalEditar(c)}
                      className="text-blue-600 hover:text-blue-900 font-semibold cursor-pointer"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleBorrar(c.id_cliente)}
                      className="text-rose-600 hover:text-rose-900 font-semibold cursor-pointer"
                    >
                      Borrar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL FORMULARIO DE CLIENTES */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-base font-bold text-slate-900">
                {editingId ? "Modificar Ficha Cliente" : "Registrar Cliente"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 font-bold text-xl cursor-pointer hover:text-slate-600"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Razón Social *
                </label>
                <input
                  type="text"
                  name="razon_social"
                  value={formData.razon_social}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm"
                  placeholder="Empresa S.A."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  CUIT / Identificación
                </label>
                <input
                  type="text"
                  name="cuit"
                  value={formData.cuit}
                  onChange={handleInputChange}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm font-mono"
                  placeholder="30-XXXXXXXX-X"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleInputChange}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm"
                    placeholder="+54..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm"
                    placeholder="contacto@empresa.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Dirección Corporativa *
                  </label>
                  <input
                    type="text"
                    name="direccion"
                    value={formData.direccion}
                    onChange={handleInputChange}
                    required
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm"
                    placeholder="Av. Rivadavia 1500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Cód. Postal
                  </label>
                  <input
                    type="text"
                    name="codigo_postal"
                    value={formData.codigo_postal}
                    onChange={handleInputChange}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm"
                    placeholder="1001"
                  />
                </div>
              </div>

              {editingId && (
                <div className="flex items-center space-x-2 pt-1">
                  <input
                    type="checkbox"
                    id="activo"
                    name="activo"
                    checked={formData.activo}
                    onChange={handleInputChange}
                    className="rounded text-blue-600 h-4 w-4 border-slate-300"
                  />
                  <label
                    htmlFor="activo"
                    className="text-sm font-semibold text-slate-700 cursor-pointer"
                  >
                    Cliente habilitado para operaciones
                  </label>
                </div>
              )}

              <div className="flex space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-1/2 border border-slate-300 text-slate-700 font-semibold py-2 rounded-xl text-sm cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-blue-600 text-white font-semibold py-2 rounded-xl text-sm hover:bg-blue-700 cursor-pointer"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
