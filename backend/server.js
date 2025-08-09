// server.js - Servidor Express modular
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

// Importar configuración de base de datos
const { testConnection } = require('./config/database');

// Importar rutas
const testRoutes = require('./routes/test');
const reparacionRoutes = require('./routes/reparaciones');
const ventaRoutes = require('./routes/ventas');
const compraRoutes = require('./routes/compras');
const clienteRoutes = require('./routes/clientes');
const catalogosRoutes = require('./routes/catalogos');

// IMPORTACIONES DUPLICADAS ELIMINADAS

// Importar middleware
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5001;

// =====================================================
// MIDDLEWARE GLOBAL
// =====================================================

// Middleware de seguridad - Configuración relajada para desarrollo
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }, // ✅ Permitir recursos cross-origin
  contentSecurityPolicy: false // ✅ Desactivar CSP para desarrollo
}));

// Configuración CORS amplia
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Length', 'Content-Type']
}));

// ✅ CORS específico para archivos estáticos (ANTES de express.static)
app.use('/logos', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Cache-Control', 'public, max-age=3600'); // Cache por 1 hora
  
  // Manejar preflight OPTIONS
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// ✅ Servir archivos estáticos con headers CORS
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, filePath) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET');
    res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  }
}));

// Middleware para parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging en desarrollo
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// =====================================================
// ENDPOINT TEMPORAL FUERA DE REPARACIONES PARA EVITAR MIDDLEWARE
app.get('/api/test-lista-reparaciones', async (req, res) => {
  try {
    const { executeQuery } = require('./config/database');
    
    console.log('🧪 TEST: Endpoint fuera de reparaciones');
    
    const query = `SELECT * FROM reparaciones ORDER BY fecha_ingreso DESC LIMIT 50`;
    
    const reparaciones = await executeQuery(query);
    console.log(`✅ TEST: ${reparaciones.length} reparaciones encontradas`);
    
    res.json({
      success: true,
      data: reparaciones,
      message: `TEST: ${reparaciones.length} reparaciones - SIN MIDDLEWARE`
    });
  } catch (error) {
    console.error('❌ TEST ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'TEST ERROR',
      error: error.message
    });
  }
});

// RUTAS MODULARIZADAS
// =====================================================

// Rutas de prueba y salud
app.use('/api', testRoutes);

// Rutas principales del negocio (versiones originales)
app.use('/api/reparaciones', reparacionRoutes);
app.use('/api/ventas', ventaRoutes);
app.use('/api/compras', compraRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/catalogos', catalogosRoutes);

// RUTAS V2 ELIMINADAS - USAMOS SOLO LAS ORIGINALES

// Ruta temporal para datos de prueba (actualizado)
const testDataRoutes = require('./routes/test-data');
app.use('/api/test', testDataRoutes);

// Ruta de prueba de conexión DB
app.get('/api/test-db', async (req, res) => {
  try {
    const isConnected = await testConnection();
    res.json({
      success: true,
      message: isConnected ? 'Conexión exitosa' : 'Error de conexión',
      database: process.env.DB_NAME
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error de conexión',
      error: error.message
    });
  }
});

// ✅ Ruta de debug para verificar archivos estáticos
app.get('/debug/logos', (req, res) => {
  const fs = require('fs');
  const logosPath = path.join(__dirname, 'public', 'logos');
  
  try {
    const files = fs.readdirSync(logosPath);
    res.json({
      success: true,
      path: logosPath,
      files: files,
      count: files.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      path: logosPath
    });
  }
});

// =====================================================
// MANEJO DE ERRORES
// =====================================================

// Middleware de manejo de errores
app.use(errorHandler);

// Ruta 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
    timestamp: new Date().toISOString()
  });
});

// =====================================================
// INICIAR SERVIDOR
// =====================================================

const startServer = async () => {
  try {
    // Probar conexión a la base de datos al iniciar
    console.log('🔍 Probando conexión a la base de datos...');
    const isConnected = await testConnection();
    
    if (!isConnected) {
      console.error('❌ No se pudo conectar a la base de datos');
      process.exit(1);
    }

    // Verificar carpeta de logos
    const logosPath = path.join(__dirname, 'public', 'logos');
    const fs = require('fs');
    if (!fs.existsSync(logosPath)) {
      fs.mkdirSync(logosPath, { recursive: true });
      console.log('📁 Carpeta de logos creada:', logosPath);
    } else {
      const files = fs.readdirSync(logosPath);
      console.log(`📁 Carpeta de logos encontrada con ${files.length} archivos`);
    }

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log('\n🚀 ===============================');
      console.log('   SERVIDOR MODULAR INICIADO');
      console.log('🚀 ===============================');
      console.log(`📡 Puerto: ${PORT}`);
      console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 URL Base: http://localhost:${PORT}`);
      console.log('\n📋 Rutas disponibles:');
      console.log(`   🏥 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`   🗄️  Test DB: http://localhost:${PORT}/api/test-db`);
      console.log(`   🔧 Reparaciones: http://localhost:${PORT}/api/reparaciones`);
      console.log(`   💰 Ventas: http://localhost:${PORT}/api/ventas`);
      console.log(`   🛒 Compras: http://localhost:${PORT}/api/compras`);
      console.log(`   👥 Clientes: http://localhost:${PORT}/api/clientes`);
      console.log(`   📦 Catálogos: http://localhost:${PORT}/api/catalogos`);
      console.log(`   🖼️  Logos: http://localhost:${PORT}/logos/`);
      console.log(`   🔍 Debug Logos: http://localhost:${PORT}/debug/logos`);
      console.log('\n🚀 === NUEVAS RUTAS OPTIMIZADAS V2 ===');
      console.log(`   📦 Catálogos V2: http://localhost:${PORT}/api/v2/catalogos`);
      console.log(`   🔧 Reparaciones V2: http://localhost:${PORT}/api/v2/reparaciones`);
      console.log('\n✅ ¡Servidor modular listo!');
    });

  } catch (error) {
    console.error('❌ Error iniciando el servidor:', error);
    process.exit(1);
  }
};

// Manejo de errores no capturados
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Iniciar servidor
startServer();