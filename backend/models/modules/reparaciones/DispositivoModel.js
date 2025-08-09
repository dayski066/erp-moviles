const BaseModel = require('../../BaseModel');
const { executeQuery } = require('../../../config/database');

class DispositivoModel extends BaseModel {
  constructor() {
    super('reparacion_dispositivos');
  }

  // Obtener dispositivos de una reparación
  async findByReparacionId(reparacionId) {
    const query = `
      SELECT rd.*, 
             COUNT(da.id) as total_averias,
             COUNT(CASE WHEN da.estado_averia = 'reparada' THEN 1 END) as averias_completadas
      FROM reparacion_dispositivos rd
      LEFT JOIN dispositivo_averias da ON rd.id = da.dispositivo_id
      WHERE rd.reparacion_id = ?
      GROUP BY rd.id
      ORDER BY rd.fecha_recepcion
    `;
    
    return await executeQuery(query, [reparacionId]);
  }

  // Obtener dispositivo con sus averías
  async findWithAverias(id) {
    const dispositivo = await this.findById(id);
    if (!dispositivo) return null;

    const averias = await executeQuery(
      'SELECT * FROM dispositivo_averias WHERE dispositivo_id = ? ORDER BY fecha_deteccion',
      [id]
    );

    return {
      ...dispositivo,
      averias
    };
  }

  // Actualizar estado del dispositivo
  async updateEstado(id, nuevoEstado) {
    return await this.update(id, { 
      estado_dispositivo: nuevoEstado,
      updated_at: new Date()
    });
  }
}

module.exports = DispositivoModel;
