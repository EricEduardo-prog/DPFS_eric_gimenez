// validations/productoValidation.js
'use strict';

const { body } = require('express-validator');

const validarProducto = [
    body('name')
        .trim()
        .notEmpty().withMessage('El nombre es obligatorio.')
        .isLength({ max: 120 }).withMessage('El nombre no puede superar los 120 caracteres.'),

    body('sku')
        .trim()
        .notEmpty().withMessage('El SKU es obligatorio.')
        .toUpperCase(),

    body('category_id')
        .notEmpty().withMessage('La categoría es obligatoria.'),

    body('description')
        .trim()
        .notEmpty().withMessage('La descripción es obligatoria.')
        .isLength({ max: 600 }).withMessage('La descripción no puede superar los 600 caracteres.'),

    body('image')
        .trim()
        .notEmpty().withMessage('La URL de imagen es obligatoria.')
        .isURL().withMessage('La imagen debe ser una URL válida.'),

    body('price')
        .notEmpty().withMessage('El precio es obligatorio.')
        .isFloat({ min: 0.01 }).withMessage('El precio debe ser un número mayor a 0.')
        .toFloat(),

    body('original_price')
        .optional()
        .isFloat({ min: 0 }).withMessage('El precio original debe ser un número válido.')
        .toFloat()
        .custom((value, { req }) => {
            if (value && value <= req.body.price) {
                throw new Error('El precio original debe ser mayor al precio de venta.');
            }
            return true;
        }),

    body('installation_available')
        .optional()
        .isBoolean().toBoolean(),

    body('installation_service_id')
        .optional()
        .custom((value, { req }) => {
            const disponible = req.body.installation_available === true || req.body.installation_available === 'true';
            if (disponible && !value) {
                throw new Error('Si la instalación está disponible, debés seleccionar un servicio de instalación.');
            }
            if (!disponible && value) {
                throw new Error('No podés seleccionar un servicio de instalación si la instalación no está disponible.');
            }
            return true;
        }),

    body('characteristics')
        .optional()
        .customSanitizer(value => {
            if (!value) return [];
            return Array.isArray(value) ? value : [value];
        }),

    body('colors')
        .optional()
        .customSanitizer(value => {
            if (!value) return [];
            return Array.isArray(value) ? value : [value];
        }),

    body('sizes')
        .optional()
        .customSanitizer(value => {
            if (!value) return [];
            return Array.isArray(value) ? value : [value];
        }),

    body('is_active')
        .optional()
        .isBoolean().toBoolean(),
];

module.exports = { validarProducto };