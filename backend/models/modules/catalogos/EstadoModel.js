// models/modules/catalogos/EstadoModel.js
const BaseModel = require('../../BaseModel');

class EstadoModel extends BaseModel {
  constructor() {
    super('estados');
  }

  // Obtener todos los estados por categoría
  async obtenerPorCategoria(categoria) {
    try {
      const query = `
        SELECT id, codigo, nombre, categoria, color, emoji, orden, activo
        FROM ${this.tabla}
        WHERE categoria = ? AND activo = TRUE
        ORDER BY orden ASC, nombre ASC
      `;
      const [rows] = await this.db.execute(query, [categoria]);
      return rows;
    } catch (error) {
      console.error(`❌ Error obteniendo estados por categoría ${categoria}:`, error);
      throw error;
    }
  }

  // Obtener todos los estados activos
  async obtenerTodos() {
    try {
      const query = `
        SELECT id, codigo, nombre, categoria, color, emoji, orden, activo
        FROM ${this.tabla}
        WHERE activo = TRUE
        ORDER BY categoria ASC, orden ASC, nombre ASC
      `;
      const [rows] = await this.db.execute(query);
      return rows;
    } catch (error) {
      console.error('❌ Error obteniendo todos los estados:', error);
      throw error;
    }
  }

  // Crear nuevo estado
  async crear(datos) {
    try {
      const { codigo, nombre, categoria, color = '#6B7280', emoji = '📋', orden = 0 } = datos;
      
      const query = `
        INSERT INTO ${this.tabla} (codigo, nombre, categoria, color, emoji, orden)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      const [result] = await this.db.execute(query, [codigo, nombre, categoria, color, emoji, orden]);
      
      // Obtener el estado creado
      const estadoCreado = await this.obtenerPorId(result.insertId);
      return estadoCreado;
    } catch (error) {
      console.error('❌ Error creando estado:', error);
      throw error;
    }
  }

  // Actualizar estado
  async actualizar(id, datos) {
    try {
      const { codigo, nombre, categoria, color, emoji, orden, activo } = datos;
      
      const query = `
        UPDATE ${this.tabla}
        SET codigo = ?, nombre = ?, categoria = ?, color = ?, emoji = ?, orden = ?, activo = ?
        WHERE id = ?
      `;
      await this.db.execute(query, [codigo, nombre, categoria, color, emoji, orden, activo, id]);
      
      // Obtener el estado actualizado
      const estadoActualizado = await this.obtenerPorId(id);
      return estadoActualizado;
    } catch (error) {
      console.error(`❌ Error actualizando estado ${id}:`, error);
      throw error;
    }
  }

  // Eliminar estado (soft delete)
  async eliminar(id) {
    try {
      const query = `UPDATE ${this.tabla} SET activo = FALSE WHERE id = ?`;
      await this.db.execute(query, [id]);
      return { success: true, message: 'Estado eliminado correctamente' };
    } catch (error) {
      console.error(`❌ Error eliminando estado ${id}:`, error);
      throw error;
    }
  }

  // Obtener estado por código
  async obtenerPorCodigo(codigo) {
    try {
      const query = `
        SELECT id, codigo, nombre, categoria, color, emoji, orden, activo
        FROM ${this.tabla}
        WHERE codigo = ? AND activo = TRUE
      `;
      const [rows] = await this.db.execute(query, [codigo]);
      return rows[0] || null;
    } catch (error) {
      console.error(`❌ Error obteniendo estado por código ${codigo}:`, error);
      throw error;
    }
  }

  // Validar si un código ya existe
  async existeCodigo(codigo, idExcluir = null) {
    try {
      let query = `SELECT COUNT(*) as count FROM ${this.tabla} WHERE codigo = ?`;
      let params = [codigo];
      
      if (idExcluir) {
        query += ' AND id != ?';
        params.push(idExcluir);
      }
      
      const [rows] = await this.db.execute(query, params);
      return rows[0].count > 0;
    } catch (error) {
      console.error('❌ Error validando código de estado:', error);
      throw error;
    }
  }
}

module.exports = EstadoModel;