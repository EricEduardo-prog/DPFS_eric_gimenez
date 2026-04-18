'use strict';

/**
 * profesionalesController.js
 * Lógica de negocio para el módulo de Profesionales.
 *
 * Rutas que maneja (registradas en profesionalesRoutes.js):
 *  GET    /admin/profesionales               → listar
 *  GET    /admin/profesionales/nuevo         → formulario alta
 *  POST   /admin/profesionales               → crear
 *  GET    /admin/profesionales/:id/editar    → formulario edición
 *  POST   /admin/profesionales/:id           → actualizar
 *  POST   /admin/profesionales/:id/baja      → toggle activo
 *
 * Nota sobre campos de solo lectura:
 *   valoracion y trabajosCompletados no se incluyen en ningún body
 *   que se pase a model.update(). El modelo los ignora por diseño,
 *   pero el controller tampoco los expone.
 */

const profesionalesModel = require('../models/profesionalesModel');
const servicioModel = require('../models/servicioModel');
const solicitudModel = require('../models/solicitudServicioModel');

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

function _validar(body) {
    const errores = [];

    if (!body.nombre?.trim())
        errores.push('El nombre es obligatorio.');

    if (!body.matricula?.trim())
        errores.push('La matrícula es obligatoria.');
    else if (!/^(MP|MN)-\d{4,6}$/i.test(body.matricula.trim()))
        errores.push('La matrícula debe tener el formato MP-NNNNN o MN-NNNNN.');

    // ✅ Validar servicio
    if (body.tipoServicio === 'existente') {
        if (!body.servicioId) {
            errores.push('Debe seleccionar un servicio.');
        }
    } else if (body.tipoServicio === 'otro') {
        if (!body.nuevoServicio?.trim()) {
            errores.push('Debe especificar el nombre del servicio.');
        } else if (body.nuevoServicio.trim().length > 80) {
            errores.push('El nombre del servicio no puede superar los 80 caracteres.');
        }
    } else {
        errores.push('Debe seleccionar un servicio o solicitar uno nuevo.');
    }

    // Validar experiencia
    if (body.experienciaAnios !== undefined && body.experienciaAnios !== '') {
        const exp = Number(body.experienciaAnios);
        if (isNaN(exp) || exp < 0 || exp > 50) {
            errores.push('La experiencia debe ser un número entre 0 y 50 años.');
        }
    }

    if (!body.email?.trim())
        errores.push('El email es obligatorio.');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim()))
        errores.push('El email no tiene un formato válido.');

    return errores;
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
        // ✅ Ignorar campos ocultos (terminan en _hidden)
        if (key.startsWith('disponibilidad_') && !key.endsWith('_hidden')) {
            const parts = key.split('_');
            if (parts.length === 3) {
                const dia = parts[1];
                const turno = parts[2];
                // Solo el checkbox se envía si está marcado
                const valor = body[key] === 'true';

                if (disponibilidad[dia] && disponibilidad[dia][turno] !== undefined) {
                    disponibilidad[dia][turno] = valor;
                    console.log(`✅ ${dia}.${turno} = ${valor}`);
                }
            }
        }
    });

    console.log('📋 Disponibilidad final:', JSON.stringify(disponibilidad, null, 2));
    return disponibilidad;
}

/**
 * Valida los datos de un profesional
 * @param {Object} body - req.body
 * @param {boolean} esEdicion - Indica si es una edición (true) o creación (false)
 * @param {Array} serviciosExistentes - Lista de servicios para validar IDs (opcional)
 * @returns {Array} Array de mensajes de error (vacío si todo es válido)
 */
