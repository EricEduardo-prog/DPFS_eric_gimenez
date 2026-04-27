// validations/servicioValidation.js
'use strict';

const { body } = require('express-validator');

const validarServicio = [
    body('nombre')
        .trim()
        .notEmpty().withMessage('El nombre es obligatorio.')
        .isLength({ max: 80 }).withMessage('El nombre no puede superar los 80 caracteres.'),

    body('descripcion')
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage('La descripción no puede superar los 500 caracteres.'),

    body('precioBase')
        .notEmpty().withMessage('El precio base es obligatorio.')
        .isFloat({ min: 0.01 }).withMessage('El precio base debe ser un número mayor a 0.')
        .toFloat(),

    body('precioPorHora')
        .optional()
        .isFloat({ min: 0 }).withMessage('El precio por hora debe ser un número no negativo.')
        .toFloat(),

    body('certificacionRequerida')
        .optional()
        .isBoolean().toBoolean(),

    body('destacado')
        .optional()
        .isBoolean().toBoolean(),

    body('activo')
        .optional()
        .isBoolean().toBoolean(),
];

module.exports = { validarServicio };