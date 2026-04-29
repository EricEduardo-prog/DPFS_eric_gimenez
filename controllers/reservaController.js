'use strict';

const ReservaModel = require('../models/reservaModel');
const ProductoModel = require('../models/productoModel');
const ProfesionalesModel = require('../models/profesionalesModel');
const createError = require('http-errors');

const reservaModel = ReservaModel;
const productoModel = ProductoModel;
const profesionalesModel = ProfesionalesModel;

const { validationResult } = require('express-validator');

const CheckoutService = require('../services/checkoutService');
const ReserveService = require('../services/reserveService');


async function agregarItem(req, res, next) {

    try {
        const errores = validationResult(req);

        if (!errores.isEmpty()) {
            return res.status(400).json({
                errores: errores.array().map(e => e.msg)
            });
        }

        const resultado = await ReserveService.agregarItem(req, res, req.body);

        res.json({
            success: true,
            item: resultado.item,
            reservaId: resultado.reservaId
        });

    } catch (err) {
        console.error('❌ Error en agregarItem:', err.message);
        next(createError(500, err.message));
    }
}

/**
 * GET /reserva/detecto/:itemId - Verificar si item está en reserva
 */
async function detectoProductoEnReserva(req, res, next) {
    try {
        const { itemId } = req.params;

        const reserva = await ReserveService.getReserva(req);

        if (!reserva) {
            return res.json({ existe: false, cantidad: 0 });
        }

        const item = reserva.items.find(item => item.itemId === itemId);

        res.json({
            existe: !!item,
            cantidad: item?.cantidad || 0
        });
    } catch (err) {
        console.error('Error en detectoProductoEnReserva:', err);
        next(createError(500, err.message));
    }
}

/**
 * GET /reserva - Ver reserva actual
 */
async function verReserva(req, res, next) {
    try {
        const reserva = await ReserveService.getReserva(req); // Solo lectura
        if (!reserva) {
            return res.render('layout', {
                title: 'Mi Reserva - E-E',
                pageCss: 'reserve',
                currentPage: 'reserve',
                body: 'pages/products/reserve',
                reserva: null,
                items: [],
                productosItems: [],
                serviciosItems: [],
                subtotal: 0,
                totalServicios: 0,
                total: 0
            });
        }
        const items = reserva.items || [];
        //  ENRIQUECER ITEMS CON DATOS DEL PROFESIONAL (si tienen profesionalId)
        // Esto permite mostrar nombre, rating y trabajos completados del profesional en la vista

        const itemsEnriquecidos = await Promise.all(items.map(async (item) => {
            if (item.profesionalId) {
                const profesional = profesionalesModel.getById(item.profesionalId);
                if (profesional) {
                    return {
                        ...item,
                        profesionalNombre: profesional.nombre,
                        profesionalRating: profesional.valoracion?.valor || 0,
                        profesionalTrabajos: profesional.trabajosCompletados || 0
                    };
                }
            }
            return item;
        }));


        // Separar productos y servicios
        const productosItems = itemsEnriquecidos.filter(item => item.productoId && !item.servicioId);
        const serviciosItems = itemsEnriquecidos.filter(item => item.servicioId && !item.productoId);

        const { subtotal, totalServicios, total } = ReserveService.calcularTotales(reserva);

        res.render('layout', {
            title: 'Mi Reserva - E-E',
            pageCss: 'reserve',
            currentPage: 'reserve',
            body: 'pages/products/reserve',
            reserva: reserva,
            items: itemsEnriquecidos,
            productosItems: productosItems,
            serviciosItems: serviciosItems,
            subtotal: subtotal,
            totalServicios: totalServicios,
            total: total,
            esUsuario: reserva.usuarioId,
            mensaje: req.query.mensaje || null,
            error: req.query.error || null
        });

        console.log('🔍 verReserva - usuarioId:', req.session?.usuarioId);
        console.log('🔍 verReserva - reserva encontrada:', reserva?.id);
        console.log('🔍 verReserva - servicios con profesional:', serviciosItems.filter(s => s.profesionalId).length);

    } catch (err) {
        console.error('❌ Error en verReserva:', err.message);
        next(createError(500, err.message));
    }
}

async function actualizarCantidad(req, res, next) {
    try {
        const errores = validationResult(req);

        if (!errores.isEmpty()) {
            return res.status(400).json({
                errores: errores.array().map(e => e.msg)
            });
        }

        const { itemId } = req.params;
        const { cantidad } = req.body;

        console.log('🟡 actualizarCantidad:', { itemId, cantidad });

        if (parseInt(cantidad) === 0) {
            await ReserveService.eliminarItem(req, res, itemId);

            return res.json({
                success: true,
                eliminado: true
            });
        }

        //  actualizar cantidad
        const resultado = await ReserveService.actualizarCantidad(req, res, itemId, cantidad);

        res.json({
            success: true,
            item: resultado
        });

    } catch (err) {
        console.error('❌ Error en actualizarCantidad:', err.message);
        next(createError(500, err.message));
    }
}

/**
 * GET /reserva/count - Obtener cantidad total de items
 */
async function contarItems(req, res, next) {
    try {
        const reserva = await ReserveService.getReserva(req);
        console.log('🔍 contarItems - reserva encontrada:', reserva);
        const totalItems = reserva?.items?.reduce((sum, item) => sum + (item.cantidad || 1), 0) || 0;
        console.log('🔍 contarItems - totalItems:', totalItems);
        res.json({ totalItems: totalItems });

    } catch (err) {
        console.error('Error en contarItems:', err);
        next(createError(500, err.message));
    }
}

async function eliminarItem(req, res, next) {
    try {
        const { itemId } = req.params;

        await ReserveService.eliminarItem(req, res, itemId);

        res.json({ success: true });

    } catch (err) {
        console.error('❌ Error en eliminarItem:', err.message);
        next(createError(500, err.message));
    }
}

/**
 * DELETE /reserva - Vaciar toda la reserva
 */
async function vaciarReserva(req, res, next) {
    try {
        const usuarioId = req.session?.usuarioId;
        const sessionId = _getSessionId(req, res);

        let reserva = null;
        if (usuarioId) {
            reserva = await reservaModel.getByUsuarioId(usuarioId);
        } else {
            reserva = await reservaModel.getBySessionId(sessionId);
        }

        if (!reserva) {
            return next(createError(404, 'Reserva no encontrada'));
        }

        reservaModel.clear(reserva.id);

        res.json({ success: true });

    } catch (err) {
        console.error('❌ Error en vaciarReserva:', err.message);
        next(createError(500, err.message));
    }
}

// nuevo metodo POST reserva/checkout - usa services/checkoutService.js
async function confirmarCheckout(req, res, next) {
    try {
        const usuarioId = req.session.usuarioId; // Extrae datos de la sesión [2]

        // El controlador NO sabe cómo se procesa la compra, solo llama al servicio
        const resultado = await CheckoutService.procesarCompra(usuarioId, req.body);

        res.redirect(`/confirmacion?orderId=${resultado.orderId}`);
    } catch (err) {
        // El servicio lanza errores de negocio, el controlador los captura [2]
        res.redirect(`/reserva?error=${encodeURIComponent(err.message)}`);
    }
}

module.exports = {
    verReserva,
    agregarItem,
    contarItems,
    eliminarItem,
    vaciarReserva,
    confirmarCheckout,
    detectoProductoEnReserva,
    actualizarCantidad
};