// routes/apiRoutes.js
'use strict';

const express = require('express');
const router = express.Router();
const apiController = require('../controllers/apiController');
const { isUser, isAdmin } = require('../middlewares/authMiddleware'); // opcional, para proteger endpoints

// Endpoints públicos o con autenticación según necesidad (puedes quitar middleware si quieres abierto)
// Por defecto los dejamos públicos (solo lectura)

// Categories
router.get('/categories', apiController.listCategories);
router.get('/categories/:id', apiController.getCategoryById);

// Users
router.get('/users', apiController.listUsers);
router.get('/users/:id', apiController.getUserById);

// Services
router.get('/services', apiController.listServices);
router.get('/services/:id', apiController.getServiceById);

// Professionals
router.get('/professionals', apiController.listProfessionals);
router.get('/professionals/:id', apiController.getProfessionalById);

// Products (opcional)
router.get('/products', apiController.listProducts);
router.get('/products/:id', apiController.getProductById);

module.exports = router;