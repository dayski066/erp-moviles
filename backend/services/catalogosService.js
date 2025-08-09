// services/catalogosService.js
const { executeQuery, createConnection } = require("../config/database");

const catalogosService = {
  // ===== CLIENTES =====
  buscarClientesPorDni: async (termino) => {
    const query = `
        SELECT 
            id,
            nombre,
            apellidos,
            dni,
            telefono,
            email,
            direccion,
            codigo_postal as codigoPostal
        FROM clientes 
        WHERE dni LIKE ? OR nombre LIKE ? OR apellidos LIKE ?
        ORDER BY 
            CASE 
                WHEN dni = ? THEN 1
                WHEN dni LIKE CONCAT(?, '%') THEN 2
                ELSE 3
            END,
            dni ASC
        LIMIT 5
    `;
    const searchPattern = `%${termino}%`;
    return await executeQuery(query, [
      searchPattern,
      searchPattern,
      searchPattern,
      termino,
      termino,
    ]);
  },

  // ===== NUEVA FUNCIÓN PARA BÚSQUEDA EXACTA POR DNI =====
  buscarClientePorDniExacto: async (dni) => {
    const query = `
        SELECT 
            id,
            nombre,
            apellidos,
            dni,
            telefono,
            email,
            direccion,
            codigo_postal as codigoPostal
        FROM clientes 
        WHERE dni = ?
        LIMIT 1
    `;
    return await executeQuery(query, [dni.toUpperCase()]);
  },

 // ===== MARCAS ===== 
  // REEMPLAZAR TODA esta sección (líneas ~65-80 aprox) en tu catalogosService.js
  
  obtenerMarcas: async () => {
    return await executeQuery(
      "SELECT id, nombre, logo_emoji, icono_path, tipo_icono, activo FROM marcas WHERE activo = 1 ORDER BY nombre"
    );
  },

  crearMarca: async (nombre, logoEmoji = "📱", iconoPath = null, tipoIcono = 'emoji') => {
    const result = await executeQuery(
      `INSERT INTO marcas (nombre, logo_emoji, icono_path, tipo_icono) 
       VALUES (?, ?, ?, ?)`,
      [nombre, logoEmoji, iconoPath, tipoIcono]
    );
    return result.insertId;
  },

  // ✅ NUEVA FUNCIÓN - AÑADIR esta función
  actualizarMarca: async (id, datos) => {
    const { nombre, logo_emoji, icono_path, tipo_icono } = datos;
    const result = await executeQuery(
      `UPDATE marcas SET nombre = ?, logo_emoji = ?, icono_path = ?, tipo_icono = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [nombre, logo_emoji, icono_path, tipo_icono, id]
    );
    return result.affectedRows > 0;
  },

  // ✅ NUEVA FUNCIÓN - AÑADIR esta función
  obtenerMarcaPorId: async (id) => {
    const result = await executeQuery(
      "SELECT id, nombre, logo_emoji, icono_path, tipo_icono, activo FROM marcas WHERE id = ?",
      [id]
    );
    return result[0] || null;
  },

  eliminarMarca: async (id) => {
    return await executeQuery("UPDATE marcas SET activo = false WHERE id = ?", [
      id,
    ]);
  },

  
  // ===== MODELOS =====
  obtenerModelosPorMarca: async (marcaId) => {
    const results = await executeQuery(
      "SELECT * FROM modelos WHERE marca_id = ? AND activo = true ORDER BY nombre",
      [marcaId]
    );
    return results; // Ya es un array
  },

  crearModelo: async (marcaId, nombre) => {
    const result = await executeQuery(
      "INSERT INTO modelos (marca_id, nombre) VALUES (?, ?)",
      [marcaId, nombre]
    );
    return result.insertId;
  },

  eliminarModelo: async (id) => {
    return await executeQuery(
      "UPDATE modelos SET activo = false WHERE id = ?",
      [id]
    );
  },

  // ===== AVERÍAS =====
  obtenerAverias: async () => {
    const query = `
      SELECT 
        a.id,
        a.nombre,
        a.descripcion,
        a.tiempo_estimado_horas,
        a.activo,
        a.categoria_id,
        c.nombre as categoria_nombre,
        c.descripcion as categoria_descripcion,
        c.icono as categoria_icono,
        c.color as categoria_color
      FROM averias a
      LEFT JOIN categorias_averias c ON a.categoria_id = c.id
      WHERE a.activo = true
      ORDER BY c.nombre, a.nombre
    `;
    return await executeQuery(query);
  },

  obtenerCategoriasAverias: async () => {
    const query = `
      SELECT 
        id,
        nombre,
        descripcion,
        icono,
        color,
        activo
      FROM categorias_averias
      WHERE activo = true
      ORDER BY nombre
    `;
    return await executeQuery(query);
  },

  crearCategoriaAveria: async (categoria) => {
    const query = `
      INSERT INTO categorias_averias (nombre, descripcion, icono, color)
      VALUES (?, ?, ?, ?)
    `;
    return await executeQuery(query, [
      categoria.nombre,
      categoria.descripcion || null,
      categoria.icono || '🔧',
      categoria.color || 'gray'
    ]);
  },

  obtenerAveriasFrecuentesPorModelo: async (modeloId, limite = 5) => {
    const query = `
            SELECT 
                a.id,
                a.nombre,
                a.descripcion,
                amh.contador_uso
            FROM averias_modelo_historial amh
            JOIN averias a ON amh.averia_id = a.id
            WHERE amh.modelo_id = ? AND a.activo = true
            ORDER BY amh.contador_uso DESC
            LIMIT ?
        `;
    return await executeQuery(query, [modeloId, limite]);
  },

  crearAveria: async (nombre, descripcion, categoria_id) => {
    const result = await executeQuery(
      "INSERT INTO averias (nombre, descripcion, categoria_id) VALUES (?, ?, ?)",
      [nombre, descripcion, categoria_id || null]
    );
    return result.insertId;
  },

  // ===== REPARACIONES =====
  obtenerReparacionesPorModelo: async (modeloId) => {
    return await executeQuery(
      "SELECT * FROM reparaciones_modelo WHERE modelo_id = ? AND activo = true ORDER BY nombre",
      [modeloId]
    );
  },

  obtenerReparacionesPopularesPorModelo: async (modeloId, limite = 5) => {
    return await executeQuery(
      "SELECT * FROM reparaciones_modelo WHERE modelo_id = ? AND activo = true ORDER BY contador_uso DESC LIMIT ?",
      [modeloId, limite]
    );
  },

  crearReparacionModelo: async (modeloId, reparacionData) => {
    const { nombre, descripcion, precio, tipo, tiempo_estimado } =
      reparacionData;
    const result = await executeQuery(
      "INSERT INTO reparaciones_modelo (modelo_id, nombre, descripcion, precio, tipo, tiempo_estimado) VALUES (?, ?, ?, ?, ?, ?)",
      [modeloId, nombre, descripcion, precio, tipo, tiempo_estimado]
    );
    return result.insertId;
  },

  actualizarReparacion: async (id, reparacionData) => {
    const { nombre, descripcion, precio, tipo, tiempo_estimado } =
      reparacionData;
    await executeQuery(
      "UPDATE reparaciones_modelo SET nombre = ?, descripcion = ?, precio = ?, tipo = ?, tiempo_estimado = ? WHERE id = ?",
      [nombre, descripcion, precio, tipo, tiempo_estimado, id]
    );
  },

  eliminarReparacion: async (id) => {
    return await executeQuery(
      "UPDATE reparaciones_modelo SET activo = false WHERE id = ?",
      [id]
    );
  },

  // ===== CONTADORES DE USO =====
  incrementarContadorAveriaGlobal: async (averiaId) => {
    // NOTA: contador_uso_global no existe en la tabla averias
    // Esta función se mantiene para compatibilidad pero no hace nada
    console.log(`⚠️ incrementarContadorAveriaGlobal llamada para averia ${averiaId} - columna no existe`);
  },

  registrarUsoAveriaEnModelo: async (modeloId, averiaId) => {
    await executeQuery(
      `INSERT INTO averias_modelo_historial (modelo_id, averia_id, contador_uso) 
             VALUES (?, ?, 1)
             ON DUPLICATE KEY UPDATE contador_uso = contador_uso + 1`,
      [modeloId, averiaId]
    );
  },

  incrementarContadorReparacion: async (reparacionId) => {
    await executeQuery(
      "UPDATE reparaciones_modelo SET contador_uso = contador_uso + 1 WHERE id = ?",
      [reparacionId]
    );
  },

  // ===== UTILIDADES =====
  obtenerModeloId: async (marca, modelo) => {
    const result = await executeQuery(
      `
            SELECT m.id FROM modelos m 
            JOIN marcas ma ON m.marca_id = ma.id 
            WHERE ma.nombre = ? AND m.nombre = ?
        `,
      [marca, modelo]
    );
    return result[0]?.id || null;
  },

  // Añadir a catalogosService.js

// ===== INTERVENCIONES =====
obtenerIntervencionesPorAveriaYModelo: async (averiaId, modeloId) => {
  return await executeQuery(
    `SELECT * FROM intervenciones 
     WHERE averia_id = ? AND modelo_id = ? AND activo = true 
     ORDER BY id ASC`,
    [averiaId, modeloId]
  );
},

obtenerTodasIntervenciones: async () => {
  return await executeQuery(
    `SELECT i.*, a.nombre as averia_nombre, m.nombre as modelo_nombre
    FROM intervenciones i
    JOIN averias a ON i.averia_id = a.id
    JOIN modelos m ON i.modelo_id = m.id
    WHERE i.activo = true
    ORDER BY a.nombre, m.nombre, i.concepto`
  );
},

crearIntervencion: async (datos) => {
  const { 
    modelo_id, averia_id, nombre, descripcion, precio_base, tipo, 
    tiempo_estimado_minutos, dificultad, requiere_especialista, 
    garantia_dias, activo, establecimiento_id, created_by 
  } = datos;
  
  return await executeQuery(
    `INSERT INTO intervenciones 
    (modelo_id, averia_id, nombre, descripcion, precio_base, tipo, tiempo_estimado_minutos, dificultad, requiere_especialista, garantia_dias, activo, establecimiento_id, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [modelo_id, averia_id, nombre, descripcion || null, precio_base, tipo, tiempo_estimado_minutos, dificultad, requiere_especialista, garantia_dias, activo, establecimiento_id, created_by]
  );
},

actualizarIntervencion: async (id, datos) => {
  const { concepto, descripcion, precio_base, tipo, tiempo_estimado_minutos, dificultad, requiere_especialista } = datos;
  
  return await executeQuery(
    `UPDATE intervenciones 
    SET concepto = ?, descripcion = ?, precio_base = ?, tipo = ?, 
        tiempo_estimado_minutos = ?, dificultad = ?, requiere_especialista = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?`,
    [concepto, descripcion, precio_base, tipo, tiempo_estimado_minutos, dificultad, requiere_especialista, id]
  );
},

eliminarIntervencion: async (id) => {
  return await executeQuery(
    "UPDATE intervenciones SET activo = false WHERE id = ?",
    [id]
  );
},

incrementarUsoIntervencion: async (id) => {
  return await executeQuery(
    "UPDATE intervenciones SET contador_uso = contador_uso + 1 WHERE id = ?",
    [id]
  );
},

// ===== ESTADOS =====
obtenerEstados: async (categoria = null) => {
  let query = `
    SELECT id, nombre, categoria, color, emoji, orden
    FROM estados
  `;
  let params = [];
  
  if (categoria) {
    query += ` WHERE categoria = ?`;
    params.push(categoria);
  }
  
  query += ` ORDER BY categoria ASC, orden ASC, nombre ASC`;
  
  const estados = await executeQuery(query, params);
  return {
    success: true,
    data: estados
  };
},

crearEstado: async (data) => {
  const { codigo, nombre, categoria, color = '#6B7280', emoji = '📋', orden = 0 } = data;
  
  // Verificar que el código no existe
  const existente = await executeQuery(
    'SELECT COUNT(*) as count FROM estados WHERE codigo = ?',
    [codigo]
  );
  
  if (existente[0].count > 0) {
    throw new Error(`Ya existe un estado con el código "${codigo}"`);
  }
  
  const result = await executeQuery(`
    INSERT INTO estados (codigo, nombre, categoria, color, emoji, orden)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [codigo, nombre, categoria, color, emoji, orden]);
  
  // Obtener el estado creado
  const estadoCreado = await executeQuery(
    'SELECT * FROM estados WHERE id = ?',
    [result.insertId]
  );
  
  return {
    success: true,
    data: estadoCreado[0]
  };
},

actualizarEstado: async (id, data) => {
  const { codigo, nombre, categoria, color, emoji, orden, activo } = data;
  
  // Verificar que el estado existe
  const estadoExistente = await executeQuery(
    'SELECT * FROM estados WHERE id = ?',
    [id]
  );
  
  if (estadoExistente.length === 0) {
    throw new Error('Estado no encontrado');
  }
  
  // Verificar que el código no existe en otro estado
  if (codigo && codigo !== estadoExistente[0].codigo) {
    const codigoExiste = await executeQuery(
      'SELECT COUNT(*) as count FROM estados WHERE codigo = ? AND id != ?',
      [codigo, id]
    );
    
    if (codigoExiste[0].count > 0) {
      throw new Error(`Ya existe un estado con el código "${codigo}"`);
    }
  }
  
  await executeQuery(`
    UPDATE estados
    SET codigo = ?, nombre = ?, categoria = ?, color = ?, emoji = ?, orden = ?, activo = ?
    WHERE id = ?
  `, [codigo, nombre, categoria, color, emoji, orden, activo, id]);
  
  // Obtener el estado actualizado
  const estadoActualizado = await executeQuery(
    'SELECT * FROM estados WHERE id = ?',
    [id]
  );
  
  return {
    success: true,
    data: estadoActualizado[0]
  };
},

eliminarEstado: async (id) => {
  // Verificar que el estado existe
  const estadoExistente = await executeQuery(
    'SELECT * FROM estados WHERE id = ?',
    [id]
  );
  
  if (estadoExistente.length === 0) {
    throw new Error('Estado no encontrado');
  }
  
  // Soft delete
  await executeQuery(
    'UPDATE estados SET activo = FALSE WHERE id = ?',
    [id]
  );
  
  return {
    success: true,
    message: 'Estado eliminado correctamente'
  };
}
};

module.exports = catalogosService;
