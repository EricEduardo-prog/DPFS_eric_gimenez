'use strict';

const express = require('express');
const router = express.Router();
const controller = require('../controllers/reservaController');
const { isUser } = require('../middlewares/authMiddleware');
const { validarAgregarItem, validarActualizarItem, validarEliminarItem } = require('../validations/reservaValidation');
const ReserveService = require('../services/reserveService');


// GET /reserva/detecto/:itemId - Verificar si item está en reserva
router.get('/detecto/:itemId', controller.detectoProductoEnReserva);

// GET /reserva/count - Contar items en reserva (público, requiere sesión)
router.get('/count', controller.contarItems);

// GET /reserva - Ver carrito (público, requiere sesión)
router.get('/', controller.verReserva);

// POST /reserva/agregar - Agregar item (público, requiere sesión)
router.post('/agregar', validarAgregarItem, controller.agregarItem);

// PUT /reserva/item/:itemId - Actualizar cantidad (público, requiere sesión)
router.put('/item/:itemId', validarActualizarItem, controller.actualizarCantidad, ReserveService.actualizarCantidad);

// DELETE /reserva/item/:itemId - Eliminar item (público, requiere sesión)
router.delete('/item/:itemId', validarEliminarItem, controller.eliminarItem, ReserveService.eliminarItem);

// DELETE /reserva - Vaciar reserva (público, requiere sesión)
router.delete('/', validarEliminarItem, controller.vaciarReserva);

// POST reserva/checkout - Finalizar reserva (público, requiere sesión)
router.post('/checkout', controller.confirmarCheckout);

module.exports = router;