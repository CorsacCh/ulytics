import { Router } from "express";
import { getFacultyCareers } from "../controllers/decanatura.controller.js";
import {
  authenticate,
  authorize,
  requirePasswordChanged,
  requirePermission
} from "../middlewares/auth.middleware.js";

const router = Router();

router.use(
  authenticate,
  requirePasswordChanged,
  authorize(["DECANO"]),
  requirePermission("DASHBOARD_DECANO_VER")
);

/**
 * @swagger
 * /decanatura/carreras:
 *   get:
 *     summary: Lista las carreras de la facultad del usuario autenticado
 *     tags: [Decanatura]
 *     responses:
 *       200:
 *         description: Facultad del usuario y sus carreras
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 facultad:
 *                   type: object
 *                   properties:
 *                     codigo: { type: string }
 *                     nombre: { type: string }
 *                 carreras:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       car_codigo: { type: string }
 *                       nombre: { type: string }
 *                       sede: { type: string, nullable: true }
 *                       id_macrounidad: { type: string }
 *       401:
 *         description: No autenticado o sesión no válida
 *       403:
 *         description: El usuario no tiene rol o permiso de decanatura
 */
router.get("/carreras", getFacultyCareers);

export default router;
