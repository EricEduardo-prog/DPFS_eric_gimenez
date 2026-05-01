// services/inventoryService.js
'use strict';

const { Product, Category } = require('../database/models');
const { Op } = require('sequelize');

class InventoryService {
  /**
   * Recalcula la cantidad de productos para todas las categorías.
   * Debe llamarse después de crear/actualizar/eliminar un producto.
   * @returns {Promise<void>}
   */
  static async sincronizarCantidadProductos() {
    const [productos, categorias] = await Promise.all([
      Product.findAll({ attributes: ['category_id'] }),
      Category.findAll({ attributes: ['id'] })
    ]);

    // Agrupar por categoría
    const countMap = new Map();
    productos.forEach(p => {
      const catId = p.category_id;
      countMap.set(catId, (countMap.get(catId) || 0) + 1);
    });

    // Actualizar cada categoría (products_count no existe en el modelo original, pero si se desea agregar)
    // Nota: En el modelo Category no se definió el campo "products_count" porque se dijo que es calculado.
    // Si se requiere persistir, habría que agregarlo al modelo. Por ahora se omite.
    // Mantenemos la lógica de la función original como placeholder.
    for (const cat of categorias) {
      const cantidad = countMap.get(cat.id) || 0;
      // Si existiera el campo, se actualizaría: await cat.update({ products_count: cantidad });
      console.log(`Categoría ${cat.id} -> ${cantidad} productos`);
    }
  }

  /**
   * Obtiene datos para el home: 6 productos destacados y 6 categorías principales.
   * @returns {Promise<Object>} { productos, categorias }
   */
  static async getHomeData() {
    const [productos, categorias] = await Promise.all([
      Product.findAll({
        where: { is_active: true },
        limit: 6,
        order: [['created_at', 'DESC']],
        attributes: ['id', 'name', 'slug', 'price', 'image', 'category_id']
      }),
      Category.findAll({
        where: { is_active: true },
        limit: 6,
        order: [['order', 'ASC']],
        attributes: ['id', 'name', 'slug', 'icon']
      })
    ]);
    return { productos, categorias };
  }

  /**
   * Búsqueda avanzada de productos: por texto y/o categoría.
   * @param {Object} filtros - { q: string, categoriaId: string }
   * @returns {Promise<Array>}
   */
  static async buscarProductos(filtros) {
    const where = { is_active: true };
    if (filtros.categoriaId) {
      where.category_id = filtros.categoriaId;
    }
    if (filtros.q && filtros.q.trim()) {
      const term = filtros.q.toLowerCase().trim();
      where[Op.or] = [
        { name: { [Op.like]: `%${term}%` } },
        { sku: { [Op.like]: `%${term}%` } },
        { description: { [Op.like]: `%${term}%` } }
      ];
    }
    const productos = await Product.findAll({
      where,
      attributes: ['id', 'name', 'sku', 'price', 'image', 'category_id']
    });
    return productos;
  }
}

module.exports = InventoryService;