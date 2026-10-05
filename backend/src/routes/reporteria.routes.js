import { Router } from 'express';
import { getMatricula, getProgresion, getCurricular } from '../controllers/reporteria.controller.js';
import { authMiddleware, requirePasswordChanged } from '../middlewares/auth.middleware.js';
import { authorizeCareerScope } from '../middlewares/academic-scope.middleware.js';

const router = Router();

// Ruta: GET /api/reporteria/:car_codigo/matricula
// Exige sesión, contraseña definitiva y acceso al ámbito de la carrera.
/**
 * @swagger
 * /reporteria/{car_codigo}/matricula:
 *   get:
 *     summary: Obtiene ingresos por cohorte y matrícula anual de una carrera
 *     tags: [Reportería académica]
 *     parameters:
 *       - in: path
 *         name: car_codigo
 *         required: true
 *         schema:
 *           type: string
 *         description: Código de la carrera
 *     responses:
 *       200:
 *         description: Datos de ingreso y matrícula de la carrera
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 carrera:
 *                   type: string
 *                 ingresos_cohorte:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       cohorte: { type: number, nullable: true }
 *                       ingresos_sua: { type: number, nullable: true }
 *                       ingresos_pace: { type: number, nullable: true }
 *                       ingresos_especiales: { type: number, nullable: true }
 *                       ingresos_totales: { type: number, nullable: true }
 *                       porcentaje_mujeres: { type: number, nullable: true }
 *                       cobertura_sua: { type: number, nullable: true }
 *                       cobertura_pace: { type: number, nullable: true }
 *                       cobertura_rae: { type: number, nullable: true }
 *                       estados_datos: { type: object, nullable: true, additionalProperties: true }
 *                 matricula_anual:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       anio_medicion: { type: number, nullable: true }
 *                       matricula_total: { type: number, nullable: true }
 *                       matricula_mujeres: { type: number, nullable: true }
 *                       porcentaje_mujeres: { type: number, nullable: true }
 *                       estados_datos: { type: object, nullable: true, additionalProperties: true }
 *       401:
 *         description: No autenticado o sesión no válida
 */
router.get(
  '/:car_codigo/matricula',
  authMiddleware,
  requirePasswordChanged,
  authorizeCareerScope,
  getMatricula
);

// Ruta: GET /api/reporteria/:car_codigo/progresion
// Aplica la misma autorización antes de entregar la serie histórica por cohorte.
/**
 * @swagger
 * /reporteria/{car_codigo}/progresion:
 *   get:
 *     summary: Obtiene retención y progresión histórica por carrera
 *     tags: [Reportería académica]
 *     parameters:
 *       - in: path
 *         name: car_codigo
 *         required: true
 *         schema:
 *           type: string
 *         description: Código de la carrera
 *     responses:
 *       200:
 *         description: Indicadores históricos de retención y titulación por cohorte
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 carrera:
 *                   type: string
 *                 datos:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       cohorte: { type: number, nullable: true }
 *                       retencion_a1: { type: number, nullable: true }
 *                       retencion_a2: { type: number, nullable: true }
 *                       retencion_a3: { type: number, nullable: true }
 *                       retencion_a4: { type: number, nullable: true }
 *                       retencion_total: { type: number, nullable: true }
 *                       tasa_titulacion_total: { type: number, nullable: true }
 *                       tasa_titulacion_oportuna: { type: number, nullable: true }
 *                       tasa_titulacion_efectiva: { type: number, nullable: true }
 *                       duracion_real_semestres: { type: number, nullable: true }
 *                       estados_datos: { type: object, nullable: true, additionalProperties: true }
 *       401:
 *         description: No autenticado o sesión no válida
 */
router.get(
  '/:car_codigo/progresion',
  authMiddleware,
  requirePasswordChanged,
  authorizeCareerScope,
  getProgresion
);

// Ruta: GET /api/reporteria/:car_codigo/curricular
// Eficiencia, titulación y asignaturas críticas con autorización de ámbito.
/**
 * @swagger
 * /reporteria/{car_codigo}/curricular:
 *   get:
 *     summary: Obtiene indicadores de eficiencia, avance curricular y asignaturas críticas
 *     tags: [Reportería académica]
 *     parameters:
 *       - in: path
 *         name: car_codigo
 *         required: true
 *         schema:
 *           type: string
 *         description: Código de la carrera
 *     responses:
 *       200:
 *         description: Indicadores curriculares de la carrera
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 carrera:
 *                   type: string
 *                 eficiencia:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       cohorte: { type: number, nullable: true }
 *                       total_alumnos_regulares: { type: number, nullable: true }
 *                       nivel_baja: { type: number, nullable: true }
 *                       nivel_media: { type: number, nullable: true }
 *                       nivel_alta: { type: number, nullable: true }
 *                       nivel_eficiente: { type: number, nullable: true }
 *                       estados_datos: { type: object, nullable: true, additionalProperties: true }
 *                 avance_curricular:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       cohorte: { type: number, nullable: true }
 *                       porcentaje_bachillerato: { type: number, nullable: true }
 *                       porcentaje_licenciatura_con_bachillerato_pendiente: { type: number, nullable: true }
 *                       porcentaje_licenciatura: { type: number, nullable: true }
 *                       porcentaje_titulo_con_bachillerato_licenciatura_pendiente: { type: number, nullable: true }
 *                       porcentaje_titulo: { type: number, nullable: true }
 *                       estados_datos: { type: object, nullable: true, additionalProperties: true }
 *                 criticas:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       asig_codigo_base: { type: string }
 *                       asig_codigo: { type: string }
 *                       semestre: { type: number, nullable: true }
 *                       anio_medicion: { type: number, nullable: true }
 *                       tasa_reprobacion: { type: number, nullable: true }
 *                       estado_dato: { type: string, nullable: true }
 *       401:
 *         description: No autenticado o sesión no válida
 */
router.get(
  '/:car_codigo/curricular',
  authMiddleware,
  requirePasswordChanged,
  authorizeCareerScope,
  getCurricular
);

export default router;
