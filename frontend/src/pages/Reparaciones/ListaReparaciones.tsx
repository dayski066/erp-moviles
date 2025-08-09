// pages/Reparaciones/ListaReparaciones.tsx - MODIFICADO
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useReparacionNotifications } from "../../hooks/useReparacionNotifications";
import { useNotification } from "../../contexts/NotificationContext"; // IMPORTADO
import { useEstados } from "../../hooks/useEstados"; // AÑADIDO
import reparacionesApi from "../../services/reparacionesApi"; // AÑADIDO
import ModalSeleccionPaso from "./components/ModalSeleccionPaso";
import {
  PencilIcon,
  TrashIcon,
  ChevronRightIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  InboxIcon,
  DevicePhoneMobileIcon,
  ChevronDownIcon,
  CheckCircleIcon,
  ClockIcon,
  CurrencyEuroIcon,
  DocumentTextIcon,
  UserIcon,
  BuildingStorefrontIcon,
  WrenchScrewdriverIcon,
  ChatBubbleLeftRightIcon,
  CreditCardIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";

// Tipos adaptados a la nueva estructura del backend
interface ReparacionResumen {
  id: number;
  numero_orden: string;
  cliente_nombre: string;
  cliente_apellidos: string;
  cliente_telefono: string;
  cliente_email: string;
  fecha_ingreso: string;
  estado_general: string;
  total_final: number | string;
  anticipo_requerido: boolean;
  total_dispositivos: number;
  total_averias: number;
  averias_completadas: number;
}

export interface ReparacionInfo {
  id: number;
  numero_orden: string;
  cliente_id: number;
  establecimiento_id: number;
  estado_general: string;
  fecha_ingreso: string;
  fecha_entrega_completa: string | null;
  descuento_general: number;
  tipo_descuento_general: string;
  anticipo_requerido: boolean;
  porcentaje_anticipo: number;
  validez_presupuesto_dias: number;
  total_presupuestado: number;
  total_aprobado: number;
  total_completado: number;
  total_final: number;
  notas_generales: string | null;
  created_by: number;
  updated_at: string;
  nombre: string;
  apellidos: string;
  telefono: string;
  email: string;
  dni: string;
  direccion: string | null;
  codigo_postal: string;
  cliente_fecha_registro: string;
  establecimiento_nombre: string;
  establecimiento_direccion: string;
  establecimiento_telefono: string;
}

export interface DispositivoDetalle {
  id: number;
  reparacion_id: number;
  marca: string;
  modelo: string;
  imei: string;
  numero_serie: string | null;
  color: string | null;
  capacidad: string | null;
  observaciones_recepcion: string | null;
  patron_desbloqueo: string | null;
  requiere_backup: boolean;
  backup_realizado: boolean;
  estado_dispositivo: string;
  fecha_recepcion: string;
  fecha_entrega: string | null;
  total_dispositivo: number;
  total_averias: number;
  averias_completadas: number;
  averias_aprobadas: number;
  problemas_principales: string;
}

export interface ServicioDetalle {
  id: number;
  averia_id: number;
  concepto: string;
  descripcion_detallada: string | null;
  tipo: string;
  categoria_servicio: string | null;
  tiempo_estimado_minutos: number | null;
  dificultad: string;
  requiere_especialista: boolean;
  cantidad: number;
  precio_unitario: number;
  precio_total: number;
  estado_servicio: string;
  fecha_inicio: string | null;
  fecha_completado: string | null;
  tecnico_asignado: string | null;
  instrucciones_tecnicas: string | null;
  resultado_obtenido: string | null;
}
export interface AveriaDetalle {
  id: number;
  reparacion_detalle_id: number;
  averia_nombre: string;
  averia_categoria: string;
  descripcion_cliente: string;
  sintomas_observados: string;
  detectado_en: string;
  orden_deteccion: number;
  categoria: string;
  gravedad: string;
  prioridad: string;
  tipo_servicio: string;
  estado_averia: string;
  fecha_deteccion: string;
  fecha_diagnostico: string | null;
  fecha_presupuesto: string | null;
  fecha_respuesta_cliente: string | null;
  fecha_inicio_reparacion: string | null;
  fecha_finalizacion: string | null;
  fecha_estimada_finalizacion: string;
  diagnostico_tecnico: string | null;
  solucion_propuesta: string | null;
  solucion_aplicada: string | null;
  tecnico_diagnostico: string | null;
  tecnico_reparacion: string | null;
  subtotal_averia: number;
  descuento_averia: number;
  total_averia: number;
  notas_presupuesto: string | null;
  notas_internas: string | null;
  observaciones_tecnicas: string | null;
  observaciones_entrega: string | null;
  dispositivo_marca: string;
  dispositivo_modelo: string;
  dispositivo_imei: string;
  total_servicios: number;
  servicios_completados: number;
  servicios_lista: string | null;
  servicios: ServicioDetalle[];
}

interface PagoDetalle {
  id: number;
  reparacion_id: number;
  monto: number;
  metodo_pago: string;
  fecha_pago: string;
  referencia_pago: string | null;
  notas_pago: string | null;
}

interface HistorialDetalle {
  id: number;
  reparacion_id: number;
  evento_tipo: string;
  descripcion: string;
  dispositivo_id: number | null;
  averia_id: number | null;
  fecha_evento: string;
  usuario_id: number;
  usuario_nombre: string;
  datos_anteriores?: any; // JSON con datos anteriores para auditoría
  datos_nuevos?: any; // JSON con datos nuevos para auditoría
}

interface ComunicacionDetalle {
  id: number;
  reparacion_id: number;
  tipo: string;
  mensaje: string;
  fecha_creacion: string;
  usuario_id: number;
  usuario_nombre: string;
}

interface EstadisticasDetalle {
  total_dispositivos: number;
  total_averias: number;
  averias_completadas: number;
  total_servicios: number;
  servicios_completados: number;
  total_servicios_precio: number;
  total_pagado: number;
}

export interface ReparacionDetalle {
  reparacion: ReparacionInfo;
  dispositivos: DispositivoDetalle[];
  averias: AveriaDetalle[];
  pagos: PagoDetalle[];
  historial: HistorialDetalle[];
  comunicaciones: ComunicacionDetalle[];
  estadisticas: EstadisticasDetalle;
}

const ListaReparaciones: React.FC = () => {
  const navigate = useNavigate();
  const { notificarErrorConexion } = useReparacionNotifications();
  const { showSuccess, showInfo } = useNotification(); // AÑADIDO
  const { estados, getOpcionesEstados, cargando, error: errorEstados } = useEstados(); // AÑADIDO

  const [reparaciones, setReparaciones] = useState<ReparacionResumen[]>([]);
  const [reparacionDetalle, setReparacionDetalle] =
    useState<ReparacionDetalle | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [selectedDevices, setSelectedDevices] = useState<
    Map<number, number | null>
  >(new Map());
  const [expandedSections, setExpandedSections] = useState<
    Map<number, Set<string>>
  >(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [busqueda, setBusqueda] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState<number | null>(null);
  const [editandoDispositivo, setEditandoDispositivo] = useState<number | null>(null);
  const [nuevoEstadoDispositivo, setNuevoEstadoDispositivo] = useState<string>("");
  
  // Estados para manejar confirmación de cambio de estado
  const [estadoTemporal, setEstadoTemporal] = useState<{[key: number]: string}>({});
  const [confirmandoCambio, setConfirmandoCambio] = useState<Set<number>>(new Set());

  const [showEditModal, setShowEditModal] = useState<{
    isOpen: boolean;
    reparacion: ReparacionResumen | null;
  }>({
    isOpen: false,
    reparacion: null,
  });

  // Añadir estas funciones
  const abrirModalEdicion = useCallback((reparacion: ReparacionResumen) => {
    console.log("🔧 Abriendo modal de edición para:", reparacion.numero_orden);
    setShowEditModal({
      isOpen: true,
      reparacion,
    });
  }, []);

  const cerrarModalEdicion = useCallback(() => {
    setShowEditModal({
      isOpen: false,
      reparacion: null,
    });
  }, []);

  const seleccionarPasoEdicion = useCallback(
  (paso: number) => {
    if (showEditModal.reparacion) {
      console.log(
        `📝 Navegando a paso ${paso} para reparación ${showEditModal.reparacion.id}`
      );
      navigate(`/reparaciones/editar/${showEditModal.reparacion.id}/${paso}`);
      cerrarModalEdicion();
    }
  },
  [showEditModal.reparacion, navigate, cerrarModalEdicion]  // ✅ AÑADIR cerrarModalEdicion
);

  const notificarErrorRef = useRef(notificarErrorConexion);
  useEffect(() => {
    notificarErrorRef.current = notificarErrorConexion;
  }, [notificarErrorConexion]);

  const cargarReparaciones = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filtroEstado !== "todos") {
        params.append("estado", filtroEstado);
      }
      if (busqueda) {
        params.append("busqueda", busqueda);
      }

      console.log('📋 Cargando reparaciones usando reparacionesApi...');

      // Usar el servicio de reparaciones en lugar de fetch directo
      const apiParams: any = {};
      if (filtroEstado !== "todos") {
        apiParams.estado = filtroEstado;
      }
      // Nota: búsqueda por texto se implementará más adelante en el servicio

      const result = await reparacionesApi.obtenerReparaciones(apiParams);

      if (result.success) {
        setReparaciones(result.data);
        console.log(`✅ ${result.data.length} reparaciones cargadas`);
      } else {
        throw new Error(
          result.message || "Error desconocido al procesar los datos."
        );
      }
    } catch (err) {
      const error = err as Error;
      console.error("Error cargando reparaciones:", error);
      setError(error.message);
      notificarErrorRef.current();
    } finally {
      setLoading(false);
    }
  }, [filtroEstado, busqueda]);

  useEffect(() => {
    const timer = setTimeout(() => {
      cargarReparaciones();
    }, 500);

    return () => clearTimeout(timer);
  }, [cargarReparaciones]);

  const cargarDetalleReparacion = async (id: number) => {
    try {
      console.log(`📋 Cargando detalle de reparación ${id} usando reparacionesApi...`);
      
      const result = await reparacionesApi.obtenerReparacionPorId(id);
      
      // Obtener historial real de la BD
      const historialResult = await reparacionesApi.obtenerHistorial(id);

      if (result.success) {
        // Mapear los campos del backend a lo que espera el frontend
        const mappedData = {
          ...result.data,
          reparacion: {
            ...result.data.reparacion,
            // Mapear datos del cliente desde la reparación principal (que ya los tiene)
            nombre: (() => {
              const reparacionEnLista = reparaciones.find(r => r.id === id);
              return reparacionEnLista?.cliente_nombre || result.data.reparacion.cliente_nombre || "No disponible";
            })(),
            apellidos: (() => {
              const reparacionEnLista = reparaciones.find(r => r.id === id);
              return reparacionEnLista?.cliente_apellidos || result.data.reparacion.cliente_apellidos || "No disponible";
            })(),
            dni: (() => {
              const reparacionEnLista = reparaciones.find(r => r.id === id);
              return reparacionEnLista?.cliente_dni || result.data.reparacion.cliente_dni || "No disponible";
            })(),
            telefono: (() => {
              const reparacionEnLista = reparaciones.find(r => r.id === id);
              return reparacionEnLista?.cliente_telefono || result.data.reparacion.cliente_telefono || "No disponible";
            })(),
            email: result.data.reparacion.cliente_email || "No disponible",
            fecha_registro: result.data.reparacion.cliente_fecha_registro || result.data.reparacion.created_at
          },
          dispositivos: result.data.dispositivos?.map((dispositivo: any) => ({
            ...dispositivo,
            marca: dispositivo.marca_nombre || dispositivo.marca,
            modelo: dispositivo.modelo_nombre || dispositivo.modelo
          })) || [],
          averias: result.data.averias?.map((averia: any) => ({
            ...averia,
            dispositivo_id: averia.reparacion_detalle_id, // Mapear para compatibilidad
            problema_principal: averia.averia_nombre,
            categoria: averia.averia_categoria,
            gravedad: averia.prioridad,
            total_servicios: averia.total_intervenciones || 0,
            servicios_completados: averia.intervenciones_completadas || 0,
            // Agregar intervenciones relacionadas a esta avería
            servicios: result.data.intervenciones?.filter((interv: any) => 
              interv.dispositivo_averia_id === averia.id
            ).map((interv: any) => ({
              id: interv.id,
              averia_id: averia.id, // Agregar el ID de la avería para el filtro del frontend
              concepto: interv.intervencion_nombre,
              tipo: interv.intervencion_tipo,
              precio_unitario: Number(interv.precio_unitario) || 0,
              cantidad: interv.cantidad || 1,
              precio_total: Number(interv.precio_total) || 0,
              estado: interv.estado_intervencion
            })) || []
          })) || [],
          // Agregar historial real desde la BD con datos de auditoría
          historial: historialResult?.success ? historialResult.data.map((h: any) => ({
            id: h.id,
            evento_tipo: h.evento_tipo,
            descripcion: h.descripcion,
            fecha_evento: h.created_at,
            usuario_nombre: h.usuario_nombre || 'Sistema',
            datos_anteriores: h.datos_anteriores ? JSON.parse(h.datos_anteriores) : null,
            datos_nuevos: h.datos_nuevos ? JSON.parse(h.datos_nuevos) : null
          })) : [],
          // Comunicaciones y pagos por ahora vacíos (se implementarán después)
          comunicaciones: [],
          pagos: [],
          // Usar las estadísticas que vienen directamente del backend
          estadisticas: result.data.estadisticas || {
            total_dispositivos: 0,
            total_averias: 0,
            averias_completadas: 0,
            total_servicios: 0,
            servicios_completados: 0,
            total_servicios_precio: 0,
            total_pagado: 0
          }
        };
        
        setReparacionDetalle(mappedData);
        console.log(`✅ Detalle de reparación ${id} cargado con campos mapeados`);
      }
    } catch (error) {
      console.error("❌ Error cargando detalle:", error);
      notificarErrorRef.current();
    }
  };

  const toggleExpandRow = async (id: number) => {
    if (expandedRows.has(id)) {
      // Si ya está expandida, la contraemos
      setExpandedRows(new Set());
      setReparacionDetalle(null);
      setSelectedDevices(new Map());
      setExpandedSections(new Map());
    } else {
      // Si no está expandida, contraemos todas y expandimos solo esta (accordion)
      setExpandedRows(new Set([id]));
      await cargarDetalleReparacion(id);
      // Limpiar selectedDevices y secciones de otras reparaciones
      setSelectedDevices((prev) => {
        const newMap = new Map();
        // Mantener solo la selección de la reparación actual si existe
        if (prev.has(id)) {
          newMap.set(id, prev.get(id));
        }
        return newMap;
      });
      // Inicializar secciones expandidas por defecto solo para esta reparación
      setExpandedSections(new Map([[id, new Set(["resumen", "dispositivos"])]]));
    }
  };

  const toggleSection = (reparacionId: number, section: string) => {
    setExpandedSections((prev) => {
      const newMap = new Map(prev);
      const sections = newMap.get(reparacionId) || new Set();
      const newSections = new Set(sections);

      if (newSections.has(section)) {
        newSections.delete(section);
      } else {
        newSections.add(section);
      }

      newMap.set(reparacionId, newSections);
      return newMap;
    });
  };

  const selectDevice = (reparacionId: number, deviceId: number | null) => {
    setSelectedDevices((prev) => {
      const newMap = new Map(prev);
      newMap.set(reparacionId, deviceId);
      return newMap;
    });
  };

  const eliminarReparacion = async (id: number) => {
    try {
      const response = await fetch(
        `http://localhost:5001/api/reparaciones/${id}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        setReparaciones((prev) => prev.filter((r) => r.id !== id));
        setShowDeleteModal(null);
        showSuccess(
          "Reparación Eliminada",
          "La reparación ha sido eliminada exitosamente."
        ); // MODIFICADO
      }
    } catch (error) {
      console.error("Error eliminando reparación:", error);
      notificarErrorRef.current();
    }
  };

  const getEstadoColor = (estadoId: string | number) => {
    const estadoObj = estados.find(e => e.id.toString() === estadoId.toString());
    if (estadoObj && estadoObj.color) {
      return `text-white border-gray-200 shadow-sm`;
    }
    return "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getEstadoTexto = (estadoId: string | number) => {
    const estadoObj = estados.find(e => e.id.toString() === estadoId.toString());
    if (estadoObj) {
      return `${estadoObj.emoji || '📋'} ${estadoObj.nombre}`;
    }
    return `Estado ${estadoId}`;
  };

  const getEstadoStyle = (estadoId: string | number) => {
    const estadoObj = estados.find(e => e.id.toString() === estadoId.toString());
    if (estadoObj && estadoObj.color) {
      return { backgroundColor: estadoObj.color };
    }
    return { backgroundColor: '#6B7280' };
  };

  // Estados válidos desde la BD
  const estadosValidos = getOpcionesEstados();
  
  // LOG 1: Ver estados de dispositivos cuando se expande una reparación
  useEffect(() => {
    if (reparacionDetalle && reparacionDetalle.dispositivos && reparacionDetalle.dispositivos.length > 0) {
      console.log('--- ESTADOS ACTUALES DE DISPOSITIVOS ---');
      console.log(`📋 Reparación expandida: ${reparacionDetalle.reparacion.numero_orden} (ID: ${reparacionDetalle.reparacion.id})`);
      
      reparacionDetalle.dispositivos.forEach(disp => {
        // Buscar el nombre del estado
        const estadoObj = estados.find(e => e.id.toString() === disp.estado_dispositivo?.toString());
        const estadoNombre = estadoObj ? `${estadoObj.emoji} ${estadoObj.nombre}` : 'Estado no encontrado';
        
        console.log(`📱 DISPOSITIVO ${disp.id} (${disp.marca} ${disp.modelo}): estado_dispositivo = ${disp.estado_dispositivo} (${typeof disp.estado_dispositivo}) → ${estadoNombre}`);
      });
      console.log('--- FIN ESTADOS ACTUALES ---');
    }
  }, [reparacionDetalle, estados]);

  // Funciones para editar estado de dispositivo individual
  const iniciarEdicionEstado = (dispositivoId: number, estadoActual: string | number) => {
    setEditandoDispositivo(dispositivoId);
    setNuevoEstadoDispositivo(estadoActual.toString());
  };

  const cancelarEdicionEstado = () => {
    setEditandoDispositivo(null);
    setNuevoEstadoDispositivo("");
  };

  const actualizarEstadoDispositivo = async (dispositivoId: number) => {
    if (!nuevoEstadoDispositivo) return;

    try {
      // Llamar API para actualizar estado del dispositivo específico
      const response = await fetch(`http://localhost:5001/api/reparaciones/dispositivo/${dispositivoId}/estado`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ estado_id: nuevoEstadoDispositivo }),
      });

      if (response.ok) {
        showSuccess('Estado actualizado', 'El estado del dispositivo se ha actualizado correctamente');
        cancelarEdicionEstado();
        cargarReparaciones(); // Recargar datos
      } else {
        throw new Error('Error al actualizar estado');
      }
    } catch (error) {
      console.error('Error actualizando estado dispositivo:', error);
      showInfo('Error', 'No se pudo actualizar el estado del dispositivo');
    }
  };

  // Función para manejar cambio temporal de estado (muestra botón confirmar)
  const manejarCambioEstadoTemporal = (dispositivoId: number, nuevoEstadoId: string, estadoActual: string | number | null | undefined) => {
    const estadoActualStr = estadoActual?.toString() || '';
    
    if (nuevoEstadoId !== estadoActualStr) {
      // LOG 2: Ver estado seleccionado
      console.log(`🔄 ESTADO SELECCIONADO - Dispositivo ${dispositivoId}: ${estadoActualStr} → ${nuevoEstadoId}`);
      
      // Guardar estado temporal y activar modo confirmación
      setEstadoTemporal(prev => ({ ...prev, [dispositivoId]: nuevoEstadoId }));
      setConfirmandoCambio(prev => new Set(prev).add(dispositivoId));
    }
  };

  // Función para confirmar cambio de estado
  const confirmarCambioEstado = async (dispositivoId: number) => {
    const nuevoEstadoId = estadoTemporal[dispositivoId];
    if (!nuevoEstadoId) return;

    try {      
      // Llamar API para actualizar estado del dispositivo específico
      const response = await fetch(`http://localhost:5001/api/reparaciones/dispositivo/${dispositivoId}/estado`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ estado_id: nuevoEstadoId }),
      });

      if (response.ok) {
        const result = await response.json();
        
        // LOG 3: Ver estado guardado en BD
        console.log(`💾 ESTADO GUARDADO BD - Dispositivo ${dispositivoId}: guardado como ${result.data.nuevo_estado_id} (${result.data.nuevo_estado_nombre})`);
        
        // Mostrar notificación de éxito
        showSuccess('Estado actualizado', `Estado cambiado a "${result.data.nuevo_estado_nombre}"`);
        
        // Actualizar el estado localmente en el frontend (optimistic update)
        if (reparacionDetalle && reparacionDetalle.dispositivos) {
          const nuevosDispositivos = reparacionDetalle.dispositivos.map(disp => 
            disp.id === dispositivoId 
              ? { ...disp, estado_dispositivo: parseInt(nuevoEstadoId) }
              : disp
          );
          setReparacionDetalle({
            ...reparacionDetalle,
            dispositivos: nuevosDispositivos
          });
        }
        
        // Limpiar estados temporales
        cancelarCambioEstado(dispositivoId);
        
        // LOG 4: Confirmar actualización local
        console.log(`🔄 ESTADO ACTUALIZADO LOCALMENTE - Dispositivo ${dispositivoId}: ahora muestra estado ${nuevoEstadoId}`);
        
        // NO recargar toda la página, solo actualizar localmente
      } else {
        const error = await response.json();
        console.error('❌ Error actualizando estado:', error);
        showInfo('Error', error.message || 'Error actualizando estado del dispositivo');
      }
    } catch (error) {
      console.error('❌ Error de red:', error);
      showInfo('Error', 'Error de conexión al actualizar estado');
    }
  };

  // Función para cancelar cambio de estado
  const cancelarCambioEstado = (dispositivoId: number) => {
    setEstadoTemporal(prev => {
      const nuevo = { ...prev };
      delete nuevo[dispositivoId];
      return nuevo;
    });
    setConfirmandoCambio(prev => {
      const nuevo = new Set(prev);
      nuevo.delete(dispositivoId);
      return nuevo;
    });
  };

  // Función para detectar cambios importantes que requieren alertas
  const detectarCambiosImportantes = (datosAnteriores: any, datosNuevos: any) => {
    const alertas: string[] = [];
    
    // Detectar cambios de precio
    if (datosAnteriores?.total_anterior && datosNuevos?.total_actual) {
      const precioAnterior = Number(datosAnteriores.total_anterior);
      const precioNuevo = Number(datosNuevos.total_actual);
      
      if (precioAnterior !== precioNuevo) {
        const diferencia = precioNuevo - precioAnterior;
        const porcentaje = Math.abs((diferencia / precioAnterior) * 100).toFixed(1);
        
        if (diferencia > 0) {
          alertas.push(`💰 PRECIO AUMENTADO: +€${diferencia.toFixed(2)} (+${porcentaje}%)`);
        } else {
          alertas.push(`⚠️ PRECIO REDUCIDO: €${Math.abs(diferencia).toFixed(2)} (-${porcentaje}%)`);
        }
      }
    }
    
    // Detectar cambios de estado críticos
    if (datosAnteriores?.estado_anterior && datosNuevos?.estado_nuevo) {
      const estadoAnterior = datosAnteriores.estado_anterior;
      const estadoNuevo = datosNuevos.estado_nuevo;
      
      // Cambios que requieren especial atención
      if (estadoAnterior === 'lista' && estadoNuevo !== 'entregada') {
        alertas.push(`🚨 REGRESIÓN: Reparación volvió de "Lista" a "${getEstadoTexto(estadoNuevo)}"`);
      }
      
      if (estadoAnterior === 'entregada' && estadoNuevo !== 'entregada') {
        alertas.push(`🔙 REVERSIÓN: Reparación volvió de "Entregada" a "${getEstadoTexto(estadoNuevo)}"`);
      }
      
      if (estadoNuevo === 'cancelada') {
        alertas.push(`❌ CANCELACIÓN: Reparación fue cancelada`);
      }
    }
    
    return alertas;
  };

  // Función para cambiar estado de reparación con alertas inteligentes
  const cambiarEstado = async (reparacionId: number, nuevoEstado: string, notas?: string) => {
    try {
      console.log(`🔄 Cambiando estado de reparación ${reparacionId} a: ${nuevoEstado}`);
      
      // Obtener estado actual para comparar
      const reparacionActual = reparaciones.find(r => r.id === reparacionId);
      const estadoAnterior = reparacionActual?.estado_general;
      
      const result = await reparacionesApi.actualizarEstado(reparacionId, nuevoEstado, notas);
      
      if (result.success) {
        // Verificar si es un cambio crítico que requiere alerta
        let tipoNotificacion: 'success' | 'warning' | 'error' = 'success';
        let mensaje = `Estado cambiado a: ${getEstadoTexto(nuevoEstado)}`;
        
        // Alertas para cambios críticos
        if (estadoAnterior === 'lista' && nuevoEstado !== 'entregada') {
          tipoNotificacion = 'warning';
          mensaje = `🚨 ATENCIÓN: Reparación regresó de "Lista" a "${getEstadoTexto(nuevoEstado)}"`;
        } else if (estadoAnterior === 'entregada' && nuevoEstado !== 'entregada') {
          tipoNotificacion = 'error';
          mensaje = `🔙 REVERSIÓN CRÍTICA: Reparación volvió de "Entregada" a "${getEstadoTexto(nuevoEstado)}"`;
        } else if (nuevoEstado === 'cancelada') {
          tipoNotificacion = 'warning';
          mensaje = `❌ Reparación CANCELADA`;
        }
        
        showNotification({
          type: tipoNotificacion,
          title: tipoNotificacion === 'success' ? 'Estado actualizado' : 'Cambio Importante',
          message: mensaje,
          position: 'top-right',
        });
        
        // Recargar la lista para mostrar el cambio
        cargarReparaciones();
      } else {
        throw new Error(result.message || 'Error al actualizar estado');
      }
    } catch (error) {
      console.error('❌ Error cambiando estado:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: error instanceof Error ? error.message : 'Error al cambiar estado',
        position: 'top-right',
      });
    }
  };

  const getPrioridadColor = (prioridad: string) => {
    const colores = {
      baja: "bg-green-100 text-green-800 border-green-200",
      normal: "bg-blue-100 text-blue-800 border-blue-200",
      alta: "bg-orange-100 text-orange-800 border-orange-200",
      urgente: "bg-red-100 text-red-800 border-red-200",
      express: "bg-purple-100 text-purple-800 border-purple-200",
    };
    return (
      colores[prioridad as keyof typeof colores] ||
      "bg-gray-100 text-gray-800 border-gray-200"
    );
  };

  const getEstadoServicioColor = (estado: string) => {
    const colores = {
      completado: "bg-green-100 text-green-800 border-green-200",
      en_progreso: "bg-yellow-100 text-yellow-800 border-yellow-200",
      pausado: "bg-orange-100 text-orange-800 border-orange-200",
      planificado: "bg-blue-100 text-blue-800 border-blue-200",
      cancelado: "bg-red-100 text-red-800 border-red-200",
    };
    return (
      colores[estado as keyof typeof colores] ||
      "bg-gray-100 text-gray-800 border-gray-200"
    );
  };

  const getDeviceIcon = (marca: string | undefined | null) => {
    if (!marca) return "📱"; // Default icon if marca is undefined/null
    
    const marcaLower = marca.toLowerCase();
    if (marcaLower.includes("samsung")) return "📱";
    if (marcaLower.includes("apple") || marcaLower.includes("iphone"))
      return "🍎";
    if (marcaLower.includes("xiaomi")) return "📲";
    if (marcaLower.includes("huawei")) return "📱";
    return "📱";
  };

  const formatDate = (fecha: string | Date | null | undefined) => {
    if (!fecha) return "No disponible";
    
    try {
      const date = new Date(fecha);
      if (isNaN(date.getTime())) return "No disponible";
      return date.toLocaleDateString("es-ES");
    } catch (error) {
      return "No disponible";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header con acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Lista de Reparaciones
          </h1>
          <p className="text-gray-600">
            Gestiona todas las reparaciones del sistema
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate("/reparaciones/nueva")}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Nueva Reparación
          </button>
          
          {/* 🚀 BOTÓN DEL PROTOTIPO */}
          <button
            onClick={() => navigate("/prototype/chat")}
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg border-2 border-transparent"
          >
            <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
            🤖 Prototipo Chat
          </button>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Búsqueda */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buscar
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Número de orden, cliente, teléfono..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          {/* Filtro por estado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            >
              <option value="todos">Todos los estados</option>
              {estadosValidos.map((estado) => (
                <option key={estado.value} value={estado.value}>
                  {estado.label}
                </option>
              ))}
            </select>
          </div>

          {/* Estadísticas rápidas */}
          <div className="flex items-end">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200 w-full">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {reparaciones.length}
                </div>
                <div className="text-sm text-gray-600 font-medium">
                  Resultados
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de reparaciones */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center min-h-96">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <span className="mt-3 text-gray-600 block">
                  Cargando reparaciones...
                </span>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-400" />
              <h3 className="mt-2 text-lg font-medium text-red-900">
                Error al cargar los datos
              </h3>
              <p className="mt-1 text-sm text-red-600">{error}</p>
              <div className="mt-6">
                <button
                  onClick={cargarReparaciones}
                  className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"
                >
                  Reintentar
                </button>
              </div>
            </div>
          ) : reparaciones.length === 0 ? (
            <div className="text-center py-12">
              <InboxIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mt-2">
                No hay reparaciones
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {busqueda || filtroEstado !== "todos"
                  ? "No se encontraron reparaciones con los filtros aplicados"
                  : "Aún no hay reparaciones registradas"}
              </p>
              {!busqueda && filtroEstado === "todos" && (
                <div className="mt-6">
                  <button
                    onClick={() => navigate("/reparaciones/nueva")}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Crear primera reparación
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Orden / Cliente
                  </th>
                  <th className="hidden md:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dispositivos
                  </th>
                  <th className="hidden lg:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progreso
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="hidden sm:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-2 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reparaciones.map((reparacion) => (
                  <React.Fragment key={reparacion.id}>
                    {/* Fila principal */}
                    <tr
                      className={`transition-colors ${
                        expandedRows.has(reparacion.id)
                          ? "bg-blue-50"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <button
                            onClick={() => toggleExpandRow(reparacion.id)}
                            className="mr-3 p-1 hover:bg-gray-200 rounded-full transition-all duration-200"
                            title={
                              expandedRows.has(reparacion.id)
                                ? "Contraer"
                                : "Expandir"
                            }
                          >
                            <ChevronRightIcon
                              className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
                                expandedRows.has(reparacion.id)
                                  ? "rotate-90"
                                  : ""
                              }`}
                            />
                          </button>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {reparacion.numero_orden}
                            </div>
                            <div className="text-sm text-gray-500">
                              {reparacion.cliente_nombre}{" "}
                              {reparacion.cliente_apellidos}
                            </div>
                            <div className="text-xs text-gray-400">
                              {reparacion.cliente_telefono}
                            </div>
                          </div>
                        </div>
                      </td>


                      <td className="hidden md:table-cell px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <DevicePhoneMobileIcon className="w-5 h-5 mr-1.5 text-gray-400" />
                          <span className="font-medium">
                            {reparacion.total_dispositivos}
                          </span>
                          <span className="text-gray-500 ml-1">
                            dispositivo
                            {reparacion.total_dispositivos !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </td>

                      <td className="hidden lg:table-cell px-3 sm:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <span className="font-medium">
                            {reparacion.averias_completadas}
                          </span>
                          <span className="text-gray-500">
                            {" "}
                            / {reparacion.total_averias} averías
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${
                                reparacion.total_averias > 0
                                  ? (reparacion.averias_completadas /
                                      reparacion.total_averias) *
                                    100
                                  : 0
                              }%`,
                            }}
                          ></div>
                        </div>
                      </td>

                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          €
                          {(
                            parseFloat(String(reparacion.total_final)) || 0
                          ).toFixed(2)}
                        </div>
                      </td>

                      <td className="hidden sm:table-cell px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(reparacion.fecha_ingreso).toLocaleDateString(
                          "es-ES"
                        )}
                      </td>

                      <td className="px-2 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-1 sm:space-x-2">
                          <button
                            onClick={() => abrirModalEdicion(reparacion)}
                            className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-50 transition-all"
                            title="Editar"
                          >
                            <PencilIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => setShowDeleteModal(reparacion.id)}
                            className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-50 transition-all"
                            title="Eliminar"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Fila expandida con detalles MEJORADOS */}
                    {expandedRows.has(reparacion.id) && reparacionDetalle && (
                      <tr>
                        <td colSpan={7} className="p-0 bg-gray-50">
                          <div className="m-2 sm:m-6 bg-white rounded-xl shadow-md border border-gray-300">
                            <div className="p-3 sm:p-6">
                              {/* Header compacto con información esencial */}
                              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-5 mb-4 sm:mb-6">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                  <div className="flex items-center space-x-3 sm:space-x-4">
                                    <div className="p-3 bg-blue-100 rounded-xl">
                                      <WrenchScrewdriverIcon className="h-8 w-8 text-blue-600" />
                                    </div>
                                    <div>
                                      <h3 className="text-xl font-bold text-gray-900">
                                        {
                                          reparacionDetalle.reparacion
                                            .numero_orden
                                        }
                                      </h3>
                                      <p className="text-sm text-gray-600 flex items-center space-x-3">
                                        <span className="flex items-center">
                                          <UserIcon className="w-4 h-4 mr-1" />
                                          {
                                            reparacionDetalle.reparacion.nombre
                                          }{" "}
                                          {
                                            reparacionDetalle.reparacion
                                              .apellidos
                                          }
                                        </span>
                                        <span className="text-gray-400">•</span>
                                        <span className="flex items-center">
                                          <BuildingStorefrontIcon className="w-4 h-4 mr-1" />
                                          {
                                            reparacionDetalle.reparacion
                                              .establecimiento_nombre
                                          }
                                        </span>
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-sm text-gray-600">
                                      Fecha de ingreso
                                    </div>
                                    <div className="text-lg font-semibold text-gray-900">
                                      {new Date(reparacionDetalle.reparacion.fecha_ingreso).toLocaleDateString('es-ES')}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Secciones colapsables */}
                              <div className="space-y-4">
                                {/* Sección Resumen General */}
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                  <button
                                    onClick={() =>
                                      toggleSection(reparacion.id, "resumen")
                                    }
                                    className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                                  >
                                    <div className="flex items-center space-x-3">
                                      <ChartBarIcon className="w-5 h-5 text-gray-600" />
                                      <h4 className="font-semibold text-gray-900">
                                        Resumen General
                                      </h4>
                                    </div>
                                    <ChevronDownIcon
                                      className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                                        expandedSections
                                          .get(reparacion.id)
                                          ?.has("resumen")
                                          ? "rotate-180"
                                          : ""
                                      }`}
                                    />
                                  </button>

                                  {expandedSections
                                    .get(reparacion.id)
                                    ?.has("resumen") && (
                                    <div className="px-3 sm:px-5 pb-3 sm:pb-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                      <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                                        <div className="flex items-center justify-between">
                                          <DevicePhoneMobileIcon className="w-8 h-8 text-blue-600" />
                                          <span className="text-2xl font-bold text-blue-900">
                                            {reparacionDetalle.estadisticas
                                              ?.total_dispositivos || 0}
                                          </span>
                                        </div>
                                        <p className="text-sm text-blue-700 mt-2">
                                          Dispositivos
                                        </p>
                                      </div>

                                      <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
                                        <div className="flex items-center justify-between">
                                          <WrenchScrewdriverIcon className="w-8 h-8 text-orange-600" />
                                          <span className="text-2xl font-bold text-orange-900">
                                            {reparacionDetalle.estadisticas
                                              ?.total_averias || 0}
                                          </span>
                                        </div>
                                        <p className="text-sm text-orange-700 mt-2">
                                          Averías
                                        </p>
                                      </div>

                                      <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                                        <div className="flex items-center justify-between">
                                          <CheckCircleIcon className="w-8 h-8 text-green-600" />
                                          <span className="text-2xl font-bold text-green-900">
                                            {reparacionDetalle.estadisticas
                                              ?.total_servicios || 0}
                                          </span>
                                        </div>
                                        <p className="text-sm text-green-700 mt-2">
                                          Intervenciones
                                        </p>
                                      </div>

                                      <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                                        <div className="flex items-center justify-between">
                                          <CurrencyEuroIcon className="w-8 h-8 text-purple-600" />
                                          <span className="text-2xl font-bold text-purple-900">
                                            €
                                            {Number(
                                              reparacionDetalle.estadisticas
                                                ?.total_servicios_precio || 0
                                            ).toFixed(2)}
                                          </span>
                                        </div>
                                        <p className="text-sm text-purple-700 mt-2">
                                          Total
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Sección Dispositivos con navegación */}
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                  <button
                                    onClick={() =>
                                      toggleSection(
                                        reparacion.id,
                                        "dispositivos"
                                      )
                                    }
                                    className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                                  >
                                    <div className="flex items-center space-x-3">
                                      <DevicePhoneMobileIcon className="w-5 h-5 text-gray-600" />
                                      <h4 className="font-semibold text-gray-900">
                                        Dispositivos (
                                        {reparacionDetalle.dispositivos
                                          ?.length || 0}
                                        )
                                      </h4>
                                    </div>
                                    <ChevronDownIcon
                                      className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                                        expandedSections
                                          .get(reparacion.id)
                                          ?.has("dispositivos")
                                          ? "rotate-180"
                                          : ""
                                      }`}
                                    />
                                  </button>

                                  {expandedSections
                                    .get(reparacion.id)
                                    ?.has("dispositivos") &&
                                    reparacionDetalle.dispositivos &&
                                    reparacionDetalle.dispositivos.length >
                                      0 && (
                                      <div className="px-3 sm:px-5 pb-3 sm:pb-5">
                                        {/* Tabs de dispositivos */}
                                        <div className="flex flex-wrap gap-2 mb-4 p-3 bg-gray-50 rounded-lg">
                                          <button
                                            onClick={() =>
                                              selectDevice(reparacion.id, null)
                                            }
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                              selectedDevices.get(
                                                reparacion.id
                                              ) === null ||
                                              selectedDevices.get(
                                                reparacion.id
                                              ) === undefined
                                                ? "bg-blue-600 text-white shadow-md"
                                                : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                                            }`}
                                          >
                                            <span className="flex items-center">
                                              <DocumentTextIcon className="w-4 h-4 mr-2" />
                                              Vista General
                                            </span>
                                          </button>

                                          {reparacionDetalle.dispositivos.map(
                                            (dispositivo) => (
                                              <button
                                                key={dispositivo.id}
                                                onClick={() =>
                                                  selectDevice(
                                                    reparacion.id,
                                                    dispositivo.id
                                                  )
                                                }
                                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                                  selectedDevices.get(
                                                    reparacion.id
                                                  ) === dispositivo.id
                                                    ? "bg-blue-600 text-white shadow-md"
                                                    : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                                                }`}
                                              >
                                                <span className="flex items-center">
                                                  <span className="text-lg mr-2">
                                                    {getDeviceIcon(
                                                      dispositivo.marca
                                                    )}
                                                  </span>
                                                  {dispositivo.marca}{" "}
                                                  {dispositivo.modelo}
                                                  {dispositivo.total_averias >
                                                    0 && (
                                                    <span
                                                      className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                                                        dispositivo.averias_completadas ===
                                                        dispositivo.total_averias
                                                          ? "bg-green-100 text-green-700"
                                                          : "bg-orange-100 text-orange-700"
                                                      }`}
                                                    >
                                                      {
                                                        dispositivo.averias_completadas
                                                      }
                                                      /
                                                      {
                                                        dispositivo.total_averias
                                                      }
                                                    </span>
                                                  )}
                                                </span>
                                              </button>
                                            )
                                          )}
                                        </div>

                                        {/* Contenido según selección */}
                                        {selectedDevices.get(reparacion.id) ===
                                          null ||
                                        selectedDevices.get(reparacion.id) ===
                                          undefined ? (
                                          /* Vista General - Lista compacta de todos los dispositivos */
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {reparacionDetalle.dispositivos.map(
                                              (dispositivo) => (
                                                <div
                                                  key={dispositivo.id}
                                                  className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200 hover:shadow-md transition-shadow"
                                                >
                                                  <div className="flex items-start justify-between mb-3">
                                                    <div className="flex items-center">
                                                      <span className="text-2xl mr-3">
                                                        {getDeviceIcon(
                                                          dispositivo.marca
                                                        )}
                                                      </span>
                                                      <div>
                                                        <h5 className="font-semibold text-gray-900">
                                                          {dispositivo.marca}{" "}
                                                          {dispositivo.modelo}
                                                        </h5>
                                                        <p className="text-sm text-gray-600">
                                                          IMEI:{" "}
                                                          {dispositivo.imei}
                                                        </p>
                                                      </div>
                                                    </div>
                                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                                                      <select
                                                        value={
                                                          confirmandoCambio.has(dispositivo.id) 
                                                            ? estadoTemporal[dispositivo.id] || ''
                                                            : dispositivo.estado_dispositivo?.toString() || ''
                                                        }
                                                        onChange={(e) => {
                                                          const nuevoEstadoId = e.target.value;
                                                          manejarCambioEstadoTemporal(dispositivo.id, nuevoEstadoId, dispositivo.estado_dispositivo);
                                                        }}
                                                        className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full min-w-0 sm:min-w-[120px]"
                                                      >
                                                        {estadosValidos.length === 0 && (
                                                          <option value="">Cargando estados...</option>
                                                        )}
                                                        {estadosValidos.map((estado) => (
                                                          <option key={estado.value} value={estado.value}>
                                                            {estado.label}
                                                          </option>
                                                        ))}
                                                        {estadosValidos.length > 0 && dispositivo.estado_dispositivo && 
                                                         !estadosValidos.find(e => e.value === dispositivo.estado_dispositivo?.toString()) && (
                                                          <option value={dispositivo.estado_dispositivo} style={{color: 'red'}}>
                                                            ⚠️ Estado ID {dispositivo.estado_dispositivo} (no encontrado)
                                                          </option>
                                                        )}
                                                      </select>
                                                      
                                                      {confirmandoCambio.has(dispositivo.id) && (
                                                        <>
                                                          <button
                                                            onClick={() => confirmarCambioEstado(dispositivo.id)}
                                                            className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                                                            title="Confirmar cambio"
                                                          >
                                                            ✓
                                                          </button>
                                                          <button
                                                            onClick={() => cancelarCambioEstado(dispositivo.id)}
                                                            className="px-2 py-1 text-xs bg-gray-400 text-white rounded hover:bg-gray-500 transition-colors"
                                                            title="Cancelar cambio"
                                                          >
                                                            ✕
                                                          </button>
                                                        </>
                                                      )}
                                                    </div>
                                                  </div>

                                                  <div className="grid grid-cols-2 gap-3 text-sm">
                                                    <div>
                                                      <span className="text-gray-500">
                                                        Averías:
                                                      </span>
                                                      <span className="ml-2 font-medium">
                                                        {
                                                          dispositivo.averias_completadas
                                                        }
                                                        /
                                                        {
                                                          dispositivo.total_averias
                                                        }
                                                      </span>
                                                    </div>
                                                    <div>
                                                      <span className="text-gray-500">
                                                        Total:
                                                      </span>
                                                      <span className="ml-2 font-medium">
                                                        €
                                                        {(() => {
                                                          const averiasDelDispositivo = (reparacionDetalle.averias || []).filter(
                                                            (a) => a.reparacion_detalle_id === dispositivo.id
                                                          );
                                                          const intervencionesDelDispositivo = (reparacionDetalle.intervenciones || []).filter(
                                                            (intervencion) => averiasDelDispositivo.some(averia => averia.id === intervencion.dispositivo_averia_id)
                                                          );
                                                          const totalDispositivo = intervencionesDelDispositivo.reduce(
                                                            (sum, interv) => sum + (parseFloat(interv.precio_total) || 0), 0
                                                          );
                                                          return totalDispositivo.toFixed(2);
                                                        })()}
                                                      </span>
                                                    </div>
                                                  </div>

                                                  {dispositivo.problemas_principales && (
                                                    <div className="mt-3 text-sm text-gray-600 bg-white p-2 rounded border border-gray-200">
                                                      <span className="font-medium">
                                                        Problemas:
                                                      </span>{" "}
                                                      {
                                                        dispositivo.problemas_principales
                                                      }
                                                    </div>
                                                  )}

                                                  <div className="mt-3">
                                                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                                                      <span>Progreso</span>
                                                      <span>
                                                        {dispositivo.total_averias >
                                                        0
                                                          ? Math.round(
                                                              (dispositivo.averias_completadas /
                                                                dispositivo.total_averias) *
                                                                100
                                                            )
                                                          : 0}
                                                        %
                                                      </span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                                      <div
                                                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                                                        style={{
                                                          width: `${
                                                            dispositivo.total_averias >
                                                            0
                                                              ? (dispositivo.averias_completadas /
                                                                  dispositivo.total_averias) *
                                                                100
                                                              : 0
                                                          }%`,
                                                        }}
                                                      ></div>
                                                    </div>
                                                  </div>
                                                </div>
                                              )
                                            )}
                                          </div>
                                        ) : (
                                          /* Vista detallada del dispositivo seleccionado */
                                          (() => {
                                            const dispositivoSeleccionado =
                                              reparacionDetalle.dispositivos.find(
                                                (d) =>
                                                  d.id ===
                                                  selectedDevices.get(
                                                    reparacion.id
                                                  )
                                              );

                                            if (!dispositivoSeleccionado)
                                              return null;

                                            const averiasDispositivo =
                                              (reparacionDetalle.averias || []).filter(
                                                (a) =>
                                                  a.reparacion_detalle_id ===
                                                  dispositivoSeleccionado.id
                                              );

                                            // Calcular el número/orden del dispositivo
                                            const numeroDispositivo = reparacionDetalle.dispositivos.findIndex(
                                              (d) => d.id === dispositivoSeleccionado.id
                                            ) + 1;

                                            // Calcular estadísticas específicas del dispositivo
                                            const intervencionesDipositivo = (reparacionDetalle.intervenciones || []).filter(
                                              (intervencion) => averiasDispositivo.some(averia => averia.id === intervencion.dispositivo_averia_id)
                                            );
                                            const totalDispositivoPrecio = intervencionesDipositivo.reduce(
                                              (sum, interv) => sum + (parseFloat(interv.precio_total) || 0), 0
                                            );

                                            return (
                                              <div className="space-y-4">
                                                {/* Información del dispositivo */}
                                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-5 border border-blue-200">
                                                  <div className="flex items-start justify-between mb-4">
                                                    <div className="flex items-center">
                                                      <span className="text-4xl mr-4">
                                                        {getDeviceIcon(
                                                          dispositivoSeleccionado.marca
                                                        )}
                                                      </span>
                                                      <div>
                                                        <h5 className="text-xl font-bold text-gray-900">
                                                          Dispositivo {numeroDispositivo}: {
                                                            dispositivoSeleccionado.marca
                                                          }{" "}
                                                          {
                                                            dispositivoSeleccionado.modelo
                                                          }
                                                        </h5>
                                                        <div className="flex items-center space-x-4 mt-1">
                                                          <span className="text-sm text-gray-600">
                                                            IMEI:{" "}
                                                            {
                                                              dispositivoSeleccionado.imei
                                                            }
                                                          </span>
                                                          {dispositivoSeleccionado.numero_serie && (
                                                            <span className="text-sm text-gray-600">
                                                              S/N:{" "}
                                                              {
                                                                dispositivoSeleccionado.numero_serie
                                                              }
                                                            </span>
                                                          )}
                                                        </div>
                                                      </div>
                                                    </div>
                                                  </div>

                                                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                                    <div>
                                                      <p className="text-xs text-gray-500 uppercase tracking-wider">
                                                        Estado
                                                      </p>
                                                      <div className="flex items-center space-x-2">
                                                        {(() => {
                                                          const estadoActual = estados.find(e => e.id === parseInt(dispositivoSeleccionado.estado_dispositivo?.toString() || '0'));
                                                          return (
                                                            <>
                                                              <span className="text-lg">
                                                                {estadoActual?.emoji || '📋'}
                                                              </span>
                                                              <span 
                                                                className="px-2 py-1 text-xs rounded-full font-medium border"
                                                                style={{
                                                                  backgroundColor: estadoActual?.color ? `${estadoActual.color}20` : '#f3f4f6',
                                                                  color: estadoActual?.color || '#6b7280',
                                                                  borderColor: estadoActual?.color || '#d1d5db'
                                                                }}
                                                              >
                                                                {estadoActual?.nombre || dispositivoSeleccionado.estado_dispositivo}
                                                              </span>
                                                            </>
                                                          );
                                                        })()}
                                                      </div>
                                                    </div>
                                                    {dispositivoSeleccionado.color && (
                                                      <div>
                                                        <p className="text-xs text-gray-500 uppercase tracking-wider">
                                                          Color
                                                        </p>
                                                        <p className="font-medium text-gray-900">
                                                          {
                                                            dispositivoSeleccionado.color
                                                          }
                                                        </p>
                                                      </div>
                                                    )}
                                                    {dispositivoSeleccionado.capacidad && (
                                                      <div>
                                                        <p className="text-xs text-gray-500 uppercase tracking-wider">
                                                          Capacidad
                                                        </p>
                                                        <p className="font-medium text-gray-900">
                                                          {
                                                            dispositivoSeleccionado.capacidad
                                                          }
                                                        </p>
                                                      </div>
                                                    )}
                                                    <div>
                                                      <p className="text-xs text-gray-500 uppercase tracking-wider">
                                                        Backup
                                                      </p>
                                                      <p className="font-medium text-gray-900">
                                                        {dispositivoSeleccionado.requiere_backup
                                                          ? dispositivoSeleccionado.backup_realizado
                                                            ? "✅ Realizado"
                                                            : "⏳ Pendiente"
                                                          : "No requerido"}
                                                      </p>
                                                    </div>
                                                    <div>
                                                      <p className="text-xs text-gray-500 uppercase tracking-wider">
                                                        Recepción
                                                      </p>
                                                      <p className="font-medium text-gray-900">
                                                        {formatDate(dispositivoSeleccionado.fecha_recepcion || dispositivoSeleccionado.created_at)}
                                                      </p>
                                                    </div>
                                                  </div>

                                                  {(dispositivoSeleccionado.observaciones_recepcion ||
                                                    dispositivoSeleccionado.patron_desbloqueo) && (
                                                    <div className="mt-4 space-y-2">
                                                      {dispositivoSeleccionado.observaciones_recepcion && (
                                                        <div className="bg-white bg-opacity-70 rounded p-3">
                                                          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                                                            Observaciones
                                                          </p>
                                                          <p className="text-sm text-gray-700">
                                                            {
                                                              dispositivoSeleccionado.observaciones_recepcion
                                                            }
                                                          </p>
                                                        </div>
                                                      )}
                                                      {dispositivoSeleccionado.patron_desbloqueo && (
                                                        <div className="bg-white bg-opacity-70 rounded p-3">
                                                          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                                                            Patrón desbloqueo
                                                          </p>
                                                          <p className="text-sm text-gray-700 font-mono">
                                                            {
                                                              dispositivoSeleccionado.patron_desbloqueo
                                                            }
                                                          </p>
                                                        </div>
                                                      )}
                                                    </div>
                                                  )}
                                                </div>

                                                {/* Estadísticas específicas del dispositivo */}
                                                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                                  <h6 className="font-semibold text-gray-900 mb-3 flex items-center">
                                                    <ChartBarIcon className="w-5 h-5 mr-2 text-gray-600" />
                                                    Resumen Dispositivo {numeroDispositivo}
                                                  </h6>
                                                  <div className="grid grid-cols-3 gap-4">
                                                    <div className="bg-orange-100 rounded-lg p-3 text-center">
                                                      <div className="text-lg font-bold text-orange-900">
                                                        {averiasDispositivo.length}
                                                      </div>
                                                      <div className="text-xs text-orange-700">
                                                        Averías
                                                      </div>
                                                    </div>
                                                    <div className="bg-green-100 rounded-lg p-3 text-center">
                                                      <div className="text-lg font-bold text-green-900">
                                                        {intervencionesDipositivo.length}
                                                      </div>
                                                      <div className="text-xs text-green-700">
                                                        Intervenciones
                                                      </div>
                                                    </div>
                                                    <div className="bg-purple-100 rounded-lg p-3 text-center">
                                                      <div className="text-lg font-bold text-purple-900">
                                                        €{(totalDispositivoPrecio || 0).toFixed(2)}
                                                      </div>
                                                      <div className="text-xs text-purple-700">
                                                        Total
                                                      </div>
                                                    </div>
                                                  </div>
                                                </div>

                                                {/* Averías del dispositivo */}
                                                {averiasDispositivo.length >
                                                  0 && (
                                                  <div>
                                                    <h6 className="font-semibold text-gray-900 mb-3 flex items-center">
                                                      <WrenchScrewdriverIcon className="w-5 h-5 mr-2 text-orange-500" />
                                                      Averías de este
                                                      dispositivo (
                                                      {
                                                        averiasDispositivo.length
                                                      }
                                                      )
                                                    </h6>
                                                    <div className="space-y-3">
                                                      {averiasDispositivo.map(
                                                        (averia) => (
                                                          <div
                                                            key={averia.id}
                                                            className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                                                          >
                                                            <div className="p-4">
                                                              <div className="flex items-start justify-between mb-3">
                                                                <div className="flex-1">
                                                                  <h6 className="font-semibold text-gray-900">
                                                                    {
                                                                      averia.averia_nombre
                                                                    }
                                                                  </h6>
                                                                  <p className="text-sm text-gray-600 mt-1">
                                                                    {
                                                                      averia.descripcion_cliente
                                                                    }
                                                                  </p>
                                                                </div>
                                                                <div className="flex items-center space-x-2 ml-4">
                                                                  <span
                                                                    className={`px-2 py-1 text-xs rounded-full border ${getPrioridadColor(
                                                                      averia.prioridad
                                                                    )}`}
                                                                  >
                                                                    {
                                                                      averia.prioridad
                                                                    }
                                                                  </span>
                                                                  <span
                                                                    className={`px-2 py-1 text-xs rounded-full border ${getEstadoColor(
                                                                      averia.estado_averia
                                                                    )}`}
                                                                  >
                                                                    {
                                                                      averia.estado_averia
                                                                    }
                                                                  </span>
                                                                </div>
                                                              </div>
                                                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm mb-3">
                                                                {averia.averia_categoria && (
                                                                  <div>
                                                                    <span className="text-gray-500">
                                                                      Categoría:
                                                                    </span>
                                                                    <span className="ml-2 font-medium">
                                                                      {
                                                                        averia.averia_categoria
                                                                      }
                                                                    </span>
                                                                  </div>
                                                                )}
                                                                <div>
                                                                  <span className="text-gray-500">
                                                                    Prioridad:
                                                                  </span>
                                                                  <span className="ml-2 font-medium">
                                                                    {
                                                                      averia.prioridad
                                                                    }
                                                                  </span>
                                                                </div>
                                                                <div>
                                                                  <span className="text-gray-500">
                                                                    Intervenciones:
                                                                  </span>
                                                                  <span className="ml-2 font-medium">
                                                                    {
                                                                      averia.intervenciones_completadas
                                                                    }
                                                                    /
                                                                    {
                                                                      averia.total_intervenciones
                                                                    }
                                                                  </span>
                                                                </div>
                                                              </div>

                                                              {/* Intervenciones de la avería */}
                                                              {(() => {
                                                                const intervencionesAveria = intervencionesDipositivo.filter(
                                                                  (int) => int.dispositivo_averia_id === averia.id
                                                                );
                                                                return intervencionesAveria.length > 0 && (
                                                                  <div className="border-t pt-3">
                                                                    <h6 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                                                                      <WrenchScrewdriverIcon className="w-4 h-4 mr-1 text-orange-500" />
                                                                      Intervenciones
                                                                      asignadas
                                                                      a esta
                                                                      avería (
                                                                      {
                                                                        intervencionesAveria.length
                                                                      }
                                                                      )
                                                                    </h6>
                                                                    <div className="space-y-2">
                                                                      {intervencionesAveria.map(
                                                                          (
                                                                            intervencion
                                                                          ) => (
                                                                            <div
                                                                              key={
                                                                                intervencion.id
                                                                              }
                                                                              className="flex items-center justify-between bg-gray-50 rounded p-2"
                                                                            >
                                                                              <div className="flex-1">
                                                                                <p className="text-sm font-medium text-gray-900">
                                                                                  {
                                                                                    intervencion.intervencion_nombre
                                                                                  }
                                                                                </p>
                                                                                <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                                                                                  <span
                                                                                    className={`px-2 py-0.5 rounded-full ${
                                                                                      intervencion.intervencion_tipo ===
                                                                                      "mano_obra"
                                                                                        ? "bg-blue-100 text-blue-700"
                                                                                        : intervencion.intervencion_tipo ===
                                                                                          "repuesto"
                                                                                        ? "bg-green-100 text-green-700"
                                                                                        : "bg-gray-100 text-gray-700"
                                                                                    }`}
                                                                                  >
                                                                                    {
                                                                                      intervencion.intervencion_tipo
                                                                                    }
                                                                                  </span>
                                                                                  <span>
                                                                                    Cant:{" "}
                                                                                    {
                                                                                      intervencion.cantidad
                                                                                    }
                                                                                  </span>
                                                                                  <span>
                                                                                    €
                                                                                    {(
                                                                                      Number(
                                                                                        intervencion.precio_unitario
                                                                                      ) ||
                                                                                      0
                                                                                    ).toFixed(
                                                                                      2
                                                                                    )}
                                                                                  </span>
                                                                                </div>
                                                                              </div>
                                                                              <div className="text-right ml-4">
                                                                                <p className="text-sm font-medium">
                                                                                  €
                                                                                  {(
                                                                                    Number(
                                                                                      intervencion.precio_total
                                                                                    ) ||
                                                                                    0
                                                                                  ).toFixed(
                                                                                    2
                                                                                  )}
                                                                                </p>
                                                                                <span
                                                                                  className={`inline-flex px-2 py-0.5 text-xs rounded-full border ${getEstadoServicioColor(
                                                                                    intervencion.estado_intervencion
                                                                                  )}`}
                                                                                >
                                                                                  {
                                                                                    intervencion.estado_intervencion
                                                                                  }
                                                                                </span>
                                                                              </div>
                                                                            </div>
                                                                          )
                                                                        )}
                                                                    </div>
                                                                    <div className="mt-3 pt-2 border-t border-gray-200">
                                                                      <div className="flex justify-between items-center">
                                                                        <span className="text-sm font-medium text-gray-600">
                                                                          Subtotal
                                                                          esta
                                                                          avería:
                                                                        </span>
                                                                        <span className="font-bold text-orange-600">
                                                                          €
                                                                          {intervencionesAveria
                                                                            .reduce(
                                                                              (
                                                                                total,
                                                                                interv
                                                                              ) =>
                                                                                total +
                                                                                (Number(
                                                                                  interv.precio_total
                                                                                ) ||
                                                                                  0),
                                                                              0
                                                                            )
                                                                            .toFixed(
                                                                              2
                                                                            )}
                                                                        </span>
                                                                      </div>
                                                                    </div>
                                                                  </div>
                                                                );
                                                              })()}
                                                            </div>
                                                          </div>
                                                        )
                                                      )}
                                                    </div>
                                                  </div>
                                                )}
                                              </div>
                                            );
                                          })()
                                        )}
                                      </div>
                                    )}
                                </div>

                                {/* Sección Cliente */}
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                  <button
                                    onClick={() =>
                                      toggleSection(reparacion.id, "cliente")
                                    }
                                    className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                                  >
                                    <div className="flex items-center space-x-3">
                                      <UserIcon className="w-5 h-5 text-gray-600" />
                                      <h4 className="font-semibold text-gray-900">
                                        Información del Cliente
                                      </h4>
                                    </div>
                                    <ChevronDownIcon
                                      className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                                        expandedSections
                                          .get(reparacion.id)
                                          ?.has("cliente")
                                          ? "rotate-180"
                                          : ""
                                      }`}
                                    />
                                  </button>

                                  {expandedSections
                                    .get(reparacion.id)
                                    ?.has("cliente") && (
                                    <div className="px-3 sm:px-5 pb-3 sm:pb-5">
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-3">
                                          <div>
                                            <p className="text-xs text-gray-500 uppercase tracking-wider">
                                              Nombre completo
                                            </p>
                                            <p className="font-medium text-gray-900">
                                              {
                                                reparacionDetalle.reparacion
                                                  .nombre
                                              }{" "}
                                              {
                                                reparacionDetalle.reparacion
                                                  .apellidos
                                              }
                                            </p>
                                          </div>
                                          <div>
                                            <p className="text-xs text-gray-500 uppercase tracking-wider">
                                              DNI
                                            </p>
                                            <p className="font-medium text-gray-900">
                                              {reparacionDetalle.reparacion.dni}
                                            </p>
                                          </div>
                                          <div>
                                            <p className="text-xs text-gray-500 uppercase tracking-wider">
                                              Teléfono
                                            </p>
                                            <p className="font-medium text-gray-900">
                                              {
                                                reparacionDetalle.reparacion
                                                  .telefono
                                              }
                                            </p>
                                          </div>
                                        </div>
                                        <div className="space-y-3">
                                          {reparacionDetalle.reparacion
                                            .email && (
                                            <div>
                                              <p className="text-xs text-gray-500 uppercase tracking-wider">
                                                Email
                                              </p>
                                              <p className="font-medium text-gray-900">
                                                {
                                                  reparacionDetalle.reparacion
                                                    .email
                                                }
                                              </p>
                                            </div>
                                          )}
                                          {reparacionDetalle.reparacion
                                            .direccion && (
                                            <div>
                                              <p className="text-xs text-gray-500 uppercase tracking-wider">
                                                Dirección
                                              </p>
                                              <p className="font-medium text-gray-900">
                                                {
                                                  reparacionDetalle.reparacion
                                                    .direccion
                                                }
                                              </p>
                                            </div>
                                          )}
                                          <div>
                                            <p className="text-xs text-gray-500 uppercase tracking-wider">
                                              Cliente desde
                                            </p>
                                            <p className="font-medium text-gray-900">
                                              {formatDate(reparacionDetalle.reparacion.fecha_registro)}
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Sección Historial y Comunicaciones */}
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                  <button
                                    onClick={() =>
                                      toggleSection(reparacion.id, "actividad")
                                    }
                                    className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                                  >
                                    <div className="flex items-center space-x-3">
                                      <ClockIcon className="w-5 h-5 text-gray-600" />
                                      <h4 className="font-semibold text-gray-900">
                                        Actividad y Comunicaciones
                                      </h4>
                                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                                        {(reparacionDetalle.historial?.length ||
                                          0) +
                                          (reparacionDetalle.comunicaciones
                                            ?.length || 0)}
                                      </span>
                                    </div>
                                    <ChevronDownIcon
                                      className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                                        expandedSections
                                          .get(reparacion.id)
                                          ?.has("actividad")
                                          ? "rotate-180"
                                          : ""
                                      }`}
                                    />
                                  </button>

                                  {expandedSections
                                    .get(reparacion.id)
                                    ?.has("actividad") && (
                                    <div className="px-3 sm:px-5 pb-3 sm:pb-5">
                                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                        {/* Historial */}
                                        <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                                          <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                                            <DocumentTextIcon className="w-4 h-4 mr-2 text-gray-500" />
                                            Historial (
                                            {reparacionDetalle.historial
                                              ?.length || 0}
                                            )
                                          </h5>
                                          <div className="space-y-2 max-h-64 overflow-y-auto">
                                            {reparacionDetalle.historial &&
                                            reparacionDetalle.historial.length >
                                              0 ? (
                                              reparacionDetalle.historial.map(
                                                (item) => (
                                                  <div
                                                    key={item.id}
                                                    className="bg-white rounded p-3 border border-gray-200"
                                                  >
                                                    <div className="flex items-start justify-between">
                                                      <div className="flex-1">
                                                        <div className="flex items-center mb-1">
                                                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mr-2 ${
                                                            item.evento_tipo === 'cambio_estado' 
                                                              ? 'bg-blue-100 text-blue-800' 
                                                              : item.evento_tipo === 'creacion'
                                                              ? 'bg-green-100 text-green-800'
                                                              : 'bg-gray-100 text-gray-800'
                                                          }`}>
                                                            {item.evento_tipo === 'cambio_estado' ? '🔄 Estado' 
                                                             : item.evento_tipo === 'creacion' ? '✨ Creación'
                                                             : '📝 Evento'}
                                                          </span>
                                                        </div>
                                                        <p className="text-sm text-gray-900 mb-2">
                                                          {item.descripcion}
                                                        </p>
                                                        
                                                        {/* Mostrar datos de auditoría si existen */}
                                                        {(item.datos_anteriores || item.datos_nuevos) && (
                                                          <div className="bg-gray-50 rounded p-2 mt-2 border-l-4 border-blue-400">
                                                            <p className="text-xs font-semibold text-gray-700 mb-1">
                                                              📊 Datos de Auditoría:
                                                            </p>
                                                            
                                                            {/* Mostrar alertas de cambios importantes */}
                                                            {(() => {
                                                              const alertas = detectarCambiosImportantes(item.datos_anteriores, item.datos_nuevos);
                                                              return alertas.length > 0 && (
                                                                <div className="mb-2">
                                                                  {alertas.map((alerta, index) => (
                                                                    <div key={index} className="bg-yellow-50 border border-yellow-200 rounded px-2 py-1 mb-1">
                                                                      <span className="text-xs font-semibold text-yellow-800">{alerta}</span>
                                                                    </div>
                                                                  ))}
                                                                </div>
                                                              );
                                                            })()}
                                                            
                                                            {item.datos_anteriores && (
                                                              <div className="mb-1">
                                                                <span className="text-xs text-red-600 font-medium">Antes:</span>
                                                                <span className="text-xs text-gray-600 ml-1">
                                                                  Estado: {item.datos_anteriores.estado_anterior || 'N/A'}
                                                                  {item.datos_anteriores.total_anterior && (
                                                                    <span>, Total: €{item.datos_anteriores.total_anterior}</span>
                                                                  )}
                                                                </span>
                                                              </div>
                                                            )}
                                                            {item.datos_nuevos && (
                                                              <div>
                                                                <span className="text-xs text-green-600 font-medium">Después:</span>
                                                                <span className="text-xs text-gray-600 ml-1">
                                                                  Estado: {item.datos_nuevos.estado_nuevo || 'N/A'}
                                                                  {item.datos_nuevos.total_actual && (
                                                                    <span>, Total: €{item.datos_nuevos.total_actual}</span>
                                                                  )}
                                                                  {item.datos_nuevos.notas_nuevas && (
                                                                    <span>, Notas: {item.datos_nuevos.notas_nuevas}</span>
                                                                  )}
                                                                </span>
                                                              </div>
                                                            )}
                                                          </div>
                                                        )}
                                                      </div>
                                                    </div>
                                                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                                                      <p className="text-xs text-gray-500">
                                                        {new Date(
                                                          item.fecha_evento
                                                        ).toLocaleDateString(
                                                          "es-ES"
                                                        )}{" "}
                                                        {new Date(
                                                          item.fecha_evento
                                                        ).toLocaleTimeString(
                                                          "es-ES",
                                                          {
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                          }
                                                        )}
                                                      </p>
                                                      <p className="text-xs text-gray-500 font-medium">
                                                        👤 {item.usuario_nombre}
                                                      </p>
                                                    </div>
                                                  </div>
                                                )
                                              )
                                            ) : (
                                              <p className="text-sm text-gray-500 text-center py-8">
                                                No hay historial registrado
                                              </p>
                                            )}
                                          </div>
                                        </div>

                                        {/* Comunicaciones */}
                                        <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                                          <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                                            <ChatBubbleLeftRightIcon className="w-4 h-4 mr-2 text-gray-500" />
                                            Comunicaciones (
                                            {reparacionDetalle.comunicaciones
                                              ?.length || 0}
                                            )
                                          </h5>
                                          <div className="space-y-2 max-h-64 overflow-y-auto">
                                            {reparacionDetalle.comunicaciones &&
                                            reparacionDetalle.comunicaciones
                                              .length > 0 ? (
                                              reparacionDetalle.comunicaciones.map(
                                                (comunicacion) => (
                                                  <div
                                                    key={comunicacion.id}
                                                    className="bg-white rounded p-3 border border-gray-200"
                                                  >
                                                    <div className="flex items-start justify-between">
                                                      <div>
                                                        <span className="inline-flex px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700 font-medium">
                                                          {comunicacion.tipo}
                                                        </span>
                                                        <p className="text-sm text-gray-900 mt-1">
                                                          {comunicacion.mensaje}
                                                        </p>
                                                      </div>
                                                    </div>
                                                    <div className="flex items-center justify-between mt-1">
                                                      <p className="text-xs text-gray-500">
                                                        {new Date(
                                                          comunicacion.fecha_creacion
                                                        ).toLocaleDateString(
                                                          "es-ES"
                                                        )}
                                                      </p>
                                                      <p className="text-xs text-gray-500">
                                                        {
                                                          comunicacion.usuario_nombre
                                                        }
                                                      </p>
                                                    </div>
                                                  </div>
                                                )
                                              )
                                            ) : (
                                              <p className="text-sm text-gray-500 text-center py-8">
                                                No hay comunicaciones
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Sección Pagos */}
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                  <button
                                    onClick={() =>
                                      toggleSection(reparacion.id, "pagos")
                                    }
                                    className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                                  >
                                    <div className="flex items-center space-x-3">
                                      <CreditCardIcon className="w-5 h-5 text-gray-600" />
                                      <h4 className="font-semibold text-gray-900">
                                        Pagos
                                      </h4>
                                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                                        {reparacionDetalle.pagos?.length || 0}
                                      </span>
                                    </div>
                                    <ChevronDownIcon
                                      className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                                        expandedSections
                                          .get(reparacion.id)
                                          ?.has("pagos")
                                          ? "rotate-180"
                                          : ""
                                      }`}
                                    />
                                  </button>

                                  {expandedSections
                                    .get(reparacion.id)
                                    ?.has("pagos") && (
                                    <div className="px-3 sm:px-5 pb-3 sm:pb-5">
                                      {reparacionDetalle.pagos &&
                                      reparacionDetalle.pagos.length > 0 ? (
                                        <div className="space-y-3">
                                          {reparacionDetalle.pagos.map(
                                            (pago) => (
                                              <div
                                                key={pago.id}
                                                className="bg-green-50 rounded-lg p-4 border border-green-200"
                                              >
                                                <div className="flex items-center justify-between">
                                                  <div>
                                                    <p className="text-lg font-semibold text-green-900">
                                                      €{pago.monto.toFixed(2)}
                                                    </p>
                                                    <p className="text-sm text-green-700">
                                                      {pago.metodo_pago}
                                                    </p>
                                                    {pago.referencia_pago && (
                                                      <p className="text-xs text-gray-600 mt-1">
                                                        Ref:{" "}
                                                        {pago.referencia_pago}
                                                      </p>
                                                    )}
                                                  </div>
                                                  <div className="text-right">
                                                    <p className="text-sm text-gray-600">
                                                      {new Date(
                                                        pago.fecha_pago
                                                      ).toLocaleDateString(
                                                        "es-ES"
                                                      )}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                      {new Date(
                                                        pago.fecha_pago
                                                      ).toLocaleTimeString(
                                                        "es-ES",
                                                        {
                                                          hour: "2-digit",
                                                          minute: "2-digit",
                                                        }
                                                      )}
                                                    </p>
                                                  </div>
                                                </div>
                                                {pago.notas_pago && (
                                                  <p className="text-sm text-gray-600 mt-2 bg-white bg-opacity-50 rounded p-2">
                                                    {pago.notas_pago}
                                                  </p>
                                                )}
                                              </div>
                                            )
                                          )}

                                          {/* Resumen de pagos */}
                                          <div className="bg-gray-100 rounded-lg p-4 border border-gray-300">
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                              <div>
                                                <p className="text-gray-600">
                                                  Total presupuestado:
                                                </p>
                                                <p className="font-semibold text-gray-900">
                                                  €
                                                  {reparacionDetalle.reparacion.total_presupuestado.toFixed(
                                                    2
                                                  )}
                                                </p>
                                              </div>
                                              <div>
                                                <p className="text-gray-600">
                                                  Total pagado:
                                                </p>
                                                <p className="font-semibold text-green-600">
                                                  €
                                                  {Number(
                                                    reparacionDetalle
                                                      .estadisticas
                                                      ?.total_pagado || 0
                                                  ).toFixed(2)}
                                                </p>
                                              </div>
                                              <div>
                                                <p className="text-gray-600">
                                                  Pendiente:
                                                </p>
                                                <p className="font-semibold text-orange-600">
                                                  €
                                                  {(
                                                    reparacionDetalle.reparacion
                                                      .total_final -
                                                    (reparacionDetalle
                                                      .estadisticas
                                                      ?.total_pagado || 0)
                                                  ).toFixed(2)}
                                                </p>
                                              </div>
                                              <div>
                                                <p className="text-gray-600">
                                                  Estado:
                                                </p>
                                                <p className="font-semibold">
                                                  {reparacionDetalle
                                                    .estadisticas
                                                    ?.total_pagado >=
                                                  reparacionDetalle.reparacion
                                                    .total_final ? (
                                                    <span className="text-green-600">
                                                      ✅ Pagado
                                                    </span>
                                                  ) : (
                                                    <span className="text-orange-600">
                                                      ⏳ Pendiente
                                                    </span>
                                                  )}
                                                </p>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="text-center py-8">
                                          <CreditCardIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                          <p className="text-sm text-gray-500">
                                            No hay pagos registrados
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Acciones rápidas mejoradas */}
                              <div className="mt-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="font-semibold text-gray-900 flex items-center">
                                    <i className="bi bi-lightning-fill mr-2 text-yellow-500"></i>
                                    Acciones Rápidas
                                  </h4>
                                  <span className="text-xs text-gray-500">
                                    Última actualización:{" "}
                                    {new Date(
                                      reparacionDetalle.reparacion.updated_at
                                    ).toLocaleString("es-ES")}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                  <button
                                    onClick={() =>
                                      navigate(
                                        `/reparaciones/ver/${reparacion.id}`
                                      )
                                    }
                                    className="flex items-center justify-center px-4 py-2.5 text-sm bg-white hover:bg-blue-50 text-blue-700 rounded-lg transition-all border border-blue-200 hover:border-blue-300 shadow-sm hover:shadow"
                                  >
                                    <i className="bi bi-eye mr-2"></i>
                                    Ver completo
                                  </button>
                                  <button
                                    onClick={() => abrirModalEdicion(reparacion)}
                                    className="flex items-center justify-center px-4 py-2.5 text-sm bg-white hover:bg-green-50 text-green-700 rounded-lg transition-all border border-green-200 hover:border-green-300 shadow-sm hover:shadow"
                                  >
                                    <i className="bi bi-pencil mr-2"></i>
                                    Editar
                                  </button>
                                  <button
                                    onClick={() => window.print()}
                                    className="flex items-center justify-center px-4 py-2.5 text-sm bg-white hover:bg-gray-50 text-gray-700 rounded-lg transition-all border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow"
                                  >
                                    <i className="bi bi-printer mr-2"></i>
                                    Imprimir
                                  </button>
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(
                                        reparacionDetalle.reparacion
                                          .numero_orden
                                      );
                                      showInfo(
                                        "Copiado",
                                        `El número de orden "${reparacionDetalle.reparacion.numero_orden}" ha sido copiado.`
                                      ); // MODIFICADO
                                    }}
                                    className="flex items-center justify-center px-4 py-2.5 text-sm bg-white hover:bg-purple-50 text-purple-700 rounded-lg transition-all border border-purple-200 hover:border-purple-300 shadow-sm hover:shadow"
                                  >
                                    <i className="bi bi-clipboard mr-2"></i>
                                    Copiar orden
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal de confirmación para eliminar */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl animate-fade-in">
            <div className="flex items-start mb-4">
              <div className="flex-shrink-0 h-12 w-12 flex items-center justify-center rounded-full bg-red-100">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4 text-left">
                <h3 className="text-lg font-semibold text-gray-900">
                  Confirmar eliminación
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  ¿Estás seguro de que quieres eliminar esta reparación? Esta
                  acción no se puede deshacer y se perderán todos los datos
                  asociados.
                </p>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={() => eliminarReparacion(showDeleteModal)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all font-medium shadow-md hover:shadow-lg"
              >
                Eliminar definitivamente
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal.reparacion && (
        <ModalSeleccionPaso
          isOpen={showEditModal.isOpen}
          onClose={cerrarModalEdicion}
          onSeleccionar={seleccionarPasoEdicion}
          reparacion={showEditModal.reparacion}
        />
      )}
    </div>
  );
};

export default ListaReparaciones;
