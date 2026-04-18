'use strict';

/**
 * profesionalesRoutes.js
 * Montado en app.js como: app.use('/admin/profesionales', profesionalesRouter)
 *
 * Rutas resultantes:
 *   GET  /admin/profesionales              → listar
 *   GET  /admin/profesionales/nuevo        → mostrarFormNuevo
 *   POST /admin/profesionales              → crear
 *   GET  /admin/profesionales/:id/editar   → mostrarFormEditar
 *   POST /admin/profesionales/:id          → actualizar
 *   POST /admin/profesionales/:id/baja     → toggleBaja
 */

const express = require('express');
const router = express.Router();
const controller = require('../controllers/profesionalesController');

router.get('/', controller.listar);
router.get('/nuevo', controller.mostrarFormNuevo);
router.post('/', controller.crear);     // POST admin/profesionales 

router.get('/:id/editar', controller.mostrarFormEditar);
// Para actualizar (soporta PUT directo y POST con _method)
router.put('/:id', controller.actualizar);  // PUT admin/profesionales/:id  
router.post('/:id', controller.actualizar); // ← Para compatibilidad con _method

router.delete('/:id/baja', controller.toggleBaja);     // DELETE /admin/profesionales/:id/baja
router.post('/:id/baja', controller.toggleBaja);       // POST con _method=DELETE

module.exports = router;