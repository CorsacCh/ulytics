import { Router } from 'express';
import { getMatricula } from '../controllers/reporteria.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

// Ruta: GET /api/reporteria/:car_codigo/matricula
// Protegida por authMiddleware para que solo usuarios logueados puedan ver los datos
router.get('/:car_codigo/matricula', authMiddleware, getMatricula);

export default router;
