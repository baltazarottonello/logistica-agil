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
  } = req.body;
  try {
    const query = `
      INSERT INTO hojas_ruta (id_chofer, id_vehiculo, id_estado_hoja, fecha_salida, observaciones)
      VALUES (?, ?, ?, ?, ?)
    `;
    const [result] = await db.query(query, [
      id_chofer,
      id_vehiculo,
      id_estado_hoja,
      fecha_salida,
      observaciones,
    ]);
    res
      .status(201)
      .json({ id: result.insertId, message: "Hoja de ruta creada con éxito." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getChoferesActivos = async (req, res) => {
  try {
    const query = `
      SELECT c.id_chofer, CONCAT(u.nombre, ' ', u.apellido) AS nombre 
      FROM choferes c
      JOIN usuarios u ON c.id_usuario = u.id_usuario
      WHERE c.activo = 1;
    `;
    const [rows] = await db.query(query);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener vehículos activos para el formulario
export const getVehiculosActivos = async (req, res) => {
  try {
    const query =
      "SELECT id_vehiculo, modelo, patente FROM vehiculos WHERE activo = 1;";
    const [rows] = await db.query(query);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 4. Modificar Hoja de Ruta
export const updateHojaRuta = async (req, res) => {
  const { id } = req.params;
  const {
    id_chofer,
    id_vehiculo,
    id_estado_hoja,
    fecha_salida,
    fecha_estimada_regreso,
    observaciones,
  } = req.body;

  try {
    const query = `
      UPDATE hojas_ruta 
      SET id_chofer = ?, id_vehiculo = ?, id_estado_hoja = ?, fecha_salida = ?, fecha_estimada_regreso = ?, observaciones = ?
      WHERE id_hoja_ruta = ?;
    `;

    const [result] = await db.query(query, [
      id_chofer,
      id_vehiculo,
      id_estado_hoja,
      fecha_salida,
      fecha_estimada_regreso,
      observaciones,
      id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Hoja de ruta no encontrada." });
    }

    res.json({ message: "Hoja de ruta actualizada con éxito." });
  } catch (error) {
    res.status(500).json({ error: error.message });
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
