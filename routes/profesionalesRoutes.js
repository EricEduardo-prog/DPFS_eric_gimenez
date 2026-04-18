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
const { isAdmin } = require('../middlewares/authMiddleware');

router.get('/', isAdmin, controller.listar);
router.get('/nuevo', isAdmin, controller.mostrarFormNuevo);
router.post('/', isAdmin, controller.crear);     // POST admin/profesionales 

router.get('/:id/editar', isAdmin, controller.mostrarFormEditar);
// Para actualizar (soporta PUT directo y POST con _method)
router.put('/:id', isAdmin, controller.actualizar);  // PUT admin/profesionales/:id  
router.post('/:id', isAdmin, controller.actualizar); // ← Para compatibilidad con _method

router.delete('/:id/baja', isAdmin, controller.toggleBaja);     // DELETE /admin/profesionales/:id/baja
router.post('/:id/baja', isAdmin, controller.toggleBaja);       // POST con _method=DELETE

module.exports = router;