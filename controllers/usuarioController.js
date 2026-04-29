'use strict';

const UsuarioModel = require('../models/usuarioModel');
const bcrypt = require('bcrypt');
const ReservaModel = require('../models/reservaModel');
//const bcrypt = require('bcryptjs'); 

const usuarioModel = UsuarioModel;
const reservaModel = ReservaModel;

const { validationResult } = require('express-validator');
const AuthService = require('../services/authService');

const SALT_ROUNDS = 10;

// Las funciones auxiliares como _normalizarDireccion también deben estar definidas
function _normalizarDireccion(body) {
    const direccion = {};
    if (body.direccion_calle) direccion.calle = body.direccion_calle.trim();
    if (body.direccion_numero) direccion.numero = body.direccion_numero.trim();
    if (body.direccion_piso) direccion.piso = body.direccion_piso.trim();
    if (body.direccion_depto) direccion.depto = body.direccion_depto.trim();
    if (body.direccion_ciudad) direccion.ciudad = body.direccion_ciudad.trim();
    if (body.direccion_provincia) direccion.provincia = body.direccion_provincia.trim();
    if (body.direccion_codigoPostal) direccion.codigoPostal = body.direccion_codigoPostal.trim();
    return Object.keys(direccion).length > 0 ? direccion : null;
}

// ============================================================
// CONTROLADORES PÚBLICOS (formularios de registro)
// ============================================================
/**
 * GET /register - Mostrar formulario de registro
 */
