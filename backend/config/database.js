// config/database.js - Versión simple y sin warnings
const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'erp_moviles',
  port: parseInt(process.env.DB_PORT) || 3306,
  charset: 'utf8mb4'
};

console.log('🔧 Configuración de DB:', {
  host: dbConfig.host,
  user: dbConfig.user,
  database: dbConfig.database,
  port: dbConfig.port,
  password: dbConfig.password ? '***' : 'NO PASSWORD'
});

// Pool de conexiones (SIN las opciones problemáticas)
const pool = mysql.createPool({
  host: dbConfig.host,
  user: dbConfig.user,
  password: dbConfig.password,
  database: dbConfig.database,
  port: dbConfig.port,
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Función para crear una conexión individual
const createConnection = async () => {
  try {
    console.log('🔄 Intentando conectar a MySQL...');
    const connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conexión a MySQL establecida correctamente');
    return connection;
  } catch (error) {
    console.error('❌ Error conectando a MySQL:');
    console.error('Código:', error.code);
    console.error('Mensaje:', error.message);
    throw error;
  }
};

// Función para probar la conexión
const testConnection = async () => {
  let connection = null;
  
  try {
    console.log('\n🧪 === PRUEBA DE CONEXIÓN ===');
    connection = await createConnection();
    
    // Probar una query simple
    console.log('🔍 Ejecutando query de prueba...');
    const [rows] = await connection.execute('SELECT 1 as test, NOW() as fecha');
    console.log('✅ Query ejecutada:', rows[0]);
    
    // Verificar tablas en la base de datos actual
    console.log('🗂️  Verificando tablas en', dbConfig.database, '...');
    const [tables] = await connection.execute('SHOW TABLES');
    console.log(`📋 Tablas encontradas (${tables.length}):`);
    
    if (tables.length > 0) {
      tables.forEach((table, index) => {
        const tableName = Object.values(table)[0];
        console.log(`   ${index + 1}. ${tableName}`);
      });
      
      // Verificar que las tablas de reparaciones están presentes
      const tablesArray = tables.map(table => Object.values(table)[0]);
      const reparacionTables = tablesArray.filter(name => 
        name.includes('reparacion') || name.includes('averia') || name.includes('dispositivo')
      );
      
      if (reparacionTables.length > 0) {
        console.log('✅ Sistema de reparaciones detectado:', reparacionTables.length, 'tablas relacionadas');
      }
    } else {
      console.log('   (No hay tablas creadas)');
    }
    
    console.log('\n🎉 ¡CONEXIÓN EXITOSA!');
    return true;
    
  } catch (error) {
    console.error('\n💥 === ERROR EN CONEXIÓN ===');
    console.error('Tipo:', error.code || 'UNKNOWN');
    console.error('Mensaje:', error.message);
    
    // Diagnósticos específicos
    if (error.code === 'ECONNREFUSED') {
      console.error('🔧 Solución: Verifica que MySQL esté ejecutándose');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('🔐 Solución: Verifica usuario y contraseña');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('🗄️  Solución: Crea la base de datos primero');
    }
    
    return false;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexión cerrada');
    }
  }
};

// Función para ejecutar queries
const executeQuery = async (query, params = []) => {
  try {
    const [results] = await pool.execute(query, params);
    return results;
  } catch (error) {
    console.error('❌ Error ejecutando query:', error.message);
    throw error;
  }
};

// Función para transacciones
const executeTransaction = async (queries) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const results = [];
    for (const { query, params } of queries) {
      const [result] = await connection.execute(query, params || []);
      results.push(result);
    }
    
    await connection.commit();
    return results;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  pool,
  createConnection,
  testConnection,
  executeQuery,
  executeTransaction,
  dbConfig
};