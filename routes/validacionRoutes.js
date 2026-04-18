'use strict';

const express = require('express');
const router = express.Router();
const controller = require('../controllers/validacionController');

// ============================================================
// RUTAS DE VALIDACIONES
// ============================================================

// Panel principal de validaciones
router.get('/', controller.mostrarPanelValidacion);

// Detalle de validación
router.get('/:id', controller.mostrarDetalleValidacion);

// Acciones de validación
router.post('/:id/aprobar', controller.aprobarProfesional);
router.post('/:id/rechazar', controller.rechazarProfesional);

module.exports = router;