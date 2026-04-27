'use strict';


const express = require('express');
const router = express.Router();
const controller = require('../controllers/productoController');
const { isAdmin } = require('../middlewares/authMiddleware');
const { validarProducto } = require('../validations/productoValidation');

// Rutas estáticas primero
router.get('/', isAdmin, controller.listar);
router.get('/nuevo', isAdmin, controller.mostrarFormNuevo);
router.post('/', isAdmin, validarProducto, controller.crear);

// Rutas dinámicas
router.get('/:id/editar', isAdmin, controller.mostrarFormEditar);
router.get('/:id', isAdmin, controller.mostrarFormEditar); // Soporta /admin/productos/:id y /admin/productos/:id/
router.put('/:id', isAdmin, validarProducto, controller.actualizar);
router.post('/:id/baja', isAdmin, validarProducto, controller.toggleBaja);

module.exports = router;