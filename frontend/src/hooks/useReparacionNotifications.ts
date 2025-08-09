// hooks/useReparacionNotifications.ts - NUEVO HOOK
import { useCallback } from 'react';
import { useNotification } from '../contexts/NotificationContext';

export const useReparacionNotifications = () => {
  const { showSuccess, showError, showWarning, showInfo } = useNotification();

  // Notificaciones para reparaciones creadas
  const notificarReparacionCreada = useCallback((numeroOrden: string) => {
    showSuccess(
      'Reparación Creada',
      `La reparación ${numeroOrden} se ha creado exitosamente.`,
      5000
    );
  }, [showSuccess]);

  // Notificaciones para reparaciones editadas
  const notificarReparacionEditada = useCallback((numeroOrden: string) => {
    showSuccess(
      'Reparación Actualizada',
      `La reparación ${numeroOrden} se ha actualizado exitosamente.`,
      5000
    );
  }, [showSuccess]);

  // Notificaciones para errores en creación
  const notificarErrorCreacion = useCallback((mensaje: string) => {
    showError(
      'Error al Crear Reparación',
      `No se pudo crear la reparación: ${mensaje}`,
      7000
    );
  }, [showError]);

  // Notificaciones para errores en edición
  const notificarErrorEdicion = useCallback((mensaje: string) => {
    showError(
      'Error al Editar Reparación',
      `No se pudo actualizar la reparación: ${mensaje}`,
      7000
    );
  }, [showError]);

  // Notificaciones para errores de conexión
  const notificarErrorConexion = useCallback(() => {
    showError(
      'Error de Conexión',
      'No se pudo conectar con el servidor. Revisa tu conexión.',
      6000
    );
  }, [showError]);

  // Notificaciones para operaciones de eliminación
  const notificarReparacionEliminada = useCallback((numeroOrden: string) => {
    showSuccess(
      'Reparación Eliminada',
      `La reparación ${numeroOrden} se ha eliminado exitosamente.`,
      4000
    );
  }, [showSuccess]);

  // Notificaciones para cambios de estado
  const notificarCambioEstado = useCallback((numeroOrden: string, nuevoEstado: string) => {
    showInfo(
      'Estado Actualizado',
      `La reparación ${numeroOrden} ahora está: ${nuevoEstado}`,
      4000
    );
  }, [showInfo]);

  // Notificaciones para validaciones
  const notificarValidacionFallida = useCallback((mensaje: string) => {
    showWarning(
      'Datos Incompletos',
      mensaje,
      5000
    );
  }, [showWarning]);

  // Notificaciones para progreso
  const notificarProgresoGuardado = useCallback((paso: string) => {
    showInfo(
      'Progreso Guardado',
      `Los cambios en ${paso} se han guardado automáticamente.`,
      3000
    );
  }, [showInfo]);

  return {
    notificarReparacionCreada,
    notificarReparacionEditada,
    notificarErrorCreacion,
    notificarErrorEdicion,
    notificarErrorConexion,
    notificarReparacionEliminada,
    notificarCambioEstado,
    notificarValidacionFallida,
    notificarProgresoGuardado,
  };
};