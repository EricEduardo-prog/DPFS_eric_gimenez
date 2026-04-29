// services/authService.js
//
'use strict';

const UsuarioModel = require('../models/usuarioModel');
const bcrypt = require('bcrypt');
const ReservaModel = require('../models/reservaModel');
const createError = require('http-errors');

const SALT_ROUNDS = 10;

class AuthService {
    /**
     * Registra un nuevo usuario.
     * @param {Object} data - { nombre, email, password, telefono, direccion, aceptoTerminos }
     * @returns {Object} usuario creado (sin passwordHash)
     */
    static async registrar(data) {
        // Verificar email único
        const existente = UsuarioModel.getByEmail(data.email);
        if (existente) {
            throw createError(400, 'El email ya está registrado.');
        }
        // Hashear password
        const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);
        // Crear usuario
        const nuevoUsuario = UsuarioModel.create({
            nombre: data.nombre,
            email: data.email,
            passwordHash: hashedPassword,
            telefono: data.telefono || '',
            direccion: data.direccion || null,
            aceptoTerminos: data.aceptoTerminos,
            activo: true,
        });
        return nuevoUsuario;
    }

    /**
     * Autentica un usuario y devuelve sus datos para la sesión.
     * @param {string} email
     * @param {string} password
     * @returns {Object} { id, nombre, email, rol }
     */
    static async login(email, password) {
        const usuario = UsuarioModel.getByEmailConHash(email);
        if (!usuario) {
            throw createError(401, 'Email o contraseña incorrectos.');
        }
        if (!usuario.activo) {
            throw createError(401, 'Tu cuenta está desactivada. Contacta al administrador.');
        }
        const passwordValida = await bcrypt.compare(password, usuario.passwordHash);
        if (!passwordValida) {
            throw createError(401, 'Email o contraseña incorrectos.');
        }
        const rol = usuario.email === 'admin@ee.com' ? 'admin' : 'user';
        return {
            id: usuario.id,
            nombre: usuario.nombre,
            email: usuario.email,
            rol,
        };
    }

    /**
     * Cambia la contraseña de un usuario.
     * @param {string} usuarioId
     * @param {string} passwordActual
     * @param {string} passwordNuevo
     * @returns {boolean}
     */
    static async cambiarPassword(usuarioId, passwordActual, passwordNuevo) {
        const usuario = UsuarioModel.getByIdWithHash(usuarioId);
        if (!usuario) {
            throw createError(404, 'Usuario no encontrado.');
        }
        const valida = await bcrypt.compare(passwordActual, usuario.passwordHash);
        if (!valida) {
            throw createError(401, 'La contraseña actual es incorrecta.');
        }
        const hashedNew = await bcrypt.hash(passwordNuevo, SALT_ROUNDS);
        UsuarioModel.update(usuarioId, { passwordHash: hashedNew });
        return true;
    }

    /**
     * Fusiona la reserva de invitado con la del usuario después del login.
     * @param {string} guestId - cookie guestId
     * @param {string} usuarioId
     */
    static async fusionarReservaGuest(guestId, usuarioId) {
        if (!guestId) return;
        const reservaGuest = ReservaModel.getBySessionId(guestId);
        const reservaUser = ReservaModel.getByUsuarioId(usuarioId);
        if (reservaGuest && reservaUser) {
            ReservaModel.mergeReservas(reservaGuest.id, reservaUser.id);
        } else if (reservaGuest && !reservaUser) {
            ReservaModel.actualizarUsuarioId(reservaGuest.id, usuarioId);
        }
    }
}

module.exports = AuthService;