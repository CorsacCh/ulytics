import { Router } from 'express';
import { getAmbitos } from '../controllers/ambito.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

// Ruta: GET /api/ambitos
// Solo administradores deberían poder ver esta lista para asignar roles
router.get('/', authMiddleware, getAmbitos);

export default router;
