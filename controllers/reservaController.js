'use strict';

const reservaModel = require('../models/reservaModel');
const productoModel = require('../models/productoModel');
const servicioModel = require('../models/servicioModel');
const createError = require('http-errors');

// ─────────────────────────────────────────────────────────────────────────────
// Helpers internos
// ─────────────────────────────────────────────────────────────────────────────

function _getSessionId(req, res) {
    // Para usuarios logueados
    if (req.session?.usuarioId) {
        return req.session.id;
    }

    // Para huéspedes: usar cookie persistente
    let guestId = req.cookies?.guestId;
    if (!guestId && res) {
        guestId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10);
        res.cookie('guestId', guestId, {
            maxAge: 30 * 24 * 60 * 60 * 1000,
            httpOnly: true,
            secure: false
        });
        console.log('🍪 Nueva cookie guestId creada:', guestId);
    }
    return guestId;
}

async function _getOrCreateReserva(req, res) {
    const usuarioId = req.session?.usuarioId;
    const sessionId = _getSessionId(req, res);

    if (usuarioId) {
        return await reservaModel.getOrCreateByUsuarioId(usuarioId);
    } else {
        return await reservaModel.getOrCreateBySessionId(sessionId);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Controladores con manejo de errores unificado
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /reserva/agregar - Agregar item a la reserva
 */
async function agregarItem(req, res, next) {
    console.log('🔍 usuarioId en sesión:', req.session?.usuarioId);
    console.log('🔍 sessionId:', req.session?.id);

    try {
        const { productoId, servicioId, cantidad, tipo } = req.body;

        if (!cantidad || cantidad < 1) {
            return next(createError(400, 'La cantidad debe ser mayor a 0'));
        }

        let nombre = '';
        let precioUnitario = 0;

        if (tipo === 'producto' && productoId) {
            const producto = productoModel.getById(productoId);
            if (!producto || !producto.activo) {
                return next(createError(404, 'Producto no encontrado'));
            }
            nombre = producto.nombre;
            precioUnitario = producto.precio;
        } else if (tipo === 'servicio' && servicioId) {
            const servicio = servicioModel.getById(servicioId);
            if (!servicio || !servicio.activo) {
                return next(createError(404, 'Servicio no encontrado'));
            }
            nombre = servicio.nombre;
            precioUnitario = 0;
        } else {
            return next(createError(400, 'Debe especificar productoId o servicioId'));
        }

        const reserva = await _getOrCreateReserva(req, res);
        
        const itemExistenteAntes = reserva.items.find(item => item.productoId === productoId);
        const cantidadAnterior = itemExistenteAntes?.cantidad || 0;

        const resultado = reservaModel.addItem(
            reserva.id,
            productoId || null,
            servicioId || null,
            parseInt(cantidad),
            precioUnitario,
            nombre
        );

        const nuevaCantidadTotal = cantidadAnterior + parseInt(cantidad);

        res.json({
            success: true,
            item: resultado,
            cantidadAnterior: cantidadAnterior,
            nuevaCantidad: nuevaCantidadTotal,
            totalItems: reserva.items?.reduce((sum, item) => sum + item.cantidad, 0) || 0,
            reservaId: reserva.id
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

        const usuarioId = req.session?.usuarioId;
        const sessionId = _getSessionId(req, res);

        let reserva = null;
        
        if (usuarioId) {
            reserva = await reservaModel.getByUsuarioId(usuarioId);
        } else {
            reserva = await reservaModel.getBySessionId(sessionId);
        }

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
 * GET /reserva - Ver carrito
 */
async function verReserva(req, res, next) {
    try {
        const usuarioId = req.session?.usuarioId;
        const sessionId = _getSessionId(req, res);

        let reserva = null;
        if (usuarioId) {
            reserva = await reservaModel.getByUsuarioId(usuarioId);
        } else {
            reserva = await reservaModel.getBySessionId(sessionId);
        }

        const items = reserva?.items || [];

        let subtotal = 0;
        for (const item of items) {
            subtotal += (item.precioUnitario || 0) * item.cantidad;
        }

        console.log('🔍 verReserva - usuarioId:', req.session?.usuarioId);
        console.log('🔍 verReserva - sessionId:', req.session?.id);
        console.log('🔍 verReserva - reserva encontrada:', reserva);

        res.render('layout', {
            title: 'Mi Reserva - E-E',
            pageCss: 'reserve',
            currentPage: 'reserve',
            body: 'pages/products/reserve',
            reserva: reserva,
            items: reserva?.items || [],
            subtotal: subtotal,
            total: subtotal,
            esUsuario: !!usuarioId,
            mensaje: req.query.mensaje || null,
            error: req.query.error || null
        });

    } catch (err) {
        console.error('❌ Error en verReserva:', err.message);
        next(createError(500, err.message));
    }
}

/**
 * PUT /reserva/item/:itemId - Actualizar cantidad de un item
 */
async function actualizarItem(req, res, next) {
    try {
        const { itemId } = req.params;
        const { cantidad } = req.body;

        if (!cantidad || cantidad < 0) {
            return next(createError(400, 'Cantidad inválida'));
        }

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

        if (cantidad === 0) {
            reservaModel.removeItem(reserva.id, itemId);
        } else {
            reservaModel.updateItem(reserva.id, itemId, parseInt(cantidad));
        }

        const reservaActualizada = usuarioId ?
            await reservaModel.getByUsuarioId(usuarioId) :
            await reservaModel.getBySessionId(sessionId);

        let subtotal = 0;
        for (const item of reservaActualizada?.items || []) {
            subtotal += (item.precioUnitario || 0) * item.cantidad;
        }

        res.json({
            success: true,
            items: reservaActualizada?.items || [],
            subtotal: subtotal,
            total: subtotal
        });

    } catch (err) {
        console.error('❌ Error en actualizarItem:', err.message);
        next(createError(500, err.message));
    }
}

/**
 * GET /reserva/count - Obtener cantidad total de items
 */
async function contarItems(req, res, next) {
    try {
        const usuarioId = req.session?.usuarioId;
        const sessionId = _getSessionId(req, res);

        let reserva = null;
        if (usuarioId) {
            reserva = await reservaModel.getByUsuarioId(usuarioId);
        } else if (sessionId) {
            reserva = await reservaModel.getBySessionId(sessionId);
        }

        const totalItems = reserva?.items?.reduce((sum, item) => sum + (item.cantidad || 1), 0) || 0;

        res.json({ totalItems: totalItems });

    } catch (err) {
        console.error('Error en contarItems:', err);
        next(createError(500, err.message));
    }
}

/**
 * DELETE /reserva/item/:itemId - Eliminar un item
 */
async function eliminarItem(req, res, next) {
    try {
        const { itemId } = req.params;

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

        reservaModel.removeItem(reserva.id, itemId);

        const reservaActualizada = usuarioId ?
            await reservaModel.getByUsuarioId(usuarioId) :
            await reservaModel.getBySessionId(sessionId);

        let subtotal = 0;
        for (const item of reservaActualizada?.items || []) {
            subtotal += (item.precioUnitario || 0) * item.cantidad;
        }

        res.json({
            success: true,
            items: reservaActualizada?.items || [],
            subtotal: subtotal,
            total: subtotal
        });

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

module.exports = {
    agregarItem,
    verReserva,
    actualizarItem,
    contarItems,
    eliminarItem,
    vaciarReserva,
    detectoProductoEnReserva
};