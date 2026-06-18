import { useEffect, useState } from "react";

export default function HojasRuta({ usuario }) {
  const [hojasRuta, setHojasRuta] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- NUEVOS ESTADOS PARA AUDITORÍA (MAESTRO-DETALLE) ---
  const [hojaSeleccionada, setHojaSeleccionada] = useState(null);
  const [pedidosDetalle, setPedidosDetalle] = useState([]);
  const [loadingDetalle, setLoadingDetalle] = useState(false);

  // Estados del Modal y Listas Maestras
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [choferes, setChoferes] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [pedidosDisponibles, setPedidosDisponibles] = useState([]);

  const [editingId, setEditingId] = useState(null);
  const [pedidosSeleccionados, setPedidosSeleccionados] = useState([]);

  const [formData, setFormData] = useState({
    id_chofer: "",
    id_vehiculo: "",
    id_estado_hoja: "1",
    fecha_salida: "",
    observaciones: "",
  });

  const comprobarRequerimientoFrio = () => {
    return pedidosSeleccionados.some((item) => {
      const pedido = pedidosDisponibles.find(
        (p) => p.id_pedido === item.id_pedido
      );
      return pedido && pedido.requiere_frio === 1;
    });
  };

  const esAdmin = usuario?.id_rol === 1;

  const cargarHojasRuta = () => {
    setLoading(true);
    fetch("http://localhost:5000/api/hojas-ruta")
      .then((res) => res.json())
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

  // --- NUEVA FUNCIÓN: SELECCIONAR HOJA DE RUTA Y TRAER AUDITORÍA ---
  const handleSeleccionarHoja = async (hoja) => {
    // Si se hace clic en la que ya está seleccionada, la cerramos
    if (hojaSeleccionada?.id_hoja_ruta === hoja.id_hoja_ruta) {
      setHojaSeleccionada(null);
      setPedidosDetalle([]);
      return;
    }

    setHojaSeleccionada(hoja);
    setLoadingDetalle(true);
    try {
      const res = await fetch(
        `http://localhost:5000/api/hojas-ruta/${hoja.id_hoja_ruta}/pedidos-detalle`
      );
      const data = await res.json();
      setPedidosDetalle(data);
    } catch (err) {
      console.error("Error al cargar auditoría:", err);
    } finally {
      setLoadingDetalle(false);
    }
  };

  const cargarDependenciasFormulario = async (idHoja = null) => {
    try {
      const resChoferes = await fetch(
        "http://localhost:5000/api/hojas-ruta/choferes"
      );
      setChoferes(await resChoferes.json());

      const resPedidos = await fetch(
        "http://localhost:5000/api/pedidos/disponibles"
      );
      const pedidosPendientes = await resPedidos.json();
      setPedidosDisponibles(pedidosPendientes);
    } catch (err) {
      console.error("Error cargando dependencias:", err);
    }
  };

  const requiereFrio = comprobarRequerimientoFrio();

  useEffect(() => {
    if (!isModalOpen) return;

    fetch(
      `http://localhost:5000/api/hojas-ruta/vehiculos?requiereFrio=${requiereFrio}`
    )
      .then((res) => res.json())
      .then((data) => {
        setVehiculos(data);
        if (
          formData.id_vehiculo &&
          !data.some((v) => v.id_vehiculo === parseInt(formData.id_vehiculo))
        ) {
          setFormData((prev) => ({ ...prev, id_vehiculo: "" }));
        }
      })
      .catch((err) => console.error("Error cargando vehículos:", err));
  }, [requiereFrio, isModalOpen]);

  const handlePedidoCheckboxChange = (idPedido) => {
    setPedidosSeleccionados((prev) => {
      const existe = prev.find((p) => p.id_pedido === idPedido);
      if (existe) {
        return prev.filter((p) => p.id_pedido !== idPedido);
      } else {
        const nuevoOrden = prev.length + 1;
        return [...prev, { id_pedido: idPedido, orden_visita: nuevoOrden }];
      }
    });
  };

  const handleOrdenChange = (idPedido, nuevoOrden) => {
    setPedidosSeleccionados((prev) =>
      prev.map((p) =>
        p.id_pedido === idPedido
          ? { ...p, orden_visita: parseInt(nuevoOrden) || 0 }
          : p
      )
    );
  };

  const abrirModalCrear = async () => {
    if (!esAdmin) return alert("No tienes permisos.");
    setEditingId(null);
    setPedidosSeleccionados([]);
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

  const abrirModalEditar = async (hoja, e) => {
    e.stopPropagation(); // Evita que se seleccione la hoja para auditoría al hacer clic en editar
    if (!esAdmin) return alert("No tienes permisos.");
    setEditingId(hoja.id_hoja_ruta);

    let fechaFormateada = "";
    if (hoja.fecha_salida) {
      const d = new Date(hoja.fecha_salida);
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
    await cargarDependenciasFormulario(hoja.id_hoja_ruta);

    if (hoja.id_pedidos_asociados) {
      setPedidosSeleccionados(hoja.id_pedidos_asociados);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!esAdmin) return alert("Acción denegada.");

    const vehiculoSeleccionado = vehiculos.find(
      (v) => String(v.id_vehiculo) === String(formData.id_vehiculo)
    );

    if (!vehiculoSeleccionado) {
      return alert(
        "❌ Error: No se ha seleccionado un vehículo válido o no se pudieron cargar sus datos."
      );
    }

    const necesitaVehiculoConFrio = pedidosSeleccionados.some((item) => {
      const pedido = pedidosDisponibles.find(
        (p) => p.id_pedido === item.id_pedido
      );
      return pedido && pedido.requiere_frio === 1;
    });

    if (
      necesitaVehiculoConFrio &&
      vehiculoSeleccionado.apto_refrigeracion !== 1
    ) {
      return alert(
        "❌ Error: Estás intentando asignar pedidos que requieren refrigeración a un vehículo común."
      );
    }

    const pesoTotalCarga = pedidosSeleccionados.reduce((acumulador, item) => {
      const pedido = pedidosDisponibles.find(
        (p) => p.id_pedido === item.id_pedido
      );
      const peso = pedido ? Number(pedido.peso_kg) : 0;
      return acumulador + peso;
    }, 0);

    const capacidadMaximaVehiculo = Number(vehiculoSeleccionado.capacidad_kg);

    if (pesoTotalCarga > capacidadMaximaVehiculo) {
      return alert(
        `❌ Error: Sobrecarga en el vehículo.\n\n` +
          `• Peso total de los pedidos: ${pesoTotalCarga.toFixed(2)} kg.\n` +
          `• Capacidad máxima del vehículo (${
            vehiculoSeleccionado.modelo
          }): ${capacidadMaximaVehiculo.toFixed(2)} kg.\n\n` +
          `Por favor, desmarcá algunos pedidos o seleccioná un vehículo con mayor capacidad.`
      );
    }

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
        "x-id-rol": usuario?.id_rol,
      },
      body: JSON.stringify({
        ...formData,
        fecha_salida: fechaFormateada,
        id_pedidos: pedidosSeleccionados,
      }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(
            errorData.error || "Error inesperado en el servidor."
          );
        }
        return res.json();
      })
      .then(() => {
        setIsModalOpen(false);
        setEditingId(null);
        // Si estábamos auditando la hoja que se editó, limpiamos la selección vieja
        if (hojaSeleccionada?.id_hoja_ruta === editingId) {
          setHojaSeleccionada(null);
          setPedidosDetalle([]);
        }
        cargarHojasRuta();
      })
      .catch((err) => alert(err.message));
  };

  const handleBorrar = (id, e) => {
    e.stopPropagation(); // Evita conflictos de selección
    if (!esAdmin) return alert("Privilegio requerido.");
    if (confirm(`¿Eliminar Hoja #${id}?`)) {
      fetch(`http://localhost:5000/api/hojas-ruta/${id}`, {
        method: "DELETE",
        headers: { "x-id-rol": usuario?.id_rol },
      })
        .then(() => {
          if (hojaSeleccionada?.id_hoja_ruta === id) {
            setHojaSeleccionada(null);
            setPedidosDetalle([]);
          }
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

  const getEstadoPedidoBadge = (idEstado) => {
    // Mapeo basado en tus controladores backend (id_estado: 3 Entregado, 5 Asignado, etc.)
    if (idEstado === 3)
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (idEstado === 5) return "bg-indigo-50 text-indigo-700 border-indigo-200";
    return "bg-slate-50 text-slate-700 border-slate-200";
  };

  return (
    <main className="p-8 max-w-7xl w-full mx-auto font-sans antialiased space-y-8">
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Hojas de Ruta Activas
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Monitoreo, asignación y control de despachos de flota. Haz clic en
            una fila para auditar sus entregas.
          </p>
        </div>
        {esAdmin && (
          <button
            onClick={abrirModalCrear}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm shadow cursor-pointer"
          >
            + Nueva Hoja de Ruta
          </button>
        )}
      </div>

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
                {esAdmin && (
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase">
                    Acciones
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {hojasRuta.map((hoja) => {
                const estaSeleccionada =
                  hojaSeleccionada?.id_hoja_ruta === hoja.id_hoja_ruta;
                return (
                  <tr
                    key={hoja.id_hoja_ruta}
                    onClick={() => handleSeleccionarHoja(hoja)}
                    className={`cursor-pointer transition-colors ${
                      estaSeleccionada
                        ? "bg-blue-50/40 hover:bg-blue-50/60"
                        : "hover:bg-slate-50/50"
                    }`}
                  >
                    <td className="px-6 py-4 text-sm font-semibold text-blue-600">
                      #{hoja.id_hoja_ruta}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      {hoja.chofer_nombre}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900">
                      {hoja.modelo}{" "}
                      <span className="text-xs text-slate-400 font-mono">
                        ({hoja.patente})
                      </span>
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
                    {esAdmin && (
                      <td className="px-6 py-4 text-right text-sm font-medium space-x-3">
                        <button
                          onClick={(e) => abrirModalEditar(hoja, e)}
                          className="text-blue-600 hover:text-blue-900 font-semibold cursor-pointer"
                        >
                          Editar
                        </button>
                        <button
                          onClick={(e) => handleBorrar(hoja.id_hoja_ruta, e)}
                          className="text-rose-600 hover:text-rose-900 font-semibold cursor-pointer"
                        >
                          Borrar
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* --- SECCIÓN NUEVA: PANEL DETALLE DE AUDITORÍA (MAESTRO-DETALLE) --- */}
      {hojaSeleccionada && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4 animate-fadeIn">
          <div className="flex justify-between items-center border-b border-slate-200 pb-3">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Auditoría de Despacho: Hoja #{hojaSeleccionada.id_hoja_ruta}
              </h3>
              <p className="text-xs text-slate-500">
                Mapeo logístico de pedidos y recepciones físicas registradas por
                el chofer ({hojaSeleccionada.chofer_nombre}).
              </p>
            </div>
            <button
              onClick={() => {
                setHojaSeleccionada(null);
                setPedidosDetalle([]);
              }}
              className="text-xs font-bold text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              Cerrar Detalle
            </button>
          </div>

          {loadingDetalle ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : pedidosDetalle.length === 0 ? (
            <p className="text-sm text-slate-400 italic py-4 text-center">
              Esta hoja de ruta no posee pedidos vinculados o consolidados.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pedidosDetalle.map((p) => (
                <div
                  key={p.id_pedido}
                  className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                        Visita #{p.orden_visita}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 mt-1">
                        Pedido #{p.id_pedido} — {p.cliente_destinatario}
                      </h4>
                    </div>
                    <span
                      className={`px-2 py-0.5 text-[11px] font-bold rounded-md border ${getEstadoPedidoBadge(
                        p.id_estado,
                        p.estado_general
                      )}`}
                    >
                      {p.sub_estado_entrega || p.estado_general}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-sans">
                    <p>
                      📍 <strong>Dirección:</strong> {p.direccion_entrega}
                    </p>
                    <p>
                      📦 <strong>Carga:</strong> {p.peso_kg} kg |{" "}
                      {p.volumen_m3 || "N/A"} m³
                    </p>
                    {p.obs_pedido && (
                      <p className="italic text-slate-400">
                        📝 Obs. Alta: "{p.obs_pedido}"
                      </p>
                    )}
                  </div>

                  {/* Bloque del Reporte del Chofer (Solo si ya se procesó la entrega en camino) */}
                  {p.fecha_entrega ? (
                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      <div className="flex justify-between items-center text-[11px] text-slate-400">
                        <span>
                          🕒 {new Date(p.fecha_entrega).toLocaleString("es-AR")}
                        </span>
                        <span>
                          👤 Recibió:{" "}
                          <strong className="text-slate-700">
                            {p.recibido_por}
                          </strong>
                        </span>
                      </div>

                      <div className="bg-emerald-50/40 border border-emerald-100 rounded-lg p-2 text-xs">
                        <p className="text-slate-700">
                          <strong>Feedback Chofer:</strong> {p.obs_chofer}
                        </p>
                        {p.recibo_emitido === 1 && (
                          <p className="text-[10px] text-emerald-700 font-bold mt-1 flex items-center gap-1">
                            📄 Recibo digital de entrega emitido automáticamente
                          </p>
                        )}
                      </div>

                      {p.firma_simulada && (
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                            Firma digital escaneada (BLOB-Hex):
                          </span>
                          <span className="text-[10px] font-mono text-slate-600 bg-white block p-1 rounded border border-slate-100 truncate">
                            {p.firma_simulada}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-amber-500 font-medium italic pt-2 border-t border-slate-100 flex items-center gap-1">
                      ⏳ En tránsito: El chofer aún no ha reportado novedades de
                      entrega.
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL DINÁMICO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden my-8">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-base font-bold text-slate-900">
                {editingId
                  ? `Modificar Hoja #${editingId}`
                  : "Planificar Hoja de Ruta"}
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
              className="p-6 space-y-4 max-h-[75vh] overflow-y-auto"
            >
              {/* SECCIÓN NUEVA: LISTADO DE PEDIDOS DISPONIBLES */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase">
                    Seleccionar Pedidos a Consolidar *
                  </label>
                  {requiereFrio && (
                    <span className="text-[10px] font-bold bg-cyan-100 text-cyan-800 border border-cyan-200 px-2 py-0.5 rounded-md animate-pulse">
                      ❄️ CARGA CON CADENA DE FRÍO
                    </span>
                  )}
                </div>
                <div className="border border-slate-200 rounded-xl max-h-40 overflow-y-auto p-3 bg-slate-50 space-y-2">
                  {pedidosDisponibles.length === 0 ? (
                    <p className="text-xs text-slate-400 italic text-center py-4">
                      No hay órdenes de pedido pendientes de envío.
                    </p>
                  ) : (
                    pedidosDisponibles.map((p) => {
                      // Buscamos si este pedido específico ya fue seleccionado
                      const seleccion = pedidosSeleccionados.find(
                        (sel) => sel.id_pedido === p.id_pedido
                      );
                      const estaSeleccionado = !!seleccion;
                      const esDeFrio = p.requiere_frio === 1;

                      return (
                        <label
                          key={p.id_pedido}
                          className={`flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer ${
                            estaSeleccionado
                              ? "bg-blue-50/70 border-blue-200"
                              : "bg-white border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-start space-x-3 text-xs">
                            <input
                              type="checkbox"
                              checked={estaSeleccionado}
                              onChange={() =>
                                handlePedidoCheckboxChange(p.id_pedido)
                              }
                              className="mt-0.5 rounded text-blue-600 h-4 w-4 border-slate-300 cursor-pointer"
                            />
                            <div>
                              <span className="font-bold text-slate-900">
                                Ped. #{p.id_pedido}
                              </span>{" "}
                              - {p.cliente_nombre}
                              <div className="text-slate-400 text-[11px] mt-0.5">
                                {p.direccion_entrega} |{" "}
                                {esDeFrio ? (
                                  <span className="text-cyan-600 font-bold">
                                    ❄️ Requiere Frío
                                  </span>
                                ) : (
                                  <span className="text-slate-500">
                                    Carga General
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* COLUMNA DERECHA: INPUT DE ORDEN (Solo visible si está tildado) */}
                          {estaSeleccionado && (
                            <div
                              className="flex items-center space-x-1 pl-2"
                              onClick={(e) => e.preventDefault()}
                            >
                              <span className="text-[10px] font-bold text-slate-400 uppercase">
                                Orden:
                              </span>
                              <input
                                type="number"
                                min="1"
                                value={seleccion.orden_visita}
                                onChange={(e) =>
                                  handleOrdenChange(p.id_pedido, e.target.value)
                                }
                                className="w-12 border border-blue-300 rounded-md px-1 py-0.5 text-center text-xs font-bold bg-white text-slate-800 focus:outline-none focus:border-blue-500"
                              />
                            </div>
                          )}
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              {/* SELECTOR DE VEHÍCULOS (FILTRADO AUTOMÁTICAMENTE POR EL CONTEXTO DE ARRIBA) */}
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
                      {v.modelo} ({v.patente}){" "}
                      {v.apto_refrigeracion === 1 ? "❄️ [Apto Frío]" : ""}
                    </option>
                  ))}
                </select>
                {vehiculos.length === 0 && requiereFrio && (
                  <p className="text-[11px] text-rose-600 font-semibold mt-1">
                    ⚠️ No hay unidades refrigeradas libres en este momento.
                  </p>
                )}
              </div>

              {/* SELECTOR DE CHOFER */}
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
                  disabled={requiereFrio && vehiculos.length === 0}
                  className={`w-1/2 text-white font-semibold py-2 rounded-xl text-sm shadow-sm cursor-pointer ${
                    requiereFrio && vehiculos.length === 0
                      ? "bg-slate-300 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
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
