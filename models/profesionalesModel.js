'use strict';

/**
 * profesionalesModel.js
 * Capa de persistencia para /data/profesionales.json
 *
 * Campos de SOLO LECTURA (nunca se tocan desde el CRUD de profesionales):
 *   - valoracion.valor, valoracion.cantidad → los actualiza el módulo de órdenes
 *   - trabajosCompletados                   → lo actualiza el módulo de órdenes
 *
 * Transformación especial — grilla de disponibilidad:
 *   El formulario envía checkboxes con nombres planos:
 *     disponibilidad_lunes_manana = 'on'
 *     disponibilidad_martes_tarde = 'on'
 *     (los no marcados directamente no llegan en el body)
 *
 *   _normalizarDisponibilidad() los convierte al objeto anidado del JSON:
 *     { lunes: { manana: true, tarde: false }, martes: { ... }, ... }
 */

const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', 'data', 'profesionales.json');

const DIAS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];
const TURNOS = ['manana', 'tarde'];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers internos
// ─────────────────────────────────────────────────────────────────────────────

function _leerDatos() {
    const raw = fs.readFileSync(DATA_PATH, 'utf8');
    return JSON.parse(raw);
}

function _escribirDatos(json) {
    fs.writeFileSync(DATA_PATH, JSON.stringify(json, null, 2), 'utf8');
}

/**
 * Genera ID autoincremental con formato prof_NNN (padding 3 dígitos)
 * Ejemplo: prof_001, prof_002, ..., prof_999, prof_1000
 * @param {Array} profesionales - Array de profesionales existentes
 * @returns {string} Nuevo ID
 */
function _generarId(profesionales) {
    // Si no hay profesionales, empezar desde prof_001
    if (!profesionales || profesionales.length === 0) {
        return 'prof_001';
    }

    // Extraer números de los IDs existentes con formato prof_NNN
    const nums = profesionales
        .map(p => {
            const match = String(p.id).match(/^prof_(\d+)$/);
            return match ? parseInt(match[1], 10) : 0;
        })
        .filter(n => !isNaN(n) && n > 0);

    // Si no se encontraron IDs con formato válido, empezar desde 1
    if (nums.length === 0) {
        return 'prof_001';
    }

    // Obtener el número más alto y sumar 1
    const maxNum = Math.max(...nums);
    const siguiente = maxNum + 1;

    // Formato con padding de 3 dígitos
    return `prof_${String(siguiente).padStart(3, '0')}`;
}

/**
 * Convierte los campos planos del form HTML al objeto anidado de disponibilidad.
 *
 * Entrada (req.body):
 *   { disponibilidad_lunes_manana: 'on', disponibilidad_martes_tarde: 'on', ... }
 *
 * Salida:
 *   { lunes: { manana: true, tarde: false }, martes: { manana: false, tarde: true }, ... }
 *
 * @param {Object} body - req.body completo
 * @returns {Object}
 */
function _normalizarDisponibilidad(body) {
    const disp = {};
    for (const dia of DIAS) {
        disp[dia] = {};
        for (const turno of TURNOS) {
            const clave = `disponibilidad_${dia}_${turno}`;
            const valor = body[clave];
            // ✅ Aceptar 'true', 'false', true, false, 'on'
            disp[dia][turno] = valor === 'true' || valor === true || valor === 'on';
        }
    }
    return disp;
}

// ============================================================
// MÉTODOS PARA VALIDACIÓN DE PROFESIONALES
// ============================================================

/**
 * Obtiene profesionales pendientes de aprobación
 * @returns {Array}
 */
function getPendientes() {
    const { profesionales } = _leerDatos();
    return profesionales.filter(p => p.estadoServicio === 'pendiente');
}

/**
 * Obtiene profesionales por estado de servicio
 * @param {string} estado - 'pendiente', 'aprobado', 'rechazado'
 * @returns {Array}
 */
function getByEstadoServicio(estado) {
    const { profesionales } = _leerDatos();
    return profesionales.filter(p => p.estadoServicio === estado);
}

/**
 * Aprueba un profesional para un servicio
 * @param {string} id
 * @param {Object} datosAprobacion
 * @returns {Object}
 */
