import React from 'react';
import { UnifiedDiagnosisPanel } from './UnifiedDiagnosisPanel';
import { useReparacionFlow } from '../../hooks/useReparacionFlow';

export const DiagnosticoPresupuestoSection: React.FC = () => {
  const { dispositivos, diagnosticos, loadingStates } = useReparacionFlow();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">
          Diagnóstico y Presupuesto
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Configura las averías e intervenciones para cada dispositivo
        </p>
      </div>

      <div className="p-6">
        {loadingStates.diagnosticos ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-600">Cargando...</span>
          </div>
        ) : dispositivos.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay dispositivos para diagnosticar
            </h3>
            <p className="text-gray-500">
              Añade dispositivos en la sección anterior para continuar
            </p>
          </div>
        ) : (
          <UnifiedDiagnosisPanel 
            dispositivos={dispositivos}
            diagnosticos={diagnosticos}
          />
        )}
      </div>
    </div>
  );
}; 