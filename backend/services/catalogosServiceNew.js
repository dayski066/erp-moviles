// services/catalogosServiceNew.js - Servicios para catálogos optimizados
const { MarcaModel, ModeloModel, AveriaModel, IntervencionModel, EstadoModel } = require('../models/modules/catalogos');

const catalogosServiceNew = {

  // =============================================
  // SERVICIOS DE MARCAS
  // =============================================

  async obtenerMarcas() {
    try {
      const marcaModel = new MarcaModel();
      const marcas = await marcaModel.findActive();
      
      console.log(`📋 Marcas obtenidas: ${marcas.length}`);
      return {
        success: true,
        data: marcas
      };
    } catch (error) {
      console.error('❌ Error obteniendo marcas:', error);
      throw error;
    }
  },

  async crearMarca(data, userId = 1) {
    try {
      const marcaModel = new MarcaModel();
      
      // Verificar que no existe
      const existente = await marcaModel.findAll({ nombre: data.nombre });
      if (existente.length > 0) {
        throw new Error(`Ya existe una marca con el nombre "${data.nombre}"`);
      }

      const marcaId = await marcaModel.createWithAudit(data, userId);
      
      console.log(`✅ Marca creada: ${data.nombre} (ID: ${marcaId})`);
      return {
        success: true,
        data: { id: marcaId, ...data }
      };
    } catch (error) {
      console.error('❌ Error creando marca:', error);
      throw error;
    }
  },

  // =============================================
  // SERVICIOS DE MODELOS
  // =============================================

  async obtenerModelosPorMarca(marcaId) {
    try {
      const modeloModel = new ModeloModel();
      const modelos = await modeloModel.findByMarca(marcaId);
      
      console.log(`📋 Modelos obtenidos para marca ${marcaId}: ${modelos.length}`);
      return {
        success: true,
        data: modelos
      };
    } catch (error) {
      console.error('❌ Error obteniendo modelos:', error);
      throw error;
    }
  },

  async obtenerModelosPopulares(limit = 10) {
    try {
      const modeloModel = new ModeloModel();
      const modelos = await modeloModel.findPopulares(limit);
      
      return {
        success: true,
        data: modelos
      };
    } catch (error) {
      console.error('❌ Error obteniendo modelos populares:', error);
      throw error;
    }
  },

  async crearModelo(data, userId = 1) {
    try {
      const modeloModel = new ModeloModel();
      
      // Verificar que la marca existe
      const marcaModel = new MarcaModel();
      const marca = await marcaModel.findById(data.marca_id);
      if (!marca) {
        throw new Error(`Marca con ID ${data.marca_id} no encontrada`);
      }

      // Verificar que no existe el modelo para esa marca
      const existente = await modeloModel.findAll({ 
        marca_id: data.marca_id, 
        nombre: data.nombre 
      });
      if (existente.length > 0) {
        throw new Error(`Ya existe el modelo "${data.nombre}" para la marca "${marca.nombre}"`);
      }

      const modeloId = await modeloModel.createWithAudit(data, userId);
      
      console.log(`✅ Modelo creado: ${data.nombre} para ${marca.nombre} (ID: ${modeloId})`);
      return {
        success: true,
        data: { id: modeloId, ...data, marca_nombre: marca.nombre }
      };
    } catch (error) {
      console.error('❌ Error creando modelo:', error);
      throw error;
    }
  },

  // =============================================
  // SERVICIOS DE AVERÍAS
  // =============================================

  async obtenerAverias() {
    try {
      const averiaModel = new AveriaModel();
      const averias = await averiaModel.findActive();
      
      console.log(`📋 Averías obtenidas: ${averias.length}`);
      return {
        success: true,
        data: averias
      };
    } catch (error) {
      console.error('❌ Error obteniendo averías:', error);
      throw error;
    }
  },

  async obtenerAveriasPorCategoria(categoria) {
    try {
      const averiaModel = new AveriaModel();
      const averias = await averiaModel.findByCategoria(categoria);
      
      return {
        success: true,
        data: averias
      };
    } catch (error) {
      console.error('❌ Error obteniendo averías por categoría:', error);
      throw error;
    }
  },

  async obtenerAveriasMasComunes(limit = 10) {
    try {
      const averiaModel = new AveriaModel();
      const averias = await averiaModel.findMasComunes(limit);
      
      return {
        success: true,
        data: averias
      };
    } catch (error) {
      console.error('❌ Error obteniendo averías más comunes:', error);
      throw error;
    }
  },

  // NUEVO: Obtener sugerencias de averías por modelo
  async obtenerSugerenciasPorModelo(modeloId, limit = 3) {
    try {
      const averiaModel = new AveriaModel();
      const modeloModel = new ModeloModel();
      
      // Verificar que el modelo existe
      const modelo = await modeloModel.findWithMarca(modeloId);
      if (!modelo) {
        throw new Error(`Modelo con ID ${modeloId} no encontrado`);
      }

      const sugerencias = await averiaModel.findSugerenciasPorModelo(modeloId, limit);
      
      console.log(`💡 Sugerencias para ${modelo.marca_nombre} ${modelo.nombre}: ${sugerencias.length}`);
      
      return {
        success: true,
        data: {
          sugerencias,
          contexto: {
            modelo: modelo,
            total_sugerencias: sugerencias.length
          }
        }
      };
    } catch (error) {
      console.error('❌ Error obteniendo sugerencias por modelo:', error);
      throw error;
    }
  },

  // =============================================
  // SERVICIOS DE INTERVENCIONES (CLAVE)
  // =============================================

  // MÉTODO MÁS IMPORTANTE: Obtener intervenciones filtradas
  async obtenerIntervencionesFiltradas(modeloId, averiaId) {
    try {
      const intervencionModel = new IntervencionModel();
      
      // Validar que modelo y avería existen
      const modeloModel = new ModeloModel();
      const averiaModel = new AveriaModel();
      
      const [modelo, averia] = await Promise.all([
        modeloModel.findWithMarca(modeloId),
        averiaModel.findById(averiaId)
      ]);

      if (!modelo) {
        throw new Error(`Modelo con ID ${modeloId} no encontrado`);
      }
      if (!averia) {
        throw new Error(`Avería con ID ${averiaId} no encontrada`);
      }

      // Obtener intervenciones filtradas
      const intervenciones = await intervencionModel.findByModeloAndAveria(modeloId, averiaId);
      
      // Obtener rango de precios
      const rangoPrecios = await intervencionModel.getPriceRange(modeloId, averiaId);
      
      console.log(`🔧 Intervenciones encontradas para ${modelo.marca_nombre} ${modelo.nombre} - ${averia.nombre}: ${intervenciones.length}`);
      
      return {
        success: true,
        data: {
          intervenciones,
          contexto: {
            modelo: modelo,
            averia: averia,
            rango_precios: rangoPrecios
          }
        }
      };
    } catch (error) {
      console.error('❌ Error obteniendo intervenciones filtradas:', error);
      throw error;
    }
  },

  async crearIntervencion(data, userId = 1) {
    try {
      const intervencionModel = new IntervencionModel();
      
      // Validar que modelo y avería existen
      const modeloModel = new ModeloModel();
      const averiaModel = new AveriaModel();
      
      const [modelo, averia] = await Promise.all([
        modeloModel.findById(data.modelo_id),
        averiaModel.findById(data.averia_id)
      ]);

      if (!modelo) {
        throw new Error(`Modelo con ID ${data.modelo_id} no encontrado`);
      }
      if (!averia) {
        throw new Error(`Avería con ID ${data.averia_id} no encontrada`);
      }

      // Verificar que no existe la combinación
      const existe = await intervencionModel.existsCombination(
        data.modelo_id, 
        data.averia_id, 
        data.nombre
      );
      
      if (existe) {
        throw new Error(`Ya existe una intervención "${data.nombre}" para ${modelo.nombre} - ${averia.nombre}`);
      }

      const intervencionId = await intervencionModel.createWithAudit(data, userId);
      
      console.log(`✅ Intervención creada: ${data.nombre} para ${modelo.nombre} - ${averia.nombre}`);
      return {
        success: true,
        data: { 
          id: intervencionId, 
          ...data,
          modelo_nombre: modelo.nombre,
          averia_nombre: averia.nombre
        }
      };
    } catch (error) {
      console.error('❌ Error creando intervención:', error);
      throw error;
    }
  },

  async obtenerIntervencionesMasUtilizadas(limit = 10) {
    try {
      const intervencionModel = new IntervencionModel();
      const intervenciones = await intervencionModel.findMasUtilizadas(limit);
      
      return {
        success: true,
        data: intervenciones
      };
    } catch (error) {
      console.error('❌ Error obteniendo intervenciones más utilizadas:', error);
      throw error;
    }
  },

  // NUEVO: Obtener sugerencias de intervenciones por modelo y avería
  async obtenerSugerenciasIntervenciones(modeloId, averiaId, limit = 3) {
    try {
      console.log(`🔍 DEBUGGING: Buscando sugerencias para modelo ${modeloId} y avería ${averiaId}`);
      
      const intervencionModel = new IntervencionModel();
      const modeloModel = new ModeloModel();
      const averiaModel = new AveriaModel();
      
      // Validar que el modelo existe
      const modelo = await modeloModel.findByIdWithMarca(modeloId);
      if (!modelo) {
        console.log(`❌ Modelo ${modeloId} no encontrado`);
        return {
          success: false,
          message: `Modelo con ID ${modeloId} no encontrado`
        };
      }
      
      // Validar que la avería existe
      const averia = await averiaModel.findById(averiaId);
      if (!averia) {
        console.log(`❌ Avería ${averiaId} no encontrada`);
        return {
          success: false,
          message: `Avería con ID ${averiaId} no encontrada`
        };
      }
      
      console.log(`✅ Modelo encontrado: ${modelo.marca_nombre} ${modelo.nombre}`);
      console.log(`✅ Avería encontrada: ${averia.nombre}`);
      
      const sugerencias = await intervencionModel.findSugerenciasPorModeloYAveria(modeloId, averiaId, limit);
      
      console.log(`💡 Sugerencias de intervenciones para ${modelo.marca_nombre} ${modelo.nombre} - ${averia.nombre}: ${sugerencias.length}`);
      
      // Si no hay sugerencias, devolver estructura vacía pero exitosa
      return {
        success: true,
        data: {
          sugerencias: sugerencias || [],
          modelo: {
            id: modelo.id,
            nombre: modelo.nombre,
            marca_nombre: modelo.marca_nombre
          },
          averia: {
            id: averia.id,
            nombre: averia.nombre,
            descripcion: averia.descripcion
          },
          total_sugerencias: sugerencias ? sugerencias.length : 0
        }
      };
    } catch (error) {
      console.error('❌ Error obteniendo sugerencias de intervenciones:', error);
      throw error;
    }
  },

  // =============================================
  // SERVICIOS DE BÚSQUEDA GLOBAL
  // =============================================

  async buscarEnCatalogos(termino, tipo = 'todos') {
    try {
      const resultados = {};

      if (tipo === 'todos' || tipo === 'marcas') {
        const marcaModel = new MarcaModel();
        resultados.marcas = await marcaModel.searchByName(termino);
      }

      if (tipo === 'todos' || tipo === 'averias') {
        const averiaModel = new AveriaModel();
        resultados.averias = await averiaModel.searchByName(termino);
      }

      if (tipo === 'todos' || tipo === 'intervenciones') {
        const intervencionModel = new IntervencionModel();
        resultados.intervenciones = await intervencionModel.searchByName(termino);
      }

      return {
        success: true,
        data: resultados
      };
    } catch (error) {
      console.error('❌ Error en búsqueda global:', error);
      throw error;
    }
  },

  // =============================================
  // SERVICIOS DE ESTADÍSTICAS
  // =============================================

  async obtenerEstadisticasCatalogos() {
    try {
      const marcaModel = new MarcaModel();
      const modeloModel = new ModeloModel();
      const averiaModel = new AveriaModel();
      const intervencionModel = new IntervencionModel();

      const [
        totalMarcas,
        totalModelos,
        totalAverias,
        totalIntervenciones
      ] = await Promise.all([
        marcaModel.count({ activo: true }),
        modeloModel.count({ activo: true }),
        averiaModel.count({ activo: true }),
        intervencionModel.count({ activo: true })
      ]);

      return {
        success: true,
        data: {
          marcas: totalMarcas,
          modelos: totalModelos,
          averias: totalAverias,
          intervenciones: totalIntervenciones,
          fecha_actualizacion: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      throw error;
    }
  },

  // =============================================
  // SERVICIOS DE ESTADOS
  // =============================================

  async obtenerEstados(categoria = null) {
    try {
      const estadoModel = new EstadoModel();
      let estados;
      
      if (categoria) {
        estados = await estadoModel.obtenerPorCategoria(categoria);
      } else {
        estados = await estadoModel.obtenerTodos();
      }
      
      console.log(`📋 Estados obtenidos: ${estados.length} ${categoria ? `(${categoria})` : ''}`);
      return {
        success: true,
        data: estados
      };
    } catch (error) {
      console.error('❌ Error obteniendo estados:', error);
      throw error;
    }
  },

  async crearEstado(data) {
    try {
      const estadoModel = new EstadoModel();
      
      // Verificar que el código no existe
      const existente = await estadoModel.existeCodigo(data.codigo);
      if (existente) {
        throw new Error(`Ya existe un estado con el código "${data.codigo}"`);
      }

      const estado = await estadoModel.crear(data);
      
      console.log(`✅ Estado creado: ${data.nombre} (${data.codigo})`);
      return {
        success: true,
        data: estado
      };
    } catch (error) {
      console.error('❌ Error creando estado:', error);
      throw error;
    }
  },

  async actualizarEstado(id, data) {
    try {
      const estadoModel = new EstadoModel();
      
      // Verificar que el estado existe
      const estadoExistente = await estadoModel.obtenerPorId(id);
      if (!estadoExistente) {
        throw new Error('Estado no encontrado');
      }

      // Verificar que el código no existe en otro estado
      if (data.codigo && data.codigo !== estadoExistente.codigo) {
        const codigoExiste = await estadoModel.existeCodigo(data.codigo, id);
        if (codigoExiste) {
          throw new Error(`Ya existe un estado con el código "${data.codigo}"`);
        }
      }

      const estadoActualizado = await estadoModel.actualizar(id, data);
      
      console.log(`✅ Estado actualizado: ${data.nombre || estadoExistente.nombre} (ID: ${id})`);
      return {
        success: true,
        data: estadoActualizado
      };
    } catch (error) {
      console.error('❌ Error actualizando estado:', error);
      throw error;
    }
  },

  async eliminarEstado(id) {
    try {
      const estadoModel = new EstadoModel();
      
      // Verificar que el estado existe
      const estadoExistente = await estadoModel.obtenerPorId(id);
      if (!estadoExistente) {
        throw new Error('Estado no encontrado');
      }

      await estadoModel.eliminar(id);
      
      console.log(`✅ Estado eliminado: ID ${id}`);
      return {
        success: true,
        message: 'Estado eliminado correctamente'
      };
    } catch (error) {
      console.error('❌ Error eliminando estado:', error);
      throw error;
    }
  },

  // =============================================
  // SERVICIOS DE VALIDACIÓN
  // =============================================

  async validarCombinacionCompleta(marcaId, modeloId, averiaId) {
    try {
      const modeloModel = new ModeloModel();
      const averiaModel = new AveriaModel();
      const intervencionModel = new IntervencionModel();

      // Verificar que modelo pertenece a la marca
      const modelo = await modeloModel.findById(modeloId);
      if (!modelo || modelo.marca_id !== marcaId) {
        return {
          success: false,
          error: 'El modelo no pertenece a la marca especificada'
        };
      }

      // Verificar que avería existe
      const averia = await averiaModel.findById(averiaId);
      if (!averia) {
        return {
          success: false,
          error: 'La avería especificada no existe'
        };
      }

      // Verificar que hay intervenciones disponibles
      const intervenciones = await intervencionModel.findByModeloAndAveria(modeloId, averiaId);
      
      return {
        success: true,
        data: {
          valida: true,
          intervenciones_disponibles: intervenciones.length,
          modelo: modelo,
          averia: averia
        }
      };
    } catch (error) {
      console.error('❌ Error validando combinación:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};

module.exports = catalogosServiceNew;