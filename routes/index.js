var express = require('express');
var router = express.Router();
var indexController = require('../controllers/indexController');
const InventoryService = require('../services/InventoryService');

console.log('index.js loaded');

router.use((req, res, next) => {
  console.log('indexRouter request:', req.method, req.path);
  next();
});



/* GET home page. */
router.get('/', indexController.home, InventoryService.sincronizarCantidadProductos); // Sincronizar cantidades al cargar el home (solicitud especial)

/* GET home page. */
router.get('/-', indexController.home, InventoryService.sincronizarCantidadProductos); // Soporta /- como home (solicitud especial)

/* GET search results */
router.get('/search', indexController.buscar, InventoryService.buscarProductos); // Usar el servicio para buscar productos (solicitud especial)

/* GET all categories */
router.get('/categorias', indexController.listarCategorias);

/* GET all products */
router.get('/productos', indexController.listarProductos);

/* GET productDetail page */
router.get('/detail/:id?', indexController.verProducto);

// Redirigir /admin/- a /admin/productos (solicitud especial)
router.get('/admin/-', function (req, res, next) {
  console.log('Redirecting /admin/- to /admin/productos');
  res.redirect('/admin/productos');
});

module.exports = router;