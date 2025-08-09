const BaseModel = require('../../BaseModel');
const { executeQuery } = require('../../../config/database');

class ClienteModel extends BaseModel {
  constructor() {
    super('clientes');
  }

  // Buscar cliente por DNI
  async findByDni(dni) {
    const query = 'SELECT * FROM clientes WHERE dni = ?';
    const results = await executeQuery(query, [dni]);
    return results[0] || null;
  }

  // Buscar cliente por teléfono
  async findByTelefono(telefono) {
    const query = 'SELECT * FROM clientes WHERE telefono = ?';
    const results = await executeQuery(query, [telefono]);
    return results[0] || null;
  }

  // Obtener clientes con sus reparaciones
  async findWithReparaciones(clienteId) {
    const cliente = await this.findById(clienteId);
    if (!cliente) return null;

    const reparaciones = await executeQuery(`
      SELECT r.*, COUNT(rd.id) as total_dispositivos
      FROM reparaciones r
      LEFT JOIN reparacion_dispositivos rd ON r.id = rd.reparacion_id
      WHERE r.cliente_id = ?
      GROUP BY r.id
      ORDER BY r.fecha_ingreso DESC
    `, [clienteId]);

    return {
      ...cliente,
      reparaciones
    };
  }
}

module.exports = ClienteModel;