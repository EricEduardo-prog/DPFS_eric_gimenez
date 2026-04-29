const express = require('express');
const router = express.Router();
const disponibilidadController = require('../controllers/disponibilidadController');
const ProfessionalService = require('../services/professionalService');

// GET /profesionales?servicioId=serv_003&fecha=2024-01-15&turno=manana
router.get('/profesionales',disponibilidadController.getProfesionalesDisponibles ,ProfessionalService.getProfesionalesDisponibles);



module.exports = router;