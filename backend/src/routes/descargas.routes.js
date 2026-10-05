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
/**
 * @swagger
 * /descargas:
 *   get:
 *     summary: Consulta el historial de descargas y sus indicadores
 *     tags: [Descargas]
 *     responses:
 *       200:
 *         description: Resumen de descargas recientes y registros históricos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resumen:
 *                   type: object
 *                   properties:
 *                     totalUltimos90Dias:
 *                       type: integer
 *                     ultimaDescargaFecha:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                     ultimaDescargaNombre:
 *                       type: string
 *                       nullable: true
 *                     formatosCantidad:
 *                       type: integer
 *                     formatosUsados:
 *                       type: array
 *                       items:
 *                         type: string
 *                 registros:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id_descarga: { type: integer }
 *                       nombre_archivo: { type: string }
 *                       formato: { type: string }
 *                       periodo: { type: string }
 *                       fecha_descarga: { type: string, format: date-time }
 *                       tamano_kb: { type: integer }
 *                       url_archivo: { type: string }
 *       401:
 *         description: No autenticado o sesión no válida
 */
router.get('/', getHistorialDescargas);

// Ruta: POST /api/descargas (registra una descarga generada en el cliente)
router.post('/', registrarDescarga);

export default router;
