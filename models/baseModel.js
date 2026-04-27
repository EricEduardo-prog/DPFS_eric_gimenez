// models/BaseModel.js
'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Modelo base para persistencia en archivos JSON.
 * Centraliza operaciones comunes de lectura/escritura, generación de IDs y sanitización.
 *
 * Cada modelo hijo debe definir su propio DATA_PATH (ruta al JSON) y el nombre de la colección principal.
 * Ejemplo:
 *   const DATA_PATH = path.join(__dirname, '..', 'data', 'categorias.json');
 *   const COLECCION = 'categorias';
 *
 * Uso típico:
 *   const datos = BaseModel._leerDatos(DATA_PATH, COLECCION);
 *   const items = datos[COLECCION];
 *   const nuevoId = BaseModel._generarId(items, 'cat_', 3);
 */
class BaseModel {
  /**
   * Construye la ruta absoluta al archivo JSON.
   * @param {string} filePath - Ruta completa al archivo (ya debe incluir directorio y nombre)
   * @returns {string} La misma ruta (por compatibilidad, se puede usar directamente)
   */
  static _getDataPath(filePath) {
    return filePath;
  }

  /**
   * Lee y parsea un archivo JSON, creando una estructura base si no existe.
   * @param {string} filePath - Ruta completa al archivo JSON
   * @param {string} collectionName - Nombre de la propiedad principal que contiene el array (ej. 'categorias')
   * @returns {Object} Objeto con las propiedades _meta y la colección solicitada (siempre un array)
   */
  static _leerDatos(filePath, collectionName) {
    try {
      const raw = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(raw);
      // Asegurar que exista _meta y la colección
      if (!data._meta) {
        data._meta = { version: '1.0.0', ultimaActualizacion: new Date().toISOString() };
      }
      if (!data[collectionName]) {
        data[collectionName] = [];
      }
      return data;
    } catch (err) {
      if (err.code === 'ENOENT') {
        // Archivo no existe: crear estructura base
        const newData = {
          _meta: {
            version: '1.0.0',
            ultimaActualizacion: new Date().toISOString(),
          },
          [collectionName]: [],
        };
        // Escribir el archivo por primera vez
        this._escribirDatos(filePath, newData);
        return newData;
      }
      throw err;
    }
  }

  /**
   * Escribe un objeto JSON al archivo, actualizando automáticamente _meta.ultimaActualizacion.
   * @param {string} filePath - Ruta completa al archivo JSON
   * @param {Object} json - Objeto a guardar
   */
  static _escribirDatos(filePath, json) {
    if (json._meta) {
      json._meta.ultimaActualizacion = new Date().toISOString();
    } else {
      json._meta = { ultimaActualizacion: new Date().toISOString() };
    }
    fs.writeFileSync(filePath, JSON.stringify(json, null, 2), 'utf8');
  }

  /**
   * Genera un ID autoincremental para un array de elementos.
   * @param {Array} coleccion - Array de objetos existentes (debe contener objetos con propiedad `id`)
   * @param {string} prefijo - Prefijo del ID (ej. 'cat_', 'prod_')
   * @param {number} [padding=3] - Cantidad de dígitos para el número (con ceros a la izquierda)
   * @returns {string} Nuevo ID, ej. 'cat_001'
   */
  static _generarId(coleccion, prefijo, padding = 3) {
    if (!coleccion || coleccion.length === 0) {
      return `${prefijo}${'1'.padStart(padding, '0')}`;
    }
    const nums = coleccion
      .map(item => {
        const match = String(item.id).match(new RegExp(`^${prefijo}(\\d+)$`));
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(n => !isNaN(n) && n > 0);
    const maxNum = nums.length > 0 ? Math.max(...nums) : 0;
    const siguiente = maxNum + 1;
    return `${prefijo}${String(siguiente).padStart(padding, '0')}`;
  }

  /**
   * Elimina campos sensibles o internos de un objeto (o array de objetos).
   * @param {Object|Array} objeto - Objeto o lista de objetos a sanitizar
   * @param {string[]} [camposOcultos=['passwordHash']] - Lista de campos a eliminar
   * @returns {Object|Array} Mismo objeto sin los campos especificados
   */
  static _sanitizar(objeto, camposOcultos = ['passwordHash']) {
    if (!objeto) return null;
    if (Array.isArray(objeto)) {
      return objeto.map(item => this._sanitizar(item, camposOcultos));
    }
    const sanitizado = { ...objeto };
    for (const campo of camposOcultos) {
      delete sanitizado[campo];
    }
    return sanitizado;
  }
}

module.exports = BaseModel;