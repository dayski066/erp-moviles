// routes/test-data.js - Endpoint temporal para insertar datos de prueba
const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database');
const fs = require('fs').promises;

// Insertar datos de prueba
router.post('/insertar-datos-prueba', async (req, res) => {
  try {
    console.log('🧪 Insertando datos de prueba...');

    // 1. Insertar intervenciones
    const intervenciones = [
      ['Reemplazo pantalla LCD', 'Cambio completo de pantalla LCD', 80.00, 1.5, 'pantalla', 'normal', true, true, 1, 1],
      ['Reemplazo pantalla OLED', 'Cambio completo de pantalla OLED', 120.00, 1.5, 'pantalla', 'normal', true, true, 1, 1],
      ['Reparación cristal templado', 'Solo cambio del cristal exterior', 30.00, 0.5, 'pantalla', 'facil', true, true, 1, 1],
      ['Cambio de batería iPhone', 'Reemplazo de batería original', 45.00, 1.0, 'bateria', 'normal', true, true, 1, 1],
      ['Cambio de batería Samsung', 'Reemplazo de batería original', 40.00, 1.0, 'bateria', 'normal', true, true, 1, 1],
      ['Reparación botón power', 'Arreglo del botón de encendido', 25.00, 1.0, 'botones', 'normal', false, true, 1, 1],
      ['Limpieza por agua', 'Limpieza completa por daño de líquidos', 35.00, 2.5, 'agua', 'dificil', false, true, 1, 1],
      ['Secado en arroz 48h', 'Proceso de secado en arroz', 15.00, 48.0, 'agua', 'facil', false, true, 1, 1],
      ['Cambio conector carga', 'Reemplazo del puerto de carga', 30.00, 1.5, 'conectores', 'normal', true, true, 1, 1],
      ['Reparación cámara trasera', 'Cambio de módulo de cámara', 60.00, 1.0, 'camara', 'normal', true, true, 1, 1],
      ['Reparación altavoz', 'Cambio de altavoz interno', 20.00, 0.8, 'audio', 'facil', true, true, 1, 1],
      ['Reinstalación iOS', 'Restauración completa del sistema', 25.00, 2.0, 'software', 'normal', false, true, 1, 1],
      ['Actualización firmware', 'Actualización del sistema operativo', 15.00, 1.0, 'software', 'facil', false, true, 1, 1]
    ];

    for (const intervencion of intervenciones) {
      await executeQuery(`
        INSERT INTO intervenciones (nombre, descripcion, precio_base, tiempo_estimado_horas, categoria, dificultad, requiere_repuestos, activo, establecimiento_id, created_by) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, intervencion);
    }
    console.log('✅ Intervenciones insertadas');

    // 2. Insertar relaciones averia-intervencion
    const relaciones = [
      // Pantalla rota (averia_id=1) para iPhone 15 Pro Max (modelo_id=1)
      [1, 1, 1, 85.00, 1, 1],
      [1, 2, 1, 125.00, 1, 1],
      [1, 3, 1, 35.00, 1, 1],
      // Batería agotada (averia_id=2) para iPhone 15 Pro Max (modelo_id=1)
      [2, 4, 1, 50.00, 1, 1],
      // Botón power (averia_id=3) para iPhone 15 Pro Max (modelo_id=1)
      [3, 6, 1, 30.00, 1, 1],
      // Conector carga (averia_id=4) para iPhone 15 Pro Max (modelo_id=1)
      [4, 9, 1, 35.00, 1, 1],
      // Cámara (averia_id=5) para iPhone 15 Pro Max (modelo_id=1)
      [5, 10, 1, 70.00, 1, 1],
      // Daño por agua (averia_id=6) para iPhone 15 Pro Max (modelo_id=1)
      [6, 7, 1, 40.00, 1, 1],
      [6, 8, 1, 20.00, 1, 1],
      // Software (averia_id=7) para iPhone 15 Pro Max (modelo_id=1)
      [7, 12, 1, 30.00, 1, 1],
      [7, 13, 1, 20.00, 1, 1],
      // Audio (averia_id=8) para iPhone 15 Pro Max (modelo_id=1)
      [8, 11, 1, 25.00, 1, 1],
      // También para iPhone 15 Pro (modelo_id=2)
      [1, 1, 2, 80.00, 1, 1],
      [1, 2, 2, 120.00, 1, 1],
      [2, 4, 2, 45.00, 1, 1],
      [3, 6, 2, 25.00, 1, 1],
      // Y para iPhone 15 (modelo_id=3)
      [1, 1, 3, 75.00, 1, 1],
      [1, 3, 3, 30.00, 1, 1],
      [2, 4, 3, 40.00, 1, 1]
    ];

    for (const relacion of relaciones) {
      await executeQuery(`
        INSERT IGNORE INTO averia_intervenciones (averia_id, intervencion_id, modelo_id, precio_especifico, establecimiento_id, created_by) 
        VALUES (?, ?, ?, ?, ?, ?)
      `, relacion);
    }
    console.log('✅ Relaciones avería-intervención insertadas');

    // 3. Insertar reparaciones de prueba
    const reparaciones = [
      ['REP-001', 1, 'entregada', '2025-01-15', 1, 1],
      ['REP-002', 1, 'entregada', '2025-02-10', 1, 1],
      ['REP-003', 1, 'reparada', '2025-03-05', 1, 1]
    ];

    for (const reparacion of reparaciones) {
      await executeQuery(`
        INSERT IGNORE INTO reparaciones (numero_orden, cliente_id, estado, fecha_ingreso, establecimiento_id, created_by) 
        VALUES (?, ?, ?, ?, ?, ?)
      `, reparacion);
    }
    console.log('✅ Reparaciones de prueba insertadas');

    // 4. Insertar detalles de reparación
    const detalles = [
      [1, 1, '123456789012345', 'SN001', 'Negro', '256GB', 'iPhone 15 Pro Max pantalla rota', 1, 1],
      [2, 1, '123456789012346', 'SN002', 'Azul', '512GB', 'iPhone 15 Pro Max batería', 1, 1],
      [3, 1, '123456789012347', 'SN003', 'Blanco', '1TB', 'iPhone 15 Pro Max pantalla', 1, 1]
    ];

    for (const detalle of detalles) {
      await executeQuery(`
        INSERT IGNORE INTO reparacion_detalles (reparacion_id, modelo_id, imei, numero_serie, color, capacidad, observaciones, establecimiento_id, created_by) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, detalle);
    }
    console.log('✅ Detalles de reparación insertados');

    // 5. Insertar averías de dispositivos para crear historial
    const averias = [
      [1, 1, 'reparada', 'Pantalla completamente rota', 1, 1],
      [2, 2, 'reparada', 'Batería se agota muy rápido', 1, 1],
      [3, 1, 'reparada', 'Cristal agrietado', 1, 1]
    ];

    for (const averia of averias) {
      await executeQuery(`
        INSERT IGNORE INTO dispositivo_averias (reparacion_detalle_id, averia_id, estado_averia, descripcion_tecnica, establecimiento_id, created_by) 
        VALUES (?, ?, ?, ?, ?, ?)
      `, averia);
    }
    console.log('✅ Averías de dispositivos insertadas');

    res.json({
      success: true,
      message: 'Datos de prueba insertados correctamente',
      data: {
        intervenciones: intervenciones.length,
        relaciones: relaciones.length,
        reparaciones: reparaciones.length,
        detalles: detalles.length,
        averias: averias.length
      }
    });

  } catch (error) {
    console.error('❌ Error insertando datos de prueba:', error);
    res.status(500).json({
      success: false,
      message: 'Error al insertar datos de prueba',
      error: error.message
    });
  }
});

