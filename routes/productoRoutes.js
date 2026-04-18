'use strict';

/**
 * productoRoutes.js
 * Montado en app.js como: app.use('/admin/productos', productoRouter)
 *
 * Rutas resultantes:
 *   GET  /admin/productos              → listar
 *   GET  /admin/productos/nuevo        → mostrarFormNuevo
 *   POST /admin/productos              → crear
 *   GET  /admin/productos/:id/editar   → mostrarFormEditar
 *   PUT  /admin/productos/:id          → actualizar
 *   POST /admin/productos/:id/baja     → toggleBaja
 */

const express = require('express');
const router = express.Router();
const controller = require('../controllers/productoController');
const { isAdmin } = require('../middlewares/authMiddleware');

// Rutas estáticas primero
router.get('/', isAdmin, controller.listar);
router.get('/nuevo', isAdmin, controller.mostrarFormNuevo);
router.post('/', isAdmin, controller.crear);

// Rutas dinámicas
router.get('/:id/editar', isAdmin, controller.mostrarFormEditar);
router.get('/:id', isAdmin, controller.mostrarFormEditar); // Soporta /admin/productos/:id y /admin/productos/:id/
router.put('/:id', isAdmin, controller.actualizar);
router.post('/:id/baja', isAdmin, controller.toggleBaja);

module.exports = router;