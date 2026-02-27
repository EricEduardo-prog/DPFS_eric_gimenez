var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('layout',
    {
      title: 'E-E: Todo para su hogar o negocio',
      pageCss: 'index',
      currentPage: 'index',
      body: 'pages/index'
    });
});

/* GET login page */
router.get('/login', function (req, res, next) {
  res.render('layout',
    {
      title: 'Login - E-E',
      pageCss: 'login_register',
      currentPage: 'login',
      body: 'pages/users/login'
    });
});

/* GET register page */
router.get('/register', function (req, res, next) {
  res.render('layout',
    {
      title: 'Registrate - E-E',
      pageCss: 'login_register',
      currentPage: 'register',
      body: 'pages/users/register'
    });
});

/* GET cart page */
router.get('/cart', function (req, res, next) {
  res.render('layout',
    {
      title: 'Carrito - E-E',
      pageCss: 'cart',
      currentPage: 'cart',
      body: 'pages/products/cart'
    });
});

/* GET productDetail page */
router.get('/productDetail', function (req, res, next) {
  res.render('layout',
    {
      title: 'Detalle de producto - E-E',
      pageCss: 'product',
      currentPage: 'product',
      body: 'pages/products/productDetail'
    });
});

module.exports = router;
