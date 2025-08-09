// controllers/reparacionController.js - Controlador actualizado

const reparacionService = require('../services/reparacionService');
const { executeQuery } = require('../config/database');

const reparacionController = {

  // ENDPOINT DEFINITIVO PARA LISTA DE REPARACIONES
  obtenerReparacionesSimple: async (req, res) => {
    try {
      console.log('🧪 ENDPOINT DEFINITIVO PARA LISTA');
      
      const query = `
        SELECT 
          r.id,
          r.numero_orden,
          r.estado_general,
          r.fecha_ingreso,
          r.total_final,
          r.anticipo_requerido,
          c.nombre as cliente_nombre,
          c.apellidos as cliente_apellidos,
          c.dni as cliente_dni,
          c.telefono as cliente_telefono
        FROM reparaciones r
        LEFT JOIN clientes c ON r.cliente_id = c.id
        ORDER BY r.fecha_ingreso DESC
        LIMIT 50
      `;
      
      const reparaciones = await executeQuery(query);
      
      res.json({
        success: true,
        data: reparaciones,
        message: `${reparaciones.length} reparaciones encontradas`
      });
    } catch (error) {
      console.error('❌ Error en endpoint de lista:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo lista de reparaciones',
        error: error.message
      });
    }
  },
  
  // Obtener todas las reparaciones - VERSIÓN DEFINITIVA CON NUEVA ESTRUCTURA
  obtenerReparaciones: async (req, res) => {
    try {
      console.log('🔍 Obteniendo reparaciones - NUEVA ESTRUCTURA');
      
      const query = `
        SELECT 
          r.*,
          c.nombre as cliente_nombre,
          c.apellidos as cliente_apellidos,
          c.dni as cliente_dni,
          c.telefono as cliente_telefono,
          COUNT(DISTINCT rd.id) as total_dispositivos,
          COUNT(DISTINCT da.id) as total_averias,
          COUNT(DISTINCT CASE WHEN da.estado_averia = 'reparada' THEN da.id END) as averias_completadas
        FROM reparaciones r
        LEFT JOIN clientes c ON r.cliente_id = c.id
        LEFT JOIN reparacion_detalles rd ON r.id = rd.reparacion_id
        LEFT JOIN dispositivo_averias da ON rd.id = da.reparacion_detalle_id
        GROUP BY r.id
        ORDER BY r.fecha_ingreso DESC
        LIMIT 50
      `;
      
      const reparaciones = await executeQuery(query);
      
      res.json({
        success: true,
        data: reparaciones
      });
    } catch (error) {
      console.error('❌ Error obteniendo reparaciones:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener las reparaciones',
        error: error.message
      });
    }
  },

  // Obtener resumen de reparaciones
  obtenerResumen: async (req, res) => {
    try {
      const resumen = await executeQuery(`
        SELECT 
          COUNT(*) as total_reparaciones,
          COUNT(CASE WHEN estado_general = 'iniciada' THEN 1 END) as iniciadas,
          COUNT(CASE WHEN estado_general = 'en_diagnostico' THEN 1 END) as en_diagnostico,
          COUNT(CASE WHEN estado_general = 'lista' THEN 1 END) as listas,
          COUNT(CASE WHEN estado_general = 'entregada' THEN 1 END) as entregadas,
          AVG(total_final) as promedio_valor,
          SUM(total_final) as valor_total
        FROM reparaciones
      `);
      
      res.json({
        success: true,
        data: resumen[0]
      });
    } catch (error) {
      console.error('❌ Error obteniendo resumen:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener el resumen',
        error: error.message
      });
    }
  },

  // Obtener reparación por ID
  obtenerReparacionPorId: async (req, res) => {
    try {
      const { id } = req.params;
      const reparacion = await reparacionService.obtenerReparacionCompleta(id);
      
      if (!reparacion.reparacion) {
        return res.status(404).json({
          success: false,
          message: 'Reparación no encontrada'
        });
      }
      
      res.json({
        success: true,
        data: reparacion
      });
    } catch (error) {
      console.error('❌ Error obteniendo reparación:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener la reparación',
        error: error.message
      });
    }
  },

  // Crear reparación completa - ACTUALIZADO
  crearReparacionCompleta: async (req, res) => {
    try {
      console.log('📥 Recibiendo solicitud de creación de reparación...');
      console.log('📋 Headers:', req.headers);
      console.log('📦 Body recibido:', JSON.stringify(req.body, null, 2));
      
      // Validar que lleguen los datos
      if (!req.body) {
        return res.status(400).json({
          success: false,
          message: 'No se recibieron datos en el cuerpo de la petición'
        });
      }
      
      const { cliente, terminales, totales, metadatos } = req.body;
      
      // Validaciones básicas
      if (!cliente) {
        return res.status(400).json({
          success: false,
          message: 'Faltan los datos del cliente'
        });
      }
      
      if (!terminales || !Array.isArray(terminales) || terminales.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Debe incluir al menos un terminal'
        });
      }
      
      // Validar estructura de cada terminal
      for (let i = 0; i < terminales.length; i++) {
        const terminal = terminales[i];
        
        if (!terminal.dispositivo) {
          return res.status(400).json({
            success: false,
            message: `Terminal ${i + 1}: Faltan datos del dispositivo`
          });
        }
        
        if (!terminal.diagnostico) {
          return res.status(400).json({
            success: false,
            message: `Terminal ${i + 1}: Faltan datos del diagnóstico`
          });
        }
        
        if (!terminal.presupuesto) {
          return res.status(400).json({
            success: false,
            message: `Terminal ${i + 1}: Faltan datos del presupuesto`
          });
        }
      }
      
      console.log('✅ Validaciones iniciales pasadas');
      console.log(`📱 Procesando ${terminales.length} terminal${terminales.length > 1 ? 'es' : ''}`);
      
      // Llamar al servicio
      const resultado = await reparacionService.crearReparacionCompleta(req.body);
      
      console.log('✅ Reparación creada exitosamente:', resultado);
      
      // Respuesta de éxito
      res.status(201).json({
        success: true,
        message: 'Reparación creada exitosamente',
        data: resultado.data
      });
      
    } catch (error) {
      console.error('❌ Error creando reparación:', error);
      
      // Determinar el tipo de error
      let statusCode = 500;
      let mensaje = 'Error interno del servidor';
      
      if (error.message.includes('incompletos') || error.message.includes('inválidos')) {
        statusCode = 400;
        mensaje = 'Datos incompletos o inválidos';
      } else if (error.message.includes('no encontrado')) {
        statusCode = 404;
        mensaje = 'Recurso no encontrado';
      } else if (error.message.includes('duplicado')) {
        statusCode = 409;
        mensaje = 'Conflicto con datos existentes';
      }
      
      res.status(statusCode).json({
        success: false,
        message: mensaje,
        error: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  },

  // Actualizar estado de reparación
  actualizarEstado: async (req, res) => {
    try {
      const { id } = req.params;
      const { estado, notas } = req.body;
      
      if (!estado) {
        return res.status(400).json({
          success: false,
          message: 'El estado es requerido'
        });
      }
      
      await reparacionService.actualizarEstado(id, estado, notas);
      
      res.json({
        success: true,
        message: 'Estado actualizado correctamente'
      });
    } catch (error) {
      console.error('❌ Error actualizando estado:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar el estado',
        error: error.message
      });
    }
  },

  // Eliminar reparación
  eliminarReparacion: async (req, res) => {
    try {
      const { id } = req.params;
      const numeroOrden = await reparacionService.eliminarReparacion(id);
      
      res.json({
        success: true,
        message: `Reparación ${numeroOrden} eliminada correctamente`
      });
    } catch (error) {
      console.error('❌ Error eliminando reparación:', error);
      res.status(500).json({
        success: false,
        message: 'Error al eliminar la reparación',
        error: error.message
      });
    }
  },

  // Obtener estadísticas
  obtenerEstadisticas: async (req, res) => {
    try {
      const estadisticas = await reparacionService.obtenerEstadisticas();
      
      res.json({
        success: true,
        data: estadisticas
      });
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener las estadísticas',
        error: error.message
      });
    }
  },

  actualizarReparacionCompleta: async (req, res) => {
  try {
    console.log('📝 Recibiendo actualización de reparación...');
    console.log('📦 Body recibido:', JSON.stringify(req.body, null, 2));
    
    const { id } = req.params;
    const { cliente, terminales, totales, reparacion_id } = req.body;
    
    // Validaciones básicas
    if (!cliente || !terminales || !Array.isArray(terminales)) {
      return res.status(400).json({
        success: false,
        message: 'Datos incompletos para la actualización'
      });
    }
    
    console.log(`🔄 Actualizando reparación ID: ${id}`);
    console.log(`👤 Cliente: ${cliente.nombre} ${cliente.apellidos}`);
    console.log(`📱 Terminales: ${terminales.length}`);
    
    const resultado = await reparacionService.actualizarReparacionCompleta({
      reparacionId: parseInt(id),
      cliente,
      terminales,
      totales
    });
    
    console.log('✅ Reparación actualizada exitosamente:', resultado);
    
    res.json({
      success: true,
      message: 'Reparación actualizada exitosamente',
      data: resultado
    });
    
  } catch (error) {
    console.error('❌ Error actualizando reparación:', error);
    
    let statusCode = 500;
    let mensaje = 'Error interno del servidor';
    
    if (error.message.includes('no encontrada')) {
      statusCode = 404;
      mensaje = 'Reparación no encontrada';
    } else if (error.message.includes('datos inválidos')) {
      statusCode = 400;
      mensaje = 'Datos inválidos para la actualización';
    }
    
    res.status(statusCode).json({
      success: false,
      message: mensaje,
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
};

module.exports = reparacionController;