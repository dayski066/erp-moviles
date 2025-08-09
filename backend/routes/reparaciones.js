// routes/reparaciones.js - Rutas específicas de reparaciones

const express = require('express');
const router = express.Router();
const reparacionController = require('../controllers/reparacionController');

// =====================================================
// RUTAS DE REPARACIONES
// =====================================================

// GET /api/reparaciones/lista-limpia - ENDPOINT COMPLETAMENTE LIMPIO
router.get('/lista-limpia', async (req, res) => {
  try {
    const { executeQuery } = require('../config/database');
    
    console.log('🔍 Endpoint completamente nuevo - sin legacy');
    
    const query = `
      SELECT 
        r.id,
        r.numero_orden,
        r.estado_general,
        r.fecha_ingreso,
        r.total_final,
        r.cliente_id
      FROM reparaciones r
      ORDER BY r.fecha_ingreso DESC
      LIMIT 50
    `;
    
    const reparaciones = await executeQuery(query);
    
    console.log(`✅ Reparaciones encontradas: ${reparaciones.length}`);
    
    res.json({
      success: true,
      data: reparaciones,
      message: `${reparaciones.length} reparaciones encontradas - ENDPOINT LIMPIO`
    });
  } catch (error) {
    console.error('❌ Error en endpoint nuevo:', error);
    res.status(500).json({
      success: false,
      message: 'Error en endpoint nuevo',
      error: error.message
    });
  }
});

// GET /api/reparaciones/test - ENDPOINT TEMPORAL DE PRUEBA
router.get('/test', reparacionController.obtenerReparacionesSimple);

// GET /api/reparaciones/buscar - Buscar reparaciones con filtros
router.get('/buscar', async (req, res) => {
  try {
    const { executeQuery } = require('../config/database');
    const { estado, limit = 50, offset = 0 } = req.query;
    
    console.log('🔍 Buscando reparaciones con filtros:', { estado, limit, offset });
    
    let whereClause = '';
    let params = [];
    
    if (estado && estado !== 'todos') {
      whereClause = 'WHERE r.estado_general = ?';
      params.push(estado);
    }
    
    const query = `
      SELECT 
        r.id,
        r.numero_orden,
        r.estado_general,
        r.fecha_ingreso,
        r.total_final,
        r.anticipo_pagado,
        c.nombre as cliente_nombre,
        c.apellidos as cliente_apellidos,
        c.telefono as cliente_telefono,
        c.dni as cliente_dni,
        (SELECT COUNT(*) FROM reparacion_detalles WHERE reparacion_id = r.id) as total_dispositivos,
        (SELECT COUNT(*) FROM dispositivo_averias da 
         JOIN reparacion_detalles rd ON da.reparacion_detalle_id = rd.id 
         WHERE rd.reparacion_id = r.id) as total_averias
      FROM reparaciones r
      LEFT JOIN clientes c ON r.cliente_id = c.id
      ${whereClause}
      ORDER BY r.fecha_ingreso DESC
      LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
    `;
    
    const reparaciones = await executeQuery(query, params);
    
    console.log(`✅ Encontradas ${reparaciones.length} reparaciones`);
    
    res.json({
      success: true,
      data: reparaciones,
      message: `Encontradas ${reparaciones.length} reparaciones`
    });
  } catch (error) {
    console.error('❌ Error buscando reparaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al buscar reparaciones',
      error: error.message
    });
  }
});

// GET /api/reparaciones - Obtener lista de reparaciones
router.get('/', reparacionController.obtenerReparaciones);

// GET /api/reparaciones/resumen - Obtener resumen usando vista
router.get('/resumen', reparacionController.obtenerResumen);

