// models/modules/catalogos/MarcaModel.js
const BaseModel = require('../../BaseModel');
const { executeQuery } = require('../../../config/database');

class MarcaModel extends BaseModel {
  constructor() {
    super('marcas');
  }

  // Obtener marcas activas para selectores
  async findActive() {
    const query = `
      SELECT id, nombre, logo_url 
      FROM marcas 
      WHERE activo = true 
      ORDER BY nombre ASC
    `;
    return await executeQuery(query);
  }

  // Obtener marca con sus modelos
  async findWithModelos(marcaId) {
    const marca = await this.findById(marcaId);
    if (!marca) return null;

    const modelos = await executeQuery(`
      SELECT id, nombre, imagen_url, especificaciones, activo
      FROM modelos 
      WHERE marca_id = ? AND activo = true
      ORDER BY nombre ASC
    `, [marcaId]);

    return {
      ...marca,
      modelos
    };
  }

  // Buscar marcas por nombre
  async searchByName(termino) {
    const query = `
      SELECT id, nombre, logo_url
      FROM marcas 
      WHERE nombre LIKE ? AND activo = true
      ORDER BY nombre ASC
      LIMIT 10
    `;
    return await executeQuery(query, [`%${termino}%`]);
  }

  // Crear marca con auditoría
  async createWithAudit(data, userId = 1) {
    const marcaData = {
      ...data,
      created_by: userId,
      establecimiento_id: data.establecimiento_id || 1
    };
    
    return await this.create(marcaData);
  }

  // Actualizar marca con auditoría
  async updateWithAudit(id, data, userId = 1) {
    const updateData = {
      ...data,
      updated_by: userId,
      updated_at: new Date()
    };
    
    return await this.update(id, updateData);
  }
}

module.exports = MarcaModel;