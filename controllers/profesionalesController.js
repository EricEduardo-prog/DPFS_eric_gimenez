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

function _normalizarDisponibilidad(body) {
    console.log('🔧 Normalizando disponibilidad');

    const disponibilidad = {
        lunes: { manana: false, tarde: false },
        martes: { manana: false, tarde: false },
        miercoles: { manana: false, tarde: false },
        jueves: { manana: false, tarde: false },
        viernes: { manana: false, tarde: false }
    };

    Object.keys(body).forEach(key => {
        //  Ignorar campos ocultos (terminan en _hidden)
        if (key.startsWith('disponibilidad_') && !key.endsWith('_hidden')) {
            const parts = key.split('_');
            if (parts.length === 3) {
                const dia = parts[1];
                const turno = parts[2];
                // Solo el checkbox se envía si está marcado
                const valor = body[key] === 'true';

                if (disponibilidad[dia] && disponibilidad[dia][turno] !== undefined) {
                    disponibilidad[dia][turno] = valor;
                }
            }
        }
    });

    console.log('📋 Disponibilidad final:', JSON.stringify(disponibilidad, null, 2));
    return disponibilidad;
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

/** POST /admin/profesionales */
async function crear(req, res, next) {
    console.log('🔵 POST /admin/profesionales - Body:', req.body);

    const serviciosActivos = _getServiciosActivos();

    const errores = validationResult(req);

    if (!errores.isEmpty()) {
        return res.render('layout', {
            title: 'Nuevo Profesional — E-E Admin',
            pageCss: 'admin_form',
            currentPage: 'admin',
            body: 'pages/admin/professionals/form',
            profesional: null,
            servicios: serviciosActivos,
            errores: errores.array().map(e => e.msg),
            formData: req.body
        });
    }

    try {
        let servicioId = null;
        let estadoServicio = 'pendiente';
        let servicioPersonalizado = null;

        // Procesar selección de servicio
        if (req.body.tipoServicio === 'existente') {
            servicioId = req.body.servicioId;
            const servicio = servicioModel.getById(servicioId);
            if (servicio && servicio.certificacionRequerida) {
                estadoServicio = 'pendiente';
            } else {
                estadoServicio = 'aprobado';
            }
        } else if (req.body.tipoServicio === 'otro') {
            servicioPersonalizado = req.body.nuevoServicio.trim();
            estadoServicio = 'pendiente';

            await solicitudModel.create({
                profesionalId: null,
                servicioSolicitado: servicioPersonalizado,
                descripcion: req.body.descripcionServicio || '',
                estado: 'pendiente'
            });
        }

        const disponibilidad = _normalizarDisponibilidad(req.body);

        const nuevoProfesional = profesionalesModel.create({
            nombre: req.body.nombre.trim(),
            matricula: req.body.matricula.trim().toUpperCase(),
            servicioId: servicioId,
            servicioPersonalizado: servicioPersonalizado,
            estadoServicio: estadoServicio,
            experienciaAnios: req.body.experienciaAnios ? Number(req.body.experienciaAnios) : 0,
            email: req.body.email.trim().toLowerCase(),
            telefono: req.body.telefono || '',
            disponibilidad: disponibilidad,
            activo: req.body.activo === 'true' || req.body.activo === true
        });

        console.log('✅ Profesional creado:', nuevoProfesional.id);

        if (req.body.tipoServicio === 'otro' && servicioPersonalizado) {
            await solicitudModel.actualizarProfesionalId(nuevoProfesional.id, servicioPersonalizado);
        }

        res.redirect('/admin/profesionales?mensaje=Profesional registrado correctamente.');
    } catch (err) {
        console.error('❌ Error:', err.message);
        res.render('layout', {
            title: 'Nuevo Profesional — E-E Admin',
            pageCss: 'admin_form',
            currentPage: 'admin',
            body: 'pages/admin/professionals/form',
            profesional: null,
            servicios: _getServiciosActivos(),
            errores: errores.array().map(e => e.msg).concat([err.message]),
            formData: req.body
        });
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

/** POST /admin/profesionales/:id */
function actualizar(req, res, next) {
    console.log('🟡 POST /admin/profesionales/:id - ID:', req.params.id);

    // Obtener servicios activos para validar IDs
    const serviciosActivos = _getServiciosActivos();

    // Validar datos (esEdicion = true)
    const errores = validationResult(req);

    if (!errores.isEmpty()) {
        const profesional = profesionalesModel.getById(req.params.id);
        return res.render('layout', {
            title: 'Editar Profesional — E-E Admin',
            pageCss: 'admin_form',
            currentPage: 'admin',
            body: 'pages/admin/professionals/form',
            profesional: profesional,
            servicios: serviciosActivos,
            errores: errores.array().map(e => e.msg),
            formData: req.body
        });
    }

    try {
        const disponibilidad = _normalizarDisponibilidad(req.body);

        let servicioId = null;
        let estadoServicio = null;
        let servicioPersonalizado = null;

        if (req.body.tipoServicio === 'existente') {
            servicioId = req.body.servicioId;
            const servicio = servicioModel.getById(servicioId);
            estadoServicio = (servicio && servicio.certificacionRequerida) ? 'pendiente' : 'aprobado';
        } else if (req.body.tipoServicio === 'otro') {
            servicioPersonalizado = req.body.nuevoServicio?.trim() || null;
            estadoServicio = 'pendiente';
        }

        const datosActualizar = {
            nombre: req.body.nombre,
            matricula: req.body.matricula,
            servicioId: servicioId,
            servicioPersonalizado: servicioPersonalizado,
            estadoServicio: estadoServicio,
            experienciaAnios: req.body.experienciaAnios ? Number(req.body.experienciaAnios) : 0,
            email: req.body.email,
            telefono: req.body.telefono || '',
            disponibilidad: disponibilidad,
            activo: req.body.activo === 'true' || req.body.activo === true
        };

        profesionalesModel.update(req.params.id, datosActualizar);
        res.redirect('/admin/profesionales?mensaje=Profesional actualizado correctamente.');
    } catch (err) {
        console.error('❌ Error:', err.message);
        const profesional = profesionalesModel.getById(req.params.id);
        res.render('layout', {
            title: 'Editar Profesional — E-E Admin',
            pageCss: 'admin_form',
            currentPage: 'admin',
            body: 'pages/admin/professionals/form',
            profesional: profesional,
            servicios: _getServiciosActivos(),
            errores: errores.array().map(e => e.msg).concat([err.message]),
            formData: req.body
        });
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

module.exports = { listar, mostrarFormNuevo, crear, mostrarFormEditar, actualizar, toggleBaja };