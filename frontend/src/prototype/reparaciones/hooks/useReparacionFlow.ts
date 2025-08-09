import { useCallback, useMemo } from 'react';
import { useReparacionStore } from '../store/reparacionStore';
import { useAutoSave } from './useAutoSave';
import { ReparacionAPI } from '../services/api.service';
import { 
  Cliente, 
  Dispositivo, 
  DiagnosticoPresupuesto,
  Suggestion 
} from '../types/reparacion.types';

export const useReparacionFlow = () => {
  const store = useReparacionStore();
  const { saving, save, error: saveError } = useAutoSave();
  const api = new ReparacionAPI();
  
  // Estado del flujo
  const cliente = store.cliente;
  const dispositivos = store.dispositivos;
  const diagnosticos = store.diagnosticos;
  const seccionActiva = store.seccionActiva;
  const progress = store.getProgress();
  const isValid = store.isValid();
  
  // Acciones del cliente
  const updateCliente = useCallback(async (clienteData: Cliente) => {
    store.setLoadingState('cliente', true);
    try {
      store.setCliente(clienteData);
      await save();
    } finally {
      store.setLoadingState('cliente', false);
    }
  }, [store, save]);
  
  const searchCliente = useCallback(async (term: string) => {
    if (term.length < 2) return [];
    
    store.setClienteSearchState('searching');
    try {
      const results = await api.searchCliente(term);
      store.setClienteSearchState(results.length > 0 ? 'found' : 'not-found');
      return results;
    } catch (error) {
      store.setClienteSearchState('error');
      return [];
    }
  }, [api, store]);
  
  const createCliente = useCallback(async (clienteData: Omit<Cliente, 'id'>) => {
    store.setLoadingState('cliente', true);
    try {
      const newCliente = await api.createCliente(clienteData);
      store.setCliente(newCliente);
      await save();
      return newCliente;
    } finally {
      store.setLoadingState('cliente', false);
    }
  }, [api, store, save]);
  
  // Acciones de dispositivos
  const addDispositivo = useCallback(async (dispositivoData: Omit<Dispositivo, 'id' | 'orden' | 'fecha_creacion'>) => {
    const newDispositivo: Dispositivo = {
      ...dispositivoData,
      id: crypto.randomUUID(),
      orden: dispositivos.length + 1,
      fecha_creacion: new Date()
    };
    
    store.setLoadingState('dispositivos', true);
    try {
      store.addDispositivo(newDispositivo);
      await save();
      return newDispositivo;
    } finally {
      store.setLoadingState('dispositivos', false);
    }
  }, [store, dispositivos.length, save]);
  
  const removeDispositivo = useCallback(async (id: string) => {
    store.setLoadingState('dispositivos', true);
    try {
      store.removeDispositivo(id);
      await save();
    } finally {
      store.setLoadingState('dispositivos', false);
    }
  }, [store, save]);
  
  const updateDispositivo = useCallback(async (id: string, updates: Partial<Dispositivo>) => {
    store.setLoadingState('dispositivos', true);
    try {
      store.updateDispositivo(id, updates);
      await save();
    } finally {
      store.setLoadingState('dispositivos', false);
    }
  }, [store, save]);
  
  const reorderDispositivos = useCallback(async (fromIndex: number, toIndex: number) => {
    store.setLoadingState('dispositivos', true);
    try {
      store.reorderDispositivos(fromIndex, toIndex);
      await save();
    } finally {
      store.setLoadingState('dispositivos', false);
    }
  }, [store, save]);
  
  // Acciones de diagnóstico
  const setDiagnostico = useCallback(async (dispositivoId: string, data: DiagnosticoPresupuesto) => {
    store.setLoadingState('diagnosticos', true);
    try {
      store.setDiagnostico(dispositivoId, data);
      await save();
    } finally {
      store.setLoadingState('diagnosticos', false);
    }
  }, [store, save]);
  
  const removeDiagnostico = useCallback(async (dispositivoId: string) => {
    store.setLoadingState('diagnosticos', true);
    try {
      store.removeDiagnostico(dispositivoId);
      await save();
    } finally {
      store.setLoadingState('diagnosticos', false);
    }
  }, [store, save]);
  
  // Navegación
  const setSeccionActiva = useCallback((seccion: 'cliente' | 'dispositivos' | 'diagnostico') => {
    store.setSeccionActiva(seccion);
  }, [store]);
  
  const nextSeccion = useCallback(() => {
    const secciones: Array<'cliente' | 'dispositivos' | 'diagnostico'> = ['cliente', 'dispositivos', 'diagnostico'];
    const currentIndex = secciones.indexOf(seccionActiva);
    const nextIndex = Math.min(currentIndex + 1, secciones.length - 1);
    store.setSeccionActiva(secciones[nextIndex]);
  }, [seccionActiva, store]);
  
  const prevSeccion = useCallback(() => {
    const secciones: Array<'cliente' | 'dispositivos' | 'diagnostico'> = ['cliente', 'dispositivos', 'diagnostico'];
    const currentIndex = secciones.indexOf(seccionActiva);
    const prevIndex = Math.max(currentIndex - 1, 0);
    store.setSeccionActiva(secciones[prevIndex]);
  }, [seccionActiva, store]);
  
  // Validaciones
  const canProceed = useCallback(() => {
    switch (seccionActiva) {
      case 'cliente':
        return !!cliente && store.clienteValidado;
      case 'dispositivos':
        return dispositivos.length > 0;
      case 'diagnostico':
        return diagnosticos.size > 0;
      default:
        return false;
    }
  }, [seccionActiva, cliente, dispositivos.length, diagnosticos.size, store.clienteValidado]);
  
  // Sugerencias IA
  const getSuggestions = useCallback(async (type: string, context: any): Promise<Suggestion[]> => {
    try {
      return await api.getSuggestions(type, context);
    } catch (error) {
      console.error('Error obteniendo sugerencias:', error);
      return [];
    }
  }, [api]);
  
  // Validación IMEI
  const validateIMEI = useCallback(async (imei: string) => {
    try {
      return await api.validateIMEI(imei);
    } catch (error) {
      return { valid: false };
    }
  }, [api]);
  
  // Crear reparación final
  const createReparacion = useCallback(async () => {
    if (!isValid) throw new Error('Reparación no válida');
    
    store.setLoadingState('guardando', true);
    try {
      const resumen = store.getResumen();
      const result = await api.createReparacion(resumen);
      
      // Limpiar store después de crear
      store.resetStore();
      
      return result;
    } finally {
      store.setLoadingState('guardando', false);
    }
  }, [store, isValid, api]);
  
  // Computed values
  const resumen = useMemo(() => store.getResumen(), [store]);
  const totalReparacion = useMemo(() => store.getTotalReparacion(), [store]);
  const dispositivosCount = useMemo(() => store.getDispositivosCount(), [store]);
  const averiasCount = useMemo(() => store.getAveriasCount(), [store]);
  const intervencionesCount = useMemo(() => store.getIntervencionesCount(), [store]);
  
  // Estados de carga
  const loadingStates = store.loadingStates;
  
  return {
    // Estado
    cliente,
    dispositivos,
    diagnosticos,
    seccionActiva,
    progress,
    isValid,
    resumen,
    totalReparacion,
    dispositivosCount,
    averiasCount,
    intervencionesCount,
    loadingStates,
    
    // Acciones cliente
    updateCliente,
    searchCliente,
    createCliente,
    
    // Acciones dispositivos
    addDispositivo,
    removeDispositivo,
    updateDispositivo,
    reorderDispositivos,
    
    // Acciones diagnóstico
    setDiagnostico,
    removeDiagnostico,
    
    // Navegación
    setSeccionActiva,
    nextSeccion,
    prevSeccion,
    
    // Validaciones
    canProceed,
    
    // Sugerencias
    getSuggestions,
    validateIMEI,
    
    // Crear reparación
    createReparacion,
    
    // Auto-save
    saving,
    saveError,
    save
  };
}; 