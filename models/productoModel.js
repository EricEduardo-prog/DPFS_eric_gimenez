'use strict';

const path = require('path');
const BaseModel = require('./BaseModel');

class ProductoModel extends BaseModel {
    static DATA_PATH = path.join(__dirname, '..', 'data', 'productos.json');
    static COLECCION = 'productos';
    static PREFIJO_ID = 'prod_';
    static PADDING_ID = 3;

    static getAll({ soloActivos = false, categoriaId = null } = {}) {
        const datos = this._leerDatos(this.DATA_PATH, this.COLECCION);
        let productos = datos[this.COLECCION];
        if (soloActivos) productos = productos.filter(p => p.activo === true);
        if (categoriaId) productos = productos.filter(p => p.categoriaId === categoriaId);
        return productos;
    }

    static getById(id) {
        const datos = this._leerDatos(this.DATA_PATH, this.COLECCION);
        return datos[this.COLECCION].find(p => p.id === id) || null;
    }

    static getBySku(sku) {
        const datos = this._leerDatos(this.DATA_PATH, this.COLECCION);
        return datos[this.COLECCION].find(p => p.sku === sku.toUpperCase()) || null;
    }

    static create(data) {
        const datos = this._leerDatos(this.DATA_PATH, this.COLECCION);
        const productos = datos[this.COLECCION];
        const campos = this._normalizar(data);

        if (!campos.sku) throw new Error('El SKU es obligatorio.');
        if (productos.some(p => p.sku === campos.sku)) {
            throw new Error(`Ya existe un producto con el SKU "${campos.sku}".`);
        }

        const ahora = new Date().toISOString();
        const nuevoProducto = {
            id: this._generarId(productos, this.PREFIJO_ID, this.PADDING_ID),
            ...campos,
            rating: { valor: 0, cantidad: 0 },
            fechaCreacion: ahora,
            fechaModificacion: ahora,
        };

        productos.push(nuevoProducto);
        this._escribirDatos(this.DATA_PATH, datos);
        return nuevoProducto;
    }

    static update(id, data) {
        const datos = this._leerDatos(this.DATA_PATH, this.COLECCION);
        const indice = datos[this.COLECCION].findIndex(p => p.id === id);
        if (indice === -1) throw new Error(`Producto con id "${id}" no encontrado.`);

        const actual = datos[this.COLECCION][indice];
        const campos = this._normalizar(data);
        const nuevoSku = campos.sku || actual.sku;

        if (nuevoSku !== actual.sku && datos[this.COLECCION].some(p => p.sku === nuevoSku && p.id !== id)) {
            throw new Error(`Ya existe otro producto con el SKU "${nuevoSku}".`);
        }

        const actualizado = {
            ...actual,
            ...campos,
            id: actual.id,
            sku: nuevoSku,
            rating: actual.rating,
            fechaCreacion: actual.fechaCreacion,
            fechaModificacion: new Date().toISOString(),
        };

        datos[this.COLECCION][indice] = actualizado;
        this._escribirDatos(this.DATA_PATH, datos);
        return actualizado;
    }

    static toggleActivo(id) {
        const datos = this._leerDatos(this.DATA_PATH, this.COLECCION);
        const indice = datos[this.COLECCION].findIndex(p => p.id === id);
        if (indice === -1) throw new Error(`Producto con id "${id}" no encontrado.`);
        datos[this.COLECCION][indice].activo = !datos[this.COLECCION][indice].activo;
        datos[this.COLECCION][indice].fechaModificacion = new Date().toISOString();
        this._escribirDatos(this.DATA_PATH, datos);
        return datos[this.COLECCION][indice];
    }

    // Normalización específica de productos
    static _normalizar(data) {
        const normalizado = {};

        if (data.nombre !== undefined) normalizado.nombre = String(data.nombre).trim();
        if (data.sku !== undefined) normalizado.sku = String(data.sku).trim();
        const categoriaId = data.categoriaId || data.categoria;
        if (categoriaId !== undefined) normalizado.categoriaId = String(categoriaId).trim();
        if (data.descripcion !== undefined) normalizado.descripcion = String(data.descripcion).trim();
        if (data.imagen !== undefined) normalizado.imagen = String(data.imagen).trim();
        if (data.precio !== undefined) normalizado.precio = Number(data.precio);
        if (data.precioOriginal !== undefined) normalizado.precioOriginal = Number(data.precioOriginal) || 0;

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

        const instalacion = this._normalizarInstalacion(data);
        if (instalacion) normalizado.instalacion = instalacion;

        if (data.activo !== undefined) {
            normalizado.activo = data.activo === 'true' || data.activo === true;
        }
        return normalizado;
    }

    static _normalizarInstalacion(data) {
        const disponible = data.instalacion?.disponible === 'true' || data.instalacion?.disponible === true ||
            data.instalacionDisponible === 'true' || data.instalacionDisponible === true;
        if (!disponible) return null;
        const servicioId = data.instalacion?.servicioId || data.instalacionServicioId || null;
        return { disponible: true, servicioId };
    }
}

module.exports = ProductoModel;