// GET /api/reparaciones/stats/resumen - Obtener resumen de estadísticas
router.get('/stats/resumen', async (req, res) => {
  try {
    const { executeQuery } = require('../config/database');
    
    const resumen = await executeQuery(`
      SELECT 
        COUNT(*) as total_reparaciones,
        COUNT(CASE WHEN estado_general = 'iniciada' THEN 1 END) as iniciadas,
        COUNT(CASE WHEN estado_general = 'en_proceso' THEN 1 END) as en_proceso,
        COUNT(CASE WHEN estado_general = 'completada' THEN 1 END) as completadas,
        COUNT(CASE WHEN estado_general = 'entregada' THEN 1 END) as entregadas,
        SUM(total_final) as ingresos_totales,
        SUM(anticipo_pagado) as anticipos_totales,
        AVG(total_final) as ticket_promedio
      FROM reparaciones
      WHERE DATE(fecha_ingreso) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    `);
    
    res.json({
      success: true,
      data: resumen[0] || {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error obteniendo resumen de estadísticas',
      error: error.message
    });
  }
});

// GET /api/reparaciones/stats/dashboard - Obtener estadísticas
router.get('/stats/dashboard', reparacionController.obtenerEstadisticas);

// GET /api/reparaciones/:id/historial - Obtener historial de reparación
router.get('/:id/historial', async (req, res) => {
  try {
    const { executeQuery } = require('../config/database');
    const { id } = req.params;
    
    const historial = await executeQuery(`
      SELECT * FROM reparacion_historial 
      WHERE reparacion_id = ? 
      ORDER BY created_at DESC
    `, [id]);
    
    res.json({
      success: true,
      data: historial
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error obteniendo historial',
      error: error.message
    });
  }
});

// GET /api/reparaciones/:id/dispositivos - Obtener dispositivos de una reparación
router.get('/:id/dispositivos', async (req, res) => {
  try {
    const { executeQuery } = require('../config/database');
    const { id } = req.params;
    
    const dispositivos = await executeQuery(`
      SELECT 
        rd.*,
        m.nombre as marca_nombre,
        mod.nombre as modelo_nombre
      FROM reparacion_detalles rd
      LEFT JOIN marcas m ON rd.marca_id = m.id
      LEFT JOIN modelos mod ON rd.modelo_id = mod.id
      WHERE rd.reparacion_id = ?
      ORDER BY rd.id ASC
    `, [id]);
    
    res.json({
      success: true,
      data: dispositivos
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error obteniendo dispositivos',
      error: error.message
    });
  }
});

// GET /api/reparaciones/:id/pagos - Obtener pagos de una reparación
router.get('/:id/pagos', async (req, res) => {
  try {
    const { executeQuery } = require('../config/database');
    const { id } = req.params;
    
    const pagos = await executeQuery(`
      SELECT * FROM reparacion_pagos 
      WHERE reparacion_id = ? 
      ORDER BY fecha_pago DESC
    `, [id]);
    
    res.json({
      success: true,
      data: pagos
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error obteniendo pagos',
      error: error.message
    });
  }
});

// GET /api/reparaciones/dispositivos/:id/averias - Obtener averías de un dispositivo
router.get('/dispositivos/:id/averias', async (req, res) => {
  try {
    const { executeQuery } = require('../config/database');
    const { id } = req.params;
    
    const averias = await executeQuery(`
      SELECT 
        da.*,
        a.nombre as averia_nombre,
        a.descripcion as averia_descripcion
      FROM dispositivo_averias da
      LEFT JOIN averias a ON da.averia_id = a.id
      WHERE da.reparacion_detalle_id = ?
      ORDER BY da.id ASC
    `, [id]);
    
    res.json({
      success: true,
      data: averias
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error obteniendo averías',
      error: error.message
    });
  }
});

// GET /api/reparaciones/averias/:id/intervenciones - Obtener intervenciones de una avería
router.get('/averias/:id/intervenciones', async (req, res) => {
  try {
    const { executeQuery } = require('../config/database');
    const { id } = req.params;
    
    const intervenciones = await executeQuery(`
      SELECT 
        ai.*,
        i.nombre as intervencion_nombre,
        i.descripcion as intervencion_descripcion,
        i.precio_base
      FROM averia_intervenciones ai
      LEFT JOIN intervenciones i ON ai.intervencion_id = i.id
      WHERE ai.dispositivo_averia_id = ?
      ORDER BY ai.id ASC
    `, [id]);
    
    res.json({
      success: true,
      data: intervenciones
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error obteniendo intervenciones',
      error: error.message
    });
  }
});

// GET /api/reparaciones/:id - Obtener reparación por ID
router.get('/:id', reparacionController.obtenerReparacionPorId);

// POST /api/reparaciones/crear-completa - Crear reparación completa
router.post('/crear-completa', reparacionController.crearReparacionCompleta);

// POST /api/reparaciones/draft - Guardar borrador de reparación
router.post('/draft', async (req, res) => {
  try {
    const { executeQuery } = require('../config/database');
    const draftData = req.body;
    
    console.log('💾 Guardando borrador de reparación...');
    
    // Guardar en localStorage del servidor (simulado)
    // En producción, esto se guardaría en una tabla específica
    const draftId = `draft_${Date.now()}`;
    
    // Por ahora, solo confirmamos que se recibió el borrador
    console.log('✅ Borrador recibido:', {
      cliente: draftData.cliente?.nombre,
      dispositivos: draftData.dispositivos?.length || 0,
      diagnosticos: draftData.diagnosticos?.length || 0
    });
    
    res.json({
      success: true,
      message: 'Borrador guardado correctamente',
      draftId: draftId
    });
    
  } catch (error) {
    console.error('❌ Error guardando borrador:', error);
    res.status(500).json({
      success: false,
      message: 'Error guardando borrador',
      error: error.message
    });
  }
});

// PATCH /api/reparaciones/:id/estado - Actualizar estado
router.patch('/:id/estado', reparacionController.actualizarEstado);

// DELETE /api/reparaciones/:id - Eliminar reparación
router.delete('/:id', reparacionController.eliminarReparacion);

router.put('/:id/actualizar-completa', reparacionController.actualizarReparacionCompleta);

// PUT /api/reparaciones/dispositivo/:id/estado - Actualizar estado de un dispositivo específico
router.put('/dispositivo/:id/estado', async (req, res) => {
  try {
    const { executeQuery } = require('../config/database');
    const dispositivoId = req.params.id;
    const { estado_id } = req.body;
    
    console.log(`🔄 Actualizando estado del dispositivo ${dispositivoId} a estado ${estado_id}`);
    
    // Verificar que el dispositivo existe
    const dispositivo = await executeQuery(
      'SELECT id FROM reparacion_detalles WHERE id = ?',
      [dispositivoId]
    );
    
    if (dispositivo.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Dispositivo no encontrado'
      });
    }
    
    // Verificar que el estado existe
    const estado = await executeQuery(
      'SELECT id, nombre FROM estados WHERE id = ?',
      [estado_id]
    );
    
    if (estado.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Estado no encontrado'
      });
    }
    
    // Actualizar el estado del dispositivo
    await executeQuery(
      'UPDATE reparacion_detalles SET estado_id = ? WHERE id = ?',
      [estado_id, dispositivoId]
    );
    
    console.log(`✅ Estado del dispositivo ${dispositivoId} actualizado a "${estado[0].nombre}"`);
    
    res.json({
      success: true,
      message: `Estado actualizado a "${estado[0].nombre}"`,
      data: {
        dispositivo_id: dispositivoId,
        nuevo_estado_id: estado_id,
        nuevo_estado_nombre: estado[0].nombre
      }
    });
    
  } catch (error) {
    console.error('❌ Error actualizando estado del dispositivo:', error);
    res.status(500).json({
      success: false,
      message: 'Error actualizando estado del dispositivo',
      error: error.message
    });
  }
});

module.exports = router;