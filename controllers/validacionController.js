'use strict';

const profesionalModel = require('../models/profesionalesModel');
const solicitudModel = require('../models/solicitudServicioModel');
const servicioModel = require('../models/servicioModel');

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

/**
 * POST /admin/validaciones/:id/aprobar - Aprobar profesional
 */
async function aprobarProfesional(req, res, next) {
    console.log('✅ POST /admin/validaciones/:id/aprobar - ID:', req.params.id);

    try {
        const { observacion } = req.body;
        const adminId = req.session?.usuarioEmail || 'admin@ee.com';

        // ✅ OBTENER EL PROFESIONAL ANTES DE APROBAR PARA VERIFICAR SI TIENE SERVICIO PERSONALIZADO
        const profesional = profesionalModel.getById(req.params.id);

        // ✅ SI EL PROFESIONAL TIENE UN SERVICIO PERSONALIZADO (NUEVO), CREARLO EN SERVICIOS.JSON
        if (profesional && profesional.servicioPersonalizado && !profesional.servicioId) {
            console.log('📝 Creando nuevo servicio personalizado:', profesional.servicioPersonalizado);

            // ✅ Crear el servicio en servicios.json
            const nuevoServicio = servicioModel.create({
                nombre: profesional.servicioPersonalizado,
                descripcion: profesional.descripcionServicio || `Servicio solicitado por ${profesional.nombre}`,
                certificacionRequerida: true,  // Por defecto, asumimos que requiere certificación
                destacado: false,
                activo: true
            });

            console.log('✅ Servicio creado:', nuevoServicio.id);

            // ✅ ACTUALIZAR EL PROFESIONAL CON EL ID DEL NUEVO SERVICIO
            profesionalModel.update(req.params.id, {
                servicioId: nuevoServicio.id,
                servicioPersonalizado: null  // Limpiar el campo personalizado
            });
        }

        const profesionalActualizado = profesionalModel.aprobarServicio(req.params.id, {
            validadoPor: adminId,
            observacion: observacion || null
        });

        // Actualizar solicitud si existe
        const solicitudes = solicitudModel.getByProfesionalId(req.params.id);
        const solicitudPendiente = solicitudes.find(s => s.estado === 'pendiente');
        if (solicitudPendiente) {
            await solicitudModel.actualizarEstado(
                solicitudPendiente.id,
                'aprobado',
                adminId
            );
        }

        console.log('✅ Profesional aprobado:', profesionalActualizado.id);
        res.redirect('/admin/validaciones?mensaje=Profesional aprobado correctamente.');
    } catch (err) {
        console.error('❌ Error:', err.message);
        res.redirect(`/admin/validaciones?error=${encodeURIComponent(err.message)}`);
    }
}

/**
 * POST /admin/validaciones/:id/rechazar - Rechazar profesional
 */
async function rechazarProfesional(req, res, next) {
    console.log('❌ POST /admin/validaciones/:id/rechazar - ID:', req.params.id);

    try {
        const { observacion } = req.body;
        const adminId = req.session?.usuarioEmail || 'admin@ee.com';

        if (!observacion) {
            const profesional = profesionalModel.getById(req.params.id);
            const servicios = servicioModel.getAll({ soloActivos: true });
            const servicio = profesional.servicioId
                ? servicios.find(s => s.id === profesional.servicioId)
                : null;
            const solicitudes = solicitudModel.getByProfesionalId(profesional.id);
            const solicitudPendiente = solicitudes.find(s => s.estado === 'pendiente');

            return res.render('layout', {
                title: `Validar: ${profesional.nombre} — E-E Admin`,
                pageCss: 'admin_forms',
                currentPage: 'admin',
                body: 'pages/admin/validations/detail',
                profesional: profesional,
                servicio: servicio,
                solicitud: solicitudPendiente,
                error: 'Debe proporcionar una observación para rechazar al profesional.'
            });
        }

        const profesionalActualizado = profesionalModel.rechazarServicio(req.params.id, {
            validadoPor: adminId,
            observacion: observacion
        });

        // Actualizar solicitud si existe
        const solicitudes = solicitudModel.getByProfesionalId(req.params.id);
        const solicitudPendiente = solicitudes.find(s => s.estado === 'pendiente');
        if (solicitudPendiente) {
            await solicitudModel.actualizarEstado(
                solicitudPendiente.id,
                'rechazado',
                adminId
            );
        }

        console.log('❌ Profesional rechazado:', profesionalActualizado.id);
        res.redirect('/admin/validaciones?mensaje=Profesional rechazado correctamente.');
    } catch (err) {
        console.error('❌ Error:', err.message);
        res.redirect(`/admin/validaciones?error=${encodeURIComponent(err.message)}`);
    }
}

module.exports = {
    mostrarPanelValidacion,
    mostrarDetalleValidacion,
    aprobarProfesional,
    rechazarProfesional
};