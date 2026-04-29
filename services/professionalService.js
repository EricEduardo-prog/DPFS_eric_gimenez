//Normalizar disponibilidad, workflow de validación (aprobar/rechazar), filtro de profesionales disponibles.

// services/professionalService.js
'use strict';

const ProfesionalesModel = require('../models/profesionalesModel');
const ServicioModel = require('../models/servicioModel');
const SolicitudModel = require('../models/solicitudServicioModel');

const DIAS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];
const TURNOS = ['manana', 'tarde'];

class ProfessionalService {
    /**
     * Convierte los campos planos del formulario HTML en el objeto anidado de disponibilidad.
     * @param {Object} body - req.body
     * @returns {Object}
     */
    static normalizarDisponibilidad(body) {
        const disponibilidad = {};
        for (const dia of DIAS) {
            disponibilidad[dia] = {};
            for (const turno of TURNOS) {
                const clave = `disponibilidad_${dia}_${turno}`;
                disponibilidad[dia][turno] = body[clave] === 'true' || body[clave] === true || body[clave] === 'on';
            }
        }
        return disponibilidad;
    }

    /**
     * Aprueba un profesional: crea servicio personalizado si es necesario, actualiza estado y solicitud.
     * @param {string} profesionalId
     * @param {string} adminId
     * @param {string} observacion
     * @returns {Object}
     */
    static async aprobarProfesional(profesionalId, adminId, observacion = null) {
        const profesional = ProfesionalesModel.getById(profesionalId);
        if (!profesional) throw new Error('Profesional no encontrado.');
        // Si tiene servicio personalizado y aún no tiene servicioId, crearlo y asignarlo
        if (profesional.servicioPersonalizado && !profesional.servicioId) {
            const nuevoServicio = ServicioModel.create({
                nombre: profesional.servicioPersonalizado,
                descripcion: profesional.descripcionServicio || `Servicio solicitado por ${profesional.nombre}`,
                certificacionRequerida: true,
                destacado: false,
                activo: true,
            });
            ProfesionalesModel.update(profesionalId, { servicioId: nuevoServicio.id, servicioPersonalizado: null });
        }
        // Aprobar profesional
        const aprobado = ProfesionalesModel.aprobarServicio(profesionalId, { validadoPor: adminId, observacion });
        // Actualizar solicitud asociada
        const solicitudes = SolicitudModel.getByProfesionalId(profesionalId);
        const pendiente = solicitudes.find(s => s.estado === 'pendiente');
        if (pendiente) {
            SolicitudModel.actualizarEstado(pendiente.id, 'aprobado', observacion);
        }
        return aprobado;
    }

    /**
     * Rechaza un profesional y registra la observación.
     * @param {string} profesionalId
     * @param {string} adminId
     * @param {string} observacion
     * @returns {Object}
     */
    static rechazarProfesional(profesionalId, adminId, observacion) {
        const rechazado = ProfesionalesModel.rechazarServicio(profesionalId, { validadoPor: adminId, observacion });
        const solicitudes = SolicitudModel.getByProfesionalId(profesionalId);
        const pendiente = solicitudes.find(s => s.estado === 'pendiente');
        if (pendiente) {
            SolicitudModel.actualizarEstado(pendiente.id, 'rechazado', observacion);
        }
        return rechazado;
    }

    /**
     * Filtra profesionales disponibles según servicio, fecha y turno.
     * @param {string} servicioId
     * @param {string} fecha - ISO string YYYY-MM-DD
     * @param {string} turno - 'manana' o 'tarde'
     * @returns {Array} lista de profesionales enriquecida con nombre, rating, trabajos.
     */
    static getProfesionalesDisponibles(servicioId, fecha, turno) {
        const diaSemanaRaw = new Date(fecha).toLocaleDateString('es-AR', { weekday: 'long' }).toLowerCase();
        const diaSemana = diaSemanaRaw.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        let profesionales = ProfesionalesModel.getByServicioId(servicioId);
        profesionales = profesionales.filter(p => p.disponibilidad?.[diaSemana]?.[turno] === true);
        const servicio = ServicioModel.getById(servicioId);
        const precioBase = servicio?.precioBase || 0;
        const precioHora = servicio?.precioPorHora || 0;
        return profesionales.map(p => ({
            id: p.id,
            nombre: p.nombre,
            rating: p.valoracion?.valor || 0,
            trabajos: p.trabajosCompletados || 0,
            precioBase,
            precioHora,
        }));
    }
}

module.exports = ProfessionalService;