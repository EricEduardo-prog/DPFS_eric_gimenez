'use strict';

/**
 * productoModel.js
 * Capa de persistencia para /data/productos.json
 *
 * Campos de SOLO LECTURA (nunca se tocan desde el CRUD de productos):
 *   - rating.valor, rating.cantidad  → los actualiza el módulo de órdenes
 *
 * Campos inmutables tras create():
 *   - id, fechaCreacion
 *
 * Transformaciones de entrada desde formulario HTML:
 *   - colores / talles llegan como string CSV → se convierten a array
 *   - instalacionDisponible / profesionalesDisponibles llegan como 'true'|undefined
 *   - precio / precioOriginal / precioInstalacion llegan como string → Number
 *   - activo llega como 'true'|undefined (checkbox)
 */

const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', 'data', 'productos.json');

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

function _generarId(productos) {
    if (!productos || productos.length === 0) return 'prod_001';
    const nums = productos
        .map(p => {
            const match = String(p.id).match(/^prod_(\d+)$/);
            return match ? parseInt(match[1], 10) : 0;
        })
        .filter(n => !isNaN(n) && n > 0);

    // Obtener el número más alto y sumar 1
    const maxNum = Math.max(...nums);
    const siguiente = maxNum + 1;

    // Formato con padding de 3 dígitos (cambiar a 4 si querés prod_0001)
    return `prod_${String(siguiente).padStart(3, '0')}`;
}

/**
 * Convierte un string CSV en array limpio.
 * "Blanco, Negro, " → ["Blanco", "Negro"]
 */
function _csvToArray(valor) {
    if (Array.isArray(valor)) return valor.filter(Boolean);
    if (!valor || !String(valor).trim()) return [];
    return String(valor).split(',').map(s => s.trim()).filter(Boolean);
}

/**
 * Normaliza los campos del formulario al schema del JSON.
 * Centraliza toda la conversión de tipos en un solo lugar.
 */
function _normalizar(data) {
    console.log('🔧 _normalizar - Input:', data);

    const normalizado = {};

    // Campos básicos
    if (data.nombre !== undefined) normalizado.nombre = String(data.nombre).trim();
    if (data.sku !== undefined) normalizado.sku = String(data.sku).trim();

    // Mapear categoria a categoriaId si es necesario
    const categoriaId = data.categoriaId || data.categoria;
    if (categoriaId !== undefined) normalizado.categoriaId = String(categoriaId).trim();

    if (data.descripcion !== undefined) normalizado.descripcion = String(data.descripcion).trim();
    if (data.imagen !== undefined) normalizado.imagen = String(data.imagen).trim();

    // Precios
    if (data.precio !== undefined) normalizado.precio = Number(data.precio);
    if (data.precioOriginal !== undefined) normalizado.precioOriginal = Number(data.precioOriginal) || 0;

    // Arrays
    if (data.caracteristicas !== undefined) {
        normalizado.caracteristicas = Array.isArray(data.caracteristicas)
            ? data.caracteristicas
            : (data.caracteristicas ? [data.caracteristicas] : []);
    }

    if (data.colores !== undefined) {
        normalizado.colores = Array.isArray(data.colores)
            ? data.colores
            : (data.colores ? [data.colores] : []);
    }

    if (data.talles !== undefined) {
        normalizado.talles = Array.isArray(data.talles)
            ? data.talles
            : (data.talles ? [data.talles] : []);
    }

    // Instalación
    if (data.instalacionDisponible !== undefined) {
        normalizado.instalacion = {
            disponible: data.instalacionDisponible === 'true' || data.instalacionDisponible === true,
            precio: data.instalacionPrecio ? Number(data.instalacionPrecio) : 0,
            profesionalesDisponibles: data.profesionalesDisponibles === 'true' || data.profesionalesDisponibles === true
        };
    }

    // Activo
    if (data.activo !== undefined) {
        normalizado.activo = data.activo === 'true' || data.activo === true;
    }

    console.log('🔧 _normalizar - Output:', normalizado);
    return normalizado;
}

// ─────────────────────────────────────────────────────────────────────────────
// Operaciones públicas
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {Object} opciones
 * @param {boolean} [opciones.soloActivos=false]
 * @param {string}  [opciones.categoriaId]  — filtra por categoría
 * @returns {Array}
 */
function getAll({ soloActivos = false, categoriaId = null } = {}) {
    const { productos } = _leerDatos();
    let resultado = soloActivos ? productos.filter(p => p.activo) : productos;
    if (categoriaId) resultado = resultado.filter(p => p.categoriaId === categoriaId);
    return resultado;
}

