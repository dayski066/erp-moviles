// services/reparacionService.js - Versión corregida completa con integración de contadores
const { executeQuery, createConnection } = require('../config/database');
const catalogosService = require('./catalogosService');

const reparacionService = {
  
  // Obtener todas las reparaciones con información básica - TEMPORAL SIMPLIFICADO
  obtenerReparaciones: async (limit = 50, offset = 0, estado = null) => {
    try {
      // Query súper simple para que funcione por ahora
      const query = `
        SELECT 
          r.*,
          c.nombre as cliente_nombre,
          c.apellidos as cliente_apellidos,
          c.telefono as cliente_telefono,
          c.dni as cliente_dni
        FROM reparaciones r
        LEFT JOIN clientes c ON r.cliente_id = c.id
        ORDER BY r.fecha_ingreso DESC
        LIMIT 50
      `;

      return await executeQuery(query);
    } catch (error) {
      console.error('❌ Error en obtenerReparaciones:', error);
      throw error;
    }
  },

  // ✅ NUEVA FUNCIÓN: Obtener reparaciones con detalles completos (para sugerencias)
  obtenerReparacionesConDetalles: async ({ estado = null, limit = 50, offset = 0 }) => {
    try {
      console.log('🔄 Obteniendo reparaciones con detalles completos...');
      console.log('📊 Filtros:', { estado, limit, offset });

      let whereClause = '';
      let params = [];
      
      if (estado) {
        // Mapear estado del frontend a estado de BD
        const estadoMapeado = estado === 'completada' ? 'entregada' : estado;
        whereClause = 'WHERE r.estado_general = ?';
        params.push(estadoMapeado);
      }

      // 1. Obtener reparaciones principales
      const reparaciones = await executeQuery(`
        SELECT 
          r.id,
          r.numero_orden,
          r.estado_general,
          r.fecha_ingreso as fecha_creacion,
          r.total_final as total,
          r.cliente_id,
          c.nombre,
          c.apellidos,
          c.telefono,
          c.email,
          c.dni,
          c.direccion,
          c.codigo_postal as codigoPostal,
          '' as ciudad
        FROM reparaciones r
        LEFT JOIN clientes c ON r.cliente_id = c.id
        ${whereClause}
        ORDER BY r.fecha_ingreso DESC
        LIMIT ${limit} OFFSET ${offset}
      `, params);

      console.log(`📋 Encontradas ${reparaciones.length} reparaciones`);

      // 2. Para cada reparación, obtener dispositivos y diagnósticos
      const reparacionesCompletas = [];
      
      for (const reparacion of reparaciones) {
        // Obtener dispositivos
        const dispositivos = await executeQuery(`
          SELECT 
            rd.marca,
            rd.modelo,
            rd.capacidad,
            rd.color,
            rd.imei,
            rd.numero_serie,
            e.codigo as estado,
            rd.observaciones_recepcion as observaciones
          FROM reparacion_detalles rd
          LEFT JOIN estados e ON rd.estado_id = e.id
          WHERE rd.reparacion_id = ?
        `, [reparacion.id]);

        // Obtener diagnósticos/averías
        const diagnosticos = await executeQuery(`
          SELECT 
            da.problema_principal,
            da.descripcion_cliente,
            da.sintomas_observados,
            da.prioridad,
            da.categoria,
            da.tipo_servicio
          FROM dispositivo_averias da
          LEFT JOIN reparacion_detalles rd ON da.dispositivo_id = rd.id
          WHERE rd.reparacion_id = ?
        `, [reparacion.id]);

        // Formatear la reparación completa
        const reparacionCompleta = {
          id: reparacion.id,
          numero_orden: reparacion.numero_orden,
          cliente_id: reparacion.cliente_id,
          fecha_creacion: reparacion.fecha_creacion,
          estado: reparacion.estado_general,
          total: parseFloat(reparacion.total) || 0,
          cliente: {
            nombre: reparacion.nombre || '',
            apellidos: reparacion.apellidos || '',
            dni: reparacion.dni || '',
            telefono: reparacion.telefono || '',
            email: reparacion.email || '',
            direccion: reparacion.direccion || '',
            codigoPostal: reparacion.codigoPostal || '',
            ciudad: reparacion.ciudad || ''
          },
          dispositivos: dispositivos,
          diagnosticos: diagnosticos.map(d => ({
            problemas_reportados: d.problema_principal ? [d.problema_principal] : [],
            tipo_servicio: d.tipo_servicio || 'reparacion',
            prioridad: d.prioridad || 'normal'
          }))
        };

        reparacionesCompletas.push(reparacionCompleta);
      }

      console.log(`✅ Procesadas ${reparacionesCompletas.length} reparaciones con detalles`);
      return reparacionesCompletas;
      
    } catch (error) {
      console.error('❌ Error obteniendo reparaciones con detalles:', error);
      throw error;
    }
  },
  
  // Obtener reparación completa con todos los detalles
  obtenerReparacionCompleta: async (id) => {
    // 1. Obtener reparación con cliente y establecimiento
    const [reparacion] = await executeQuery(`
      SELECT 
        r.*,
        c.nombre, 
        c.apellidos, 
        c.telefono, 
        c.email, 
        c.dni,
        c.direccion,
        c.codigo_postal,
        c.fecha_registro as cliente_fecha_registro,
        e.nombre as establecimiento_nombre,
        e.direccion as establecimiento_direccion,
        e.telefono as establecimiento_telefono
      FROM reparaciones r
      LEFT JOIN clientes c ON r.cliente_id = c.id
      LEFT JOIN establecimientos e ON r.establecimiento_id = e.id
      WHERE r.id = ?
    `, [id]);
    
    if (!reparacion) {
      return { reparacion: null };
    }
    
    // 2. Obtener dispositivos con sus averías
    const dispositivos = await executeQuery(`
      SELECT 
        rd.id,
        rd.reparacion_id,
        rd.marca_id,
        rd.modelo_id,
        rd.imei,
        rd.numero_serie,
        rd.color,
        rd.capacidad,
        rd.estado_id as estado_dispositivo,
        rd.observaciones_recepcion,
        rd.sintomas_adicionales,
        rd.prioridad,
        rd.tipo_servicio,
        rd.observaciones_tecnicas,
        rd.patron_desbloqueo,
        rd.requiere_backup,
        rd.total_dispositivo,
        rd.establecimiento_id,
        rd.created_at,
        rd.created_by,
        rd.updated_at,
        rd.updated_by,
        m.nombre as marca_nombre,
        mo.nombre as modelo_nombre,
        COUNT(da.id) as total_averias,
        COUNT(CASE WHEN da.estado_averia = 'reparada' THEN 1 END) as averias_completadas,
        COUNT(CASE WHEN da.estado_averia IN ('aprobada', 'en_reparacion', 'reparada') THEN 1 END) as averias_aprobadas
      FROM reparacion_detalles rd
      LEFT JOIN marcas m ON rd.marca_id = m.id  
      LEFT JOIN modelos mo ON rd.modelo_id = mo.id
      LEFT JOIN dispositivo_averias da ON rd.id = da.reparacion_detalle_id
      WHERE rd.reparacion_id = ?
      GROUP BY rd.id
      ORDER BY rd.created_at
    `, [id]);
    
    // 3. Obtener todas las averías con nombres de avería
    const averias = await executeQuery(`
      SELECT 
        da.*,
        a.nombre as averia_nombre,
        a.categoria as averia_categoria,
        m.nombre as dispositivo_marca,
        mo.nombre as dispositivo_modelo,
        rd.imei as dispositivo_imei,
        COUNT(DISTINCT ai.id) as total_intervenciones,
        COUNT(DISTINCT CASE WHEN ai.estado_intervencion = 'completada' THEN ai.id END) as intervenciones_completadas
      FROM dispositivo_averias da
      LEFT JOIN averias a ON da.averia_id = a.id
      LEFT JOIN reparacion_detalles rd ON da.reparacion_detalle_id = rd.id
      LEFT JOIN marcas m ON rd.marca_id = m.id
      LEFT JOIN modelos mo ON rd.modelo_id = mo.id
      LEFT JOIN averia_intervenciones ai ON da.id = ai.dispositivo_averia_id
      WHERE rd.reparacion_id = ?
      GROUP BY da.id
      ORDER BY da.fecha_deteccion
    `, [id]);

    console.log(`🔍 DEBUG - Averías encontradas: ${averias.length}`);
    averias.forEach(averia => {
      console.log(`📊 Avería ${averia.id} ("${averia.averia_nombre}"):`);
      console.log(`   - Intervenciones: ${averia.total_intervenciones}/${averia.intervenciones_completadas}`);
      console.log(`   - Categoría: ${averia.averia_categoria}`);
    });
    
    // 4. Obtener servicios detallados para cada avería - MEJORADO
    for (let averia of averias) {
      const servicios = await executeQuery(`
        SELECT 
          ai.*,
          COALESCE(ai.precio_total, 0) as precio_total_limpio,
          COALESCE(ai.precio_unitario, 0) as precio_unitario_limpio,
          COALESCE(ai.cantidad, 1) as cantidad_limpia,
          i.nombre as concepto
        FROM averia_intervenciones ai
        LEFT JOIN intervenciones i ON ai.intervencion_id = i.id
        WHERE ai.dispositivo_averia_id = ?
        ORDER BY ai.id
      `, [averia.id]);
      
      averia.servicios = servicios || [];
      
      // Recalcular total basado en servicios (para verificar consistencia)
      const totalCalculado = servicios.reduce((total, servicio) => 
        total + (parseFloat(servicio.precio_total_limpio) || 0), 0
      );
      
      
      // Si hay diferencia significativa, actualizar
      if (Math.abs(parseFloat(averia.total_averia) - totalCalculado) > 0.01) {
        console.log(`⚠️ Diferencia en totales, actualizando avería...`);
        await executeQuery(`
          UPDATE dispositivo_averias 
          SET total_averia = ?, subtotal_averia = ?
          WHERE id = ?
        `, [totalCalculado, totalCalculado, averia.id]);
        averia.total_averia = totalCalculado;
      }
    }
    
    // 5. Obtener historial de pagos
    const pagos = await executeQuery(`
      SELECT rp.* FROM reparacion_pagos rp
      WHERE rp.reparacion_id = ?
      ORDER BY rp.fecha_pago DESC
    `, [id]);
    
    // 6. Obtener todas las intervenciones por separado
    const intervenciones = await executeQuery(`
      SELECT 
        ai.*,
        i.nombre as intervencion_nombre,
        i.tipo as intervencion_tipo,
        da.id as dispositivo_averia_id,
        a.nombre as averia_nombre
      FROM averia_intervenciones ai
      LEFT JOIN intervenciones i ON ai.intervencion_id = i.id
      LEFT JOIN dispositivo_averias da ON ai.dispositivo_averia_id = da.id
      LEFT JOIN averias a ON da.averia_id = a.id
      LEFT JOIN reparacion_detalles rd ON da.reparacion_detalle_id = rd.id
      WHERE rd.reparacion_id = ?
      ORDER BY ai.created_at ASC
    `, [id]);

    // 7. Obtener historial completo de la reparación
    const historial = await executeQuery(`
      SELECT 
        rh.*,
        'Sistema' as usuario_nombre
      FROM reparacion_historial rh
      WHERE rh.reparacion_id = ?
      ORDER BY rh.created_at DESC
    `, [id]);
    
    // 7. Obtener comunicaciones con el cliente (temporalmente deshabilitado)
    const comunicaciones = [];
    
    // 8. Obtener totales y estadísticas correctamente
    const [estadisticas] = await executeQuery(`
      SELECT 
        (SELECT COUNT(*) FROM reparacion_detalles WHERE reparacion_id = ?) as total_dispositivos,
        (SELECT COUNT(*) FROM dispositivo_averias da 
         JOIN reparacion_detalles rd ON da.reparacion_detalle_id = rd.id 
         WHERE rd.reparacion_id = ?) as total_averias,
        (SELECT COUNT(*) FROM dispositivo_averias da 
         JOIN reparacion_detalles rd ON da.reparacion_detalle_id = rd.id 
         WHERE rd.reparacion_id = ? AND da.estado_averia = 'reparada') as averias_completadas,
        (SELECT COUNT(*) FROM averia_intervenciones ai 
         JOIN dispositivo_averias da ON ai.dispositivo_averia_id = da.id
         JOIN reparacion_detalles rd ON da.reparacion_detalle_id = rd.id 
         WHERE rd.reparacion_id = ?) as total_servicios,
        (SELECT COUNT(*) FROM averia_intervenciones ai 
         JOIN dispositivo_averias da ON ai.dispositivo_averia_id = da.id
         JOIN reparacion_detalles rd ON da.reparacion_detalle_id = rd.id 
         WHERE rd.reparacion_id = ? AND ai.estado_intervencion = 'completada') as servicios_completados,
        (SELECT COALESCE(SUM(ai.precio_total), 0) FROM averia_intervenciones ai 
         JOIN dispositivo_averias da ON ai.dispositivo_averia_id = da.id
         JOIN reparacion_detalles rd ON da.reparacion_detalle_id = rd.id 
         WHERE rd.reparacion_id = ?) as total_servicios_precio,
        (SELECT COALESCE(SUM(monto), 0) FROM reparacion_pagos WHERE reparacion_id = ?) as total_pagado
    `, [id, id, id, id, id, id, id]);
    
    return {
      reparacion,
      dispositivos: dispositivos || [],
      averias: averias || [],
      intervenciones: intervenciones || [],
      pagos: pagos || [],
      historial: historial || [],
      comunicaciones: comunicaciones || [],
      estadisticas: estadisticas || {}
    };
  },

  // Crear reparación completa - VERSIÓN CORREGIDA COMPLETA CON CONTADORES Y SERVICIOS POR AVERÍA
  crearReparacionCompleta: async (data) => {
    console.log('📥 Datos recibidos del frontend:', JSON.stringify(data, null, 2));

    // EXTRAER DATOS DEL FRONTEND
    const { cliente, terminales, totales, metadatos } = data;

    // VALIDACIONES INICIALES
    if (!cliente || !cliente.nombre) {
      console.error('❌ Error: Datos del cliente inválidos:', cliente);
      throw new Error('Datos del cliente incompletos o inválidos');
    }

    if (!terminales || terminales.length === 0) {
      console.error('❌ Error: No hay terminales para procesar');
      throw new Error('Debe incluir al menos un terminal');
    }

    // Validar cada terminal
    for (let i = 0; i < terminales.length; i++) {
      const terminal = terminales[i];
      if (!terminal.dispositivo || !terminal.dispositivo.marca) {
        throw new Error(`Terminal ${i + 1}: Datos del dispositivo incompletos`);
      }
      if (!terminal.diagnostico || !terminal.diagnostico.problemas_reportados) {
        throw new Error(`Terminal ${i + 1}: Datos del diagnóstico incompletos`);
      }
      if (!terminal.presupuesto) {
        throw new Error(`Terminal ${i + 1}: Datos del presupuesto incompletos`);
      }
    }

    console.log('✅ Validaciones iniciales correctas');
    console.log('👤 Cliente:', cliente.nombre, cliente.apellidos);
    console.log('📱 Terminales a procesar:', terminales.length);

    const connection = await createConnection();

    // ===== FUNCIONES AUXILIARES INTERNAS =====
    const obtenerModeloId = async (marca, modelo) => {
      try {
        const [modeloResult] = await connection.execute(`
          SELECT m.id 
          FROM modelos m 
          JOIN marcas ma ON m.marca_id = ma.id 
          WHERE ma.nombre = ? AND m.nombre = ?
        `, [marca, modelo]);
        return modeloResult[0]?.id || null;
      } catch (error) {
        console.error('❌ Error obteniendo modelo_id:', error);
        return null;
      }
    };

    const obtenerAveriaId = async (nombreAveria) => {
      try {
        const [averiaResult] = await connection.execute(
          'SELECT id FROM averias WHERE nombre = ? AND activo = true',
          [nombreAveria]
        );
        return averiaResult[0]?.id || null;
      } catch (error) {
        console.error('❌ Error obteniendo averia_id:', error);
        return null;
      }
    };

    const obtenerReparacionId = async (nombreReparacion, modeloId) => {
      try {
        const [reparacionResult] = await connection.execute(
          'SELECT id FROM reparaciones_modelo WHERE modelo_id = ? AND nombre = ? AND activo = true',
          [modeloId, nombreReparacion]
        );
        return reparacionResult[0]?.id || null;
      } catch (error) {
        console.error('❌ Error obteniendo reparacion_id:', error);
        return null;
      }
    };

    try {
      await connection.beginTransaction();
      console.log('🔄 Iniciando transacción...');

      // 1. VERIFICAR/CREAR ESTABLECIMIENTO
      let establecimientoId;
      const [establecimientos] = await connection.execute('SELECT id FROM establecimientos LIMIT 1');

      if (establecimientos.length > 0) {
        establecimientoId = establecimientos[0].id;
        console.log('📋 Usando establecimiento existente ID:', establecimientoId);
      } else {
        console.log('📋 Creando establecimiento por defecto...');
        const [establecimientoResult] = await connection.execute(`
          INSERT INTO establecimientos (nombre, direccion, telefono, nif) 
          VALUES ('Reparaciones Móviles', 'Calle Principal 1', '123456789', '12345678A')
        `);
        establecimientoId = establecimientoResult.insertId;
        console.log('✅ Establecimiento creado con ID:', establecimientoId);
      }

      // 2. VERIFICAR/CREAR CLIENTE
      let clienteId;
      const [clienteExistente] = await connection.execute(
        'SELECT id FROM clientes WHERE dni = ?',
        [cliente.dni]
      );

      if (clienteExistente.length > 0) {
        clienteId = clienteExistente[0].id;
        console.log('👤 Cliente existente encontrado:', clienteId);
        await connection.execute(`
          UPDATE clientes 
          SET nombre = ?, apellidos = ?, telefono = ?, email = ?, direccion = ?, codigo_postal = ?
          WHERE id = ?
        `, [
          cliente.nombre,
          cliente.apellidos,
          cliente.telefono,
          cliente.email || null,
          cliente.direccion || null,
          cliente.codigoPostal || null,
          clienteId
        ]);
        console.log('✅ Datos del cliente actualizados');
      } else {
        console.log('👤 Creando nuevo cliente...');
        const [clienteResult] = await connection.execute(`
          INSERT INTO clientes (nombre, apellidos, dni, telefono, email, direccion, codigo_postal, establecimiento_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          cliente.nombre,
          cliente.apellidos,
          cliente.dni,
          cliente.telefono,
          cliente.email || null,
          cliente.direccion || null,
          cliente.codigoPostal || null,
          establecimientoId
        ]);
        clienteId = clienteResult.insertId;
        console.log('✅ Cliente creado con ID:', clienteId);
      }

      // 3. GENERAR NÚMERO DE ORDEN
      const year = new Date().getFullYear();
      const [orderCount] = await connection.execute(
        'SELECT COUNT(*) as total FROM reparaciones WHERE YEAR(fecha_ingreso) = ?',
        [year]
      );
      const numeroOrden = `R-${year}-${String(orderCount[0].total + 1).padStart(4, '0')}`;
      console.log('🎫 Número de orden generado:', numeroOrden);

      // 4. CREAR REPARACIÓN PRINCIPAL
      const [reparacionResult] = await connection.execute(`
        INSERT INTO reparaciones (
          numero_orden, cliente_id, estado_general, total_presupuestado, descuento_general, 
          total_final, anticipo_pagado, notas_generales, establecimiento_id, created_by
        ) VALUES (?, ?, 'iniciada', ?, ?, ?, ?, ?, ?, 1)
      `, [
        numeroOrden,
        clienteId,
        totales?.subtotal || 0,
        totales?.descuento || 0,
        totales?.total || 0,
        totales?.anticipo || 0,
        metadatos?.notas || `Reparación de ${terminales.length} terminal${terminales.length > 1 ? 'es' : ''}`,
        establecimientoId
      ]);

      const reparacionId = reparacionResult.insertId;
      console.log('🔧 Reparación principal creada con ID:', reparacionId);

      // 5. PROCESAR CADA TERMINAL CON INTEGRACIÓN DE CONTADORES Y SERVICIOS POR AVERÍA
      let totalGeneralReparacion = 0;
      let totalDispositivos = 0;
      let totalAverias = 0;
      let totalServicios = 0;
      const resultadosTerminales = [];

      for (let i = 0; i < terminales.length; i++) {
        const terminal = terminales[i];
        const { dispositivo, diagnostico, presupuesto } = terminal;
        
        console.log(`\n📱 Procesando terminal ${i + 1}/${terminales.length}: ${dispositivo.marca} ${dispositivo.modelo}`);

        // 5.1 CREAR DISPOSITIVO EN NUEVA ESTRUCTURA - reparacion_detalles
        // Primero obtener IDs de marca y modelo
        const [marcaResult] = await connection.execute(`SELECT id FROM marcas WHERE nombre = ? LIMIT 1`, [dispositivo.marca]);
        const [modeloResult] = await connection.execute(`SELECT id FROM modelos WHERE nombre = ? AND marca_id = ? LIMIT 1`, [dispositivo.modelo, marcaResult[0]?.id]);
        
        const marcaId = marcaResult[0]?.id;
        const modeloId = modeloResult[0]?.id;
        
        if (!marcaId || !modeloId) {
          throw new Error(`No se encontró marca "${dispositivo.marca}" o modelo "${dispositivo.modelo}" en la base de datos`);
        }

        // Obtener ID del estado del dispositivo (por defecto 'recibido')
        const estadoCodigo = dispositivo.estado || 'recibido';
        const [estadoResult] = await connection.execute(`
          SELECT id FROM estados WHERE codigo = ? AND categoria = 'dispositivo'
        `, [estadoCodigo]);
        const estadoId = estadoResult[0]?.id || 10; // Fallback a 'recibido'

        const [dispositivoResult] = await connection.execute(`
          INSERT INTO reparacion_detalles (
            reparacion_id, marca_id, modelo_id, imei, numero_serie, color, capacidad,
            observaciones_recepcion, patron_desbloqueo, requiere_backup, estado_id, created_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        `, [
          reparacionId,
          marcaId,
          modeloId,
          dispositivo.imei || null,
          dispositivo.numero_serie || null,
          dispositivo.color || null,
          dispositivo.capacidad || null,
          dispositivo.observaciones || null,
          diagnostico.patron_desbloqueo || null,
          diagnostico.requiere_backup || false,
          estadoId
        ]);

        const reparacionDetalleId = dispositivoResult.insertId;
        totalDispositivos++;

        // modeloId ya está declarado anteriormente en línea 489

        // 5.2 CREAR AVERÍAS
        const averiaIds = [];
        for (const problema of diagnostico.problemas_reportados || []) {
          let diasEstimados = 5;
          if (diagnostico.prioridad === 'urgente') diasEstimados = 2;
          if (diagnostico.prioridad === 'express') diasEstimados = 1;
          
          const fechaEstimada = new Date();
          fechaEstimada.setDate(fechaEstimada.getDate() + diasEstimados);

          // Obtener el averia_id del catálogo
          const averiaCatalogoId = await obtenerAveriaId(problema);
          
          const [averiaResult] = await connection.execute(`
            INSERT INTO dispositivo_averias (
              reparacion_detalle_id, averia_id, descripcion_cliente, sintomas_observados,
              prioridad, estado_averia, fecha_estimada_finalizacion, observaciones_tecnico, created_by
            ) VALUES (?, ?, ?, ?, ?, 'detectada', ?, ?, 1)
          `, [
            reparacionDetalleId,
            averiaCatalogoId || 1, // Si no encuentra la avería, usar ID 1 por defecto
            `Problema reportado: ${problema}`,
            diagnostico.sintomas_adicionales || `Síntomas observados para: ${problema}`,
            diagnostico.prioridad || 'normal',
            fechaEstimada.toISOString().split('T')[0],
            diagnostico.observaciones_tecnicas || null
          ]);

          const averiaDbId = averiaResult.insertId;
          averiaIds.push(averiaDbId);
          totalAverias++;

          // Incrementar contadores de averías (temporalmente deshabilitado)
          // if (averiaCatalogoId) {
          //   await catalogosService.incrementarContadorAveriaGlobal(averiaCatalogoId);
          //   if (modeloId) {
          //     await catalogosService.registrarUsoAveriaEnModelo(modeloId, averiaCatalogoId);
          //   }
          // }
        }

        // ✅ 5.3 CREAR SERVICIOS POR AVERÍA ESPECÍFICA - VERSIÓN CORREGIDA
        let totalTerminal = 0;
        let serviciosTerminal = 0;

        console.log('💰 Procesando presupuesto por avería:', JSON.stringify(presupuesto.presupuestoPorAveria, null, 2));

        // Procesar cada avería con sus servicios específicos
        for (const presupuestoAveria of presupuesto.presupuestoPorAveria || []) {
          const nombreAveria = presupuestoAveria.problema;
          
          // Buscar el ID de la avería que acabamos de crear
          const averiaIndex = diagnostico.problemas_reportados.findIndex(p => p === nombreAveria);
          const averiaDbId = averiaIndex >= 0 ? averiaIds[averiaIndex] : null;
          
          if (!averiaDbId) {
            console.error(`❌ No se encontró avería para: "${nombreAveria}"`);
            continue;
          }
          
          console.log(`🔧 Procesando servicios para avería: "${nombreAveria}" (ID: ${averiaDbId})`);
          
          let totalAveria = 0;
          
          // Crear servicios específicos para esta avería
          for (const item of presupuestoAveria.items || []) {
            const concepto = item.concepto || 'Servicio sin nombre';
            const precio = parseFloat(item.precio) || 0;
            const cantidad = parseInt(item.cantidad) || 1;
            const tipo = item.tipo === 'servicio' ? 'mano_obra' : 'repuesto';
            const precioTotal = precio * cantidad;

            const [servicioResult] = await connection.execute(`
              INSERT INTO averia_intervenciones (
                dispositivo_averia_id, intervencion_id, cantidad, precio_unitario, precio_total, estado_intervencion, created_by
              ) VALUES (?, 1, ?, ?, ?, 'planificada', 1)
            `, [
              averiaDbId, // ID de la avería del dispositivo
              cantidad,
              precio,
              precioTotal
            ]);

            serviciosTerminal++;
            totalServicios++;
            totalAveria += precioTotal;
            
            console.log(`  ✅ Servicio creado: ${concepto} - €${precioTotal.toFixed(2)} para avería ${averiaDbId}`);

            // Incrementar contador de reparación específica (temporalmente deshabilitado)
            // if (modeloId) {
            //   const reparacionId = await obtenerReparacionId(concepto, modeloId);
            //   if (reparacionId) {
            //     await catalogosService.incrementarContadorReparacion(reparacionId);
            //   }
            // }
          }
          
          // Actualizar total de esta avería específica
          await connection.execute(`
            UPDATE dispositivo_averias 
            SET total_averia = ?
            WHERE id = ?
          `, [totalAveria, averiaDbId]);
          
          totalTerminal += totalAveria;
          console.log(`  💰 Total avería "${nombreAveria}": €${totalAveria.toFixed(2)}`);
        }

        // Actualizar total del dispositivo
        await connection.execute(`
          UPDATE reparacion_detalles 
          SET estado_id = (SELECT id FROM estados WHERE codigo = 'en_diagnostico_disp' AND categoria = 'dispositivo')
          WHERE id = ?
        `, [reparacionDetalleId]);

        totalGeneralReparacion += totalTerminal;

        resultadosTerminales.push({
          dispositivo_id: reparacionDetalleId,
          marca: dispositivo.marca,
          modelo: dispositivo.modelo,
          imei: dispositivo.imei,
          averias_creadas: averiaIds.length,
          servicios_creados: serviciosTerminal,
          total_terminal: totalTerminal
        });
      }

      // 6. CALCULAR TOTALES FINALES
      const descuentoValor = totales?.descuento || 0;
      const totalFinal = totalGeneralReparacion - descuentoValor;

      await connection.execute(`
        UPDATE reparaciones 
        SET total_presupuestado = ?, total_final = ?, estado_general = 'en_diagnostico'
        WHERE id = ?
      `, [totalGeneralReparacion, totalFinal, reparacionId]);

      // 7. REGISTRAR EN HISTORIAL
      await connection.execute(`
        INSERT INTO reparacion_historial (reparacion_id, evento_tipo, descripcion, usuario_id)
        VALUES (?, 'creacion', ?, 1)
      `, [
        reparacionId,
        `Reparación creada con ${totalDispositivos} dispositivos, ${totalAverias} averías y ${totalServicios} servicios. Total: €${totalFinal.toFixed(2)}`
      ]);

      // 8. CONFIRMAR TRANSACCIÓN
      await connection.commit();
      console.log('✅ Transacción completada exitosamente');

      return {
        success: true,
        data: {
          reparacion_id: reparacionId,
          numero_orden: numeroOrden,
          cliente_id: clienteId,
          dispositivos_creados: totalDispositivos,
          averias_creadas: totalAverias,
          servicios_creados: totalServicios,
          total_presupuesto: totalGeneralReparacion,
          total_final: totalFinal,
          terminales: resultadosTerminales,
          metadatos: {
            fecha_creacion: new Date().toISOString(),
            terminales_procesados: terminales.length,
            ...metadatos
          }
        }
      };

    } catch (error) {
      await connection.rollback();
      console.error('❌ Error en la transacción:', error);
      throw error;
    } finally {
      await connection.end();
    }
  },

  // Actualizar estado de reparación
  actualizarEstado: async (id, estado, notas) => {
    await executeQuery(`
      UPDATE reparaciones 
      SET estado_general = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [estado, id]);
    
    await executeQuery(`
      INSERT INTO reparacion_historial (reparacion_id, evento_tipo, descripcion, usuario_id)
      VALUES (?, 'modificacion', ?, 1)
    `, [id, `Estado cambiado a: ${estado}${notas ? '. Notas: ' + notas : ''}`]);
  },

  // Eliminar reparación
  eliminarReparacion: async (id) => {
    const connection = await createConnection();
    
    try {
      await connection.beginTransaction();
      
      const [reparacion] = await connection.execute(
        'SELECT numero_orden FROM reparaciones WHERE id = ?',
        [id]
      );
      
      if (!reparacion) {
        throw new Error('Reparación no encontrada');
      }
      
      // Eliminar en cascada (el orden importa por las foreign keys)
      console.log(`🗑️ Eliminando reparación ${reparacion.numero_orden}...`);
      
      // 1. Eliminar repuestos de servicios
      await connection.execute(`
        DELETE sr FROM servicio_repuestos sr
        INNER JOIN averia_servicios aser ON sr.servicio_id = aser.id
        INNER JOIN dispositivo_averias da ON aser.averia_id = da.id
        INNER JOIN reparacion_detalles rd ON da.dispositivo_id = rd.id
        WHERE rd.reparacion_id = ?
      `, [id]);
      
      // 2. Eliminar servicios
      await connection.execute(`
        DELETE aser FROM averia_servicios aser
        INNER JOIN dispositivo_averias da ON aser.averia_id = da.id
        INNER JOIN reparacion_detalles rd ON da.dispositivo_id = rd.id
        WHERE rd.reparacion_id = ?
      `, [id]);
      
      // 3. Eliminar historial de averías
      await connection.execute(`
        DELETE ah FROM averia_historial ah
        INNER JOIN dispositivo_averias da ON ah.averia_id = da.id
        INNER JOIN reparacion_detalles rd ON da.dispositivo_id = rd.id
        WHERE rd.reparacion_id = ?
      `, [id]);
      
      // 4. Eliminar averías
      await connection.execute(`
        DELETE da FROM dispositivo_averias da
        INNER JOIN reparacion_detalles rd ON da.dispositivo_id = rd.id
        WHERE rd.reparacion_id = ?
      `, [id]);
      
      // 5. Eliminar dispositivos
      await connection.execute(`
        DELETE FROM reparacion_detalles WHERE reparacion_id = ?
      `, [id]);
      
      // 6. Eliminar comunicaciones
      await connection.execute(`
        DELETE FROM cliente_comunicaciones WHERE reparacion_id = ?
      `, [id]);
      
      // 7. Eliminar pagos
      await connection.execute(`
        DELETE FROM reparacion_pagos WHERE reparacion_id = ?
      `, [id]);
      
      // 8. Eliminar historial
      await connection.execute(`
        DELETE FROM reparacion_historial WHERE reparacion_id = ?
      `, [id]);
      
      // 9. Eliminar reparación principal
      await connection.execute(`
        DELETE FROM reparaciones WHERE id = ?
      `, [id]);
      
      await connection.commit();
      console.log('✅ Reparación eliminada completamente');
      
      return reparacion.numero_orden;
      
    } catch (error) {
      await connection.rollback();
      console.error('❌ Error eliminando reparación:', error);
      throw error;
    } finally {
      await connection.end();
    }
  },

  // Obtener estadísticas
  obtenerEstadisticas: async () => {
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
    
    const estadosPorCount = await executeQuery(`
      SELECT 
        estado_general,
        COUNT(*) as cantidad
      FROM reparaciones
      GROUP BY estado_general
      ORDER BY cantidad DESC
    `);
    
    const urgentes = await executeQuery(`
      SELECT 
        r.numero_orden,
        r.estado_general,
        c.nombre,
        c.telefono,
        da.fecha_estimada_finalizacion
      FROM reparaciones r
      LEFT JOIN clientes c ON r.cliente_id = c.id
      LEFT JOIN reparacion_detalles rd ON r.id = rd.reparacion_id
      LEFT JOIN dispositivo_averias da ON rd.id = da.dispositivo_id
      WHERE da.fecha_estimada_finalizacion <= DATE_ADD(CURDATE(), INTERVAL 2 DAY)
        AND r.estado_general NOT IN ('lista', 'entregada', 'cancelada')
      ORDER BY da.fecha_estimada_finalizacion
      LIMIT 10
    `);
    
    return {
      resumen: stats,
      por_estado: estadosPorCount,
      urgentes: urgentes
    };
  },

  // NUEVA FUNCIÓN: Recalcular totales de una reparación existente
  recalcularTotales: async (reparacionId) => {
    const connection = await createConnection();
    
    try {
      await connection.beginTransaction();
      console.log(`🔄 Recalculando totales para reparación ID: ${reparacionId}`);
      
      // 1. Actualizar totales de averías basándose en servicios
      await connection.execute(`
        UPDATE dispositivo_averias da 
        SET 
          subtotal_averia = (
            SELECT COALESCE(SUM(aser.precio_total), 0) 
            FROM averia_servicios aser 
            WHERE aser.averia_id = da.id
          ),
          total_averia = (
            SELECT COALESCE(SUM(aser.precio_total), 0) 
            FROM averia_servicios aser 
            WHERE aser.averia_id = da.id
          )
        WHERE da.dispositivo_id IN (
          SELECT rd.id FROM reparacion_detalles rd WHERE rd.reparacion_id = ?
        )
      `, [reparacionId]);
      
      // 2. Actualizar totales de dispositivos
      await connection.execute(`
        UPDATE reparacion_detalles rd 
        SET total_dispositivo = (
          SELECT COALESCE(SUM(da.total_averia), 0) 
          FROM dispositivo_averias da 
          WHERE da.dispositivo_id = rd.id
        )
        WHERE rd.reparacion_id = ?
      `, [reparacionId]);
      
      // 3. Actualizar totales de reparación
      await connection.execute(`
        UPDATE reparaciones r 
        SET 
          total_presupuestado = (
            SELECT COALESCE(SUM(rd.total_dispositivo), 0) 
            FROM reparacion_detalles rd 
            WHERE rd.reparacion_id = r.id
          ),
          total_final = (
            SELECT COALESCE(SUM(rd.total_dispositivo), 0) - r.descuento_general
            FROM reparacion_detalles rd 
            WHERE rd.reparacion_id = r.id
          )
        WHERE r.id = ?
      `, [reparacionId]);
      
      await connection.commit();
      console.log('✅ Totales recalculados correctamente');
      
      return true;
    } catch (error) {
      await connection.rollback();
      console.error('❌ Error recalculando totales:', error);
      throw error;
    } finally {
      await connection.end();
    }
  },

  // NUEVA FUNCIÓN: Buscar reparaciones con filtros
  buscarReparaciones: async (filtros = {}) => {
    let whereConditions = [];
    let params = [];
    
    // Construir condiciones WHERE dinámicamente
    if (filtros.estado && filtros.estado !== 'todos') {
      whereConditions.push('r.estado_general = ?');
      params.push(filtros.estado);
    }
    
    if (filtros.busqueda) {
      whereConditions.push(`(
        r.numero_orden LIKE ? OR 
        c.nombre LIKE ? OR 
        c.apellidos LIKE ? OR 
        c.telefono LIKE ? OR
        c.dni LIKE ?
      )`);
      const searchTerm = `%${filtros.busqueda}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }
    
    if (filtros.fecha_desde) {
      whereConditions.push('DATE(r.fecha_ingreso) >= ?');
      params.push(filtros.fecha_desde);
    }
    
    if (filtros.fecha_hasta) {
      whereConditions.push('DATE(r.fecha_ingreso) <= ?');
      params.push(filtros.fecha_hasta);
    }
    
    const whereClause = whereConditions.length > 0 
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';
    
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
        c.telefono as cliente_telefono,
        c.email as cliente_email,
        COUNT(DISTINCT rd.id) as total_dispositivos,
        COUNT(DISTINCT da.id) as total_averias,
        COUNT(DISTINCT CASE WHEN da.estado_averia = 'reparada' THEN da.id END) as averias_completadas
      FROM reparaciones r
      LEFT JOIN clientes c ON r.cliente_id = c.id
      LEFT JOIN reparacion_detalles rd ON r.id = rd.reparacion_id
      LEFT JOIN dispositivo_averias da ON rd.id = da.dispositivo_id
      ${whereClause}
      GROUP BY r.id
      ORDER BY r.fecha_ingreso DESC
      LIMIT ${filtros.limit || 50} OFFSET ${filtros.offset || 0}
    `;

    return await executeQuery(query, params);
  },

  // NUEVA FUNCIÓN: Agregar comunicación con cliente
  agregarComunicacion: async (reparacionId, tipo, mensaje, usuarioId = 1) => {
    const result = await executeQuery(`
      INSERT INTO cliente_comunicaciones (reparacion_id, tipo, mensaje, usuario_id)
      VALUES (?, ?, ?, ?)
    `, [reparacionId, tipo, mensaje, usuarioId]);
    
    // Registrar en historial
    await executeQuery(`
      INSERT INTO reparacion_historial (reparacion_id, evento_tipo, descripcion, usuario_id)
      VALUES (?, 'comunicacion', ?, ?)
    `, [reparacionId, `Comunicación ${tipo}: ${mensaje}`, usuarioId]);
    
    return result.insertId;
  },

  // NUEVA FUNCIÓN: Agregar pago
  agregarPago: async (reparacionId, monto, metodoPago, referencia, notas, usuarioId = 1) => {
    const connection = await createConnection();
    
    try {
      await connection.beginTransaction();
      
      // Insertar pago
      const [pagoResult] = await connection.execute(`
        INSERT INTO reparacion_pagos (reparacion_id, monto, metodo_pago, referencia_pago, notas_pago)
        VALUES (?, ?, ?, ?, ?)
      `, [reparacionId, monto, metodoPago, referencia, notas]);
      
      // Registrar en historial
      await connection.execute(`
        INSERT INTO reparacion_historial (reparacion_id, evento_tipo, descripcion, usuario_id)
        VALUES (?, 'pago', ?, ?)
      `, [
        reparacionId, 
        `Pago registrado: €${monto} vía ${metodoPago}${referencia ? ` (Ref: ${referencia})` : ''}`, 
        usuarioId
      ]);
      
      // Verificar si la reparación está completamente pagada
      const [totales] = await connection.execute(`
        SELECT 
          r.total_final,
          COALESCE(SUM(rp.monto), 0) as total_pagado
        FROM reparaciones r
        LEFT JOIN reparacion_pagos rp ON r.id = rp.reparacion_id
        WHERE r.id = ?
        GROUP BY r.id
      `, [reparacionId]);
      
      if (totales && totales.total_pagado >= totales.total_final) {
        await connection.execute(`
          INSERT INTO reparacion_historial (reparacion_id, evento_tipo, descripcion, usuario_id)
          VALUES (?, 'estado', 'Reparación completamente pagada', ?)
        `, [reparacionId, usuarioId]);
      }
      
      await connection.commit();
      return pagoResult.insertId;
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      await connection.end();
    }
  },

  // NUEVA FUNCIÓN: Actualizar estado de servicio
  actualizarEstadoServicio: async (servicioId, nuevoEstado, observaciones, usuarioId = 1) => {
    const connection = await createConnection();
    
    try {
      await connection.beginTransaction();
      
      // Obtener información del servicio
      const [servicio] = await connection.execute(`
        SELECT 
          aser.*,
          da.problema_principal,
          rd.reparacion_id,
          rd.marca,
          rd.modelo
        FROM averia_servicios aser
        JOIN dispositivo_averias da ON aser.averia_id = da.id
        JOIN reparacion_detalles rd ON da.dispositivo_id = rd.id
        WHERE aser.id = ?
      `, [servicioId]);
      
      if (!servicio) {
        throw new Error('Servicio no encontrado');
      }
      
      // Actualizar estado del servicio
      await connection.execute(`
        UPDATE averia_servicios 
        SET estado_servicio = ?, observaciones_tecnicas = ?,
            ${nuevoEstado === 'completado' ? 'fecha_completado = CURRENT_TIMESTAMP,' : ''}
            ${nuevoEstado === 'en_progreso' ? 'fecha_inicio = CURRENT_TIMESTAMP,' : ''}
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [nuevoEstado, observaciones, servicioId]);
      
      // Registrar en historial
      await connection.execute(`
        INSERT INTO reparacion_historial (reparacion_id, evento_tipo, descripcion, usuario_id)
        VALUES (?, 'servicio', ?, ?)
      `, [
        servicio.reparacion_id,
        `Servicio "${servicio.concepto}" cambió a estado: ${nuevoEstado}${observaciones ? '. ' + observaciones : ''}`,
        usuarioId
      ]);
      
      await connection.commit();
      return true;
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      await connection.end();
    }
  },

  // NUEVA FUNCIÓN: Obtener reparaciones por cliente
  obtenerReparacionesPorCliente: async (clienteId) => {
    return await executeQuery(`
      SELECT 
        r.id,
        r.numero_orden,
        r.estado_general,
        r.fecha_ingreso,
        r.total_final,
        COUNT(DISTINCT rd.id) as total_dispositivos,
        COUNT(DISTINCT da.id) as total_averias,
        COUNT(DISTINCT CASE WHEN da.estado_averia = 'reparada' THEN da.id END) as averias_completadas
      FROM reparaciones r
      LEFT JOIN reparacion_detalles rd ON r.id = rd.reparacion_id
      LEFT JOIN dispositivo_averias da ON rd.id = da.dispositivo_id
      WHERE r.cliente_id = ?
      GROUP BY r.id
      ORDER BY r.fecha_ingreso DESC
    `, [clienteId]);
  },

// ✅ NUEVA FUNCIÓN: Actualizar reparación completa manteniendo IDs
actualizarReparacionCompleta: async (data) => {
  console.log('🔄 Iniciando actualización completa de reparación...');
  const { reparacionId, cliente, terminales, totales } = data;
  
  const connection = await createConnection();
  
  try {
    await connection.beginTransaction();
    console.log('🔄 Transacción iniciada para actualización...');
    
    // 1. VERIFICAR QUE LA REPARACIÓN EXISTE
    const [reparacionExistente] = await connection.execute(
      'SELECT id, cliente_id, numero_orden FROM reparaciones WHERE id = ?',
      [reparacionId]
    );
    
    if (reparacionExistente.length === 0) {
      throw new Error(`Reparación con ID ${reparacionId} no encontrada`);
    }
    
    const clienteId = reparacionExistente[0].cliente_id;
    const numeroOrden = reparacionExistente[0].numero_orden;
    
    console.log(`✅ Reparación encontrada: ${numeroOrden} (Cliente ID: ${clienteId})`);
    
    // 2. ACTUALIZAR DATOS DEL CLIENTE (manteniendo cliente_id)
    console.log('👤 Actualizando datos del cliente...');
    await connection.execute(`
      UPDATE clientes 
      SET nombre = ?, apellidos = ?, telefono = ?, email = ?, 
          direccion = ?, codigo_postal = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      cliente.nombre,
      cliente.apellidos, 
      cliente.telefono,
      cliente.email || null,
      cliente.direccion || null,
      cliente.codigoPostal || null,
      clienteId
    ]);
    
    console.log('✅ Cliente actualizado');
    
    // 3. OBTENER DISPOSITIVOS ACTUALES PARA COMPARAR
    const [dispositivosActuales] = await connection.execute(
      'SELECT id, marca, modelo, imei FROM reparacion_detalles WHERE reparacion_id = ?',
      [reparacionId]
    );
    
    console.log(`📱 Dispositivos actuales en BD: ${dispositivosActuales.length}`);
    console.log(`📱 Dispositivos en actualización: ${terminales.length}`);
    
    // 4. PROCESAR CADA TERMINAL/DISPOSITIVO
    let totalGeneralActualizado = 0;
    const dispositivosActualizados = [];
    
    for (let i = 0; i < terminales.length; i++) {
      const terminal = terminales[i];
      const { dispositivo, diagnostico, presupuesto } = terminal;
      
      console.log(`\n📱 Procesando terminal ${i + 1}: ${dispositivo.marca} ${dispositivo.modelo}`);
      
      let dispositivoId = dispositivo.id;
      
      // 4.1 ACTUALIZAR O CREAR DISPOSITIVO
      if (dispositivoId && dispositivosActuales.find(d => d.id === dispositivoId)) {
        // DISPOSITIVO EXISTENTE - ACTUALIZAR
        console.log(`🔄 Actualizando dispositivo existente ID: ${dispositivoId}`);
        
        await connection.execute(`
          UPDATE reparacion_detalles 
          SET marca = ?, modelo = ?, imei = ?, numero_serie = ?, 
              color = ?, capacidad = ?, observaciones_recepcion = ?,
              patron_desbloqueo = ?, requiere_backup = ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ? AND reparacion_id = ?
        `, [
          dispositivo.marca,
          dispositivo.modelo,
          dispositivo.imei || null,
          dispositivo.numero_serie || null,
          dispositivo.color || null,
          dispositivo.capacidad || null,
          dispositivo.observaciones || null,
          diagnostico.patron_desbloqueo || null,
          diagnostico.requiere_backup || false,
          dispositivoId,
          reparacionId
        ]);
        
        console.log(`✅ Dispositivo ${dispositivoId} actualizado`);
        
      } else {
        // DISPOSITIVO NUEVO - CREAR
        console.log('🆕 Creando nuevo dispositivo...');
        
        // Obtener ID del estado del dispositivo (por defecto 'recibido')
        const estadoCodigo = dispositivo.estado || 'recibido';
        const [estadoResult] = await connection.execute(`
          SELECT id FROM estados WHERE codigo = ? AND categoria = 'dispositivo'
        `, [estadoCodigo]);
        const estadoId = estadoResult[0]?.id || 10; // Fallback a 'recibido'

        const [nuevoDispositivo] = await connection.execute(`
          INSERT INTO reparacion_detalles (
            reparacion_id, marca, modelo, imei, numero_serie, color, capacidad,
            observaciones_recepcion, patron_desbloqueo, requiere_backup, estado_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          reparacionId,
          dispositivo.marca,
          dispositivo.modelo,
          dispositivo.imei || null,
          dispositivo.numero_serie || null,
          dispositivo.color || null,
          dispositivo.capacidad || null,
          dispositivo.observaciones || null,
          diagnostico.patron_desbloqueo || null,
          diagnostico.requiere_backup || false,
          estadoId
        ]);
        
        dispositivoId = nuevoDispositivo.insertId;
        console.log(`✅ Nuevo dispositivo creado con ID: ${dispositivoId}`);
      }
      
      // 4.2 ACTUALIZAR AVERÍAS DE ESTE DISPOSITIVO
      console.log('🔧 Procesando averías del dispositivo...');
      
      // Obtener averías actuales del dispositivo
      const [averiasActuales] = await connection.execute(
        'SELECT id, problema_principal FROM dispositivo_averias WHERE dispositivo_id = ?',
        [dispositivoId]
      );
      
      console.log(`   Averías actuales: ${averiasActuales.length}`);
      console.log(`   Averías nuevas: ${diagnostico.problemas_reportados.length}`);
      
      // Eliminar averías que ya no están en la lista
      const problemasNuevos = diagnostico.problemas_reportados;
      for (const averiaActual of averiasActuales) {
        if (!problemasNuevos.includes(averiaActual.problema_principal)) {
          console.log(`🗑️ Eliminando avería: ${averiaActual.problema_principal}`);
          
          // Eliminar servicios de la avería
          await connection.execute(
            'DELETE FROM averia_servicios WHERE averia_id = ?',
            [averiaActual.id]
          );
          
          // Eliminar la avería
          await connection.execute(
            'DELETE FROM dispositivo_averias WHERE id = ?',
            [averiaActual.id]
          );
        }
      }
      
      // Actualizar o crear averías
      const averiasIds = [];
      for (const problema of problemasNuevos) {
        let averiaExistente = averiasActuales.find(a => a.problema_principal === problema);
        
        if (averiaExistente) {
          // ACTUALIZAR AVERÍA EXISTENTE
          console.log(`🔄 Actualizando avería: ${problema}`);
          
          await connection.execute(`
            UPDATE dispositivo_averias 
            SET descripcion_cliente = ?, sintomas_observados = ?, prioridad = ?,
                tipo_servicio = ?, observaciones_tecnicas = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `, [
            diagnostico.sintomas_adicionales || `Problema: ${problema}`,
            diagnostico.sintomas_adicionales || `Síntomas para: ${problema}`,
            diagnostico.prioridad || 'normal',
            diagnostico.tipo_servicio || 'reparacion',
            diagnostico.observaciones_tecnicas || null,
            averiaExistente.id
          ]);
          
          averiasIds.push(averiaExistente.id);
          
        } else {
          // CREAR NUEVA AVERÍA
          console.log(`🆕 Creando nueva avería: ${problema}`);
          
          let diasEstimados = 5;
          if (diagnostico.prioridad === 'urgente') diasEstimados = 2;
          if (diagnostico.prioridad === 'express') diasEstimados = 1;
          
          const fechaEstimada = new Date();
          fechaEstimada.setDate(fechaEstimada.getDate() + diasEstimados);
          
          const [nuevaAveria] = await connection.execute(`
            INSERT INTO dispositivo_averias (
              dispositivo_id, problema_principal, descripcion_cliente, sintomas_observados,
              detectado_en, categoria, prioridad, tipo_servicio, estado_averia,
              fecha_estimada_finalizacion, observaciones_tecnicas
            ) VALUES (?, ?, ?, ?, 'recepcion', ?, ?, ?, 'detectada', ?, ?)
          `, [
            dispositivoId,
            problema,
            diagnostico.sintomas_adicionales || `Problema: ${problema}`,
            diagnostico.sintomas_adicionales || `Síntomas para: ${problema}`,
            problema.toLowerCase().includes('pantalla') ? 'pantalla' : 
            problema.toLowerCase().includes('bateria') || problema.toLowerCase().includes('carga') ? 'bateria' : 
            'otros',
            diagnostico.prioridad || 'normal',
            diagnostico.tipo_servicio || 'reparacion',
            fechaEstimada.toISOString().split('T')[0],
            diagnostico.observaciones_tecnicas || null
          ]);
          
          averiasIds.push(nuevaAveria.insertId);
        }
      }
      
      // 4.3 ACTUALIZAR SERVICIOS POR AVERÍA
      console.log('💰 Procesando presupuesto por avería...');
      
      let totalDispositivo = 0;
      
      for (const presupuestoAveria of presupuesto.presupuestoPorAveria || []) {
        const nombreAveria = presupuestoAveria.problema;
        
        // Buscar ID de la avería
        const averiaIndex = problemasNuevos.findIndex(p => p === nombreAveria);
        const averiaId = averiaIndex >= 0 ? averiasIds[averiaIndex] : null;
        
        if (!averiaId) {
          console.log(`⚠️ No se encontró avería para: ${nombreAveria}`);
          continue;
        }
        
        console.log(`💰 Procesando servicios para avería: ${nombreAveria} (ID: ${averiaId})`);
        
        // Eliminar servicios actuales de esta avería
        await connection.execute(
          'DELETE FROM averia_servicios WHERE averia_id = ?',
          [averiaId]
        );
        
        // Crear servicios nuevos
        let totalAveria = 0;
        for (const item of presupuestoAveria.items || []) {
          const precioTotal = (parseFloat(item.precio) || 0) * (parseInt(item.cantidad) || 1);
          
          await connection.execute(`
            INSERT INTO averia_servicios (
              averia_id, concepto, descripcion_detallada, tipo, categoria_servicio,
              cantidad, precio_unitario, precio_total, estado_servicio,
              dificultad, requiere_especialista
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'planificado', 'media', ?)
          `, [
            averiaId,
            item.concepto,
            `Servicio actualizado para ${nombreAveria}: ${item.concepto}`,
            item.tipo === 'servicio' ? 'mano_obra' : 'repuesto',
            'general',
            parseInt(item.cantidad) || 1,
            parseFloat(item.precio) || 0,
            precioTotal,
            item.tipo === 'repuesto' ? 0 : 1
          ]);
          
          totalAveria += precioTotal;
          console.log(`   ✅ Servicio actualizado: ${item.concepto} - €${precioTotal.toFixed(2)}`);
        }
        
        // Actualizar total de la avería
        await connection.execute(`
          UPDATE dispositivo_averias 
          SET subtotal_averia = ?, total_averia = ?
          WHERE id = ?
        `, [totalAveria, totalAveria, averiaId]);
        
        totalDispositivo += totalAveria;
      }
      
      // Actualizar total del dispositivo
      await connection.execute(`
        UPDATE reparacion_detalles 
        SET total_dispositivo = ?
        WHERE id = ?
      `, [totalDispositivo, dispositivoId]);
      
      totalGeneralActualizado += totalDispositivo;
      
      dispositivosActualizados.push({
        dispositivo_id: dispositivoId,
        marca: dispositivo.marca,
        modelo: dispositivo.modelo,
        imei: dispositivo.imei,
        total_actualizado: totalDispositivo
      });
      
      console.log(`✅ Terminal ${i + 1} actualizado completamente - Total: €${totalDispositivo.toFixed(2)}`);
    }
    
    // 5. ELIMINAR DISPOSITIVOS QUE YA NO ESTÁN EN LA LISTA
    const dispositivosActualizadosIds = terminales
      .map(t => t.dispositivo.id)
      .filter(id => id); // Solo IDs existentes
    
    for (const dispositivoActual of dispositivosActuales) {
      if (!dispositivosActualizadosIds.includes(dispositivoActual.id)) {
        console.log(`🗑️ Eliminando dispositivo ${dispositivoActual.id}: ${dispositivoActual.marca} ${dispositivoActual.modelo}`);
        
        // Eliminar en cascada
        await connection.execute(`
          DELETE aser FROM averia_servicios aser
          INNER JOIN dispositivo_averias da ON aser.averia_id = da.id
          WHERE da.dispositivo_id = ?
        `, [dispositivoActual.id]);
        
        await connection.execute(
          'DELETE FROM dispositivo_averias WHERE dispositivo_id = ?',
          [dispositivoActual.id]
        );
        
        await connection.execute(
          'DELETE FROM reparacion_detalles WHERE id = ?',
          [dispositivoActual.id]
        );
      }
    }
    
    // 6. ACTUALIZAR TOTALES GENERALES DE LA REPARACIÓN
    const descuentoTotal = totales?.descuento || 0;
    const totalFinal = totalGeneralActualizado - descuentoTotal;
    
    console.log(`💰 Actualizando totales generales:`);
    console.log(`   Subtotal: €${totalGeneralActualizado.toFixed(2)}`);
    console.log(`   Descuento: €${descuentoTotal.toFixed(2)}`);
    console.log(`   Total Final: €${totalFinal.toFixed(2)}`);
    
    await connection.execute(`
      UPDATE reparaciones 
      SET total_presupuestado = ?, total_final = ?, 
          descuento_general = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [totalGeneralActualizado, totalFinal, descuentoTotal, reparacionId]);
    
    // 7. REGISTRAR EN HISTORIAL
    await connection.execute(`
      INSERT INTO reparacion_historial (reparacion_id, evento_tipo, descripcion, usuario_id)
      VALUES (?, 'modificacion', ?, 1)
    `, [
      reparacionId,
      `Reparación actualizada: ${dispositivosActualizados.length} dispositivos procesados. Nuevo total: €${totalFinal.toFixed(2)}`
    ]);
    
    // 8. CONFIRMAR TRANSACCIÓN
    await connection.commit();
    console.log('✅ Transacción completada exitosamente');
    
    return {
      success: true,
      reparacion_id: reparacionId,
      numero_orden: numeroOrden,
      dispositivos_procesados: dispositivosActualizados.length,
      total_anterior: parseFloat(reparacionExistente[0].total_final || 0),
      total_actualizado: totalFinal,
      dispositivos_actualizados: dispositivosActualizados,
      fecha_actualizacion: new Date().toISOString()
    };
    
  } catch (error) {
    await connection.rollback();
    console.error('❌ Error en actualización completa:', error);
    throw error;
  } finally {
    await connection.end();
  }
}
};

module.exports = reparacionService;