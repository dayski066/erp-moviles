// services/reparacionServiceNew.js - Servicio optimizado con nueva estructura
const ReparacionModelNew = require('../models/modules/reparaciones/ReparacionModelNew');
const { executeQuery } = require('../config/database');

const reparacionServiceNew = {

  // =============================================
  // SERVICIOS DE CONSULTA OPTIMIZADOS
  // =============================================

  async obtenerReparaciones(limit = 50, offset = 0, estado = null) {
    try {
      console.log(`🔍 SIMPLE TEST: Obteniendo reparaciones sin parámetros`);
      
      // Test más simple posible - query sin parámetros
      const simpleQuery = `SELECT id, numero_orden, estado_general FROM reparaciones LIMIT 5`;
      const reparaciones = await executeQuery(simpleQuery, []);
      
      console.log(`📋 Reparaciones obtenidas: ${reparaciones.length}`);
      return {
        success: true,
        data: reparaciones
      };
    } catch (error) {
      console.error('❌ Error obteniendo reparaciones:', error);
      throw error;
    }
  },

  async obtenerReparacionCompleta(id) {
    try {
      const reparacionModel = new ReparacionModelNew();
      const reparacionCompleta = await reparacionModel.findCompleteById(id);
      
      if (!reparacionCompleta.reparacion) {
        throw new Error('Reparación no encontrada');
      }

      console.log(`📋 Reparación completa obtenida: ${reparacionCompleta.reparacion.numero_orden}`);
      return {
        success: true,
        data: reparacionCompleta
      };
    } catch (error) {
      console.error('❌ Error obteniendo reparación completa:', error);
      throw error;
    }
  },

  // =============================================
  // SERVICIO DE CREACIÓN OPTIMIZADO
  // =============================================

  async crearReparacionCompleta(data) {
    try {
      console.log('🔄 Iniciando creación de reparación con estructura optimizada...');
      
      // Validaciones previas
      if (!data.cliente || !data.cliente.dni) {
        throw new Error('Datos del cliente incompletos');
      }

      if (!data.terminales || data.terminales.length === 0) {
        throw new Error('Debe incluir al menos un dispositivo');
      }

      // Validar estructura de cada terminal
      for (let i = 0; i < data.terminales.length; i++) {
        const terminal = data.terminales[i];
        
        if (!terminal.dispositivo?.marca || !terminal.dispositivo?.modelo) {
          throw new Error(`Terminal ${i + 1}: Falta información de marca/modelo`);
        }

        if (!terminal.diagnostico?.problemas_reportados?.length) {
          throw new Error(`Terminal ${i + 1}: Falta diagnóstico`);
        }

        if (!terminal.presupuesto?.presupuestoPorAveria?.length) {
          throw new Error(`Terminal ${i + 1}: Falta presupuesto`);
        }
      }

      console.log('✅ Validaciones iniciales pasadas');

      const reparacionModel = new ReparacionModelNew();
      const resultado = await reparacionModel.createComplete(data);

      console.log('✅ Reparación creada exitosamente con nueva estructura');
      return {
        success: true,
        data: resultado
      };

    } catch (error) {
      console.error('❌ Error creando reparación:', error);
      throw error;
    }
  },

  // =============================================
  // SERVICIOS DE ACTUALIZACIÓN
  // =============================================

  async actualizarEstado(id, estado, notas, userId = 1) {
    try {
      const reparacionModel = new ReparacionModelNew();
      
      // Verificar que la reparación existe
      const reparacion = await reparacionModel.findById(id);
      if (!reparacion) {
        throw new Error('Reparación no encontrada');
      }

      await reparacionModel.actualizarEstado(id, estado, notas, userId);

      console.log(`✅ Estado actualizado: ${reparacion.numero_orden} → ${estado}`);
      return {
        success: true,
        message: 'Estado actualizado correctamente'
      };
    } catch (error) {
      console.error('❌ Error actualizando estado:', error);
      throw error;
    }
  },

  // =============================================
  // SERVICIOS DE BÚSQUEDA Y FILTRADO
  // =============================================

  async buscarReparaciones(filtros = {}) {
    try {
      const reparacionModel = new ReparacionModelNew();
      const reparaciones = await reparacionModel.buscarConFiltros(filtros);
      
      console.log(`🔍 Búsqueda realizada: ${reparaciones.length} resultados`);
      return {
        success: true,
        data: reparaciones,
        filtros_aplicados: filtros
      };
    } catch (error) {
      console.error('❌ Error en búsqueda:', error);
      throw error;
    }
  },

  // =============================================
  // SERVICIOS DE ESTADÍSTICAS OPTIMIZADAS
  // =============================================

  async obtenerEstadisticas() {
    try {
      // Consulta optimizada para estadísticas generales
      const [stats] = await executeQuery(`
        SELECT 
          COUNT(*) as total_reparaciones,
          COUNT(CASE WHEN estado_general IN ('iniciada', 'en_diagnostico', 'esperando_aprobacion', 'en_ejecucion') THEN 1 END) as activas,
          COUNT(CASE WHEN estado_general = 'lista' THEN 1 END) as listas,
          COUNT(CASE WHEN estado_general = 'entregada' THEN 1 END) as entregadas,
          COUNT(CASE WHEN DATE(fecha_ingreso) = CURDATE() THEN 1 END) as hoy,
          COUNT(CASE WHEN WEEK(fecha_ingreso) = WEEK(CURDATE()) AND YEAR(fecha_ingreso) = YEAR(CURDATE()) THEN 1 END) as esta_semana,
          AVG(total_final) as promedio_valor,
          SUM(total_final) as valor_total
        FROM reparaciones
      `);

      // Estados por cantidad
      const estadosPorCount = await executeQuery(`
        SELECT 
          estado_general,
          COUNT(*) as cantidad
        FROM reparaciones
        GROUP BY estado_general
        ORDER BY cantidad DESC
      `);

      // Reparaciones urgentes (con nueva estructura)
      const urgentes = await executeQuery(`
        SELECT DISTINCT
          r.numero_orden,
          r.estado_general,
          c.nombre,
          c.telefono,
          da.fecha_estimada_finalizacion
        FROM reparaciones r
        LEFT JOIN clientes c ON r.cliente_id = c.id
        LEFT JOIN reparacion_detalles rd ON r.id = rd.reparacion_id
        LEFT JOIN dispositivo_averias da ON rd.id = da.reparacion_detalle_id
        WHERE da.fecha_estimada_finalizacion <= DATE_ADD(CURDATE(), INTERVAL 2 DAY)
          AND r.estado_general NOT IN ('lista', 'entregada', 'cancelada')
        ORDER BY da.fecha_estimada_finalizacion
        LIMIT 10
      `);

      return {
        success: true,
        data: {
          resumen: stats,
          por_estado: estadosPorCount,
          urgentes: urgentes
        }
      };
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      throw error;
    }
  },

  // =============================================
  // SERVICIOS DE DISPOSITIVOS Y AVERÍAS
  // =============================================

  async obtenerDispositivosPorReparacion(reparacionId) {
    try {
      const dispositivos = await executeQuery(`
        SELECT 
          rd.*,
          ma.nombre as marca_nombre,
          mo.nombre as modelo_nombre,
          mo.imagen_url as modelo_imagen,
          COUNT(DISTINCT da.id) as total_averias,
          COUNT(DISTINCT ai.id) as total_intervenciones,
          SUM(ai.precio_total) as total_dispositivo_calculado
        FROM reparacion_detalles rd
        LEFT JOIN marcas ma ON rd.marca_id = ma.id
        LEFT JOIN modelos mo ON rd.modelo_id = mo.id
        LEFT JOIN dispositivo_averias da ON rd.id = da.reparacion_detalle_id
        LEFT JOIN averia_intervenciones ai ON da.id = ai.dispositivo_averia_id
        WHERE rd.reparacion_id = ?
        GROUP BY rd.id
        ORDER BY rd.created_at ASC
      `, [reparacionId]);

      return {
        success: true,
        data: dispositivos
      };
    } catch (error) {
      console.error('❌ Error obteniendo dispositivos:', error);
      throw error;
    }
  },

  async obtenerAveriasPorDispositivo(dispositivoId) {
    try {
      const averias = await executeQuery(`
        SELECT 
          da.*,
          a.nombre as averia_nombre,
          a.categoria as averia_categoria,
          COUNT(DISTINCT ai.id) as total_intervenciones,
          SUM(ai.precio_total) as total_averia_calculado
        FROM dispositivo_averias da
        LEFT JOIN averias a ON da.averia_id = a.id
        LEFT JOIN averia_intervenciones ai ON da.id = ai.dispositivo_averia_id
        WHERE da.reparacion_detalle_id = ?
        GROUP BY da.id
        ORDER BY da.created_at ASC
      `, [dispositivoId]);

      return {
        success: true,
        data: averias
      };
    } catch (error) {
      console.error('❌ Error obteniendo averías:', error);
      throw error;
    }
  },

  async obtenerIntervencionesPorAveria(averiaId) {
    try {
      const intervenciones = await executeQuery(`
        SELECT 
          ai.*,
          i.nombre as intervencion_nombre,
          i.tipo as intervencion_tipo,
          i.descripcion as intervencion_descripcion
        FROM averia_intervenciones ai
        LEFT JOIN intervenciones i ON ai.intervencion_id = i.id
        WHERE ai.dispositivo_averia_id = ?
        ORDER BY ai.created_at ASC
      `, [averiaId]);

      return {
        success: true,
        data: intervenciones
      };
    } catch (error) {
      console.error('❌ Error obteniendo intervenciones:', error);
      throw error;
    }
  },

  // =============================================
  // SERVICIOS DE HISTORIAL Y COMUNICACIONES
  // =============================================

  async obtenerHistorial(reparacionId) {
    try {
      const historial = await executeQuery(`
        SELECT 
          rh.*,
          'Sistema' as usuario_nombre
        FROM reparacion_historial rh
        WHERE rh.reparacion_id = ?
        ORDER BY rh.created_at DESC
      `, [reparacionId]);

      return {
        success: true,
        data: historial
      };
    } catch (error) {
      console.error('❌ Error obteniendo historial:', error);
      throw error;
    }
  },

  async obtenerPagos(reparacionId) {
    try {
      const pagos = await executeQuery(`
        SELECT * FROM reparacion_pagos
        WHERE reparacion_id = ?
        ORDER BY fecha_pago DESC
      `, [reparacionId]);

      return {
        success: true,
        data: pagos
      };
    } catch (error) {
      console.error('❌ Error obteniendo pagos:', error);
      throw error;
    }
  },

  // =============================================
  // SERVICIOS DE VALIDACIÓN
  // =============================================

  async validarEstructuraReparacion(data) {
    try {
      const errores = [];

      // Validar cliente
      if (!data.cliente?.dni) {
        errores.push('DNI del cliente es requerido');
      }

      // Validar terminales
      if (!data.terminales?.length) {
        errores.push('Debe incluir al menos un dispositivo');
      } else {
        data.terminales.forEach((terminal, index) => {
          if (!terminal.dispositivo?.marca) {
            errores.push(`Terminal ${index + 1}: Marca es requerida`);
          }
          if (!terminal.dispositivo?.modelo) {
            errores.push(`Terminal ${index + 1}: Modelo es requerido`);
          }
          if (!terminal.diagnostico?.problemas_reportados?.length) {
            errores.push(`Terminal ${index + 1}: Debe tener al menos una avería`);
          }
          if (!terminal.presupuesto?.presupuestoPorAveria?.length) {
            errores.push(`Terminal ${index + 1}: Debe tener presupuesto`);
          }
        });
      }

      return {
        success: errores.length === 0,
        errores: errores
      };
    } catch (error) {
      console.error('❌ Error validando estructura:', error);
      return {
        success: false,
        errores: ['Error interno en validación']
      };
    }
  }
};

module.exports = reparacionServiceNew;