// validations/handleValidationErrors.js
'use strict';

const { validationResult } = require('express-validator');

/**
 * Middleware unificado para manejar errores de validación.
 * - Para peticiones HTML: renderiza el formulario correspondiente con errores.
 * - Para peticiones JSON: responde con status 400 y el listado de errores.
 * 
 * @param {string} viewPath - Ruta de la vista a renderizar (ej. 'pages/admin/category/form')
 * @param {Object} extraData - Datos adicionales para pasar a la vista (título, currentPage, etc.)
 * @returns {Function} Middleware de Express
 */
function handleValidationErrors(viewPath, extraData = {}) {
    return (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const errorMessages = errors.array().map(err => err.msg);

            // Si la petición espera JSON (API)
            if (req.xhr || req.headers.accept?.includes('application/json')) {
                return res.status(400).json({ ok: false, errors: errorMessages });
            }

            // Para peticiones HTML: renderizar la vista con errores y datos previos
            const renderData = {
                errores: errorMessages,
                formData: req.body,
                ...extraData,
            };
            return res.render(viewPath, renderData);
        }
        next();
    };
}

module.exports = handleValidationErrors;