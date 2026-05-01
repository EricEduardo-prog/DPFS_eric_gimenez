'use strict';

const { Category } = require('../database/models');
const { validationResult } = require('express-validator');

// Helpers
function _buildOrder() {
    return [['order', 'ASC'], ['name', 'ASC']];
}

// GET /admin/categorias
async function listar(req, res, next) {
    try {
        const categorias = await Category.findAll({
            order: _buildOrder()
        });
        res.render('layout', {
            title: 'Categorías — E-E Admin',
            pageCss: 'admin_list',
            currentPage: 'admin',
            body: 'pages/admin/category/list',
            categorias,
            mensaje: req.query.mensaje || null,
            error: req.query.error || null,
        });
    } catch (err) {
        next(err);
    }
}

// GET /admin/categorias/nueva
function mostrarFormNueva(req, res) {
    res.render('layout', {
        title: 'Nueva Categoría — E-E Admin',
        pageCss: 'admin_form',
        currentPage: 'admin',
        body: 'pages/admin/category/form',
        categoria: null,
        errores: [],
        formData: null,
    });
}

// POST /admin/categorias
async function crear(req, res, next) {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
        return res.render('layout', {
            title: 'Nueva Categoría — E-E Admin',
            pageCss: ['admin_form', 'admin_list'],
            currentPage: 'admin',
            body: 'pages/admin/category/form',
            categoria: null,
            errores: errores.array().map(e => e.msg),
            formData: req.body,
        });
    }

    try {
        // Calcular próximo orden si no se envía
        let order = req.body.order;
        if (!order) {
            const lastCategory = await Category.findOne({ order: [['order', 'DESC']] });
            order = lastCategory ? lastCategory.order + 1 : 1;
        }

        const newCategory = await Category.create({
            id: `cat_${Date.now()}`, // o usar un generador de IDs como en los modelos originales
            slug: req.body.slug,
            name: req.body.name,
            description: req.body.description,
            icon: req.body.icon,
            is_active: req.body.is_active === 'true' || req.body.is_active === true,
            order: parseInt(order, 10)
        });
        res.redirect('/admin/categorias?mensaje=Categoría creada correctamente.');
    } catch (err) {
        console.error(err);
        res.render('layout', {
            title: 'Nueva Categoría — E-E Admin',
            pageCss: ['admin_form', 'admin_list'],
            currentPage: 'admin',
            body: 'pages/admin/category/form',
            categoria: null,
            errores: [err.message],
            formData: req.body,
        });
    }
}

// GET /admin/categorias/:id/editar
async function mostrarFormEditar(req, res, next) {
    try {
        const categoria = await Category.findByPk(req.params.id);
        if (!categoria) {
            return res.redirect('/admin/categorias?error=Categoría no encontrada.');
        }
        res.render('layout', {
            title: `Editar ${categoria.name} — E-E Admin`,
            pageCss: 'admin_form',
            currentPage: 'admin',
            body: 'pages/admin/category/form',
            categoria,
            errores: [],
            formData: null,
        });
    } catch (err) {
        next(err);
    }
}

// POST /admin/categorias/:id (actualizar)
async function actualizar(req, res, next) {
    const errores = validationResult(req);
    const categoria = await Category.findByPk(req.params.id);
    if (!categoria) return res.redirect('/admin/categorias?error=Categoría no encontrada.');

    if (!errores.isEmpty()) {
        return res.render('layout', {
            title: 'Editar Categoría — E-E Admin',
            pageCss: ['admin_form', 'admin_list'],
            currentPage: 'admin',
            body: 'pages/admin/category/form',
            categoria,
            errores: errores.array().map(e => e.msg),
            formData: req.body,
        });
    }

    try {
        await categoria.update({
            slug: req.body.slug,
            name: req.body.name,
            description: req.body.description,
            icon: req.body.icon,
            is_active: req.body.is_active === 'true' || req.body.is_active === true,
            order: parseInt(req.body.order, 10)
        });
        res.redirect('/admin/categorias?mensaje=Categoría actualizada correctamente.');
    } catch (err) {
        res.render('layout', {
            title: 'Editar Categoría — E-E Admin',
            pageCss: ['admin_form', 'admin_list'],
            currentPage: 'admin',
            body: 'pages/admin/category/form',
            categoria,
            errores: [err.message],
            formData: req.body,
        });
    }
}

// POST /admin/categorias/:id/baja (toggle activo)
async function toggleBaja(req, res, next) {
    try {
        const categoria = await Category.findByPk(req.params.id);
        if (!categoria) throw new Error('Categoría no encontrada');
        const nuevoEstado = !categoria.is_active;
        await categoria.update({ is_active: nuevoEstado });
        const estado = nuevoEstado ? 'activada' : 'desactivada';
        res.redirect(`/admin/categorias?mensaje=Categoría ${estado} correctamente.`);
    } catch (err) {
        res.redirect(`/admin/categorias?error=${encodeURIComponent(err.message)}`);
    }
}

// GET /admin/categorias/api/lista
async function apiLista(req, res) {
    try {
        const categorias = await Category.findAll({
            where: { is_active: true },
            order: _buildOrder(),
            attributes: ['id', 'name', 'slug']
        });
        res.json({ ok: true, categorias });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
}

module.exports = {
    listar,
    mostrarFormNueva,
    crear,
    mostrarFormEditar,
    actualizar,
    toggleBaja,
    apiLista,
};