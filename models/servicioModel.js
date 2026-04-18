'use strict';

/**
 * servicioModel.js
 * Capa de persistencia para /data/servicios.json
 */

const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', 'data', 'servicios.json');

// ─────────────────────────────────────────────────────────────────────────────
// Helpers internos
// ─────────────────────────────────────────────────────────────────────────────

function _leerDatos() {
    try {
        const raw = fs.readFileSync(DATA_PATH, 'utf8');
        const json = JSON.parse(raw);
        if (!json.servicios) json.servicios = [];
        if (!json._meta) json._meta = { version: "1.0.0" };
        return json;
    } catch (err) {
        if (err.code === 'ENOENT') {
            const estructuraBase = {
                _meta: { version: "1.0.0", descripcion: "Catálogo de servicios/profesiones", ultimaActualizacion: new Date().toISOString() },
                servicios: []
            };
            fs.writeFileSync(DATA_PATH, JSON.stringify(estructuraBase, null, 2), 'utf8');
            return estructuraBase;
        }
        throw err;
    }
}

function _escribirDatos(json) {
    json._meta.ultimaActualizacion = new Date().toISOString();
    fs.writeFileSync(DATA_PATH, JSON.stringify(json, null, 2), 'utf8');
}

/**
 * Genera ID autoincremental con formato serv_NNN
 * @param {Array} servicios - Array de servicios existentes
 * @returns {string}
 */
function _generarId(servicios) {
    if (!servicios || servicios.length === 0) return 'serv_001';

    const nums = servicios
        .map(s => {
            const match = String(s.id).match(/^serv_(\d+)$/);
            return match ? parseInt(match[1], 10) : 0;
        })
        .filter(n => !isNaN(n) && n > 0);

    if (nums.length === 0) return 'serv_001';

    const maxNum = Math.max(...nums);
    const siguiente = maxNum + 1;

    return `serv_${String(siguiente).padStart(3, '0')}`;
}

/**
 * Genera slug a partir del nombre
 * @param {string} nombre
 * @returns {string}
 */
function _generarSlug(nombre) {
    return nombre
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
}

/**
 * Elimina campos internos para sanitizar respuesta
 * @param {Object} servicio
 * @returns {Object}
 */
function _sanitizar(servicio) {
    if (!servicio) return null;
    const { ...limpio } = servicio;
    return limpio;
}

// ─────────────────────────────────────────────────────────────────────────────
// Operaciones públicas
// ─────────────────────────────────────────────────────────────────────────────

function getAll({ soloActivos = false, destacados = false } = {}) {
    const { servicios } = _leerDatos();
    let resultado = [...servicios];

    if (soloActivos) resultado = resultado.filter(s => s.activo === true);
    if (destacados) resultado = resultado.filter(s => s.destacado === true);

    return resultado.sort((a, b) => a.nombre.localeCompare(b.nombre));
}

function getById(id) {
    const { servicios } = _leerDatos();
    return _sanitizar(servicios.find(s => s.id === id) || null);
}

function getBySlug(slug) {
    const { servicios } = _leerDatos();
    return _sanitizar(servicios.find(s => s.slug === slug) || null);
}

function getByNombre(nombre) {
    const { servicios } = _leerDatos();
    return _sanitizar(servicios.find(s => s.nombre === nombre) || null);
}

