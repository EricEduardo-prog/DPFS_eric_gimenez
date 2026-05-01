'use strict';

const { Product, Category, Service } = require('../database/models');
const { validationResult } = require('express-validator');
const InventoryService = require('../services/InventoryService'); 

async function home(req, res, next) {
    try {
        const productos = await Product.findAll({
            where: { is_active: true },
            limit: 6,
            order: [['created_at', 'DESC']],
            include: [{ model: Category, as: 'category' }]
        });
        //Mostrar 1 producto completo 
        console.log('Producto destacado:', productos[0] ? productos[0].toJSON() : 'No hay productos');
        const categorias = await Category.findAll({
            where: { is_active: true },
            limit: 6,
            order: [['order', 'ASC']]
        });
        res.render('layout', {
            title: 'E-E - Todo para tu hogar',
            pageCss: ['index', 'products_list'],
            currentPage: 'index',
            body: 'pages/index',
            query: '',
            productos,
            categorias
        });
    } catch (err) { next(err); }
}

async function buscar(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.redirect('/?error=Consulta inválida');
    }
    try {
        const { q, categoria } = req.query;
        const where = { is_active: true };
        if (q) where.name = { [Op.like]: `%${q}%` };
        if (categoria) where.category_id = categoria;

        const productos = await Product.findAll({
            where,
            include: [{ model: Category, as: 'category' }]
        });
        res.render('layout', {
            title: `Resultados: ${q || ''} - E-E`,
            pageCss: 'products_list',
            currentPage: 'search',
            body: 'pages/search/results',
            productos,
            query: q,
            total: productos.length
        });
    } catch (err) { next(err); }
}

async function listarCategorias(req, res, next) {
    try {
        const categorias = await Category.findAll({
            where: { is_active: true },
            order: [['order', 'ASC']]
        });
        res.render('layout', {
            title: 'Categorías - E-E',
            pageCss: 'categories_list',
            currentPage: 'categories',
            body: 'pages/categories/list',
            categorias
        });
    } catch (err) { next(err); }
}

async function listarProductos(req, res, next) {
    try {
        const where = { is_active: true };
        if (req.query.categoria) where.category_id = req.query.categoria;

        const productos = await Product.findAll({
            where,
            include: [{ model: Category, as: 'category' }],
            order: [['name', 'ASC']]
        });
        const categorias = await Category.findAll({
            where: { is_active: true },
            order: [['order', 'ASC']]
        });
        res.render('layout', {
            title: 'Productos - E-E',
            pageCss: 'products_list',
            currentPage: 'products',
            body: 'pages/products/list',
            productos,
            categorias,
            categoriaSeleccionada: req.query.categoria || null
        });
    } catch (err) { next(err); }
}

async function verProducto(req, res, next) {
    try {
        const producto = await Product.findByPk(req.params.id, {
            include: [
                { model: Category, as: 'category' },
                { model: Service, as: 'installationService' }
            ]
        });
        if (!producto || !producto.is_active) {
            return res.redirect('/productos?error=Producto no encontrado');
        }
        const categorias = await Category.findAll({ where: { is_active: true } });
        const servicios = await Service.findAll({ where: { is_active: true } });
        res.render('layout', {
            title: `${producto.name} - E-E`,
            pageCss: ['product', 'reserve'],
            currentPage: 'product',
            body: 'pages/products/detail',
            producto,
            categoria: producto.category,
            servicios
        });
    } catch (err) { next(err); }
}

module.exports = { home, buscar, listarCategorias, listarProductos, verProducto };