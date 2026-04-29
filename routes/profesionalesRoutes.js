'use strict';


const express = require('express');
const router = express.Router();
const controller = require('../controllers/profesionalesController');
const { isAdmin } = require('../middlewares/authMiddleware');
const { validarProfesional } = require('../validations/profesionalValidation');
const ProfesionalService = require('../services/professionalService');

router.get('/', isAdmin, controller.listar);
router.get('/nuevo', isAdmin, controller.mostrarFormNuevo);
router.post('/', isAdmin, validarProfesional, ProfesionalService.normalizarDisponibilidad);     // POST admin/profesionales 

router.get('/:id/editar', isAdmin, controller.mostrarFormEditar);
// Para actualizar (soporta PUT directo y POST con _method)
router.put('/:id', isAdmin, validarProfesional, ProfesionalService.normalizarDisponibilidad);  // PUT admin/profesionales/:id  
router.post('/:id', isAdmin, validarProfesional, ProfesionalService.normalizarDisponibilidad); // ← Para compatibilidad con _method

router.delete('/:id/baja',  isAdmin, validarProfesional, controller.toggleBaja);     // DELETE /admin/profesionales/:id/baja
router.post('/:id/baja', isAdmin, validarProfesional, controller.toggleBaja);       // POST con _method=DELETE

module.exports = router;