'use strict';

const express = require('express');
const router = express.Router();
const controller = require('../controllers/servicioController');

// Rutas estáticas
router.get('/', controller.listar);
router.get('/nuevo', controller.mostrarFormNuevo);
router.post('/', controller.crear);

// Rutas dinámicas
router.get('/:id/editar', controller.mostrarFormEditar);
router.put('/:id', controller.actualizar);
router.post('/:id', controller.actualizar);
router.post('/:id/baja', controller.toggleBaja);
router.post('/:id/destacado', controller.toggleDestacado);

module.exports = router;