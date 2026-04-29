//Resolución de identidad (guest/user), cálculos de totales, validación de items con metadatos.
// services/reserveService.js
'use strict';

const ReservaModel = require('../models/reservaModel');
const ProductoModel = require('../models/productoModel');
const ServicioModel = require('../models/servicioModel');
const createError = require('http-errors');

class ReserveService {
    /**
      * Obtiene la reserva activa SIN crearla si no existe (solo lectura).
      * @param {Object} req - request de Express
      * @returns {Object|null} reserva o null
      */
    static async getReserva(req) {
        const usuarioId = req.session?.usuarioId;
        const sessionId = req.session?.id;
        if (usuarioId) {
            return await ReservaModel.getByUsuarioId(usuarioId);
        } else if (sessionId) {
            return await ReservaModel.getBySessionId(sessionId);
        } else {
            // Si no hay guestId en cookie, retornar null sin crear
            const guestId = req.cookies?.guestId;
            if (guestId) {
                return await ReservaModel.getBySessionId(guestId);
            }
            return null;
        }
    }


    /**
  * Obtiene o crea la reserva (solo para operaciones de escritura, ej. agregar item).
  * @param {Object} req, res
  * @returns {Object} reserva (siempre creada si no existe)
  */
    static async getOrCreateReserva(req, res) {
        let reserva = await this.getReserva(req);
        if (!reserva) {
            const usuarioId = req.session?.usuarioId;

            let identityId;

            if (usuarioId) {
                return await ReservaModel.getOrCreateByUsuarioId(usuarioId);
            }

            // 👇 SIEMPRE usar guestId para invitados
            let guestId = req.cookies?.guestId;

            if (!guestId) {
                guestId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
                res.cookie('guestId', guestId, {
                    maxAge: 30 * 24 * 60 * 60 * 1000,
                    httpOnly: true
                });
            }

            return await ReservaModel.getOrCreateBySessionId(guestId);
        }

        return reserva;
    }


    /**
     * Calcula el subtotal y total de una reserva.
     * @param {Object} reserva
     * @returns {Object} { subtotal, totalServicios, total }
     */
    static calcularTotales(reserva) {
        const items = reserva.items || [];
        console.log('🔍 calcularTotales - items en reserva:', items.length);
        let subtotal = 0;
        let totalServicios = 0;
        for (const item of items) {
            const precio = item.precioUnitario || 0;
            const cantidad = item.cantidad || 1;

            // Producto
            if (item.productoId) {
                subtotal += precio * cantidad;
            }

            // Servicio
            if (item.servicioId) {
                totalServicios += precio;
            }
        }
        const total = subtotal + totalServicios;
        return { subtotal, totalServicios, total };
    }

    /**
     * Valida que un item tenga todos los metadatos requeridos (especialmente para servicios de instalación).
     * @param {Object} itemData
     * @throws {Error} si falta información crítica.
     */
    static validarItem(itemData) {

        if (itemData.tipo === 'combo') {
            if (!itemData.productoId || !itemData.servicioId) {
                throw createError(400, 'Un combo debe tener productoId y servicioId');
            }
            // Si es combo con instalación, debe tener profesional, fecha, horario (depende de lógica de negocio)
            if (itemData.servicioId && (!itemData.fechaInstalacion || !itemData.horarioInstalacion || !itemData.profesionalId)) {
                throw createError(400, 'Para el servicio del combo debe seleccionar fecha, horario y profesional.');
            }
        } else if (itemData.tipo === 'servicio' && itemData.servicioId) {
            // Si es un servicio de instalación, debe tener fecha, horario y profesional
            const servicio = ServicioModel.getById(itemData.servicioId);
            if (servicio && (servicio.precioBase > 0 || servicio.precioPorHora > 0)) {
                if (!itemData.fechaInstalacion || !itemData.horarioInstalacion || !itemData.profesionalId) {
                    throw createError(400, 'Para este servicio debe seleccionar fecha, horario y profesional.');
                }
            }
        } else if (itemData.tipo === 'producto' && itemData.productoId) {
            // Para productos, validar que la cantidad sea al menos 1
            if (!itemData.cantidad || parseInt(itemData.cantidad) < 1) {
                throw createError(400, 'La cantidad de productos debe ser al menos 1.');
            }
        }
        // Otras validaciones según reglas de negocio
        return true;
    }

