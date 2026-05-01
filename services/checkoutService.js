// services/checkoutService.js
'use strict';

const { Booking, BookingItem, Product, sequelize } = require('../database/models');
const createError = require('http-errors');

class CheckoutService {
    /**
     * Procesa el checkout de una reserva.
     * @param {string} reservaId
     * @param {Object} datosCliente
     * @returns {Promise<Object>} pedido creado
     */
    static async procesarCheckout(reservaId, datosCliente = {}) {
        const reserva = await Booking.findByPk(reservaId, {
            include: [{ model: BookingItem, as: 'items' }]
        });
        if (!reserva || reserva.items.length === 0) {
            throw createError(400, 'La reserva está vacía o no existe.');
        }

        // Validar stock (simulación) y disponibilidad de productos/servicios activos
        for (const item of reserva.items) {
            if (item.product_id) {
                const producto = await Product.findByPk(item.product_id);
                if (!producto || !producto.is_active) {
                    throw createError(400, `El producto ${item.name} ya no está disponible.`);
                }
                // Si se tuviera campo stock: if (producto.stock < item.quantity) throw...
            } else if (item.service_id) {
                const Service = require('../database/models').Service;
                const servicio = await Service.findByPk(item.service_id);
                if (!servicio || !servicio.is_active) {
                    throw createError(400, `El servicio ${item.name} ya no está disponible.`);
                }
            }
        }

        // Crear pedido (simulación – como no existe modelo Pedido, devolvemos objeto)
        const pedido = {
            id: `ped_${Date.now()}`,
            reservaId: reserva.id,
            usuarioId: reserva.user_id,
            sessionId: reserva.session_id,
            items: reserva.items.map(i => i.toJSON()),
            total: this._calcularTotal(reserva.items),
            estado: 'pendiente',
            datosCliente,
            fechaCreacion: new Date().toISOString(),
        };

        // Limpiar reserva (eliminar items y luego la reserva, o dejarla como histórico)
        // Por coherencia con la versión original: se limpia la reserva
        await BookingItem.destroy({ where: { booking_id: reserva.id } });
        await reserva.destroy();

        console.log('✅ Checkout completado:', pedido.id);
        return pedido;
    }

    static _calcularTotal(items) {
        return items.reduce((sum, item) => sum + (item.unit_price || 0) * (item.quantity || 1), 0);
    }
}

module.exports = CheckoutService;