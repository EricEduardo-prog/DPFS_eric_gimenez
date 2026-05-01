'use strict';

const { User, Booking } = require('../database/models');
const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator');
const AuthService = require('../services/authService'); // Asumo que este servicio será refactorizado

const SALT_ROUNDS = 10;

function _normalizarDireccion(body) {
    const direccion = {};
    if (body.direccion_calle) direccion.calle = body.direccion_calle.trim();
    if (body.direccion_numero) direccion.numero = body.direccion_numero.trim();
    if (body.direccion_piso) direccion.piso = body.direccion_piso.trim();
    if (body.direccion_depto) direccion.depto = body.direccion_depto.trim();
    if (body.direccion_ciudad) direccion.ciudad = body.direccion_ciudad.trim();
    if (body.direccion_provincia) direccion.provincia = body.direccion_provincia.trim();
    if (body.direccion_codigoPostal) direccion.codigoPostal = body.direccion_codigoPostal.trim();
    return Object.keys(direccion).length ? direccion : null;
}

// ========== PÚBLICOS ==========
function mostrarFormRegistro(req, res) {
    if (req.session?.usuarioId) return res.redirect('/profile');
    res.render('layout-auth', {
        title: 'Registro - E-E',
        body: 'pages/users/register-content',
        authScript: 'register',
        currentPage: 'register',
        pageCss: [],
        errores: [],
        formData: {},
        mensaje: null
    });
}

function mostrarFormLogin(req, res) {
    if (req.session?.usuarioId) return res.redirect('/perfil');
    res.render('layout-auth', {
        title: 'Iniciar Sesión - E-E',
        body: 'pages/users/login-content',
        authScript: 'login',
        currentPage: 'login',
        pageCss: [],
        errores: [],
        formData: {},
        mensaje: req.query.mensaje || null
    });
}

async function login(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.render('layout-auth', {
            title: 'Iniciar Sesión - E-E',
            body: 'pages/users/login-content',
            authScript: 'login',
            currentPage: 'login',
            pageCss: 'login_register',
            errores: errors.array().map(e => e.msg),
            formData: req.body,
            mensaje: null
        });
    }
    try {
        const { email, password, recordarme } = req.body;
        const usuario = await AuthService.login(email, password); // Servicio deberá usar User.findOne

        req.session.usuarioId = usuario.id;
        req.session.usuarioEmail = usuario.email;
        req.session.usuarioNombre = usuario.name;
        req.session.rol = usuario.rol;

        if (recordarme) res.cookie('userEmail', usuario.email, { maxAge: 30 * 24 * 60 * 60 * 1000 });
        await AuthService.fusionarReservaGuest(req.cookies?.guestId, usuario.id);

        res.redirect('/usuarios/perfil');
    } catch (error) {
        res.render('layout-auth', {
            title: 'Iniciar Sesión - E-E',
            body: 'pages/users/login-content',
            authScript: 'login',
            currentPage: 'login',
            pageCss: 'login_register',
            errores: [error.message],
            formData: req.body,
            mensaje: null
        });
    }
}

function logout(req, res) {
    req.session.destroy(err => {
        if (err) console.error(err);
        res.clearCookie('connect.sid');
        res.redirect('/login?mensaje=Sesión cerrada correctamente.');
    });
}

// ========== PERFIL USUARIO ==========
async function verMiPerfil(req, res, next) {
    try {
        const usuarioId = req.session?.usuarioId;
        if (!usuarioId) return res.redirect('/login?error=Debes iniciar sesión.');
        const usuario = await User.findByPk(usuarioId);
        if (!usuario) return res.redirect('/login?error=Usuario no encontrado.');
        res.render('layout', {
            title: 'Mi Perfil - E-E',
            body: 'pages/users/profile',
            currentPage: 'profile',
            pageCss: ['admin_form', 'admin_list', 'user_profile'],
            usuario,
            mensaje: req.query.mensaje || null,
            error: req.query.error || null
        });
    } catch (err) { next(err); }
}

