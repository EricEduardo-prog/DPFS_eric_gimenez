'use strict';

/**
 * usuarioModel.js
 * Capa de persistencia para /data/usuarios.json
 *
 * SEGURIDAD:
 *   - passwordHash nunca se devuelve en getAll() ni en vistas admin
 *   - El hash lo genera el controller (bcrypt) antes de llamar a create()
 *   - El modelo recibe passwordHash ya hasheado, nunca el password en texto plano
 *   - confirmPassword nunca llega al modelo — se valida solo en el controller
 *
 * El CRUD admin puede: listar, ver detalle, toggleActivo.
 * NO puede: editar passwordHash, ni ver el hash en listados.
 *
 * El registro público (register.ejs) usa create() con el hash generado
 * previamente por el controller de registro.
 */

const fs = require('fs');
const { get } = require('http');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', 'data', 'usuarios.json');

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
 * Genera ID autoincremental con formato usr_NNN (padding 3 dígitos)
 * Ejemplo: usr_001, usr_002, ..., usr_999, usr_1000
 * @param {Array} usuarios - Array de usuarios existentes
 * @returns {string} Nuevo ID
 */
function _generarId(usuarios) {
    // Si no hay usuarios, empezar desde usr_001
    if (!usuarios || usuarios.length === 0) {
        return 'usr_001';
    }

    // Extraer números de los IDs existentes con formato usr_NNN
    const nums = usuarios
        .map(u => {
            const match = String(u.id).match(/^usr_(\d+)$/);
            return match ? parseInt(match[1], 10) : 0;
        })
        .filter(n => !isNaN(n) && n > 0);

    // Si no se encontraron IDs con formato válido, empezar desde 1
    if (nums.length === 0) {
        return 'usr_001';
    }

    // Obtener el número más alto y sumar 1
    const maxNum = Math.max(...nums);
    const siguiente = maxNum + 1;

    // Formato con padding de 3 dígitos
    return `usr_${String(siguiente).padStart(3, '0')}`;
}

/**
 * Elimina passwordHash del objeto usuario antes de devolverlo.
 * Se aplica en todos los métodos de lectura pública.
 * @param {Object} usuario
 * @returns {Object} usuario sin passwordHash
 */
function _sanitizar(usuario) {
    if (!usuario) return null;
    const { passwordHash, ...seguro } = usuario;  // eslint-disable-line no-unused-vars
    return seguro;
}

// ─────────────────────────────────────────────────────────────────────────────
// Operaciones públicas
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Devuelve todos los usuarios SIN passwordHash.
 * @param {Object} opciones
 * @param {boolean} [opciones.soloActivos=false]
 * @returns {Array}
 */
function getAll({ soloActivos = false } = {}) {
    const { usuarios } = _leerDatos();
    const resultado = soloActivos ? usuarios.filter(u => u.activo) : usuarios;
    return resultado.map(_sanitizar);
}

/**
 * Devuelve un usuario por ID SIN passwordHash.
 * @returns {Object|null}
 */
function getById(id) {
    const { usuarios } = _leerDatos();
    return _sanitizar(usuarios.find(u => u.id === id) || null);
}

/**
 * Devuelve un usuario por ID CON passwordHash.
 * Solo para uso interno del proceso de cambio de contraseña.
 * @returns {Object|null}
 */
function getByIdWithHash(id) {
    const { usuarios } = _leerDatos();
    return usuarios.find(u => u.id === id) || null;
}

/**
 * Devuelve un usuario por email SIN passwordHash.
 * Usado para verificar unicidad en registro.
 * @returns {Object|null}
 */
function getByEmail(email) {
    const { usuarios } = _leerDatos();
    return _sanitizar(
        usuarios.find(u => u.email === email.toLowerCase().trim()) || null
    );
}

/**
 * Devuelve el usuario CON passwordHash.
 * Solo para uso interno del proceso de login — nunca exponer en vistas.
 * @returns {Object|null}
 */
function getByEmailConHash(email) {
    const { usuarios } = _leerDatos();
    return usuarios.find(u => u.email === email.toLowerCase().trim()) || null;
}
/**
 * Registra un nuevo usuario.
 * IMPORTANTE: el parámetro passwordHash debe ser el resultado de bcrypt.hash()
 * llamado en el controller, nunca el password en texto plano.
 *
 * @param {Object} data
 * @param {string} data.nombre
 * @param {string} data.email
 * @param {string} data.passwordHash   — ya hasheado por el controller
 * @param {boolean} data.aceptoTerminos
 * @param {string} [data.telefono]
 * @param {Object} [data.direccion]
 * @throws {Error} si el email ya existe
 * @returns {Object} usuario creado SIN passwordHash
 */
