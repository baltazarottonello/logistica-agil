// controllers/vehiculoController.js
import db from "../config/db.js";

// Listar todos los vehículos
export const getVehiculos = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM vehiculos ORDER BY patente ASC;"
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Crear un nuevo vehículo
export const createVehiculo = async (req, res) => {
  const {
    patente,
    marca,
    modelo,
    apto_refrigeracion,
    capacidad_kg,
    capacidad_m3,
  } = req.body;

  // Validación básica del campo requerido principal
  if (!patente || patente.trim() === "") {
    return res
      .status(400)
      .json({ error: "La patente es un campo obligatorio." });
  }

  try {
    // Normalizamos el valor booleano/numérico/string para la base de datos
    // Esto previene que "false" (string) o undefined se guarden mal
    const esAptoFrio =
      apto_refrigeracion === true ||
      apto_refrigeracion === 1 ||
      apto_refrigeracion === "true" ||
      apto_refrigeracion === "1"
        ? 1
        : 0;

    const query = `
      INSERT INTO vehiculos (patente, marca, modelo, apto_refrigeracion, capacidad_kg, capacidad_m3, activo)
      VALUES (?, ?, ?, ?, ?, ?, TRUE);
    `;

    const [result] = await db.query(query, [
      patente.trim().toUpperCase(), // Normalizamos la patente a mayúsculas y sin espacios
      marca || null,
      modelo || null,
      esAptoFrio,
      capacidad_kg ? parseFloat(capacidad_kg) : null, // Nos aseguramos de enviar números válidos o null
      capacidad_m3 ? parseFloat(capacidad_m3) : null,
    ]);

    res.status(201).json({
      message: "Vehículo registrado con éxito.",
      id_vehiculo: result.insertId,
    });
  } catch (error) {
    // Capturamos si el error es por duplicado de Patente (Error ER_DUP_ENTRY en MySQL)
    if (error.code === "ER_DUP_ENTRY") {
      return res
        .status(400)
        .json({
          error: `La patente ${patente} ya se encuentra registrada en el sistema.`,
        });
    }

    res.status(500).json({ error: error.message });
  }
};

// Modificar un vehículo existente
export const updateVehiculo = async (req, res) => {
  const { id } = req.params;
  const {
    patente,
    marca,
    modelo,
    apto_refrigeracion,
    capacidad_kg,
    capacidad_m3,
    activo,
  } = req.body;

  try {
    const query = `
      UPDATE vehiculos 
      SET patente = ?, marca = ?, modelo = ?, apto_refrigeracion = ?, capacidad_kg = ?, capacidad_m3 = ?, activo = ?
      WHERE id_vehiculo = ?;
    `;
    const [result] = await db.query(query, [
      patente,
      marca || null,
      modelo || null,
      apto_refrigeracion ? 1 : 0,
      capacidad_kg || null,
      capacidad_m3 || null,
      activo !== undefined ? activo : true,
      id,
    ]);

    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Vehículo no encontrado." });
    res.json({ message: "Vehículo actualizado de forma correcta." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Eliminar un vehículo
export const deleteVehiculo = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query(
      "DELETE FROM vehiculos WHERE id_vehiculo = ?;",
      [id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Vehículo no encontrado." });
    res.json({ message: "Vehículo eliminado permanentemente." });
  } catch (error) {
    res.status(500).json({
      error:
        "No se puede eliminar el vehículo porque está asignado a Hojas de Ruta activas.",
    });
  }
};