function aprobarServicio(id, datosAprobacion) {
    console.log('✅ MODEL.aprobarServicio - ID:', id);

    const json = _leerDatos();
    const indice = json.profesionales.findIndex(p => p.id === id);

    if (indice === -1) {
        throw new Error(`No se encontró el profesional con id "${id}".`);
    }

    json.profesionales[indice] = {
        ...json.profesionales[indice],
        estadoServicio: 'aprobado',
        certificacionVerificada: true,
        fechaValidacion: new Date().toISOString(),
        validadoPor: datosAprobacion.validadoPor,
        observacionAdmin: datosAprobacion.observacion || null,
        fechaModificacion: new Date().toISOString()
    };

    _escribirDatos(json);
    return json.profesionales[indice];
}

/**
 * Rechaza un profesional para un servicio
 * @param {string} id
 * @param {Object} datosRechazo
 * @returns {Object}
 */
function rechazarServicio(id, datosRechazo) {
    console.log('❌ MODEL.rechazarServicio - ID:', id);

    const json = _leerDatos();
    const indice = json.profesionales.findIndex(p => p.id === id);

    if (indice === -1) {
        throw new Error(`No se encontró el profesional con id "${id}".`);
    }

    json.profesionales[indice] = {
        ...json.profesionales[indice],
        estadoServicio: 'rechazado',
        certificacionVerificada: false,
        fechaValidacion: new Date().toISOString(),
        validadoPor: datosRechazo.validadoPor,
        observacionAdmin: datosRechazo.observacion || null,
        fechaModificacion: new Date().toISOString()
    };

    _escribirDatos(json);
    return json.profesionales[indice];
}


// ─────────────────────────────────────────────────────────────────────────────
// Operaciones públicas
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {Object} opciones
 * @param {boolean} [opciones.soloActivos=false]
 * @param {string}  [opciones.profesion]  — filtra por profesión exacta
 * @returns {Array}
 */
function getAll({ soloActivos = false, profesion = null } = {}) {
    const { profesionales } = _leerDatos();
    let resultado = soloActivos ? profesionales.filter(i => i.activo) : profesionales;
    if (profesion) resultado = resultado.filter(i => i.profesion === profesion);
    return resultado;
}

/** @returns {Object|null} */
function getById(id) {
    const { profesionales } = _leerDatos();
    return profesionales.find(i => i.id === id) || null;
}

/** @returns {Object|null} */
function getByEmail(email) {
    const { profesionales } = _leerDatos();
    return profesionales.find(i => i.email === email.toLowerCase().trim()) || null;
}

/** @returns {Object|null} */
function getByMatricula(matricula) {
    const { profesionales } = _leerDatos();
    return profesionales.find(i => i.matricula === matricula.trim().toUpperCase()) || null;
}

/**
 * Devuelve profesionales activos disponibles en un día y turno concreto.
 * Útil para el selector de fecha en productDetail.
 * @param {string} dia    — 'lunes'|'martes'|...
 * @param {string} turno  — 'manana'|'tarde'
 * @returns {Array}
 */
function getDisponiblesEnTurno(dia, turno) {
    const { profesionales } = _leerDatos();
    return profesionales.filter(
        i => i.activo && i.disponibilidad?.[dia]?.[turno] === true
    );
}

/**
 * Crea un profesional nuevo.
 * @throws {Error} si email o matrícula ya existen
 */
/**
 * Crea un profesional nuevo.
 * @throws {Error} si email o matrícula ya existen
 */
function create(data) {
    console.log('🔧 MODEL.create - Creando profesional:', data.email);

    const json = _leerDatos();
    const profesionales = json.profesionales || [];

    const email = String(data.email || '').toLowerCase().trim();
    const matricula = String(data.matricula || '').trim().toUpperCase();

    // Validar email único
    if (profesionales.find(i => i.email === email)) {
        throw new Error(`Ya existe un profesional con el email "${email}".`);
    }

    // Validar matrícula única
    if (profesionales.find(i => i.matricula === matricula)) {
        throw new Error(`Ya existe un profesional con la matrícula "${matricula}".`);
    }

    // ✅ Generar ID autoincremental basado en profesionales existentes
    const nuevoId = _generarId(profesionales);
    console.log(`🆕 Nuevo ID generado: ${nuevoId}`);

    const ahora = new Date().toISOString();

    // Normalizar disponibilidad si viene del formulario
    const disponibilidad = data.disponibilidad || _normalizarDisponibilidad(data);

    const nuevo = {
        id: nuevoId,  // ← ID autoincremental
        nombre: String(data.nombre || '').trim(),
        matricula,
        profesion: String(data.profesion || '').trim(),
        email,
        telefono: String(data.telefono || '').trim(),
        disponibilidad: disponibilidad,
        // Campos de solo lectura — siempre se inicializan en 0
        valoracion: { valor: 0, cantidad: 0 },
        trabajosCompletados: 0,
        activo: true,
        fechaAlta: ahora,
        fechaModificacion: ahora,
    };

    json.profesionales.push(nuevo);
    _escribirDatos(json);

    console.log('✅ Profesional creado con ID:', nuevoId);
    return nuevo;
}

