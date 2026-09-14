// backend/src/routes/carga.routes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const cargaController = require('../controllers/carga.controller');

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/upload', upload.single('archivo'), cargaController.procesarCargaExcel);

module.exports = router;