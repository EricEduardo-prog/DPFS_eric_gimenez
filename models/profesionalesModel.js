'use strict';

const path = require('path');
const BaseModel = require('./BaseModel');

const DIAS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];
const TURNOS = ['manana', 'tarde'];

class ProfesionalesModel extends BaseModel {
    static DATA_PATH = path.join(__dirname, '..', 'data', 'profesionales.json');
    static COLECCION = 'profesionales';
    static PREFIJO_ID = 'prof_';
    static PADDING_ID = 3;

    // Opciones: soloActivos, profesion (filtro)
    static getAll({ soloActivos = false, profesion = null } = {}) {
        const datos = this._leerDatos(this.DATA_PATH, this.COLECCION);
        let profesionales = datos[this.COLECCION];
        if (soloActivos) profesionales = profesionales.filter(p => p.activo === true);
        if (profesion) profesionales = profesionales.filter(p => p.profesion === profesion);
        return profesionales;
    }

    static getById(id) {
        const datos = this._leerDatos(this.DATA_PATH, this.COLECCION);
        return datos[this.COLECCION].find(p => p.id === id) || null;
    }

    static getByEmail(email) {
        const datos = this._leerDatos(this.DATA_PATH, this.COLECCION);
        return datos[this.COLECCION].find(p => p.email === email.toLowerCase().trim()) || null;
    }

    static getByMatricula(matricula) {
        const datos = this._leerDatos(this.DATA_PATH, this.COLECCION);
        return datos[this.COLECCION].find(p => p.matricula === matricula.trim().toUpperCase()) || null;
    }

    static getDisponiblesEnTurno(dia, turno) {
        const datos = this._leerDatos(this.DATA_PATH, this.COLECCION);
        return datos[this.COLECCION].filter(p => p.activo && p.disponibilidad?.[dia]?.[turno] === true);
    }

    static getPendientes() {
        const datos = this._leerDatos(this.DATA_PATH, this.COLECCION);
        return datos[this.COLECCION].filter(p => p.estadoServicio === 'pendiente');
    }

    static getByEstadoServicio(estado) {
        const datos = this._leerDatos(this.DATA_PATH, this.COLECCION);
        return datos[this.COLECCION].filter(p => p.estadoServicio === estado);
    }

    static getByServicioId(servicioId) {
        const datos = this._leerDatos(this.DATA_PATH, this.COLECCION);
        return datos[this.COLECCION].filter(p => p.servicioId === servicioId && p.estadoServicio === 'aprobado' && p.activo === true);
    }

    static create(data) {
        const datos = this._leerDatos(this.DATA_PATH, this.COLECCION);
        const profesionales = datos[this.COLECCION];
        const email = String(data.email || '').toLowerCase().trim();
        const matricula = String(data.matricula || '').trim().toUpperCase();

        if (profesionales.some(p => p.email === email)) {
            throw new Error(`Ya existe un profesional con el email "${email}".`);
        }
        if (profesionales.some(p => p.matricula === matricula)) {
            throw new Error(`Ya existe un profesional con la matrícula "${matricula}".`);
        }

        const disponibilidad = data.disponibilidad || this._normalizarDisponibilidad(data);
        const ahora = new Date().toISOString();

        const nuevoProfesional = {
            id: this._generarId(profesionales, this.PREFIJO_ID, this.PADDING_ID),
            nombre: String(data.nombre || '').trim(),
            matricula,
            profesion: String(data.profesion || '').trim(),
            email,
            telefono: String(data.telefono || '').trim(),
            disponibilidad,
            servicioId: data.servicioId || null,
            servicioPersonalizado: data.servicioPersonalizado || null,
            estadoServicio: data.estadoServicio || 'pendiente',
            experienciaAnios: data.experienciaAnios ? Number(data.experienciaAnios) : 0,
            valoracion: { valor: 0, cantidad: 0 },
            trabajosCompletados: 0,
            activo: true,
            fechaAlta: ahora,
            fechaModificacion: ahora,
        };

        profesionales.push(nuevoProfesional);
        this._escribirDatos(this.DATA_PATH, datos);
        return nuevoProfesional;
    }

