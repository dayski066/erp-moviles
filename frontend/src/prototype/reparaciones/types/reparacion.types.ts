// Tipos principales para el sistema de reparaciones v2.0

// Cliente
export interface Cliente {
  id?: number;
  nombre: string;
  apellidos: string;
  dni: string;
  telefono: string;
  email?: string;
  direccion?: string;
  codigo_postal?: string;
  ciudad?: string;
  fecha_creacion?: Date;
  fecha_modificacion?: Date;
}

// Dispositivo
export interface Dispositivo {
  id: string; // UUID temporal
  marca: string;
  modelo: string;
  imei?: string;
  numero_serie?: string;
  color?: string;
  capacidad?: string;
  observaciones?: string;
  orden: number;
  fecha_creacion: Date;
}

// Marca y Modelo
export interface Marca {
  id: number;
  nombre: string;
  logo_url?: string;
}

export interface Modelo {
  id: number;
  nombre: string;
  marca_id: number;
  categoria?: string;
}

// Avería
export interface Averia {
  id: string;
  nombre: string;
  descripcion?: string;
  categoria?: string;
  intervenciones: Intervencion[];
}

// Intervención
export interface Intervencion {
  id: string;
  concepto: string;
  descripcion?: string;
  precio: number;
  cantidad: number;
  tipo: 'mano_obra' | 'repuesto' | 'mixto';
  tiempo_estimado?: number; // en minutos
}

// Diagnóstico y Presupuesto Unificado
export interface DiagnosticoPresupuesto {
  dispositivoId: string;
  averias: Averia[];
  totales: {
    subtotal: number;
    descuento: number;
    total: number;
  };
  notas?: string;
  fecha_diagnostico: Date;
}

// Estado de la reparación
export type EstadoReparacion = 'borrador' | 'en_proceso' | 'completada' | 'cancelada';

// Reparación completa
export interface Reparacion {
  id?: string;
  cliente: Cliente;
  dispositivos: Dispositivo[];
  diagnosticos: Map<string, DiagnosticoPresupuesto>;
  estado: EstadoReparacion;
  anticipo?: number;
  fecha_creacion: Date;
  fecha_modificacion: Date;
  notas_generales?: string;
}

// Resumen de reparación
export interface ResumenReparacion {
  cliente: Cliente;
  dispositivos: Dispositivo[];
  diagnosticos: DiagnosticoPresupuesto[];
  totales: {
    subtotal: number;
    descuento: number;
    total: number;
    anticipo: number;
  };
  metadata: {
    fechaCreacion: Date;
    ultimaModificacion: Date;
    estado: EstadoReparacion;
    progreso: number; // 0-100
  };
}

// Estados de UI
export type SearchState = 'idle' | 'searching' | 'found' | 'not-found' | 'error';
export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

// Sugerencias IA
export interface Suggestion {
  id: string;
  text: string;
  confidence: number;
  metadata?: any;
}

// Configuración de SmartSelect
export interface SmartSelectConfig {
  type: 'cliente' | 'marca' | 'modelo' | 'averia' | 'intervencion';
  multiSelect?: boolean;
  dependsOn?: { field: string; value: any };
  suggestions?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

// Eventos de analytics
export interface AnalyticsEvent {
  action: string;
  category: 'Reparaciones';
  label: 'Prototype';
  value?: number;
  metadata?: Record<string, any>;
}

// Validación de formularios
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

// Configuración de auto-save
export interface AutoSaveConfig {
  enabled: boolean;
  delay: number; // en ms
  maxRetries: number;
  localStorageKey: string;
}

// Configuración de notificaciones
export interface NotificationConfig {
  position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  duration: number;
  maxVisible: number;
}

// Estados de carga
export interface LoadingStates {
  cliente: boolean;
  dispositivos: boolean;
  diagnosticos: boolean;
  guardando: boolean;
}

// Filtros de búsqueda
export interface SearchFilters {
  termino: string;
  campos: string[];
  limit: number;
  offset: number;
}

// Paginación
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Respuesta de API
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: Pagination;
}

// Configuración de tema
export interface ThemeConfig {
  primary: string;
  success: string;
  warning: string;
  danger: string;
  neutral: string;
  pending: string;
  inProgress: string;
  completed: string;
}

// Configuración de shortcuts
export interface KeyboardShortcut {
  key: string;
  action: string;
  description: string;
  global?: boolean;
}

// Configuración de animaciones
export interface AnimationConfig {
  duration: number;
  easing: string;
  delay?: number;
}

// Configuración de responsive
export interface ResponsiveConfig {
  breakpoints: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    '2xl': number;
  };
  containerMaxWidths: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
  };
} 