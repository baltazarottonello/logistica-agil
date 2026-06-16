import express from "express";
import cors from "cors";
import hojaRutaRoutes from "./routes/hojaRutaRoutes.js";
import usuarioRoutes from "./routes/usuarioRoutes.js";
import pedidoRoutes from "./routes/pedidoRoutes.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/hojas-ruta", hojaRutaRoutes);
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/pedidos", pedidoRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend de logística corriendo en el puerto ${PORT}`);
});
