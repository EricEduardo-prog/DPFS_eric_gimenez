// services/inventoryService.js
//Sincronizar contadores de productos por categoría, armar home, búsqueda avanzada.
'use strict';

const ProductoModel = require('../models/productoModel');
const CategoriaModel = require('../models/categoriaModel');

class InventoryService {
  /**
   * Recalcula la cantidad de productos para todas las categorías.
   * Debe llamarse después de crear/actualizar/eliminar un producto.
   */
  static sincronizarCantidadProductos() {
    const productos = ProductoModel.getAll();
    const categorias = CategoriaModel.getAll();
    for (const cat of categorias) {
      const cantidad = productos.filter(p => p.categoriaId === cat.id).length;
      CategoriaModel.setCantidadProductos(cat.id, cantidad);
    }
  }

  /**
   * Obtiene datos para el home: 6 productos destacados y 6 categorías principales.
   * @returns {Object} { productos, categorias }
   */
  static getHomeData() {
    const productos = ProductoModel.getAll({ soloActivos: true });
    const categorias = CategoriaModel.getAll({ soloActivas: true });
    return {
      productos: productos.slice(0, 6),
      categorias: categorias.slice(0, 6),
    };
  }

  /**
   * Búsqueda avanzada de productos: por texto y/o categoría.
   * @param {Object} filtros - { q: string, categoriaId: string }
   * @returns {Array}
   */
  static buscarProductos(filtros) {
    let productos = ProductoModel.getAll({ soloActivos: true });
    if (filtros.categoriaId) {
      productos = productos.filter(p => p.categoriaId === filtros.categoriaId);
    }
    if (filtros.q && filtros.q.trim()) {
      const term = filtros.q.toLowerCase().trim();
      productos = productos.filter(p =>
        p.nombre.toLowerCase().includes(term) ||
        p.sku.toLowerCase().includes(term) ||
        (p.descripcion && p.descripcion.toLowerCase().includes(term))
      );
    }
    return productos;
  }
}

module.exports = InventoryService;