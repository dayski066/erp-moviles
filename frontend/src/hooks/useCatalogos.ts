// src/hooks/useCatalogos.ts - COMPLETAMENTE ACTUALIZADO CON SOPORTE PARA ICONOS
import { useState, useEffect, useCallback } from 'react';
import type { Marca, Modelo, ApiResponse, DispositivoBusqueda } from '../types/Catalogo';

// Tipos específicos para las respuestas del API
interface MarcaCreada {
  id: number;
  nombre: string;
  logo_emoji?: string;
  tipo_icono: 'emoji' | 'imagen';
  icono_path?: string;
}

interface MarcaActualizada {
  id: number;
  nombre: string;
  logo_emoji?: string;
  tipo_icono: 'emoji' | 'imagen';
  icono_path?: string;
}

interface ModeloCreado {
  id: number;
  marca_id: number;
  nombre: string;
}

interface ModeloActualizado {
  id: number;
  marca_id: number;
  nombre: string;
}

interface EliminacionResponse {
  success: boolean;
  message?: string;
}

const API_BASE = 'http://localhost:5001/api/catalogos';

export const useCatalogos = () => {
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [cargandoMarcas, setCargandoMarcas] = useState(false);
  const [cargandoModelos, setCargandoModelos] = useState(false);  
  const [errorMarcas, setErrorMarcas] = useState<string | null>(null);
  const [errorModelos, setErrorModelos] = useState<string | null>(null);

  // Cargar marcas al montar el hook
  const cargarMarcas = useCallback(async () => {
    try {
      setCargandoMarcas(true);
      setErrorMarcas(null);
      
      const response = await fetch(`${API_BASE}/marcas`);
      const data: ApiResponse<Marca[]> = await response.json();
      
      if (data.success && data.data) {
        setMarcas(data.data);
        console.log('✅ Marcas cargadas:', data.data.length);
        console.log('📊 Detalles marcas:', data.data.map(m => ({ 
          id: m.id, 
          nombre: m.nombre, 
          tipo: m.tipo_icono,
          icono: m.tipo_icono === 'imagen' ? m.icono_path : m.logo_emoji 
        })));
      } else {
        throw new Error(data.message || 'Error cargando marcas');
      }
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : 'Error desconocido';
      setErrorMarcas(mensaje);
      console.error('❌ Error cargando marcas:', error);
    } finally {
      setCargandoMarcas(false);
    }
  }, []);

  // Cargar modelos por marca
  const cargarModelos = useCallback(async (marcaId: number) => {
    try {
      setCargandoModelos(true);
      setErrorModelos(null);
      console.log('📦 Cargando modelos para marca ID:', marcaId);
      
      const response = await fetch(`${API_BASE}/modelos/marca/${marcaId}`);
      const data: ApiResponse<Modelo[]> = await response.json();
      
      console.log('📋 Respuesta modelos:', data);
      
      if (data.success && data.data) {
        setModelos(data.data);
        console.log('✅ Modelos cargados:', data.data.length);
      } else {
        console.error('❌ Error cargando modelos:', data.message);
        setModelos([]);
        setErrorModelos(data.message || 'Error cargando modelos');
      }
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : 'Error desconocido';
      setErrorModelos(mensaje);
      console.error('💥 Error cargando modelos:', error);
      setModelos([]);
    } finally {
      setCargandoModelos(false);
    }
  }, []);

  // Buscar dispositivos (búsqueda inteligente)
  const buscarDispositivos = useCallback(async (termino: string): Promise<DispositivoBusqueda[]> => {
    if (!termino || termino.length < 2) {
      return [];
    }

    try {
      const resultados: DispositivoBusqueda[] = [];
      
      // Buscar en marcas
      marcas.forEach((marca: Marca) => {
        if (marca.nombre.toLowerCase().includes(termino.toLowerCase())) {
          resultados.push({
            marca: marca.nombre,
            modelo: 'Todos los modelos'
          });
        }
      });

      // Buscar en modelos
      for (const marca of marcas) {
        try {
          const response = await fetch(`${API_BASE}/modelos/marca/${marca.id}`);
          const data: ApiResponse<Modelo[]> = await response.json();
          
          if (data.success && data.data) {
            data.data.forEach((modelo: Modelo) => {
              if (modelo.nombre.toLowerCase().includes(termino.toLowerCase())) {
                resultados.push({
                  marca: marca.nombre,
                  modelo: modelo.nombre
                });
              }
            });
          }
        } catch (error) {
          console.error(`Error buscando en marca ${marca.nombre}:`, error);
        }
      }

      return resultados.slice(0, 5); // Limitar a 5 resultados
    } catch (error) {
      console.error('Error en búsqueda:', error);
      return [];
    }
  }, [marcas]);

  // ✅ FUNCIÓN ACTUALIZADA: Crear nueva marca (solo emoji - backend maneja FormData)
  const crearMarca = useCallback(async (nombre: string, emoji: string = '📱'): Promise<boolean> => {
    try {
      console.log('🔧 Hook crearMarca - enviando:', { nombre, emoji });
      
      const response = await fetch(`${API_BASE}/marcas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nombre.trim(),
          logo_emoji: emoji,
          tipo_icono: 'emoji' // Explícito para marcas creadas desde hook
        })
      });

      const data: ApiResponse<MarcaCreada> = await response.json();
      
      console.log('📥 Respuesta backend:', data);
      
      if (data.success) {
        await cargarMarcas(); // Recargar marcas
        console.log('✅ Marca creada y marcas recargadas');
        return true;
      } else {
        throw new Error(data.message || 'Error creando marca');
      }
    } catch (error) {
      console.error('❌ Error en hook crearMarca:', error);
      throw error;
    }
  }, [cargarMarcas]);

  // ✅ NUEVA FUNCIÓN: Crear marca con FormData (para imágenes)
  const crearMarcaConImagen = useCallback(async (formData: FormData): Promise<boolean> => {
    try {
      console.log('🖼️ Hook crearMarcaConImagen - enviando FormData');
      
      const response = await fetch(`${API_BASE}/marcas`, {
        method: 'POST',
        body: formData // No headers - FormData los añade automáticamente
      });

      const data: ApiResponse<MarcaCreada> = await response.json();
      
      console.log('📥 Respuesta backend (imagen):', data);
      
      if (data.success) {
        await cargarMarcas(); // Recargar marcas
        console.log('✅ Marca con imagen creada y marcas recargadas');
        return true;
      } else {
        throw new Error(data.message || 'Error creando marca con imagen');
      }
    } catch (error) {
      console.error('❌ Error en hook crearMarcaConImagen:', error);
      throw error;
    }
  }, [cargarMarcas]);

  // ✅ NUEVA FUNCIÓN: Actualizar marca existente
  const actualizarMarca = useCallback(async (id: number, formData: FormData): Promise<boolean> => {
    try {
      console.log('📝 Hook actualizarMarca - ID:', id);
      
      const response = await fetch(`${API_BASE}/marcas/${id}`, {
        method: 'PUT',
        body: formData
      });

      const data: ApiResponse<MarcaActualizada> = await response.json();
      
      console.log('📥 Respuesta actualización:', data);
      
      if (data.success) {
        await cargarMarcas(); // Recargar marcas
        console.log('✅ Marca actualizada y marcas recargadas');
        return true;
      } else {
        throw new Error(data.message || 'Error actualizando marca');
      }
    } catch (error) {
      console.error('❌ Error en hook actualizarMarca:', error);
      throw error;
    }
  }, [cargarMarcas]);

  // ✅ NUEVA FUNCIÓN: Obtener marca por ID
  const obtenerMarcaPorId = useCallback(async (id: number): Promise<Marca | null> => {
    try {
      const marca = marcas.find(m => m.id === id);
      if (marca) {
        console.log('✅ Marca encontrada en cache:', marca);
        return marca;
      }
      
      // Si no está en cache, recargar marcas
      await cargarMarcas();
      const marcaActualizada = marcas.find(m => m.id === id);
      
      console.log('🔄 Marca después de recargar:', marcaActualizada);
      return marcaActualizada || null;
    } catch (error) {
      console.error('❌ Error obteniendo marca por ID:', error);
      return null;
    }
  }, [marcas, cargarMarcas]);

  // Crear nuevo modelo (sin cambios)
  const crearModelo = useCallback(async (marcaId: number, nombre: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE}/modelos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          marca_id: marcaId,
          nombre: nombre.trim()
        })
      });

      const data: ApiResponse<ModeloCreado> = await response.json();
      if (data.success) {
        await cargarModelos(marcaId); // Recargar modelos
        return true;
      } else {
        throw new Error(data.message || 'Error creando modelo');
      }
    } catch (error) {
      console.error('Error creando modelo:', error);
      throw error;
    }
  }, [cargarModelos]);

  // ✅ NUEVA FUNCIÓN: Eliminar marca
  const eliminarMarca = useCallback(async (id: number): Promise<boolean> => {
    try {
      console.log('🗑️ Hook eliminarMarca - ID:', id);
      
      const response = await fetch(`${API_BASE}/marcas/${id}`, {
        method: 'DELETE'
      });

      const data: ApiResponse<EliminacionResponse> = await response.json();
      
      console.log('📥 Respuesta eliminación marca:', data);
      
      if (data.success) {
        await cargarMarcas(); // Recargar marcas
        console.log('✅ Marca eliminada y marcas recargadas');
        return true;
      } else {
        throw new Error(data.message || 'Error eliminando marca');
      }
    } catch (error) {
      console.error('❌ Error en hook eliminarMarca:', error);
      throw error;
    }
  }, [cargarMarcas]);

  // ✅ NUEVA FUNCIÓN: Eliminar modelo
  const eliminarModelo = useCallback(async (id: number): Promise<boolean> => {
  try {
    console.log('🗑️ Hook eliminarModelo - ID:', id);
    
    // Encontrar el modelo a eliminar para obtener su marca_id
    const modeloAEliminar = modelos.find(m => m.id === id);
    
    const response = await fetch(`${API_BASE}/modelos/${id}`, {
      method: 'DELETE'
    });

    const data: ApiResponse<EliminacionResponse> = await response.json();
    
    console.log('📥 Respuesta eliminación modelo:', data);
    
    if (data.success) {
      // Si conocemos la marca del modelo eliminado, recargar sus modelos
      if (modeloAEliminar && modeloAEliminar.marca_id) {
        await cargarModelos(modeloAEliminar.marca_id);
      }
      console.log('✅ Modelo eliminado y modelos recargados');
      return true;
    } else {
      throw new Error(data.message || 'Error eliminando modelo');
    }
  } catch (error) {
    console.error('❌ Error en hook eliminarModelo:', error);
    throw error;
  }
}, [modelos, cargarModelos]);


  // ✅ NUEVA FUNCIÓN: Obtener modelo por ID
  const obtenerModeloPorId = useCallback(async (id: number): Promise<Modelo | null> => {
    try {
      const modelo = modelos.find(m => m.id === id);
      if (modelo) {
        console.log('✅ Modelo encontrado en cache:', modelo);
        return modelo;
      }
      
      console.log('🔄 Modelo no encontrado en cache, buscando...');
      // Si el modelo no está en caché, no hay una forma directa de buscar un modelo específico por ID
      // sin cargar todos los modelos de una marca o tener un endpoint específico.
      // Si la API tiene un endpoint como /api/catalogos/modelos/:id, se podría hacer un fetch.
      // Asumiendo que `modelos` ya contiene los modelos cargados relevantes,
      // esta función se basa en la caché actual.
      return null;
    } catch (error) {
      console.error('❌ Error obteniendo modelo por ID:', error);
      return null;
    }
  }, [modelos]);

  // ✅ NUEVA FUNCIÓN: Actualizar modelo
  const actualizarModelo = useCallback(async (id: number, nombre: string, marcaId: number): Promise<boolean> => {
    try {
      console.log('📝 Hook actualizarModelo - ID:', id, 'Nombre:', nombre);
      
      const response = await fetch(`${API_BASE}/modelos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nombre.trim(),
          marca_id: marcaId
        })
      });

      const data: ApiResponse<ModeloActualizado> = await response.json();
      
      console.log('📥 Respuesta actualización modelo:', data);
      
      if (data.success) {
        await cargarModelos(marcaId); // Recargar modelos
        console.log('✅ Modelo actualizado y modelos recargados');
        return true;
      } else {
        throw new Error(data.message || 'Error actualizando modelo');
      }
    } catch (error) {
      console.error('❌ Error en hook actualizarModelo:', error);
      throw error;
    }
  }, [cargarModelos]);

  // Efecto para cargar marcas al montar
  useEffect(() => {
    cargarMarcas();
  }, [cargarMarcas]);

  return {
    // Estados
    marcas,
    modelos,
    cargandoMarcas,
    cargandoModelos,
    errorMarcas,
    errorModelos,
    
    // Funciones existentes
    cargarMarcas,
    cargarModelos,
    buscarDispositivos,
    crearMarca, // Para emoji (compatibilidad)
    crearModelo,
    
    // ✅ FUNCIONES para iconos
    crearMarcaConImagen,
    actualizarMarca,
    obtenerMarcaPorId,
    
    // ✅ NUEVAS FUNCIONES para eliminar/editar
    eliminarMarca,
    eliminarModelo,
    obtenerModeloPorId,
    actualizarModelo
  };
};