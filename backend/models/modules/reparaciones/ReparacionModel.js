const BaseModel = require('../../BaseModel');
const { executeQuery, executeTransaction } = require('../../../config/database');

class ReparacionModel extends BaseModel {
  constructor() {
    super('reparaciones');
  }

  // Obtener reparaciones con información del cliente
  async findAllWithClient(limit = 50, offset = 0) {
    const query = `
      SELECT 
        r.*,
        c.nombre as cliente_nombre,
        c.apellidos as cliente_apellidos,
        c.telefono as cliente_telefono,
        c.email as cliente_email,
        COUNT(DISTINCT rd.id) as total_dispositivos,
        COUNT(DISTINCT da.id) as total_averias
      FROM reparaciones r
      LEFT JOIN clientes c ON r.cliente_id = c.id
      LEFT JOIN reparacion_dispositivos rd ON r.id = rd.reparacion_id
      LEFT JOIN dispositivo_averias da ON rd.id = da.dispositivo_id
      GROUP BY r.id
      ORDER BY r.fecha_ingreso DESC
      LIMIT ? OFFSET ?
    `;

    return await executeQuery(query, [limit, offset]);
  }

  // Obtener reparación completa
  async findCompleteById(id) {
    const reparacion = await this.findById(id);
    if (!reparacion) return null;

    // Obtener dispositivos
    const dispositivos = await executeQuery(
      'SELECT * FROM reparacion_dispositivos WHERE reparacion_id = ?',
      [id]
    );

    // Obtener averías
    const averias = await executeQuery(`
      SELECT da.*, rd.marca, rd.modelo
      FROM dispositivo_averias da
      LEFT JOIN reparacion_dispositivos rd ON da.dispositivo_id = rd.id
      WHERE rd.reparacion_id = ?
      ORDER BY da.fecha_deteccion
    `, [id]);

    return {
      reparacion,
      dispositivos,
      averias
    };
  }

  // Generar número de orden único
  async generateOrderNumber() {
    const year = new Date().getFullYear();
    const query = `
      SELECT COUNT(*) as total 
      FROM reparaciones 
      WHERE YEAR(fecha_ingreso) = ?
    `;
    
    const result = await executeQuery(query, [year]);
    const nextNumber = (result[0].total + 1).toString().padStart(4, '0');
    
    return `R-${year}-${nextNumber}`;
  }

  // Crear reparación completa con dispositivos y averías
  async createComplete(data) {
    const { reparacion, dispositivos, averias } = data;

    try {
      // Generar número de orden si no existe
      if (!reparacion.numero_orden) {
        reparacion.numero_orden = await this.generateOrderNumber();
      }

      // Crear reparación principal
      const reparacionId = await this.create(reparacion);

      // Crear dispositivos
      const DispositivoModel = require('./DispositivoModel');
      const dispositivoModel = new DispositivoModel();

      for (let i = 0; i < dispositivos.length; i++) {
        const dispositivo = dispositivos[i];
        dispositivo.reparacion_id = reparacionId;
        
        const dispositivoId = await dispositivoModel.create(dispositivo);

        // Crear averías para este dispositivo
        if (averias[i] && averias[i].length > 0) {
          const AveriaModel = require('./AveriaModel');
          const averiaModel = new AveriaModel();

          for (const averia of averias[i]) {
            averia.dispositivo_id = dispositivoId;
            await averiaModel.create(averia);
          }
        }
      }

      return reparacionId;
    } catch (error) {
      throw new Error(`Error creando reparación completa: ${error.message}`);
    }
  }
}

module.exports = ReparacionModel;
