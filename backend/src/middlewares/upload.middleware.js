import multer from 'multer';
import { AppError } from '../utils/app-error.js';

// Configurar almacenamiento en memoria (RAM)
const storage = multer.memoryStorage();

// Filtro estricto para aceptar solo archivos Excel
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
    file.mimetype === 'application/vnd.ms-excel'
  ) {
    cb(null, true);
  } else {
    cb(new AppError('Formato inválido. Solo se permiten archivos Excel (.xlsx o .xls)', 400), false);
  }
};

export const uploadExcel = multer({
  storage,
  fileFilter,
  limits: { fileSize: 15 * 1024 * 1024 } // Límite de 15 MB
});
