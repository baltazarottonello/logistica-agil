import db from "../config/db.js";

export const getHojasRuta = async (req, res) => {
  try {
    const query = `
      SELECT 
        hr.id_hoja_ruta,
        CONCAT(u.nombre, ' ', u.apellido) AS chofer_nombre,
        v.patente,
        v.modelo,
        ehr.nombre AS estado,
        hr.fecha_salida,
        hr.observaciones
      FROM hojas_ruta hr
      JOIN choferes c ON hr.id_chofer = c.id_chofer
      JOIN usuarios u ON c.id_usuario = u.id_usuario
      JOIN vehiculos v ON hr.id_vehiculo = v.id_vehiculo
      JOIN estados_hoja_ruta ehr ON hr.id_estado_hoja = ehr.id_estado_hoja
      ORDER BY hr.fecha_salida DESC;
    `;
    const [rows] = await db.query(query);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createHojaRuta = async (req, res) => {
  const {
    id_chofer,
    id_vehiculo,
    id_estado_hoja,
    fecha_salida,
    observaciones,
    id_pedidos,
  } = req.body;

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    if (id_pedidos && id_pedidos.length > 0) {
      const idsSolo = id_pedidos.map((p) => p.id_pedido);

      // =========================================================
      // NUEVA VALIDACIÓN: VERIFICAR QUE NINGÚN PEDIDO ESTÉ ASIGNADO
      // =========================================================
      const [pedidosAsignados] = await connection.query(
        `SELECT id_pedido FROM pedidos WHERE id_pedido IN (?) AND id_estado = 5;`,
        [idsSolo]
      );

      if (pedidosAsignados.length > 0) {
        const idsConflictivos = pedidosAsignados
          .map((p) => p.id_pedido)
          .join(", ");
        throw new Error(
          `Conflicto de asignación: Los siguientes pedidos ya pertenecen a otra hoja de ruta activa: #${idsConflictivos}`
        );
      }

      // =========================================================
      // 1. VALIDACIÓN DINÁMICA DE LA CADENA DE FRÍO (LO QUE YA TENÍAS)
      // =========================================================
      const [categoriaRows] = await connection.query(
        `SELECT COUNT(*) AS cuenta FROM pedido_categoria pc 
         JOIN categorias_producto cp ON pc.id_categoria = cp.id_categoria
         WHERE pc.id_pedido IN (?) AND cp.requiere_frio = 1;`,
        [idsSolo]
      );

      if (categoriaRows[0].cuenta > 0) {
        const [vehiculoRows] = await connection.query(
          "SELECT apto_refrigeracion FROM vehiculos WHERE id_vehiculo = ?;",
          [id_vehiculo]
        );
        if (
          vehiculoRows.length === 0 ||
          vehiculoRows[0].apto_refrigeracion !== 1
        ) {
          throw new Error(
            "Contradicción de carga: Los pedidos seleccionados requieren un vehículo con refrigeración activa."
          );
        }
      }
    }

    // =========================================================
    // 2. INSERTAR HOJA DE RUTA
    // =========================================================
    const queryHR = `
      INSERT INTO hojas_ruta (id_chofer, id_vehiculo, id_estado_hoja, fecha_salida, observaciones)
      VALUES (?, ?, ?, ?, ?)
    `;
    const [resultHR] = await connection.query(queryHR, [
      id_chofer,
      id_vehiculo,
      id_estado_hoja || 1, // Fallback por si llega vacío desde el formulario de creación
      fecha_salida,
      observaciones,
    ]);
    const id_hoja_ruta = resultHR.insertId;

    // =========================================================
    // 3. VINCULAR PEDIDOS CON SU RESPECTIVO ORDEN DE VISITA
    // =========================================================
    if (id_pedidos && id_pedidos.length > 0) {
      // Estructuramos una matriz bidimensional para el INSERT masivo: [ [id_hr, id_p, orden], [id_hr, id_p, orden] ]
      const valoresIntermedia = id_pedidos.map((p) => [
        id_hoja_ruta,
        p.id_pedido,
        p.orden_visita,
      ]);

      const queryIntermedia = `INSERT INTO hoja_ruta_pedido (id_hoja_ruta, id_pedido, orden_visita) VALUES ?`;
      await connection.query(queryIntermedia, [valoresIntermedia]);

      // Pasamos masivamente los pedidos tildados a estado 'Asignado' (5)
      const idsSolo = id_pedidos.map((p) => p.id_pedido);
      const queryEstadoPedido = `UPDATE pedidos SET id_estado = 5 WHERE id_pedido IN (?)`;
      await connection.query(queryEstadoPedido, [idsSolo]);
    }

    await connection.commit();
    res
      .status(201)
      .json({ id: id_hoja_ruta, message: "Hoja de ruta creada exitosamente." });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
};

export const getChoferesActivos = async (req, res) => {
  try {
    const { id_hoja_ruta } = req.query;

    const query = `
      SELECT c.id_chofer, u.nombre, u.apellido 
      FROM choferes c
      INNER JOIN usuarios u ON c.id_usuario = u.id_usuario
      WHERE c.activo = 1 
        AND (
          c.id_chofer NOT IN (
            SELECT id_chofer FROM hojas_ruta WHERE id_estado_hoja IN (1, 2) AND id_chofer IS NOT NULL
          )
          ${
            id_hoja_ruta
              ? "OR c.id_chofer = (SELECT id_chofer FROM hojas_ruta WHERE id_hoja_ruta = ?)"
              : ""
          }
        )
      ORDER BY u.apellido, u.nombre ASC;
    `;

    const params = id_hoja_ruta ? [id_hoja_ruta] : [];
    const [choferes] = await db.query(query, params);

    res.json(choferes);
  } catch (error) {
    console.error("Error en getChoferesActivos:", error);
    res.status(500).json({ message: "Error al obtener choferes activos" });
  }
};
// Obtener vehículos activos para el formulario
export const getVehiculosActivos = async (req, res) => {
  try {
    const { requiereFrio, id_hoja_ruta } = req.query;

    // Si requiereFrio es 'true', filtramos por apto_refrigeracion = 1
    const filtroFrio =
      requiereFrio === "true" ? "AND v.apto_refrigeracion = 1" : "";

    const query = `
      SELECT v.id_vehiculo, v.patente, v.marca, v.modelo, v.capacidad_kg, v.apto_refrigeracion
      FROM vehiculos v
      WHERE v.activo = 1 
        ${filtroFrio}
        AND (
          v.id_vehiculo NOT IN (
            SELECT id_vehiculo FROM hojas_ruta WHERE id_estado_hoja IN (1, 2) AND id_vehiculo IS NOT NULL
          )
          ${
            id_hoja_ruta
              ? "OR v.id_vehiculo = (SELECT id_vehiculo FROM hojas_ruta WHERE id_hoja_ruta = ?)"
              : ""
          }
        )
      ORDER BY v.patente ASC;
    `;

    const params = id_hoja_ruta ? [id_hoja_ruta] : [];
    const [vehiculos] = await db.query(query, params);

    res.json(vehiculos);
  } catch (error) {
    console.error("Error en getVehiculosActivos:", error);
    res.status(500).json({ message: "Error al obtener vehículos activos" });
  }
};

export const updateHojaRuta = async (req, res) => {
  const { id } = req.params;
  const {
    id_chofer,
    id_vehiculo,
    id_estado_hoja,
    fecha_salida,
    fecha_estimada_regreso,
    observaciones,
    id_pedidos, // Array de objetos: [{ id_pedido: X, orden_visita: Y }]
  } = req.body;

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // =========================================================
    // 1. VALIDACIÓN DINÁMICA DE LA CADENA DE FRÍO
    // =========================================================
    if (id_pedidos && id_pedidos.length > 0) {
      const idsSolo = id_pedidos.map((p) => p.id_pedido);

      const [categoriaRows] = await connection.query(
        `
        SELECT COUNT(*) AS cuenta
        FROM pedido_categoria pc
        JOIN categorias_producto cp ON pc.id_categoria = cp.id_categoria
        WHERE pc.id_pedido IN (?) AND cp.requiere_frio = 1;
      `,
        [idsSolo]
      );

      const requiereFrio = categoriaRows[0].cuenta > 0;

      if (requiereFrio) {
        const [vehiculoRows] = await connection.query(
          "SELECT apto_refrigeracion FROM vehiculos WHERE id_vehiculo = ?;",
          [id_vehiculo]
        );

        if (
          vehiculoRows.length === 0 ||
          vehiculoRows[0].apto_refrigeracion !== 1
        ) {
          throw new Error(
            "Contradicción de carga: Uno o más pedidos requieren refrigeración activa y el vehículo seleccionado no es apto."
          );
        }
      }
    }

    // =========================================================
    // 2. ACTUALIZAR DATOS PRINCIPALES DE LA HOJA DE RUTA
    // =========================================================
    const queryHR = `
      UPDATE hojas_ruta 
      SET id_chofer = ?, id_vehiculo = ?, id_estado_hoja = ?, fecha_salida = ?, fecha_estimada_regreso = ?, observaciones = ?
      WHERE id_hoja_ruta = ?;
    `;
    await connection.query(queryHR, [
      id_chofer,
      id_vehiculo,
      id_estado_hoja,
      fecha_salida,
      fecha_estimada_regreso,
      observaciones,
      id,
    ]);

    // =========================================================
    // 3. REESTRUCTURAR MAPEO DE PEDIDOS Y SUS ESTADOS LOGÍSTICOS
    // =========================================================
    if (id_pedidos !== undefined) {
      // Liberamos temporalmente todos los pedidos viejos de esta hoja pasándolos a 'Pendiente' (1)
      await connection.query(
        `
        UPDATE pedidos 
        SET id_estado = 1 
        WHERE id_pedido IN (
          SELECT id_pedido FROM hoja_ruta_pedido WHERE id_hoja_ruta = ?
        );
      `,
        [id]
      );

      // Borramos los registros de la tabla intermedia para sobreescribirlos
      await connection.query(
        "DELETE FROM hoja_ruta_pedido WHERE id_hoja_ruta = ?",
        [id]
      );

      // Si quedaron o se agregaron pedidos al listado, los guardamos con el nuevo orden
      if (id_pedidos.length > 0) {
        const valoresIntermedia = id_pedidos.map((p) => [
          id,
          p.id_pedido,
          p.orden_visita,
        ]);
        const queryIntermedia = `INSERT INTO hoja_ruta_pedido (id_hoja_ruta, id_pedido, orden_visita) VALUES ?`;
        await connection.query(queryIntermedia, [valoresIntermedia]);

        // Aseguramos que el conjunto definitivo quede en estado 'Asignado' (5)
        const idsSolo = id_pedidos.map((p) => p.id_pedido);
        const queryEstadoPedido = `UPDATE pedidos SET id_estado = 5 WHERE id_pedido IN (?)`;
        await connection.query(queryEstadoPedido, [idsSolo]);
      }
    }

    await connection.commit();
    res.json({
      message: "Hoja de ruta y orden de visitas actualizados con éxito.",
    });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
};

// 5. Eliminar Hoja de Ruta
export const deleteHojaRuta = async (req, res) => {
  const { id } = req.params;

  try {
    // Gracias al ON DELETE CASCADE en 'hoja_ruta_pedido', esto es seguro y limpio
    const [result] = await db.query(
      "DELETE FROM hojas_ruta WHERE id_hoja_ruta = ?;",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Hoja de ruta no encontrada." });
    }

    res.json({ message: "Hoja de ruta eliminada permanentemente." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getMiHojaRutaActiva = async (req, res) => {
  const { id_usuario } = req.params;

  try {
    // 1. Buscamos la hoja de ruta basándonos en el id_usuario del chofer logueado
    const queryHoja = `
      SELECT 
        hr.id_hoja_ruta, hr.fecha_salida, hr.observaciones,
        ehr.nombre AS estado_hoja,
        v.modelo, v.patente
      FROM hojas_ruta hr
      JOIN estados_hoja_ruta ehr ON hr.id_estado_hoja = ehr.id_estado_hoja
      JOIN vehiculos v ON hr.id_vehiculo = v.id_vehiculo
      JOIN choferes c ON hr.id_chofer = c.id_chofer
      WHERE c.id_usuario = ?
        AND hr.id_estado_hoja IN (1, 2) -- 1: Planificada, 2: En Curso
      ORDER BY hr.fecha_salida ASC
      LIMIT 1;
    `;

    const [hojas] = await db.query(queryHoja, [id_usuario]);

    if (hojas.length === 0) {
      return res.json({ hoja: null, pedidos: [] });
    }

    const hojaActiva = hojas[0];

    // 2. Buscamos los pedidos vinculados a través de la tabla intermedia 'hoja_ruta_pedido'
    const queryPedidos = `
      SELECT 
        p.id_pedido, p.direccion_entrega, p.peso_kg, p.observaciones,
        c.razon_social AS cliente_destinatario,
        ep.nombre AS estado_pedido, p.id_estado,
        hrp.orden_visita
      FROM hoja_ruta_pedido hrp
      JOIN pedidos p ON hrp.id_pedido = p.id_pedido
      JOIN clientes c ON p.id_cliente_destinatario = c.id_cliente
      JOIN estados_pedido ep ON p.id_estado = ep.id_estado
      WHERE hrp.id_hoja_ruta = ?
      ORDER BY hrp.orden_visita ASC;
    `;

    const [pedidos] = await db.query(queryPedidos, [hojaActiva.id_hoja_ruta]);

    res.json({ hoja: hojaActiva, pedidos });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getPedidosDetalleAdmin = async (req, res) => {
  const { id } = req.params; // id_hoja_ruta

  try {
    const query = `
      SELECT 
        p.id_pedido, 
        p.direccion_entrega, 
        p.peso_kg, 
        p.volumen_m3, 
        p.observaciones AS obs_pedido,
        c.razon_social AS cliente_destinatario,
        ep.nombre AS estado_general, 
        p.id_estado,
        hrp.orden_visita,
        
        -- Información fina de la entrega (Auditoría para el Administrador)
        e.fecha_entrega, 
        e.recibido_por, 
        e.observaciones AS obs_chofer, 
        e.recibo_emitido,
        ee.nombre AS sub_estado_entrega,
        -- Convertimos el LONGBLOB de la firma en un string legible para el Front
        CONVERT(e.firma_digital USING utf8mb4) AS firma_simulada
        
      FROM hoja_ruta_pedido hrp
      JOIN pedidos p ON hrp.id_pedido = p.id_pedido
      JOIN clientes c ON p.id_cliente_destinatario = c.id_cliente
      JOIN estados_pedido ep ON p.id_estado = ep.id_estado
      LEFT JOIN entregas e ON p.id_pedido = e.id_pedido
      LEFT JOIN estados_entrega ee ON e.id_estado_entrega = ee.id_estado_entrega
      WHERE hrp.id_hoja_ruta = ? 
      ORDER BY hrp.orden_visita ASC;
    `;

    const [pedidos] = await db.query(query, [id]);
    res.json(pedidos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
