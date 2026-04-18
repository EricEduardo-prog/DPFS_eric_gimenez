'use strict';

/**
 * usuarioRoutes.js
 * Define los endpoints HTTP del módulo Usuarios
 * y los conecta con sus controladores.
 *
 * Se monta en app.js como:
 *   app.use('/admin/usuarios', usuarioRouter.adminRouter);  // Rutas admin
 *   app.use('/usuarios', usuarioRouter.publicRouter);       // Rutas públicas
 *
 * Rutas resultantes:
 *
 * ADMIN (requieren autenticación de admin):
 *   GET    /admin/usuarios              → listar
 *   GET    /admin/usuarios/nuevo        → mostrarFormNuevo
 *   POST   /admin/usuarios              → crear
 *   GET    /admin/usuarios/:id/editar   → mostrarFormEditar
 *   POST   /admin/usuarios/:id          → actualizar
 *   POST   /admin/usuarios/:id/baja     → toggleBaja
 *
 * PÚBLICAS (requieren autenticación de usuario):
 *   GET    /usuarios/perfil             → verMiPerfil
 *   GET    /usuarios/perfil/editar      → editarMiPerfil
 *   PUT    /usuarios/perfil             → actualizarMiPerfil (vía _method)
 *   GET    /usuarios/cambiar-password   → formCambiarPassword
 *   PUT    /usuarios/cambiar-password   → actualizarPassword
 *   GET    /usuarios/pedidos            → misPedidos (si aplica)
 *
 * PÚBLICAS SIN AUTENTICACIÓN:
 *   POST   /register                    → registrar (crear cuenta nueva)
 */

const express = require('express');
const usuarioController = require('../controllers/usuarioController');

// Router para rutas de administración
const adminRouter = express.Router();

// Router para rutas públicas
const publicRouter = express.Router();

// ============================================================
// RUTAS PÚBLICAS SIN AUTENTICACIÓN (registro)
// ============================================================


// GET /register - Mostrar formulario de registro
publicRouter.get('/register', usuarioController.mostrarFormRegistro);

// POST /register - Registro de nuevos usuarios
publicRouter.post('/register', usuarioController.registrar);

publicRouter.get('/login', usuarioController.mostrarFormLogin);

// ============================================================
// RUTAS PÚBLICAS CON AUTENTICACIÓN (perfil del usuario logueado)
// ============================================================

publicRouter.post('/login', usuarioController.login);

publicRouter.get('/logout', usuarioController.logout);
publicRouter.post('/logout', usuarioController.logout);

// GET /usuarios/perfil - Ver mi perfil
publicRouter.get('/perfil', usuarioController.verMiPerfil);

// GET /usuarios/perfil/editar - Formulario para editar mi perfil
publicRouter.get('/perfil/editar', usuarioController.editarMiPerfil);

// PUT /usuarios/perfil - Actualizar mi perfil (vía _method=PUT)
publicRouter.put('/perfil', usuarioController.actualizarMiPerfil);

// GET /usuarios/cambiar-password - Formulario para cambiar contraseña
publicRouter.get('/cambiar-password', usuarioController.formCambiarPassword);

// PUT /usuarios/cambiar-password - Actualizar contraseña
publicRouter.put('/cambiar-password', usuarioController.actualizarPassword);

// GET /usuarios/pedidos - Historial de pedidos del usuario
publicRouter.get('/pedidos', usuarioController.misPedidos);

// GET /usuarios/pedidos/:id - Ver detalle de un pedido específico
publicRouter.get('/pedidos/:id', usuarioController.detallePedido);

// ============================================================
// RUTAS DE ADMINISTRACIÓN
// ============================================================

// ── Rutas estáticas primero (antes de /:id para evitar conflictos)

// GET  /admin/usuarios
adminRouter.get('/', usuarioController.listar);

// GET  /admin/usuarios/nuevo
adminRouter.get('/nuevo', usuarioController.mostrarFormNuevo);

// POST /admin/usuarios
adminRouter.post('/', usuarioController.crear);

// ── Rutas dinámicas con :id

// GET  /admin/usuarios/:id/editar
adminRouter.get('/:id/editar', usuarioController.mostrarFormEditar);

// POST /admin/usuarios/:id (actualizar, simula PUT)
adminRouter.post('/:id', usuarioController.actualizar);

adminRouter.put('/:id', usuarioController.actualizar);

// POST /admin/usuarios/:id/baja (toggle activo, simula DELETE)
adminRouter.post('/:id/baja', usuarioController.toggleBaja);

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
    adminRouter,
    publicRouter
};