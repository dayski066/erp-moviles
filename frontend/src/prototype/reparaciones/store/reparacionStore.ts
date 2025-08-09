import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { 
  Cliente, 
  Dispositivo, 
  DiagnosticoPresupuesto, 
  EstadoReparacion,
  ResumenReparacion,
  LoadingStates,
  SearchState,
  SaveState
} from '../types/reparacion.types';

interface ReparacionState {
  // Cliente
  cliente: Cliente | null;
  clienteValidado: boolean;
  clienteSearchState: SearchState;
  
  // Dispositivos
  dispositivos: Dispositivo[];
  dispositivoActivo: string | null;
  dispositivosLoading: boolean;
  
  // Diagnósticos y Presupuestos (unificados)
  diagnosticos: Map<string, DiagnosticoPresupuesto>;
  diagnosticosLoading: boolean;
  
  // UI State
  seccionActiva: 'cliente' | 'dispositivos' | 'diagnostico';
  guardandoAutomatico: boolean;
  ultimoGuardado: Date | null;
  saveState: SaveState;
  
  // Estados de carga
  loadingStates: LoadingStates;
  
  // Configuración
  autoSaveEnabled: boolean;
  autoSaveDelay: number;
  
  // Actions
  setCliente: (cliente: Cliente) => void;
  setClienteValidado: (validado: boolean) => void;
  setClienteSearchState: (state: SearchState) => void;
  
  addDispositivo: (dispositivo: Dispositivo) => void;
  removeDispositivo: (id: string) => void;
  updateDispositivo: (id: string, updates: Partial<Dispositivo>) => void;
  setDispositivoActivo: (id: string | null) => void;
  reorderDispositivos: (fromIndex: number, toIndex: number) => void;
  
  setDiagnostico: (dispositivoId: string, data: DiagnosticoPresupuesto) => void;
  removeDiagnostico: (dispositivoId: string) => void;
  
  setSeccionActiva: (seccion: 'cliente' | 'dispositivos' | 'diagnostico') => void;
  setGuardandoAutomatico: (guardando: boolean) => void;
  setUltimoGuardado: (fecha: Date) => void;
  setSaveState: (state: SaveState) => void;
  
  setLoadingState: (key: keyof LoadingStates, loading: boolean) => void;
  
  // Computed
  getProgress: () => number;
  isValid: () => boolean;
  getResumen: () => ResumenReparacion;
  getTotalReparacion: () => number;
  getDispositivosCount: () => number;
  getAveriasCount: () => number;
  getIntervencionesCount: () => number;
  
  // Reset
  resetStore: () => void;
  resetCliente: () => void;
  resetDispositivos: () => void;
  resetDiagnosticos: () => void;
}

const initialState = {
  cliente: null,
  clienteValidado: false,
  clienteSearchState: 'idle' as SearchState,
  
  dispositivos: [],
  dispositivoActivo: null,
  dispositivosLoading: false,
  
  diagnosticos: new Map<string, DiagnosticoPresupuesto>(),
  diagnosticosLoading: false,
  
  seccionActiva: 'cliente' as const,
  guardandoAutomatico: false,
  ultimoGuardado: null,
  saveState: 'idle' as SaveState,
  
  loadingStates: {
    cliente: false,
    dispositivos: false,
    diagnosticos: false,
    guardando: false
  },
  
  autoSaveEnabled: true,
  autoSaveDelay: 2000
};

