'use strict';

const ProfesionalesModel = require('../models/profesionalesModel');
const ServicioModel = require('../models/servicioModel');

const profesionalesModel = ProfesionalesModel; // alias para mantener consistencia con otros controladores
const servicioModel = ServicioModel; // alias para mantener consistencia con otros controladores

async function getProfesionalesDisponibles(req, res, next) {
    try {
        const { servicioId, fecha, turno } = req.query;

        if (!servicioId || !fecha || !turno) {
            return res.status(400).json({ success: false, error: 'Faltan parámetros' });
        }

        // Obtener el día de la semana a partir de la fecha
        const diaSemanaRaw = new Date(fecha).toLocaleDateString('es-AR', { weekday: 'long' }).toLowerCase();
        // Normalizar eliminando acentos
        const diaSemana = diaSemanaRaw.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

        console.log(`Buscando profesionales para servicioId=${servicioId}, fecha=${fecha} (${diaSemana}), turno=${turno}`);
        // Obtener profesionales del servicio y filtrar por disponibilidad
        let profesionales = profesionalesModel.getByServicioId(servicioId);

        profesionales = profesionales.filter(p =>
            p.disponibilidad?.[diaSemana]?.[turno] === true || p.disponibilidad?.[diaSemana]?.[turno] === 'true'
        );

        const servicio = servicioModel.getById(servicioId);
        const precioServicio = servicio?.precioBase || 0;
        const precioHoraServicio = servicio?.precioHora || 0;
        //  CORREGIDO: usar profesionales en lugar de resultados
        const resultados = profesionales.map(p => ({
            id: p.id,
            nombre: p.nombre,
            rating: p.valoracion?.valor || 0,
            trabajos: p.trabajosCompletados || 0,
            precioBase: precioServicio,
            precioHora: precioHoraServicio
        }));

        res.json({ success: true, profesionales: resultados });
    } catch (err) {
        console.error('Error en getProfesionalesDisponibles:', err);
        next(err);
    }
}

module.exports = { getProfesionalesDisponibles };