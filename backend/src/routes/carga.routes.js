import { Router } from 'express';
import { procesarCargaExcel } from '../controllers/carga.controller.js';
import { uploadExcel } from '../middlewares/upload.middleware.js';
import { authMiddleware, authorize } from '../middlewares/auth.middleware.js';

const router = Router();

// POST /api/cargas/upload
// Protegido: Requiere token válido y rol Admin
router.post(
  '/upload',
  authMiddleware,
  authorize(['Admin']),
  uploadExcel.single('archivo'), // 'archivo' es el nombre del campo en FormData
  procesarCargaExcel
);

export default router;
