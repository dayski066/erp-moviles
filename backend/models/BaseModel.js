const { executeQuery, executeTransaction } = require('../config/database');

class BaseModel {
  constructor(tableName) {
    this.tableName = tableName;
  }

  // Obtener todos los registros
  async findAll(conditions = {}, orderBy = 'id DESC', limit = null) {
    let query = `SELECT * FROM ${this.tableName}`;
    const params = [];

    if (Object.keys(conditions).length > 0) {
      const whereClause = Object.keys(conditions)
        .map(key => `${key} = ?`)
        .join(' AND ');
      query += ` WHERE ${whereClause}`;
      params.push(...Object.values(conditions));
    }

    if (orderBy) {
      query += ` ORDER BY ${orderBy}`;
    }

    if (limit) {
      query += ` LIMIT ${limit}`;
    }

    return await executeQuery(query, params);
  }

  // Obtener por ID
  async findById(id) {
    const query = `SELECT * FROM ${this.tableName} WHERE id = ?`;
    const results = await executeQuery(query, [id]);
    return results[0] || null;
  }

  // Crear nuevo registro
  async create(data) {
    const fields = Object.keys(data);
    const values = Object.values(data);
    const placeholders = fields.map(() => '?').join(', ');

    const query = `
      INSERT INTO ${this.tableName} (${fields.join(', ')}) 
      VALUES (${placeholders})
    `;

    const result = await executeQuery(query, values);
    return result.insertId;
  }

  // Actualizar registro
  async update(id, data) {
    const fields = Object.keys(data);
    const values = Object.values(data);
    const setClause = fields.map(field => `${field} = ?`).join(', ');

    const query = `UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`;
    values.push(id);

    const result = await executeQuery(query, values);
    return result.affectedRows > 0;
  }

  // Eliminar registro
  async delete(id) {
    const query = `DELETE FROM ${this.tableName} WHERE id = ?`;
    const result = await executeQuery(query, [id]);
    return result.affectedRows > 0;
  }

  // Contar registros
  async count(conditions = {}) {
    let query = `SELECT COUNT(*) as total FROM ${this.tableName}`;
    const params = [];

    if (Object.keys(conditions).length > 0) {
      const whereClause = Object.keys(conditions)
        .map(key => `${key} = ?`)
        .join(' AND ');
      query += ` WHERE ${whereClause}`;
      params.push(...Object.values(conditions));
    }

    const result = await executeQuery(query, params);
    return result[0].total;
  }
}

module.exports = BaseModel;