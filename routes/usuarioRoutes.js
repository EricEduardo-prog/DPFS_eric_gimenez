'use strict';


const express = require('express');
const usuarioController = require('../controllers/usuarioController');

const { isGuest, isUser, isAdmin, redirectIfAuthenticated } = require('../middlewares/authMiddleware');
const { validarRegistro, validarLogin, validarPerfil, validarCambioPassword } = require('../validations/usuarioValidation');

// Router para rutas de administración
const adminRouter = express.Router();

// Router para rutas públicas
const publicRouter = express.Router();

const AuthService = require('../services/authService');

// ============================================================
// RUTAS PÚBLICAS SIN AUTENTICACIÓN (INVITADOS)
// ============================================================


// GET /register - Mostrar formulario de registro
publicRouter.get('/register', redirectIfAuthenticated, usuarioController.mostrarFormRegistro);

// POST /register - Registro de nuevos usuarios
publicRouter.post('/register', redirectIfAuthenticated, validarRegistro, AuthService.registrar);

publicRouter.get('/login', redirectIfAuthenticated, usuarioController.mostrarFormLogin);

publicRouter.post('/login', redirectIfAuthenticated, validarLogin, usuarioController.login, AuthService.login);

// ============================================================
// RUTAS PÚBLICAS CON AUTENTICACIÓN (perfil del usuario logueado)
// ============================================================

// GET /usuarios/perfil - Ver mi perfil
publicRouter.get('/perfil', isUser, usuarioController.verMiPerfil);

// GET /usuarios/perfil/editar - Formulario para editar mi perfil
publicRouter.get('/perfil/editar', isUser, usuarioController.editarMiPerfil);

// PUT /usuarios/perfil - Actualizar mi perfil (vía _method=PUT)
publicRouter.put('/perfil', isUser, validarPerfil, usuarioController.actualizarMiPerfil);

// GET /usuarios/cambiar-password - Formulario para cambiar contraseña
publicRouter.get('/cambiar-password', isUser, usuarioController.formCambiarPassword);

// PUT /usuarios/cambiar-password - Actualizar contraseña
publicRouter.put('/cambiar-password', isUser, validarCambioPassword, AuthService.cambiarPassword);

// GET /usuarios/pedidos - Historial de pedidos del usuario
publicRouter.get('/pedidos', isUser, usuarioController.misPedidos);

// GET /usuarios/pedidos/:id - Ver detalle de un pedido específico
publicRouter.get('/pedidos/:id', isUser, usuarioController.detallePedido);

publicRouter.get('/logout', isUser, usuarioController.logout);

publicRouter.post('/logout', isUser, usuarioController.logout);
// ============================================================
// RUTAS DE ADMINISTRACIÓN
// ============================================================
const { validarUsuarioAdmin } = require('../validations/usuarioValidation');

// ── Rutas estáticas primero (antes de /:id para evitar conflictos)

// GET  /admin/usuarios
adminRouter.get('/', isAdmin, usuarioController.listar);

// GET  /admin/usuarios/nuevo
adminRouter.get('/nuevo', isAdmin, usuarioController.mostrarFormNuevo);

// POST /admin/usuarios
adminRouter.post('/', isAdmin, validarUsuarioAdmin, usuarioController.crear);

// ── Rutas dinámicas con :id

// GET  /admin/usuarios/:id/editar
adminRouter.get('/:id/editar', isAdmin, usuarioController.mostrarFormEditar);

// POST /admin/usuarios/:id (actualizar, simula PUT)
adminRouter.post('/:id', isAdmin, validarUsuarioAdmin, usuarioController.actualizar);

adminRouter.put('/:id', isAdmin, validarUsuarioAdmin, usuarioController.actualizar);

// POST /admin/usuarios/:id/baja (toggle activo, simula DELETE)
adminRouter.post('/:id/baja', isAdmin, validarUsuarioAdmin, usuarioController.toggleBaja);

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
    adminRouter,
    publicRouter
};