import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDownIcon,
  ChevronRightIcon,
  PlusIcon,
  WrenchScrewdriverIcon,
  CurrencyEuroIcon
} from '@heroicons/react/24/outline';
import { useReparacionFlow } from '../../hooks/useReparacionFlow';
import { Dispositivo, DiagnosticoPresupuesto } from '../../types/reparacion.types';

interface UnifiedDiagnosisPanelProps {
  dispositivos: Dispositivo[];
  diagnosticos: Map<string, DiagnosticoPresupuesto>;
}

export const UnifiedDiagnosisPanel: React.FC<UnifiedDiagnosisPanelProps> = ({
  dispositivos,
  diagnosticos
}) => {
  const [expandedDevice, setExpandedDevice] = useState<string | null>(null);
  const { setDiagnostico } = useReparacionFlow();

  const handleDeviceToggle = (deviceId: string) => {
    setExpandedDevice(expandedDevice === deviceId ? null : deviceId);
  };

  const getDiagnosticoForDevice = (deviceId: string): DiagnosticoPresupuesto => {
    const existing = diagnosticos.get(deviceId);
    if (existing) return existing;

    // Crear diagnóstico vacío
    const newDiagnostico: DiagnosticoPresupuesto = {
      dispositivoId: deviceId,
      averias: [],
      totales: {
        subtotal: 0,
        descuento: 0,
        total: 0
      },
      fecha_diagnostico: new Date()
    };

    return newDiagnostico;
  };

  const calculateTotals = (diagnostico: DiagnosticoPresupuesto) => {
    let subtotal = 0;
    diagnostico.averias.forEach(averia => {
      averia.intervenciones.forEach(intervencion => {
        subtotal += intervencion.precio * intervencion.cantidad;
      });
    });

    const descuento = 0; // TODO: Implementar descuentos
    const total = subtotal - descuento;

    return { subtotal, descuento, total };
  };

  const updateDiagnostico = async (deviceId: string, updatedDiagnostico: DiagnosticoPresupuesto) => {
    const totals = calculateTotals(updatedDiagnostico);
    const finalDiagnostico = {
      ...updatedDiagnostico,
      totales: totals
    };

    await setDiagnostico(deviceId, finalDiagnostico);
  };

  const addAveria = async (deviceId: string) => {
    const diagnostico = getDiagnosticoForDevice(deviceId);
    const newAveria = {
      id: crypto.randomUUID(),
      nombre: 'Nueva avería',
      descripcion: '',
      categoria: '',
      intervenciones: []
    };

    const updatedDiagnostico = {
      ...diagnostico,
      averias: [...diagnostico.averias, newAveria]
    };

    await updateDiagnostico(deviceId, updatedDiagnostico);
  };

  const addIntervencion = async (deviceId: string, averiaId: string) => {
    const diagnostico = getDiagnosticoForDevice(deviceId);
    const newIntervencion = {
      id: crypto.randomUUID(),
      concepto: 'Nueva intervención',
      descripcion: '',
      precio: 0,
      cantidad: 1,
      tipo: 'mano_obra' as const,
      tiempo_estimado: 0
    };

    const updatedAverias = diagnostico.averias.map(averia => {
      if (averia.id === averiaId) {
        return {
          ...averia,
          intervenciones: [...averia.intervenciones, newIntervencion]
        };
      }
      return averia;
    });

    const updatedDiagnostico = {
      ...diagnostico,
      averias: updatedAverias
    };

    await updateDiagnostico(deviceId, updatedDiagnostico);
  };

  const updateIntervencion = async (
    deviceId: string, 
    averiaId: string, 
    intervencionId: string, 
    updates: any
  ) => {
    const diagnostico = getDiagnosticoForDevice(deviceId);
    
    const updatedAverias = diagnostico.averias.map(averia => {
      if (averia.id === averiaId) {
        const updatedIntervenciones = averia.intervenciones.map(intervencion => {
          if (intervencion.id === intervencionId) {
            return { ...intervencion, ...updates };
          }
          return intervencion;
        });
        return { ...averia, intervenciones: updatedIntervenciones };
      }
      return averia;
    });

    const updatedDiagnostico = {
      ...diagnostico,
      averias: updatedAverias
    };

    await updateDiagnostico(deviceId, updatedDiagnostico);
  };

  return (
    <div className="space-y-4">
      {dispositivos.map((dispositivo) => {
        const diagnostico = getDiagnosticoForDevice(dispositivo.id);
        const isExpanded = expandedDevice === dispositivo.id;
        const totals = calculateTotals(diagnostico);

        return (
          <motion.div
            key={dispositivo.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-gray-200 rounded-lg overflow-hidden"
          >
            {/* Header del dispositivo */}
            <div
              className="bg-gray-50 px-4 py-3 cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => handleDeviceToggle(dispositivo.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {isExpanded ? (
                    <ChevronDownIcon className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronRightIcon className="w-5 h-5 text-gray-500" />
                  )}
                  <WrenchScrewdriverIcon className="w-5 h-5 text-gray-400" />
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {dispositivo.marca} {dispositivo.modelo}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {diagnostico.averias.length} averías • {diagnostico.averias.reduce((sum, a) => sum + a.intervenciones.length, 0)} intervenciones
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Total</p>
                    <p className="font-semibold text-gray-900">
                      {totals.total.toFixed(2)}€
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contenido expandible */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-gray-200"
                >
                  <div className="p-4 space-y-4">
                    {/* Lista de averías */}
                    <div className="space-y-3">
                      {diagnostico.averias.map((averia) => (
                        <div key={averia.id} className="border border-gray-200 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-gray-900">{averia.nombre}</h4>
                            <button
                              onClick={() => addIntervencion(dispositivo.id, averia.id)}
                              className="p-1 text-blue-600 hover:text-blue-700"
                            >
                              <PlusIcon className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Intervenciones */}
                          <div className="space-y-2">
                            {averia.intervenciones.map((intervencion) => (
                              <div key={intervencion.id} className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
                                <div className="flex-1">
                                  <input
                                    type="text"
                                    value={intervencion.concepto}
                                    onChange={(e) => updateIntervencion(
                                      dispositivo.id, 
                                      averia.id, 
                                      intervencion.id, 
                                      { concepto: e.target.value }
                                    )}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="Concepto de la intervención"
                                  />
                                </div>
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="number"
                                    value={intervencion.precio}
                                    onChange={(e) => updateIntervencion(
                                      dispositivo.id, 
                                      averia.id, 
                                      intervencion.id, 
                                      { precio: parseFloat(e.target.value) || 0 }
                                    )}
                                    className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="0.00"
                                    step="0.01"
                                  />
                                  <span className="text-sm text-gray-500">€</span>
                                  <input
                                    type="number"
                                    value={intervencion.cantidad}
                                    onChange={(e) => updateIntervencion(
                                      dispositivo.id, 
                                      averia.id, 
                                      intervencion.id, 
                                      { cantidad: parseInt(e.target.value) || 1 }
                                    )}
                                    className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    min="1"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}

                      {/* Botón añadir avería */}
                      <button
                        onClick={() => addAveria(dispositivo.id)}
                        className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:text-gray-700 hover:border-gray-400 transition-colors"
                      >
                        <div className="flex items-center justify-center space-x-2">
                          <PlusIcon className="w-4 h-4" />
                          <span>Añadir avería</span>
                        </div>
                      </button>
                    </div>

                    {/* Totales del dispositivo */}
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Subtotal:</span>
                        <span className="font-medium">{totals.subtotal.toFixed(2)}€</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Descuento:</span>
                        <span className="font-medium text-green-600">-{totals.descuento.toFixed(2)}€</span>
                      </div>
                      <div className="flex justify-between items-center border-t border-gray-200 pt-2 mt-2">
                        <span className="font-semibold">Total dispositivo:</span>
                        <span className="font-semibold text-blue-600">{totals.total.toFixed(2)}€</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}; 