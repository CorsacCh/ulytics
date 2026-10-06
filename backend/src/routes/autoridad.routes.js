import { Router } from 'express';
import { getResumen } from '../controllers/autoridad.controller.js';
import { authMiddleware, requirePasswordChanged, authorize, requirePermission } from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * @swagger
 * /autoridad/resumen:
 *   get:
 *     summary: Resumen institucional del Home de la Autoridad Central
 *     description: Agrega matrícula, retención y titulación a nivel de todas las carreras y devuelve las series de los gráficos institucionales. Requiere sesión, contraseña definitiva, rol Autoridad Central y el permiso DASHBOARD_AUTORIDAD_VER.
 *     tags: [Autoridad]
 *     responses:
 *       200:
 *         description: KPIs institucionales, series de gráficos y alertas derivadas de los cálculos. Los indicadores sin datos se devuelven en null.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [kpis, graficos, alertas]
 *               properties:
 *                 kpis:
 *                   type: object
 *                   properties:
 *                     matricula_total: { type: number, nullable: true }
 *                     crecimiento_matricula: { type: number, nullable: true, description: "% vs el año anterior; null sin datos previos" }
 *                     retencion_institucional: { type: number, nullable: true, description: "Promedio de retencion_a1 de la última cohorte" }
 *                     titulacion_total: { type: number, nullable: true, description: "Promedio de tasa_titulacion_total de la cohorte con titulación informada (> 0)" }
 *                     cohorte_titulacion: { type: number, nullable: true, description: "Cohorte usada para el cálculo de titulación; null sin datos" }
 *                     carreras_monitoreadas: { type: number }
 *                 graficos:
 *                   type: object
 *                   properties:
 *                     evolucion_matricula:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           anio: { type: number }
 *                           matricula: { type: number, nullable: true }
 *                     distribucion_facultad:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name: { type: string }
 *                           value: { type: number, description: "% de la matrícula del último año" }
 *                     top_carreras:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           carrera: { type: string }
 *                           matricula: { type: number }
 *                           retencion: { type: number, nullable: true }
 *                           titulacion: { type: number, nullable: true }
 *                     retencion_facultad:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           facultad: { type: string }
 *                           retencion: { type: number }
 *                 alertas:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       tipo: { type: string, enum: [critica, positiva, informativa] }
 *                       mensaje: { type: string }
 *       401:
 *         description: Sesión no válida.
 *       403:
 *         description: Rol, permiso o contraseña no autorizados.
 */
router.get(
  '/resumen',
  authMiddleware,
  requirePasswordChanged,
  authorize(['AUTORIDAD_CENTRAL']),
  requirePermission('DASHBOARD_AUTORIDAD_VER'),
  getResumen
);

export default router;
