'use strict';

const { Product, Category, Service } = require('../database/models');
const { validationResult } = require('express-validator');

// Helpers
async function _getCategorias() {
    return await Category.findAll({ where: { is_active: true }, order: [['name', 'ASC']] });
}
async function _getServiciosInstalacion() {
    return await Service.findAll({ where: { is_active: true }, order: [['name', 'ASC']] });
}
async function _getUltimoProducto() {
    return await Product.findOne({ order: [['created_at', 'DESC']] });
}

async function _optsForm(titulo, producto, errores, formData = null) {
    const [categorias, servicios] = await Promise.all([_getCategorias(), _getServiciosInstalacion()]);
    return {
        title: `${titulo} — E-E Admin`,
        pageCss: 'admin_form',
        currentPage: 'admin',
        body: 'pages/admin/products/form',
        producto: producto ?? null,
        categorias,
        servicios,
        errores: errores ?? [],
        formData,
    };
}

// GET /admin/productos
async function listar(req, res, next) {
    try {
        const where = {};
        if (req.query.soloActivos === 'true') where.is_active = true;
        if (req.query.categoriaId) where.category_id = req.query.categoriaId;

        const productos = await Product.findAll({
            where,
            include: [{ model: Category, as: 'category', attributes: ['name'] }],
            order: [['created_at', 'DESC']]
        });
        const categorias = await _getCategorias();

        res.render('layout', {
            title: 'Productos — E-E Admin',
            pageCss: 'admin_list',
            currentPage: 'admin',
            body: 'pages/admin/products/list',
            productos,
            categorias,
            filtros: { categoriaId: req.query.categoriaId || '', soloActivos: req.query.soloActivos || '' },
            mensaje: req.query.mensaje || null,
            error: req.query.error || null,
        });
    } catch (err) {
        next(err);
    }
}

async function mostrarFormNuevo(req, res, next) {
    try {
        const opts = await _optsForm('Nuevo Producto', null, []);
        res.render('layout', opts);
    } catch (err) {
        next(err);
    }
}

async function crear(req, res, next) {
    // Mapear campo 'categoria' a 'category_id'
    if (req.body.categoria && !req.body.category_id) {
        req.body.category_id = req.body.categoria;
        delete req.body.categoria;
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const opts = await _optsForm('Nuevo Producto', null, errors.array().map(e => e.msg), req.body);
        return res.render('layout', opts);
    }

    try {
        const newProduct = await Product.create({
            id: `prod_${Date.now()}`,
            name: req.body.name,
            sku: req.body.sku,
            category_id: req.body.category_id,
            description: req.body.description,
            characteristics: req.body.characteristics ? JSON.parse(req.body.characteristics) : [],
            image: req.body.image,
            images: req.body.images ? JSON.parse(req.body.images) : [],
            colors: req.body.colors ? JSON.parse(req.body.colors) : [],
            sizes: req.body.sizes ? JSON.parse(req.body.sizes) : [],
            price: parseFloat(req.body.price),
            original_price: parseFloat(req.body.original_price) || 0,
            installation_available: req.body.installation_available === 'true',
            installation_service_id: req.body.installation_service_id || null,
            is_active: req.body.is_active === 'true'
        });
        res.redirect('/admin/productos?mensaje=Producto creado correctamente.');
    } catch (err) {
        const opts = await _optsForm('Nuevo Producto', null, [err.message], req.body);
        res.render('layout', opts);
    }
}

async function mostrarFormEditar(req, res, next) {
    try {
        const producto = await Product.findByPk(req.params.id, {
            include: [{ model: Category, as: 'category' }]
        });
        if (!producto) return res.redirect('/admin/productos?error=Producto no encontrado.');
        const opts = await _optsForm(`Editar ${producto.name}`, producto, []);
        res.render('layout', opts);
    } catch (err) {
        next(err);
    }
}

async function actualizar(req, res, next) {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.redirect('/admin/productos?error=Producto no encontrado.');

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const opts = await _optsForm('Editar Producto', product, errors.array().map(e => e.msg), req.body);
        return res.render('layout', opts);
    }

    try {
        await product.update({
            name: req.body.name,
            sku: req.body.sku,
            category_id: req.body.category_id,
            description: req.body.description,
            characteristics: req.body.characteristics ? JSON.parse(req.body.characteristics) : [],
            image: req.body.image,
            images: req.body.images ? JSON.parse(req.body.images) : [],
            colors: req.body.colors ? JSON.parse(req.body.colors) : [],
            sizes: req.body.sizes ? JSON.parse(req.body.sizes) : [],
            price: parseFloat(req.body.price),
            original_price: parseFloat(req.body.original_price) || 0,
            installation_available: req.body.installation_available === 'true',
            installation_service_id: req.body.installation_service_id || null,
            is_active: req.body.is_active === 'true'
        });
        res.redirect('/admin/productos?mensaje=Producto actualizado correctamente.');
    } catch (err) {
        const opts = await _optsForm('Editar Producto', product, [err.message], req.body);
        res.render('layout', opts);
    }
}

async function toggleBaja(req, res, next) {
    try {
        const product = await Product.findByPk(req.params.id);
        if (!product) throw new Error('Producto no encontrado');
        const newActive = !product.is_active;
        await product.update({ is_active: newActive });
        const estado = newActive ? 'activado' : 'desactivado';
        res.redirect(`/admin/productos?mensaje=Producto ${estado} correctamente.`);
    } catch (err) {
        res.redirect(`/admin/productos?error=${encodeURIComponent(err.message)}`);
    }
}

module.exports = {
    listar,
    mostrarFormNuevo,
    crear,
    mostrarFormEditar,
    actualizar,
    toggleBaja
};