/**
 * Actualiza un profesional existente.
 * Los campos valoracion y trabajosCompletados son inmutables desde aquí.
 * @throws {Error} si no existe o email/matrícula colisionan
 */
function update(id, data) {
    console.log('🔧 MODEL.update - ID:', id);
    console.log('🔧 Datos recibidos:', JSON.stringify(data, null, 2));

    const json = _leerDatos();
    const indice = json.profesionales.findIndex(i => i.id === id);
    if (indice === -1) throw new Error(`No se encontró el profesional con id "${id}".`);

    const actual = json.profesionales[indice];
    const email = String(data.email || actual.email).toLowerCase().trim();
    const matricula = String(data.matricula || actual.matricula).trim().toUpperCase();

    // Verificar colisiones
    if (email !== actual.email && json.profesionales.find(i => i.email === email && i.id !== id)) {
        throw new Error(`Ya existe otro profesional con el email "${email}".`);
    }
    if (matricula !== actual.matricula && json.profesionales.find(i => i.matricula === matricula && i.id !== id)) {
        throw new Error(`Ya existe otro profesional con la matrícula "${matricula}".`);
    }

    // ✅ SIMPLIFICADO: Usar data.disponibilidad directamente (ya normalizada por el controller)
    // Si no viene, mantener la existente
    const disponibilidadActualizada = data.disponibilidad || actual.disponibilidad;

    console.log('✅ Disponibilidad a guardar:', JSON.stringify(disponibilidadActualizada, null, 2));

    json.profesionales[indice] = {
        ...actual,
        nombre: String(data.nombre || actual.nombre).trim(),
        matricula,
        profesion: String(data.profesion || actual.profesion).trim(),
        email,
        telefono: String(data.telefono !== undefined ? data.telefono : actual.telefono).trim(),
        servicioId: data.servicioId !== undefined ? data.servicioId : actual.servicioId,
        servicioPersonalizado: data.servicioPersonalizado !== undefined ? data.servicioPersonalizado : actual.servicioPersonalizado,
        estadoServicio: data.estadoServicio || actual.estadoServicio || 'pendiente',
        experienciaAnios: data.experienciaAnios !== undefined ? data.experienciaAnios : actual.experienciaAnios,
        disponibilidad: disponibilidadActualizada,
        id: actual.id,
        valoracion: actual.valoracion,
        trabajosCompletados: actual.trabajosCompletados,
        fechaAlta: actual.fechaAlta,
        activo: data.activo === 'true' || data.activo === true
            ? true
            : data.activo === 'false' || data.activo === false
                ? false
                : actual.activo,
        fechaModificacion: new Date().toISOString(),

    };

    console.log('✅ Profesional actualizado:', json.profesionales[indice].id);
    console.log('   - servicioId:', json.profesionales[indice].servicioId);
    console.log('   - servicioPersonalizado:', json.profesionales[indice].servicioPersonalizado);
    console.log('   - estadoServicio:', json.profesionales[indice].estadoServicio);
    console.log('   - experienciaAnios:', json.profesionales[indice].experienciaAnios);
    _escribirDatos(json);
    return json.profesionales[indice];
}

/**
 * Baja lógica — alterna activo.
 * @throws {Error} si no existe
 */
function toggleActivo(id) {
    const json = _leerDatos();
    const indice = json.profesionales.findIndex(i => i.id === id);
    if (indice === -1) throw new Error(`No se encontró el profesional con id "${id}".`);

    json.profesionales[indice].activo = !json.profesionales[indice].activo;
    json.profesionales[indice].fechaModificacion = new Date().toISOString();

    _escribirDatos(json);
    return json.profesionales[indice];
}

module.exports = {
    getAll,
    getById,
    getByEmail,
    getByMatricula,
    getDisponiblesEnTurno,
    create,
    update,
    toggleActivo,
    // Métodos para validación de profesionales
    getPendientes,
    getByEstadoServicio,
    aprobarServicio,
    rechazarServicio
};