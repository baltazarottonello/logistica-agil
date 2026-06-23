import { useEffect, useState } from "react";
import API_URL from "../config/api.js";

export default function ChoferDashboard({ usuario }) {
  const [viaje, setViaje] = useState(null);
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);

  const cargarMiViaje = () => {
    setLoading(true);
    fetch(`${API_URL}/api/hojas-ruta/mi-viaje/${usuario?.id_usuario}`)
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
    let tituloPrompt = "";
    let htmlContenido = "";
    let prefijoObservacion = "";

    // Configuramos los formularios dinámicos según la acción
    if (nuevoEstadoId === 4) {
      tituloPrompt = 'Rechazar Pedido';
      prefijoObservacion = 'Motivo Rechazo: ';
      htmlContenido = `
        <p class="text-xs text-slate-500 mb-3 text-left">Escribí el motivo del rechazo del paquete:</p>
        <textarea id="swal-motivo" class="swal2-textarea w-full m-0 border border-slate-300 rounded-xl text-sm" style="margin:0; width:100%;" placeholder="Ej: Dirección incorrecta, el cliente lo rechazó..."></textarea>
      `;
    } else if (nuevoEstadoId === 1) {
      tituloPrompt = 'Cliente Ausente';
      prefijoObservacion = 'Ausencia: ';
      htmlContenido = `
        <p class="text-xs text-slate-500 mb-3 text-left">Dejá una nota sobre la ausencia para el sistema:</p>
        <textarea id="swal-motivo" class="swal2-textarea w-full m-0 border border-slate-300 rounded-xl text-sm" style="margin:0; width:100%;" placeholder="Ej: Nadie atendió el timbre, portería cerrada..."></textarea>
      `;
    } else if (nuevoEstadoId === 3) {
      tituloPrompt = 'Confirmar Entrega';
      prefijoObservacion = 'Entregado en conformidad a ';
      htmlContenido = `
        <p class="text-xs text-slate-500 mb-3 text-left">Ingresá los datos de recepción y solicita la firma digital simulada:</p>
        <div class="space-y-3 text-left">
          <input id="swal-receptor" class="swal2-input w-full m-0 border border-slate-300 rounded-xl text-sm" style="margin:0 0 12px 0; width:100%;" placeholder="Nombre, Apellido y DNI (Ej: Juan Pérez - 35.123.456)">
          
          <label class="block text-xs font-bold text-slate-700 mb-1">Firma Digital del Receptor (Simulada):</label>
          <div class="border border-dashed border-slate-300 bg-slate-50 p-4 rounded-xl text-center relative select-none">
            <span style="font-family: 'Courier New', Courier, monospace; font-size: 18px;" class="italic font-bold text-slate-400 tracking-widest block py-2" id="preview-firma">
              [ Presione el botón para firmar ]
            </span>
            <input type="hidden" id="swal-firma-check" value="false">
            <button type="button" id="btn-autofirma" class="mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] px-3 py-1.5 rounded-lg cursor-pointer transition-colors">
              ✍️ Estampar Firma Digital
            </button>
          </div>
        </div>
      `;
    }

    Swal.fire({
      title: tituloPrompt,
      html: htmlContenido,
      showCancelButton: true,
      confirmButtonColor: nuevoEstadoId === 3 ? '#10b981' : nuevoEstadoId === 4 ? '#f43f5e' : '#f59e0b',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Confirmar Registro',
      cancelButtonText: 'Cancelar',
      didOpen: () => {
        // Lógica interactiva para la firma ficticia dentro del modal
        if (nuevoEstadoId === 3) {
          const btnFirma = document.getElementById('btn-autofirma');
          const previewFirma = document.getElementById('preview-firma');
          const inputFirmaCheck = document.getElementById('swal-firma-check');
          const inputReceptor = document.getElementById('swal-receptor');

          btnFirma.addEventListener('click', () => {
            const nombre = inputReceptor.value.trim().split('-')[0] || "Cliente";
            if (!inputReceptor.value.trim()) {
              Swal.showValidationMessage('¡Escribí primero el Nombre y DNI del receptor para generar su firma!');
              return;
            }
            // Seteamos una firma ficticia estilizada
            previewFirma.innerHTML = `🖋️ ${nombre.toUpperCase()}`;
            previewFirma.classList.remove('text-slate-400');
            previewFirma.classList.add('text-blue-700', 'font-black');
            inputFirmaCheck.value = "true";
          });
        }
      },
      preConfirm: () => {
        if (nuevoEstadoId === 3) {
          const receptor = document.getElementById('swal-receptor').value;
          const firmado = document.getElementById('swal-firma-check').value;
          
          if (!receptor || receptor.trim() === "") {
            Swal.showValidationMessage('El campo Nombre y DNI es obligatorio.');
            return false;
          }
          if (firmado !== "true") {
            Swal.showValidationMessage('Por favor, solicita la estampa de la firma ficticia antes de continuar.');
            return false;
          }
          return { nota: receptor, extra: " - [Firmado Digitalmente]" };
        } else {
          const motivo = document.getElementById('swal-motivo').value;
          if (!motivo || motivo.trim() === "") {
            Swal.showValidationMessage('¡Este campo es obligatorio para registrar la novedad!');
            return false;
          }
          return { nota: motivo, extra: "" };
        }
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const { nota, extra } = result.value;

        // Petición al backend
        fetch(`${API_URL}/api/pedidos/${idPedido}/estado`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id_estado: nuevoEstadoId,
            recibido_por: nuevoEstadoId === 3 ? (nota + extra) : "N/A",
            observaciones: prefijoObservacion + nota
          }),
        })
        .then((res) => {
          if (!res.ok) throw new Error("Error al actualizar el estado.");
          
          Swal.fire({
            title: '¡Actualizado!',
            text: 'El estado del pedido se guardó correctamente.',
            icon: 'success',
            confirmButtonColor: '#3b82f6'
          });

          cargarMiViaje();
        })
        .catch((err) => {
          Swal.fire({
            title: 'Error',
            text: err.message,
            icon: 'error',
            confirmButtonColor: '#f43f5e'
          });
        });
      }
    });
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
            {p.id_estado !== 3 && p.id_estado !== 4 && (
              <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-100">
                <button
                  onClick={() => handleCambiarEstado(p.id_pedido, 4)}
                  className="py-2 bg-rose-50 text-rose-600 border border-rose-200 rounded-xl text-[11px] font-bold hover:bg-rose-100 cursor-pointer"
                >
                  ❌ Rechazado
                </button>

                <button
                  onClick={() => handleCambiarEstado(p.id_pedido, 1)}
                  className="py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-[11px] font-bold hover:bg-amber-100 cursor-pointer"
                >
                  🤷‍♂️ Ausente
                </button>

                <button
                  onClick={() => handleCambiarEstado(p.id_pedido, 3)}
                  className="py-2 bg-emerald-600 text-white font-bold rounded-xl text-[11px] hover:bg-emerald-700 shadow-sm cursor-pointer"
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