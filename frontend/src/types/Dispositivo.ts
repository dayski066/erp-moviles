// src/types/Dispositivo.ts - Versión actualizada con campos adicionales
export interface DispositivoData {
  marca: string;
  modelo: string;
  capacidad: string;
  color: string;
  imei: string;
  estado?: string; // Opcional - solo para compras/ventas
  observaciones: string;
  numero_serie?: string; // opcional mientras se edita
}

export interface DispositivoGuardado extends DispositivoData {
  id: number;
  orden: number;
  fechaCreacion: Date;
  numero_serie: string; // requerido cuando está guardado
  // ✅ NUEVOS CAMPOS AÑADIDOS
  requiere_backup?: boolean;
  patron_desbloqueo?: string;
  backup_realizado?: boolean;
  estado_dispositivo?: string;
  fecha_recepcion?: string;
  fecha_entrega?: string;
}

export interface ValidationErrors {
  [key: string]: string;
}

export interface DispositivoValidation {
  marca: boolean;
  modelo: boolean;
  imei: boolean;
  estado: boolean;
}

export interface DispositivoEstados {
  [key: string]: {
    label: string;
    color: string;
    emoji: string;
  };
}

export const ESTADOS_DISPOSITIVO: DispositivoEstados = {
  'Excelente': {
    label: 'Excelente',
    color: 'green',
    emoji: '🟢'
  },
  'Bueno': {
    label: 'Bueno',
    color: 'yellow',
    emoji: '🟡'
  },
  'Regular': {
    label: 'Regular',
    color: 'orange',
    emoji: '🟠'
  },
  'Malo': {
    label: 'Malo',
    color: 'red',
    emoji: '🔴'
  }
};

export const CAPACIDADES_COMUNES = [
  '64GB',
  '128GB',
  '256GB',
  '512GB',
  '1TB'
];

export const COLORES_COMUNES = [
  'Negro',
  'Blanco',
  'Gris',
  'Azul',
  'Verde',
  'Rojo',
  'Rosa',
  'Dorado',
  'Plata'
];