    static update(id, data) {
        const datos = this._leerDatos(this.DATA_PATH, this.COLECCION);
        const indice = datos[this.COLECCION].findIndex(p => p.id === id);
        if (indice === -1) throw new Error(`Profesional con id "${id}" no encontrado.`);

        const actual = datos[this.COLECCION][indice];
        const email = data.email ? String(data.email).toLowerCase().trim() : actual.email;
        const matricula = data.matricula ? String(data.matricula).trim().toUpperCase() : actual.matricula;

        if (email !== actual.email && datos[this.COLECCION].some(p => p.email === email && p.id !== id)) {
            throw new Error(`Ya existe otro profesional con el email "${email}".`);
        }
        if (matricula !== actual.matricula && datos[this.COLECCION].some(p => p.matricula === matricula && p.id !== id)) {
            throw new Error(`Ya existe otro profesional con la matrícula "${matricula}".`);
        }

        const disponibilidad = data.disponibilidad || actual.disponibilidad;
        const actualizado = {
            ...actual,
            nombre: data.nombre !== undefined ? String(data.nombre).trim() : actual.nombre,
            matricula,
            profesion: data.profesion !== undefined ? String(data.profesion).trim() : actual.profesion,
            email,
            telefono: data.telefono !== undefined ? String(data.telefono).trim() : actual.telefono,
            disponibilidad,
            servicioId: data.servicioId !== undefined ? data.servicioId : actual.servicioId,
            servicioPersonalizado: data.servicioPersonalizado !== undefined ? data.servicioPersonalizado : actual.servicioPersonalizado,
            estadoServicio: data.estadoServicio || actual.estadoServicio,
            experienciaAnios: data.experienciaAnios !== undefined ? Number(data.experienciaAnios) : actual.experienciaAnios,
            activo: data.activo === 'true' || data.activo === true,
            fechaModificacion: new Date().toISOString(),
        };

        datos[this.COLECCION][indice] = actualizado;
        this._escribirDatos(this.DATA_PATH, datos);
        return actualizado;
    }

    static toggleActivo(id) {
        const datos = this._leerDatos(this.DATA_PATH, this.COLECCION);
        const indice = datos[this.COLECCION].findIndex(p => p.id === id);
        if (indice === -1) throw new Error(`Profesional con id "${id}" no encontrado.`);
        datos[this.COLECCION][indice].activo = !datos[this.COLECCION][indice].activo;
        datos[this.COLECCION][indice].fechaModificacion = new Date().toISOString();
        this._escribirDatos(this.DATA_PATH, datos);
        return datos[this.COLECCION][indice];
    }

    static aprobarServicio(id, datosAprobacion) {
        const datos = this._leerDatos(this.DATA_PATH, this.COLECCION);
        const indice = datos[this.COLECCION].findIndex(p => p.id === id);
        if (indice === -1) throw new Error(`Profesional con id "${id}" no encontrado.`);
        datos[this.COLECCION][indice] = {
            ...datos[this.COLECCION][indice],
            estadoServicio: 'aprobado',
            certificacionVerificada: true,
            fechaValidacion: new Date().toISOString(),
            validadoPor: datosAprobacion.validadoPor,
            observacionAdmin: datosAprobacion.observacion || null,
            fechaModificacion: new Date().toISOString(),
        };
        this._escribirDatos(this.DATA_PATH, datos);
        return datos[this.COLECCION][indice];
    }

    static rechazarServicio(id, datosRechazo) {
        const datos = this._leerDatos(this.DATA_PATH, this.COLECCION);
        const indice = datos[this.COLECCION].findIndex(p => p.id === id);
        if (indice === -1) throw new Error(`Profesional con id "${id}" no encontrado.`);
        datos[this.COLECCION][indice] = {
            ...datos[this.COLECCION][indice],
            estadoServicio: 'rechazado',
            certificacionVerificada: false,
            fechaValidacion: new Date().toISOString(),
            validadoPor: datosRechazo.validadoPor,
            observacionAdmin: datosRechazo.observacion || null,
            fechaModificacion: new Date().toISOString(),
        };
        this._escribirDatos(this.DATA_PATH, datos);
        return datos[this.COLECCION][indice];
    }

    static _normalizarDisponibilidad(body) {
        const disp = {};
        for (const dia of DIAS) {
            disp[dia] = {};
            for (const turno of TURNOS) {
                const clave = `disponibilidad_${dia}_${turno}`;
                const valor = body[clave];
                disp[dia][turno] = valor === 'true' || valor === true || valor === 'on';
            }
        }
        return disp;
    }
}

module.exports = ProfesionalesModel;