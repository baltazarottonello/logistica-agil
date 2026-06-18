import express from "express";
import cors from "cors";
import hojaRutaRoutes from "./routes/hojaRutaRoutes.js";
import usuarioRoutes from "./routes/usuarioRoutes.js";
import pedidoRoutes from "./routes/pedidoRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import clienteRoutes from "./routes/clienteRoutes.js";
import vehiculoRoutes from "./routes/vehiculosRoutes.js";

const app = express();
app.use(cors());
app.use(express.json());

// Registro de endpoints globales
app.use("/api/hojas-ruta", hojaRutaRoutes);
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/pedidos", pedidoRoutes); // <-- Dejamos uno solo limpio
app.use("/api/auth", authRoutes);
app.use("/api/clientes", clienteRoutes);
app.use("/api/vehiculos", vehiculoRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend de logística corriendo en el puerto ${PORT}`);
});
