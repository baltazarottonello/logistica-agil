// routes/vehiculoRoutes.js
import express from "express";
import {
  getVehiculos,
  createVehiculo,
  updateVehiculo,
  deleteVehiculo,
} from "../controllers/vehiculoController.js";

const router = express.Router();

// Rutas directas sin authMiddleware por aclaración del usuario
router.get("/", getVehiculos);
router.post("/", createVehiculo);
router.put("/:id", updateVehiculo);
router.delete("/:id", deleteVehiculo);

export default router;
