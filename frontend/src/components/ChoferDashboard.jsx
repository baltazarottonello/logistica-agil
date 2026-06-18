import { useEffect, useState } from "react";

export default function ChoferDashboard({ usuario }) {
  const [viaje, setViaje] = useState(null);
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);

  const cargarMiViaje = () => {
    setLoading(true);
    fetch(
      `http://localhost:5000/api/hojas-ruta/mi-viaje/${usuario?.id_usuario}`
    )
      .then((res) => res.json())
      .then((data) => {
        setViaje(data.hoja);
        setPedidos(data.pedidos);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (usuario?.id_usuario) cargarMiViaje();
  }, [usuario]);

  const handleCambiarEstado = (idPedido, nuevoEstadoId) => {
    let nota = "";

    if (nuevoEstadoId === 4) {
      nota = prompt("Escribí el motivo del rechazo:");
      if (nota === null) return; // 🚨 Frenar si presionó "Cancelar"
      if (nota.trim() === "") {
        alert("Debes ingresar un motivo para rechazar el pedido.");
        return; // 🚨 Frenar si aceptó pero lo dejó vacío
      }
    } else if (nuevoEstadoId === 1) {
      nota = prompt("Dejá una nota sobre la ausencia (ej: nadie atendió):");
      if (nota === null) return; // 🚨 Frenar si presionó "Cancelar"
      if (nota.trim() === "") nota = "Cliente ausente"; // Valor por defecto si aceptó vacío
    } else if (nuevoEstadoId === 3) {
      nota = prompt("Ingresá Nombre y Apellido de quien recibe:");
      if (nota === null) return; // 🚨 Frenar si presionó "Cancelar"
      if (nota.trim() === "") {
        alert(
          "Debes ingresar el nombre de quien recibe para completar la entrega."
        );
        return; // 🚨 Frenar si aceptó pero lo dejó vacío
      }
    }

    // Ahora sí, la petición solo se hace si pasó los filtros de arriba
    fetch(`http://localhost:5000/api/pedidos/${idPedido}/estado`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id_estado: nuevoEstadoId,
        recibido_por: nuevoEstadoId === 3 ? nota : "N/A",
        observaciones:
          nuevoEstadoId === 1
            ? `Ausencia: ${nota}`
            : nuevoEstadoId === 4
            ? `Motivo: ${nota}`
            : `Entregado en conformidad a ${nota}.`,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Error al actualizar el estado.");
        alert("✅ Estado registrado en el sistema.");
        cargarMiViaje(); // Recarga la lista
      })
      .catch((err) => alert(err.message));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!viaje) {
    return (
      <div className="p-6 max-w-md mx-auto text-center mt-12 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <span className="text-4xl">🚚</span>
        <h3 className="text-lg font-bold text-slate-900 mt-4">
          No tenés viajes asignados
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          Cuando administración planifique una hoja de ruta para vos, va a
          figurar acá.
        </p>
      </div>
    );
  }

  return (
    <main className="p-4 max-w-md mx-auto font-sans bg-slate-50 min-h-screen pb-12">
      {/* Cabecera del Chofer */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-4">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
              Tu viaje activo
            </span>
            <h2 className="text-xl font-black text-slate-900 mt-0.5">
              Hoja #{viaje.id_hoja_ruta}
            </h2>
          </div>
          <span className="bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold px-2.5 py-1 rounded-full">
            {viaje.estado_hoja}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600">
          <div>
            <span className="block text-slate-400 font-medium">Vehículo:</span>
            <span className="font-semibold text-slate-800">{viaje.modelo}</span>
          </div>
          <div>
            <span className="block text-slate-400 font-medium">Patente:</span>
            <span className="font-mono font-semibold text-slate-800 uppercase">
              {viaje.patente}
            </span>
          </div>
        </div>
      </div>

      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-1">
        Hoja de Ruta / Puntos de Entrega ({pedidos.length})
      </h3>

      {/* Lista de Pedidos en formato Tarjeta (Mobile Friendly) */}
      <div className="space-y-3">
        {pedidos.map((p, index) => (
          <div
            key={p.id_pedido}
            className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3"
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-2">
                <span className="flex items-center justify-center bg-slate-900 text-white font-black text-xs rounded-full h-5 w-5">
                  {index + 1}
                </span>
                <span className="font-bold text-slate-900 text-sm">
                  Ped. #{p.id_pedido}
                </span>
              </div>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                  p.id_estado === 3
                    ? "bg-emerald-100 text-emerald-800"
                    : p.id_estado === 4
                    ? "bg-rose-100 text-rose-800"
                    : "bg-blue-100 text-blue-800"
                }`}
              >
                {p.estado_pedido}
              </span>
            </div>

            <div>
              <span className="block text-xs text-slate-400">
                Destinatario:
              </span>
              <span className="text-sm font-bold text-slate-800">
                {p.cliente_destinatario}
              </span>
            </div>

            <div>
              <span className="block text-xs text-slate-400">
                Dirección de Entrega:
              </span>
              <span className="text-sm font-semibold text-slate-700">
                {p.direccion_entrega}
              </span>
            </div>

            {p.observaciones && (
              <div className="bg-slate-50 p-2 rounded-lg text-xs text-slate-500 italic">
                Nota: {p.observaciones}
              </div>
            )}

            {/* BOTONES DE ACCIÓN PARA EL CHOFER */}
            {p.id_estado === 1 && (
              <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-100">
                <button
                  onClick={() => handleCambiarEstado(p.id_pedido, 3)} // Rechazado
                  className="py-2 bg-rose-50 text-rose-600 border border-rose-200 rounded-xl text-[11px] font-bold hover:bg-rose-100"
                >
                  ❌ Rechazado
                </button>

                <button
                  onClick={() => handleCambiarEstado(p.id_pedido, 4)} // Ausente
                  className="py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-[11px] font-bold hover:bg-amber-100"
                >
                  🤷‍♂️ Ausente
                </button>

                <button
                  onClick={() => handleCambiarEstado(p.id_pedido, 2)} // Entregado
                  className="py-2 bg-emerald-600 text-white font-bold rounded-xl text-[11px] hover:bg-emerald-700 shadow-sm"
                >
                  ✅ Entregado
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
