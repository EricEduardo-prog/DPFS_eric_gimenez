// validations/usuarioValidation.js
'use strict';

const { body } = require('express-validator');

// Validación para registro público
const validarRegistro = [
    body('nombre')
        .trim()
        .notEmpty().withMessage('El nombre es obligatorio.')
        .isLength({ max: 100 }).withMessage('El nombre no puede superar los 100 caracteres.'),

    body('email')
        .trim()
        .notEmpty().withMessage('El email es obligatorio.')
        .isEmail().withMessage('El email no tiene un formato válido.')
        .normalizeEmail(),

    body('password')
        .trim()
        .notEmpty().withMessage('La contraseña es obligatoria.')
        .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres.'),

    body('confirmPassword')
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('Las contraseñas no coinciden.');
            }
            return true;
        }),

    body('aceptoTerminos')
        .custom(value => {
            if (value !== 'true' && value !== true) {
                throw new Error('Debes aceptar los términos y condiciones.');
            }
            return true;
        }),

    body('telefono')
        .optional()
        .trim()
        .matches(/^[\+\d\s\-\(\)]{8,20}$/).withMessage('El teléfono no tiene un formato válido.'),
];

// Validación para login
const validarLogin = [
    body('email')
        .trim()
        .notEmpty().withMessage('El email es obligatorio.')
        .isEmail().withMessage('Email inválido.')
        .normalizeEmail(),

    body('password')
        .trim()
        .notEmpty().withMessage('La contraseña es obligatoria.'),
];

// Validación para perfil (edición)
const validarPerfil = [
    body('nombre')
        .trim()
        .notEmpty().withMessage('El nombre es obligatorio.')
        .isLength({ max: 100 }).withMessage('El nombre no puede superar los 100 caracteres.'),

    body('telefono')
        .optional()
        .trim()
        .matches(/^[\+\d\s\-\(\)]{8,20}$/).withMessage('El teléfono no tiene un formato válido.'),

    body('direccion_calle').optional().trim(),
    body('direccion_numero').optional().trim(),
    body('direccion_piso').optional().trim(),
    body('direccion_depto').optional().trim(),
    body('direccion_ciudad').optional().trim(),
    body('direccion_provincia').optional().trim(),
    body('direccion_codigoPostal').optional().trim(),
];

// Validación para cambio de contraseña
const validarCambioPassword = [
    body('passwordActual')
        .trim()
        .notEmpty().withMessage('La contraseña actual es obligatoria.'),

    body('passwordNuevo')
        .trim()
        .notEmpty().withMessage('La nueva contraseña es obligatoria.')
        .isLength({ min: 6 }).withMessage('La nueva contraseña debe tener al menos 6 caracteres.'),

    body('passwordConfirmar')
        .custom((value, { req }) => {
            if (value !== req.body.passwordNuevo) {
                throw new Error('Las contraseñas no coinciden.');
            }
            return true;
        }),
];

// Validación para admin crear/editar usuario
const validarUsuarioAdmin = [
    body('nombre')
        .trim()
        .notEmpty().withMessage('El nombre es obligatorio.')
        .isLength({ max: 100 }),

    body('email')
        .trim()
        .notEmpty().withMessage('El email es obligatorio.')
        .isEmail().withMessage('Email inválido.')
        .normalizeEmail(),

    body('password')
        .optional()
        .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres.'),

    body('telefono')
        .optional()
        .trim()
        .matches(/^[\+\d\s\-\(\)]{8,20}$/).withMessage('Teléfono inválido.'),

    body('activo')
        .optional()
        .isBoolean().toBoolean(),
];

module.exports = {
    validarRegistro,
    validarLogin,
    validarPerfil,
    validarCambioPassword,
    validarUsuarioAdmin,
};