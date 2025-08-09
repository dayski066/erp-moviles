// types/PlantillaReparacion.ts
export interface PlantillaReparacion {
  id: string;
  averia_id?: number; // ID real de la avería en BD (para plantillas dinámicas)
  nombre: string;
  descripcion: string;
  categoria: 'pantalla' | 'bateria' | 'carga' | 'software' | 'audio' | 'camara' | 'conectividad' | 'otros';
  icono: string;
  color: string;
  
  // Datos que se auto-completarán
  tipo_servicio: 'reparacion' | 'diagnostico' | 'mantenimiento';
  problemas_reportados: string[];
  sintomas_adicionales: string;
  prioridad: 'normal' | 'urgente' | 'express';
  requiere_backup: boolean;
  observaciones_tecnicas: string;
  
  // Metadata
  frecuencia_uso: number; // Para ordenar por popularidad
  tiempo_estimado: number; // En horas
  precio_aproximado?: number; // Opcional
}

export interface CategoriaPlantilla {
  id: string;
  nombre: string;
  icono: string;
  color: string;
  plantillas: PlantillaReparacion[];
}

// ❌ PLANTILLAS_PREDEFINIDAS Y CATEGORIAS_PLANTILLAS ELIMINADAS
// Ahora se usan plantillas dinámicas desde la base de datos a través del endpoint /api/catalogos/plantillas

// Las plantillas ahora se generan dinámicamente desde las averías reales en la BD
// Consultar: GET /api/catalogos/plantillas para obtener plantillas y categorías dinámicas