// src/types/Reparacion.ts
// Tipos compartidos para todo el flujo "Nueva Reparación"

import type { DispositivoGuardado } from './Dispositivo';

// RE-EXPORTAR CORRECTAMENTE con export type
export type { DispositivoGuardado } from './Dispositivo';

/* ------------------- DIAGNÓSTICO ------------------- */
export interface DiagnosticoData {
  tipo_servicio: 'reparacion' | 'diagnostico' | 'mantenimiento';
  problemas_reportados: string[];
  sintomas_adicionales: string;
  prioridad: 'normal' | 'urgente' | 'express';
  requiere_backup: boolean;
  patron_desbloqueo: string;
  observaciones_tecnicas: string;
}

/* ------------------- PRESUPUESTO ------------------- */
// ✅ AGREGAR intervencion_id al PresupuestoItem original
export interface PresupuestoItem {
  intervencion_id?: number; // ← SOLO AGREGAR ESTA LÍNEA
  concepto: string;
  precio: number;
  cantidad: number;
  tipo: 'servicio' | 'repuesto';
}

// Agrupación de conceptos por avería - MANTENER IGUAL
export interface PresupuestoAveria {
  problema: string;
  items: PresupuestoItem[];
}

// Estructura completa del presupuesto - MANTENER TODO IGUAL, solo corregir tipos
export interface PresupuestoData {
  items: PresupuestoItem[]; // ← Cambiar de Array<{...}> a PresupuestoItem[]
  presupuestoPorAveria: PresupuestoAveria[]; // ← Cambiar de Array<{...}> a PresupuestoAveria[]
  descuento: number;
  tipo_descuento: 'porcentaje' | 'cantidad';
  notas_presupuesto: string;
  validez_dias: number;
  requiere_anticipo: boolean;
  porcentaje_anticipo: number;
}

/* ------------------- TERMINAL COMPLETO ------------------- */
export interface TerminalCompleto {
  dispositivo: DispositivoGuardado;
  diagnostico: DiagnosticoData | null;
  presupuesto: PresupuestoData | null;
  diagnosticoCompletado: boolean;
  presupuestoCompletado: boolean;
  fechaUltimaModificacion: Date;
}