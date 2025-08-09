// models/modules/catalogos/IntervencionModel.js
const BaseModel = require('../../BaseModel');
const { executeQuery } = require('../../../config/database');

class IntervencionModel extends BaseModel {
  constructor() {
    super('intervenciones');
  }

  // MÉTODO CLAVE: Obtener intervenciones filtradas por modelo y avería
  async findByModeloAndAveria(modeloId, averiaId) {
    const query = `
      SELECT 
        i.*,
        m.nombre as modelo_nombre,
        ma.nombre as marca_nombre,
        a.nombre as averia_nombre
      FROM intervenciones i
      JOIN modelos m ON i.modelo_id = m.id
      JOIN marcas ma ON m.marca_id = ma.id
      JOIN averias a ON i.averia_id = a.id
      WHERE i.modelo_id = ? 
        AND i.averia_id = ? 
        AND i.activo = true
      ORDER BY i.precio_base ASC, i.nombre ASC
    `;
    return await executeQuery(query, [modeloId, averiaId]);
  }

  // Obtener intervención con información completa
  async findWithDetails(intervencionId) {
    const query = `
      SELECT 
        i.*,
        m.nombre as modelo_nombre,
        ma.nombre as marca_nombre,
        a.nombre as averia_nombre,
        a.categoria as averia_categoria
      FROM intervenciones i
      JOIN modelos m ON i.modelo_id = m.id
      JOIN marcas ma ON m.marca_id = ma.id
      JOIN averias a ON i.averia_id = a.id
      WHERE i.id = ?
    `;
    const result = await executeQuery(query, [intervencionId]);
    return result[0] || null;
  }

  // Obtener intervenciones por modelo (todas las averías)
  async findByModelo(modeloId) {
    const query = `
      SELECT 
        i.*,
        a.nombre as averia_nombre,
        a.categoria as averia_categoria
      FROM intervenciones i
      JOIN averias a ON i.averia_id = a.id
      WHERE i.modelo_id = ? AND i.activo = true
      ORDER BY a.categoria ASC, i.precio_base ASC
    `;
    return await executeQuery(query, [modeloId]);
  }

  // Obtener intervenciones por avería (todos los modelos)
  async findByAveria(averiaId) {
    const query = `
      SELECT 
        i.*,
        m.nombre as modelo_nombre,
        ma.nombre as marca_nombre
      FROM intervenciones i
      JOIN modelos m ON i.modelo_id = m.id
      JOIN marcas ma ON m.marca_id = ma.id
      WHERE i.averia_id = ? AND i.activo = true
      ORDER BY ma.nombre ASC, m.nombre ASC, i.precio_base ASC
    `;
    return await executeQuery(query, [averiaId]);
  }

  // Buscar intervenciones por nombre
  async searchByName(termino, modeloId = null, averiaId = null) {
    let query = `
      SELECT 
        i.*,
        m.nombre as modelo_nombre,
        ma.nombre as marca_nombre,
        a.nombre as averia_nombre
      FROM intervenciones i
      JOIN modelos m ON i.modelo_id = m.id
      JOIN marcas ma ON m.marca_id = ma.id
      JOIN averias a ON i.averia_id = a.id
      WHERE i.nombre LIKE ? AND i.activo = true
    `;
    
    const params = [`%${termino}%`];
    
    if (modeloId) {
      query += ` AND i.modelo_id = ?`;
      params.push(modeloId);
    }
    
    if (averiaId) {
      query += ` AND i.averia_id = ?`;
      params.push(averiaId);
    }
    
    query += ` ORDER BY i.precio_base ASC LIMIT 10`;
    
    return await executeQuery(query, params);
  }

