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

// Rutas estáticas primero
router.get('/', controller.listar);
router.get('/nuevo', controller.mostrarFormNuevo);
router.post('/', controller.crear);

// Rutas dinámicas
router.get('/:id/editar', controller.mostrarFormEditar);
router.get('/:id', controller.mostrarFormEditar); // Soporta /admin/productos/:id y /admin/productos/:id/
router.put('/:id', controller.actualizar);
router.post('/:id/baja', controller.toggleBaja);

module.exports = router;