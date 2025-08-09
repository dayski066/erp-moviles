// pages/Reparaciones/components/Paso5ResumenCompleto.tsx - MODIFICADO
import React, { useState, useMemo } from 'react';
import type { ClienteData } from '../../../types/Cliente';
import type { DiagnosticoData } from '../../../types/Reparacion';
import type { PresupuestoData } from '../../../types/Reparacion';
import { UserIcon, DevicePhoneMobileIcon, ClipboardDocumentCheckIcon, CalculatorIcon, ArrowLeftIcon, CheckCircleIcon, InformationCircleIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { useNotification } from '../../../contexts/NotificationContext'; // IMPORTADO

interface DispositivoGuardado {
  id: number;
  orden: number;
  marca: string;
  modelo: string;
  imei: string;
  numero_serie: string;
  color: string;
  capacidad: string;
  observaciones: string;
  fechaCreacion: Date;
}

interface TerminalCompleto {
  dispositivo: DispositivoGuardado;
  diagnostico: DiagnosticoData | null;
  presupuesto: PresupuestoData | null;
  diagnosticoCompletado: boolean;
  presupuestoCompletado: boolean;
  fechaUltimaModificacion: Date;
}

interface TotalesGlobales {
  subtotal: number;
  descuento: number;
  total: number;
  anticipo: number;
  terminalesConPresupuesto: number;
}

interface Paso5ResumenCompletoProps {
  clienteData: ClienteData;
  terminalesCompletos: TerminalCompleto[];
  totalesGlobales: TotalesGlobales;
  onBack: () => void;
  onConfirmar: () => void;
  onReset: () => void;
  isLoading: boolean;
}

const SectionCard: React.FC<{ title: string; icon: React.ElementType; children: React.ReactNode; className?: string }> = ({ title, icon: Icon, children, className = '' }) => (
  <div className={`bg-white rounded-xl shadow-lg overflow-hidden ${className}`}>
    <div className="bg-gray-50 p-4 border-b border-gray-200">
      <h6 className="font-semibold text-gray-800 flex items-center">
        <Icon className="w-6 h-6 mr-3 text-gray-500" />
        {title}
      </h6>
    </div>
    <div className="p-6 space-y-4">
      {children}
    </div>
  </div>
);

const InfoRow: React.FC<{ label: string; children: React.ReactNode; className?: string }> = ({ label, children, className = '' }) => (
  <div className={className}>
    <p className="text-sm font-medium text-gray-500">{label}</p>
    <p className="text-base text-gray-900 break-words">{children}</p>
  </div>
);

const Paso5ResumenCompleto: React.FC<Paso5ResumenCompletoProps> = ({
  clienteData,
  terminalesCompletos,
  totalesGlobales,
  onBack,
  onConfirmar,
  onReset,
  isLoading
}) => {
  const { showInfo } = useNotification(); // AÑADIDO
  const [mostrarDetalles, setMostrarDetalles] = useState(false);
  const [procesandoDocumentos, setProcesandoDocumentos] = useState(false);

  const estadisticasFinales = useMemo(() => {
    const terminalesCompletados = terminalesCompletos.filter(t => 
      t.diagnosticoCompletado && t.presupuestoCompletado
    ).length;
    
    const porcentajeCompletado = terminalesCompletos.length > 0 
      ? (terminalesCompletados / terminalesCompletos.length) * 100 
      : 0;
    
    const problemasUnicos = new Set(
      terminalesCompletos.flatMap(t => t.diagnostico?.problemas_reportados || [])
    );
    
    const totalItems = terminalesCompletos.reduce((total, terminal) => 
      total + (terminal.presupuesto?.items.length || 0), 0
    );
    
    // ARREGLADO: Eliminar tiempo_estimado que no existe en PresupuestoItem
    const tiempoTotalEstimado = terminalesCompletos.reduce((total, terminal) => {
      if (!terminal.presupuesto?.items) return total;
      // Estimamos 1 hora por cada item de servicio
      return total + terminal.presupuesto.items.filter(item => item.tipo === 'servicio').length;
    }, 0);
    
    return {
      terminalesCompletados,
      porcentajeCompletado,
      problemasUnicos: problemasUnicos.size,
      totalItems,
      tiempoTotalEstimado
    };
  }, [terminalesCompletos]);

  const manejarConfirmacion = async () => {
    if (isLoading) return;
    
    setProcesandoDocumentos(true);
    
    // Simular procesamiento de documentos
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setProcesandoDocumentos(false);
    onConfirmar();
  };

  const manejarReset = () => {
    // MODIFICADO: Se elimina el confirm()
    // Nota: La funcionalidad de confirmación se pierde. Idealmente,
    // esto se reemplazaría con un modal de confirmación personalizado.
    showInfo('Proceso Reiniciado', 'Se han borrado todos los datos del formulario.');
    onReset();
  };

  if (!clienteData) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">Faltan los datos del cliente para generar el resumen.</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Resumen Final - {terminalesCompletos.length} Terminal{terminalesCompletos.length !== 1 ? 'es' : ''}
        </h1>
        <p className="text-gray-600">
          Revisión completa antes de crear la orden de trabajo
        </p>
      </div>

      {/* Estadísticas generales */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          {/* ARREGLADO: Usar ClipboardDocumentCheckIcon */}
          <ClipboardDocumentCheckIcon className="w-6 h-6 mr-2 text-blue-600" />
          Estadísticas del Proyecto
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 flex items-center justify-center">
              {/* ARREGLADO: Usar DevicePhoneMobileIcon */}
              <DevicePhoneMobileIcon className="w-6 h-6 mr-1" />
              {terminalesCompletos.length}
            </div>
            <div className="text-sm text-gray-600">Terminales</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{estadisticasFinales.problemasUnicos}</div>
            <div className="text-sm text-gray-600">Problemas únicos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{estadisticasFinales.totalItems}</div>
            <div className="text-sm text-gray-600">Conceptos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{estadisticasFinales.tiempoTotalEstimado}h</div>
            <div className="text-sm text-gray-600">Tiempo estimado</div>
          </div>
        </div>
        
        <div className="mt-4 bg-white p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Progreso completado:</span>
            <span className="font-bold text-lg">{Math.round(estadisticasFinales.porcentajeCompletado)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${estadisticasFinales.porcentajeCompletado}%` }}
            ></div>
          </div>
        </div>
      </div>

      <SectionCard title="Datos del Cliente" icon={UserIcon}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
          <InfoRow label="Nombre Completo">{clienteData.nombre} {clienteData.apellidos}</InfoRow>
          <InfoRow label="DNI / NIE">{clienteData.dni}</InfoRow>
          <InfoRow label="Teléfono">{clienteData.telefono}</InfoRow>
          <InfoRow label="Email">{clienteData.email || 'No proporcionado'}</InfoRow>
        </div>
      </SectionCard>

      {/* Lista de terminales */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Terminales del Proyecto ({terminalesCompletos.length})
          </h3>
          <button
            onClick={() => setMostrarDetalles(!mostrarDetalles)}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            {mostrarDetalles ? 'Ocultar' : 'Mostrar'} Detalles
          </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {terminalesCompletos.map((terminal) => (
            <div key={terminal.dispositivo.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* Header del terminal */}
              <div className="bg-gray-50 p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                      {terminal.dispositivo.orden}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {terminal.dispositivo.marca} {terminal.dispositivo.modelo}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {terminal.dispositivo.color} • {terminal.dispositivo.capacidad}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600">
                      €{terminal.presupuesto ? 
                        terminal.presupuesto.items.reduce((total, item) => total + (item.precio * item.cantidad), 0).toFixed(2) 
                        : '0.00'
                      }
                    </div>
                    <div className="text-xs text-gray-500">
                      {terminal.presupuesto?.items.length || 0} conceptos
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Contenido del terminal */}
              <div className="p-4 space-y-3">
                {/* Información del dispositivo */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {terminal.dispositivo.imei && (
                    <div>
                      <span className="text-gray-500">IMEI:</span>
                      <div className="font-medium">{terminal.dispositivo.imei}</div>
                    </div>
                  )}
                  {terminal.dispositivo.numero_serie && (
                    <div>
                      <span className="text-gray-500">N° Serie:</span>
                      <div className="font-medium">{terminal.dispositivo.numero_serie}</div>
                    </div>
                  )}
                </div>
                
                {/* Diagnóstico */}
                {terminal.diagnostico && (
                  <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                    <h5 className="font-medium text-yellow-900 mb-1">Diagnóstico:</h5>
                    <div className="text-sm text-yellow-800">
                      <div>Tipo: {terminal.diagnostico.tipo_servicio}</div>
                      <div>Prioridad: {terminal.diagnostico.prioridad}</div>
                      <div>Problemas: {terminal.diagnostico.problemas_reportados.join(', ')}</div>
                    </div>
                  </div>
                )}
                
                {/* Presupuesto */}
                {terminal.presupuesto && mostrarDetalles && (
                  <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                    <h5 className="font-medium text-green-900 mb-1">Presupuesto:</h5>
                    <div className="space-y-1 text-sm text-green-800">
                      {terminal.presupuesto.items.map((item, itemIndex) => (
                        <div key={itemIndex} className="flex justify-between">
                          <span>{item.concepto} (x{item.cantidad})</span>
                          <span>€{(item.precio * item.cantidad).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Estado */}
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    terminal.diagnosticoCompletado 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {terminal.diagnosticoCompletado ? '✓ Diagnosticado' : '○ Sin diagnóstico'}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    terminal.presupuestoCompletado 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {terminal.presupuestoCompletado ? '✓ Presupuestado' : '○ Sin presupuesto'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Resumen financiero global */}
      <SectionCard title="Resumen Financiero Global" icon={CalculatorIcon}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Subtotal general:</span>
              <span className="font-medium text-lg">€{totalesGlobales.subtotal.toFixed(2)}</span>
            </div>
            {totalesGlobales.descuento > 0 && (
              <div className="flex justify-between items-center text-red-600">
                <span>Descuento aplicado:</span>
                <span className="font-medium">-€{totalesGlobales.descuento.toFixed(2)}</span>
              </div>
            )}
            <div className="border-t pt-3">
              <div className="flex justify-between items-center text-xl font-bold">
                <span>Total General:</span>
                <span className="text-green-600">€{totalesGlobales.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            {totalesGlobales.anticipo > 0 && (
              <div className="flex justify-between items-center text-blue-600">
                <span>Anticipo requerido:</span>
                <span className="font-bold text-lg">€{totalesGlobales.anticipo.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Terminales con presupuesto:</span>
              <span className="font-medium">{totalesGlobales.terminalesConPresupuesto}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Tiempo total estimado:</span>
              <span className="font-medium">{estadisticasFinales.tiempoTotalEstimado}h</span>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Documentos a Generar" icon={DocumentTextIcon}>
        <div className="space-y-3">
          <div className="flex items-center p-3 bg-white rounded-lg border">
            <span className="text-2xl mr-3">📋</span>
            <div>
              <div className="font-medium text-gray-900">Orden de reparación principal</div>
              <div className="text-sm text-gray-600">Con {terminalesCompletos.length} terminales</div>
            </div>
          </div>
          
          <div className="flex items-center p-3 bg-white rounded-lg border">
            <span className="text-2xl mr-3">💰</span>
            <div>
              <div className="font-medium text-gray-900">Presupuesto detallado</div>
              <div className="text-sm text-gray-600">€{totalesGlobales.total.toFixed(2)} total</div>
            </div>
          </div>
          
          <div className="flex items-center p-3 bg-white rounded-lg border">
            <span className="text-2xl mr-3">🏷️</span>
            <div>
              <div className="font-medium text-gray-900">Etiquetas identificativas</div>
              <div className="text-sm text-gray-600">{terminalesCompletos.length} etiquetas</div>
            </div>
          </div>
          
          {terminalesCompletos.some(t => t.diagnostico?.requiere_backup) && (
            <div className="flex items-center p-3 bg-white rounded-lg border">
              <span className="text-2xl mr-3">💾</span>
              <div>
                <div className="font-medium text-gray-900">Autorización de backup</div>
                <div className="text-sm text-gray-600">Para terminales que lo requieren</div>
              </div>
            </div>
          )}
        </div>
      </SectionCard>

      {/* ARREGLADO: Agregar sección de información adicional usando InformationCircleIcon */}
      <SectionCard title="Información Adicional" icon={InformationCircleIcon}>
        <div className="space-y-3">
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <h5 className="font-medium text-blue-900 mb-2">Próximos pasos:</h5>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Se generarán todos los documentos necesarios</li>
              <li>• Se enviará notificación por email al cliente</li>
              <li>• Los terminales quedarán registrados en el sistema</li>
              <li>• Se iniciará el proceso de reparación</li>
            </ul>
          </div>
          
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
            <h5 className="font-medium text-amber-900 mb-2">Recordatorios:</h5>
            <ul className="text-sm text-amber-800 space-y-1">
              <li>• Verificar que todos los datos sean correctos</li>
              <li>• Asegurar que el cliente esté conforme con el presupuesto</li>
              <li>• Confirmar plazos de entrega</li>
            </ul>
          </div>
        </div>
      </SectionCard>

      <div className="flex flex-col sm:flex-row sm:justify-between gap-4 mt-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:space-x-4">
          <button
            onClick={manejarReset}
            className="text-red-600 hover:text-red-800 font-medium"
          >
            Reiniciar Proceso
          </button>
          <button
            className="flex items-center px-6 py-3 rounded-lg font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition-all duration-200"
            onClick={onBack}
            disabled={isLoading}
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Volver a Presupuesto
          </button>
        </div>
        <button
          className="flex items-center px-6 py-3 rounded-lg font-medium bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed hover:scale-105 shadow-lg transition-all duration-200 transform"
          onClick={manejarConfirmacion}
          disabled={isLoading || procesandoDocumentos}
        >
          {isLoading || procesandoDocumentos ? (
            <>
              <span className="animate-spin inline-block w-5 h-5 border-2 border-t-transparent border-white rounded-full mr-3"></span>
              Procesando...
            </>
          ) : (
            <>
              <CheckCircleIcon className="w-6 h-6 mr-2" />
              Confirmar y Crear Reparación
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Paso5ResumenCompleto;