async function editarMiPerfil(req, res, next) {
    try {
        const usuarioId = req.session?.usuarioId;
        if (!usuarioId) return res.redirect('/login?error=Debes iniciar sesión.');
        const usuario = await User.findByPk(usuarioId);
        if (!usuario) return res.redirect('/login?error=Usuario no encontrado.');
        res.render('layout', {
            title: 'Editar Perfil - E-E',
            body: 'pages/users/profile-edit',
            currentPage: 'profile-edit',
            pageCss: ['user_profile', 'admin_form', 'admin_list'],
            usuario,
            errores: [],
            formData: null
        });
    } catch (err) { next(err); }
}

async function actualizarMiPerfil(req, res, next) {
    const usuarioId = req.session?.usuarioId;
    if (!usuarioId) return res.redirect('/login?error=Debes iniciar sesión.');
    const usuario = await User.findByPk(usuarioId);
    if (!usuario) return res.redirect('/login?error=Usuario no encontrado.');

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.render('layout', {
            title: 'Editar Perfil - E-E',
            body: 'pages/users/profile-edit',
            currentPage: 'profile',
            pageCss: ['admin_form', 'admin_list', 'user_profile'],
            usuario,
            errores: errors.array().map(e => e.msg),
            formData: req.body
        });
    }
    try {
        const direccion = _normalizarDireccion(req.body);
        await usuario.update({
            name: req.body.name,
            phone: req.body.phone || '',
            address: direccion
        });
        req.session.usuarioNombre = usuario.name;
        res.redirect('/usuarios/perfil?mensaje=Perfil actualizado correctamente.');
    } catch (err) {
        res.render('layout', {
            title: 'Editar Perfil - E-E',
            body: 'pages/users/profile-edit',
            currentPage: 'profile',
            pageCss: ['admin_form', 'admin_list', 'user_profile'],
            usuario,
            errores: [err.message],
            formData: req.body
        });
    }
}

function formCambiarPassword(req, res) {
    if (!req.session?.usuarioId) return res.redirect('/login?error=Debes iniciar sesión.');
    res.render('layout', {
        title: 'Cambiar Contraseña - E-E',
        pageCss: ['user_profile', 'admin_form'],
        currentPage: 'cambiar-password',
        body: 'pages/users/change-password',
        errores: [],
        mensaje: null
    });
}

async function misPedidos(req, res, next) {
    try {
        const usuarioId = req.session?.usuarioId;
        if (!usuarioId) return res.redirect('/login?error=Debes iniciar sesión.');
        const pedidos = await Booking.findAll({
            where: { user_id: usuarioId },
            include: [{ model: BookingItem, as: 'items' }],
            order: [['created_at', 'DESC']]
        });
        res.render('my-orders', {
            title: 'Mis Pedidos - E-E',
            pedidos,
            mensaje: req.query.mensaje || null
        });
    } catch (err) { next(err); }
}

async function detallePedido(req, res, next) {
    try {
        const usuarioId = req.session?.usuarioId;
        if (!usuarioId) return res.redirect('/login?error=Debes iniciar sesión.');
        const pedido = await Booking.findOne({
            where: { id: req.params.id, user_id: usuarioId },
            include: [{ model: BookingItem, as: 'items' }]
        });
        if (!pedido) return res.redirect('/usuarios/pedidos?error=Pedido no encontrado.');
        res.render('order-detail', { title: `Pedido #${req.params.id}`, pedido });
    } catch (err) { next(err); }
}

// ========== ADMIN ==========
async function listar(req, res, next) {
    try {
        const where = {};
        if (req.query.soloActivos === 'true') where.is_active = true;
        const usuarios = await User.findAll({ where, order: [['registered_at', 'DESC']] });
        res.render('layout', {
            title: 'Usuarios — E-E Admin',
            pageCss: 'admin_list',
            currentPage: 'admin',
            body: 'pages/admin/users/list',
            usuarios,
            filtros: { soloActivos: req.query.soloActivos || '' },
            mensaje: req.query.mensaje || null,
            error: req.query.error || null,
        });
    } catch (err) { next(err); }
}

