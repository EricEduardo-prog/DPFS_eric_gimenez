'use strict';

const usuarioModel = require('../models/usuarioModel');
const bcrypt = require('bcrypt');
const reservaModel = require('../models/reservaModel');
//const bcrypt = require('bcryptjs'); 

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
 * POST /register - Registrar nuevo usuario
 */
async function registrar(req, res) {
    console.log('🔵 POST /register - Body:', {
        nombre: req.body.nombre,
        email: req.body.email,
        telefono: req.body.telefono
    });

    // Validar datos
    const errores = [];

    // Nombre
    if (!req.body.nombre?.trim()) {
        errores.push('El nombre es obligatorio.');
    } else if (req.body.nombre.trim().length > 100) {
        errores.push('El nombre no puede superar los 100 caracteres.');
    }

    // Email
    if (!req.body.email?.trim()) {
        errores.push('El email es obligatorio.');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(req.body.email.trim())) {
        errores.push('El email no tiene un formato válido.');
    }

    // Contraseña
    if (!req.body.password?.trim()) {
        errores.push('La contraseña es obligatoria.');
    } else if (req.body.password.trim().length < 6) {
        errores.push('La contraseña debe tener al menos 6 caracteres.');
    }

    // Confirmar contraseña
    if (req.body.password !== req.body.confirmPassword) {
        errores.push('Las contraseñas no coinciden.');
    }

    // Términos
    if (req.body.aceptoTerminos !== 'true' && req.body.aceptoTerminos !== true) {
        errores.push('Debes aceptar los términos y condiciones.');
    }

    if (errores.length > 0) {
        console.log('⚠️ Errores de validación:', errores);
        return res.render('layout-auth', {
            title: 'Registro - E-E',
            body: 'pages/users/register-content',
            authScript: 'register',
            currentPage: 'register',
            pageCss: [],
            errores: errores,
            formData: req.body
        });
    }

    try {
        // Verificar si el email ya existe
        const usuarioExistente = usuarioModel.getByEmail(req.body.email);

        if (usuarioExistente) {
            return res.render('layout-auth', {
                title: 'Registro - E-E',
                body: 'pages/users/register-content',
                authScript: 'register',
                currentPage: 'register',
                pageCss: [],
                errores: ['El email ya está registrado. Por favor, inicia sesión.'],
                formData: req.body
            });
        }

        // ✅ Verificar que la contraseña existe antes de hashear
        const password = req.body.password?.trim();
        if (!password) {
            throw new Error('La contraseña no puede estar vacía');
        }

        // Hash de la contraseña
        const hashedPassword = await bcrypt.hash(req.body.password, SALT_ROUNDS);

        // Normalizar dirección
        const direccion = _normalizarDireccion(req.body);

        // Crear usuario
        const nuevoUsuario = usuarioModel.create({
            nombre: req.body.nombre.trim(),
            email: req.body.email.trim().toLowerCase(),
            passwordHash: hashedPassword,
            telefono: req.body.telefono?.trim() || '',
            direccion: direccion,
            aceptoTerminos: true,
            activo: true
        });

        console.log('✅ Usuario registrado:', nuevoUsuario.id);
        res.redirect('/login?mensaje=Registro exitoso. Ahora puedes iniciar sesión.');

    } catch (err) {
        console.error('❌ Error en registro:', err.message);
        res.render('layout-auth', {
            title: 'Registro - E-E',
            body: 'pages/users/register-content',
            authScript: 'register',
            currentPage: 'register',
            pageCss: [],
            errores: ['Ocurrió un error al procesar el registro. Por favor, intentá nuevamente.'],
            formData: req.body
        });
    }
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

/**
 * POST /login - Autenticar usuario
 */

async function login(req, res) {
    console.log('🔵 POST /login - Body:', req.body);

    const { email, password, recordarme } = req.body;
    const errores = [];

    // Validaciones
    if (!email?.trim()) {
        errores.push('El email es obligatorio.');
    }

    if (!password?.trim()) {
        errores.push('La contraseña es obligatoria.');
    }

    if (errores.length > 0) {
        return res.render('layout-auth', {
            title: 'Iniciar Sesión - E-E',
            body: 'pages/users/login-content',
            authScript: 'login',
            currentPage: 'login',
            pageCss: [],
            errores: errores,
            formData: { email },
            mensaje: null
        });
    }

    try {
        // CORREGIDO: Usar getByEmailConHash para obtener el passwordHash
        const usuario = usuarioModel.getByEmailConHash(email.trim().toLowerCase());

        if (!usuario) {
            console.log('⚠️ Usuario no encontrado:', email);
            return res.render('layout-auth', {
                title: 'Iniciar Sesión - E-E',
                body: 'pages/users/login-content',
                authScript: 'login',
                currentPage: 'login',
                pageCss: [],
                errores: ['Email o contraseña incorrectos.'],
                formData: { email },
                mensaje: null
            });
        }

        console.log('✅ Usuario encontrado:', usuario.email);
        console.log('✅ PasswordHash existe:', !!usuario.passwordHash);

        // Verificar si el usuario está activo
        if (!usuario.activo) {
            console.log('⚠️ Usuario inactivo:', usuario.email);
            return res.render('layout-auth', {
                title: 'Iniciar Sesión - E-E',
                body: 'pages/users/login-content',
                authScript: 'login',
                pageCss: [],
                errores: ['Tu cuenta está desactivada. Contacta al administrador.'],
                formData: { email },
                mensaje: null
            });
        }

        // Verificar contraseña
        const passwordValida = await bcrypt.compare(password, usuario.passwordHash);

        if (!passwordValida) {
            console.log('⚠️ Contraseña incorrecta para:', usuario.email);
            return res.render('layout-auth', {
                title: 'Iniciar Sesión - E-E',
                body: 'pages/users/login-content',
                authScript: 'login',
                currentPage: 'login',
                pageCss: [],
                errores: ['Email o contraseña incorrectos.'],
                formData: { email },
                mensaje: null
            });
        }

        // Guardar usuario en sesión
        req.session.usuarioId = usuario.id;
        req.session.usuarioEmail = usuario.email;
        req.session.usuarioNombre = usuario.nombre;



        console.log('✅ Sesión guardada:', req.session.usuarioId);
        // Determinar rol (admin o user)
        let rol = 'user';
        if (usuario.email === 'admin@ee.com') {
            rol = 'admin';
        }
        req.session.rol = rol;

        console.log('✅ Login exitoso:', usuario.email);

        // Redirigir según opción "recordarme"
        if (recordarme === 'true') {
            req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 días
        }

        // Fusionar reserva de guests con la del usuario logueado
        const guestId = req.cookies?.guestId;

        if (guestId) {
            const reservaGuest = reservaModel.getBySessionId(guestId);
            const reservaUser = reservaModel.getByUsuarioId(usuario.id);

            if (reservaGuest && reservaUser) {
                reservaModel.mergeReservas(reservaGuest.id, reservaUser.id);
            } else if (reservaGuest && !reservaUser) {
                reservaModel.actualizarUsuarioId(reservaGuest.id, usuario.id);
            }

            // Limpiar cookie guestId
            res.clearCookie('guestId');
        }

        return res.redirect('/perfil?mensaje=Bienvenido de nuevo, ' + usuario.nombre + '!');

    } catch (err) {
        console.error('❌ Error en login:', err.message);
        console.error('❌ Stack:', err.stack);
        res.render('layout-auth', {
            title: 'Iniciar Sesión - E-E',
            body: 'pages/users/login-content',
            authScript: 'login',
            currentPage: 'login',
            pageCss: [],
            errores: ['Ocurrió un error al procesar el login.'],
            formData: { email },
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
    const errores = [];

    if (!req.body.nombre?.trim()) {
        errores.push('El nombre es obligatorio.');
    } else if (req.body.nombre.trim().length > 100) {
        errores.push('El nombre no puede superar los 100 caracteres.');
    }

    if (req.body.telefono?.trim() && !/^[\+\d\s\-\(\)]{8,20}$/.test(req.body.telefono.trim())) {
        errores.push('El teléfono no tiene un formato válido.');
    }

    if (errores.length > 0) {
        return res.render('layout', {
            title: 'Editar Perfil - E-E',
            body: 'pages/users/profile-edit',
            currentPage: 'profile',
            pageCss: ['admin_form', 'admin_list', 'user_profile'],
            usuario: usuarioExistente,
            errores: errores,
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
            errores: [err.message],
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
 * PUT /usuarios/cambiar-password - Actualizar contraseña
 */
async function actualizarPassword(req, res, next) {
    console.log('🔐 PUT /usuarios/cambiar-password');

    const usuarioId = req.session?.usuarioId;

    if (!usuarioId) {
        return res.redirect('/login?error=Debes iniciar sesión.');
    }

    // ✅ Usar getByIdWithHash para obtener el passwordHash actual
    const usuario = usuarioModel.getByIdWithHash(usuarioId);

    if (!usuario) {
        return res.redirect('/login?error=Usuario no encontrado.');
    }

    console.log('✅ Usuario encontrado:', usuario.email);
    console.log('✅ Tiene passwordHash:', !!usuario.passwordHash);

    const { passwordActual, passwordNuevo, passwordConfirmar } = req.body;
    const errores = [];

    // Validar campos
    if (!passwordActual?.trim()) {
        errores.push('La contraseña actual es obligatoria.');
    }

    if (!passwordNuevo?.trim()) {
        errores.push('La nueva contraseña es obligatoria.');
    } else if (passwordNuevo.trim().length < 6) {
        errores.push('La nueva contraseña debe tener al menos 6 caracteres.');
    }

    if (passwordNuevo !== passwordConfirmar) {
        errores.push('Las contraseñas no coinciden.');
    }

    if (errores.length > 0) {
        return res.render('layout', {
            title: 'Cambiar Contraseña - E-E',
            pageCss: ['user_profile', 'admin_form'],
            currentPage: 'cambiar-password',
            body: 'pages/users/change-password',
            errores: errores,
            mensaje: null
        });
    }

    try {
        // Validar contraseña actual
        const passwordValida = await bcrypt.compare(passwordActual, usuario.passwordHash);

        if (!passwordValida) {
            console.log('⚠️ Contraseña actual incorrecta');
            errores.push('La contraseña actual es incorrecta.');
            return res.render('layout', {
                title: 'Cambiar Contraseña - E-E',
                pageCss: ['user-profile', 'admin_form'],
                currentPage: 'cambiar-password',
                body: 'pages/users/change-password',
                errores: errores,
                mensaje: null
            });
        }

        // Hashear nueva contraseña
        const hashedPassword = await bcrypt.hash(passwordNuevo, SALT_ROUNDS);
        console.log('✅ Nueva contraseña hasheada');

        // ✅ Actualizar - ahora el modelo permitirá cambiar passwordHash
        usuarioModel.update(usuarioId, {
            passwordHash: hashedPassword
        });

        console.log('✅ Contraseña actualizada para:', usuario.email);

        // Opcional: Destruir sesión para requerir nuevo login
        req.session.destroy((err) => {
            if (err) console.error('Error al destruir sesión:', err);
            res.redirect('/login?mensaje=Contraseña actualizada correctamente. Por favor, inicia sesión con tu nueva contraseña.');
        });

    } catch (err) {
        console.error('❌ Error:', err.message);
        res.render('layout', {
            title: 'Cambiar Contraseña - E-E',
            pageCss: ['user-profile', 'admin_form'],
            currentPage: 'cambiar-password',
            body: 'pages/users/change-password',
            errores: ['Ocurrió un error al actualizar la contraseña.'],
            mensaje: null
        });
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

    const errores = [];

    if (!req.body.nombre?.trim()) errores.push('El nombre es obligatorio.');
    if (!req.body.email?.trim()) errores.push('El email es obligatorio.');
    if (!req.body.password?.trim()) errores.push('La contraseña es obligatoria.');
    else if (req.body.password.trim().length < 6) errores.push('La contraseña debe tener al menos 6 caracteres.');

    if (errores.length > 0) {
        return res.render('layout', {
            title: 'Nuevo Usuario — E-E Admin',
            pageCss: 'admin_form',
            currentPage: 'admin',
            body: 'pages/admin/users/form',
            usuario: null,
            errores: errores,
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

    const errores = [];

    if (!req.body.nombre?.trim()) errores.push('El nombre es obligatorio.');

    if (errores.length > 0) {
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
    registrar,
    mostrarFormLogin,
    login,
    logout,

    // Perfil usuario
    verMiPerfil,
    editarMiPerfil,
    actualizarMiPerfil,
    formCambiarPassword,
    actualizarPassword,
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