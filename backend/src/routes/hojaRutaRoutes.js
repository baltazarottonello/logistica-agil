import express from "express";
import {
  getHojasRuta,
  createHojaRuta,
  getChoferesActivos,
  getVehiculosActivos,
  updateHojaRuta,
  deleteHojaRuta,
  getMiHojaRutaActiva,
  getPedidosDetalleAdmin,
  getHojaRutaPorId,
} from "../controllers/hojaRutacontroller.js";

const router = express.Router();

// Nuevas rutas para los selectores
router.get("/choferes", getChoferesActivos);
router.get("/vehiculos", getVehiculosActivos);

router.get("/", getHojasRuta);
router.get("/:id", getHojaRutaPorId);
router.post("/", createHojaRuta);
router.put("/:id", updateHojaRuta);
router.delete("/:id", deleteHojaRuta);
router.get("/mi-viaje/:id_usuario", getMiHojaRutaActiva);
router.get("/:id/pedidos-detalle", getPedidosDetalleAdmin);

export default router;