  // Obtener sugerencias de intervenciones por modelo y avería específica
  async findSugerenciasPorModeloYAveria(modeloId, averiaId, limit = 3) {
    const query = `
      SELECT 
        i.id,
        i.nombre,
        i.descripcion,
        i.precio_base,
        i.tiempo_estimado_minutos,
        i.dificultad,
        i.requiere_especialista,
        i.tipo,
        COUNT(DISTINCT rd.reparacion_id) as frecuencia_uso,
        COUNT(CASE WHEN r.estado IN ('entregada', 'finalizada') THEN 1 END) as casos_exitosos,
        AVG(i.precio_base) as precio_promedio
      FROM intervenciones i
      LEFT JOIN dispositivo_averias da ON i.averia_id = da.averia_id 
      LEFT JOIN reparacion_detalles rd ON da.reparacion_detalle_id = rd.id AND rd.modelo_id = i.modelo_id
      LEFT JOIN reparaciones r ON rd.reparacion_id = r.id
      WHERE i.modelo_id = ? AND i.averia_id = ? AND i.activo = true
      GROUP BY i.id
      HAVING frecuencia_uso > 0
      ORDER BY frecuencia_uso DESC, casos_exitosos DESC, i.precio_base ASC
      LIMIT ?
    `;
    return await executeQuery(query, [modeloId, averiaId, limit]);
  }

  // Obtener intervenciones más utilizadas
  async findMasUtilizadas(limit = 10) {
    const query = `
      SELECT 
        i.*,
        m.nombre as modelo_nombre,
        ma.nombre as marca_nombre,
        a.nombre as averia_nombre,
        COUNT(ai.id) as total_usos
      FROM intervenciones i
      JOIN modelos m ON i.modelo_id = m.id
      JOIN marcas ma ON m.marca_id = ma.id
      JOIN averias a ON i.averia_id = a.id
      LEFT JOIN averia_intervenciones ai ON i.id = ai.intervencion_id
      WHERE i.activo = true
      GROUP BY i.id
      ORDER BY total_usos DESC, i.precio_base ASC
      LIMIT ?
    `;
    return await executeQuery(query, [limit]);
  }

  // Obtener rango de precios por modelo y avería
  async getPriceRange(modeloId, averiaId) {
    const query = `
      SELECT 
        MIN(precio_base) as precio_minimo,
        MAX(precio_base) as precio_maximo,
        AVG(precio_base) as precio_promedio,
        COUNT(*) as total_opciones
      FROM intervenciones
      WHERE modelo_id = ? AND averia_id = ? AND activo = true
    `;
    const result = await executeQuery(query, [modeloId, averiaId]);
    return result[0] || null;
  }

  // Crear intervención con auditoría
  async createWithAudit(data, userId = 1) {
    const intervencionData = {
      ...data,
      created_by: userId,
      establecimiento_id: data.establecimiento_id || 1
    };
    
    return await this.create(intervencionData);
  }

  // Actualizar intervención con auditoría
  async updateWithAudit(id, data, userId = 1) {
    const updateData = {
      ...data,
      updated_by: userId,
      updated_at: new Date()
    };
    
    return await this.update(id, updateData);
  }

  // Verificar si combinación modelo+avería+nombre ya existe
  async existsCombination(modeloId, averiaId, nombre, excludeId = null) {
    let query = `
      SELECT id FROM intervenciones 
      WHERE modelo_id = ? AND averia_id = ? AND nombre = ?
    `;
    const params = [modeloId, averiaId, nombre];
    
    if (excludeId) {
      query += ` AND id != ?`;
      params.push(excludeId);
    }
    
    const result = await executeQuery(query, params);
    return result.length > 0;
  }

  // Obtener estadísticas de intervención
  async getStats(intervencionId) {
    const query = `
      SELECT 
        COUNT(ai.id) as total_aplicada,
        COUNT(CASE WHEN ai.estado_intervencion = 'completada' THEN 1 END) as completadas,
        AVG(ai.precio_unitario) as precio_promedio_aplicado,
        MIN(ai.created_at) as primera_vez_usada,
        MAX(ai.created_at) as ultima_vez_usada
      FROM averia_intervenciones ai
      WHERE ai.intervencion_id = ?
    `;
    const result = await executeQuery(query, [intervencionId]);
    return result[0] || null;
  }
}

module.exports = IntervencionModel;