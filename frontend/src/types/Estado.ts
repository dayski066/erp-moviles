// types/Estado.ts - Tipos para el sistema de estados
export interface Estado {
  id: number;
  codigo: string;
  nombre: string;
  categoria: 'reparacion' | 'dispositivo' | 'unificado';
  color: string;
  emoji: string;
  orden: number;
  activo: boolean;
}

export interface EstadoCrear {
  codigo: string;
  nombre: string;
  categoria: 'reparacion' | 'dispositivo' | 'unificado';
  color?: string;
  emoji?: string;
  orden?: number;
}

export interface OpcionEstado {
  value: string;
  label: string;
  color?: string;
}

export type CategoriaEstado = 'reparacion' | 'dispositivo' | 'unificado';