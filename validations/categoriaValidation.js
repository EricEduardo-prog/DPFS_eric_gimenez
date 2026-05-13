// validations/categoriaValidation.js
'use strict';

const { body } = require('express-validator');

const validarCategoria = [
    body('name')
        .trim()
        .notEmpty().withMessage('El nombre es obligatorio.')
        .isLength({ max: 80 }).withMessage('El nombre no puede superar los 80 caracteres.'),

    body('description')
        .optional()
        .trim()
        .isLength({ max: 200 }).withMessage('La descripción no puede superar los 200 caracteres.'),

    body('icon')
        .optional()
        .trim(),

    body('order')
        .optional()
        .isInt({ min: 1 }).withMessage('El orden debe ser un número mayor a 0.')
        .toInt(),

    body('is_active')
        .optional()
        .isBoolean().withMessage('El campo activo debe ser verdadero o falso.')
        .toBoolean(),
];

module.exports = { validarCategoria };