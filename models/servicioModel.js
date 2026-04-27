'use strict';

const path = require('path');
const BaseModel = require('./BaseModel');

class ServicioModel extends BaseModel {
    static DATA_PATH = path.join(__dirname, '..', 'data', 'servicios.json');
    static COLECCION = 'servicios';
    static PREFIJO_ID = 'serv_';
    static PADDING_ID = 3;

    static getAll({ soloActivos = false, destacados = false } = {}) {
        const datos = this._leerDatos(this.DATA_PATH, this.COLECCION);
        let servicios = datos[this.COLECCION];
        if (soloActivos) servicios = servicios.filter(s => s.activo === true);
        if (destacados) servicios = servicios.filter(s => s.destacado === true);
        return servicios.sort((a, b) => a.nombre.localeCompare(b.nombre));
    }

    static getById(id) {
        const datos = this._leerDatos(this.DATA_PATH, this.COLECCION);
        return datos[this.COLECCION].find(s => s.id === id) || null;
    }

    static getBySlug(slug) {
        const datos = this._leerDatos(this.DATA_PATH, this.COLECCION);
        return datos[this.COLECCION].find(s => s.slug === slug) || null;
    }

    static getByNombre(nombre) {
        const datos = this._leerDatos(this.DATA_PATH, this.COLECCION);
        return datos[this.COLECCION].find(s => s.nombre === nombre) || null;
    }

    static create(data) {
        const datos = this._leerDatos(this.DATA_PATH, this.COLECCION);
        const servicios = datos[this.COLECCION];

        // Validar nombre único
        if (servicios.some(s => s.nombre === data.nombre.trim())) {
            throw new Error(`Ya existe un servicio con el nombre "${data.nombre}".`);
        }

        const slug = this._generarSlug(data.nombre);
        if (servicios.some(s => s.slug === slug)) {
            throw new Error(`Ya existe un servicio con el slug "${slug}".`);
        }

        const ahora = new Date().toISOString();
        const nuevoServicio = {
            id: this._generarId(servicios, this.PREFIJO_ID, this.PADDING_ID),
            nombre: String(data.nombre).trim(),
            slug,
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
            precioBase: parseFloat(data.precioBase),
            precioPorHora: data.precioPorHora ? parseFloat(data.precioPorHora) : null,
            activo: true,
            fechaCreacion: ahora,
            fechaModificacion: ahora,
        };

        servicios.push(nuevoServicio);
        this._escribirDatos(this.DATA_PATH, datos);
        return this._sanitizar(nuevoServicio);
    }

    static update(id, data) {
        const datos = this._leerDatos(this.DATA_PATH, this.COLECCION);
        const indice = datos[this.COLECCION].findIndex(s => s.id === id);
        if (indice === -1) throw new Error(`Servicio con id "${id}" no encontrado.`);

        const actual = datos[this.COLECCION][indice];
        const nuevoNombre = data.nombre ? String(data.nombre).trim() : actual.nombre;
        const nuevoSlug = data.slug || this._generarSlug(nuevoNombre);

        // Validaciones de unicidad
        if (nuevoNombre !== actual.nombre && datos[this.COLECCION].some(s => s.nombre === nuevoNombre && s.id !== id)) {
            throw new Error(`Ya existe otro servicio con el nombre "${nuevoNombre}".`);
        }
        if (nuevoSlug !== actual.slug && datos[this.COLECCION].some(s => s.slug === nuevoSlug && s.id !== id)) {
            throw new Error(`Ya existe otro servicio con el slug "${nuevoSlug}".`);
        }

        const actualizado = {
            ...actual,
            nombre: nuevoNombre,
            slug: nuevoSlug,
            descripcion: data.descripcion !== undefined ? String(data.descripcion).trim() : actual.descripcion,
            nivelesExperiencia: data.nivelesExperiencia || actual.nivelesExperiencia,
            certificacionRequerida: data.certificacionRequerida !== undefined
                ? (data.certificacionRequerida === 'true' || data.certificacionRequerida === true)
                : actual.certificacionRequerida,
            destacado: data.destacado !== undefined
                ? (data.destacado === 'true' || data.destacado === true)
                : actual.destacado,
            activo: data.activo !== undefined
                ? (data.activo === 'true' || data.activo === true)
                : actual.activo,
            precioBase: data.precioBase !== undefined ? parseFloat(data.precioBase) : actual.precioBase,
            precioPorHora: data.precioPorHora !== undefined ? parseFloat(data.precioPorHora) || null : actual.precioPorHora,
            fechaModificacion: new Date().toISOString(),
        };

        datos[this.COLECCION][indice] = actualizado;
        this._escribirDatos(this.DATA_PATH, datos);
        return this._sanitizar(actualizado);
    }

    static toggleActivo(id) {
        const datos = this._leerDatos(this.DATA_PATH, this.COLECCION);
        const indice = datos[this.COLECCION].findIndex(s => s.id === id);
        if (indice === -1) throw new Error(`Servicio con id "${id}" no encontrado.`);
        datos[this.COLECCION][indice].activo = !datos[this.COLECCION][indice].activo;
        datos[this.COLECCION][indice].fechaModificacion = new Date().toISOString();
        this._escribirDatos(this.DATA_PATH, datos);
        return this._sanitizar(datos[this.COLECCION][indice]);
    }

    static toggleDestacado(id) {
        const datos = this._leerDatos(this.DATA_PATH, this.COLECCION);
        const indice = datos[this.COLECCION].findIndex(s => s.id === id);
        if (indice === -1) throw new Error(`Servicio con id "${id}" no encontrado.`);
        datos[this.COLECCION][indice].destacado = !datos[this.COLECCION][indice].destacado;
        datos[this.COLECCION][indice].fechaModificacion = new Date().toISOString();
        this._escribirDatos(this.DATA_PATH, datos);
        return this._sanitizar(datos[this.COLECCION][indice]);
    }

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

module.exports = ServicioModel;