// Nuevo endpoint para cargar intervenciones completas
router.post('/cargar-intervenciones-completas', async (req, res) => {
  try {
    console.log('🚀 Cargando intervenciones completas para Apple, Samsung, Xiaomi...');

    // Leer el archivo SQL
    const sqlPath = require('path').join(__dirname, '../../datos_intervenciones_completo.sql');
    const sqlContent = await fs.readFile(sqlPath, 'utf8');

    // Dividir en declaraciones individuales
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('SET'));

    console.log(`📋 Ejecutando ${statements.length} declaraciones SQL...`);

    let ejecutadas = 0;
    let errores = 0;

    for (const statement of statements) {
      try {
        if (statement.toLowerCase().includes('insert') || 
            statement.toLowerCase().includes('delete') ||
            statement.toLowerCase().includes('update')) {
          await executeQuery(statement);
          ejecutadas++;
        }
      } catch (error) {
        console.error(`❌ Error en declaración: ${statement.substring(0, 50)}...`, error.message);
        errores++;
      }
    }

    console.log(`✅ Proceso completado: ${ejecutadas} exitosas, ${errores} errores`);

    res.json({
      success: true,
      message: 'Intervenciones completas cargadas exitosamente',
      data: {
        declaraciones_ejecutadas: ejecutadas,
        errores: errores,
        modelos_agregados: 'Apple (iPhone 15 series), Samsung (Galaxy S24, A54), Xiaomi (14 Pro, Redmi Note 13)',
        intervenciones_creadas: '~30 intervenciones básicas',
        relaciones_creadas: '~80 relaciones modelo-avería-intervención'
      }
    });

  } catch (error) {
    console.error('❌ Error cargando intervenciones completas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cargar intervenciones completas',
      error: error.message
    });
  }
});

module.exports = router;