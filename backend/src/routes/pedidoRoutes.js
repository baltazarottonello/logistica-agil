// routes/pedidoRoutes.js
import express from "express";
import {
  getPedidos,
  getFormDependencias,
  createPedido,
  updatePedido,
  deletePedido,
} from "../controllers/pedidoController.js";

const router = express.Router();

// Rutas de lectura (Accesibles por cualquier rol logueado)
router.get("/", getPedidos);
router.get("/dependencias", getFormDependencias); // Para traer clientes y estados al formulario

// Rutas protegidas (Solo Administrador)
router.post("/", createPedido);
router.put("/:id", updatePedido);
router.delete("/:id", deletePedido);

export default router;
