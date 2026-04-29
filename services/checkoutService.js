// services/checkoutService.js
//Validar reserva, verificar stock (simulado) y cerrar el pedido.
'use strict';

const ReservaModel = require('../models/reservaModel');
const ProductoModel = require('../models/productoModel');
const createError = require('http-errors');

class CheckoutService {
    /**
     * Procesa el checkout de una reserva: valida items, verifica stock (placeholder) y cierra el pedido.
     * @param {string} reservaId
     * @param {Object} datosCliente - datos adicionales (dirección de envío, etc.)
     * @returns {Object} pedido creado
     */
    static async procesarCheckout(reservaId, datosCliente = {}) {
        // Obtener reserva
        const reserva = await ReservaModel.getById(reservaId);
        if (!reserva || !reserva.items.length) {
            throw createError(400, 'La reserva está vacía o no existe.');
        }

        // Validar stock (simulación - aquí podrías integrar un modelo de stock real)
        for (const item of reserva.items) {
            if (item.productoId) {
                const producto = ProductoModel.getById(item.productoId);
                if (!producto || !producto.activo) {
                    throw createError(400, `El producto ${item.nombre} ya no está disponible.`);
                }
                // Ejemplo: stock mínimo 1, podrías tener un campo producto.stock
                // if (producto.stock < item.cantidad) throw ...
            }
        }

        // Crear objeto pedido (persistir en pedidos.json - modelo a crear)
        const pedido = {
            id: `ped_${Date.now()}`,
            reservaId: reserva.id,
            usuarioId: reserva.usuarioId,
            sessionId: reserva.sessionId,
            items: reserva.items,
            total: this._calcularTotal(reserva.items),
            estado: 'pendiente',
            datosCliente,
            fechaCreacion: new Date().toISOString(),
        };
        // Aquí guardarías en un modelo `PedidoModel.create(pedido)`
        // Por ahora simulamos:
        console.log('✅ Checkout completado:', pedido.id);

        // Limpiar reserva
        await ReservaModel.clear(reservaId);

        return pedido;
    }

    static _calcularTotal(items) {
        return items.reduce((sum, item) => sum + (item.precioUnitario || 0) * (item.cantidad || 1), 0);
    }
}

module.exports = CheckoutService;