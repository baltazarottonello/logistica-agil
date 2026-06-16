import { useEffect, useState } from "react";

export default function Pedidos({ usuario }) {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados del Formulario y Dependencias
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clientes, setClientes] = useState([]);
  const [estados, setEstados] = useState([]);
  const [categorias, setCategorias] = useState([]); // Listado maestro de categorías
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    id_cliente_remitente: "",
    id_cliente_destinatario: "",
    id_estado: "1",
    direccion_entrega: "",
    volumen_m3: "",
    peso_kg: "",
    observaciones: "",
  });

  // Guardamos un array de IDs numéricos correspondientes a las categorías tildadas
  const [categoriasSeleccionadas, setCategoriasSeleccionadas] = useState([]);

  const esAdmin = usuario?.id_rol === 1;

  const cargarPedidos = () => {
    setLoading(true);
    fetch("http://localhost:5000/api/pedidos")
      .then((res) => {
        if (!res.ok) throw new Error("No se pudo conectar con el servidor.");
        return res.json();
      })
      .then((data) => {
        setPedidos(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarPedidos();
  }, []);

  const cargarDependencias = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/pedidos/dependencias");
      const data = await res.json();
      setClientes(data.clientes);
      setEstados(data.estados);
      setCategorias(data.categorias);
    } catch (err) {
      console.error("Error al cargar dependencias:", err);
    }
  };

  const abrirModalCrear = async () => {
    if (!esAdmin) return alert("Acción denegada.");
    setEditingId(null);
    setCategoriasSeleccionadas([]); // Limpiar casillas
    setFormData({
      id_cliente_remitente: "",
      id_cliente_destinatario: "",
      id_estado: "1",
      direccion_entrega: "",
      volumen_m3: "",
      peso_kg: "",
      observaciones: "",
    });
    setIsModalOpen(true);
    await cargarDependencias();
  };

  const abrirModalEditar = async (pedido) => {
    if (!esAdmin) return alert("Acción denegada.");
    setEditingId(pedido.id_pedido);

    // Mapeamos los IDs separados por coma del string enviado por MySQL ('1,3') a enteros ([1, 3])
    const idsInt = pedido.ids_categorias
      ? pedido.ids_categorias.split(",").map((id) => parseInt(id, 10))
      : [];

    setCategoriasSeleccionadas(idsInt);
    setFormData({
      id_cliente_remitente: pedido.id_cliente_remitente,
      id_cliente_destinatario: pedido.id_cliente_destinatario,
      id_estado: pedido.id_estado,
      direccion_entrega: pedido.direccion_entrega,
      volumen_m3: pedido.volumen_m3 || "",
      peso_kg: pedido.peso_kg || "",
      observaciones: pedido.observaciones || "",
    });
    setIsModalOpen(true);
    await cargarDependencias();
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Maneja el tildado y destildado de los checkboxes de categorías
  const handleCheckboxChange = (id_cat) => {
    if (categoriasSeleccionadas.includes(id_cat)) {
      setCategoriasSeleccionadas(
        categoriasSeleccionadas.filter((id) => id !== id_cat)
      );
    } else {
      setCategoriasSeleccionadas([...categoriasSeleccionadas, id_cat]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!esAdmin) return alert("No tienes permisos.");

    if (
      parseInt(formData.id_cliente_remitente) ===
      parseInt(formData.id_cliente_destinatario)
    ) {
      return alert(
        "El remitente y el destinatario no pueden coincidir corporativamente."
      );
    }

    if (categoriasSeleccionadas.length === 0) {
      return alert(
        "Por favor, selecciona al menos una categoría para la mercancía."
      );
    }

    const esEdicion = editingId !== null;
    const url = esEdicion
      ? `http://localhost:5000/api/pedidos/${editingId}`
      : "http://localhost:5000/api/pedidos";
    const metodo = esEdicion ? "PUT" : "POST";

    fetch(url, {
      method: metodo,
      headers: {
        "Content-Type": "application/json",
        "x-id-rol": usuario?.id_rol,
      },
      body: JSON.stringify({ ...formData, categoriasSeleccionadas }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Error procesando el pedido.");
        return res.json();
      })
      .then(() => {
        setIsModalOpen(false);
        setEditingId(null);
        cargarPedidos();
      })
      .catch((err) => alert(err.message));
  };

  const handleBorrar = (id) => {
    if (!esAdmin) return alert("Permisos insuficientes.");
    if (confirm(`¿Eliminar de forma permanente el Pedido #${id}?`)) {
      fetch(`http://localhost:5000/api/pedidos/${id}`, {
        method: "DELETE",
        headers: { "x-id-rol": usuario?.id_rol },
      })
        .then((res) => {
          if (!res.ok) throw new Error("Error al borrar el pedido.");
          cargarPedidos();
        })
        .catch((err) => alert(err.message));
    }
  };

  const getEstadoStyle = (estado) => {
    const styles = {
      "En Ruta": "bg-emerald-100 text-emerald-800 border-emerald-200",
      Pendiente: "bg-amber-100 text-amber-800 border-amber-200",
      Entregado: "bg-blue-100 text-blue-800 border-blue-200",
      Cancelado: "bg-rose-100 text-rose-800 border-rose-200",
    };
    return styles[estado] || "bg-slate-100 text-slate-800 border-slate-200";
  };

  return (
    <main className="p-8 max-w-7xl w-full mx-auto">
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Órdenes de Pedido
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Gestión de carga de mercancías entrantes y salientes.
          </p>
        </div>
        {esAdmin && (
          <button
            onClick={abrirModalCrear}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-xl text-sm shadow cursor-pointer"
          >
            + Nuevo Pedido
          </button>
        )}
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
                  ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                  Categoría/s
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                  Remitente
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                  Destinatario
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                  Dirección de Entrega
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                  Estado
                </th>
                {esAdmin && (
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase">
                    Acciones
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {pedidos.map((p) => (
                <tr key={p.id_pedido} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 text-sm font-semibold text-blue-600">
                    #{p.id_pedido}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">
                    <span
                      className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md text-xs font-semibold border border-slate-200 truncate block max-w-[160px]"
                      title={p.categorias}
                    >
                      {p.categorias || "Sin Categoría"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">
                    {p.remitente}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-900">
                    {p.destinatario}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {p.direccion_entrega}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${getEstadoStyle(
                        p.estado
                      )}`}
                    >
                      {p.estado}
                    </span>
                  </td>
                  {esAdmin && (
                    <td className="px-6 py-4 text-right text-sm font-medium space-x-3 whitespace-nowrap">
                      <button
                        onClick={() => abrirModalEditar(p)}
                        className="text-blue-600 hover:text-blue-900 font-semibold cursor-pointer"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleBorrar(p.id_pedido)}
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

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-base font-bold text-slate-900">
                {editingId
                  ? `Modificar Pedido #${editingId}`
                  : "Registrar Nueva Orden"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 font-bold text-xl cursor-pointer hover:text-slate-600"
              >
                &times;
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-6 space-y-3.5 max-h-[80vh] overflow-y-auto"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cliente Remitente *
                </label>
                <select
                  name="id_cliente_remitente"
                  value={formData.id_cliente_remitente}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white"
                >
                  <option value="">-- Seleccionar Origen --</option>
                  {clientes.map((c) => (
                    <option key={c.id_cliente} value={c.id_cliente}>
                      {c.razon_social}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cliente Destinatario *
                </label>
                <select
                  name="id_cliente_destinatario"
                  value={formData.id_cliente_destinatario}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white"
                >
                  <option value="">-- Seleccionar Destino --</option>
                  {clientes.map((c) => (
                    <option key={c.id_cliente} value={c.id_cliente}>
                      {c.razon_social}
                    </option>
                  ))}
                </select>
              </div>

              {/* SECCIÓN INTERACTIVA DE CHECKBOXES PARA N:M CATEGORÍAS */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Categorías de la Mercancía *
                </label>
                <div className="border border-slate-300 rounded-xl p-3 bg-slate-50/50 space-y-2 max-h-32 overflow-y-auto">
                  {categorias.map((cat) => (
                    <label
                      key={cat.id_categoria}
                      className="flex items-center space-x-2.5 text-sm font-medium text-slate-700 cursor-pointer select-none"
                    >
                      <input
                        type="checkbox"
                        checked={categoriasSeleccionadas.includes(
                          cat.id_categoria
                        )}
                        onChange={() => handleCheckboxChange(cat.id_categoria)}
                        className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 border-slate-300"
                      />
                      <span>{cat.nombre}</span>
                    </label>
                  ))}
                </div>
              </div>

              {editingId && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Estado del Pedido *
                  </label>
                  <select
                    name="id_estado"
                    value={formData.id_estado}
                    onChange={handleInputChange}
                    required
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white"
                  >
                    {estados.map((e) => (
                      <option key={e.id_estado} value={e.id_estado}>
                        {e.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Dirección de Entrega *
                </label>
                <input
                  type="text"
                  name="direccion_entrega"
                  value={formData.direccion_entrega}
                  onChange={handleInputChange}
                  required
                  placeholder="Calle 123, Localidad"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Volumen (m³)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="volumen_m3"
                    value={formData.volumen_m3}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Peso (kg)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="peso_kg"
                    value={formData.peso_kg}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm"
                  />
                </div>
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
                  placeholder="Detalles de manipulación..."
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm resize-none"
                ></textarea>
              </div>

              <div className="flex space-x-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-1/2 border border-slate-300 text-slate-700 font-semibold py-2 rounded-xl text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-blue-600 text-white font-semibold py-2 rounded-xl text-sm hover:bg-blue-700"
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
