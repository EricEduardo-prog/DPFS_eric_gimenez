// validations/servicioValidation.js
'use strict';

const { body } = require('express-validator');

const validarServicio = [
    body('name')
        .trim()
        .notEmpty().withMessage('El nombre es obligatorio.')
        .isLength({ max: 80 }).withMessage('El nombre no puede superar los 80 caracteres.'),

    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage('La descripción no puede superar los 500 caracteres.'),

    body('base_price')
        .notEmpty().withMessage('El precio base es obligatorio.')
        .isFloat({ min: 0.01 }).withMessage('El precio base debe ser un número mayor a 0.')
        .toFloat(),

    body('hourly_price')
        .optional()
        .isFloat({ min: 0 }).withMessage('El precio por hora debe ser un número no negativo.')
        .toFloat(),

    body('certification_required')
        .optional()
        .isBoolean().toBoolean(),

    body('is_featured')
        .optional()
        .isBoolean().toBoolean(),

    body('is_active')
        .optional()
        .isBoolean().toBoolean(),
];

module.exports = { validarServicio };