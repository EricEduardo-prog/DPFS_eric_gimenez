// controllers/apiController.js
'use strict';

const { Category, Product, Service, Professional, User, sequelize } = require('../database/models');
const { Op } = require('sequelize');

// Helper para construir URLs de paginación
function buildPaginationUrl(req, page, limit) {
    const baseUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}${req.path}`;
    const url = new URL(baseUrl);
    url.searchParams.set('page', page);
    url.searchParams.set('limit', limit);
    return url.toString();
}

// Helper para paginación genérica
async function paginate(model, req, where = {}, include = [], order = [['created_at', 'DESC']]) {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await model.findAndCountAll({
        where,
        include,
        order,
        limit,
        offset,
        distinct: true
    });

    const totalPages = Math.ceil(count / limit);
    const result = {
        count,
        totalPages,
        currentPage: page,
        limit,
        [model.name.toLowerCase() + 's']: rows,
        _links: {}
    };

    if (page < totalPages) {
        result._links.next = buildPaginationUrl(req, page + 1, limit);
    }
    if (page > 1) {
        result._links.previous = buildPaginationUrl(req, page - 1, limit);
    }

    return result;
}

// ===================== CATEGORÍAS =====================
async function listCategories(req, res, next) {
    try {
        // Incluir count de productos por categoría
        const categories = await Category.findAll({
            where: req.query.onlyActive === 'true' ? { is_active: true } : {},
            order: [['order', 'ASC']],
            attributes: ['id', 'name', 'slug', 'description', 'icon', 'is_active', 'order', 'created_at']
        });

        // Calcular products_count para cada categoría
        const products = await Product.findAll({ attributes: ['category_id'] });
        const countMap = products.reduce((map, p) => {
            map[p.category_id] = (map[p.category_id] || 0) + 1;
            return map;
        }, {});

        const categoriesWithCount = categories.map(cat => ({
            ...cat.toJSON(),
            products_count: countMap[cat.id] || 0
        }));

        // Paginación manual (ya que es un listado pequeño, pero soportamos paginación)
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const start = (page - 1) * limit;
        const paginated = categoriesWithCount.slice(start, start + limit);
        const total = categoriesWithCount.length;
        const totalPages = Math.ceil(total / limit);

        const result = {
            count: total,
            totalPages,
            currentPage: page,
            limit,
            categories: paginated,
            _links: {}
        };
        if (page < totalPages) result._links.next = buildPaginationUrl(req, page + 1, limit);
        if (page > 1) result._links.previous = buildPaginationUrl(req, page - 1, limit);

        res.json(result);
    } catch (err) {
        next(err);
    }
}

async function getCategoryById(req, res, next) {
    try {
        const category = await Category.findByPk(req.params.id, {
            attributes: ['id', 'name', 'slug', 'description', 'icon', 'is_active', 'order', 'created_at']
        });
        if (!category) return res.status(404).json({ error: 'Categoría no encontrada' });
        // Calcular products_count
        const productsCount = await Product.count({ where: { category_id: category.id } });
        res.json({ ...category.toJSON(), products_count: productsCount });
    } catch (err) {
        next(err);
    }
}

// ===================== USUARIOS =====================
async function listUsers(req, res, next) {
    try {
        const where = {};
        if (req.query.onlyActive === 'true') where.is_active = true;
        const result = await paginate(User, req, where, [], [['registered_at', 'DESC']]);
        // Excluir campos sensibles de cada usuario
        result.users = result.users.map(user => {
            const { password_hash, updated_at, ...safeUser } = user.toJSON();
            return {
                ...safeUser,
                avatar_url: null, // sin imagen por ahora
                _links: { self: `/api/users/${user.id}` }
            };
        });
        res.json(result);
    } catch (err) {
        next(err);
    }
}

async function getUserById(req, res, next) {
    try {
        const user = await User.findByPk(req.params.id, {
            attributes: { exclude: ['password_hash', 'updated_at'] }
        });
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
        res.json({
            ...user.toJSON(),
            avatar_url: null,
            _links: { self: `/api/users/${user.id}` }
        });
    } catch (err) {
        next(err);
    }
}

// ===================== SERVICIOS =====================
async function listServices(req, res, next) {
    try {
        const where = {};
        if (req.query.onlyActive === 'true') where.is_active = true;
        const result = await paginate(Service, req, where, [], [['name', 'ASC']]);
        result.services = result.services.map(s => ({
            ...s.toJSON(),
            _links: { self: `/api/services/${s.id}` }
        }));
        res.json(result);
    } catch (err) {
        next(err);
    }
}

async function getServiceById(req, res, next) {
    try {
        const service = await Service.findByPk(req.params.id);
        if (!service) return res.status(404).json({ error: 'Servicio no encontrado' });
        res.json({
            ...service.toJSON(),
            _links: { self: `/api/services/${service.id}` }
        });
    } catch (err) {
        next(err);
    }
}

// ===================== PROFESIONALES =====================
async function listProfessionals(req, res, next) {
    try {
        const where = {};
        if (req.query.onlyActive === 'true') where.is_active = true;
        if (req.query.serviceId) where.service_id = req.query.serviceId;
        if (req.query.serviceStatus) where.service_status = req.query.serviceStatus;
        const result = await paginate(Professional, req, where, [], [['created_at', 'DESC']]);
        // Excluir campos internos
        const excludeFields = ['certification_url', 'admin_observation', 'validated_by', 'validation_date', 'password_hash'];
        result.professionals = result.professionals.map(prof => {
            const data = prof.toJSON();
            excludeFields.forEach(f => delete data[f]);
            return {
                ...data,
                avatar_url: null,
                _links: { self: `/api/professionals/${prof.id}` }
            };
        });
        res.json(result);
    } catch (err) {
        next(err);
    }
}

async function getProfessionalById(req, res, next) {
    try {
        const professional = await Professional.findByPk(req.params.id, {
            attributes: { exclude: ['certification_url', 'admin_observation', 'validated_by', 'validation_date'] }
        });
        if (!professional) return res.status(404).json({ error: 'Profesional no encontrado' });
        res.json({
            ...professional.toJSON(),
            avatar_url: null,
            _links: { self: `/api/professionals/${professional.id}` }
        });
    } catch (err) {
        next(err);
    }
}

// ===================== PRODUCTOS (opcional, pero útil) =====================
async function listProducts(req, res, next) {
    try {
        const where = {};
        if (req.query.onlyActive === 'true') where.is_active = true;
        if (req.query.categoryId) where.category_id = req.query.categoryId;
        const result = await paginate(Product, req, where, [
            { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] }
        ], [['created_at', 'DESC']]);
        result.products = result.products.map(p => ({
            ...p.toJSON(),
            _links: { self: `/api/products/${p.id}` }
        }));
        res.json(result);
    } catch (err) {
        next(err);
    }
}

async function getProductById(req, res, next) {
    try {
        const product = await Product.findByPk(req.params.id, {
            include: [{ model: Category, as: 'category', attributes: ['id', 'name', 'slug'] }]
        });
        if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
        res.json({
            ...product.toJSON(),
            _links: { self: `/api/products/${product.id}` }
        });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    // Categories
    listCategories,
    getCategoryById,
    // Users
    listUsers,
    getUserById,
    // Services
    listServices,
    getServiceById,
    // Professionals
    listProfessionals,
    getProfessionalById,
    // Products
    listProducts,
    getProductById
};