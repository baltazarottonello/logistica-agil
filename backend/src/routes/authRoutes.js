// routes/authRoutes.js
import express from "express";
import { login } from "../controllers/authController.js";

const router = express.Router();

// POST http://localhost:5000/api/auth/login
router.post("/login", login);

export default router;
