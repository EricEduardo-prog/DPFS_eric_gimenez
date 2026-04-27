// validations/productoValidation.js
'use strict';

const { body } = require('express-validator');

const validarProducto = [
    body('nombre')
        .trim()
        .notEmpty().withMessage('El nombre es obligatorio.')
        .isLength({ max: 120 }).withMessage('El nombre no puede superar los 120 caracteres.'),

    body('sku')
        .trim()
        .notEmpty().withMessage('El SKU es obligatorio.')
        .toUpperCase(),

    body('categoriaId')
        .notEmpty().withMessage('La categoría es obligatoria.'),

    body('descripcion')
        .trim()
        .notEmpty().withMessage('La descripción es obligatoria.')
        .isLength({ max: 600 }).withMessage('La descripción no puede superar los 600 caracteres.'),

    body('imagen')
        .trim()
        .notEmpty().withMessage('La URL de imagen es obligatoria.')
        .isURL().withMessage('La imagen debe ser una URL válida.'),

    body('precio')
        .notEmpty().withMessage('El precio es obligatorio.')
        .isFloat({ min: 0.01 }).withMessage('El precio debe ser un número mayor a 0.')
        .toFloat(),

    body('precioOriginal')
        .optional()
        .isFloat({ min: 0 }).withMessage('El precio original debe ser un número válido.')
        .toFloat()
        .custom((value, { req }) => {
            if (value && value <= req.body.precio) {
                throw new Error('El precio original debe ser mayor al precio de venta.');
            }
            return true;
        }),

    body('instalacion.disponible')
        .optional()
        .isBoolean().toBoolean(),

    body('instalacion.servicioId')
        .optional()
        .custom((value, { req }) => {
            const disponible = req.body.instalacion?.disponible === true || req.body.instalacionDisponible === 'true';
            if (disponible && !value) {
                throw new Error('Si la instalación está disponible, debés seleccionar un servicio de instalación.');
            }
            if (!disponible && value) {
                throw new Error('No podés seleccionar un servicio de instalación si la instalación no está disponible.');
            }
            return true;
        }),

    body('caracteristicas')
        .optional()
        .customSanitizer(value => {
            if (!value) return [];
            return Array.isArray(value) ? value : [value];
        }),

    body('colores')
        .optional()
        .customSanitizer(value => {
            if (!value) return [];
            return Array.isArray(value) ? value : [value];
        }),

    body('talles')
        .optional()
        .customSanitizer(value => {
            if (!value) return [];
            return Array.isArray(value) ? value : [value];
        }),

    body('activo')
        .optional()
        .isBoolean().toBoolean(),
];

module.exports = { validarProducto };