'use strict';

const ProductoModel = require('../models/productoModel');
const CategoriaModel = require('../models/categoriaModel');
const ServicioModel = require('../models/servicioModel');

const productoModel = ProductoModel;  // alias para mantener consistencia con otros controladores
const categoriaModel = CategoriaModel;  // alias para mantener consistencia con otros controladores
const servicioModel = ServicioModel;  // alias para mantener consistencia con otros controladores

/**
 * GET / - Página principal
 */
function home(req, res, next) {
    try {
        const productos = productoModel.getAll({ soloActivos: true });
        const categorias = categoriaModel.getAll({ soloActivas: true });
        res.render('layout', {
            title: 'E-E - Todo para tu hogar',
            pageCss: ['index', 'products_list'],
            currentPage: 'index',
            body: 'pages/index',
            query: '',
            productos: productos.slice(0, 6), // 6 productos recomendados
            categorias: categorias.slice(0, 6) // 6 categorías principales
        });
    } catch (err) {
        next(err);
    }
}

/**
 * GET /search - Buscar productos
 */
function buscar(req, res, next) {
    try {
        const query = req.query.q || '';
        let productos = [];

        if (query.trim()) {
            const todos = productoModel.getAll({ soloActivos: true });
            const term = query.toLowerCase().trim();
            productos = todos.filter(p =>
                p.nombre.toLowerCase().includes(term) ||
                p.sku.toLowerCase().includes(term) ||
                (p.descripcion && p.descripcion.toLowerCase().includes(term))
            );
        }

        res.render('layout', {
            title: `Resultados: ${query} - E-E`,
            pageCss: 'products_list',
            currentPage: 'search',
            body: 'pages/search/results',
            productos: productos,
            query: query,
            total: productos.length
        });
    } catch (err) {
        next(err);
    }
}

/**
 * GET /categorias - Listar todas las categorías
 */
function listarCategorias(req, res, next) {
    try {
        const categorias = categoriaModel.getAll({ soloActivas: true });

        res.render('layout', {
            title: 'Categorías - E-E',
            pageCss: 'categories_list',
            currentPage: 'categories',
            body: 'pages/categories/list',
            categorias: categorias
        });
    } catch (err) {
        next(err);
    }
}

/**
 * GET /productos - Listar todos los productos
 */
function listarProductos(req, res, next) {
    try {
        const categoriaId = req.query.categoria || null;  // ← LEER PARÁMETRO
        let productos = productoModel.getAll({ soloActivos: true });

        // ← FILTRAR POR CATEGORÍA SI SE ESPECIFICA
        if (categoriaId) {
            productos = productos.filter(p => p.categoriaId === categoriaId);
        }

        const categorias = categoriaModel.getAll({ soloActivas: true });


        res.render('layout', {
            title: 'Productos - E-E',
            pageCss: 'products_list',
            currentPage: 'products',
            body: 'pages/products/list',
            productos: productos,
            categorias: categorias,
            categoriaSeleccionada: categoriaId // ← PASAR CATEGORÍA SELECCIONADA A LA VISTA
        });
    } catch (err) {
        next(err);
    }
}

/**
 * GET /productDetail/:id - Ver detalle de producto
 */
function verProducto(req, res, next) {
    try {
        const id = req.params.id;
        if (!id) {
            return res.redirect('/productos');
        }

        const producto = productoModel.getById(id);
        if (!producto || !producto.activo) {
            return res.redirect('/productos?error=Producto no encontrado');
        }

        const categorias = categoriaModel.getAll({ soloActivas: true });
        const categoria = categorias.find(c => c.id === producto.categoriaId);
        const servicios = servicioModel.getAll({ soloActivos: true });

        res.render('layout', {
            title: `${producto.nombre} - E-E`,
            pageCss: ['product', 'reserve'],
            currentPage: 'product',
            body: 'pages/products/detail',
            producto: producto,
            categoria: categoria,
            servicios: servicios
        });
    } catch (err) {
        next(err);
    }
}

module.exports = { home, buscar, listarCategorias, listarProductos, verProducto };