var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'E E', subtitle: 'Encargos y Encargados para tu negocio y hogar.' });
});

module.exports = router;
