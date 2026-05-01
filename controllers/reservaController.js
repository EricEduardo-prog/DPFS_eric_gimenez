'use strict';

const createError = require('http-errors');
const { validationResult } = require('express-validator');
const ReserveService = require('../services/reserveService');
const CheckoutService = require('../services/checkoutService');
const { Professional } = require('../database/models');

/**
 * GET /reserva - Ver reserva actual
 */
async function verReserva(req, res, next) {
    try {
        const reserva = await ReserveService.getReserva(req);
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
        // Enriquecer items con datos del profesional (nombre, rating, trabajos)
        const itemsEnriquecidos = await Promise.all(items.map(async (item) => {
            if (item.professional_id) {
                const profesional = await Professional.findByPk(item.professional_id, {
                    attributes: ['name', 'rating_value', 'jobs_completed']
                });
                if (profesional) {
                    return {
                        ...item,
                        profesionalNombre: profesional.name,
                        profesionalRating: profesional.rating_value || 0,
                        profesionalTrabajos: profesional.jobs_completed || 0
                    };
                }
            }
            return item;
        }));

        // Separar productos y servicios
        const productosItems = itemsEnriquecidos.filter(item => item.product_id && !item.service_id);
        const serviciosItems = itemsEnriquecidos.filter(item => item.service_id && !item.product_id);

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
            esUsuario: !!reserva.user_id,
            mensaje: req.query.mensaje || null,
            error: req.query.error || null
        });
    } catch (err) {
        console.error('❌ Error en verReserva:', err.message);
        next(createError(500, err.message));
    }
}

/**
 * POST /reserva/agregar - Agregar item a la reserva (AJAX)
 */
async function agregarItem(req, res, next) {
    try {
        const errores = validationResult(req);
        if (!errores.isEmpty()) {
            return res.status(400).json({ errores: errores.array().map(e => e.msg) });
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
 * GET /reserva/detecto/:itemId - Verificar si item está en reserva (AJAX)
 */
async function detectoProductoEnReserva(req, res, next) {
    try {
        const { itemId } = req.params;
        const reserva = await ReserveService.getReserva(req);
        if (!reserva) {
            return res.json({ existe: false, cantidad: 0 });
        }
        const item = reserva.items.find(item => item.id === itemId);
        res.json({
            existe: !!item,
            cantidad: item?.quantity || 0
        });
    } catch (err) {
        console.error('Error en detectoProductoEnReserva:', err);
        next(createError(500, err.message));
    }
}

/**
 * PUT /reserva/actualizar/:itemId - Actualizar cantidad (AJAX)
 */
async function actualizarCantidad(req, res, next) {
    try {
        const errores = validationResult(req);
        if (!errores.isEmpty()) {
            return res.status(400).json({ errores: errores.array().map(e => e.msg) });
        }
        const { itemId } = req.params;
        const { cantidad } = req.body;
        if (parseInt(cantidad) === 0) {
            await ReserveService.eliminarItem(req, res, itemId);
            return res.json({ success: true, eliminado: true });
        }
        const resultado = await ReserveService.actualizarCantidad(req, res, itemId, cantidad);
        res.json({ success: true, item: resultado });
    } catch (err) {
        console.error('❌ Error en actualizarCantidad:', err.message);
        next(createError(500, err.message));
    }
}

/**
 * DELETE /reserva/eliminar/:itemId - Eliminar item (AJAX)
 */
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
 * GET /reserva/count - Obtener cantidad total de items (AJAX)
 */
async function contarItems(req, res, next) {
    try {
        const reserva = await ReserveService.getReserva(req);
        const totalItems = reserva?.items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0;
        res.json({ totalItems });
    } catch (err) {
        console.error('Error en contarItems:', err);
        next(createError(500, err.message));
    }
}

/**
 * DELETE /reserva - Vaciar toda la reserva (AJAX)
 */
async function vaciarReserva(req, res, next) {
    try {
        const reserva = await ReserveService.getReserva(req);
        if (!reserva) {
            return next(createError(404, 'Reserva no encontrada'));
        }
        const { BookingItem } = require('../database/models');
        await BookingItem.destroy({ where: { booking_id: reserva.id } });
        res.json({ success: true });
    } catch (err) {
        console.error('❌ Error en vaciarReserva:', err.message);
        next(createError(500, err.message));
    }
}

/**
 * POST /reserva/checkout - Confirmar compra
 */
async function confirmarCheckout(req, res, next) {
    try {
        const reserva = await ReserveService.getReserva(req);
        if (!reserva) {
            return res.redirect('/reserva?error=No hay reserva activa');
        }
        const resultado = await CheckoutService.procesarCheckout(reserva.id, req.body);
        res.redirect(`/confirmacion?orderId=${resultado.id}`);
    } catch (err) {
        console.error('❌ Error en confirmarCheckout:', err.message);
        res.redirect(`/reserva?error=${encodeURIComponent(err.message)}`);
    }
}

module.exports = {
    verReserva,
    agregarItem,
    detectoProductoEnReserva,
    actualizarCantidad,
    eliminarItem,
    contarItems,
    vaciarReserva,
    confirmarCheckout
};