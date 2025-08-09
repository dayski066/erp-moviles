// src/types/Catalogo.ts


export interface Modelo {
  id: number;
  marca_id: number;
  nombre: string;
  activo?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface DispositivoBusqueda {
  marca: string;
  modelo: string;
  capacidad?: string;
  color?: string;
}

export interface Averia {
  id: number;
  nombre: string;
  descripcion?: string;
  categoria?: string;
  contador_uso_global?: number;
  activo?: boolean;
}

export interface ReparacionModelo {
  id: number;
  modelo_id: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  tipo: 'servicio' | 'repuesto';
  tiempo_estimado?: number;
  contador_uso?: number;
  activo?: boolean;
}

// Respuestas de la API
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Estados de carga genéricos
export interface CargaEstado<T = unknown> {
  cargando: boolean;
  error: string | null;
  datos: T[];
}

// Validaciones
export interface ValidationErrors {
  [key: string]: string;
}

export interface Marca {
  id: number;
  nombre: string;
  logo_emoji?: string;
  icono_path?: string;           // NUEVO - ruta del icono
  tipo_icono?: 'emoji' | 'imagen'; // NUEVO - tipo de icono
  activo?: boolean;
  created_at?: string;
  updated_at?: string;
}