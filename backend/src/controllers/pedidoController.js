import db from "../config/db.js";

// 1. Obtener todos los pedidos (Agrupando sus categorías por ID y Nombre)
export const getPedidos = async (req, res) => {
  try {
    const query = `
      SELECT 
        p.id_pedido, p.direccion_entrega, p.volumen_m3, p.peso_kg, p.fecha_registro, p.observaciones,
        p.id_cliente_remitente, p.id_cliente_destinatario, p.id_estado,
        cr.razon_social AS remitente, 
        cd.razon_social AS destinatario,
        ep.nombre AS estado,
        GROUP_CONCAT(cp.nombre SEPARATOR ', ') AS categorias,
        GROUP_CONCAT(cp.id_categoria) AS ids_categorias
      FROM pedidos p
      JOIN clientes cr ON p.id_cliente_remitente = cr.id_cliente
      JOIN clientes cd ON p.id_cliente_destinatario = cd.id_cliente
      JOIN estados_pedido ep ON p.id_estado = ep.id_estado
      LEFT JOIN pedido_categoria pc ON p.id_pedido = pc.id_pedido
      LEFT JOIN categorias_producto cp ON pc.id_categoria = cp.id_categoria
      GROUP BY p.id_pedido
      ORDER BY p.fecha_registro DESC;
    `;
    const [rows] = await db.query(query);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 2. Obtener dependencias (Traemos la lista de tu tabla real 'categorias_producto')
export const getFormDependencias = async (req, res) => {
  try {
    const [clientes] = await db.query(
      "SELECT id_cliente, razon_social FROM clientes WHERE activo = 1;"
    );
    const [estados] = await db.query(
      "SELECT id_estado, nombre FROM estados_pedido;"
    );
    const [categorias] = await db.query(
      "SELECT id_categoria, nombre FROM categorias_producto;"
    );

    res.json({ clientes, estados, categorias });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 3. Crear Pedido con transacciones (Inserta en pedidos y en pedido_categoria)
export const createPedido = async (req, res) => {
  const {
    id_cliente_remitente,
    id_cliente_destinatario,
    id_estado,
    categoriasSeleccionadas,
    direccion_entrega,
    volumen_m3,
    peso_kg,
    observaciones,
  } = req.body;
  const connection = await db.getConnection(); // Requerido para transacciones

  try {
    await connection.beginTransaction();

    const queryPedido = `
      INSERT INTO pedidos (id_cliente_remitente, id_cliente_destinatario, id_estado, id_usuario_creador, direccion_entrega, volumen_m3, peso_kg, observaciones)
      VALUES (?, ?, ?, 1, ?, ?, ?, ?);
    `;
    const [resultPedido] = await connection.query(queryPedido, [
      id_cliente_remitente,
      id_cliente_destinatario,
      id_estado || 1,
      direccion_entrega,
      volumen_m3 || null,
      peso_kg || null,
      observaciones || null,
    ]);

    const id_pedido = resultPedido.insertId;

    // Insertar las categorías vinculadas en la tabla intermedia
    if (categoriasSeleccionadas && categoriasSeleccionadas.length > 0) {
      const values = categoriasSeleccionadas.map((id_cat) => [
        id_pedido,
        id_cat,
      ]);
      await connection.query(
        "INSERT INTO pedido_categoria (id_pedido, id_categoria) VALUES ?;",
        [values]
      );
    }

    await connection.commit();
    res
      .status(201)
      .json({ message: "Pedido registrado con éxito.", id_pedido });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
};

// 4. Modificar Pedido (Actualiza datos básicos y sincroniza la tabla intermedia)
export const updatePedido = async (req, res) => {
  const { id } = req.params;
  const {
    id_cliente_remitente,
    id_cliente_destinatario,
    id_estado,
    categoriasSeleccionadas,
    direccion_entrega,
    volumen_m3,
    peso_kg,
    observaciones,
  } = req.body;
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const queryPedido = `
      UPDATE pedidos 
      SET id_cliente_remitente = ?, id_cliente_destinatario = ?, id_estado = ?, direccion_entrega = ?, volumen_m3 = ?, peso_kg = ?, observaciones = ?
      WHERE id_pedido = ?;
    `;
    await connection.query(queryPedido, [
      id_cliente_remitente,
      id_cliente_destinatario,
      id_estado,
      direccion_entrega,
      volumen_m3,
      peso_kg,
      observaciones,
      id,
    ]);

    // Sincronizar categorías: Borramos las anteriores y reinsertamos las nuevas selecciones
    await connection.query(
      "DELETE FROM pedido_categoria WHERE id_pedido = ?;",
      [id]
    );
    if (categoriasSeleccionadas && categoriasSeleccionadas.length > 0) {
      const values = categoriasSeleccionadas.map((id_cat) => [id, id_cat]);
      await connection.query(
        "INSERT INTO pedido_categoria (id_pedido, id_categoria) VALUES ?;",
        [values]
      );
    }

    await connection.commit();
    res.json({ message: "Pedido actualizado de forma correcta." });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
};

// 5. Eliminar Pedido (Tu tabla intermedia tiene ON DELETE CASCADE, por lo que borrar aquí es limpio)
export const deletePedido = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query(
      "DELETE FROM pedidos WHERE id_pedido = ?;",
      [id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Pedido no encontrado." });
    res.json({ message: "Pedido eliminado permanentemente." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
