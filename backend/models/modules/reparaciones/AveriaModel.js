const BaseModel = require('../../BaseModel');
const { executeQuery } = require('../../../config/database');

class AveriaModel extends BaseModel {
  constructor() {
    super('dispositivo_averias');
  }

  // Obtener averías por estado
  async findByEstado(estado, limit = 50) {
    const query = `
      SELECT da.*, 
             rd.marca, rd.modelo, rd.imei,
             r.numero_orden,
             c.nombre as cliente_nombre, c.telefono as cliente_telefono
      FROM dispositivo_averias da
      LEFT JOIN reparacion_dispositivos rd ON da.dispositivo_id = rd.id
      LEFT JOIN reparaciones r ON rd.reparacion_id = r.id
      LEFT JOIN clientes c ON r.cliente_id = c.id
      WHERE da.estado_averia = ?
      ORDER BY da.fecha_deteccion DESC
      LIMIT ?
    `;
    
    return await executeQuery(query, [estado, limit]);
  }

  // Obtener averías pendientes de aprobación
  async findPendientesAprobacion() {
    return await this.findByEstado('enviada_cliente');
  }

  // Obtener cola de trabajo (averías aprobadas)
  async findColaTrajo() {
    const query = `
      SELECT da.*, 
             rd.marca, rd.modelo,
             r.numero_orden,
             c.nombre as cliente_nombre,
             COUNT(aser.id) as total_servicios,
             COUNT(CASE WHEN aser.estado_servicio = 'completado' THEN 1 END) as servicios_completados
      FROM dispositivo_averias da
      LEFT JOIN reparacion_dispositivos rd ON da.dispositivo_id = rd.id
      LEFT JOIN reparaciones r ON rd.reparacion_id = r.id
      LEFT JOIN clientes c ON r.cliente_id = c.id
      LEFT JOIN averia_servicios aser ON da.id = aser.averia_id
      WHERE da.estado_averia IN ('aprobada', 'en_reparacion')
      GROUP BY da.id
      ORDER BY da.prioridad DESC, da.fecha_estimada_finalizacion ASC
    `;
    
    return await executeQuery(query);
  }

  // Cambiar estado de avería
  async cambiarEstado(id, nuevoEstado, comentario = null, usuarioId = null) {
    const averia = await this.findById(id);
    if (!averia) throw new Error('Avería no encontrada');

    // Actualizar estado
    const updated = await this.update(id, {
      estado_averia: nuevoEstado,
      [`fecha_${this.getEstadoField(nuevoEstado)}`]: new Date()
    });

    if (updated && comentario) {
      // Registrar en historial
      await executeQuery(`
        INSERT INTO averia_historial 
        (averia_id, campo_modificado, valor_anterior, valor_nuevo, comentario, tipo_evento, usuario_id)
        VALUES (?, 'estado_averia', ?, ?, ?, 'cambio_estado', ?)
      `, [id, averia.estado_averia, nuevoEstado, comentario, usuarioId]);
    }

    return updated;
  }

  // Helper para mapear estados a campos de fecha
  getEstadoField(estado) {
    const mapping = {
      'diagnosticada': 'diagnostico',
      'presupuestada': 'presupuesto',
      'aprobada': 'respuesta_cliente',
      'en_reparacion': 'inicio_reparacion',
      'reparada': 'finalizacion'
    };
    return mapping[estado] || null;
  }
}

module.exports = AveriaModel;