function create(data) {
    console.log('🔧 MODEL.create - Creando servicio:', data.nombre);

    const json = _leerDatos();
    const servicios = json.servicios;

    // Validar nombre único
    const nombreExistente = servicios.find(s => s.nombre === data.nombre.trim());
    if (nombreExistente) {
        throw new Error(`Ya existe un servicio con el nombre "${data.nombre}".`);
    }

    const nuevoId = _generarId(servicios);
    const slug = data.slug || _generarSlug(data.nombre);
    const ahora = new Date().toISOString();

    // Validar slug único
    if (servicios.find(s => s.slug === slug)) {
        throw new Error(`Ya existe un servicio con el slug "${slug}".`);
    }

    const nuevoServicio = {
        id: nuevoId,
        nombre: String(data.nombre).trim(),
        slug: slug,
        descripcion: String(data.descripcion || '').trim(),
        nivelesExperiencia: data.nivelesExperiencia || [
            { nivel: "Sin experiencia", requisitos: [] },
            { nivel: "1-2 años", requisitos: [] },
            { nivel: "3-5 años", requisitos: [] },
            { nivel: "6-10 años", requisitos: [] },
            { nivel: "+10 años", requisitos: [] }
        ],
        certificacionRequerida: data.certificacionRequerida === 'true' || data.certificacionRequerida === true,
        destacado: data.destacado === 'true' || data.destacado === true,
        activo: true,
        fechaCreacion: ahora,
        fechaModificacion: ahora
    };

    json.servicios.push(nuevoServicio);
    _escribirDatos(json);

    console.log('✅ Servicio creado:', nuevoId);
    return _sanitizar(nuevoServicio);
}

function update(id, data) {
    console.log('🔧 MODEL.update - ID:', id);

    const json = _leerDatos();
    const indice = json.servicios.findIndex(s => s.id === id);

    if (indice === -1) {
        throw new Error(`No se encontró el servicio con id "${id}".`);
    }

    const actual = json.servicios[indice];
    const nuevoNombre = data.nombre ? String(data.nombre).trim() : actual.nombre;
    const nuevoSlug = data.slug || _generarSlug(nuevoNombre);

    // Validar nombre único (excluyendo el actual)
    if (nuevoNombre !== actual.nombre) {
        const nombreExistente = json.servicios.find(s => s.nombre === nuevoNombre && s.id !== id);
        if (nombreExistente) {
            throw new Error(`Ya existe otro servicio con el nombre "${nuevoNombre}".`);
        }
    }

    // Validar slug único (excluyendo el actual)
    if (nuevoSlug !== actual.slug) {
        const slugExistente = json.servicios.find(s => s.slug === nuevoSlug && s.id !== id);
        if (slugExistente) {
            throw new Error(`Ya existe otro servicio con el slug "${nuevoSlug}".`);
        }
    }

    const ahora = new Date().toISOString();

    json.servicios[indice] = {
        ...actual,
        nombre: nuevoNombre,
        slug: nuevoSlug,
        descripcion: data.descripcion !== undefined ? String(data.descripcion).trim() : actual.descripcion,
        nivelesExperiencia: data.nivelesExperiencia || actual.nivelesExperiencia,
        certificacionRequerida: data.certificacionRequerida !== undefined ? (data.certificacionRequerida === 'true' || data.certificacionRequerida === true) : actual.certificacionRequerida,
        destacado: data.destacado !== undefined ? (data.destacado === 'true' || data.destacado === true) : actual.destacado,
        activo: data.activo !== undefined ? (data.activo === 'true' || data.activo === true) : actual.activo,
        fechaModificacion: ahora
    };

    _escribirDatos(json);

    console.log('✅ Servicio actualizado:', id);
    return _sanitizar(json.servicios[indice]);
}

function toggleActivo(id) {
    console.log('🔧 MODEL.toggleActivo - ID:', id);

    const json = _leerDatos();
    const indice = json.servicios.findIndex(s => s.id === id);

    if (indice === -1) {
        throw new Error(`No se encontró el servicio con id "${id}".`);
    }

    json.servicios[indice].activo = !json.servicios[indice].activo;
    json.servicios[indice].fechaModificacion = new Date().toISOString();

    _escribirDatos(json);

    return _sanitizar(json.servicios[indice]);
}

function toggleDestacado(id) {
    console.log('⭐ MODEL.toggleDestacado - ID:', id);

    const json = _leerDatos();
    const indice = json.servicios.findIndex(s => s.id === id);

    if (indice === -1) {
        throw new Error(`No se encontró el servicio con id "${id}".`);
    }

    json.servicios[indice].destacado = !json.servicios[indice].destacado;
    json.servicios[indice].fechaModificacion = new Date().toISOString();

    _escribirDatos(json);

    return _sanitizar(json.servicios[indice]);
}

module.exports = {
    getAll,
    getById,
    getBySlug,
    getByNombre,
    create,
    update,
    toggleActivo,
    toggleDestacado
};