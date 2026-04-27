const express = require('express');
const router = express.Router();

const disponibilidadController = require('../controllers/disponibilidadController');

// GET /profesionales?servicioId=serv_003&fecha=2024-01-15&turno=manana
router.get('/profesionales', disponibilidadController.getProfesionalesDisponibles);



module.exports = router;