function mostrarFormNuevo(req, res) {
    res.render('layout', {
        title: 'Nuevo Usuario — E-E Admin',
        pageCss: 'admin_form',
        currentPage: 'admin',
        body: 'pages/admin/users/form',
        usuario: null,
        errores: [],
        formData: null
    });
}

async function crear(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.render('layout', {
            title: 'Nuevo Usuario — E-E Admin',
            pageCss: 'admin_form',
            currentPage: 'admin',
            body: 'pages/admin/users/form',
            usuario: null,
            errores: errors.array().map(e => e.msg),
            formData: req.body
        });
    }
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, SALT_ROUNDS);
        const direccion = _normalizarDireccion(req.body);
        const newUser = await User.create({
            id: `usr_${Date.now()}`,
            name: req.body.name.trim(),
            email: req.body.email.trim().toLowerCase(),
            password_hash: hashedPassword,
            phone: req.body.phone || '',
            address: direccion,
            terms_accepted: true,
            is_active: req.body.is_active === 'true'
        });
        res.redirect('/admin/usuarios?mensaje=Usuario creado correctamente.');
    } catch (err) {
        res.render('layout', {
            title: 'Nuevo Usuario — E-E Admin',
            pageCss: 'admin_form',
            currentPage: 'admin',
            body: 'pages/admin/users/form',
            usuario: null,
            errores: [err.message],
            formData: req.body
        });
    }
}

async function mostrarFormEditar(req, res, next) {
    try {
        const usuario = await User.findByPk(req.params.id);
        if (!usuario) return res.redirect('/admin/usuarios?error=Usuario no encontrado.');
        res.render('layout', {
            title: `Editar ${usuario.name} — E-E Admin`,
            pageCss: 'admin_form',
            currentPage: 'admin',
            body: 'pages/admin/users/form',
            usuario,
            errores: [],
            formData: null
        });
    } catch (err) { next(err); }
}

async function actualizar(req, res, next) {
    const usuario = await User.findByPk(req.params.id);
    if (!usuario) return res.redirect('/admin/usuarios?error=Usuario no encontrado.');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.render('layout', {
            title: 'Editar Usuario — E-E Admin',
            pageCss: 'admin_form',
            currentPage: 'admin',
            body: 'pages/admin/users/form',
            usuario,
            errores: errors.array().map(e => e.msg),
            formData: req.body
        });
    }
    try {
        const updateData = {
            name: req.body.name,
            phone: req.body.phone || '',
            address: _normalizarDireccion(req.body),
            is_active: req.body.is_active === 'true'
        };
        if (req.body.password?.trim()) {
            updateData.password_hash = await bcrypt.hash(req.body.password, SALT_ROUNDS);
        }
        await usuario.update(updateData);
        res.redirect('/admin/usuarios?mensaje=Usuario actualizado correctamente.');
    } catch (err) {
        res.render('layout', {
            title: 'Editar Usuario — E-E Admin',
            pageCss: 'admin_form',
            currentPage: 'admin',
            body: 'pages/admin/users/form',
            usuario,
            errores: [err.message],
            formData: req.body
        });
    }
}

async function toggleBaja(req, res, next) {
    try {
        const usuario = await User.findByPk(req.params.id);
        if (!usuario) throw new Error('Usuario no encontrado');
        const newActive = !usuario.is_active;
        await usuario.update({ is_active: newActive });
        const estado = newActive ? 'activado' : 'desactivado';
        res.redirect(`/admin/usuarios?mensaje=Usuario ${estado} correctamente.`);
    } catch (err) {
        res.redirect(`/admin/usuarios?error=${encodeURIComponent(err.message)}`);
    }
}

module.exports = {
    // Públicos
    mostrarFormRegistro,
    mostrarFormLogin,
    login,
    logout,
    // Perfil
    verMiPerfil,
    editarMiPerfil,
    actualizarMiPerfil,
    formCambiarPassword,
    misPedidos,
    detallePedido,
    // Admin
    listar,
    mostrarFormNuevo,
    crear,
    mostrarFormEditar,
    actualizar,
    toggleBaja
};