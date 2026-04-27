'use strict';


const express = require('express');
const router = express.Router();
const controller = require('../controllers/categoriaController');
const { isAdmin } = require('../middlewares/authMiddleware');
const { validarCategoria } = require('../validations/categoriaValidation');

// ── Rutas estáticas primero (antes de /:id para evitar conflictos) ────────────

// GET  /admin/categorias
router.get('/', isAdmin, controller.listar);

// GET  /admin/categorias/nueva
router.get('/nueva', isAdmin, controller.mostrarFormNueva);

// POST /admin/categorias
router.post('/', isAdmin, validarCategoria, controller.crear);

// GET  /admin/categorias/api/lista  → JSON para <select> de productos
router.get('/api/lista', isAdmin, controller.apiLista);

// ── Rutas dinámicas con :id ────────────────────────────────────────────────────

// GET  /admin/categorias/:id/editar
router.get('/:id/editar', isAdmin, controller.mostrarFormEditar);

// PUT /admin/categorias/:id  (actualizar)
router.put('/:id', isAdmin, validarCategoria, controller.actualizar);

router.post('/:id', isAdmin, validarCategoria, controller.actualizar);   // POST con _method=PUT

router.delete('/:id/baja', isAdmin, validarCategoria, controller.toggleBaja);  // DELETE /admin/categorias/:id/baja
router.post('/:id/baja', isAdmin, validarCategoria, controller.toggleBaja);    // POST con _method=DELETE

module.exports = router;