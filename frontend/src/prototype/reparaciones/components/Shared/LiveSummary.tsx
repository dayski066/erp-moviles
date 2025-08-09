import React from 'react';
import { motion } from 'framer-motion';
import { 
  UserIcon, 
  DevicePhoneMobileIcon, 
  WrenchScrewdriverIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { Cliente, Dispositivo, DiagnosticoPresupuesto, LoadingStates } from '../../types/reparacion.types';

interface LiveSummaryProps {
  cliente: Cliente | null;
  dispositivos: Dispositivo[];
  diagnosticos: Map<string, DiagnosticoPresupuesto>;
  progress: number;
  isValid: boolean;
  loadingStates: LoadingStates;
}

export const LiveSummary: React.FC<LiveSummaryProps> = ({
  cliente,
  dispositivos,
  diagnosticos,
  progress,
  isValid,
  loadingStates
}) => {
  // Calcular totales
  const totalReparacion = Array.from(diagnosticos.values()).reduce((total, diagnostico) => {
    return total + diagnostico.totales.total;
  }, 0);

  const averiasCount = Array.from(diagnosticos.values()).reduce((total, diagnostico) => {
    return total + diagnostico.averias.length;
  }, 0);

  const intervencionesCount = Array.from(diagnosticos.values()).reduce((total, diagnostico) => {
    return total + diagnostico.averias.reduce((sum, averia) => sum + averia.intervenciones.length, 0);
  }, 0);

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <CheckCircleIcon className="w-5 h-5 mr-2 text-green-500" />
          Resumen
        </h3>
        <div className="mt-2">
          <div className="bg-gray-200 rounded-full h-2">
            <motion.div
              className="bg-green-500 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <p className="text-sm text-gray-500 mt-1">{progress}% completado</p>
        </div>
      </div>

      {/* Contenido */}
      <div className="p-6 space-y-6">
        {/* Cliente */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900 flex items-center">
              <UserIcon className="w-4 h-4 mr-2" />
              Cliente
            </h4>
            {cliente ? (
              <CheckCircleIcon className="w-4 h-4 text-green-500" />
            ) : (
              <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500" />
            )}
          </div>
          {cliente ? (
            <div className="text-sm text-gray-600">
              <p>{cliente.nombre} {cliente.apellidos}</p>
              <p className="text-gray-500">{cliente.dni}</p>
              <p className="text-gray-500">{cliente.telefono}</p>
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">No seleccionado</p>
          )}
        </div>

        {/* Dispositivos */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900 flex items-center">
              <DevicePhoneMobileIcon className="w-4 h-4 mr-2" />
              Dispositivos
            </h4>
            <span className="text-sm text-gray-500">{dispositivos.length}</span>
          </div>
          {dispositivos.length > 0 ? (
            <div className="space-y-1">
              {dispositivos.slice(0, 3).map((dispositivo) => (
                <div key={dispositivo.id} className="text-sm text-gray-600 flex items-center">
                  <CheckCircleIcon className="w-3 h-3 mr-2 text-green-500" />
                  {dispositivo.marca} {dispositivo.modelo}
                </div>
              ))}
              {dispositivos.length > 3 && (
                <p className="text-xs text-gray-500">
                  +{dispositivos.length - 3} más
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">No añadidos</p>
          )}
        </div>

        {/* Diagnósticos */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900 flex items-center">
              <WrenchScrewdriverIcon className="w-4 h-4 mr-2" />
              Diagnósticos
            </h4>
            <span className="text-sm text-gray-500">{diagnosticos.size}</span>
          </div>
          {diagnosticos.size > 0 ? (
            <div className="space-y-1">
              <div className="text-sm text-gray-600">
                <span className="font-medium">{averiasCount}</span> averías
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium">{intervencionesCount}</span> intervenciones
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">No configurados</p>
          )}
        </div>

        {/* Totales */}
        {totalReparacion > 0 && (
          <div className="pt-4 border-t border-gray-200">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">{totalReparacion.toFixed(2)}€</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Descuento:</span>
                <span className="font-medium text-green-600">-0.00€</span>
              </div>
              <div className="flex justify-between text-lg font-semibold border-t border-gray-200 pt-2">
                <span>TOTAL:</span>
                <span className="text-blue-600">{totalReparacion.toFixed(2)}€</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Acciones */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div className="space-y-2">
          <button
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!isValid || loadingStates.guardando}
          >
            {loadingStates.guardando ? 'Guardando...' : 'Guardar Borrador'}
          </button>
          <button
            className="w-full bg-green-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!isValid || loadingStates.guardando}
          >
            {loadingStates.guardando ? 'Creando...' : 'Crear Reparación'}
          </button>
        </div>
      </div>
    </div>
  );
}; 