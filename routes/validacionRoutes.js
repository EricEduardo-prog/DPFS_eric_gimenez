'use strict';

const express = require('express');
const router = express.Router();
const controller = require('../controllers/validacionController');
const { isAdmin } = require('../middlewares/authMiddleware');

// ============================================================
// RUTAS DE VALIDACIONES
// ============================================================

// Panel principal de validaciones
router.get('/', isAdmin, controller.mostrarPanelValidacion);

// Detalle de validación
router.get('/:id', isAdmin, controller.mostrarDetalleValidacion);

// Acciones de validación
router.post('/:id/aprobar', isAdmin, controller.aprobarProfesional);
router.post('/:id/rechazar', isAdmin, controller.rechazarProfesional);

module.exports = router;