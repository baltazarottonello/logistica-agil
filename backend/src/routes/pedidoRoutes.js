import express from "express";
import {
  getPedidos,
  getFormDependencias,
  createPedido,
  updatePedido,
  deletePedido,
  getPedidosDisponibles,
  updateEstadoPedido,
} from "../controllers/pedidoController.js";

const router = express.Router();

// 1. RUTAS ESPECÍFICAS / ESTÁTICAS (Siempre ARRIBA)
router.get("/", getPedidos);
router.get("/dependencias", getFormDependencias);
router.get("/disponibles", getPedidosDisponibles);

// 2. RUTAS DINÁMICAS O CON PARÁMETROS (Siempre ABAJO)
router.post("/", createPedido);
router.put("/:id", updatePedido);
router.delete("/:id", deletePedido);
router.patch("/:id/estado", updateEstadoPedido);

export default router;
