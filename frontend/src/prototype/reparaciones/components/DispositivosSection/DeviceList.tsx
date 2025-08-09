import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DevicePhoneMobileIcon,
  TrashIcon,
  PencilIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { useReparacionFlow } from '../../hooks/useReparacionFlow';
import { useReparacionStore } from '../../store/reparacionStore';
import { Dispositivo } from '../../types/reparacion.types';

interface DeviceListProps {
  dispositivos: Dispositivo[];
}

export const DeviceList: React.FC<DeviceListProps> = ({ dispositivos }) => {
  const { removeDispositivo } = useReparacionFlow();
  const { setDispositivoActivo, dispositivoActivo } = useReparacionStore();

  const handleRemoveDevice = async (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este dispositivo?')) {
      await removeDispositivo(id);
    }
  };

  const handleDeviceClick = (id: string) => {
    setDispositivoActivo(id);
  };

  if (dispositivos.length === 0) {
    return (
      <div className="text-center py-12">
        <DevicePhoneMobileIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No hay dispositivos añadidos
        </h3>
        <p className="text-gray-500">
          Añade el primer dispositivo para comenzar
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          Dispositivos ({dispositivos.length})
        </h3>
        {dispositivos.length > 1 && (
          <span className="text-sm text-gray-500">
            Arrastra para reordenar
          </span>
        )}
      </div>

      <AnimatePresence>
        {dispositivos.map((dispositivo, index) => (
          <motion.div
            key={dispositivo.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`
              relative bg-white border rounded-lg p-4 cursor-pointer transition-all duration-200
              ${dispositivoActivo === dispositivo.id 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
              }
            `}
            onClick={() => handleDeviceClick(dispositivo.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Badge de orden */}
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                  {dispositivo.orden}
                </div>

                {/* Información del dispositivo */}
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <DevicePhoneMobileIcon className="w-5 h-5 text-gray-400" />
                    <h4 className="font-medium text-gray-900">
                      {dispositivo.marca} {dispositivo.modelo}
                    </h4>
                  </div>
                  
                  <div className="mt-1 text-sm text-gray-500 space-y-1">
                    {dispositivo.color && (
                      <span className="inline-block mr-3">
                        Color: {dispositivo.color}
                      </span>
                    )}
                    {dispositivo.capacidad && (
                      <span className="inline-block mr-3">
                        {dispositivo.capacidad}
                      </span>
                    )}
                    {dispositivo.imei && (
                      <span className="inline-block">
                        IMEI: {dispositivo.imei}
                      </span>
                    )}
                  </div>

                  {dispositivo.observaciones && (
                    <p className="mt-2 text-sm text-gray-600 italic">
                      "{dispositivo.observaciones}"
                    </p>
                  )}
                </div>
              </div>

              {/* Acciones */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // TODO: Implementar edición
                    console.log('Editar dispositivo:', dispositivo);
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveDevice(dispositivo.id);
                  }}
                  className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>

                <ChevronRightIcon className="w-4 h-4 text-gray-400" />
              </div>
            </div>

            {/* Estado del dispositivo */}
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">
                  Añadido: {new Date(dispositivo.fecha_creacion).toLocaleDateString()}
                </span>
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                  Pendiente
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}; 