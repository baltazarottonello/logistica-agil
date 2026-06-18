// pages/VehiculosPage.jsx
import { useEffect, useState } from "react";

export default function VehiculosPage({ usuario }) {
  const [vehiculos, setVehiculos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados del Formulario y Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    patente: "",
    marca: "",
    modelo: "",
    apto_refrigeracion: false,
    capacidad_kg: "",
    capacidad_m3: "",
    activo: true,
  });

  const cargarVehiculos = () => {
    setLoading(true);
    fetch("http://localhost:5000/api/vehiculos")
      .then((res) => {
        if (!res.ok) throw new Error("Error al cargar la flota de vehículos.");
        return res.json();
      })
      .then((data) => {
        setVehiculos(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    cargarVehiculos();
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
      patente: "",
      marca: "",
      modelo: "",
      apto_refrigeracion: false,
      capacidad_kg: "",
      capacidad_m3: "",
      activo: true,
    });
    setIsModalOpen(true);
  };

  const abrirModalEditar = (vehiculo) => {
    setEditingId(vehiculo.id_vehiculo);
    setFormData({
      patente: vehiculo.patente,
      marca: vehiculo.marca || "",
      modelo: vehiculo.modelo || "",
      apto_refrigeracion: Boolean(vehiculo.apto_refrigeracion),
      capacidad_kg: vehiculo.capacidad_kg || "",
      capacidad_m3: vehiculo.capacidad_m3 || "",
      activo: Boolean(vehiculo.activo),
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const esEdicion = editingId !== null;
    const url = esEdicion
      ? `http://localhost:5000/api/vehiculos/${editingId}`
      : "http://localhost:5000/api/vehiculos";
    const metodo = esEdicion ? "PUT" : "POST";

    fetch(url, {
      method: metodo,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    })
      .then(async (res) => {
        // Si la respuesta no es exitosa (400, 500, etc)
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(
            errorData.error || "Error procesando los datos del vehículo."
          );
        }
        return res.json();
      })
      .then(() => {
        setIsModalOpen(false);
        cargarVehiculos();
      })
      .catch((err) => alert(err.message)); // <-- Ahora sí verás el error real en pantalla
  };

  const handleBorrar = (id) => {
    if (confirm("¿Estás seguro de eliminar permanentemente este vehículo?")) {
      fetch(`http://localhost:5000/api/vehiculos/${id}`, { method: "DELETE" })
        .then(async (res) => {
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Error al borrar.");
          cargarVehiculos();
        })
        .catch((err) => alert(err.message));
    }
  };

  return (
    <main className="p-8 max-w-7xl w-full mx-auto">
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Flota de Vehículos
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Gestión de unidades de transporte, capacidades y aptitud de frío.
          </p>
        </div>
        <button
          onClick={abrirModalCrear}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-xl text-sm shadow cursor-pointer"
        >
          + Nuevo Vehículo
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
                  Patente
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                  Vehículo
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                  Refrigeración
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                  Capacidad Máx.
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
              {vehiculos.map((v) => (
                <tr key={v.id_vehiculo} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 text-sm font-mono font-bold text-slate-900 uppercase tracking-wider">
                    {v.patente}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700 font-medium">
                    {v.marca || "---"}{" "}
                    <span className="text-slate-400 font-normal">
                      {v.modelo || ""}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {v.apto_refrigeracion ? (
                      <span className="bg-cyan-50 text-cyan-700 border border-cyan-200 px-2.5 py-0.5 rounded-md text-xs font-bold">
                        ❄️ APTO FRÍO
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs font-medium">
                        No disponible
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 space-y-0.5">
                    <div>{v.capacidad_kg ? `${v.capacidad_kg} kg` : "---"}</div>
                    <div className="text-xs text-slate-400">
                      {v.capacidad_m3 ? `${v.capacidad_m3} m³` : ""}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${
                        v.activo
                          ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                          : "bg-slate-100 text-slate-500 border-slate-200"
                      }`}
                    >
                      {v.activo ? "Operativo" : "En Taller"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium space-x-3 whitespace-nowrap">
                    <button
                      onClick={() => abrirModalEditar(v)}
                      className="text-blue-600 hover:text-blue-900 font-semibold cursor-pointer"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleBorrar(v.id_vehiculo)}
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

      {/* MODAL FORMULARIO DE VEHÍCULOS */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-base font-bold text-slate-900">
                {editingId
                  ? "Editar Unidad de Transporte"
                  : "Añadir Vehículo a Flota"}
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
                  Patente / Matrícula *
                </label>
                <input
                  type="text"
                  name="patente"
                  value={formData.patente}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm uppercase font-mono tracking-wider"
                  placeholder="AA123BB o ABC123"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Marca
                  </label>
                  <input
                    type="text"
                    name="marca"
                    value={formData.marca}
                    onChange={handleInputChange}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm"
                    placeholder="Mercedes-Benz"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Modelo
                  </label>
                  <input
                    type="text"
                    name="modelo"
                    value={formData.modelo}
                    onChange={handleInputChange}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm"
                    placeholder="Sprinter 2024"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Carga Máxima (kg)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="capacidad_kg"
                    value={formData.capacidad_kg}
                    onChange={handleInputChange}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm"
                    placeholder="3500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Capacidad (m³)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="capacidad_m3"
                    value={formData.capacidad_m3}
                    onChange={handleInputChange}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm"
                    placeholder="12"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <input
                  type="checkbox"
                  id="apto_refrigeracion"
                  name="apto_refrigeracion"
                  checked={formData.apto_refrigeracion}
                  onChange={handleInputChange}
                  className="rounded text-cyan-600 focus:ring-cyan-500 h-4 w-4 border-slate-300 cursor-pointer"
                />
                <label
                  htmlFor="apto_refrigeracion"
                  className="text-sm font-semibold text-slate-700 cursor-pointer select-none"
                >
                  La unidad cuenta con sistema de refrigeración
                </label>
              </div>

              {editingId && (
                <div className="flex items-center space-x-2 pt-1">
                  <input
                    type="checkbox"
                    id="activo"
                    name="activo"
                    checked={formData.activo}
                    onChange={handleInputChange}
                    className="rounded text-blue-600 h-4 w-4 border-slate-300 cursor-pointer"
                  />
                  <label
                    htmlFor="activo"
                    className="text-sm font-semibold text-slate-700 cursor-pointer select-none"
                  >
                    Vehículo operativo (Habilitar para asignación de viajes)
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
