import { useState, useEffect, useCallback } from 'react';
import { useReparacionStore } from '../store/reparacionStore';
import { ReparacionAPI } from '../services/api.service';

export const useAutoSave = (delay = 2000) => {
  const [saving, setSaving] = useState(false);
  const [lastSave, setLastSave] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const store = useReparacionStore();
  const api = new ReparacionAPI();
  
  const save = useCallback(async () => {
    if (!store.isValid()) return;
    
    setSaving(true);
    setError(null);
    
    try {
      const state = store.getResumen();
      
      // Guardar en localStorage
      localStorage.setItem('reparacion_draft', JSON.stringify(state));
      
      // Sync con backend si hay conexión
      if (navigator.onLine) {
        await api.saveDraft(state);
      }
      
      const now = new Date();
      setLastSave(now);
      store.setUltimoGuardado(now);
      store.setSaveState('saved');
      
    } catch (err) {
      console.error('Error en auto-save:', err);
      setError(err instanceof Error ? err.message : 'Error al guardar');
      store.setSaveState('error');
    } finally {
      setSaving(false);
    }
  }, [store, api]);
  
  // Debounced save function
  const debouncedSave = useCallback(
    debounce(save, delay),
    [save, delay]
  );
  
  // Auto-save en cambios
  useEffect(() => {
    // Usar un listener personalizado para detectar cambios
    const checkForChanges = () => {
      const cliente = store.cliente;
      const dispositivos = store.dispositivos;
      const diagnosticos = store.diagnosticos;
      
      if (cliente || dispositivos.length > 0 || diagnosticos.size > 0) {
        debouncedSave();
      }
    };
    
    // Verificar cambios cada 5 segundos
    const interval = setInterval(checkForChanges, 5000);
    
    return () => clearInterval(interval);
  }, [debouncedSave, store]);
  
  // Guardar al salir de la página
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (store.isValid()) {
        save();
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [save, store]);
  
  // Recuperar draft al cargar
  useEffect(() => {
    const loadDraft = () => {
      try {
        const draft = localStorage.getItem('reparacion_draft');
        if (draft) {
          const parsedDraft = JSON.parse(draft);
          // TODO: Restaurar estado desde draft
          console.log('Draft cargado:', parsedDraft);
        }
      } catch (err) {
        console.error('Error cargando draft:', err);
      }
    };
    
    loadDraft();
  }, []);
  
  return {
    saving,
    lastSave,
    error,
    save,
    saveState: store.saveState
  };
};

// Función debounce helper
function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
} 