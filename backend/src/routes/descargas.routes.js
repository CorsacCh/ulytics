import { Router } from 'express';
import { getHistorialDescargas, registrarDescarga } from '../controllers/descargas.controller.js';
import {
  authenticate,
  authorize,
  requirePasswordChanged
} from '../middlewares/auth.middleware.js';

const router = Router();

// El historial de descargas es transversal a los perfiles académicos que
// exportan reportes: dirección de carrera, decanatura y autoridad central.
router.use(
  authenticate,
  requirePasswordChanged,
  authorize(['DIRECTOR', 'DECANO', 'AUTORIDAD_CENTRAL', 'ADMIN'])
);

// Ruta: GET /api/descargas (historial + KPIs)
router.get('/', getHistorialDescargas);

// Ruta: POST /api/descargas (registra una descarga generada en el cliente)
router.post('/', registrarDescarga);

export default router;
