// controllers/clienteController.js
import db from "../config/db.js";

// Listar todos los clientes
export const getClientes = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM clientes ORDER BY razon_social ASC;"
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Crear un nuevo cliente
export const createCliente = async (req, res) => {
  const { razon_social, cuit, telefono, email, direccion, codigo_postal } =
    req.body;

  try {
    const query = `
      INSERT INTO clientes (razon_social, cuit, telefono, email, direccion, codigo_postal, activo)
      VALUES (?, ?, ?, ?, ?, ?, TRUE);
    `;
    const [result] = await db.query(query, [
      razon_social,
      cuit,
      telefono,
      email,
      direccion,
      codigo_postal,
    ]);
    res
      .status(201)
      .json({
        message: "Cliente registrado con éxito.",
        id_cliente: result.insertId,
      });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Modificar un cliente existente
export const updateCliente = async (req, res) => {
  const { id } = req.params;
  const {
    razon_social,
    cuit,
    telefono,
    email,
    direccion,
    codigo_postal,
    activo,
  } = req.body;

  try {
    const query = `
      UPDATE clientes 
      SET razon_social = ?, cuit = ?, telefono = ?, email = ?, direccion = ?, codigo_postal = ?, activo = ?
      WHERE id_cliente = ?;
    `;
    const [result] = await db.query(query, [
      razon_social,
      cuit,
      telefono,
      email,
      direccion,
      codigo_postal,
      activo !== undefined ? activo : true,
      id,
    ]);

    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Cliente no encontrado." });
    res.json({ message: "Cliente actualizado de forma correcta." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Eliminar (o dar de baja lógica) un cliente
export const deleteCliente = async (req, res) => {
  const { id } = req.params;
  try {
    // Al ser una prueba, puedes usar DELETE físico.
    // Si tuviera pedidos asociados, daría error de FK, lo cual es correcto por seguridad.
    const [result] = await db.query(
      "DELETE FROM clientes WHERE id_cliente = ?;",
      [id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Cliente no encontrado." });
    res.json({ message: "Cliente eliminado permanentemente." });
  } catch (error) {
    res
      .status(500)
      .json({
        error:
          "No se puede eliminar el cliente porque tiene transacciones asociadas (Pedidos).",
      });
  }
};
