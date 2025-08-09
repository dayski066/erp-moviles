const { testConnection } = require('../config/database');

// Middleware para verificar conexión DB en cada request
const ensureDatabaseConnection = async (req, res, next) => {
  try {
    const isConnected = await testConnection();
    if (!isConnected) {
      return res.status(500).json({
        success: false,
        message: 'Error de conexión a la base de datos'
      });
    }
    next();
  } catch (error) {
    console.error('Error en middleware de base de datos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = { ensureDatabaseConnection };
