import React from 'react';
import { DeviceList } from './DeviceList';
import { DeviceQuickAdd } from './DeviceQuickAdd';
import { useReparacionFlow } from '../../hooks/useReparacionFlow';

export const DispositivosSection: React.FC = () => {
  const { dispositivos, loadingStates } = useReparacionFlow();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">
          Dispositivos a Reparar
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Añade los dispositivos que necesitan reparación
        </p>
      </div>

      <div className="p-6">
        {loadingStates.dispositivos ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-600">Cargando...</span>
          </div>
        ) : (
          <div className="space-y-6">
            <DeviceList dispositivos={dispositivos} />
            <DeviceQuickAdd />
          </div>
        )}
      </div>
    </div>
  );
}; 