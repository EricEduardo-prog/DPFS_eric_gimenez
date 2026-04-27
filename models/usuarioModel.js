'use strict';

const path = require('path');
const BaseModel = require('./BaseModel');

class UsuarioModel extends BaseModel {
    static DATA_PATH = path.join(__dirname, '..', 'data', 'usuarios.json');
    static COLECCION = 'usuarios';
    static PREFIJO_ID = 'usr_';
    static PADDING_ID = 3;

    static getAll({ soloActivos = false } = {}) {
        const datos = this._leerDatos(this.DATA_PATH, this.COLECCION);
        let usuarios = datos[this.COLECCION];
        if (soloActivos) usuarios = usuarios.filter(u => u.activo === true);
        return this._sanitizar(usuarios, ['passwordHash']);
    }

    static getById(id) {
        const datos = this._leerDatos(this.DATA_PATH, this.COLECCION);
        const usuario = datos[this.COLECCION].find(u => u.id === id) || null;
        return this._sanitizar(usuario, ['passwordHash']);
    }

    static getByIdWithHash(id) {
        const datos = this._leerDatos(this.DATA_PATH, this.COLECCION);
        return datos[this.COLECCION].find(u => u.id === id) || null;
    }

    static getByEmail(email) {
        const datos = this._leerDatos(this.DATA_PATH, this.COLECCION);
        const usuario = datos[this.COLECCION].find(u => u.email === email.toLowerCase().trim()) || null;
        return this._sanitizar(usuario, ['passwordHash']);
    }

    static getByEmailConHash(email) {
        const datos = this._leerDatos(this.DATA_PATH, this.COLECCION);
        return datos[this.COLECCION].find(u => u.email === email.toLowerCase().trim()) || null;
    }

    static create(data) {
        const datos = this._leerDatos(this.DATA_PATH, this.COLECCION);
        const usuarios = datos[this.COLECCION];
        const email = String(data.email || '').toLowerCase().trim();

        if (usuarios.some(u => u.email === email)) {
            throw new Error(`Ya existe una cuenta con el email "${email}".`);
        }

        const ahora = new Date().toISOString();
        const nuevoUsuario = {
            id: this._generarId(usuarios, this.PREFIJO_ID, this.PADDING_ID),
            nombre: String(data.nombre || '').trim(),
            email,
            passwordHash: data.passwordHash, // ya debe venir hasheado
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

        usuarios.push(nuevoUsuario);
        this._escribirDatos(this.DATA_PATH, datos);
        return this._sanitizar(nuevoUsuario, ['passwordHash']);
    }

    static update(id, data) {
        const datos = this._leerDatos(this.DATA_PATH, this.COLECCION);
        const indice = datos[this.COLECCION].findIndex(u => u.id === id);
        if (indice === -1) throw new Error(`Usuario con id "${id}" no encontrado.`);

        const actual = datos[this.COLECCION][indice];
        const actualizado = {
            ...actual,
            nombre: data.nombre !== undefined ? String(data.nombre).trim() : actual.nombre,
            telefono: data.telefono !== undefined ? String(data.telefono).trim() : actual.telefono,
            direccion: data.direccion
                ? {
                    ...actual.direccion,
                    calle: String(data.direccion.calle || actual.direccion.calle).trim(),
                    numero: String(data.direccion.numero || actual.direccion.numero).trim(),
                    piso: String(data.direccion.piso !== undefined ? data.direccion.piso : actual.direccion.piso).trim(),
                    depto: String(data.direccion.depto !== undefined ? data.direccion.depto : actual.direccion.depto).trim(),
                    ciudad: String(data.direccion.ciudad || actual.direccion.ciudad).trim(),
                    provincia: String(data.direccion.provincia || actual.direccion.provincia).trim(),
                    codigoPostal: String(data.direccion.codigoPostal || actual.direccion.codigoPostal).trim(),
                }
                : actual.direccion,
            activo: data.activo !== undefined ? data.activo : actual.activo,
            passwordHash: data.passwordHash !== undefined ? data.passwordHash : actual.passwordHash,
            fechaModificacion: new Date().toISOString(),
        };

        datos[this.COLECCION][indice] = actualizado;
        this._escribirDatos(this.DATA_PATH, datos);
        return this._sanitizar(actualizado, ['passwordHash']);
    }

    static toggleActivo(id) {
        const datos = this._leerDatos(this.DATA_PATH, this.COLECCION);
        const indice = datos[this.COLECCION].findIndex(u => u.id === id);
        if (indice === -1) throw new Error(`Usuario con id "${id}" no encontrado.`);
        datos[this.COLECCION][indice].activo = !datos[this.COLECCION][indice].activo;
        datos[this.COLECCION][indice].fechaModificacion = new Date().toISOString();
        this._escribirDatos(this.DATA_PATH, datos);
        return this._sanitizar(datos[this.COLECCION][indice], ['passwordHash']);
    }
}

module.exports = UsuarioModel;