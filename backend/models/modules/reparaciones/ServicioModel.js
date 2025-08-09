const BaseModel = require('../../BaseModel');
const { executeQuery } = require('../../../config/database');

class ServicioModel extends BaseModel {
  constructor() {
    super('averia_servicios');
  }

  // Obtener servicios de una avería
  async findByAveriaId(averiaId) {
    return await executeQuery(
      'SELECT * FROM averia_servicios WHERE averia_id = ? ORDER BY id',
      [averiaId]
    );
  }

  // Crear múltiples servicios para una avería
  async createMultiple(averiaId, servicios) {
    const results = [];
    
    for (const servicio of servicios) {
      const servicioData = {
        ...servicio,
        averia_id: averiaId
      };
      
      const id = await this.create(servicioData);
      results.push(id);
    }
    
    return results;
  }

  // Actualizar precios de servicio
  async updatePrecios(id, precioUnitario, cantidad = null) {
    const data = {
      precio_unitario: precioUnitario,
      precio_total: precioUnitario * (cantidad || 1)
    };
    
    if (cantidad) {
      data.cantidad = cantidad;
    }
    
    return await this.update(id, data);
  }
}

module.exports = ServicioModel;
