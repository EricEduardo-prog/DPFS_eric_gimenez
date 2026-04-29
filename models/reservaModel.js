'use strict';

const path = require('path');
const BaseModel = require('./BaseModel');

class ReservaModel extends BaseModel {
    static DATA_PATH = path.join(__dirname, '..', 'data', 'reservas.json');
    static COLECCION = 'reservas';
    static PREFIJO_ID = 'res_';
    static PADDING_ID = 3;

    static getByUsuarioId(usuarioId) {
        const datos = this._leerDatos(this.DATA_PATH, this.COLECCION);
        return datos[this.COLECCION].find(r => r.usuarioId === usuarioId) || null;
    }

    static getBySessionId(sessionId) {
        const datos = this._leerDatos(this.DATA_PATH, this.COLECCION);
        return datos[this.COLECCION].find(r => r.sessionId === sessionId && !r.usuarioId) || null;
    }

    static create(usuarioId, sessionId, items = []) {
        const datos = this._leerDatos(this.DATA_PATH, this.COLECCION);
        const reservas = datos[this.COLECCION];
        const nueva = {
            id: this._generarId(reservas, this.PREFIJO_ID, this.PADDING_ID),
            usuarioId: usuarioId || null,
            sessionId: sessionId || null,
            items: items,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        reservas.push(nueva);
        this._escribirDatos(this.DATA_PATH, datos);
        return nueva;
    }

    static getOrCreateByUsuarioId(usuarioId) {
        let reserva = this.getByUsuarioId(usuarioId);
        if (!reserva) {
            reserva = this.create(usuarioId, null, []);
        }
        return reserva;
    }

    static getOrCreateBySessionId(sessionId) {
        let reserva = this.getBySessionId(sessionId);
        if (!reserva && sessionId && sessionId.startsWith('user_')) {
            const usuarioId = sessionId.replace('user_', '');
            reserva = this.getByUsuarioId(usuarioId);
        }
        if (!reserva) {
            const usuarioId = sessionId?.startsWith('user_') ? sessionId.replace('user_', '') : null;
            reserva = this.create(usuarioId, !usuarioId ? sessionId : null, []);
        }
        return reserva;
    }

    static addItem(reservaId, productoId, servicioId, itemData) {
        const datos = this._leerDatos(this.DATA_PATH, this.COLECCION);
        const indice = datos[this.COLECCION].findIndex(r => r.id === reservaId);
        if (indice === -1) throw new Error(`Reserva con id "${reservaId}" no encontrada.`);

        const reserva = datos[this.COLECCION][indice];
        const tipo = itemData.tipo || (productoId && servicioId ? 'combo' : productoId ? 'producto' : 'servicio');

        // Buscar ítem idéntico (mismo combo o mismo producto o mismo servicio)
        const itemExistente = reserva.items.find(item =>
            item.tipo === tipo &&
            item.productoId === productoId &&
            item.servicioId === servicioId
        );

        if (itemExistente) {
            itemExistente.cantidad += (itemData.cantidad || 1);
            // Actualizar profesional/fecha si es necesario
            if (itemData.profesionalId) itemExistente.profesionalId = itemData.profesionalId;
            if (itemData.fechaInstalacion) itemExistente.fechaInstalacion = itemData.fechaInstalacion;
            if (itemData.horarioInstalacion) itemExistente.horarioInstalacion = itemData.horarioInstalacion;
        } else {
            const nuevoItem = {
                id: this._generarItemId(),
                tipo: tipo,                     // 'producto', 'servicio', 'combo'
                productoId: productoId || null,
                servicioId: servicioId || null,
                cantidad: itemData.cantidad || 1,
                precioUnitario: itemData.precioUnitario,   // Precio total del combo (producto + servicio) o individual
                nombre: itemData.nombre,
                profesionalId: itemData.profesionalId || null,
                fechaInstalacion: itemData.fechaInstalacion || null,
                horarioInstalacion: itemData.horarioInstalacion || null
            };
            reserva.items.push(nuevoItem);
        }
        reserva.updatedAt = new Date().toISOString();
        this._escribirDatos(this.DATA_PATH, datos);
        return itemExistente || reserva.items[reserva.items.length - 1];
    }

    static updateItem(reservaId, itemId, itemData) {
        const datos = this._leerDatos(this.DATA_PATH, this.COLECCION);
        const indiceReserva = datos[this.COLECCION].findIndex(r => r.id === reservaId);
        if (indiceReserva === -1) throw new Error(`Reserva con id "${reservaId}" no encontrada.`);

        const reserva = datos[this.COLECCION][indiceReserva];
        const indiceItem = reserva.items.findIndex(i => i.id === itemId);
        if (indiceItem === -1) throw new Error(`Item con id "${itemId}" no encontrado.`);

        if (itemData.cantidad <= 0) {
            reserva.items.splice(indiceItem, 1);
        } else {
            reserva.items[indiceItem].cantidad = itemData.cantidad;
        }
        reserva.updatedAt = new Date().toISOString();
        this._escribirDatos(this.DATA_PATH, datos);
        return true;
    }

    static removeItem(reservaId, itemId) {
        const datos = this._leerDatos(this.DATA_PATH, this.COLECCION);
        const indiceReserva = datos[this.COLECCION].findIndex(r => r.id === reservaId);
        if (indiceReserva === -1) throw new Error(`Reserva con id "${reservaId}" no encontrada.`);

        const reserva = datos[this.COLECCION][indiceReserva];
        const indiceItem = reserva.items.findIndex(i => i.id === itemId);
        if (indiceItem === -1) throw new Error(`Item con id "${itemId}" no encontrado.`);

        reserva.items.splice(indiceItem, 1);
        reserva.updatedAt = new Date().toISOString();
        this._escribirDatos(this.DATA_PATH, datos);
        return true;
    }

    static clear(reservaId) {
        const datos = this._leerDatos(this.DATA_PATH, this.COLECCION);
        const indiceReserva = datos[this.COLECCION].findIndex(r => r.id === reservaId);
        if (indiceReserva === -1) throw new Error(`Reserva con id "${reservaId}" no encontrada.`);

        datos[this.COLECCION][indiceReserva].items = [];
        datos[this.COLECCION][indiceReserva].updatedAt = new Date().toISOString();
        this._escribirDatos(this.DATA_PATH, datos);
        return true;
    }

    static mergeReservas(reservaGuestId, reservaUserId) {
        const datos = this._leerDatos(this.DATA_PATH, this.COLECCION);
        const indiceGuest = datos[this.COLECCION].findIndex(r => r.id === reservaGuestId);
        const indiceUser = datos[this.COLECCION].findIndex(r => r.id === reservaUserId);
        if (indiceGuest === -1) throw new Error(`Reserva guest con id "${reservaGuestId}" no encontrada.`);
        if (indiceUser === -1) throw new Error(`Reserva user con id "${reservaUserId}" no encontrada.`);

        const reservaGuest = datos[this.COLECCION][indiceGuest];
        const reservaUser = datos[this.COLECCION][indiceUser];

        for (const itemGuest of reservaGuest.items) {
            const itemExistente = reservaUser.items.find(i =>
                i.productoId === itemGuest.productoId && i.servicioId === itemGuest.servicioId
            );
            if (itemExistente) {
                itemExistente.cantidad += itemGuest.cantidad;
            } else {
                reservaUser.items.push(itemGuest);
            }
        }
        reservaUser.updatedAt = new Date().toISOString();
        datos[this.COLECCION].splice(indiceGuest, 1);
        this._escribirDatos(this.DATA_PATH, datos);
        return reservaUser;
    }

    // Helper para generar ID de ítem
    static _generarItemId() {
        return `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    }
}

module.exports = ReservaModel;