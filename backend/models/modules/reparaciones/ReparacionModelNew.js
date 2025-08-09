// models/modules/reparaciones/ReparacionModelNew.js - NUEVA ESTRUCTURA
const BaseModel = require('../../BaseModel');
const { executeQuery, createConnection } = require('../../../config/database');

class ReparacionModelNew extends BaseModel {
  constructor() {
    super('reparaciones');
  }

  // Obtener reparaciones con información del cliente (optimizado)
  async findAllWithClient(limit = 50, offset = 0, estado = null) {
    try {
      // Query súper simple para probar
      const query = `SELECT * FROM reparaciones ORDER BY fecha_ingreso DESC LIMIT 10`;
      
      return await executeQuery(query);
    } catch (error) {
      console.error('❌ Error en findAllWithClient:', error);
      throw error;
    }
  }

  // Obtener reparación completa con nueva estructura
  async findCompleteById(id) {
    // Obtener reparación con información del cliente
    const [reparacionConCliente] = await executeQuery(`
      SELECT 
        r.*,
        c.nombre as cliente_nombre,
        c.apellidos as cliente_apellidos,
        c.dni as cliente_dni,
        c.telefono as cliente_telefono,
        c.email as cliente_email,
        c.direccion as cliente_direccion,
        c.fecha_registro as cliente_fecha_registro
      FROM reparaciones r
      LEFT JOIN clientes c ON r.cliente_id = c.id
      WHERE r.id = ?
    `, [id]);

    if (!reparacionConCliente) return { reparacion: null };

    // Copiar datos del cliente a la reparación para compatibilidad con frontend
    const reparacion = {
      ...reparacionConCliente,
      nombre: reparacionConCliente.cliente_nombre,
      apellidos: reparacionConCliente.cliente_apellidos,
      dni: reparacionConCliente.cliente_dni,
      telefono: reparacionConCliente.cliente_telefono,
      email: reparacionConCliente.cliente_email,
      direccion: reparacionConCliente.cliente_direccion,
      fecha_registro: reparacionConCliente.cliente_fecha_registro
    };

    // Obtener dispositivos con información de marca y modelo
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
        ma.nombre as marca_nombre,
        mo.nombre as modelo_nombre,
        mo.imagen_url as modelo_imagen,
        COUNT(DISTINCT da.id) as total_averias,
        COUNT(DISTINCT CASE WHEN da.estado_averia IN ('reparada', 'entregada') THEN da.id END) as averias_completadas
      FROM reparacion_detalles rd
      LEFT JOIN marcas ma ON rd.marca_id = ma.id
      LEFT JOIN modelos mo ON rd.modelo_id = mo.id
      LEFT JOIN dispositivo_averias da ON rd.id = da.reparacion_detalle_id
      WHERE rd.reparacion_id = ?
      GROUP BY rd.id
      ORDER BY rd.created_at ASC
    `, [id]);


    // Obtener averías con intervenciones
    const averias = await executeQuery(`
      SELECT 
        da.*,
        a.nombre as averia_nombre,
        a.categoria as averia_categoria,
        rd.marca_id,
        rd.modelo_id,
        ma.nombre as marca_nombre,
        mo.nombre as modelo_nombre,
        COUNT(DISTINCT ai.id) as total_intervenciones,
        COUNT(DISTINCT CASE WHEN ai.estado_intervencion = 'completada' THEN ai.id END) as intervenciones_completadas
      FROM dispositivo_averias da
      LEFT JOIN averias a ON da.averia_id = a.id
      LEFT JOIN reparacion_detalles rd ON da.reparacion_detalle_id = rd.id
      LEFT JOIN marcas ma ON rd.marca_id = ma.id
      LEFT JOIN modelos mo ON rd.modelo_id = mo.id
      LEFT JOIN averia_intervenciones ai ON da.id = ai.dispositivo_averia_id
      WHERE rd.reparacion_id = ?
      GROUP BY da.id
      ORDER BY da.created_at ASC
    `, [id]);

    // LOG TEMPORAL: Verificar datos de averías
    console.log('🔍 AVERIAS OBTENIDAS:', averias.map(a => ({ 
      id: a.id, 
      averia_id: a.averia_id, 
      averia_nombre: a.averia_nombre,
      averia_categoria: a.averia_categoria 
    })));

    // Obtener intervenciones aplicadas
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

    return {
      reparacion,
      dispositivos,
      averias,
      intervenciones
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

  // Crear reparación completa con nueva estructura optimizada
  async createComplete(data) {
    const { cliente, terminales, totales, metadatos } = data;
    const connection = await createConnection();

    try {
      await connection.beginTransaction();
      console.log('🔄 Iniciando creación con nueva estructura...');

      // 1. Verificar/crear cliente
      let clienteId;
      const [clienteExistente] = await connection.execute(
        'SELECT id FROM clientes WHERE dni = ?',
        [cliente.dni]
      );

      if (clienteExistente.length > 0) {
        clienteId = clienteExistente[0].id;
        // Actualizar datos del cliente
        await connection.execute(`
          UPDATE clientes 
          SET nombre = ?, apellidos = ?, telefono = ?, email = ?, direccion = ?, codigo_postal = ?
          WHERE id = ?
        `, [
          cliente.nombre, cliente.apellidos, cliente.telefono,
          cliente.email || null, cliente.direccion || null,
          cliente.codigoPostal || null, clienteId
        ]);
      } else {
        const [clienteResult] = await connection.execute(`
          INSERT INTO clientes (nombre, apellidos, dni, telefono, email, direccion, codigo_postal)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          cliente.nombre, cliente.apellidos, cliente.dni, cliente.telefono,
          cliente.email || null, cliente.direccion || null, cliente.codigoPostal || null
        ]);
        clienteId = clienteResult.insertId;
      }

      // 2. Generar número de orden y crear reparación
      const numeroOrden = await this.generateOrderNumber();
      const [reparacionResult] = await connection.execute(`
        INSERT INTO reparaciones (
          numero_orden, cliente_id, estado_general,
          descuento_general, total_final, anticipo_requerido,
          notas_generales
        ) VALUES (?, ?, 'iniciada', ?, ?, ?, ?)
      `, [
        numeroOrden, clienteId,
        totales?.descuento || 0, totales?.total || 0,
        (totales?.anticipo || 0) > 0,
        metadatos?.notas || `Reparación de ${terminales.length} dispositivo(s)`
      ]);

      const reparacionId = reparacionResult.insertId;

      // 3. Procesar cada terminal/dispositivo
      let totalGeneralReparacion = 0;
      const resultadosTerminales = [];

      for (let i = 0; i < terminales.length; i++) {
        const terminal = terminales[i];
        const { dispositivo, diagnostico, presupuesto } = terminal;

        console.log(`📱 Procesando dispositivo ${i + 1}: ${dispositivo.marca} ${dispositivo.modelo}`);

        // Buscar IDs de marca y modelo
        const [marcaResult] = await connection.execute(
          'SELECT id FROM marcas WHERE nombre = ?',
          [dispositivo.marca]
        );
        const [modeloResult] = await connection.execute(
          'SELECT id FROM modelos WHERE nombre = ? AND marca_id = ?',
          [dispositivo.modelo, marcaResult[0]?.id]
        );

        if (!marcaResult[0] || !modeloResult[0]) {
          throw new Error(`Marca "${dispositivo.marca}" o modelo "${dispositivo.modelo}" no encontrado en catálogos`);
        }

        // Crear detalle de reparación (dispositivo)
        const [detalleResult] = await connection.execute(`
          INSERT INTO reparacion_detalles (
            reparacion_id, marca_id, modelo_id, imei, numero_serie,
            color, capacidad, observaciones_recepcion, patron_desbloqueo, requiere_backup
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          reparacionId, marcaResult[0].id, modeloResult[0].id,
          dispositivo.imei || null, dispositivo.numero_serie || null,
          dispositivo.color || null, dispositivo.capacidad || null,
          dispositivo.observaciones || null,
          diagnostico.patron_desbloqueo || null,
          diagnostico.requiere_backup || false
        ]);

        const detalleId = detalleResult.insertId;
        let totalDispositivo = 0;

        // Procesar averías del dispositivo
        for (const problema of diagnostico.problemas_reportados || []) {
          // Buscar ID de avería
          const [averiaResult] = await connection.execute(
            'SELECT id FROM averias WHERE nombre = ?',
            [problema]
          );

          if (!averiaResult[0]) {
            throw new Error(`Avería "${problema}" no encontrada en catálogo`);
          }

          // Crear dispositivo_averia
          const [dispositivoAveriaResult] = await connection.execute(`
            INSERT INTO dispositivo_averias (
              reparacion_detalle_id, averia_id, descripcion_cliente,
              sintomas_observados, prioridad, estado_averia
            ) VALUES (?, ?, ?, ?, ?, 'detectada')
          `, [
            detalleId, averiaResult[0].id,
            diagnostico.sintomas_adicionales || `Problema: ${problema}`,
            diagnostico.sintomas_adicionales || `Síntomas: ${problema}`,
            diagnostico.prioridad || 'normal'
          ]);

          const dispositivoAveriaId = dispositivoAveriaResult.insertId;
          let totalAveria = 0;

          // Buscar presupuesto para esta avería específica
          const presupuestoAveria = presupuesto.presupuestoPorAveria?.find(p => p.problema === problema);
          
          if (presupuestoAveria) {
            // Procesar intervenciones para esta avería
            for (const item of presupuestoAveria.items || []) {
              // Buscar intervención en catálogo
              const [intervencionResult] = await connection.execute(`
                SELECT id FROM intervenciones 
                WHERE modelo_id = ? AND averia_id = ? AND nombre LIKE ?
              `, [modeloResult[0].id, averiaResult[0].id, `%${item.concepto}%`]);

              let intervencionId = intervencionResult[0]?.id;

              // Si no existe la intervención, crearla
              if (!intervencionId) {
                const [nuevaIntervencionResult] = await connection.execute(`
                  INSERT INTO intervenciones (
                    modelo_id, averia_id, nombre, precio_base, tipo
                  ) VALUES (?, ?, ?, ?, ?)
                `, [
                  modeloResult[0].id, averiaResult[0].id,
                  item.concepto, parseFloat(item.precio) || 0,
                  item.tipo === 'servicio' ? 'mano_obra' : 'repuesto'
                ]);
                intervencionId = nuevaIntervencionResult.insertId;
              }

              // Crear averia_intervencion
              const cantidad = parseInt(item.cantidad) || 1;
              const precioUnitario = parseFloat(item.precio) || 0;
              const precioTotal = precioUnitario * cantidad;

              await connection.execute(`
                INSERT INTO averia_intervenciones (
                  dispositivo_averia_id, intervencion_id, cantidad,
                  precio_unitario, precio_total, estado_intervencion
                ) VALUES (?, ?, ?, ?, ?, 'planificada')
              `, [dispositivoAveriaId, intervencionId, cantidad, precioUnitario, precioTotal]);

              totalAveria += precioTotal;
            }
          }

          // Actualizar total de la avería
          await connection.execute(`
            UPDATE dispositivo_averias SET total_averia = ? WHERE id = ?
          `, [totalAveria, dispositivoAveriaId]);

          totalDispositivo += totalAveria;
        }

        // Actualizar total del dispositivo
        await connection.execute(`
          UPDATE reparacion_detalles SET total_dispositivo = ? WHERE id = ?
        `, [totalDispositivo, detalleId]);

        totalGeneralReparacion += totalDispositivo;

        resultadosTerminales.push({
          detalle_id: detalleId,
          marca: dispositivo.marca,
          modelo: dispositivo.modelo,
          total: totalDispositivo
        });
      }

      // 4. Actualizar totales finales
      const descuentoValor = totales?.descuento || 0;
      const totalFinal = totalGeneralReparacion - descuentoValor;

      await connection.execute(`
        UPDATE reparaciones 
        SET total_presupuestado = ?, total_final = ?, estado_general = 'en_diagnostico'
        WHERE id = ?
      `, [totalGeneralReparacion, totalFinal, reparacionId]);

      // 5. Registrar en historial
      await connection.execute(`
        INSERT INTO reparacion_historial (reparacion_id, evento_tipo, descripcion)
        VALUES (?, 'creacion', ?)
      `, [
        reparacionId,
        `Reparación creada con ${terminales.length} dispositivo(s). Total: €${totalFinal.toFixed(2)}`
      ]);

      await connection.commit();
      console.log('✅ Reparación creada exitosamente con nueva estructura');

      return {
        reparacion_id: reparacionId,
        numero_orden: numeroOrden,
        cliente_id: clienteId,
        dispositivos_creados: terminales.length,
        total_final: totalFinal,
        terminales: resultadosTerminales
      };

    } catch (error) {
      await connection.rollback();
      console.error('❌ Error en creación con nueva estructura:', error);
      throw error;
    } finally {
      await connection.end();
    }
  }

  // Actualizar estado con historial completo y captura de datos
  async actualizarEstado(id, estado, notas, userId = 1) {
    // Obtener estado anterior para auditoría
    const [reparacionAnterior] = await executeQuery(
      'SELECT estado_general, total_final, notas_generales FROM reparaciones WHERE id = ?',
      [id]
    );
    
    if (!reparacionAnterior) {
      throw new Error('Reparación no encontrada');
    }
    
    console.log('🔍 Datos anteriores obtenidos:', reparacionAnterior);
    
    // Capturar datos anteriores
    const datosAnteriores = {
      estado_anterior: reparacionAnterior.estado_general,
      total_anterior: reparacionAnterior.total_final,
      notas_anteriores: reparacionAnterior.notas_generales,
      fecha_cambio: new Date().toISOString()
    };
    
    // Actualizar estado
    await this.update(id, { 
      estado_general: estado,
      updated_by: userId 
    });
    
    // Capturar datos nuevos
    const datosNuevos = {
      estado_nuevo: estado,
      total_actual: reparacionAnterior.total_final, // Mantiene el mismo total a menos que se modifique
      notas_nuevas: notas || null,
      fecha_cambio: new Date().toISOString()
    };
    
    console.log('📊 Datos para auditoría:');
    console.log('   Anteriores:', JSON.stringify(datosAnteriores));
    console.log('   Nuevos:', JSON.stringify(datosNuevos));
    
    // Registrar en historial con datos completos para auditoría
    await executeQuery(`
      INSERT INTO reparacion_historial (
        reparacion_id, evento_tipo, descripcion, 
        datos_anteriores, datos_nuevos, usuario_id
      ) VALUES (?, 'cambio_estado', ?, ?, ?, ?)
    `, [
      id, 
      `Estado cambiado a: ${estado}${notas ? '. Notas: ' + notas : ''}`,
      JSON.stringify(datosAnteriores),
      JSON.stringify(datosNuevos),
      userId
    ]);
    
    console.log('✅ Historial actualizado con datos de auditoría');
  }

  // Buscar reparaciones con filtros optimizados
  async buscarConFiltros(filtros = {}) {
    let whereConditions = ['1=1'];
    let params = [];
    
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
    
    const whereClause = 'WHERE ' + whereConditions.join(' AND ');
    
    const query = `
      SELECT 
        r.*,
        c.nombre as cliente_nombre,
        c.apellidos as cliente_apellidos,
        c.telefono as cliente_telefono,
        c.dni as cliente_dni,
        COUNT(DISTINCT rd.id) as total_dispositivos,
        COUNT(DISTINCT da.id) as total_averias
      FROM reparaciones r
      LEFT JOIN clientes c ON r.cliente_id = c.id
      LEFT JOIN reparacion_detalles rd ON r.id = rd.reparacion_id
      LEFT JOIN dispositivo_averias da ON rd.id = da.reparacion_detalle_id
      ${whereClause}
      GROUP BY r.id
      ORDER BY r.fecha_ingreso DESC
      LIMIT ${filtros.limit || 50} OFFSET ${filtros.offset || 0}
    `;

    return await executeQuery(query, params);
  }
}

module.exports = ReparacionModelNew;