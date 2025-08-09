// routes/test.js - Rutas de prueba y salud del servidor

const express = require('express');
const router = express.Router();
const { testConnection, executeQuery } = require('../config/database');

// Ruta de salud del servidor
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Ruta de prueba de conexión DB
router.get('/test-db', async (req, res) => {
  try {
    const isConnected = await testConnection();
    res.json({
      success: true,
      message: isConnected ? 'Conexión exitosa' : 'Error de conexión',
      database: process.env.DB_NAME,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error de conexión',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Ruta para obtener estadísticas de tablas
router.get('/database/stats', async (req, res) => {
  try {
    // Obtener información de todas las tablas
    const tables = await executeQuery('SHOW TABLES');
    const tableNames = tables.map(table => Object.values(table)[0]);
    
    // Contar registros en cada tabla principal
    const stats = {};
    const mainTables = ['clientes', 'establecimientos', 'reparaciones', 'reparacion_dispositivos', 'dispositivo_averias'];
    
    for (const tableName of mainTables) {
      if (tableNames.includes(tableName)) {
        try {
          const [countResult] = await executeQuery(`SELECT COUNT(*) as total FROM ${tableName}`);
          stats[tableName] = countResult.total;
        } catch (error) {
          stats[tableName] = 'Error';
        }
      }
    }
    
    res.json({
      success: true,
      data: {
        totalTables: tables.length,
        tableNames,
        recordCounts: stats,
        systemTables: {
          reparaciones: tableNames.filter(name => name.includes('reparacion')).length,
          averias: tableNames.filter(name => name.includes('averia')).length,
          views: tableNames.filter(name => name.includes('vista')).length
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error obteniendo estadísticas',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Ruta para obtener establecimientos
router.get('/establecimientos', async (req, res) => {
  try {
    const establecimientos = await executeQuery('SELECT * FROM establecimientos ORDER BY nombre');
    
    res.json({
      success: true,
      data: establecimientos,
      count: establecimientos.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error obteniendo establecimientos',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;