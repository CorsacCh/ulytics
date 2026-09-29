import { Router } from 'express';
import { getMatricula, getProgresion } from '../controllers/reporteria.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

// Ruta: GET /api/reporteria/:car_codigo/matricula
// Protegida por authMiddleware para que solo usuarios logueados puedan ver los datos
router.get('/:car_codigo/matricula', authMiddleware, getMatricula);

// Ruta: GET /api/reporteria/:car_codigo/progresion
// Serie histórica de retención por cohorte para el gráfico de evolución longitudinal
router.get('/:car_codigo/progresion', authMiddleware, getProgresion);

export default router;
