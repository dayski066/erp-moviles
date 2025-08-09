// routes/clientes.js - Rutas de clientes

const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database');

// Obtener clientes
router.get('/', async (req, res, next) => {
  try {
    const clientes = await executeQuery('SELECT * FROM clientes ORDER BY fecha_registro DESC LIMIT 10');
    
    res.json({
      success: true,
      data: clientes,
      count: clientes.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

// Crear cliente de prueba
router.post('/test', async (req, res, next) => {
  try {
    const [establecimiento] = await executeQuery('SELECT * FROM establecimientos LIMIT 1');
    
    if (!establecimiento) {
      await executeQuery(`
        INSERT INTO establecimientos (nombre, direccion, telefono, nif) 
        VALUES ('Establecimiento Test', 'Calle Test 123', '123456789', '12345678A')
      `);
    }
    
    const clienteTest = {
      nombre: 'Cliente',
      apellidos: 'De Prueba',
      dni: `TEST${Date.now()}`.substring(0, 9),
      telefono: '666777888',
      email: 'test@ejemplo.com',
      establecimiento_id: 1
    };
    
    const result = await executeQuery(`
      INSERT INTO clientes (nombre, apellidos, dni, telefono, email, establecimiento_id) 
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      clienteTest.nombre,
      clienteTest.apellidos, 
      clienteTest.dni,
      clienteTest.telefono,
      clienteTest.email,
      clienteTest.establecimiento_id
    ]);
    
    res.json({
      success: true,
      message: 'Cliente de prueba creado exitosamente',
      data: {
        id: result.insertId,
        ...clienteTest
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;