// middleware/errorHandler.js - Manejo centralizado de errores

const errorHandler = (err, req, res, next) => {
  console.error('❌ Error del servidor:', err.stack);
  
  // Error de validación
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Error de validación',
      errors: err.errors,
      timestamp: new Date().toISOString()
    });
  }
  
  // Error de base de datos
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      message: 'Registro duplicado',
      error: 'Ya existe un registro con estos datos',
      timestamp: new Date().toISOString()
    });
  }
  
  // Error de sintaxis SQL
  if (err.code?.startsWith('ER_')) {
    return res.status(500).json({
      success: false,
      message: 'Error en la base de datos',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Error interno',
      timestamp: new Date().toISOString()
    });
  }
  
  // Error personalizado
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      timestamp: new Date().toISOString()
    });
  }
  
  // Error genérico
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Error interno',
    timestamp: new Date().toISOString()
  });
};

module.exports = errorHandler;