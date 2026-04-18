'use strict';

/**
 * categoriaController.js
 * Lógica de negocio para el módulo de Categorías.
 *
 * Responsabilidades:
 *  - Recibir req/res de Express
 *  - Validar los datos del body antes de llamar al modelo
 *  - Llamar al modelo y manejar sus errores
 *  - Renderizar vistas o redirigir con mensajes de feedback
 *
 * Rutas que maneja (registradas en categoriaRoutes.js):
 *  GET    /admin/categorias              → listar
 *  GET    /admin/categorias/nueva        → formulario alta
 *  POST   /admin/categorias              → crear
 *  GET    /admin/categorias/:id/editar   → formulario edición
 *  POST   /admin/categorias/:id          → actualizar (_method=PUT)
 *  POST   /admin/categorias/:id/baja     → toggle activo (_method=DELETE)
 *  GET    /admin/categorias/api/lista    → JSON para <select> de otros formularios
 */

const categoriaModel = require('../models/categoriaModel');

// ─────────────────────────────────────────────────────────────────────────────
// Helpers internos
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Valida los campos requeridos del formulario de categoría.
 * @param {Object} body - req.body
 * @returns {string[]} Array de mensajes de error. Vacío si todo es válido.
 */
function _validar(body) {
    const errores = [];

    if (!body.nombre || !String(body.nombre).trim()) {
        errores.push('El nombre es obligatorio.');
    } else if (String(body.nombre).trim().length > 80) {
        errores.push('El nombre no puede superar los 80 caracteres.');
    }

    if (body.descripcion && String(body.descripcion).trim().length > 200) {
        errores.push('La descripción no puede superar los 200 caracteres.');
    }

    if (body.orden !== undefined && body.orden !== '') {
        const orden = Number(body.orden);
        if (isNaN(orden) || orden < 1) {
            errores.push('El orden debe ser un número mayor a 0.');
        }
    }

    return errores;
}

// ─────────────────────────────────────────────────────────────────────────────
// Controladores
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /admin/categorias
 * Muestra el listado completo de categorías (activas e inactivas).
 */
function listar(req, res, next) {
    try {
        const categorias = categoriaModel.getAll();
        res.render('layout', {
            title: 'Categorías — E-E Admin',
            pageCss: 'admin_list',
            currentPage: 'admin',
            body: 'pages/admin/category/list',
            categorias,
            // Mensajes de feedback desde redirect (se setean en query params)
            mensaje: req.query.mensaje || null,
            error: req.query.error || null,
        });
    } catch (err) {
        next(err);
    }
}

/**
 * GET /admin/categorias/nueva
 * Muestra el formulario vacío para crear una categoría.
 */
function mostrarFormNueva(req, res, next) {
    res.render('layout', {
        title: 'Nueva Categoría — E-E Admin',
        pageCss: 'admin_form',
        currentPage: 'admin',
        body: 'pages/admin/category/form',
        categoria: null,   // null indica modo "alta"
        errores: [],
        formData: null,
    });
}

/**
 * POST /admin/categorias
 * Procesa el formulario de alta. Si hay errores vuelve al form, si no redirige.
 */
function crear(req, res, next) { 
    console.log('🔵 POST /admin/categorias - Body recibido:', req.body);
    
    const errores = _validar(req.body);

    if (errores.length > 0) {
        console.log('⚠️ Errores de validación:', errores);
        return res.render('layout', {
            title: 'Nueva Categoría — E-E Admin',
            pageCss: 'admin_forms_list',
            currentPage: 'admin',
            body: 'pages/admin/category/form',
            categoria: null,
            errores,
            formData: req.body,
        });
    }

    try {
        console.log('📝 Intentando crear categoría...');
        const nuevaCategoria = categoriaModel.create(req.body);
        console.log('✅ Categoría creada:', nuevaCategoria);
        res.redirect('/admin/categorias?mensaje=Categoría creada correctamente.');
    } catch (err) {
        console.error('❌ Error en crear categoría:', err.message);
        console.error('Stack:', err.stack);
        
        // Renderizar el formulario con el error
        res.render('layout', {
            title: 'Nueva Categoría — E-E Admin',
            pageCss: 'admin_forms_list',
            currentPage: 'admin',
            body: 'pages/admin/category/form',
            categoria: null,
            errores: [err.message],
            formData: req.body,
        });
    }
}

/**
 * GET /admin/categorias/:id/editar
 * Muestra el formulario pre-cargado con los datos de la categoría.
 */
function mostrarFormEditar(req, res, next) {
    try {
        const categoria = categoriaModel.getById(req.params.id);

        if (!categoria) {
            return res.redirect('/admin/categorias?error=Categoría no encontrada.');
        }

        res.render('layout', {
            title: `Editar ${categoria.nombre} — E-E Admin`,
            pageCss: 'admin_form',
            currentPage: 'admin',
            body: 'pages/admin/category/form',
            categoria,    // objeto completo → la vista detecta modo "edición"
            errores: [],
            formData: null,
        });
    } catch (err) {
        next(err);
    }
}

/**
 * POST /admin/categorias/:id  (con _method=PUT en el body)
 * Procesa el formulario de edición.
 */
function actualizar(req, res, next) {
    const errores = _validar(req.body);

    if (errores.length > 0) {
        // Necesitamos el objeto original para pre-cargar el form con el id correcto
        const categoria = categoriaModel.getById(req.params.id);
        return res.render('layout', {
            title: 'Editar Categoría — E-E Admin',
            pageCss: '  admin_forms_list',
            currentPage: 'admin',
            body: 'pages/admin/category/form',
            categoria,
            errores,
            formData: req.body,
        });
    }

    try {
        categoriaModel.update(req.params.id, req.body);
        res.redirect('/admin/categorias?mensaje=Categoría actualizada correctamente.');
    } catch (err) {
        const categoria = categoriaModel.getById(req.params.id);
        res.render('layout', {
            title: 'Editar Categoría — E-E Admin',
            pageCss: '  admin_forms_list',
            currentPage: 'admin',
            body: 'pages/admin/category/form',
            categoria,
            errores: [err.message],
            formData: req.body,
        });
    }
}

/**
 * POST /admin/categorias/:id/baja  (con _method=DELETE en el body)
 * Alterna el estado activo/inactivo (baja lógica). Nunca borra el registro.
 */
function toggleBaja(req, res, next) {
    try {
        const categoria = categoriaModel.toggleActivo(req.params.id);
        const estado = categoria.activo ? 'activada' : 'desactivada';
        res.redirect(`/admin/categorias?mensaje=Categoría ${estado} correctamente.`);
    } catch (err) {
        res.redirect(`/admin/categorias?error=${encodeURIComponent(err.message)}`);
    }
}

/**
 * GET /admin/categorias/api/lista
 * Devuelve JSON con las categorías activas ordenadas.
 * Usado por productoController para poblar el <select> del formulario de productos.
 * No renderiza vista — responde JSON puro.
 */
function apiLista(req, res, next) {
    try {
        const categorias = categoriaModel.getAll({ soloActivas: true });
        res.json({ ok: true, categorias });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
    listar,
    mostrarFormNueva,
    crear,
    mostrarFormEditar,
    actualizar,
    toggleBaja,
    apiLista,
};