'use strict';


const ProfesionalesModel = require('../models/profesionalesModel');
const ServicioModel = require('../models/servicioModel');
const SolicitudModel = require('../models/solicitudServicioModel');

const profesionalesModel = ProfesionalesModel;
const servicioModel = ServicioModel;
const solicitudModel = SolicitudModel;

const { validationResult } = require('express-validator');

// ─────────────────────────────────────────────────────────────────────────────
// Helpers internos
// ─────────────────────────────────────────────────────────────────────────────

// Obtener servicios activos para el select
function _getServiciosActivos() {
    try {
        return servicioModel.getAll({ soloActivos: true });
    } catch (err) {
        console.error('Error cargando servicios:', err.message);
        return [];
    }
}


/**
 * Obtiene el nombre del servicio para un profesional
 */
function _getServicioNombre(profesional, servicios) {
    if (profesional.servicioId) {
        const servicio = servicios.find(s => s.id === profesional.servicioId);
        return servicio ? servicio.nombre : 'Servicio no encontrado';
    } else if (profesional.servicioPersonalizado) {
        return `${profesional.servicioPersonalizado} (pendiente)`;
    }
    return 'No especificado';
}


function _optsForm(titulo, profesional, errores, formData = null) {
    return {
        title: `${titulo} — E-E Admin`,
        pageCss: 'admin_form',
        currentPage: 'admin',
        body: 'pages/admin/professionals/form',
        profesional: profesional ?? null,
        servicios: _getServiciosActivos(),
        errores: errores ?? [],
        formData,
    };
}


// ─────────────────────────────────────────────────────────────────────────────
// Controladores
// ─────────────────────────────────────────────────────────────────────────────

/** GET /admin/profesionales */
function listar(req, res, next) {
    try {
        const { servicioId, soloActivos } = req.query;
        const profesionales = profesionalesModel.getAll({
            soloActivos: soloActivos === 'true',
            servicioId: servicioId || null,
        });

        const servicios = _getServiciosActivos();

        // Enriquecer profesionales con nombre del servicio
        const profesionalesConServicio = profesionales.map(prof => ({
            ...prof,
            servicioNombre: _getServicioNombre(prof, servicios)
        }));

        res.render('layout', {
            title: 'Profesionales — E-E Admin',
            pageCss: 'admin_list',
            currentPage: 'admin',
            body: 'pages/admin/professionals/list',
            profesionales: profesionalesConServicio,
            servicios: servicios,  // ← Para el filtro
            filtros: { servicioId: servicioId || '', soloActivos: soloActivos || '' },
            mensaje: req.query.mensaje || null,
            error: req.query.error || null,
        });
    } catch (err) {
        next(err);
    }
}

/** GET /admin/profesionales/nuevo */
function mostrarFormNuevo(req, res, next) {
    try {
        res.render('layout', {
            title: 'Nuevo Profesional — E-E Admin',
            pageCss: 'admin_form',
            currentPage: 'admin',
            body: 'pages/admin/professionals/form',
            profesional: null,
            servicios: _getServiciosActivos(),
            errores: [],
            formData: null
        });
    } catch (err) {
        next(err);
    }
}



/** GET /admin/profesionales/:id/editar */

function mostrarFormEditar(req, res, next) {
    try {
        const profesional = profesionalesModel.getById(req.params.id);
        if (!profesional) {
            return res.redirect('/admin/profesionales?error=Profesional no encontrado.');
        }

        // Obtener servicios activos para validar IDs
        const serviciosActivos = _getServiciosActivos();

        res.render('layout', {
            title: `Editar ${profesional.nombre} — E-E Admin`,
            pageCss: 'admin_form',
            currentPage: 'admin',
            body: 'pages/admin/professionals/form',
            profesional: profesional,
            servicios: serviciosActivos,
            errores: [],
            formData: null
        });
    } catch (err) {
        next(err);
    }
}


/** POST /admin/profesionales/:id/baja */
function toggleBaja(req, res) {
    console.log('🟡 ${req.method} /admin/profesionales/:id/baja - ID:', req.params.id);
    try {
        const profesional = profesionalesModel.toggleActivo(req.params.id);
        const estado = profesional.activo ? 'dado de alta' : 'dado de baja';
        res.redirect(`/admin/profesionales?mensaje=Profesional ${estado} correctamente.`);
    } catch (err) {
        res.redirect(`/admin/profesionales?error=${encodeURIComponent(err.message)}`);
    }
}

module.exports = { listar, mostrarFormNuevo, mostrarFormEditar, toggleBaja };