'use strict';

const path = require('path');
const BaseModel = require('./BaseModel');

class CategoriaModel extends BaseModel {
    static DATA_PATH = path.join(__dirname, '..', 'data', 'categorias.json');
    static COLECCION = 'categorias';
    static PREFIJO_ID = 'cat_';
    static PADDING_ID = 3;

    // Obtener todas las categorías (con opción de solo activas)
    static getAll({ soloActivas = false } = {}) {
        const datos = this._leerDatos(this.DATA_PATH, this.COLECCION);
        let categorias = datos[this.COLECCION];
        if (soloActivas) {
            categorias = categorias.filter(c => c.activo === true);
        }
        // Ordenar por orden (ascendente)
        return categorias.sort((a, b) => (a.orden || 0) - (b.orden || 0));
    }

    static getById(id) {
        const datos = this._leerDatos(this.DATA_PATH, this.COLECCION);
        return datos[this.COLECCION].find(c => c.id === id) || null;
    }

    static create(data) {
        const datos = this._leerDatos(this.DATA_PATH, this.COLECCION);
        const categorias = datos[this.COLECCION];

        // Generar slug
        const slug = this._generarSlug(data.nombre);
        if (categorias.some(c => c.slug === slug)) {
            throw new Error(`Ya existe una categoría con el slug "${slug}".`);
        }

        const ahora = new Date().toISOString();
        const nuevaCategoria = {
            id: this._generarId(categorias, this.PREFIJO_ID, this.PADDING_ID),
            slug,
            nombre: String(data.nombre).trim(),
            descripcion: data.descripcion ? String(data.descripcion).trim() : '',
            icono: data.icono ? String(data.icono).trim() : '',
            activo: data.activo === 'true' || data.activo === true,
            orden: data.orden ? Number(data.orden) : categorias.length + 1,
            fechaCreacion: ahora,
            fechaModificacion: ahora,
            cantidadProductos: 0,
        };

        categorias.push(nuevaCategoria);
        this._escribirDatos(this.DATA_PATH, datos);
        return nuevaCategoria;
    }

    static update(id, data) {
        const datos = this._leerDatos(this.DATA_PATH, this.COLECCION);
        const indice = datos[this.COLECCION].findIndex(c => c.id === id);
        if (indice === -1) throw new Error(`Categoría con id "${id}" no encontrada.`);

        const actual = datos[this.COLECCION][indice];
        const nuevoSlug = this._generarSlug(data.nombre || actual.nombre);
        // Verificar colisión de slug
        if (nuevoSlug !== actual.slug && datos[this.COLECCION].some(c => c.slug === nuevoSlug && c.id !== id)) {
            throw new Error(`Ya existe otra categoría con el slug "${nuevoSlug}".`);
        }

        const actualizada = {
            ...actual,
            slug: nuevoSlug,
            nombre: data.nombre ? String(data.nombre).trim() : actual.nombre,
            descripcion: data.descripcion !== undefined ? String(data.descripcion).trim() : actual.descripcion,
            icono: data.icono !== undefined ? String(data.icono).trim() : actual.icono,
            activo: data.activo === 'true' || data.activo === true,
            orden: data.orden ? Number(data.orden) : actual.orden,
            fechaModificacion: new Date().toISOString(),
        };

        datos[this.COLECCION][indice] = actualizada;
        this._escribirDatos(this.DATA_PATH, datos);
        return actualizada;
    }

    static toggleActivo(id) {
        const datos = this._leerDatos(this.DATA_PATH, this.COLECCION);
        const indice = datos[this.COLECCION].findIndex(c => c.id === id);
        if (indice === -1) throw new Error(`Categoría con id "${id}" no encontrada.`);

        datos[this.COLECCION][indice].activo = !datos[this.COLECCION][indice].activo;
        datos[this.COLECCION][indice].fechaModificacion = new Date().toISOString();
        this._escribirDatos(this.DATA_PATH, datos);
        return datos[this.COLECCION][indice];
    }

    static setCantidadProductos(id, cantidad) {
        const datos = this._leerDatos(this.DATA_PATH, this.COLECCION);
        const indice = datos[this.COLECCION].findIndex(c => c.id === id);
        if (indice === -1) throw new Error(`Categoría con id "${id}" no encontrada.`);

        datos[this.COLECCION][indice].cantidadProductos = Number(cantidad) || 0;
        datos[this.COLECCION][indice].fechaModificacion = new Date().toISOString();
        this._escribirDatos(this.DATA_PATH, datos);
        return datos[this.COLECCION][indice];
    }

    // Helper privado
    static _generarSlug(nombre) {
        return nombre
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-');
    }
}

module.exports = CategoriaModel;