'use strict';

/**
 * productoController.js
 * Lógica de negocio para el módulo de Productos.
 *
 * Rutas que maneja (registradas en productoRoutes.js):
 *  GET    /admin/productos               → listar
 *  GET    /admin/productos/nuevo         → formulario alta
 *  POST   /admin/productos               → crear
 *  GET    /admin/productos/:id/editar    → formulario edición
 *  PUT    /admin/productos/:id           → actualizar (_method=PUT)
 *  POST   /admin/productos/:id/baja      → toggle activo
 *
 * Dependencia: necesita categoriaModel para poblar el <select> del form.
 * Por eso categoriaRoutes debe estar montado antes en app.js.
 */

const ProductoModel = require('../models/productoModel');
const CategoriaModel = require('../models/categoriaModel');
const ServicioModel = require('../models/servicioModel');

const productoModel = ProductoModel;
const categoriaModel = CategoriaModel;
const servicioModel = ServicioModel; // 

const { validationResult } = require('express-validator');
/**
 * Carga las categorías activas para el <select> del formulario.
 * Si falla (JSON corrupto, etc.) devuelve array vacío para no romper la vista.
 */
function _getCategorias() {
    try {
        return categoriaModel.getAll({ soloActivas: true });
    } catch {
        return [];
    }
}
/**
 * Carga los servicios de instalación habilitados para el selector en la sección de instalación.
 */
function _getServiciosInstalacion() {
    try {
        return servicioModel.getAll({ soloActivos: true });
    } catch {
        return [];
    }
}

function _recalcularCantidadProductos() {
    try {
        const productos = productoModel.getAll();
        const categorias = categoriaModel.getAll();

        categorias.forEach(cat => {
            const cantidad = productos.filter(p => p.categoriaId === cat.id).length;
            categoriaModel.setCantidadProductos(cat.id, cantidad);
        });
    } catch (err) {
        console.error('Error recalculando cantidadProductos:', err.message);
    }
}

/**
 * Obtiene el último producto creado (por fechaCreación o por ID)
 * @returns {Object|null} El último producto o null si no hay
 */
function _getUltimoProducto() {
    try {
        const productos = productoModel.getAll();
        if (!productos || productos.length === 0) return null;

        // Ordenar por fechaCreación descendente y tomar el primero
        const ultimo = [...productos].sort((a, b) =>
            new Date(b.fechaCreacion) - new Date(a.fechaCreacion)
        )[0];

        return ultimo;
    } catch (err) {
        console.error('Error obteniendo último producto:', err.message);
        return null;
    }
}

/**
 * Opciones comunes para res.render() del formulario.
 */
function _optsForm(titulo, producto, errores, formData = null) {
    return {
        title: `${titulo} — E-E Admin`,
        pageCss: 'admin_form',
        currentPage: 'admin',
        body: 'pages/admin/products/form',
        producto: producto ?? null,
        categorias: _getCategorias(),
        servicios: _getServiciosInstalacion(),
        errores: errores ?? [],
        formData,
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Controladores
// ─────────────────────────────────────────────────────────────────────────────

/** GET /admin/productos */
function listar(req, res, next) {
    try {
        const { categoriaId, soloActivos } = req.query;
        const productos = productoModel.getAll({
            soloActivos: soloActivos === 'true',
            categoriaId: categoriaId || null,
        });
        const categorias = _getCategorias();

        res.render('layout', {
            title: 'Productos — E-E Admin',
            pageCss: 'admin_list',
            currentPage: 'admin',
            body: 'pages/admin/products/list',
            productos,
            categorias,
            filtros: { categoriaId: categoriaId || '', soloActivos: soloActivos || '' },
            mensaje: req.query.mensaje || null,
            error: req.query.error || null,
        });
    } catch (err) { next(err); }
}

/** GET /admin/productos/nuevo */
function mostrarFormNuevo(req, res, next) {
    try {
        res.render('layout', _optsForm('Nuevo Producto', null, []));
    } catch (err) {
        next(err);
    }
}

/** POST /admin/productos */
function crear(req, res, next) {
    console.log('🔵 POST /admin/productos - Body original:', req.body);

    // Mapear campo 'categoria' a 'categoriaId' si existe
    const body = { ...req.body };
    if (body.categoria && !body.categoriaId) {
        body.categoriaId = body.categoria;
        delete body.categoria;
    }

    console.log('📦 Body procesado:', body);

    const errores = validationResult(req);

    if (!errores.isEmpty()) {
        console.log('⚠️ Errores de validación:', errores.array());
        return res.render('layout', _optsForm('Nuevo Producto', null, errores.array().map(e => e.msg), req.body));
    }

    try {
        console.log('📝 Creando producto con categoría:', body.categoriaId);
        const nuevoProducto = productoModel.create(body);
        console.log('✅ Producto creado:', nuevoProducto.id, 'Categoría:', nuevoProducto.categoriaId);

        // Obtener el último producto para verificar
        const ultimoProducto = _getUltimoProducto();
        console.log(`📌 Último producto creado: ${ultimoProducto?.id} - ${ultimoProducto?.nombre}`);

        _recalcularCantidadProductos();

        return res.redirect('/admin/productos?mensaje=Producto creado correctamente.' + nuevoProducto.id);
    } catch (err) {
        console.error('❌ Error en crear producto:', err.message);
        res.render('layout', _optsForm('Nuevo Producto', null, [err.message], req.body));
    }
}



/** GET /admin/productos/:id/editar */
function mostrarFormEditar(req, res, next) {
    try {
        const producto = productoModel.getById(req.params.id);
        if (!producto) return res.redirect('/admin/productos?error=Producto no encontrado.');
        res.render('layout', _optsForm(`Editar ${producto.nombre}`, producto, []));
    } catch (err) { next(err); }
}


/** POST /admin/productos/:id */
function actualizar(req, res, next) {
    console.log('🔵 POST /admin/productos/:id (actualizar) - ID:', req.params.id);
    console.log('🔵 Body recibido:', req.body);
    console.log('🔵 Method:', req.method);

    const errores = validationResult(req);
    console.log('🔵 Errores de validación:', errores.array());

    if (!errores.isEmpty()) {
        const producto = productoModel.getById(req.params.id);
        return res.render('layout', _optsForm('Editar Producto', producto, errores.array().map(e => e.msg), req.body));
    }
    try {
        const productoActualizado = productoModel.update(req.params.id, req.body);
        console.log('✅ Producto actualizado:', productoActualizado.id);
        _recalcularCantidadProductos();

        return res.redirect('/admin/productos?mensaje=Producto actualizado correctamente.');
    } catch (err) {
        console.error('❌ Error en actualizar producto:', err.message);
        const producto = productoModel.getById(req.params.id);
        res.render('layout', _optsForm('Editar Producto', producto, [err.message], req.body));
    }
}

/** POST /admin/productos/:id/baja */
function toggleBaja(req, res, next) {
    try {
        const producto = productoModel.toggleActivo(req.params.id);
        const estado = producto.activo ? 'activado' : 'desactivado';
        _recalcularCantidadProductos();
        res.redirect(`/admin/productos?mensaje=Producto ${estado} correctamente.`);
    } catch (err) {
        res.redirect(`/admin/productos?error=${encodeURIComponent(err.message)}`);
    }
}

module.exports = { listar, mostrarFormNuevo, crear, mostrarFormEditar, actualizar, toggleBaja };