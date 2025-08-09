// hooks/useProteccionDatos.ts - Hook para proteger contra pérdida de datos
import { useEffect, useCallback } from 'react';

interface UseProteccionDatosProps {
  hayDatosSinGuardar: boolean;
  mensajePersonalizado?: string;
}

const useProteccionDatos = ({ 
  hayDatosSinGuardar, 
  mensajePersonalizado = "¡Atención! Tienes cambios sin guardar que se perderán si sales de esta página." 
}: UseProteccionDatosProps) => {

  // Función para mostrar confirmación al salir
  const manejarAntesDeDescargar = useCallback((event: BeforeUnloadEvent) => {
    if (hayDatosSinGuardar) {
      // Mensaje estándar del navegador
      event.preventDefault();
      event.returnValue = mensajePersonalizado;
      return mensajePersonalizado;
    }
  }, [hayDatosSinGuardar, mensajePersonalizado]);

  // Registrar y limpiar el event listener
  useEffect(() => {
    if (hayDatosSinGuardar) {
      console.log('🛡️ Protección activada - hay datos sin guardar');
      window.addEventListener('beforeunload', manejarAntesDeDescargar);
    } else {
      console.log('✅ Protección desactivada - no hay datos sin guardar');
      window.removeEventListener('beforeunload', manejarAntesDeDescargar);
    }

    // Cleanup al desmontar
    return () => {
      window.removeEventListener('beforeunload', manejarAntesDeDescargar);
    };
  }, [hayDatosSinGuardar, manejarAntesDeDescargar]);

  return {
    protegido: hayDatosSinGuardar
  };
};

export default useProteccionDatos;