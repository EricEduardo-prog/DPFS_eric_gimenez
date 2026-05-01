// services/professionalService.js
'use strict';

const { Professional, Service, ServiceRequest, sequelize } = require('../database/models');

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
     * Aprueba un profesional: crea servicio personalizado si es necesario.
     * @param {string} profesionalId
     * @param {string} adminId
     * @param {string|null} observacion
     * @returns {Promise<Object>}
     */
    static async aprobarProfesional(profesionalId, adminId, observacion = null) {
        const profesional = await Professional.findByPk(profesionalId);
        if (!profesional) throw new Error('Profesional no encontrado.');

        let servicioId = profesional.service_id;
        if (profesional.custom_service && !profesional.service_id) {
            // Crear nuevo servicio
            const nuevoServicio = await Service.create({
                id: `serv_${Date.now()}`,
                name: profesional.custom_service,
                description: `Servicio solicitado por ${profesional.name}`,
                certification_required: true,
                is_featured: false,
                is_active: true,
                experience_levels: []
            });
            servicioId = nuevoServicio.id;
        }

        // Actualizar profesional
        await profesional.update({
            service_id: servicioId,
            service_status: 'aprobado',
            validation_date: new Date(),
            validated_by: adminId,
            admin_observation: observacion,
            custom_service: profesional.custom_service ? null : profesional.custom_service // se limpia si existía
        });

        // Actualizar solicitud asociada
        const solicitud = await ServiceRequest.findOne({
            where: { professional_id: profesionalId, status: 'pendiente' }
        });
        if (solicitud) {
            await solicitud.update({
                status: 'aprobado',
                response_date: new Date(),
                response_admin: adminId
            });
        }
        return profesional.toJSON();
    }

    /**
     * Rechaza un profesional.
     * @param {string} profesionalId
     * @param {string} adminId
     * @param {string} observacion
     * @returns {Promise<Object>}
     */
    static async rechazarProfesional(profesionalId, adminId, observacion) {
        const profesional = await Professional.findByPk(profesionalId);
        if (!profesional) throw new Error('Profesional no encontrado.');

        await profesional.update({
            service_status: 'rechazado',
            validation_date: new Date(),
            validated_by: adminId,
            admin_observation: observacion
        });

        const solicitud = await ServiceRequest.findOne({
            where: { professional_id: profesionalId, status: 'pendiente' }
        });
        if (solicitud) {
            await solicitud.update({
                status: 'rechazado',
                response_date: new Date(),
                response_admin: adminId
            });
        }
        return profesional.toJSON();
    }

    /**
     * Filtra profesionales disponibles según servicio, fecha y turno.
     * @param {string} servicioId
     * @param {string} fecha - YYYY-MM-DD
     * @param {string} turno - 'manana' o 'tarde'
     * @returns {Promise<Array>}
     */
    static async getProfesionalesDisponibles(servicioId, fecha, turno) {
        // Obtener día de la semana (sin tilde)
        const diaSemanaRaw = new Date(fecha).toLocaleDateString('es-AR', { weekday: 'long' }).toLowerCase();
        const diaSemana = diaSemanaRaw.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

        // Obtener profesionales con ese servicio y activos
        const profesionales = await Professional.findAll({
            where: {
                service_id: servicioId,
                service_status: 'aprobado',
                is_active: true
            }
        });

        // Filtrar por disponibilidad en base al JSON guardado
        const disponibles = profesionales.filter(p => {
            const disp = p.availability || {};
            return disp[diaSemana] && disp[diaSemana][turno] === true;
        });

        const servicio = await Service.findByPk(servicioId);
        const precioBase = servicio?.base_price || 0;
        const precioHora = servicio?.hourly_price || 0;

        return disponibles.map(p => ({
            id: p.id,
            nombre: p.name,
            rating: p.rating_value || 0,
            trabajos: p.jobs_completed || 0,
            precioBase,
            precioHora,
        }));
    }
}

module.exports = ProfessionalService;