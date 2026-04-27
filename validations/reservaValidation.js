// validations/reservaValidation.js
'use strict';

const { body, param } = require('express-validator');

const validarAgregarItem = [
    body('productoId')
        .optional()
        .isString(),

    body('servicioId')
        .optional()
        .isString(),

    body('tipo')
        .notEmpty().withMessage('El tipo (producto o servicio) es obligatorio.')
        .isIn(['producto', 'servicio']).withMessage('Tipo inválido.'),

    body('cantidad')
        .notEmpty().withMessage('La cantidad es obligatoria.')
        .isInt({ min: 1 }).withMessage('La cantidad debe ser mayor a 0.')
        .toInt(),

    body('profesionalId')
        .optional()
        .isString(),

    body('fechaInstalacion')
        .optional()
        .isISO8601().withMessage('Fecha inválida.'),

    body('horarioInstalacion')
        .optional()
        .isIn(['manana', 'tarde']).withMessage('Horario debe ser "manana" o "tarde".'),

    // Validación condicional: si tipo=producto debe tener productoId, si tipo=servicio debe tener servicioId
    body().custom((value, { req }) => {
        if (req.body.tipo === 'producto' && !req.body.productoId) {
            throw new Error('Debe especificar productoId para tipo producto.');
        }
        if (req.body.tipo === 'servicio' && !req.body.servicioId) {
            throw new Error('Debe especificar servicioId para tipo servicio.');
        }
        return true;
    }),
];

const validarActualizarItem = [
    param('itemId')
        .notEmpty().withMessage('ID de item es obligatorio.'),

    body('cantidad')
        .notEmpty().withMessage('La cantidad es obligatoria.')
        .isInt({ min: 0 }).withMessage('La cantidad debe ser un número mayor o igual a 0.')
        .toInt(),
];

const validarEliminarItem = [
    param('itemId')
        .notEmpty().withMessage('ID de item es obligatorio.'),
];

module.exports = {
    validarAgregarItem,
    validarActualizarItem,
    validarEliminarItem,
};