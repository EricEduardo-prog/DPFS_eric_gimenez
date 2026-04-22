'use strict';

const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', 'data', 'reservas.json');

// ─────────────────────────────────────────────────────────────────────────────
// Helpers internos
// ─────────────────────────────────────────────────────────────────────────────

function _leerDatos() {
    try {
        const raw = fs.readFileSync(DATA_PATH, 'utf8');
        const json = JSON.parse(raw);
        if (!json.reservas) json.reservas = [];
        if (!json._meta) json._meta = { version: "1.0.0" };
        return json;
    } catch (err) {
        if (err.code === 'ENOENT') {
            const estructuraBase = {
                _meta: { version: "1.0.0", descripcion: "Reservas de productos y servicios", ultimaActualizacion: new Date().toISOString() },
                reservas: []
            };
            fs.writeFileSync(DATA_PATH, JSON.stringify(estructuraBase, null, 2), 'utf8');
            return estructuraBase;
        }
        throw err;
    }
}

function _escribirDatos(json) {
    json._meta.ultimaActualizacion = new Date().toISOString();
    fs.writeFileSync(DATA_PATH, JSON.stringify(json, null, 2), 'utf8');
}

function _generarId(reservas) {
    if (!reservas || reservas.length === 0) return 'res_001';
    const nums = reservas
        .map(r => {
            const match = String(r.id).match(/^res_(\d+)$/);
            return match ? parseInt(match[1], 10) : 0;
        })
        .filter(n => !isNaN(n) && n > 0);
    const maxNum = Math.max(...nums);
    const siguiente = maxNum + 1;
    return `res_${String(siguiente).padStart(3, '0')}`;
}

