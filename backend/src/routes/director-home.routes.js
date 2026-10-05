import { Router } from 'express';
import { getHomeDashboard } from '../controllers/director-home.controller.js';
import { authMiddleware, requirePasswordChanged, authorize } from '../middlewares/auth.middleware.js';

const router = Router();

// GET /api/director/home
// Protegida: requiere sesión válida, contraseña definitiva y rol de DIRECTOR.
router.get(
  '/home',
  authMiddleware,
  requirePasswordChanged,
  authorize(['DIRECTOR']),
  getHomeDashboard
);

export default router;