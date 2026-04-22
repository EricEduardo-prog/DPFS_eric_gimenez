'use strict';

const express = require('express');
const router = express.Router();
const controller = require('../controllers/reservaController');
const { isUser } = require('../middlewares/authMiddleware');

// ============================================================
// RUTAS DE RESERVA (CARRITO)
// ============================================================
// GET /reserva/detecto/:itemId - Verificar si item está en reserva
router.get('/detecto/:itemId', controller.detectoProductoEnReserva);

// GET /reserva/count - Contar items en reserva (público, requiere sesión)
router.get('/count', controller.contarItems);

// GET /reserva - Ver carrito (público, requiere sesión)
router.get('/', controller.verReserva);

// POST /reserva/agregar - Agregar item (público, requiere sesión)
router.post('/agregar', controller.agregarItem);

// PUT /reserva/item/:itemId - Actualizar cantidad (público, requiere sesión)
router.put('/item/:itemId', controller.actualizarItem);


// DELETE /reserva/item/:itemId - Eliminar item (público, requiere sesión)
router.delete('/item/:itemId', controller.eliminarItem);

// DELETE /reserva - Vaciar reserva (público, requiere sesión)
router.delete('/', controller.vaciarReserva);

module.exports = router;