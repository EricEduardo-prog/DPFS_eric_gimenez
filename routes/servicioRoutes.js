'use strict';

const express = require('express');
const router = express.Router();
const controller = require('../controllers/servicioController');
const { isAdmin } = require('../middlewares/authMiddleware');

// Rutas estáticas
router.get('/', isAdmin, controller.listar);
router.get('/nuevo', isAdmin, controller.mostrarFormNuevo);
router.post('/', isAdmin, controller.crear);

// Rutas dinámicas
router.get('/:id/editar', isAdmin, controller.mostrarFormEditar);
router.put('/:id', isAdmin, controller.actualizar);
router.post('/:id', isAdmin, controller.actualizar);
router.post('/:id/baja', isAdmin, controller.toggleBaja);
router.post('/:id/destacado', isAdmin, controller.toggleDestacado);

module.exports = router;