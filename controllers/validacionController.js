'use strict';

const ProfesionalModel = require('../models/profesionalesModel');
const SolicitudModel = require('../models/solicitudServicioModel');
const ServicioModel = require('../models/servicioModel');

const profesionalModel = ProfesionalModel;
const solicitudModel = SolicitudModel;
const servicioModel = ServicioModel;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers internos
// ─────────────────────────────────────────────────────────────────────────────

function _getServicioNombre(profesional, servicios) {
    if (profesional.servicioId) {
        const servicio = servicios.find(s => s.id === profesional.servicioId);
        return servicio ? servicio.nombre : 'Servicio no encontrado';
    } else if (profesional.servicioPersonalizado) {
        return `${profesional.servicioPersonalizado} (nuevo)`;
    }
    return profesional.profesion || 'No especificado';
}

// ─────────────────────────────────────────────────────────────────────────────
// Controladores
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /admin/validaciones - Mostrar panel de validaciones
 */
function mostrarPanelValidacion(req, res, next) {
    try {
        const pendientes = profesionalModel.getPendientes();
        const servicios = servicioModel.getAll({ soloActivos: true });
        const rechazados = profesionalModel.getByEstadoServicio('rechazado');

        const pendientesConServicio = pendientes.map(prof => ({
            ...prof,
            servicioNombre: _getServicioNombre(prof, servicios)
        }));

        const rechazadosConServicio = rechazados.map(prof => ({
            ...prof,
            servicioNombre: _getServicioNombre(prof, servicios)
        }));

        res.render('layout', {
            title: 'Validación de Profesionales — E-E Admin',
            pageCss: 'admin_list',
            currentPage: 'admin',
            body: 'pages/admin/validations/list',
            profesionales: pendientesConServicio,
            rechazados: rechazadosConServicio,
            servicios: servicios,
            mensaje: req.query.mensaje || null,
            error: req.query.error || null
        });
    } catch (err) {
        next(err);
    }
}

/**
 * GET /admin/validaciones/:id - Mostrar detalle de validación
 */
function mostrarDetalleValidacion(req, res, next) {
    try {
        const profesional = profesionalModel.getById(req.params.id);
        if (!profesional) {
            return res.redirect('/admin/validaciones?error=Profesional no encontrado.');
        }

        const servicios = servicioModel.getAll({ soloActivos: true });
        const servicio = profesional.servicioId
            ? servicios.find(s => s.id === profesional.servicioId)
            : null;

        const solicitudes = solicitudModel.getByProfesionalId(profesional.id);
        const solicitudPendiente = solicitudes.find(s => s.estado === 'pendiente');

        res.render('layout', {
            title: `Validar: ${profesional.nombre} — E-E Admin`,
            pageCss: 'admin_form',
            currentPage: 'admin',
            body: 'pages/admin/validations/detail',
            profesional: profesional,
            servicio: servicio,
            solicitud: solicitudPendiente,
            error: null
        });
    } catch (err) {
        next(err);
    }
}


module.exports = {
    mostrarPanelValidacion,
    mostrarDetalleValidacion
};