// models/modules/catalogos/ModeloModel.js
const BaseModel = require('../../BaseModel');
const { executeQuery } = require('../../../config/database');

class ModeloModel extends BaseModel {
  constructor() {
    super('modelos');
  }

  // Obtener modelos por marca (para selectores)
  async findByMarca(marcaId) {
    const query = `
      SELECT 
        m.id, 
        m.nombre, 
        m.imagen_url, 
        m.especificaciones,
        ma.nombre as marca_nombre
      FROM modelos m
      JOIN marcas ma ON m.marca_id = ma.id
      WHERE m.marca_id = ? AND m.activo = true
      ORDER BY m.nombre ASC
    `;
    return await executeQuery(query, [marcaId]);
  }

  // Obtener modelo con información de marca
  async findWithMarca(modeloId) {
    const query = `
      SELECT 
        m.*,
        ma.nombre as marca_nombre,
        ma.logo_url as marca_logo
      FROM modelos m
      JOIN marcas ma ON m.marca_id = ma.id
      WHERE m.id = ?
    `;
    const result = await executeQuery(query, [modeloId]);
    return result[0] || null;
  }

  // Buscar modelos por marca y nombre
  async searchByMarcaAndName(marcaId, termino) {
    const query = `
      SELECT 
        m.id, 
        m.nombre, 
        m.imagen_url,
        ma.nombre as marca_nombre
      FROM modelos m
      JOIN marcas ma ON m.marca_id = ma.id
      WHERE m.marca_id = ? 
        AND m.nombre LIKE ? 
        AND m.activo = true
      ORDER BY m.nombre ASC
      LIMIT 10
    `;
    return await executeQuery(query, [marcaId, `%${termino}%`]);
  }

  // Obtener modelos populares (más usados en reparaciones)
  async findPopulares(limit = 10) {
    const query = `
      SELECT 
        m.id,
        m.nombre,
        m.imagen_url,
        ma.nombre as marca_nombre,
        COUNT(rd.id) as total_reparaciones
      FROM modelos m
      JOIN marcas ma ON m.marca_id = ma.id
      LEFT JOIN reparacion_detalles rd ON m.id = rd.modelo_id
      WHERE m.activo = true
      GROUP BY m.id
      ORDER BY total_reparaciones DESC, m.nombre ASC
      LIMIT ?
    `;
    return await executeQuery(query, [limit]);
  }

  // Crear modelo con auditoría
  async createWithAudit(data, userId = 1) {
    const modeloData = {
      ...data,
      created_by: userId,
      establecimiento_id: data.establecimiento_id || 1,
      especificaciones: data.especificaciones ? JSON.stringify(data.especificaciones) : null
    };
    
    return await this.create(modeloData);
  }

  // Actualizar modelo con auditoría
  async updateWithAudit(id, data, userId = 1) {
    const updateData = {
      ...data,
      updated_by: userId,
      updated_at: new Date()
    };

    if (data.especificaciones) {
      updateData.especificaciones = JSON.stringify(data.especificaciones);
    }
    
    return await this.update(id, updateData);
  }

  // Verificar si un modelo existe y está activo
  async isActive(modeloId) {
    const query = `
      SELECT activo FROM modelos WHERE id = ?
    `;
    const result = await executeQuery(query, [modeloId]);
    return result[0]?.activo || false;
  }
}

module.exports = ModeloModel;