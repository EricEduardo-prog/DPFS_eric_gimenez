'use strict';

const express = require('express');
const router = express.Router();
const controller = require('../controllers/servicioController');
const { isAdmin } = require('../middlewares/authMiddleware');
const { validarServicio } = require('../validations/servicioValidation');
// Rutas estáticas
router.get('/', isAdmin, controller.listar);
router.get('/nuevo', isAdmin, controller.mostrarFormNuevo);
router.post('/', isAdmin, validarServicio, controller.crear);

// Rutas dinámicas
router.get('/:id/editar', isAdmin, controller.mostrarFormEditar);
router.put('/:id', isAdmin, validarServicio, controller.actualizar);
router.post('/:id', isAdmin, validarServicio, controller.actualizar);
router.post('/:id/baja', isAdmin, validarServicio, controller.toggleBaja);
router.post('/:id/destacado', isAdmin, validarServicio, controller.toggleDestacado);

module.exports = router;