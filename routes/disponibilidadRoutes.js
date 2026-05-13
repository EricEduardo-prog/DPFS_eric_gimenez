const express = require('express');
const router = express.Router();
const disponibilidadController = require('../controllers/disponibilidadController');

router.get('/profesionales', disponibilidadController.getProfesionalesDisponibles);



module.exports = router;