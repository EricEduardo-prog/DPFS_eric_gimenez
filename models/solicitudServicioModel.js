'use strict';
/**
 * solicitudServicioModel.js
 * Capa de persistencia para /data/solicitudes_servicios.json
 * Gestiona las solicitudes de nuevos servicios por parte de profesionales
 */
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', 'data', 'solicitudes_servicios.json');

function _leerDatos() {
    try {
        const raw = fs.readFileSync(DATA_PATH, 'utf8');
        const json = JSON.parse(raw);
        if (!json.solicitudes) json.solicitudes = [];
        return json;
    } catch (err) {
        return { solicitudes: [] };
    }
}

function _escribirDatos(json) {
    fs.writeFileSync(DATA_PATH, JSON.stringify(json, null, 2), 'utf8');
}

function _generarId(solicitudes) {
    if (!solicitudes || solicitudes.length === 0) return 'sol_001';
    const nums = solicitudes.map(s => {
        const match = String(s.id).match(/^sol_(\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
    }).filter(n => !isNaN(n) && n > 0);
    const maxNum = Math.max(...nums);
    const siguiente = maxNum + 1;
    return `sol_${String(siguiente).padStart(3, '0')}`;
}


// ─────────────────────────────────────────────────────────────────────────────
// Operaciones públicas
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Obtiene todas las solicitudes
 * @param {Object} opciones
 * @param {string} [opciones.estado] - Filtrar por estado (pendiente, aprobado, rechazado)
 * @returns {Array}
 */
function getAll({ estado = null } = {}) {
    const { solicitudes } = _leerDatos();
    let resultado = [...solicitudes];
    if (estado) {
        resultado = resultado.filter(s => s.estado === estado);
    }
    return resultado.sort((a, b) => new Date(b.fechaSolicitud) - new Date(a.fechaSolicitud));
}

/**
 * Obtiene una solicitud por ID
 * @param {string} id
 * @returns {Object|null}
 */
function getById(id) {
    const { solicitudes } = _leerDatos();
    return solicitudes.find(s => s.id === id) || null;
}

/**
 * Obtiene solicitudes por profesionalId
 * @param {string} profesionalId
 * @returns {Array}
 */
function getByProfesionalId(profesionalId) {
    const { solicitudes } = _leerDatos();
    return solicitudes.filter(s => s.profesionalId === profesionalId);
}

function create(data) {
    const json = _leerDatos();
    const solicitudes = json.solicitudes;
    const nueva = {
        id: _generarId(solicitudes),
        profesionalId: data.profesionalId,
        servicioSolicitado: data.servicioSolicitado,
        descripcion: data.descripcion || '',
        estado: data.estado || 'pendiente',
        fechaSolicitud: new Date().toISOString(),
        fechaRespuesta: null,
        respuestaAdmin: null
    };
    json.solicitudes.push(nueva);
    _escribirDatos(json);
    return nueva;
}

/**
 * Actualiza el estado de una solicitud
 * @param {string} id
 * @param {string} estado
 * @param {string} respuestaAdmin
 * @returns {Object}
 */
function actualizarEstado(id, estado, respuestaAdmin) {
    console.log(`🔧 MODEL.solicitud.actualizarEstado - ID: ${id} -> ${estado}`);

    const json = _leerDatos();
    const indice = json.solicitudes.findIndex(s => s.id === id);

    if (indice === -1) {
        throw new Error(`No se encontró la solicitud con id "${id}".`);
    }

    json.solicitudes[indice].estado = estado;
    json.solicitudes[indice].fechaRespuesta = new Date().toISOString();
    json.solicitudes[indice].respuestaAdmin = respuestaAdmin;

    _escribirDatos(json);

    return json.solicitudes[indice];
}

/**
 * Actualiza el profesionalId de una solicitud (para cuando se crea el profesional)
 * @param {string} profesionalId
 * @param {string} servicioSolicitado
 * @returns {Object|null}
 */
function actualizarProfesionalId(profesionalId, servicioSolicitado) {
    console.log(`🔧 MODEL.solicitud.actualizarProfesionalId - Prof: ${profesionalId}`);

    const json = _leerDatos();
    const indice = json.solicitudes.findIndex(
        s => s.servicioSolicitado === servicioSolicitado && s.profesionalId === null
    );

    if (indice === -1) return null;

    json.solicitudes[indice].profesionalId = profesionalId;
    _escribirDatos(json);

    return json.solicitudes[indice];
}
module.exports = { create, actualizarEstado, getAll, getById, getByProfesionalId, actualizarProfesionalId };