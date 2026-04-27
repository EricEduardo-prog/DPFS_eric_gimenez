// models/solicitudServicioModel.js
'use strict';

const path = require('path');
const BaseModel = require('./BaseModel');

class SolicitudServicioModel extends BaseModel {
    static DATA_PATH = path.join(__dirname, '..', 'data', 'solicitudes_servicios.json');
    static COLECCION = 'solicitudes';
    static PREFIJO_ID = 'sol_';
    static PADDING_ID = 3;

    /**
     * Obtiene todas las solicitudes, opcionalmente filtradas por estado.
     * @param {Object} opciones
     * @param {string} [opciones.estado] - 'pendiente', 'aprobado', 'rechazado'
     * @returns {Array}
     */
    static getAll({ estado = null } = {}) {
        const datos = this._leerDatos(this.DATA_PATH, this.COLECCION);
        let solicitudes = datos[this.COLECCION];
        if (estado) {
            solicitudes = solicitudes.filter(s => s.estado === estado);
        }
        // Ordenar por fechaSolicitud descendente (más recientes primero)
        return solicitudes.sort((a, b) => new Date(b.fechaSolicitud) - new Date(a.fechaSolicitud));
    }

    /**
     * Obtiene una solicitud por ID.
     * @param {string} id
     * @returns {Object|null}
     */
    static getById(id) {
        const datos = this._leerDatos(this.DATA_PATH, this.COLECCION);
        return datos[this.COLECCION].find(s => s.id === id) || null;
    }

    /**
     * Obtiene todas las solicitudes de un profesional específico.
     * @param {string} profesionalId
     * @returns {Array}
     */
    static getByProfesionalId(profesionalId) {
        const datos = this._leerDatos(this.DATA_PATH, this.COLECCION);
        return datos[this.COLECCION].filter(s => s.profesionalId === profesionalId);
    }

    /**
     * Crea una nueva solicitud de servicio.
     * @param {Object} data
     * @param {string|null} data.profesionalId
     * @param {string} data.servicioSolicitado
     * @param {string} [data.descripcion]
     * @param {string} [data.estado] - 'pendiente' por defecto
     * @returns {Object}
     */
    static create(data) {
        const datos = this._leerDatos(this.DATA_PATH, this.COLECCION);
        const solicitudes = datos[this.COLECCION];
        const nueva = {
            id: this._generarId(solicitudes, this.PREFIJO_ID, this.PADDING_ID),
            profesionalId: data.profesionalId || null,
            servicioSolicitado: String(data.servicioSolicitado).trim(),
            descripcion: data.descripcion ? String(data.descripcion).trim() : '',
            estado: data.estado || 'pendiente',
            fechaSolicitud: new Date().toISOString(),
            fechaRespuesta: null,
            respuestaAdmin: null,
        };
        solicitudes.push(nueva);
        this._escribirDatos(this.DATA_PATH, datos);
        return nueva;
    }

    /**
     * Actualiza el estado de una solicitud.
     * @param {string} id
     * @param {string} estado - 'aprobado' o 'rechazado'
     * @param {string} respuestaAdmin
     * @returns {Object}
     */
    static actualizarEstado(id, estado, respuestaAdmin) {
        const datos = this._leerDatos(this.DATA_PATH, this.COLECCION);
        const indice = datos[this.COLECCION].findIndex(s => s.id === id);
        if (indice === -1) {
            throw new Error(`No se encontró la solicitud con id "${id}".`);
        }
        datos[this.COLECCION][indice].estado = estado;
        datos[this.COLECCION][indice].fechaRespuesta = new Date().toISOString();
        datos[this.COLECCION][indice].respuestaAdmin = respuestaAdmin;
        this._escribirDatos(this.DATA_PATH, datos);
        return datos[this.COLECCION][indice];
    }

    /**
     * Asigna el ID de un profesional a la primera solicitud pendiente que coincida con el servicio solicitado.
     * Se usa cuando un profesional se registra con un servicio personalizado y luego se crea el profesional.
     * @param {string} profesionalId
     * @param {string} servicioSolicitado
     * @returns {Object|null}
     */
    static actualizarProfesionalId(profesionalId, servicioSolicitado) {
        const datos = this._leerDatos(this.DATA_PATH, this.COLECCION);
        const indice = datos[this.COLECCION].findIndex(
            s => s.servicioSolicitado === servicioSolicitado && s.profesionalId === null
        );
        if (indice === -1) return null;
        datos[this.COLECCION][indice].profesionalId = profesionalId;
        this._escribirDatos(this.DATA_PATH, datos);
        return datos[this.COLECCION][indice];
    }
}

module.exports = SolicitudServicioModel;