export const useReparacionStore = create<ReparacionState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        
        // Actions - Cliente
        setCliente: (cliente) => set({ 
          cliente, 
          clienteValidado: true,
          seccionActiva: 'dispositivos'
        }),
        
        setClienteValidado: (validado) => set({ clienteValidado: validado }),
        
        setClienteSearchState: (state) => set({ clienteSearchState: state }),
        
        // Actions - Dispositivos
        addDispositivo: (dispositivo) => set((state) => ({
          dispositivos: [...state.dispositivos, dispositivo],
          dispositivoActivo: dispositivo.id,
          seccionActiva: 'diagnostico'
        })),
        
        removeDispositivo: (id) => set((state) => ({
          dispositivos: state.dispositivos.filter(d => d.id !== id),
          diagnosticos: new Map([...state.diagnosticos].filter(([key]) => key !== id)),
          dispositivoActivo: state.dispositivoActivo === id ? null : state.dispositivoActivo
        })),
        
        updateDispositivo: (id, updates) => set((state) => ({
          dispositivos: state.dispositivos.map(d => 
            d.id === id ? { ...d, ...updates } : d
          )
        })),
        
        setDispositivoActivo: (id) => set({ dispositivoActivo: id }),
        
        reorderDispositivos: (fromIndex, toIndex) => set((state) => {
          const newDispositivos = [...state.dispositivos];
          const [removed] = newDispositivos.splice(fromIndex, 1);
          newDispositivos.splice(toIndex, 0, removed);
          
          // Actualizar orden
          const dispositivosReordenados = newDispositivos.map((d, index) => ({
            ...d,
            orden: index + 1
          }));
          
          return { dispositivos: dispositivosReordenados };
        }),
        
        // Actions - Diagnósticos
        setDiagnostico: (dispositivoId, data) => set((state) => {
          const newDiagnosticos = new Map(state.diagnosticos);
          newDiagnosticos.set(dispositivoId, data);
          return { diagnosticos: newDiagnosticos };
        }),
        
        removeDiagnostico: (dispositivoId) => set((state) => {
          const newDiagnosticos = new Map(state.diagnosticos);
          newDiagnosticos.delete(dispositivoId);
          return { diagnosticos: newDiagnosticos };
        }),
        
        // Actions - UI
        setSeccionActiva: (seccion) => set({ seccionActiva: seccion }),
        
        setGuardandoAutomatico: (guardando) => set({ guardandoAutomatico: guardando }),
        
        setUltimoGuardado: (fecha) => set({ ultimoGuardado: fecha }),
        
        setSaveState: (state) => set({ saveState: state }),
        
        setLoadingState: (key, loading) => set((state) => ({
          loadingStates: {
            ...state.loadingStates,
            [key]: loading
          }
        })),
        
        // Computed
        getProgress: () => {
          const state = get();
          let progress = 0;
          
          if (state.cliente && state.clienteValidado) progress += 25;
          if (state.dispositivos.length > 0) progress += 25;
          if (state.diagnosticos.size > 0) progress += 50;
          
          return Math.min(progress, 100);
        },
        
        isValid: () => {
          const state = get();
          return !!(
            state.cliente && 
            state.clienteValidado && 
            state.dispositivos.length > 0 &&
            state.diagnosticos.size > 0
          );
        },
        
        getResumen: () => {
          const state = get();
          const totales = state.getTotalReparacion();
          
          return {
            cliente: state.cliente!,
            dispositivos: state.dispositivos,
            diagnosticos: Array.from(state.diagnosticos.values()),
            totales: {
              subtotal: totales,
              descuento: 0, // TODO: Implementar descuentos
              total: totales,
              anticipo: 0 // TODO: Implementar anticipos
            },
            metadata: {
              fechaCreacion: new Date(),
              ultimaModificacion: state.ultimoGuardado || new Date(),
              estado: 'borrador' as EstadoReparacion,
              progreso: state.getProgress()
            }
          };
        },
        
        getTotalReparacion: () => {
          const state = get();
          let total = 0;
          
          state.diagnosticos.forEach((diagnostico) => {
            total += diagnostico.totales.total;
          });
          
          return total;
        },
        
        getDispositivosCount: () => {
          return get().dispositivos.length;
        },
        
        getAveriasCount: () => {
          const state = get();
          let count = 0;
          
          state.diagnosticos.forEach((diagnostico) => {
            count += diagnostico.averias.length;
          });
          
          return count;
        },
        
        getIntervencionesCount: () => {
          const state = get();
          let count = 0;
          
          state.diagnosticos.forEach((diagnostico) => {
            diagnostico.averias.forEach((averia) => {
              count += averia.intervenciones.length;
            });
          });
          
          return count;
        },
        
        // Reset
        resetStore: () => set(initialState),
        
        resetCliente: () => set({
          cliente: null,
          clienteValidado: false,
          clienteSearchState: 'idle'
        }),
        
        resetDispositivos: () => set({
          dispositivos: [],
          dispositivoActivo: null,
          dispositivosLoading: false
        }),
        
        resetDiagnosticos: () => set({
          diagnosticos: new Map(),
          diagnosticosLoading: false
        })
      }),
      {
        name: 'reparacion-store',
        partialize: (state) => ({
          cliente: state.cliente,
          dispositivos: state.dispositivos,
          diagnosticos: Array.from(state.diagnosticos.entries()),
          seccionActiva: state.seccionActiva,
          ultimoGuardado: state.ultimoGuardado
        }),
        onRehydrateStorage: () => (state) => {
          if (state) {
            // Reconstruir Map de diagnosticos
            const diagnosticosArray = state.diagnosticos as unknown as [string, DiagnosticoPresupuesto][];
            state.diagnosticos = new Map(diagnosticosArray);
          }
        }
      }
    ),
    {
      name: 'reparacion-store'
    }
  )
); 