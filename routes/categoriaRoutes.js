'use strict';

/**
 * categoriaRoutes.js
 * Define los endpoints HTTP del módulo Categorías
 * y los conecta con sus controladores.
 *
 * Se monta en app.js como:
 *   app.use('/admin/categorias', categoriaRouter);
 *
 * Rutas resultantes:
 *   GET  /admin/categorias              → listar
 *   GET  /admin/categorias/nueva        → mostrarFormNueva
 *   POST /admin/categorias              → crear
 *   GET  /admin/categorias/api/lista    → apiLista  (JSON para <select>)
 *   GET  /admin/categorias/:id/editar   → mostrarFormEditar
 *   PUT  /admin/categorias/:id          → actualizar
 *   POST /admin/categorias/:id/baja     → toggleBaja (simula DELETE)
 *
 * NOTA sobre _method:
 *   Los formularios HTML no soportan PUT/DELETE de forma nativa.
 *   El campo oculto <input type="hidden" name="_method" value="PUT">
 *   ya está implementado en productForm.ejs e installerForm.ejs.
 *   El middleware method-override en app.js lo convierte automáticamente.
 *   Ahora también se usa en categorías para consistencia.
 */

const express = require('express');
const router = express.Router();
const controller = require('../controllers/categoriaController');
const { isAdmin } = require('../middlewares/authMiddleware');

// ── Rutas estáticas primero (antes de /:id para evitar conflictos) ────────────

// GET  /admin/categorias
router.get('/', isAdmin, controller.listar);

// GET  /admin/categorias/nueva
router.get('/nueva', isAdmin, controller.mostrarFormNueva);

// POST /admin/categorias
router.post('/', isAdmin, controller.crear);

// GET  /admin/categorias/api/lista  → JSON para <select> de productos
router.get('/api/lista', isAdmin, controller.apiLista);

// ── Rutas dinámicas con :id ────────────────────────────────────────────────────

// GET  /admin/categorias/:id/editar
router.get('/:id/editar', isAdmin, controller.mostrarFormEditar);

// PUT /admin/categorias/:id  (actualizar)
router.put('/:id', isAdmin, controller.actualizar);

router.post('/:id', isAdmin, controller.actualizar);   // POST con _method=PUT

router.delete('/:id/baja', isAdmin, controller.toggleBaja);  // DELETE /admin/categorias/:id/baja
router.post('/:id/baja', isAdmin, controller.toggleBaja);    // POST con _method=DELETE

module.exports = router;