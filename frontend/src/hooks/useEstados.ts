// hooks/useEstados.ts - Hook para gestionar estados desde BD
import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export interface Estado {
  id: number;
  nombre: string;
  categoria: 'reparacion' | 'dispositivo' | 'unificado';
  color: string;
  emoji: string;
  orden: number;
}

export interface EstadoCrear {
  nombre: string;
  categoria: 'reparacion' | 'dispositivo' | 'unificado';
  color?: string;
  emoji?: string;
  orden?: number;
}

export const useEstados = () => {
  const [estados, setEstados] = useState<Estado[]>([]);
  const [estadosReparacion, setEstadosReparacion] = useState<Estado[]>([]);
  const [estadosDispositivo, setEstadosDispositivo] = useState<Estado[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar todos los estados unificados
  const cargarEstados = useCallback(async () => {
    try {
      setCargando(true);
      setError(null);
      
      // Cargar TODOS los estados (sin filtro de categoría)
      const url = '/catalogos/estados';
      
      const response = await api.get(url);
      
      if (response.data.success && response.data.data) {
        const estadosData = response.data.data;
        
        // Guardar todos los estados en las tres variables para compatibilidad
        setEstados(estadosData);
        setEstadosReparacion(estadosData);
        setEstadosDispositivo(estadosData);
      } else {
        throw new Error('API no devolvió datos válidos');
      }
    } catch (error) {
      console.error('❌ Error cargando estados:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setCargando(false);
    }
  }, []);

  // Crear nuevo estado
  const crearEstado = useCallback(async (data: EstadoCrear): Promise<boolean> => {
    try {
      const response = await api.post('/catalogos/estados', data);
      
      if (response.data.success) {
        // Recargar estados
        await cargarEstados();
        return true;
      } else {
        throw new Error(response.data.message || 'Error creando estado');
      }
    } catch (error) {
      console.error('❌ Error creando estado:', error);
      throw error;
    }
  }, [cargarEstados]);

  // Actualizar estado
  const actualizarEstado = useCallback(async (id: number, data: Partial<EstadoCrear>): Promise<boolean> => {
    try {
      const response = await api.put(`/catalogos/estados/${id}`, data);
      
      if (response.data.success) {
        // Recargar estados
        await cargarEstados();
        return true;
      } else {
        throw new Error(response.data.message || 'Error actualizando estado');
      }
    } catch (error) {
      console.error('❌ Error actualizando estado:', error);
      throw error;
    }
  }, [cargarEstados]);

  // Eliminar estado
  const eliminarEstado = useCallback(async (id: number): Promise<boolean> => {
    try {
      const response = await api.delete(`/catalogos/estados/${id}`);
      
      if (response.data.success) {
        // Recargar estados
        await cargarEstados();
        return true;
      } else {
        throw new Error(response.data.message || 'Error eliminando estado');
      }
    } catch (error) {
      console.error('❌ Error eliminando estado:', error);
      throw error;
    }
  }, [cargarEstados]);

  // Obtener estado por ID
  const obtenerEstadoPorId = useCallback((id: number): Estado | undefined => {
    return estados.find(estado => estado.id === id);
  }, [estados]);

  // Obtener opciones para select (ahora unificado)
  const getOpcionesEstados = useCallback((categoria?: 'reparacion' | 'dispositivo') => {
    const opciones = estados.map(estado => ({
      value: estado.id.toString(),
      label: `${estado.emoji && estado.emoji !== '?' ? estado.emoji : '📋'} ${estado.nombre}`,
      color: estado.color
    }));
    
    return opciones;
  }, [estados]);

  // Cargar estados al montar el componente
  useEffect(() => {
    cargarEstados();
  }, [cargarEstados]);

  // Función para forzar recarga de estados
  const recargarEstados = useCallback(async () => {
    await cargarEstados();
  }, [cargarEstados]);

  return {
    // Estados
    estados,
    estadosReparacion,
    estadosDispositivo,
    cargando,
    error,
    
    // Funciones
    cargarEstados,
    recargarEstados,
    crearEstado,
    actualizarEstado,
    eliminarEstado,
    obtenerEstadoPorId,
    getOpcionesEstados
  };
};