import { Router } from 'express';
import { getMatricula, getProgresion, getCurricular } from '../controllers/reporteria.controller.js';
import { authMiddleware, requirePasswordChanged } from '../middlewares/auth.middleware.js';
import { authorizeCareerScope } from '../middlewares/academic-scope.middleware.js';

const router = Router();

// Ruta: GET /api/reporteria/:car_codigo/matricula
// Exige sesión, contraseña definitiva y acceso al ámbito de la carrera.
router.get(
  '/:car_codigo/matricula',
  authMiddleware,
  requirePasswordChanged,
  authorizeCareerScope,
  getMatricula
);

// Ruta: GET /api/reporteria/:car_codigo/progresion
// Aplica la misma autorización antes de entregar la serie histórica por cohorte.
router.get(
  '/:car_codigo/progresion',
  authMiddleware,
  requirePasswordChanged,
  authorizeCareerScope,
  getProgresion
);

// Ruta: GET /api/reporteria/:car_codigo/curricular
// Eficiencia, titulación y asignaturas críticas con autorización de ámbito.
router.get(
  '/:car_codigo/curricular',
  authMiddleware,
  requirePasswordChanged,
  authorizeCareerScope,
  getCurricular
);

export default router;
