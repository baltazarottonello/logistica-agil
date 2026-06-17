// controllers/authController.js
import db from "../config/db.js";

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Buscar usuario y su rol correspondiente
    const query = `
      SELECT u.id_usuario, u.nombre, u.apellido, u.email, u.password_hash AS password_db, u.activo, r.id_rol, r.nombre AS rol
      FROM usuarios u
      LEFT JOIN usuario_rol ur ON u.id_usuario = ur.id_usuario
      LEFT JOIN roles r ON ur.id_rol = r.id_rol
      WHERE u.email = ?;
    `;

    const [rows] = await db.query(query, [email]);

    if (rows.length === 0) {
      return res.status(401).json({ error: "Credenciales inválidas." });
    }

    const usuario = rows[0];

    // Verificar si está activo
    if (!usuario.activo) {
      return res
        .status(403)
        .json({ error: "Cuenta deshabilitada. Contacte al administrador." });
    }

    // Comparación directa en texto plano
    if (password !== usuario.password_db) {
      return res.status(401).json({ error: "Credenciales inválidas." });
    }

    // Devolvemos los datos del usuario directamente (Sin JWT)
    res.json({
      id_usuario: usuario.id_usuario,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      email: usuario.email,
      id_rol: usuario.id_rol,
      rol: usuario.rol,
    });
  } catch (error) {
    res.status(500).json({ error: "Error en el servidor al autenticar." });
  }
};
