import { useEffect, useState } from "react";

export default function HojasRuta({ usuario }) {
  const [hojasRuta, setHojasRuta] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados para el Modal y Formulario
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [choferes, setChoferes] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [editingId, setEditingId] = useState(null); // null = Crear, número = Editar
  const [formData, setFormData] = useState({
    id_chofer: "",
    id_vehiculo: "",
    id_estado_hoja: "1", // 1 = Planificada
    fecha_salida: "",
    observaciones: "",
  });

  const esAdmin = usuario?.id_rol === 1;

  const cargarHojasRuta = () => {
    setLoading(true);
    fetch("http://localhost:5000/api/hojas-ruta")
      .then((res) => {
        if (!res.ok) throw new Error("No se pudo conectar con el servidor.");
        return res.json();
      })
      .then((data) => {
        setHojasRuta(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    cargarHojasRuta();
  }, []);

  // Función auxiliar para traer choferes y vehículos de la DB
  const cargarDependenciasFormulario = async () => {
    try {
      const [resChoferes, resVehiculos] = await Promise.all([
        fetch("http://localhost:5000/api/hojas-ruta/choferes"),
        fetch("http://localhost:5000/api/hojas-ruta/vehiculos"),
      ]);
      setChoferes(await resChoferes.json());
      setVehiculos(await resVehiculos.json());
    } catch (err) {
      console.error("Error cargando datos del formulario:", err);
    }
  };

  // Abrir Modal en modo CREAR
  const abrirModalCrear = async () => {
    if (!esAdmin) return alert("No tienes permisos para planificar rutas.");
    setEditingId(null);
    setFormData({
      id_chofer: "",
      id_vehiculo: "",
      id_estado_hoja: "1",
      fecha_salida: "",
      observaciones: "",
    });
    setIsModalOpen(true);
    await cargarDependenciasFormulario();
  };

  // Abrir Modal en modo EDITAR
  const abrirModalEditar = async (hoja) => {
    if (!esAdmin) return alert("No tienes permisos para modificar rutas.");
    setEditingId(hoja.id_hoja_ruta);

    // Formatear la fecha recibida de la DB (YYYY-MM-DDTHH:MM) para el input datetime-local
    let fechaFormateada = "";
    if (hoja.fecha_salida) {
      const d = new Date(hoja.fecha_salida);
      // Ajuste de zona horaria local para evitar desfases
      const tzOffset = d.getTimezoneOffset() * 60000;
      fechaFormateada = new Date(d.getTime() - tzOffset)
        .toISOString()
        .slice(0, 16);
    }

    setFormData({
      id_chofer: hoja.id_chofer || "",
      id_vehiculo: hoja.id_vehiculo || "",
      id_estado_hoja: hoja.id_estado_hoja || "1",
      fecha_salida: fechaFormateada,
      observaciones: hoja.observaciones || "",
    });

    setIsModalOpen(true);
    await cargarDependenciasFormulario();
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Enviar formulario (Soporta POST y PUT de forma dinámica)
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!esAdmin) return alert("Acción denegada.");

    // Adaptar formato de fecha para MySQL (YYYY-MM-DD HH:MM:SS)
    const fechaFormateada = formData.fecha_salida.replace("T", " ") + ":00";

    const esEdicion = editingId !== null;
    const url = esEdicion
      ? `http://localhost:5000/api/hojas-ruta/${editingId}`
      : "http://localhost:5000/api/hojas-ruta";
    const metodo = esEdicion ? "PUT" : "POST";

    fetch(url, {
      method: metodo,
      headers: {
        "Content-Type": "application/json",
        "x-id-rol": usuario?.id_rol, // Cabecera para el middleware del backend
      },
      body: JSON.stringify({ ...formData, fecha_salida: fechaFormateada }),
    })
      .then((res) => {
        if (!res.ok)
          throw new Error("Error al procesar la hoja de ruta en el servidor.");
        return res.json();
      })
      .then(() => {
        setIsModalOpen(false);
        setEditingId(null);
        setFormData({
          id_chofer: "",
          id_vehiculo: "",
          id_estado_hoja: "1",
          fecha_salida: "",
          observaciones: "",
        });
        cargarHojasRuta();
      })
      .catch((err) => alert(err.message));
  };

  // Función para ELIMINAR la hoja de ruta de forma real
  const handleBorrar = (id) => {
    if (!esAdmin)
      return alert("Solo los administradores pueden borrar hojas de ruta.");

    if (
      confirm(
        `¿Estás seguro de eliminar la Hoja de Ruta #${id}? Los pedidos asociados volverán a quedar pendientes.`
      )
    ) {
      fetch(`http://localhost:5000/api/hojas-ruta/${id}`, {
        method: "DELETE",
        headers: {
          "x-id-rol": usuario?.id_rol,
        },
      })
        .then((res) => {
          if (!res.ok) throw new Error("No se pudo eliminar la hoja de ruta.");
          return res.json();
        })
        .then((data) => {
          alert(data.message || "Hoja de ruta eliminada.");
          cargarHojasRuta();
        })
        .catch((err) => alert(err.message));
    }
  };

  const getEstadoBadge = (estado) => {
    const styles = {
      "En Curso": "bg-emerald-100 text-emerald-800 border-emerald-200",
      Planificada: "bg-amber-100 text-amber-800 border-amber-200",
      Finalizada: "bg-blue-100 text-blue-800 border-blue-200",
      Cancelada: "bg-rose-100 text-rose-800 border-rose-200",
    };
    return styles[estado] || "bg-slate-100 text-slate-800 border-slate-200";
  };

  return (
    <main className="p-8 max-w-7xl w-full mx-auto">
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Hojas de Ruta Activas
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Monitoreo, asignación y control de despachos de flota.
          </p>
        </div>

        {/* 🔒 PROTECCIÓN: Solo el Admin ve el botón de crear */}
        {esAdmin && (
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <button
              onClick={abrirModalCrear}
              className="inline-flex items-center justify-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm shadow cursor-pointer"
            >
              + Nueva Hoja de Ruta
            </button>
          </div>
        )}
      </div>

      {/* Control de carga y errores */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 text-rose-800 p-4 rounded-xl mb-6 border border-rose-200">
          {error}
        </div>
      )}

      {/* Tabla Principal */}
      {!loading && !error && (
        <div className="bg-white shadow-sm border border-slate-200 rounded-2xl overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                  ID Ruta
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                  Chofer
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                  Vehículo / Patente
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                  Fecha Salida
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                  Estado
                </th>
                {/* 🔒 Si es Admin, agregamos la columna de Acciones */}
                {esAdmin && (
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase">
                    Acciones
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {hojasRuta.map((hoja) => (
                <tr key={hoja.id_hoja_ruta} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 text-sm font-semibold text-blue-600">
                    #{hoja.id_hoja_ruta}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">
                    {hoja.chofer_nombre}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-900">
                    {hoja.modelo}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {new Date(hoja.fecha_salida).toLocaleString("es-AR")}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${getEstadoBadge(
                        hoja.estado
                      )}`}
                    >
                      {hoja.estado}
                    </span>
                  </td>

                  {/* 🔒 ACCIONES REALES PARA EL ADMIN */}
                  {esAdmin && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                      <button
                        onClick={() => abrirModalEditar(hoja)}
                        className="text-blue-600 hover:text-blue-900 font-semibold cursor-pointer"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleBorrar(hoja.id_hoja_ruta)}
                        className="text-rose-600 hover:text-rose-900 font-semibold cursor-pointer"
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

      {/* MODAL DE DINÁMICO (CREACIÓN / EDICIÓN) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-base font-bold text-slate-900">
                {editingId
                  ? `Modificar Hoja de Ruta #${editingId}`
                  : "Planificar Hoja de Ruta"}
              </h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingId(null);
                }}
                className="text-slate-400 font-bold text-xl cursor-pointer hover:text-slate-600"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Chofer Asignado *
                </label>
                <select
                  name="id_chofer"
                  value={formData.id_chofer}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 bg-white text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- Seleccionar Chofer --</option>
                  {choferes.map((c) => (
                    <option key={c.id_chofer} value={c.id_chofer}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Vehículo Autorizado *
                </label>
                <select
                  name="id_vehiculo"
                  value={formData.id_vehiculo}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 bg-white text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- Seleccionar Vehículo --</option>
                  {vehiculos.map((v) => (
                    <option key={v.id_vehiculo} value={v.id_vehiculo}>
                      {v.modelo} ({v.patente})
                    </option>
                  ))}
                </select>
              </div>

              {/* Mostrar el selector de Estados de la hoja de ruta SÓLO cuando se esté editando */}
              {editingId && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Estado del Despacho *
                  </label>
                  <select
                    name="id_estado_hoja"
                    value={formData.id_estado_hoja}
                    onChange={handleInputChange}
                    required
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 bg-white text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="1">Planificada</option>
                    <option value="2">En Curso</option>
                    <option value="3">Finalizada</option>
                    <option value="4">Cancelada</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Fecha y Hora de Salida *
                </label>
                <input
                  type="datetime-local"
                  name="fecha_salida"
                  value={formData.fecha_salida}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Observaciones
                </label>
                <textarea
                  name="observaciones"
                  value={formData.observaciones}
                  onChange={handleInputChange}
                  rows="2"
                  placeholder="Detalles o contingencias..."
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none"
                ></textarea>
              </div>

              <div className="flex space-x-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingId(null);
                  }}
                  className="w-1/2 border border-slate-300 text-slate-700 font-semibold py-2 rounded-xl text-sm hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-blue-600 text-white font-semibold py-2 rounded-xl text-sm hover:bg-blue-700 shadow-sm cursor-pointer"
                >
                  {editingId ? "Guardar Cambios" : "Planificar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