function mostrarFormRegistro(req, res) {
    console.log('📝 GET /register - Mostrando formulario de registro');

    // Si el usuario ya está logueado, redirigir al perfil
    if (req.session?.usuarioId) {
        return res.redirect('/profile');
    }

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

/**
 * GET /login - Mostrar formulario de login
 */
function mostrarFormLogin(req, res) {
    console.log('📝 GET /login - Mostrando formulario de login');

    // Si el usuario ya está logueado, redirigir al perfil
    if (req.session?.usuarioId) {
        return res.redirect('/perfil');
    }

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

async function login(req, res) {
    console.log('🔵 POST /login - Body:', req.body);

    const errores = validationResult(req);

    if (!errores.isEmpty()) {
        return res.render('layout-auth', {
            title: 'Iniciar Sesión - E-E',
            body: 'pages/users/login-content',
            authScript: 'login',
            currentPage: 'login',
            pageCss: 'login_register',
            errores: errores.array().map(e => e.msg),
            formData: req.body,
            mensaje: null
        });
    }

    try {
        const { email, password, recordarme } = req.body;
        const usuario = await AuthService.login(email, password);

        req.session.usuarioId = usuario.id;
        req.session.usuarioEmail = usuario.email;
        req.session.usuarioNombre = usuario.nombre;
        req.session.rol = usuario.rol;

        if (recordarme) {
            res.cookie('userEmail', usuario.email, { maxAge: 1000 * 60 * 60 * 24 * 30 }); // 30 días
        }

        // Fusionar reserva guest
        await AuthService.fusionarReservaGuest(req.cookies?.guestId, usuario.id);

        console.log('✅ Login exitoso:', usuario.email);

        return res.redirect('/usuarios/perfil');

    } catch (error) {
        console.error('❌ Error login:', error.message);

        return res.render('layout-auth', {
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

// ============================================================
// CONTROLADORES PÚBLICOS (perfil del usuario logueado)
// ============================================================

/**
 * GET /usuarios/perfil - Ver mi perfil
 * Requiere: usuario autenticado (sesión)
 */
function verMiPerfil(req, res, next) {
    try {
        // Obtener usuario de la sesión (asumiendo que tienes sesión configurada)
        const usuarioId = req.session?.usuarioId;

        if (!usuarioId) {
            return res.redirect('/login?error=Debes iniciar sesión para ver tu perfil.');
        }

        const usuario = usuarioModel.getById(usuarioId);

        if (!usuario) {
            return res.redirect('/login?error=Usuario no encontrado.');
        }

        res.render('layout', {
            title: 'Mi Perfil - E-E',
            body: 'pages/users/profile',
            currentPage: 'profile',
            pageCss: ['admin_form', 'admin_list', 'user_profile'],
            usuario: usuario,
            mensaje: req.query.mensaje || null,
            error: req.query.error || null
        });
    } catch (err) {
        next(err);
    }
}

/**
 * GET /usuarios/perfil/editar - Formulario para editar mi perfil
 */
function editarMiPerfil(req, res, next) {
    try {
        const usuarioId = req.session?.usuarioId;

        if (!usuarioId) {
            return res.redirect('/login?error=Debes iniciar sesión.');
        }

        const usuario = usuarioModel.getById(usuarioId);

        if (!usuario) {
            return res.redirect('/login?error=Usuario no encontrado.');
        }

        res.render('layout', {
            title: 'Editar Perfil - E-E',
            body: 'pages/users/profile-edit',
            currentPage: 'profile-edit',
            pageCss: ['user_profile', 'admin_form', 'admin_list'],
            usuario: usuario,
            errores: [],
            formData: null
        });
    } catch (err) {
        next(err);
    }
}

/**
 * PUT /usuarios/perfil - Actualizar mi perfil
 */
function actualizarMiPerfil(req, res, next) {
    console.log('🟡 PUT /usuarios/perfil - Body:', req.body);

    const usuarioId = req.session?.usuarioId;

    if (!usuarioId) {
        return res.redirect('/login?error=Debes iniciar sesión.');
    }

    const usuarioExistente = usuarioModel.getById(usuarioId);

    if (!usuarioExistente) {
        return res.redirect('/login?error=Usuario no encontrado.');
    }

    // Validar solo los campos editables por el usuario
    const errores = validationResult(req);

    if (!errores.isEmpty()) {
        return res.render('layout', {
            title: 'Editar Perfil - E-E',
            body: 'pages/users/profile-edit',
            currentPage: 'profile',
            pageCss: ['admin_form', 'admin_list', 'user_profile'],
            usuario: usuarioExistente,
            errores: errores.array().map(e => e.msg),
            formData: req.body
        });
    }

    try {
        // Normalizar dirección
        const direccion = _normalizarDireccion(req.body);

        const usuarioActualizado = usuarioModel.update(usuarioId, {
            nombre: req.body.nombre,
            telefono: req.body.telefono || '',
            direccion: direccion
            // No permitir cambiar email ni activo desde aquí
        });

        console.log('✅ Perfil actualizado:', usuarioActualizado.id);
        res.redirect('/usuarios/perfil?mensaje=Perfil actualizado correctamente.');
    } catch (err) {
        console.error('❌ Error:', err.message);
        res.render('layout', {
            title: 'Editar Perfil - E-E',
            body: 'pages/users/profile-edit',
            currentPage: 'profile',
            pageCss: ['admin_form', 'admin_list', 'user_profile'],
            usuario: usuarioExistente,
            errores: errores.array().map(e => e.msg).concat(['Ocurrió un error al actualizar el perfil.']),
            formData: req.body
        });
    }
}

/**
 * GET /usuarios/cambiar-password - Formulario para cambiar contraseña
 */
function formCambiarPassword(req, res, next) {
    try {
        const usuarioId = req.session?.usuarioId;

        if (!usuarioId) {
            return res.redirect('/login?error=Debes iniciar sesión.');
        }

        res.render('layout', {
            title: 'Cambiar Contraseña - E-E',
            pageCss: ['user_profile', 'admin_form'],
            currentPage: 'cambiar-password',
            body: 'pages/users/change-password',
            errores: [],
            mensaje: null
        });
    } catch (err) {
        next(err);
    }
}

/**
 * GET /usuarios/pedidos - Historial de pedidos del usuario
 */
function misPedidos(req, res, next) {
    try {
        const usuarioId = req.session?.usuarioId;

        if (!usuarioId) {
            return res.redirect('/login?error=Debes iniciar sesión.');
        }

        // Aquí llamarías a pedidoModel.getByUsuarioId(usuarioId)
        // Por ahora, array vacío como placeholder
        const pedidos = [];

        res.render('my-orders', {
            title: 'Mis Pedidos - E-E',
            pedidos: pedidos,
            mensaje: req.query.mensaje || null
        });
    } catch (err) {
        next(err);
    }
}

/**
 * GET /usuarios/pedidos/:id - Ver detalle de un pedido
 */
function detallePedido(req, res, next) {
    try {
        const usuarioId = req.session?.usuarioId;
        const pedidoId = req.params.id;

        if (!usuarioId) {
            return res.redirect('/login?error=Debes iniciar sesión.');
        }

        // Aquí llamarías a pedidoModel.getById(pedidoId)
        // Verificar que el pedido pertenezca al usuario
        const pedido = null; // Placeholder

        if (!pedido) {
            return res.redirect('/usuarios/pedidos?error=Pedido no encontrado.');
        }

        res.render('order-detail', {
            title: `Pedido #${pedidoId} - E-E`,
            pedido: pedido
        });
    } catch (err) {
        next(err);
    }
}

/**
 * GET /logout - Cerrar sesión
 */
function logout(req, res) {
    console.log('🔴 GET /logout - Cerrando sesión:', req.session?.usuarioEmail);

    req.session.destroy((err) => {
        if (err) {
            console.error('Error al cerrar sesión:', err);
            return res.redirect('/perfil?error=Ocurrió un error al cerrar sesión. Intenta nuevamente.');
        }

        // Limpiar la cookie de sesión
        res.clearCookie('connect.sid');

        console.log('✅ Sesión cerrada correctamente');
        res.redirect('/login?mensaje=Sesión cerrada correctamente.');
    });
}

// ============================================================
// FUNCIONES ADMIN 
// ============================================================

/**
 * GET /admin/usuarios - Listar todos los usuarios
 */
function listar(req, res, next) {
    try {
        const { soloActivos } = req.query;
        let usuarios = usuarioModel.getAll();

        if (soloActivos === 'true') {
            usuarios = usuarios.filter(u => u.activo === true);
        }

        res.render('layout', {
            title: 'Usuarios — E-E Admin',
            pageCss: 'admin_list',
            currentPage: 'admin',
            body: 'pages/admin/users/list',
            usuarios,
            filtros: { soloActivos: soloActivos || '' },
            mensaje: req.query.mensaje || null,
            error: req.query.error || null,
        });
    } catch (err) {
        next(err);
    }
}

/**
 * GET /admin/usuarios/nuevo - Mostrar formulario nuevo usuario
 */
function mostrarFormNuevo(req, res, next) {
    try {
        res.render('layout', {
            title: 'Nuevo Usuario — E-E Admin',
            pageCss: 'admin_form',
            currentPage: 'admin',
            body: 'pages/admin/users/form',
            usuario: null,
            errores: [],
            formData: null
        });
    } catch (err) {
        next(err);
    }
}

/**
 * POST /admin/usuarios - Crear usuario desde admin
 */
async function crear(req, res, next) {
    console.log('🔵 POST /admin/usuarios - Body:', req.body);

    const errores = validationResult(req);


    if (!errores.isEmpty()) {
        return res.render('layout', {
            title: 'Nuevo Usuario — E-E Admin',
            pageCss: 'admin_form',
            currentPage: 'admin',
            body: 'pages/admin/users/form',
            usuario: null,
            errores: errores.array().map(e => e.msg),
            formData: req.body
        });
    }

    try {
        const hashedPassword = await bcrypt.hash(req.body.password, SALT_ROUNDS);
        const direccion = _normalizarDireccion(req.body);

        const nuevoUsuario = usuarioModel.create({
            nombre: req.body.nombre.trim(),
            email: req.body.email.trim().toLowerCase(),
            passwordHash: hashedPassword,
            telefono: req.body.telefono || '',
            direccion: direccion,
            aceptoTerminos: true,
            activo: req.body.activo === 'true' || req.body.activo === true
        });

        res.redirect('/admin/usuarios?mensaje=Usuario creado correctamente.');
    } catch (err) {
        res.render('layout', {
            title: 'Nuevo Usuario — E-E Admin',
            pageCss: 'admin_forms_list',
            currentPage: 'admin',
            body: 'pages/admin/users/form',
            usuario: null,
            errores: [err.message],
            formData: req.body
        });
    }
}

/**
 * GET /admin/usuarios/:id/editar - Editar usuario
 */
function mostrarFormEditar(req, res, next) {
    try {
        const usuario = usuarioModel.getById(req.params.id);
        if (!usuario) {
            return res.redirect('/admin/usuarios?error=Usuario no encontrado.');
        }
        res.render('layout', {
            title: `Editar ${usuario.nombre} — E-E Admin`,
            pageCss: 'admin_form',
            currentPage: 'admin',
            body: 'pages/admin/users/form',
            usuario: usuario,
            errores: [],
            formData: null
        });
    } catch (err) {
        next(err);
    }
}

/**
 * POST /admin/usuarios/:id - Actualizar usuario
 */
async function actualizar(req, res, next) {
    console.log('🟡 POST /admin/usuarios/:id - ID:', req.params.id);

    const usuarioExistente = usuarioModel.getById(req.params.id);
    if (!usuarioExistente) {
        return res.redirect('/admin/usuarios?error=Usuario no encontrado.');
    }

    const errores = validationResult(req);


    if (!errores.isEmpty()) {
        return res.render('layout', {
            title: 'Editar Usuario — E-E Admin',
            pageCss: 'admin_form',
            currentPage: 'admin',
            body: 'pages/admin/users/form',
            usuario: usuarioExistente,
            errores: errores,
            formData: req.body
        });
    }

    try {
        const datosActualizar = {
            nombre: req.body.nombre,
            telefono: req.body.telefono || '',
            direccion: _normalizarDireccion(req.body),
            activo: req.body.activo === 'true' || req.body.activo === true
        };

        if (req.body.password?.trim()) {
            datosActualizar.passwordHash = await bcrypt.hash(req.body.password, SALT_ROUNDS);
        }

        usuarioModel.update(req.params.id, datosActualizar);
        res.redirect('/admin/usuarios?mensaje=Usuario actualizado correctamente.');
    } catch (err) {
        res.render('layout', {
            title: 'Editar Usuario — E-E Admin',
            pageCss: 'admin_form',
            currentPage: 'admin',
            body: 'pages/admin/users/form',
            usuario: usuarioExistente,
            errores: [err.message],
            formData: req.body
        });
    }
}

/**
 * POST /admin/usuarios/:id/baja - Toggle activo/inactivo
 */
function toggleBaja(req, res, next) {
    try {
        const usuario = usuarioModel.toggleActivo(req.params.id);
        const estado = usuario.activo ? 'activado' : 'desactivado';
        res.redirect(`/admin/usuarios?mensaje=Usuario ${estado} correctamente.`);
    } catch (err) {
        res.redirect(`/admin/usuarios?error=${encodeURIComponent(err.message)}`);
    }
}

// ============================================================
// EXPORTS - AGREGAR AL FINAL DEL ARCHIVO
// ============================================================

module.exports = {
    // Registro público
    mostrarFormRegistro,
    mostrarFormLogin,
    logout,

    // Perfil usuario
    login,
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