function create(data) {
    console.log('🔧 MODEL.create - Creando usuario:', data.email);

    const json = _leerDatos();
    const email = String(data.email || '').toLowerCase().trim();

    // Verificar email único
    if (json.usuarios.find(u => u.email === email)) {
        throw new Error(`Ya existe una cuenta con el email "${email}".`);
    }

    // ✅ Generar ID autoincremental basado en usuarios existentes
    const nuevoId = _generarId(json.usuarios);
    console.log(`🆕 Nuevo ID generado: ${nuevoId}`);

    const ahora = new Date().toISOString();

    const nuevo = {
        id: nuevoId,  // ← ID autoincremental
        nombre: String(data.nombre || '').trim(),
        email,
        passwordHash: data.passwordHash,
        telefono: String(data.telefono || '').trim(),
        direccion: {
            calle: String(data.direccion?.calle || '').trim(),
            numero: String(data.direccion?.numero || '').trim(),
            piso: String(data.direccion?.piso || '').trim(),
            depto: String(data.direccion?.depto || '').trim(),
            ciudad: String(data.direccion?.ciudad || '').trim(),
            provincia: String(data.direccion?.provincia || '').trim(),
            codigoPostal: String(data.direccion?.codigoPostal || '').trim(),
        },
        aceptoTerminos: data.aceptoTerminos === true || data.aceptoTerminos === 'true',
        activo: true,
        fechaRegistro: ahora,
        fechaModificacion: ahora,
    };

    json.usuarios.push(nuevo);
    _escribirDatos(json);

    console.log('✅ Usuario creado con ID:', nuevoId);
    return _sanitizar(nuevo);
}
/**
 * Actualiza datos del perfil de un usuario.
 * Permite actualizar passwordHash solo si se proporciona explícitamente.
 * @throws {Error} si no existe
 * @returns {Object} usuario actualizado SIN passwordHash
 */
function update(id, data) {
    console.log('🔧 MODEL.update - ID:', id);
    console.log('🔧 Datos recibidos:', Object.keys(data));

    const json = _leerDatos();
    const indice = json.usuarios.findIndex(u => u.id === id);
    if (indice === -1) throw new Error(`No se encontró el usuario con id "${id}".`);

    const actual = json.usuarios[indice];

    // Permitir actualizar passwordHash si viene en data
    const nuevoPasswordHash = data.passwordHash !== undefined
        ? data.passwordHash
        : actual.passwordHash;

    // Si se está actualizando la contraseña, loguearlo (sin mostrar el hash)
    if (data.passwordHash !== undefined) {
        console.log('🔐 Actualizando passwordHash para usuario:', actual.email);
    }

    json.usuarios[indice] = {
        ...actual,
        nombre: data.nombre ? String(data.nombre).trim() : actual.nombre,
        telefono: data.telefono !== undefined
            ? String(data.telefono).trim()
            : actual.telefono,
        direccion: {
            ...actual.direccion,
            ...(data.direccion ? {
                calle: String(data.direccion.calle || actual.direccion.calle).trim(),
                numero: String(data.direccion.numero || actual.direccion.numero).trim(),
                piso: String(data.direccion.piso !== undefined ? data.direccion.piso : actual.direccion.piso).trim(),
                depto: String(data.direccion.depto !== undefined ? data.direccion.depto : actual.direccion.depto).trim(),
                ciudad: String(data.direccion.ciudad || actual.direccion.ciudad).trim(),
                provincia: String(data.direccion.provincia || actual.direccion.provincia).trim(),
                codigoPostal: String(data.direccion.codigoPostal || actual.direccion.codigoPostal).trim(),
            } : {}),
        },
        activo: data.activo !== undefined ? data.activo : actual.activo,
        // Ahora passwordHash se actualiza si viene en data
        passwordHash: nuevoPasswordHash,
        // Inmutables (no se pueden cambiar)
        id: actual.id,
        email: actual.email,
        aceptoTerminos: actual.aceptoTerminos,
        fechaRegistro: actual.fechaRegistro,
        fechaModificacion: new Date().toISOString(),
    };

    _escribirDatos(json);

    console.log('✅ MODEL.update - Usuario actualizado:', id);
    return _sanitizar(json.usuarios[indice]);
}

/**
 * Baja lógica — alterna activo.
 * @throws {Error} si no existe
 */
function toggleActivo(id) {
    const json = _leerDatos();
    const indice = json.usuarios.findIndex(u => u.id === id);
    if (indice === -1) throw new Error(`No se encontró el usuario con id "${id}".`);

    json.usuarios[indice].activo = !json.usuarios[indice].activo;
    json.usuarios[indice].fechaModificacion = new Date().toISOString();

    _escribirDatos(json);
    return _sanitizar(json.usuarios[indice]);
}

module.exports = {
    getAll,
    getById,
    getByEmail,
    getByEmailConHash,
    getByIdWithHash,
    create,
    update,
    toggleActivo,
};