    /**
     * Agrega un item a la reserva con validaciones previas.
     * @param {Object} req, res
     * @param {Object} itemData - { productoId, servicioId, cantidad, tipo, profesionalId, fechaInstalacion, horarioInstalacion }
     * @returns {Object} item agregado o actualizado
     */
    static async agregarItem(req, res, itemData) {
        this.validarItem(itemData);
        console.log('🟡 agregarItem - itemData tipo:', itemData.tipo);
        let nombre = '';
        let precioUnitario = 0;

        if (itemData.tipo === 'producto' && itemData.productoId) {
            const producto = ProductoModel.getById(itemData.productoId);
            if (!producto || !producto.activo) throw createError(404, 'Producto no encontrado');
            nombre = producto.nombre;
            precioUnitario = producto.precio;
        }
        else if (itemData.tipo === 'servicio' && itemData.servicioId) {
            const servicio = ServicioModel.getById(itemData.servicioId);
            if (!servicio || !servicio.activo) throw createError(404, 'Servicio no encontrado');
            nombre = servicio.nombre;
            precioUnitario = servicio.precioBase || servicio.precioPorHora || 0;
        }
        else if (itemData.tipo === 'combo' && itemData.productoId && itemData.servicioId) {
            const producto = ProductoModel.getById(itemData.productoId);
            const servicio = ServicioModel.getById(itemData.servicioId);
            if (!producto || !producto.activo) throw createError(404, 'Producto no encontrado');
            if (!servicio || !servicio.activo) throw createError(404, 'Servicio no encontrado');
            nombre = `${producto.nombre} + Servicio (${servicio.nombre})`;
            precioUnitario = (producto.precio || 0) + (servicio.precioBase || servicio.precioPorHora || 0);
        }
        else {
            throw createError(400, 'Datos de ítem inválidos');
        }

        const reserva = await this.getOrCreateReserva(req, res);
        console.log('🔍 agregarItem - reservaId:', reserva.id, 'usuarioId:', reserva.usuarioId);
        const item = ReservaModel.addItem(
            reserva.id,
            itemData.productoId || null,
            itemData.servicioId || null,
            {
                cantidad: parseInt(itemData.cantidad),
                precioUnitario,
                nombre,
                tipo: itemData.tipo,
                profesionalId: itemData.profesionalId,
                fechaInstalacion: itemData.fechaInstalacion,
                horarioInstalacion: itemData.horarioInstalacion,
            }
        );
        console.log('🔍 agregarItem - item agregado:', item);
        return { item, reservaId: reserva.id };
    }


    static async actualizarCantidad(req, res, itemId, cantidad) {
        const reserva = await this.getReserva(req);
        if (!reserva) return next(createError(404, 'No hay una reserva activa'));
        const itemActualizado = ReservaModel.updateItem(
            reserva.id,
            itemId,
            { cantidad: parseInt(cantidad) } // Solo actualizamos la cantidad, el resto de los datos del item permanecen igual
        );

        if (!itemActualizado) {
            throw createError(404, 'Item no encontrado en la reserva');
        }

        return itemActualizado;
    }

    /**
     * Elimina un item de la reserva.
     */
    static async eliminarItem(req, res, itemId) {
        const reserva = await this.getReserva(req);
        if (!reserva) return next(createError(404, 'No hay una reserva activa'));
        ReservaModel.removeItem(reserva.id, itemId);
        return true;
    }
}

module.exports = ReserveService;