// services/reserveService.js
'use strict';

const { Booking, BookingItem, Product, Service, Professional } = require('../database/models');
const createError = require('http-errors');
const { Op } = require('sequelize');

class ReserveService {
    /**
     * Obtiene la reserva activa SIN crearla si no existe (solo lectura).
     * @param {Object} req - request de Express
     * @returns {Promise<Object|null>} reserva o null
     */
    static async getReserva(req) {
        const usuarioId = req.session?.usuarioId;
        let booking = null;
        if (usuarioId) {
            booking = await Booking.findOne({
                where: { user_id: usuarioId },
                include: [{ model: BookingItem, as: 'items' }]
            });
        } else {
            const guestId = req.cookies?.guestId;
            if (guestId) {
                booking = await Booking.findOne({
                    where: { session_id: guestId },
                    include: [{ model: BookingItem, as: 'items' }]
                });
            }
        }
        return booking ? booking.toJSON() : null;
    }

    /**
     * Obtiene o crea la reserva (solo para operaciones de escritura, ej. agregar item).
     * @param {Object} req, res
     * @returns {Promise<Object>} reserva (siempre creada si no existe)
     */
    static async getOrCreateReserva(req, res) {
        let booking = null;
        const usuarioId = req.session?.usuarioId;

        if (usuarioId) {
            booking = await Booking.findOne({ where: { user_id: usuarioId } });
            if (!booking) {
                booking = await Booking.create({
                    id: `res_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                    user_id: usuarioId,
                    session_id: null
                });
            }
        } else {
            let guestId = req.cookies?.guestId;
            if (!guestId) {
                guestId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
                res.cookie('guestId', guestId, {
                    maxAge: 30 * 24 * 60 * 60 * 1000,
                    httpOnly: true
                });
            }
            booking = await Booking.findOne({ where: { session_id: guestId } });
            if (!booking) {
                booking = await Booking.create({
                    id: `res_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                    user_id: null,
                    session_id: guestId
                });
            }
        }
        return booking.toJSON();
    }

    /**
     * Calcula el subtotal y total de una reserva.
     * @param {Object} reserva
     * @returns {Object} { subtotal, totalServicios, total }
     */
    static calcularTotales(reserva) {
        const items = reserva.items || [];
        let subtotal = 0;
        let totalServicios = 0;
        for (const item of items) {
            const precio = item.unit_price || 0;
            const cantidad = item.quantity || 1;
            if (item.product_id) {
                subtotal += precio * cantidad;
            }
            if (item.service_id) {
                totalServicios += precio;
            }
        }
        const total = subtotal + totalServicios;
        return { subtotal, totalServicios, total };
    }

    /**
     * Valida que un item tenga todos los metadatos requeridos.
     * @param {Object} itemData
     * @throws {Error}
     */
    static async validarItem(itemData) {
        if (itemData.tipo === 'combo') {
            if (!itemData.productoId || !itemData.servicioId) {
                throw createError(400, 'Un combo debe tener productoId y servicioId');
            }
            if (itemData.servicioId && (!itemData.fechaInstalacion || !itemData.horarioInstalacion || !itemData.profesionalId)) {
                throw createError(400, 'Para el servicio del combo debe seleccionar fecha, horario y profesional.');
            }
        } else if (itemData.tipo === 'servicio' && itemData.servicioId) {
            const servicio = await Service.findByPk(itemData.servicioId);
            if (servicio && (servicio.base_price > 0 || servicio.hourly_price > 0)) {
                if (!itemData.fechaInstalacion || !itemData.horarioInstalacion || !itemData.profesionalId) {
                    throw createError(400, 'Para este servicio debe seleccionar fecha, horario y profesional.');
                }
            }
        } else if (itemData.tipo === 'producto' && itemData.productoId) {
            if (!itemData.cantidad || parseInt(itemData.cantidad) < 1) {
                throw createError(400, 'La cantidad de productos debe ser al menos 1.');
            }
        }
        return true;
    }

    /**
     * Agrega un item a la reserva.
     * @param {Object} req, res
     * @param {Object} itemData
     * @returns {Promise<Object>} { item, reservaId }
     */
    static async agregarItem(req, res, itemData) {
        await this.validarItem(itemData);

        let nombre = '';
        let precioUnitario = 0;

        if (itemData.tipo === 'producto' && itemData.productoId) {
            const producto = await Product.findByPk(itemData.productoId);
            if (!producto || !producto.is_active) throw createError(404, 'Producto no encontrado');
            nombre = producto.name;
            precioUnitario = producto.price;
        } else if (itemData.tipo === 'servicio' && itemData.servicioId) {
            const servicio = await Service.findByPk(itemData.servicioId);
            if (!servicio || !servicio.is_active) throw createError(404, 'Servicio no encontrado');
            nombre = servicio.name;
            precioUnitario = servicio.base_price || servicio.hourly_price || 0;
        } else if (itemData.tipo === 'combo' && itemData.productoId && itemData.servicioId) {
            const [producto, servicio] = await Promise.all([
                Product.findByPk(itemData.productoId),
                Service.findByPk(itemData.servicioId)
            ]);
            if (!producto || !producto.is_active) throw createError(404, 'Producto no encontrado');
            if (!servicio || !servicio.is_active) throw createError(404, 'Servicio no encontrado');
            nombre = `${producto.name} + Servicio (${servicio.name})`;
            precioUnitario = (producto.price || 0) + (servicio.base_price || servicio.hourly_price || 0);
        } else {
            throw createError(400, 'Datos de ítem inválidos');
        }

        const reserva = await this.getOrCreateReserva(req, res);
        const booking = await Booking.findByPk(reserva.id);

        // Crear el ítem
        const newItem = await BookingItem.create({
            id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            booking_id: booking.id,
            type: itemData.tipo,
            product_id: itemData.productoId || null,
            service_id: itemData.servicioId || null,
            quantity: parseInt(itemData.cantidad) || 1,
            unit_price: precioUnitario,
            name: nombre,
            professional_id: itemData.profesionalId || null,
            installation_date: itemData.fechaInstalacion || null,
            installation_time: itemData.horarioInstalacion || null
        });

        return { item: newItem.toJSON(), reservaId: reserva.id };
    }

    /**
     * Actualiza la cantidad de un item existente.
     * @param {Object} req, res
     * @param {string} itemId
     * @param {number} cantidad
     * @returns {Promise<Object>}
     */
    static async actualizarCantidad(req, res, itemId, cantidad) {
        const reserva = await this.getReserva(req);
        if (!reserva) throw createError(404, 'No hay una reserva activa');

        const bookingId = reserva.id;
        const item = await BookingItem.findOne({
            where: { id: itemId, booking_id: bookingId }
        });
        if (!item) throw createError(404, 'Item no encontrado en la reserva');

        await item.update({ quantity: parseInt(cantidad) });
        return item.toJSON();
    }

    /**
     * Elimina un item de la reserva.
     * @param {Object} req, res
     * @param {string} itemId
     * @returns {Promise<boolean>}
     */
    static async eliminarItem(req, res, itemId) {
        const reserva = await this.getReserva(req);
        if (!reserva) throw createError(404, 'No hay una reserva activa');

        const bookingId = reserva.id;
        const deleted = await BookingItem.destroy({
            where: { id: itemId, booking_id: bookingId }
        });
        if (deleted === 0) throw createError(404, 'Item no encontrado');
        return true;
    }
}

module.exports = ReserveService;