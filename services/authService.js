// services/authService.js
'use strict';

const { User, Booking, BookingItem, sequelize } = require('../database/models');
const bcrypt = require('bcrypt');
const createError = require('http-errors');

const SALT_ROUNDS = 10;

class AuthService {
    /**
     * Registra un nuevo usuario.
     * @param {Object} data - { nombre, email, password, telefono, direccion, aceptoTerminos }
     * @returns {Promise<Object>} usuario creado (sin passwordHash)
     */
    static async registrar(data) {
        const existente = await User.findOne({ where: { email: data.email } });
        if (existente) {
            throw createError(400, 'El email ya está registrado.');
        }
        const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);
        const nuevoUsuario = await User.create({
            id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            name: data.nombre,
            email: data.email,
            password_hash: hashedPassword,
            phone: data.telefono || '',
            address: data.direccion || null,
            terms_accepted: data.aceptoTerminos,
            is_active: true,
            registered_at: new Date()
        });
        // Devolver objeto sin hash
        const { password_hash, ...usuarioSinHash } = nuevoUsuario.toJSON();
        return usuarioSinHash;
    }

    /**
     * Autentica un usuario.
     * @param {string} email
     * @param {string} password
     * @returns {Promise<Object>} { id, nombre, email, rol }
     */
    static async login(email, password) {
        const usuario = await User.findOne({ where: { email } });
        if (!usuario) {
            throw createError(401, 'Email o contraseña incorrectos.');
        }
        if (!usuario.is_active) {
            throw createError(401, 'Tu cuenta está desactivada. Contacta al administrador.');
        }
        const passwordValida = await bcrypt.compare(password, usuario.password_hash);
        if (!passwordValida) {
            throw createError(401, 'Email o contraseña incorrectos.');
        }
        const rol = usuario.email === 'admin@ee.com' ? 'admin' : 'user';
        return {
            id: usuario.id,
            nombre: usuario.name,
            email: usuario.email,
            rol,
        };
    }

    /**
     * Cambia la contraseña de un usuario.
     * @param {string} usuarioId
     * @param {string} passwordActual
     * @param {string} passwordNuevo
     * @returns {Promise<boolean>}
     */
    static async cambiarPassword(usuarioId, passwordActual, passwordNuevo) {
        const usuario = await User.findByPk(usuarioId);
        if (!usuario) {
            throw createError(404, 'Usuario no encontrado.');
        }
        const valida = await bcrypt.compare(passwordActual, usuario.password_hash);
        if (!valida) {
            throw createError(401, 'La contraseña actual es incorrecta.');
        }
        const hashedNew = await bcrypt.hash(passwordNuevo, SALT_ROUNDS);
        await usuario.update({ password_hash: hashedNew });
        return true;
    }

    /**
     * Fusiona la reserva de invitado con la del usuario después del login.
     * @param {string} guestId - cookie guestId
     * @param {string} usuarioId
     * @returns {Promise<void>}
     */
    static async fusionarReservaGuest(guestId, usuarioId) {
        if (!guestId) return;

        const reservaGuest = await Booking.findOne({ where: { session_id: guestId } });
        const reservaUser = await Booking.findOne({ where: { user_id: usuarioId } });

        if (reservaGuest && reservaUser) {
            // Mover todos los items de la reserva invitado a la del usuario
            await BookingItem.update(
                { booking_id: reservaUser.id },
                { where: { booking_id: reservaGuest.id } }
            );
            // Eliminar la reserva invitado
            await reservaGuest.destroy();
        } else if (reservaGuest && !reservaUser) {
            // Asignar la reserva invitado al usuario
            await reservaGuest.update({ user_id: usuarioId, session_id: null });
        }
    }
}

module.exports = AuthService;