function _generarItemId() {
    return `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Operaciones públicas
// ─────────────────────────────────────────────────────────────────────────────

function getByUsuarioId(usuarioId) {
    const { reservas } = _leerDatos();
    return reservas.find(r => r.usuarioId === usuarioId) || null;
}

function getBySessionId(sessionId) {
    const { reservas } = _leerDatos();
    return reservas.find(r => r.sessionId === sessionId && !r.usuarioId) || null;
}

function create(usuarioId, sessionId, items = []) {
    console.log('🔧 MODEL.reserva.create - UsuarioId:', usuarioId, 'SessionId:', sessionId);

    const json = _leerDatos();
    const reservas = json.reservas;

    const nueva = {
        id: _generarId(reservas),
        usuarioId: usuarioId || null,
        sessionId: sessionId || null,
        items: items,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    json.reservas.push(nueva);
    _escribirDatos(json);

    return nueva;
}

function getOrCreateByUsuarioId(usuarioId) {
    // Buscar ´pr 
    let reserva = getByUsuarioId(usuarioId);
    if (!reserva) {
        console.log('🔧 Creando nueva reserva para usuarioId:', usuarioId);
        reserva = create(usuarioId, null, []);
    } else {
        console.log('🔧 Reserva existente encontrada:', reserva.id);
    }
    return reserva;
}

function getOrCreateBySessionId(sessionId) {
    // Buscar por sessionId exacto
    let reserva = getBySessionId(sessionId);

    // Si no existe y el sessionId empieza con 'user_', buscar por usuarioId
    if (!reserva && sessionId && sessionId.startsWith('user_')) {
        const usuarioId = sessionId.replace('user_', '');
        reserva = getByUsuarioId(usuarioId);
    }

    if (!reserva) {
        console.log('🔧 Creando nueva reserva para sessionId:', sessionId);
        const usuarioId = sessionId?.startsWith('user_') ? sessionId.replace('user_', '') : null;
        reserva = create(usuarioId, !usuarioId ? sessionId : null, []);
    } else {
        console.log('🔧 Reserva existente encontrada:', reserva.id);
    }
    return reserva;
}

function addItem(reservaId, productoId, servicioId, cantidad, precioUnitario, nombre) {
    console.log('🔧 MODEL.reserva.addItem - ReservaId:', reservaId);

    const json = _leerDatos();
    const indice = json.reservas.findIndex(r => r.id === reservaId);

    if (indice === -1) {
        throw new Error(`No se encontró la reserva con id "${reservaId}".`);
    }

    const reserva = json.reservas[indice];

    // ✅ BUSCAR si el producto ya existe en la reserva
    const itemExistente = reserva.items.find(item =>
        (productoId && item.productoId === productoId) ||
        (servicioId && item.servicioId === servicioId)
    );

    let itemActualizado;

    if (itemExistente) {
        // ✅ ACTUALIZAR cantidad del item existente
        itemExistente.cantidad += cantidad;
        reserva.updatedAt = new Date().toISOString();
        itemActualizado = itemExistente;
        console.log(`✅ Producto ya existente, nueva cantidad: ${itemExistente.cantidad}`);
    } else {
        // ✅ CREAR nuevo item
        const itemId = _generarItemId();
        const nuevoItem = {
            id: itemId,
            productoId: productoId || null,
            servicioId: servicioId || null,
            cantidad: cantidad,
            precioUnitario: precioUnitario,
            nombre: nombre
        };
        reserva.items.push(nuevoItem);
        reserva.updatedAt = new Date().toISOString();
        itemActualizado = nuevoItem;
        console.log(`✅ Nuevo producto agregado: ${nombre}`);
    }

    _escribirDatos(json);
    return itemActualizado;
}

function updateItem(reservaId, itemId, cantidad) {
    console.log('🔧 MODEL.reserva.updateItem - ReservaId:', reservaId, 'ItemId:', itemId);

    const json = _leerDatos();
    const indiceReserva = json.reservas.findIndex(r => r.id === reservaId);

    if (indiceReserva === -1) {
        throw new Error(`No se encontró la reserva con id "${reservaId}".`);
    }

    const reserva = json.reservas[indiceReserva];
    const indiceItem = reserva.items.findIndex(i => i.id === itemId);

    if (indiceItem === -1) {
        throw new Error(`No se encontró el item con id "${itemId}".`);
    }

    //  Si la cantidad es 0, eliminar el item
    if (cantidad <= 0) {
        reserva.items.splice(indiceItem, 1);
        console.log(`✅ Item ${itemId} eliminado (cantidad <= 0)`);
    } else {
        reserva.items[indiceItem].cantidad = cantidad;
        console.log(`✅ Item ${itemId} actualizado a cantidad: ${cantidad}`);
    }

    reserva.updatedAt = new Date().toISOString();

    _escribirDatos(json);
    return true;
}

function removeItem(reservaId, itemId) {
    console.log('🔧 MODEL.reserva.removeItem - ReservaId:', reservaId, 'ItemId:', itemId);

    const json = _leerDatos();
    const indiceReserva = json.reservas.findIndex(r => r.id === reservaId);

    if (indiceReserva === -1) {
        throw new Error(`No se encontró la reserva con id "${reservaId}".`);
    }

    const reserva = json.reservas[indiceReserva];
    const indiceItem = reserva.items.findIndex(i => i.id === itemId);

    if (indiceItem === -1) {
        throw new Error(`No se encontró el item con id "${itemId}".`);
    }

    reserva.items.splice(indiceItem, 1);
    reserva.updatedAt = new Date().toISOString();

    _escribirDatos(json);
    return true;
}

function clear(reservaId) {
    console.log('🔧 MODEL.reserva.clear - ReservaId:', reservaId);

    const json = _leerDatos();
    const indiceReserva = json.reservas.findIndex(r => r.id === reservaId);

    if (indiceReserva === -1) {
        throw new Error(`No se encontró la reserva con id "${reservaId}".`);
    }

    json.reservas[indiceReserva].items = [];
    json.reservas[indiceReserva].updatedAt = new Date().toISOString();

    _escribirDatos(json);
    return true;
}

function mergeReservas(reservaGuestId, reservaUserId) {
    console.log('🔧 MODEL.reserva.mergeReservas - Guest:', reservaGuestId, 'User:', reservaUserId);

    const json = _leerDatos();
    const indiceGuest = json.reservas.findIndex(r => r.id === reservaGuestId);
    const indiceUser = json.reservas.findIndex(r => r.id === reservaUserId);

    if (indiceGuest === -1) {
        throw new Error(`No se encontró la reserva guest con id "${reservaGuestId}".`);
    }

    if (indiceUser === -1) {
        throw new Error(`No se encontró la reserva user con id "${reservaUserId}".`);
    }

    const reservaGuest = json.reservas[indiceGuest];
    const reservaUser = json.reservas[indiceUser];

    // Fusionar items: si el producto ya existe en user, sumar cantidades
    for (const itemGuest of reservaGuest.items) {
        const itemExistente = reservaUser.items.find(i =>
            i.productoId === itemGuest.productoId &&
            i.servicioId === itemGuest.servicioId
        );

        if (itemExistente) {
            itemExistente.cantidad += itemGuest.cantidad;
        } else {
            reservaUser.items.push(itemGuest);
        }
    }

    reservaUser.updatedAt = new Date().toISOString();

    // Eliminar reserva guest
    json.reservas.splice(indiceGuest, 1);

    _escribirDatos(json);
    return reservaUser;
}

module.exports = {
    getByUsuarioId,
    getBySessionId,
    create,
    getOrCreateByUsuarioId,
    getOrCreateBySessionId,
    addItem,
    updateItem,
    removeItem,
    clear,
    mergeReservas
};