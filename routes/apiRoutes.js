// routes/apiRoutes.js
'use strict';

const express = require('express');
const router = express.Router();
const apiController = require('../controllers/apiController');
const { isAdmin } = require('../middlewares/authMiddleware');

// Endpoints públicos o con autenticación según necesidad (puedes quitar middleware si quieres abierto)
// Por defecto los dejamos públicos (solo lectura)

// Categories (público)
router.get('/categories', apiController.listCategories);
router.get('/categories/:id', apiController.getCategoryById);

// Users (solo admin — expone datos personales)
router.get('/users', isAdmin, apiController.listUsers);
router.get('/users/:id', isAdmin, apiController.getUserById);

// Services (público)
router.get('/services', apiController.listServices);
router.get('/services/:id', apiController.getServiceById);

// Professionals (público)
router.get('/professionals', apiController.listProfessionals);
router.get('/professionals/:id', apiController.getProfessionalById);

// Products (público)
router.get('/products', apiController.listProducts);
router.get('/products/:id', apiController.getProductById);

module.exports = router;