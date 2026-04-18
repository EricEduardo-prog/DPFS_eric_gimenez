var express = require('express');
var router = express.Router();
var indexController = require('../controllers/indexController');

console.log('index.js loaded');

router.use((req, res, next) => {
  console.log('indexRouter request:', req.method, req.path);
  next();
});



/* GET home page. */
router.get('/', indexController.home);

/* GET home page. */
router.get('/-', indexController.home);

/* GET search results */
router.get('/search', indexController.buscar);

/* GET all categories */
router.get('/categorias', indexController.listarCategorias);

/* GET all products */
router.get('/productos', indexController.listarProductos);

/* GET cart page */
router.get('/cart', function (req, res, next) {
  res.render('layout', {
    title: 'Carrito - E-E',
    pageCss: 'cart',
    currentPage: 'cart',
    body: 'pages/products/cart'
  });
});

/* GET productDetail page */
router.get('/detail/:id?', indexController.verProducto);

// Redirigir /admin/- a /admin/productos (solicitud especial)
router.get('/admin/-', function (req, res, next) {
  console.log('Redirecting /admin/- to /admin/productos');
  res.redirect('/admin/productos');
});

module.exports = router;