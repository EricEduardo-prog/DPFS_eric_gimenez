'use strict';

const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', 'data', 'categorias.json');

// ──────────────── HELPERS CORREGIDOS ────────────────

function _leerArchivoCompleto() {
    try {
        const raw = fs.readFileSync(DATA_PATH, 'utf8');
        return JSON.parse(raw);
    } catch (err) {
        if (err.code === 'ENOENT') {
            const estructuraBase = {
                _meta: { version: "1.0.0", ultimaActualizacion: new Date().toISOString() },
                categorias: []
            };
            fs.writeFileSync(DATA_PATH, JSON.stringify(estructuraBase, null, 2), 'utf8');
            return estructuraBase;
        }
        throw err;
    }
}

function _escribirArchivoCompleto(jsonCompleto) {
    jsonCompleto._meta.ultimaActualizacion = new Date().toISOString();
    fs.writeFileSync(DATA_PATH, JSON.stringify(jsonCompleto, null, 2), 'utf8');
}

function _leerDatos() {
    return _leerArchivoCompleto().categorias;
}

function _generarId(categorias) {
    if (!categorias || categorias.length === 0) return 'cat_001';
    const nums = categorias
        .map(c => {
            const m = String(c.id).match(/^cat_(\d+)$/);
            return m ? parseInt(m[1], 10) : 0;
        })
        .filter(n => !isNaN(n));
    const siguiente = nums.length > 0 ? Math.max(...nums) + 1 : 1;
    return `cat_${String(siguiente).padStart(3, '0')}`;
}

function _generarSlug(nombre) {
    return nombre
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
}

// ──────────────── MÉTODOS PÚBLICOS ────────────────

function getAll({ soloActivas = false } = {}) {
    const categorias = _leerDatos();
    const resultado = soloActivas ? categorias.filter(c => c.activo) : categorias;
    return resultado.sort((a, b) => (a.orden || 0) - (b.orden || 0));
}

function getById(id) {
    const categorias = _leerDatos();
    return categorias.find(c => c.id === id) || null;
}

function create(data) {
    console.log('🔧 create() - Iniciando...');
    const jsonCompleto = _leerArchivoCompleto();
    const categorias = jsonCompleto.categorias;
    
    const slug = _generarSlug(data.nombre);
    console.log(`📌 Slug generado: ${slug}`);
    
    // Verificar slug único
    const slugExistente = categorias.find(c => c.slug === slug);
    if (slugExistente) {
        throw new Error(`Ya existe una categoría con el slug "${slug}".`);
    }
    
    const ahora = new Date().toISOString();
    const nuevaCategoria = {
        id: _generarId(categorias),
        slug: slug,
        nombre: String(data.nombre).trim(),
        descripcion: data.descripcion ? String(data.descripcion).trim() : '',
        icono: data.icono ? String(data.icono).trim() : '',
        activo: data.activo === 'true' || data.activo === true,
        orden: data.orden ? Number(data.orden) : categorias.length + 1,
        fechaCreacion: ahora,
        fechaModificacion: ahora,
        cantidadProductos: 0
    };
    
    console.log('✅ Nueva categoría:', nuevaCategoria);
    
    jsonCompleto.categorias.push(nuevaCategoria);
    _escribirArchivoCompleto(jsonCompleto);
    
    return nuevaCategoria;
}

function update(id, data) {
    const jsonCompleto = _leerArchivoCompleto();
    const indice = jsonCompleto.categorias.findIndex(c => c.id === id);
    
    if (indice === -1) {
        throw new Error(`No se encontró la categoría con id "${id}".`);
    }
    
    const actual = jsonCompleto.categorias[indice];
    const nuevoSlug = _generarSlug(data.nombre || actual.nombre);
    
    // Verificar colisión
    const colision = jsonCompleto.categorias.find(c => c.slug === nuevoSlug && c.id !== id);
    if (colision) {
        throw new Error(`Ya existe otra categoría con el slug "${nuevoSlug}".`);
    }
    
    jsonCompleto.categorias[indice] = {
        ...actual,
        slug: nuevoSlug,
        nombre: data.nombre ? String(data.nombre).trim() : actual.nombre,
        descripcion: data.descripcion !== undefined ? String(data.descripcion).trim() : actual.descripcion,
        icono: data.icono !== undefined ? String(data.icono).trim() : actual.icono,
        activo: data.activo === 'true' || data.activo === true,
        orden: data.orden ? Number(data.orden) : actual.orden,
        fechaModificacion: new Date().toISOString()
    };
    
    _escribirArchivoCompleto(jsonCompleto);
    return jsonCompleto.categorias[indice];
}

function toggleActivo(id) {
    const jsonCompleto = _leerArchivoCompleto();
    const indice = jsonCompleto.categorias.findIndex(c => c.id === id);
    
    if (indice === -1) {
        throw new Error(`No se encontró la categoría con id "${id}".`);
    }
    
    jsonCompleto.categorias[indice].activo = !jsonCompleto.categorias[indice].activo;
    jsonCompleto.categorias[indice].fechaModificacion = new Date().toISOString();
    
    _escribirArchivoCompleto(jsonCompleto);
    return jsonCompleto.categorias[indice];
}

function setCantidadProductos(id, cantidad) {
    const jsonCompleto = _leerArchivoCompleto();
    const indice = jsonCompleto.categorias.findIndex(c => c.id === id);

    if (indice === -1) {
        throw new Error(`No se encontró la categoría con id "${id}".`);
    }

    jsonCompleto.categorias[indice].cantidadProductos = Number(cantidad) || 0;
    jsonCompleto.categorias[indice].fechaModificacion = new Date().toISOString();

    _escribirArchivoCompleto(jsonCompleto);
    return jsonCompleto.categorias[indice];
}

module.exports = {
    getAll,
    getById,
    create,
    update,
    toggleActivo,
    setCantidadProductos
};