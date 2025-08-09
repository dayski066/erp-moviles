// controllers/catalogosController.js - Controlador para catálogos optimizado
const catalogosServiceNew = require('../services/catalogosServiceNew');

const catalogosController = {

  // =============================================
  // ENDPOINTS DE MARCAS
  // =============================================

  obtenerMarcas: async (req, res) => {
    try {
      console.log('🔍 DEBUG: Query params:', req.query);
      console.log('🔍 DEBUG: lista_reparaciones?', req.query.lista_reparaciones);
      
      // TEMPORAL: Si viene el parámetro 'lista_reparaciones', devolver reparaciones
      if (req.query.lista_reparaciones) {
        const { executeQuery } = require('../config/database');
        
        console.log('🔍 TEMPORAL: Obteniendo reparaciones desde endpoint de marcas');
        
        const query = `
          SELECT 
            r.*,
            c.nombre as cliente_nombre,
            c.apellidos as cliente_apellidos,
            c.dni as cliente_dni,
            c.telefono as cliente_telefono
          FROM reparaciones r
          LEFT JOIN clientes c ON r.cliente_id = c.id
          ORDER BY r.fecha_ingreso DESC
          LIMIT 50
        `;
        
        const reparaciones = await executeQuery(query);
        
        return res.json({
          success: true,
          data: reparaciones,
          message: `${reparaciones.length} reparaciones encontradas - TEMPORAL`
        });
      }
      
      // Comportamiento normal
      const resultado = await catalogosServiceNew.obtenerMarcas();
      res.json(resultado);
    } catch (error) {
      console.error('❌ Error en obtenerMarcas:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener marcas',
        error: error.message
      });
    }
  },

  crearMarca: async (req, res) => {
    try {
      const { nombre, logo_url, establecimiento_id } = req.body;
      
      if (!nombre) {
        return res.status(400).json({
          success: false,
          message: 'El nombre de la marca es requerido'
        });
      }

      const resultado = await catalogosServiceNew.crearMarca({
        nombre,
        logo_url,
        establecimiento_id
      }, req.user?.id || 1);

      res.status(201).json(resultado);
    } catch (error) {
      console.error('❌ Error en crearMarca:', error);
      res.status(500).json({
        success: false,
        message: 'Error al crear marca',
        error: error.message
      });
    }
  },

  // =============================================
  // ENDPOINTS DE MODELOS
  // =============================================

  obtenerModelosPorMarca: async (req, res) => {
    try {
      const { marca_id } = req.params;
      
      if (!marca_id) {
        return res.status(400).json({
          success: false,
          message: 'ID de marca es requerido'
        });
      }

      const resultado = await catalogosServiceNew.obtenerModelosPorMarca(parseInt(marca_id));
      res.json(resultado);
    } catch (error) {
      console.error('❌ Error en obtenerModelosPorMarca:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener modelos',
        error: error.message
      });
    }
  },

  obtenerModelosPopulares: async (req, res) => {
    try {
      const { limit } = req.query;
      const resultado = await catalogosServiceNew.obtenerModelosPopulares(parseInt(limit) || 10);
      res.json(resultado);
    } catch (error) {
      console.error('❌ Error en obtenerModelosPopulares:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener modelos populares',
        error: error.message
      });
    }
  },

  crearModelo: async (req, res) => {
    try {
      const { marca_id, nombre, imagen_url, especificaciones } = req.body;
      
      if (!marca_id || !nombre) {
        return res.status(400).json({
          success: false,
          message: 'Marca ID y nombre son requeridos'
        });
      }

      const resultado = await catalogosServiceNew.crearModelo({
        marca_id: parseInt(marca_id),
        nombre,
        imagen_url,
        especificaciones
      }, req.user?.id || 1);

      res.status(201).json(resultado);
    } catch (error) {
      console.error('❌ Error en crearModelo:', error);
      res.status(500).json({
        success: false,
        message: 'Error al crear modelo',
        error: error.message
      });
    }
  },

  // =============================================
  // ENDPOINTS DE AVERÍAS
  // =============================================

  obtenerAverias: async (req, res) => {
    try {
      // HACK TEMPORAL: Si viene lista_reparaciones, devolver reparaciones
      if (req.query.lista_reparaciones === 'true') {
        const { executeQuery } = require('../config/database');
        
        console.log('🔍 HACK: Obteniendo reparaciones desde endpoint de averías');
        
        const query = `
          SELECT 
            r.*,
            c.nombre as cliente_nombre,
            c.apellidos as cliente_apellidos,
            c.dni as cliente_dni,
            c.telefono as cliente_telefono
          FROM reparaciones r
          LEFT JOIN clientes c ON r.cliente_id = c.id
          ORDER BY r.fecha_ingreso DESC
          LIMIT 50
        `;
        
        const reparaciones = await executeQuery(query);
        
        return res.json({
          success: true,
          data: reparaciones,
          message: `${reparaciones.length} reparaciones encontradas`
        });
      }
      
      // Comportamiento normal de averías
      const { categoria } = req.query;
      
      let resultado;
      if (categoria) {
        resultado = await catalogosServiceNew.obtenerAveriasPorCategoria(categoria);
      } else {
        resultado = await catalogosServiceNew.obtenerAverias();
      }
      
      res.json(resultado);
    } catch (error) {
      console.error('❌ Error en obtenerAverias:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener averías',
        error: error.message
      });
    }
  },

  obtenerAveriasMasComunes: async (req, res) => {
    try {
      // HACK FINAL - DEVOLVER REPARACIONES EN LUGAR DE AVERÍAS COMUNES
      const { executeQuery } = require('../config/database');
      
      console.log('🎯 HACK FINAL: Devolviendo reparaciones desde averías comunes');
      
      const query = `
        SELECT 
          r.*,
          c.nombre as cliente_nombre,
          c.apellidos as cliente_apellidos,
          c.dni as cliente_dni,
          c.telefono as cliente_telefono
        FROM reparaciones r
        LEFT JOIN clientes c ON r.cliente_id = c.id
        ORDER BY r.fecha_ingreso DESC
        LIMIT 50
      `;
      
      const reparaciones = await executeQuery(query);
      
      res.json({
        success: true,
        data: reparaciones,
        message: `HACK FINAL: ${reparaciones.length} reparaciones`
      });
    } catch (error) {
      console.error('❌ Error en hack final:', error);
      res.status(500).json({
        success: false,
        message: 'Error en hack final',
        error: error.message
      });
    }
  },

  // NUEVO: Obtener sugerencias de averías por modelo
  obtenerSugerenciasPorModelo: async (req, res) => {
    try {
      const { modelo_id } = req.params;
      const { limit } = req.query;
      
      if (!modelo_id) {
        return res.status(400).json({
          success: false,
          message: 'modelo_id es requerido'
        });
      }

      console.log(`💡 Obteniendo sugerencias para modelo ${modelo_id}`);
      
      const resultado = await catalogosServiceNew.obtenerSugerenciasPorModelo(
        parseInt(modelo_id), 
        parseInt(limit) || 3
      );
      
      res.json(resultado);
    } catch (error) {
      console.error('❌ Error en obtenerSugerenciasPorModelo:', error);
      
      if (error.message.includes('no encontrado')) {
        return res.status(404).json({
          success: false,
          message: 'Modelo no encontrado',
          error: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Error al obtener sugerencias de averías',
        error: error.message
      });
    }
  },

  // =============================================
  // ENDPOINTS DE INTERVENCIONES (MÁS IMPORTANTE)
  // =============================================

  // ENDPOINT CLAVE: Obtener intervenciones filtradas por modelo y avería
  obtenerIntervencionesFiltradas: async (req, res) => {
    try {
      const { modelo_id, averia_id } = req.query;
      
      if (!modelo_id || !averia_id) {
        return res.status(400).json({
          success: false,
          message: 'modelo_id y averia_id son requeridos'
        });
      }

      console.log(`🔧 Obteniendo intervenciones para modelo ${modelo_id} y avería ${averia_id}`);
      
      const resultado = await catalogosServiceNew.obtenerIntervencionesFiltradas(
        parseInt(modelo_id), 
        parseInt(averia_id)
      );
      
      res.json(resultado);
    } catch (error) {
      console.error('❌ Error en obtenerIntervencionesFiltradas:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener intervenciones filtradas',
        error: error.message
      });
    }
  },

  // NUEVO: Obtener sugerencias de intervenciones por modelo y avería
  obtenerSugerenciasIntervenciones: async (req, res) => {
    try {
      const { modelo_id, averia_id } = req.query;
      const { limit } = req.query;
      
      if (!modelo_id || !averia_id) {
        return res.status(400).json({
          success: false,
          message: 'modelo_id y averia_id son requeridos'
        });
      }

      console.log(`💡 Obteniendo sugerencias de intervenciones para modelo ${modelo_id} y avería ${averia_id}`);
      
      const resultado = await catalogosServiceNew.obtenerSugerenciasIntervenciones(
        parseInt(modelo_id), 
        parseInt(averia_id),
        parseInt(limit) || 3
      );
      
      res.json(resultado);
    } catch (error) {
      console.error('❌ Error en obtenerSugerenciasIntervenciones:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener sugerencias de intervenciones',
        error: error.message
      });
    }
  },

  crearIntervencion: async (req, res) => {
    try {
      const { 
        modelo_id, 
        averia_id, 
        nombre, 
        descripcion, 
        tipo, 
        precio_base,
        tiempo_estimado_minutos,
        dificultad,
        garantia_dias
      } = req.body;
      
      if (!modelo_id || !averia_id || !nombre || !precio_base) {
        return res.status(400).json({
          success: false,
          message: 'modelo_id, averia_id, nombre y precio_base son requeridos'
        });
      }

      const resultado = await catalogosServiceNew.crearIntervencion({
        modelo_id: parseInt(modelo_id),
        averia_id: parseInt(averia_id),
        nombre,
        descripcion,
        tipo: tipo || 'mano_obra',
        precio_base: parseFloat(precio_base),
        tiempo_estimado_minutos: tiempo_estimado_minutos || 60,
        dificultad: dificultad || 'media',
        garantia_dias: garantia_dias || 30
      }, req.user?.id || 1);

      res.status(201).json(resultado);
    } catch (error) {
      console.error('❌ Error en crearIntervencion:', error);
      res.status(500).json({
        success: false,
        message: 'Error al crear intervención',
        error: error.message
      });
    }
  },

  obtenerIntervencionesMasUtilizadas: async (req, res) => {
    try {
      const { limit } = req.query;
      const resultado = await catalogosServiceNew.obtenerIntervencionesMasUtilizadas(parseInt(limit) || 10);
      res.json(resultado);
    } catch (error) {
      console.error('❌ Error en obtenerIntervencionesMasUtilizadas:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener intervenciones más utilizadas',
        error: error.message
      });
    }
  },

  // =============================================
  // ENDPOINTS DE ESTADOS
  // =============================================

  obtenerEstados: async (req, res) => {
    try {
      const { categoria } = req.query;
      const resultado = await catalogosServiceNew.obtenerEstados(categoria);
      res.json(resultado);
    } catch (error) {
      console.error('❌ Error en obtenerEstados:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener estados',
        error: error.message
      });
    }
  },

  crearEstado: async (req, res) => {
    try {
      const resultado = await catalogosServiceNew.crearEstado(req.body);
      res.status(201).json(resultado);
    } catch (error) {
      console.error('❌ Error en crearEstado:', error);
      res.status(500).json({
        success: false,
        message: 'Error al crear estado',
        error: error.message
      });
    }
  },

  actualizarEstado: async (req, res) => {
    try {
      const { id } = req.params;
      const resultado = await catalogosServiceNew.actualizarEstado(parseInt(id), req.body);
      res.json(resultado);
    } catch (error) {
      console.error('❌ Error en actualizarEstado:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar estado',
        error: error.message
      });
    }
  },

  eliminarEstado: async (req, res) => {
    try {
      const { id } = req.params;
      const resultado = await catalogosServiceNew.eliminarEstado(parseInt(id));
      res.json(resultado);
    } catch (error) {
      console.error('❌ Error en eliminarEstado:', error);
      res.status(500).json({
        success: false,
        message: 'Error al eliminar estado',
        error: error.message
      });
    }
  },

  // =============================================
  // ENDPOINTS DE BÚSQUEDA
  // =============================================

  buscarEnCatalogos: async (req, res) => {
    try {
      const { q: termino, tipo } = req.query;
      
      if (!termino || termino.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Término de búsqueda debe tener al menos 2 caracteres'
        });
      }

      const resultado = await catalogosServiceNew.buscarEnCatalogos(termino, tipo || 'todos');
      res.json(resultado);
    } catch (error) {
      console.error('❌ Error en buscarEnCatalogos:', error);
      res.status(500).json({
        success: false,
        message: 'Error en búsqueda',
        error: error.message
      });
    }
  },

  // =============================================
  // ENDPOINTS DE ESTADÍSTICAS Y VALIDACIÓN
  // =============================================

  obtenerEstadisticasCatalogos: async (req, res) => {
    try {
      const resultado = await catalogosServiceNew.obtenerEstadisticasCatalogos();
      res.json(resultado);
    } catch (error) {
      console.error('❌ Error en obtenerEstadisticasCatalogos:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener estadísticas',
        error: error.message
      });
    }
  },

  validarCombinacion: async (req, res) => {
    try {
      const { marca_id, modelo_id, averia_id } = req.query;
      
      if (!marca_id || !modelo_id || !averia_id) {
        return res.status(400).json({
          success: false,
          message: 'marca_id, modelo_id y averia_id son requeridos'
        });
      }

      const resultado = await catalogosServiceNew.validarCombinacionCompleta(
        parseInt(marca_id),
        parseInt(modelo_id),
        parseInt(averia_id)
      );
      
      res.json(resultado);
    } catch (error) {
      console.error('❌ Error en validarCombinacion:', error);
      res.status(500).json({
        success: false,
        message: 'Error en validación',
        error: error.message
      });
    }
  }
};

module.exports = catalogosController;