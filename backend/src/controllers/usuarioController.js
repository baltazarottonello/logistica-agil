import db from "../config/db.js";

// 1. Obtener todos los usuarios con sus roles (para la tabla del Admin)
export const getUsuarios = async (req, res) => {
  try {
    const query = `
       SELECT 
        u.id_usuario, u.nombre, u.apellido, u.email, u.activo, u.fecha_creacion,
        GROUP_CONCAT(r.nombre SEPARATOR ', ') AS roles,
        MIN(ur.id_rol) AS id_rol,
        c.dni, c.licencia_conducir, c.telefono
      FROM usuarios u
      LEFT JOIN usuario_rol ur ON u.id_usuario = ur.id_usuario
      LEFT JOIN roles r ON ur.id_rol = r.id_rol
      LEFT JOIN choferes c ON u.id_usuario = c.id_usuario
      GROUP BY u.id_usuario, c.dni, c.licencia_conducir, c.telefono
      ORDER BY u.fecha_creacion DESC;
      `;
    const [rows] = await db.query(query);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 2. Obtener todos los roles disponibles (para el select del formulario)
export const getRoles = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT id_rol, nombre FROM roles;");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 3. Crear Usuario + Asignar Rol (Con Transacción)
export const createUsuario = async (req, res) => {
  const {
    nombre,
    apellido,
    email,
    password,
    id_rol,
    dni,
    licencia_conducir,
    telefono,
  } = req.body;

  // Validación preventiva para que no falle la base de datos por campos incompletos
  if (!nombre || !apellido || !email || !password || !id_rol) {
    return res
      .status(400)
      .json({ error: "Todos los campos son obligatorios." });
  }

  if (parseInt(id_rol) === 3 && (!dni || !licencia_conducir || !telefono)) {
    return res.status(400).json({
      error: "Los datos de chofer (DNI, licencia, teléfono) son obligatorios.",
    });
  }

  // Obtenemos una conexión exclusiva para la transacción desde el Pool
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction(); // Iniciamos la transacción

    // Guardamos la contraseña procesada correctamente.
    // NOTA: Si tu Login usa la librería 'bcrypt' para comparar,
    // debes importar bcrypt arriba de todo y cambiar esta línea por:
    // const passwordFinal = await bcrypt.hash(password, 10);
    const passwordFinal = `${password}`;

    // Insertar en la tabla 'usuarios'
    const queryUsuario = `
      INSERT INTO usuarios (nombre, apellido, email, password_hash, activo)
      VALUES (?, ?, ?, ?, 1);
    `;
    const [resultUsuario] = await connection.query(queryUsuario, [
      nombre,
      apellido,
      email,
      passwordFinal,
    ]);
    const nuevoIdUsuario = resultUsuario.insertId;

    // Insertar en la tabla intermedia 'usuario_rol'
    const queryRol = `
      INSERT INTO usuario_rol (id_usuario, id_rol)
      VALUES (?, ?);
    `;
    await connection.query(queryRol, [nuevoIdUsuario, id_rol]);

    if (parseInt(id_rol) === 3) {
      await connection.query(
        `INSERT INTO choferes (id_usuario, dni, licencia_conducir, telefono, email, activo) VALUES (?, ?, ?, ?, ?, 1)`,
        [nuevoIdUsuario, dni, licencia_conducir, telefono, email]
      );
    }

    await connection.commit(); // Si todo salió bien, guardamos los cambios de forma permanente
    res.status(201).json({
      message: "Usuario y Rol creados con éxito.",
      id_usuario: nuevoIdUsuario,
    });
  } catch (error) {
    await connection.rollback(); // Si algo falló, deshacemos todo para no dejar datos huérfanos
    res.status(500).json({ error: error.message });
  } finally {
    connection.release(); // Liberamos la conexión de vuelta al Pool
  }
};

// 4. Modificar Usuario y su Rol (Con Transacción)
export const updateUsuario = async (req, res) => {
  const { id } = req.params;
  const { nombre, apellido, email, id_rol, activo } = req.body;
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Actualizar datos básicos del usuario
    const queryUsuario = `
      UPDATE usuarios 
      SET nombre = ?, apellido = ?, email = ?, activo = ? 
      WHERE id_usuario = ?;
    `;
    await connection.query(queryUsuario, [nombre, apellido, email, activo, id]);

    // Actualizar el rol en la tabla intermedia (Borramos el anterior y ponemos el nuevo)
    await connection.query("DELETE FROM usuario_rol WHERE id_usuario = ?;", [
      id,
    ]);
    await connection.query(
      "INSERT INTO usuario_rol (id_usuario, id_rol) VALUES (?, ?);",
      [id, id_rol]
    );

    await connection.commit();
    res.json({ message: "Usuario actualizado con éxito." });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
};

// 5. Eliminar Usuario
export const deleteUsuario = async (req, res) => {
  const { id } = req.params;

  try {
    // Nota: Como 'usuario_rol' tiene ON DELETE CASCADE,
    // al borrar el usuario de aquí se limpia la tabla intermedia sola.
    const [result] = await db.query(
      "DELETE FROM usuarios WHERE id_usuario = ?;",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    res.json({ message: "Usuario eliminado con éxito de la plataforma." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
