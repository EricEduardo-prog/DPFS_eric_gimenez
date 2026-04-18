'use strict';

/**
 * authMiddleware.js
 * Middlewares para control de acceso según rol de usuario
 * Roles: guest (no logueado), user (logueado normal), admin
 */

/**
 * Verifica que el usuario NO esté logueado (solo huéspedes)
 * Redirige a / si ya está logueado
 */
function isGuest(req, res, next) {
    if (req.session?.usuarioId) {
        return res.redirect('/');
    }
    next();
}

/**
 * Verifica que el usuario esté logueado (user o admin)
 * Redirige a /login si no está logueado
 */
function isUser(req, res, next) {
    if (!req.session?.usuarioId) {
        return res.redirect('/login');
    }
    next();
}

/**
 * Verifica que el usuario sea administrador
 * Redirige a /login si no está logueado o no es admin
 */
function isAdmin(req, res, next) {
    if (!req.session?.usuarioId) {
        return res.redirect('/login');
    }
    if (req.session?.rol !== 'admin') {
        return res.status(403).send('Acceso denegado. No tienes permisos de administrador.');
    }
    next();
}

/**
 * Redirige a / si el usuario ya está logueado (para login/register)
 */
function redirectIfAuthenticated(req, res, next) {
    if (req.session?.usuarioId) {
        return res.redirect('/');
    }
    next();
}

module.exports = {
    isGuest,
    isUser,
    isAdmin,
    redirectIfAuthenticated
};