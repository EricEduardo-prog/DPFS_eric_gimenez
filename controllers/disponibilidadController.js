'use strict';

const ProfesionalService = require('../services/professionalService');
async function getProfesionalesDisponibles(req, res, next) {
    try {
        const { servicioId, fecha, turno } = req.query;
        console.log(`Recibido request de disponibilidad: servicioId=${servicioId}, fecha=${fecha}, turno=${turno}`);
        if (!servicioId || !fecha || !turno) {
            return res.status(400).json({ success: false, error: 'Faltan parámetros' });
        }
        const resultados = await ProfesionalService.getProfesionalesDisponibles( servicioId, fecha, turno);
        //Muestro resultados antes de enviarlos
        console.log('Profesionales disponibles encontrados:', resultados);
        res.json({ success: true, profesionales: resultados });
    } catch (err) {
        console.error('Error en getProfesionalesDisponibles:', err);
        next(err);
    }
}

module.exports = { getProfesionalesDisponibles };