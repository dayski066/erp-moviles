// hooks/useSugerenciasReales.ts - Hook para sugerencias basadas únicamente en datos reales de BD
import { useState, useCallback } from 'react';

export interface SugerenciaAveria {
  id: number;
  nombre: string;
  descripcion: string;
  categoria: string;
  tiempo_estimado_horas: number;
  frecuencia: number;
  casos_exitosos: number;
  porcentaje_exito: number;
  confianza: number;
}

export interface SugerenciaIntervencion {
  id: number;
  nombre: string;
  descripcion: string;
  precio_base: number;
  tiempo_estimado_minutos: number;
  dificultad: string;
  frecuencia: number;
  porcentaje_exito: number;
  confianza: number;
}

export const useSugerenciasReales = () => {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Obtener sugerencias de averías por modelo específico (PASO 3)
  const obtenerSugerenciasAverias = useCallback(async (
    marcaId: number, 
    modeloId: number, 
    limit: number = 3
  ): Promise<SugerenciaAveria[]> => {
    if (!modeloId) {
      console.log('ℹ️ No hay modelo seleccionado, no se pueden obtener sugerencias');
      return [];
    }

    try {
      setCargando(true);
      setError(null);
      
      console.log(`🔍 Obteniendo sugerencias de averías para modelo ID: ${modeloId}`);
      
      const response = await fetch(
        `http://localhost:5001/api/catalogos/averias/sugerencias-por-modelo/${modeloId}?limit=${limit}`
      );
      
      const data = await response.json();
      
      if (data.success && data.data?.sugerencias) {
        const sugerencias = data.data.sugerencias.map((averia: any, index: number) => ({
          ...averia,
          porcentaje_exito: averia.casos_exitosos > 0 
            ? Math.round((averia.casos_exitosos / averia.frecuencia) * 100) 
            : 0,
          confianza: Math.min(95, 70 + (averia.frecuencia * 5)) // Mayor confianza con más casos
        }));
        
        console.log(`✅ ${sugerencias.length} sugerencias de averías encontradas para ${data.data.modelo?.marca_nombre} ${data.data.modelo?.nombre}`);
        return sugerencias;
      } else {
        console.log(`ℹ️ No hay sugerencias de averías para el modelo seleccionado (sin historial)`);
        return [];
      }
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : 'Error desconocido';
      setError(mensaje);
      console.error('❌ Error obteniendo sugerencias de averías:', error);
      return [];
    } finally {
      setCargando(false);
    }
  }, []);

  // Obtener sugerencias de intervenciones por avería y modelo (PASO 5)
  const obtenerSugerenciasIntervenciones = useCallback(async (
    averiaId: number,
    modeloId: number,
    limit: number = 3
  ): Promise<SugerenciaIntervencion[]> => {
    if (!averiaId || !modeloId) {
      console.log('ℹ️ No hay avería o modelo seleccionado, no se pueden obtener sugerencias de intervenciones');
      return [];
    }

    try {
      setCargando(true);
      setError(null);
      
      console.log(`🔍 Obteniendo sugerencias de intervenciones para avería ${averiaId} y modelo ${modeloId}`);
      
      const response = await fetch(
        `http://localhost:5001/api/catalogos/intervenciones/sugerencias?averia_id=${averiaId}&modelo_id=${modeloId}&limit=${limit}`
      );
      
      const data = await response.json();
      
      if (data.success && data.data) {
        const sugerencias = (data.data || []).map((intervencion: any) => ({
          ...intervencion,
          porcentaje_exito: intervencion.casos_exitosos > 0 
            ? Math.round((intervencion.casos_exitosos / intervencion.frecuencia) * 100) 
            : 0,
          confianza: Math.min(95, 60 + (intervencion.frecuencia * 8)) // Alta confianza para datos reales
        }));
        
        console.log(`✅ ${sugerencias.length} sugerencias de intervenciones encontradas`);
        return sugerencias;
      } else {
        console.log(`ℹ️ No hay sugerencias de intervenciones para esta avería/modelo (sin historial)`);
        return [];
      }
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : 'Error desconocido';
      setError(mensaje);
      console.error('❌ Error obteniendo sugerencias de intervenciones:', error);
      return [];
    } finally {
      setCargando(false);
    }
  }, []);

  // Limpiar estado
  const limpiarEstado = useCallback(() => {
    setError(null);
    setCargando(false);
  }, []);

  return {
    // Estados
    cargandoSugerencias: cargando,
    errorSugerencias: error,
    
    // Funciones
    obtenerSugerenciasAverias,
    obtenerSugerenciasIntervenciones,
    limpiarEstado
  };
};