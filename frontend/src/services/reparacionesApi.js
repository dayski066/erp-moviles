// services/reparacionesApi.js - API para reparaciones optimizada V2
import api from './api';

const reparacionesApi = {
  
  // =====================================================
  // ENDPOINTS DE CONSULTA
  // =====================================================
  
  async obtenerReparaciones(params = {}) {
    try {
      const { estado, limit = 50, offset = 0 } = params;
      
      const response = await api.get('/reparaciones/buscar', {
        params: { estado, limit, offset }
      });
      return response.data;
    } catch (error) {
      console.error('❌ Error obteniendo reparaciones:', error);
      throw error;
    }
  },

  async obtenerReparacionPorId(id) {
    try {
      if (!id) {
        throw new Error('ID de reparación es requerido');
      }
      
      const response = await api.get(`/reparaciones/${id}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Error obteniendo reparación ${id}:`, error);
      throw error;
    }
  },

  async buscarReparaciones(filtros = {}) {
    try {
      const response = await api.get('/reparaciones/buscar', {
        params: filtros
      });
      return response.data;
    } catch (error) {
      console.error('❌ Error buscando reparaciones:', error);
      throw error;
    }
  },

  // =====================================================
  // ENDPOINT PRINCIPAL: CREACIÓN DE REPARACIÓN
  // =====================================================
  
  async validarEstructura(datosReparacion) {
    try {
      console.log('🔍 Validando estructura antes de enviar...');
      
      const response = await api.post('/reparaciones/validar-estructura', datosReparacion);
      return response.data;
    } catch (error) {
      console.error('❌ Error validando estructura:', error);
      throw error;
    }
  },

  // MÉTODO PRINCIPAL: Crear reparación completa optimizada
  async crearReparacionCompleta(datosReparacion) {
    try {
      console.log('🚀 Creando reparación con estructura optimizada...');
      console.log('📦 Datos enviados:', JSON.stringify(datosReparacion, null, 2));
      
      const response = await api.post('/reparaciones/crear-completa', datosReparacion);
      return response.data;
    } catch (error) {
      console.error('❌ Error creando reparación:', error);
      throw error;
    }
  },

  // =====================================================
  // ENDPOINTS DE ACTUALIZACIÓN
  // =====================================================
  
  async actualizarEstado(id, estado, notas = '') {
    try {
      if (!id || !estado) {
        throw new Error('ID y estado son requeridos');
      }
      
      const response = await api.patch(`/reparaciones/${id}/estado`, {
        estado,
        notas
      });
      return response.data;
    } catch (error) {
      console.error(`❌ Error actualizando estado de reparación ${id}:`, error);
      throw error;
    }
  },

  // =====================================================
  // ENDPOINTS DE DETALLES
  // =====================================================
  
  async obtenerDispositivosPorReparacion(reparacionId) {
    try {
      const response = await api.get(`/reparaciones/${reparacionId}/dispositivos`);
      return response.data;
    } catch (error) {
      console.error(`❌ Error obteniendo dispositivos de reparación ${reparacionId}:`, error);
      throw error;
    }
  },

  async obtenerAveriasPorDispositivo(dispositivoId) {
    try {
      const response = await api.get(`/reparaciones/dispositivos/${dispositivoId}/averias`);
      return response.data;
    } catch (error) {
      console.error(`❌ Error obteniendo averías de dispositivo ${dispositivoId}:`, error);
      throw error;
    }
  },

  async obtenerIntervencionesPorAveria(averiaId) {
    try {
      const response = await api.get(`/reparaciones/averias/${averiaId}/intervenciones`);
      return response.data;
    } catch (error) {
      console.error(`❌ Error obteniendo intervenciones de avería ${averiaId}:`, error);
      throw error;
    }
  },

  // =====================================================
  // ENDPOINTS DE HISTORIAL Y PAGOS
  // =====================================================
  
  async obtenerHistorial(reparacionId) {
    try {
      const response = await api.get(`/reparaciones/${reparacionId}/historial`);
      return response.data;
    } catch (error) {
      console.error(`❌ Error obteniendo historial de reparación ${reparacionId}:`, error);
      throw error;
    }
  },

  async obtenerPagos(reparacionId) {
    try {
      const response = await api.get(`/reparaciones/${reparacionId}/pagos`);
      return response.data;
    } catch (error) {
      console.error(`❌ Error obteniendo pagos de reparación ${reparacionId}:`, error);
      throw error;
    }
  },

  // =====================================================
  // ENDPOINTS DE ESTADÍSTICAS
  // =====================================================
  
  async obtenerEstadisticas() {
    try {
      const response = await api.get('/reparaciones/stats/dashboard');
      return response.data;
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas de reparaciones:', error);
      throw error;
    }
  },

  async obtenerResumen() {
    try {
      const response = await api.get('/reparaciones/stats/resumen');
      return response.data;
    } catch (error) {
      console.error('❌ Error obteniendo resumen de reparaciones:', error);
      throw error;
    }
  },

  // =====================================================
  // UTILIDADES DE TRANSFORMACIÓN DE DATOS
  // =====================================================
  
  // Transformar datos del frontend al formato esperado por el backend V2
  transformarDatosParaBackend(clienteData, terminalesCompletos, totalesGlobales, metadatos = {}) {
    return {
      cliente: {
        nombre: clienteData.nombre,
        apellidos: clienteData.apellidos,
        dni: clienteData.dni,
        telefono: clienteData.telefono,
        email: clienteData.email || null,
        direccion: clienteData.direccion || null,
        codigoPostal: clienteData.codigoPostal || null
      },
      terminales: terminalesCompletos.map(terminal => ({
        dispositivo: {
          marca: terminal.dispositivo.marca,
          modelo: terminal.dispositivo.modelo,
          imei: terminal.dispositivo.imei || null,
          numero_serie: terminal.dispositivo.numero_serie || null,
          color: terminal.dispositivo.color || null,
          capacidad: terminal.dispositivo.capacidad || null,
          observaciones: terminal.dispositivo.observaciones || null
        },
        diagnostico: {
          problemas_reportados: terminal.diagnostico?.problemas_reportados || [],
          sintomas_adicionales: terminal.diagnostico?.sintomas_adicionales || '',
          prioridad: terminal.diagnostico?.prioridad || 'normal',
          tipo_servicio: terminal.diagnostico?.tipo_servicio || 'reparacion',
          patron_desbloqueo: terminal.diagnostico?.patron_desbloqueo || null,
          requiere_backup: terminal.diagnostico?.requiere_backup || false,
          observaciones_tecnicas: terminal.diagnostico?.observaciones_tecnicas || null
        },
        presupuesto: {
          presupuestoPorAveria: terminal.presupuesto?.presupuestoPorAveria || []
        }
      })),
      totales: {
        subtotal: totalesGlobales.subtotal || 0,
        descuento: totalesGlobales.descuento || 0,
        total: totalesGlobales.total || 0,
        anticipo: totalesGlobales.anticipo || 0
      },
      metadatos: {
        notas: metadatos.notas || '',
        ...metadatos
      }
    };
  },

  // Validar datos antes de enviar
  validarDatosAnteDeEnviar(clienteData, terminalesCompletos) {
    const errores = [];

    // Validar cliente
    if (!clienteData.nombre?.trim()) errores.push('Nombre del cliente es requerido');
    if (!clienteData.apellidos?.trim()) errores.push('Apellidos del cliente son requeridos');
    if (!clienteData.dni?.trim()) errores.push('DNI del cliente es requerido');
    if (!clienteData.telefono?.trim()) errores.push('Teléfono del cliente es requerido');

    // Validar terminales
    if (!terminalesCompletos?.length) {
      errores.push('Debe incluir al menos un dispositivo');
    } else {
      terminalesCompletos.forEach((terminal, index) => {
        if (!terminal.dispositivo?.marca) {
          errores.push(`Terminal ${index + 1}: Marca es requerida`);
        }
        if (!terminal.dispositivo?.modelo) {
          errores.push(`Terminal ${index + 1}: Modelo es requerido`);
        }
        if (!terminal.diagnostico?.problemas_reportados?.length) {
          errores.push(`Terminal ${index + 1}: Debe tener al menos una avería diagnosticada`);
        }
        if (!terminal.presupuesto?.presupuestoPorAveria?.length) {
          errores.push(`Terminal ${index + 1}: Debe tener presupuesto completado`);
        }
      });
    }

    return {
      esValido: errores.length === 0,
      errores
    };
  }
};

export default reparacionesApi;