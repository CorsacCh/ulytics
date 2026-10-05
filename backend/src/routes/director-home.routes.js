import { Router } from 'express';
import { getHomeDashboard } from '../controllers/director-home.controller.js';
import { authMiddleware, requirePasswordChanged, authorize, requirePermission } from '../middlewares/auth.middleware.js';
import { authorizeDirectorCareer } from '../middlewares/academic-scope.middleware.js';

const router = Router();

/**
 * @swagger
 * /director/home:
 *   get:
 *     summary: Resumen de la carrera asociada al director autenticado
 *     description: Requiere sesión y contraseña definitiva. Solo devuelve datos del ámbito del director. Los períodos omitidos usan el último disponible. No calcula rankings ni umbrales críticos.
 *     tags: [Director]
 *     parameters:
 *       - in: query
 *         name: cohorte
 *         schema: { type: integer, minimum: 1000, maximum: 9999 }
 *         description: Cohorte para ingresos, retención, titulación y duración.
 *       - in: query
 *         name: anio_medicion
 *         schema: { type: integer, minimum: 1000, maximum: 9999 }
 *         description: Año de matrícula y registros de asignaturas.
 *     responses:
 *       200:
 *         description: Carrera, períodos disponibles, selección, KPI y cantidad de registros informados. Los indicadores ausentes son null.
 *       400:
 *         description: Período inválido.
 *       401:
 *         description: Sesión no válida.
 *       403:
 *         description: Rol, permiso, contraseña o ámbito no autorizado.
 *       404:
 *         description: La carrera de la sesión no existe en el catálogo.
 */
router.get(
  '/home',
  authMiddleware,
  requirePasswordChanged,
  authorize(['DIRECTOR']),
  requirePermission('DASHBOARD_DIRECTOR_VER'),
  authorizeDirectorCareer,
  getHomeDashboard
);

export default router;
