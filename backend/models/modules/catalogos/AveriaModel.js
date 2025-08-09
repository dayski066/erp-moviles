// models/modules/catalogos/AveriaModel.js
const BaseModel = require('../../BaseModel');
const { executeQuery } = require('../../../config/database');

class AveriaModel extends BaseModel {
  constructor() {
    super('averias');
  }

  // Obtener averías activas para selectores
  async findActive() {
    const query = `
      SELECT id, nombre, descripcion, categoria, tiempo_estimado_horas
      FROM averias 
      WHERE activo = true 
      ORDER BY categoria ASC, nombre ASC
    `;
    return await executeQuery(query);
  }

  // Obtener averías por categoría
  async findByCategoria(categoria) {
    const query = `
      SELECT id, nombre, descripcion, tiempo_estimado_horas
      FROM averias 
      WHERE categoria = ? AND activo = true
      ORDER BY nombre ASC
    `;
    return await executeQuery(query, [categoria]);
  }

  // Buscar averías por nombre
  async searchByName(termino) {
    const query = `
      SELECT id, nombre, descripcion, categoria
      FROM averias 
      WHERE nombre LIKE ? AND activo = true
      ORDER BY nombre ASC
      LIMIT 10
    `;
    return await executeQuery(query, [`%${termino}%`]);
  }

  // Obtener averías más comunes (por número de casos)
  async findMasComunes(limit = 10) {
    const query = `
      SELECT 
        a.id,
        a.nombre,
        a.descripcion,
        a.categoria,
        COUNT(da.id) as total_casos
      FROM averias a
      LEFT JOIN dispositivo_averias da ON a.id = da.averia_id
      WHERE a.activo = true
      GROUP BY a.id
      ORDER BY total_casos DESC, a.nombre ASC
      LIMIT ?
    `;
    return await executeQuery(query, [limit]);
  }

  // Obtener averías con estadísticas
  async findWithStats() {
    const query = `
      SELECT 
        a.*,
        COUNT(da.id) as total_casos,
        COUNT(CASE WHEN da.estado_averia = 'reparada' THEN 1 END) as casos_resueltos,
        AVG(CASE WHEN da.estado_averia = 'reparada' THEN 
          DATEDIFF(da.updated_at, da.created_at) 
        END) as dias_promedio_resolucion
      FROM averias a
      LEFT JOIN dispositivo_averias da ON a.id = da.averia_id
      WHERE a.activo = true
      GROUP BY a.id
      ORDER BY total_casos DESC
    `;
    return await executeQuery(query);
  }

  // Crear avería con auditoría
  async createWithAudit(data, userId = 1) {
    const averiaData = {
      ...data,
      created_by: userId,
      establecimiento_id: data.establecimiento_id || 1
    };
    
    return await this.create(averiaData);
  }

  // Actualizar avería con auditoría
  async updateWithAudit(id, data, userId = 1) {
    const updateData = {
      ...data,
      updated_by: userId,
      updated_at: new Date()
    };
    
    return await this.update(id, updateData);
  }

  // Obtener sugerencias de averías por modelo (las 3 más frecuentes)
  async findSugerenciasPorModelo(modeloId, limit = 3) {
    const query = `
      SELECT 
        a.id,
        a.nombre,
        a.descripcion,
        a.categoria,
        a.tiempo_estimado_horas,
        COUNT(da.id) as frecuencia,
        COUNT(CASE WHEN da.estado_averia IN ('reparada', 'entregada') THEN 1 END) as casos_exitosos
      FROM averias a
      JOIN dispositivo_averias da ON a.id = da.averia_id
      JOIN reparacion_detalles rd ON da.reparacion_detalle_id = rd.id
      WHERE rd.modelo_id = ? AND a.activo = true
      GROUP BY a.id
      ORDER BY frecuencia DESC, casos_exitosos DESC
      LIMIT ?
    `;
    return await executeQuery(query, [modeloId, limit]);
  }

  // Verificar si una avería existe y está activa
  async isActive(averiaId) {
    const query = `
      SELECT activo FROM averias WHERE id = ?
    `;
    const result = await executeQuery(query, [averiaId]);
    return result[0]?.activo || false;
  }
}

module.exports = AveriaModel;