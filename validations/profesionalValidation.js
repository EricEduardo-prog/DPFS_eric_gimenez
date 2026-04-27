// validations/profesionalValidation.js
'use strict';

const { body } = require('express-validator');

const validarProfesional = [
    body('nombre')
        .trim()
        .notEmpty().withMessage('El nombre completo es obligatorio.')
        .isLength({ max: 100 }).withMessage('El nombre no puede superar los 100 caracteres.')
        .matches(/^[a-zA-ZáéíóúñÁÉÍÓÚÑ\s]+$/).withMessage('El nombre solo puede contener letras y espacios.'),

    body('matricula')
        .trim()
        .notEmpty().withMessage('La matrícula es obligatoria.')
        .toUpperCase()
        .matches(/^(MP|MN)-\d{4,6}$/).withMessage('La matrícula debe tener el formato MP-12345 o MN-12345 (4-6 dígitos).'),

    body('tipoServicio')
        .notEmpty().withMessage('Debe seleccionar un servicio o solicitar uno nuevo.')
        .isIn(['existente', 'otro']).withMessage('Tipo de servicio inválido.'),

    body('servicioId')
        .if(body('tipoServicio').equals('existente'))
        .notEmpty().withMessage('Debe seleccionar un servicio.')
        .isString(),

    body('nuevoServicio')
        .if(body('tipoServicio').equals('otro'))
        .trim()
        .notEmpty().withMessage('Debe especificar el nombre del nuevo servicio.')
        .isLength({ min: 3, max: 80 }).withMessage('El nombre del servicio debe tener entre 3 y 80 caracteres.'),

    body('experienciaAnios')
        .optional()
        .isInt({ min: 0, max: 50 }).withMessage('La experiencia debe ser un número entre 0 y 50 años.')
        .toInt(),

    body('email')
        .trim()
        .notEmpty().withMessage('El email es obligatorio.')
        .isEmail().withMessage('El email no tiene un formato válido.')
        .normalizeEmail()
        .isLength({ max: 100 }).withMessage('El email no puede superar los 100 caracteres.'),

    body('telefono')
        .optional()
        .trim()
        .matches(/^[\+\d\s\-\(\)]{8,20}$/).withMessage('El teléfono no tiene un formato válido. Ej: +54 9 223 456-7890'),

    body('activo')
        .optional()
        .isBoolean().toBoolean(),
];

module.exports = { validarProfesional };