function _validarProfesional(body, esEdicion = false, serviciosExistentes = []) {
    const errores = [];

    // ============================================================
    // 1. VALIDAR NOMBRE
    // ============================================================
    if (!body.nombre?.trim()) {
        errores.push('El nombre completo es obligatorio.');
    } else if (body.nombre.trim().length > 100) {
        errores.push('El nombre no puede superar los 100 caracteres.');
    } else if (!/^[a-zA-ZáéíóúñÁÉÍÓÚÑ\s]+$/.test(body.nombre.trim())) {
        errores.push('El nombre solo puede contener letras y espacios.');
    }

    // ============================================================
    // 2. VALIDAR MATRÍCULA
    // ============================================================
    if (!body.matricula?.trim()) {
        errores.push('La matrícula es obligatoria.');
    } else {
        const matricula = body.matricula.trim().toUpperCase();
        // Formato: MP-12345 o MN-12345 (4-6 dígitos)
        const matriculaRegex = /^(MP|MN)-\d{4,6}$/i;
        if (!matriculaRegex.test(matricula)) {
            errores.push('La matrícula debe tener el formato MP-12345 o MN-12345 (4-6 dígitos).');
        }
    }

    // ============================================================
    // 3. VALIDAR SERVICIO
    // ============================================================
    if (body.tipoServicio === 'existente') {
        if (!body.servicioId) {
            errores.push('Debe seleccionar un servicio.');
        } else if (serviciosExistentes.length > 0) {
            // Validar que el servicio ID existe en la lista de servicios
            const servicioExiste = serviciosExistentes.some(s => s.id === body.servicioId);
            if (!servicioExiste) {
                errores.push('El servicio seleccionado no es válido.');
            }
        }
    } else if (body.tipoServicio === 'otro') {
        if (!body.nuevoServicio?.trim()) {
            errores.push('Debe especificar el nombre del nuevo servicio.');
        } else if (body.nuevoServicio.trim().length > 80) {
            errores.push('El nombre del servicio no puede superar los 80 caracteres.');
        } else if (body.nuevoServicio.trim().length < 3) {
            errores.push('El nombre del servicio debe tener al menos 3 caracteres.');
        }
    } else {
        errores.push('Debe seleccionar un servicio o solicitar uno nuevo.');
    }

    // ============================================================
    // 4. VALIDAR EXPERIENCIA (años)
    // ============================================================
    if (body.experienciaAnios !== undefined && body.experienciaAnios !== '') {
        const experiencia = Number(body.experienciaAnios);
        if (isNaN(experiencia)) {
            errores.push('La experiencia debe ser un número válido.');
        } else if (experiencia < 0) {
            errores.push('La experiencia no puede ser negativa.');
        } else if (experiencia > 50) {
            errores.push('La experiencia no puede superar los 50 años.');
        }
    }

    // ============================================================
    // 5. VALIDAR EMAIL
    // ============================================================
    if (!body.email?.trim()) {
        errores.push('El email es obligatorio.');
    } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(body.email.trim())) {
            errores.push('El email no tiene un formato válido.');
        }
        // Validar longitud máxima
        if (body.email.trim().length > 100) {
            errores.push('El email no puede superar los 100 caracteres.');
        }
    }

    // ============================================================
    // 6. VALIDAR TELÉFONO 
    // ============================================================
    if (body.telefono?.trim()) {
        // Formato: +54 9 223 456-7890 o similar
        const telefonoRegex = /^[\+\d\s\-\(\)]{8,20}$/;
        if (!telefonoRegex.test(body.telefono.trim())) {
            errores.push('El teléfono no tiene un formato válido. Ej: +54 9 223 456-7890');
        }
    }


    return errores;
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
            pageCss: 'admin_list',  // ← CSS para listados
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
            pageCss: 'admin_form',  // ← CSS para formularios
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

    const errores = _validarProfesional(req.body, false, serviciosActivos);

    if (errores.length > 0) {
        return res.render('layout', {
            title: 'Nuevo Profesional — E-E Admin',
            pageCss: 'admin_form',
            currentPage: 'admin',
            body: 'pages/admin/professionals/form',
            profesional: null,
            servicios: serviciosActivos,
            errores: errores,
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
            errores: [err.message],
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
    const errores = _validarProfesional(req.body, true, serviciosActivos);

    if (errores.length > 0) {
        const profesional = profesionalesModel.getById(req.params.id);
        return res.render('layout', {
            title: 'Editar Profesional — E-E Admin',
            pageCss: 'admin_form',
            currentPage: 'admin',
            body: 'pages/admin/professionals/form',
            profesional: profesional,
            servicios: serviciosActivos,
            errores: errores,
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
            errores: [err.message],
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