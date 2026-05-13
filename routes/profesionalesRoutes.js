'use strict';


const express = require('express');
const router = express.Router();
const controller = require('../controllers/profesionalesController');
const { isAdmin } = require('../middlewares/authMiddleware');
const { validarProfesional } = require('../validations/profesionalValidation');

router.get('/', isAdmin, controller.listar);
router.get('/nuevo', isAdmin, controller.mostrarFormNuevo);
router.post('/', isAdmin, validarProfesional, controller.crear);

router.get('/:id/editar', isAdmin, controller.mostrarFormEditar);
router.put('/:id', isAdmin, validarProfesional, controller.actualizar);
router.post('/:id', isAdmin, validarProfesional, controller.actualizar);

router.post('/:id/baja', isAdmin, validarProfesional, controller.toggleBaja);

module.exports = router;