// services/catalogosApi.js - API para catálogos optimizada V2
import api from './api';

const catalogosApi = {
  
  // =====================================================
  // ENDPOINTS DE MARCAS (PASO 2)
  // =====================================================
  
  async obtenerMarcas() {
    try {
      const response = await api.get('/v2/catalogos/marcas');
      return response.data;
    } catch (error) {
      console.error('❌ Error obteniendo marcas:', error);
      throw error;
    }
  },

  // =====================================================
  // ENDPOINTS DE MODELOS (PASO 2)  
  // =====================================================
  
  async obtenerModelosPorMarca(marcaId) {
    try {
      if (!marcaId) {
        throw new Error('marcaId es requerido');
      }
      
      const response = await api.get(`/v2/catalogos/modelos/marca/${marcaId}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Error obteniendo modelos para marca ${marcaId}:`, error);
      throw error;
    }
  },

  async obtenerModelosPopulares(limit = 10) {
    try {
      const response = await api.get(`/v2/catalogos/modelos/populares`, {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error('❌ Error obteniendo modelos populares:', error);
      throw error;
    }
  },

  // =====================================================
  // ENDPOINTS DE AVERÍAS (PASO 3)
  // =====================================================
  
  async obtenerAverias(categoria = null) {
    try {
      const params = categoria ? { categoria } : {};
      const response = await api.get('/v2/catalogos/averias', { params });
      return response.data;
    } catch (error) {
      console.error('❌ Error obteniendo averías:', error);
      throw error;
    }
  },

  // ENDPOINT CLAVE: Sugerencias de averías por modelo
  async obtenerSugerenciasPorModelo(modeloId, limit = 3) {
    try {
      if (!modeloId) {
        throw new Error('modeloId es requerido');
      }

      console.log(`💡 Obteniendo sugerencias para modelo ${modeloId}`);
      
      const response = await api.get(`/v2/catalogos/averias/sugerencias-por-modelo/${modeloId}`, {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error(`❌ Error obteniendo sugerencias para modelo ${modeloId}:`, error);
      // Si no hay sugerencias, retornar estructura vacía en lugar de error
      if (error.response?.status === 404) {
        return {
          success: true,
          data: {
            sugerencias: [],
            contexto: {
              modelo: null,
              total_sugerencias: 0
            }
          }
        };
      }
      throw error;
    }
  },

  async obtenerAveriasMasComunes(limit = 10) {
    try {
      const response = await api.get('/v2/catalogos/averias/comunes', {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error('❌ Error obteniendo averías más comunes:', error);
      throw error;
    }
  },

  // =====================================================
  // ENDPOINTS DE INTERVENCIONES (PASO 4 - CRÍTICO)
  // =====================================================
  
  // MÉTODO MÁS IMPORTANTE: Obtener intervenciones filtradas
  async obtenerIntervencionesFiltradas(modeloId, averiaId) {
    try {
      if (!modeloId || !averiaId) {
        throw new Error('modeloId y averiaId son requeridos');
      }

      console.log(`🔧 Obteniendo intervenciones para modelo ${modeloId} y avería ${averiaId}`);
      
      const response = await api.get('/v2/catalogos/intervenciones/filtradas', {
        params: {
          modelo_id: modeloId,
          averia_id: averiaId
        }
      });
      return response.data;
    } catch (error) {
      console.error(`❌ Error obteniendo intervenciones filtradas (modelo: ${modeloId}, avería: ${averiaId}):`, error);
      throw error;
    }
  },

  async obtenerIntervencionesMasUtilizadas(limit = 10) {
    try {
      const response = await api.get('/v2/catalogos/intervenciones/utilizadas', {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error('❌ Error obteniendo intervenciones más utilizadas:', error);
      throw error;
    }
  },

  // NUEVO: Obtener sugerencias de intervenciones por modelo y avería
  async obtenerSugerenciasIntervenciones(modeloId, averiaId, limit = 3) {
    try {
      if (!modeloId || !averiaId) {
        throw new Error('modeloId y averiaId son requeridos');
      }
      console.log(`💡 WORKAROUND: Usando endpoint filtradas para obtener sugerencias - modelo ${modeloId} y avería ${averiaId}`);
      
      // WORKAROUND: Usar endpoint filtradas que ya funciona
      const response = await api.get('/catalogos/intervenciones/filtradas', {
        params: { 
          modelo_id: modeloId,
          averia_id: averiaId
        }
      });
      
      if (response.data.success && response.data.data) {
        const intervenciones = Array.isArray(response.data.data) ? response.data.data.slice(0, limit) : [];
        return {
          success: true,
          data: {
            sugerencias: intervenciones,
            total_sugerencias: intervenciones.length
          }
        };
      }
      
      return {
        success: true,
        data: { sugerencias: [], total_sugerencias: 0 }
      };
    } catch (error) {
      console.error(`❌ Error obteniendo sugerencias de intervenciones (modelo: ${modeloId}, avería: ${averiaId}):`, error);
      return {
        success: true,
        data: { sugerencias: [], total_sugerencias: 0 }
      };
    }
  },

  // =====================================================
  // ENDPOINTS DE BÚSQUEDA Y VALIDACIÓN
  // =====================================================
  
  async buscarEnCatalogos(termino, tipo = 'todos') {
    try {
      if (!termino || termino.length < 2) {
        throw new Error('El término de búsqueda debe tener al menos 2 caracteres');
      }

      const response = await api.get('/v2/catalogos/buscar', {
        params: { q: termino, tipo }
      });
      return response.data;
    } catch (error) {
      console.error(`❌ Error buscando "${termino}" en catálogos:`, error);
      throw error;
    }
  },

  async validarCombinacion(marcaId, modeloId, averiaId) {
    try {
      if (!marcaId || !modeloId || !averiaId) {
        throw new Error('marcaId, modeloId y averiaId son requeridos');
      }

      const response = await api.get('/v2/catalogos/validar', {
        params: {
          marca_id: marcaId,
          modelo_id: modeloId,
          averia_id: averiaId
        }
      });
      return response.data;
    } catch (error) {
      console.error(`❌ Error validando combinación (marca: ${marcaId}, modelo: ${modeloId}, avería: ${averiaId}):`, error);
      throw error;
    }
  },

  // =====================================================
  // ENDPOINTS DE ESTADÍSTICAS
  // =====================================================
  
  async obtenerEstadisticasCatalogos() {
    try {
      const response = await api.get('/v2/catalogos/estadisticas');
      return response.data;
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas de catálogos:', error);
      throw error;
    }
  }
};

export default catalogosApi;