/** @returns {Object|null} */
function getById(id) {
    const { productos } = _leerDatos();
    return productos.find(p => p.id === id) || null;
}

/** @returns {Object|null} */
function getBySku(sku) {
    const { productos } = _leerDatos();
    return productos.find(p => p.sku === sku.toUpperCase()) || null;
}

/**
 * Crea un producto nuevo.
 * @throws {Error} si el SKU ya existe
 */
function create(data) {
    console.log('🔧 MODEL.create - Iniciando...');

    // Leer datos usando tu función existente
    const json = _leerDatos();
    const productos = json.productos || [];

    // Normalizar los datos (usando tu función existente)
    const campos = _normalizar(data);

    console.log(`📊 Productos existentes: ${productos.length}`);
    console.log('📦 Campos normalizados:', campos);

    // Validar SKU único
    if (!campos.sku) throw new Error('El SKU es obligatorio.');
    const skuExistente = productos.find(p => p.sku === campos.sku);
    if (skuExistente) throw new Error(`Ya existe un producto con el SKU "${campos.sku}".`);

    // Generar ID autoincremental basado en productos existentes
    const nuevoId = _generarId(productos);
    console.log(`🆕 Nuevo ID generado: ${nuevoId}`);

    const ahora = new Date().toISOString();

    // Crear el nuevo producto combinando ID generado + campos normalizados
    const nuevo = {
        id: nuevoId,                    // ← ID autoincremental
        ...campos,                      // ← Todos los campos normalizados
        rating: { valor: 0, cantidad: 0 },  // rating inicial
        fechaCreacion: ahora,
        fechaModificacion: ahora,
    };

    console.log('✅ Producto creado:', { id: nuevo.id, nombre: nuevo.nombre, sku: nuevo.sku });

    // Guardar usando tu función existente
    json.productos.push(nuevo);
    _escribirDatos(json);

    return nuevo;
}

/**
 * Actualiza un producto existente.
 * Los campos rating son inmutables desde este modelo.
 * @throws {Error} si no existe o SKU colisiona
 */
function update(id, data) {
    console.log('🔧 MODEL.update - Iniciando...');
    console.log(`🔧 ID a actualizar: ${id}`);
    console.log('🔧 Datos recibidos:', data);

    // Leer datos
    const json = _leerDatos();
    const productos = json.productos || [];

    // Buscar índice del producto
    const indice = productos.findIndex(p => p.id === id);
    console.log(`🔧 Índice encontrado: ${indice}`);

    if (indice === -1) {
        throw new Error(`No se encontró el producto con id "${id}".`);
    }

    const productoExistente = productos[indice];
    console.log(`🔧 Producto existente:`, { id: productoExistente.id, nombre: productoExistente.nombre });

    // Normalizar los nuevos datos
    const campos = _normalizar(data);
    console.log('🔧 Campos normalizados:', campos);

    // Verificar SKU único (excluyendo el producto actual)
    if (campos.sku && campos.sku !== productoExistente.sku) {
        const skuExistente = productos.find(p => p.sku === campos.sku && p.id !== id);
        if (skuExistente) {
            throw new Error(`Ya existe otro producto con el SKU "${campos.sku}".`);
        }
    }

    const ahora = new Date().toISOString();

    // Actualizar producto preservando campos inmutables
    const productoActualizado = {
        ...productoExistente,           // Mantener todo lo existente
        ...campos,                      // Sobrescribir con nuevos datos
        id: productoExistente.id,       // Nunca cambiar el ID
        sku: campos.sku || productoExistente.sku,  // SKU actualizado si viene
        rating: productoExistente.rating || { valor: 0, cantidad: 0 }, // Preservar rating
        fechaCreacion: productoExistente.fechaCreacion, // No cambiar fecha creación
        fechaModificacion: ahora,       // Actualizar fecha modificación
    };

    console.log('✅ Producto actualizado:', { id: productoActualizado.id, nombre: productoActualizado.nombre });

    // Guardar cambios
    json.productos[indice] = productoActualizado;
    _escribirDatos(json);

    return productoActualizado;
}

/**
 * Baja lógica — alterna activo.
 * @throws {Error} si no existe
 */
function toggleActivo(id) {
    const json = _leerDatos();
    const indice = json.productos.findIndex(p => p.id === id);
    if (indice === -1) throw new Error(`No se encontró el producto con id "${id}".`);

    json.productos[indice].activo = !json.productos[indice].activo;
    json.productos[indice].fechaModificacion = new Date().toISOString();

    _escribirDatos(json);
    return json.productos[indice];
}

module.exports = { getAll, getById, getBySku, create, update, toggleActivo };