// pages/Reparaciones/components/Paso4PresupuestoNew.tsx - Con filtrado inteligente por modelo+avería
import React, { useState, useCallback, useEffect } from "react";
import {
  CurrencyEuroIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  PlusIcon,
  XMarkIcon,
  CheckCircleIcon,
  ClockIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";

import { TerminalCompleto, PresupuestoData } from "../../../types/Reparacion";
import { useNotification } from "../../../contexts/NotificationContext";
import catalogosApi from "../../../services/catalogosApi";

interface Paso4PresupuestoNewProps {
  terminalesCompletos: TerminalCompleto[];
  onGuardarPresupuesto: (terminalId: number, presupuesto: PresupuestoData | null) => void;
  onEditarPresupuesto: (terminalId: number) => void;
  onNext: () => void;
  onBack: () => void;
  totalesGlobales: {
    subtotal: number;
    descuento: number;
    total: number;
    anticipo: number;
  };
  onTotalesChange: (totales: any) => void;
}

interface Intervencion {
  id: number;
  nombre: string;
  descripcion: string;
  precio_base: number;
  tiempo_estimado_horas: number;
  categoria: string;
  dificultad: 'facil' | 'normal' | 'dificil' | 'muy_dificil';
  requiere_repuestos: boolean;
}

// PresupuestoData se importa desde types/Reparacion.ts
// Definición local de PresupuestoAveria para compatibilidad con esta implementación
interface PresupuestoAveria {
  averia: string;
  modeloId?: number; // Para filtrado inteligente
  intervenciones: {
    id: number;
    nombre: string;
    precio: number;
    tiempo_estimado: number;
    notas?: string;
  }[];
  subtotal: number;
}

// Interface local PresupuestoData compatible con la estructura del componente
interface PresupuestoDataLocal {
  presupuestoPorAveria: PresupuestoAveria[];
  subtotal: number;
  descuento: number;
  total: number;
  notas: string;
}

const Paso4PresupuestoNew: React.FC<Paso4PresupuestoNewProps> = ({
  terminalesCompletos,
  onGuardarPresupuesto,
  onEditarPresupuesto,
  onNext,
  onBack,
  totalesGlobales,
  onTotalesChange,
}) => {
  const { showWarning, showError, showSuccess, showInfo } = useNotification();

  // Estados principales
  const [terminalActivo, setTerminalActivo] = useState(0);
  const [averiaActiva, setAveriaActiva] = useState(0);
  const [intervenciones, setIntervenciones] = useState<Intervencion[]>([]);
  const [cargandoIntervenciones, setCargandoIntervenciones] = useState(false);

  // Estados del presupuesto actual
  const [presupuesto, setPresupuesto] = useState<PresupuestoDataLocal>({
    presupuestoPorAveria: [],
    subtotal: 0,
    descuento: 0,
    total: 0,
    notas: '',
  });

  const [descuentoGlobal, setDescuentoGlobal] = useState(0);
  const [anticipoGlobal, setAnticipoGlobal] = useState(0);

  const terminalActual = terminalesCompletos[terminalActivo];
  const averiaActual = terminalActual?.diagnostico?.problemas_reportados?.[averiaActiva];

  // Inicializar presupuesto al cambiar de terminal
  useEffect(() => {
    if (terminalActual) {
      if (terminalActual.presupuesto && terminalActual.presupuestoCompletado) {
        // Cargar presupuesto existente
        setPresupuesto(terminalActual.presupuesto);
      } else {
        // Inicializar presupuesto nuevo basado en averías diagnosticadas
        const presupuestoInicial: PresupuestoDataLocal = {
          presupuestoPorAveria: (terminalActual.diagnostico?.problemas_reportados || []).map(averia => ({
            averia,
            modeloId: getModeloIdFromTerminal(terminalActual), // Para filtrado inteligente
            intervenciones: [],
            subtotal: 0,
          })),
          subtotal: 0,
          descuento: 0,
          total: 0,
          notas: '',
        };
        setPresupuesto(presupuestoInicial);
      }
      setAveriaActiva(0); // Resetear a primera avería
      cargarIntervencionesFiltradas(); // Cargar intervenciones para primera avería
    }
  }, [terminalActivo, terminalActual]);

  // Cargar intervenciones cuando cambia la avería activa
  useEffect(() => {
    if (terminalActual && averiaActual) {
      cargarIntervencionesFiltradas();
    }
  }, [averiaActiva, averiaActual]);

  // Obtener modelo_id del terminal (función auxiliar)
  const getModeloIdFromTerminal = (terminal: TerminalCompleto): number => {
    // En un escenario real, esto debería venir del backend
    // Por ahora usamos el ID del dispositivo como modelo_id temporal
    return terminal.dispositivo.id || 1;
  };

  // Obtener averia_id por nombre (función auxiliar)
  const getAveriaIdByName = async (nombreAveria: string): Promise<number> => {
    try {
      // Buscar la avería por nombre en el catálogo
      const response = await catalogosApi.obtenerAverias();
      if (response.success) {
        const averia = response.data.find((a: any) => a.nombre === nombreAveria);
        return averia?.id || 1; // Fallback ID
      }
      return 1;
    } catch (error) {
      console.error('❌ Error obteniendo ID de avería:', error);
      return 1;
    }
  };

  // MÉTODO CLAVE: Cargar intervenciones filtradas por modelo + avería
  const cargarIntervencionesFiltradas = async () => {
    if (!terminalActual || !averiaActual) return;

    setCargandoIntervenciones(true);
    try {
      const modeloId = getModeloIdFromTerminal(terminalActual);
      const averiaId = await getAveriaIdByName(averiaActual);

      console.log(`🎯 Cargando intervenciones filtradas: modelo ${modeloId}, avería ${averiaId} (${averiaActual})`);

      const response = await catalogosApi.obtenerIntervencionesFiltradas(modeloId, averiaId);
      if (response.success && response.data.intervenciones) {
        setIntervenciones(response.data.intervenciones);
        console.log(`✅ Intervenciones cargadas: ${response.data.intervenciones.length} para ${terminalActual.dispositivo.modelo} - ${averiaActual}`);
        
        if (response.data.intervenciones.length > 0) {
          showInfo(
            'Intervenciones Disponibles',
            `${response.data.intervenciones.length} intervenciones disponibles para ${terminalActual.dispositivo.modelo} - ${averiaActual}`
          );
        } else {
          showWarning(
            'Sin Intervenciones',
            `No hay intervenciones específicas para ${terminalActual.dispositivo.modelo} - ${averiaActual}`
          );
        }
      }
    } catch (error) {
      console.error('❌ Error cargando intervenciones filtradas:', error);
      showError('Error', 'No se pudieron cargar las intervenciones');
      setIntervenciones([]);
    } finally {
      setCargandoIntervenciones(false);
    }
  };

  // Agregar intervención al presupuesto de la avería actual
  const agregarIntervencion = (intervencion: Intervencion) => {
    const averiaIndex = presupuesto.presupuestoPorAveria.findIndex(p => p.averia === averiaActual);
    if (averiaIndex === -1) return;

    // Verificar si ya está agregada
    const yaExiste = presupuesto.presupuestoPorAveria[averiaIndex].intervenciones.some(i => i.id === intervencion.id);
    if (yaExiste) {
      showWarning('Duplicado', 'Esta intervención ya está agregada');
      return;
    }

    const nuevaIntervencion = {
      id: intervencion.id,
      nombre: intervencion.nombre,
      precio: intervencion.precio_base,
      tiempo_estimado: intervencion.tiempo_estimado_horas,
      notas: '',
    };

    setPresupuesto(prev => {
      const nuevoPresupuesto = { ...prev };
      nuevoPresupuesto.presupuestoPorAveria[averiaIndex].intervenciones.push(nuevaIntervencion);
      
      // Recalcular subtotal de la avería
      nuevoPresupuesto.presupuestoPorAveria[averiaIndex].subtotal = 
        nuevoPresupuesto.presupuestoPorAveria[averiaIndex].intervenciones.reduce((sum, int) => sum + int.precio, 0);

      // Recalcular totales generales
      return recalcularTotales(nuevoPresupuesto);
    });

    showSuccess('Intervención agregada', `${intervencion.nombre} agregada al presupuesto`);
  };

  // Eliminar intervención del presupuesto
  const eliminarIntervencion = (averiaIndex: number, intervencionId: number) => {
    setPresupuesto(prev => {
      const nuevoPresupuesto = { ...prev };
      
      // Obtener nombre de la intervención antes de eliminarla
      const intervencionEliminada = nuevoPresupuesto.presupuestoPorAveria[averiaIndex].intervenciones
        .find(i => i.id === intervencionId);
      
      nuevoPresupuesto.presupuestoPorAveria[averiaIndex].intervenciones = 
        nuevoPresupuesto.presupuestoPorAveria[averiaIndex].intervenciones.filter(i => i.id !== intervencionId);
      
      // Recalcular subtotal de la avería
      nuevoPresupuesto.presupuestoPorAveria[averiaIndex].subtotal = 
        nuevoPresupuesto.presupuestoPorAveria[averiaIndex].intervenciones.reduce((sum, int) => sum + int.precio, 0);

      const presupuestoRecalculado = recalcularTotales(nuevoPresupuesto);
      
      // 🔧 CORRECCIÓN: Comunicar cambios al padre inmediatamente
      // Verificar si el presupuesto sigue siendo válido
      const tieneIntervencionesEnAlgunaAveria = presupuestoRecalculado.presupuestoPorAveria
        .some(averia => averia.intervenciones.length > 0);
      
      if (!tieneIntervencionesEnAlgunaAveria) {
        // El presupuesto ya no es válido, notificar al padre
        onGuardarPresupuesto(terminalActual.dispositivo.id, null); // null = presupuesto incompleto
        showWarning('Presupuesto incompleto', 'Se eliminaron todas las intervenciones. El presupuesto está incompleto.');
      } else {
        // Actualizar presupuesto con cambios
        onGuardarPresupuesto(terminalActual.dispositivo.id, presupuestoRecalculado);
      }
      
      if (intervencionEliminada) {
        showInfo('Intervención eliminada', `${intervencionEliminada.nombre} eliminada del presupuesto`);
      }
      
      return presupuestoRecalculado;
    });
  };

  // Actualizar precio de intervención
  const actualizarPrecioIntervencion = (averiaIndex: number, intervencionId: number, nuevoPrecio: number) => {
    setPresupuesto(prev => {
      const nuevoPresupuesto = { ...prev };
      const intervencion = nuevoPresupuesto.presupuestoPorAveria[averiaIndex].intervenciones.find(i => i.id === intervencionId);
      if (intervencion) {
        intervencion.precio = nuevoPrecio;
        
        // Recalcular subtotal de la avería
        nuevoPresupuesto.presupuestoPorAveria[averiaIndex].subtotal = 
          nuevoPresupuesto.presupuestoPorAveria[averiaIndex].intervenciones.reduce((sum, int) => sum + int.precio, 0);
      }

      return recalcularTotales(nuevoPresupuesto);
    });
  };

  // Recalcular totales del presupuesto
  const recalcularTotales = (presupuestoActual: PresupuestoDataLocal): PresupuestoDataLocal => {
    const subtotal = presupuestoActual.presupuestoPorAveria.reduce((sum, averia) => sum + averia.subtotal, 0);
    const total = subtotal - descuentoGlobal;

    const nuevosGlobales = {
      subtotal,
      descuento: descuentoGlobal,
      total,
      anticipo: anticipoGlobal,
    };

    // Notificar cambios de totales al componente padre
    onTotalesChange(nuevosGlobales);

    return {
      ...presupuestoActual,
      subtotal,
      descuento: descuentoGlobal,
      total,
    };
  };

  // Actualizar descuento global
  const actualizarDescuentoGlobal = (nuevoDescuento: number) => {
    setDescuentoGlobal(nuevoDescuento);
    setPresupuesto(prev => recalcularTotales(prev));
  };

  // Actualizar anticipo global
  const actualizarAnticipoGlobal = (nuevoAnticipo: number) => {
    setAnticipoGlobal(nuevoAnticipo);
    const nuevosGlobales = {
      subtotal: presupuesto.subtotal,
      descuento: descuentoGlobal,
      total: presupuesto.total,
      anticipo: nuevoAnticipo,
    };
    onTotalesChange(nuevosGlobales);
  };

  // Validar presupuesto
  const validarPresupuesto = () => {
    const averiasSinIntervenciones = presupuesto.presupuestoPorAveria.filter(averia => averia.intervenciones.length === 0);
    if (averiasSinIntervenciones.length > 0) {
      showWarning('Validación', `Faltan intervenciones para: ${averiasSinIntervenciones.map(a => a.averia).join(', ')}`);
      return false;
    }
    return true;
  };

  // Guardar presupuesto
  const guardarPresupuesto = () => {
    if (!validarPresupuesto()) return;

    onGuardarPresupuesto(terminalActual.dispositivo.id, presupuesto);
    showSuccess('Presupuesto guardado', `Presupuesto completado para ${terminalActual.dispositivo.marca} ${terminalActual.dispositivo.modelo}`);

    // Avanzar al siguiente terminal si existe
    if (terminalActivo < terminalesCompletos.length - 1) {
      setTerminalActivo(terminalActivo + 1);
    }
  };

  // Verificar si todos los presupuestos están completos
  const todosPresupuestosCompletos = terminalesCompletos.every(t => t.presupuestoCompletado);

  if (!terminalActual || !terminalActual.diagnostico?.problemas_reportados?.length) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <p className="text-center text-gray-500">No hay dispositivos con diagnóstico para presupuestar</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-50 to-green-50 px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <CurrencyEuroIcon className="w-6 h-6 text-emerald-600 mr-3" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Presupuesto por Dispositivo</h2>
              <p className="text-sm text-gray-600">
                Presupuesto para {terminalActual.dispositivo.marca} {terminalActual.dispositivo.modelo}
              </p>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            Dispositivo {terminalActivo + 1} de {terminalesCompletos.length}
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Selector de terminal */}
        {terminalesCompletos.length > 1 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seleccionar Dispositivo
            </label>
            <div className="flex flex-wrap gap-2">
              {terminalesCompletos.map((terminal, index) => (
                <button
                  key={terminal.dispositivo.id}
                  onClick={() => setTerminalActivo(index)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    index === terminalActivo
                      ? 'bg-emerald-600 text-white'
                      : terminal.presupuestoCompletado
                      ? 'bg-green-100 text-green-800 border border-green-200'
                      : 'bg-gray-100 text-gray-700 border border-gray-200'
                  }`}
                >
                  {terminal.presupuestoCompletado && (
                    <CheckCircleIcon className="w-4 h-4 inline mr-1" />
                  )}
                  {terminal.dispositivo.marca} {terminal.dispositivo.modelo}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Selector de avería */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Seleccionar Avería para Presupuestar
          </label>
          <div className="flex flex-wrap gap-2">
            {terminalActual.diagnostico.problemas_reportados.map((averia, index) => (
              <button
                key={index}
                onClick={() => setAveriaActiva(index)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  index === averiaActiva
                    ? 'bg-blue-600 text-white'
                    : presupuesto.presupuestoPorAveria[index]?.intervenciones.length > 0
                    ? 'bg-green-100 text-green-800 border border-green-200'
                    : 'bg-gray-100 text-gray-700 border border-gray-200'
                }`}
              >
                {presupuesto.presupuestoPorAveria[index]?.intervenciones.length > 0 && (
                  <CheckCircleIcon className="w-4 h-4 inline mr-1" />
                )}
                {averia}
              </button>
            ))}
          </div>
        </div>

        {/* Intervenciones disponibles para la avería actual */}
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <WrenchScrewdriverIcon className="w-5 h-5 text-blue-600 mr-2" />
              <h3 className="text-md font-semibold text-blue-800">
                Intervenciones para {averiaActual}
              </h3>
            </div>
            {cargandoIntervenciones && (
              <div className="text-sm text-blue-600">Cargando...</div>
            )}
          </div>
          <p className="text-sm text-blue-700 mb-3">
            Intervenciones específicas para {terminalActual.dispositivo.modelo} - {averiaActual}
          </p>
          
          {intervenciones.length > 0 ? (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {intervenciones.map((intervencion) => (
                <div key={intervencion.id} className="bg-white border border-blue-200 rounded p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{intervencion.nombre}</div>
                      <div className="text-sm text-gray-600 mt-1">{intervencion.descripcion}</div>
                      <div className="flex items-center mt-2 text-sm text-gray-500">
                        <CurrencyEuroIcon className="w-4 h-4 mr-1" />
                        <span className="mr-4">{intervencion.precio_base}€</span>
                        <ClockIcon className="w-4 h-4 mr-1" />
                        <span>{intervencion.tiempo_estimado_horas}h</span>
                        <span className={`ml-4 px-2 py-1 rounded text-xs ${
                          intervencion.dificultad === 'facil' ? 'bg-green-100 text-green-800' :
                          intervencion.dificultad === 'normal' ? 'bg-blue-100 text-blue-800' :
                          intervencion.dificultad === 'dificil' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {intervencion.dificultad}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => agregarIntervencion(intervencion)}
                      className="ml-4 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                    >
                      <PlusIcon className="w-4 h-4 inline mr-1" />
                      Agregar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-blue-600">
              {cargandoIntervenciones ? 'Cargando intervenciones...' : 'No hay intervenciones disponibles para esta combinación'}
            </div>
          )}
        </div>

        {/* Presupuesto actual por averías */}
        <div className="mb-6">
          <h3 className="text-md font-semibold text-gray-900 mb-4">Presupuesto Actual</h3>
          <div className="space-y-4">
            {presupuesto.presupuestoPorAveria.map((averiaPresupuesto, averiaIndex) => (
              <div key={averiaIndex} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">{averiaPresupuesto.averia}</h4>
                  <div className="text-sm font-semibold text-gray-700">
                    Subtotal: {averiaPresupuesto.subtotal.toFixed(2)}€
                  </div>
                </div>
                
                {averiaPresupuesto.intervenciones.length > 0 ? (
                  <div className="space-y-2">
                    {averiaPresupuesto.intervenciones.map((intervencion) => (
                      <div key={intervencion.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <div className="flex-1">
                          <div className="font-medium">{intervencion.nombre}</div>
                          <div className="text-sm text-gray-500">{intervencion.tiempo_estimado}h estimadas</div>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="number"
                            step="0.01"
                            value={intervencion.precio}
                            onChange={(e) => actualizarPrecioIntervencion(averiaIndex, intervencion.id, parseFloat(e.target.value) || 0)}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm mr-2"
                          />
                          <span className="text-sm text-gray-500 mr-2">€</span>
                          <button
                            onClick={() => eliminarIntervencion(averiaIndex, intervencion.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-2 text-gray-500 text-sm">
                    Sin intervenciones agregadas
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Totales y descuentos */}
        <div className="mb-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-md font-semibold text-gray-900 mb-4">Totales</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descuento (€)
              </label>
              <input
                type="number"
                step="0.01"
                value={descuentoGlobal}
                onChange={(e) => actualizarDescuentoGlobal(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Anticipo (€)
              </label>
              <input
                type="number"
                step="0.01"
                value={anticipoGlobal}
                onChange={(e) => actualizarAnticipoGlobal(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-300">
            <div className="flex justify-between text-lg font-semibold">
              <span>Subtotal:</span>
              <span>{presupuesto.subtotal.toFixed(2)}€</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Descuento:</span>
              <span>-{descuentoGlobal.toFixed(2)}€</span>
            </div>
            <div className="flex justify-between text-xl font-bold text-emerald-600 mt-2 pt-2 border-t border-gray-300">
              <span>Total:</span>
              <span>{presupuesto.total.toFixed(2)}€</span>
            </div>
          </div>
        </div>

        {/* Notas del presupuesto */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notas del Presupuesto
          </label>
          <textarea
            value={presupuesto.notas}
            onChange={(e) => setPresupuesto(prev => ({ ...prev, notas: e.target.value }))}
            rows={2}
            placeholder="Notas adicionales sobre el presupuesto..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>

        {/* Botón guardar presupuesto */}
        <div className="mb-6">
          <button
            onClick={guardarPresupuesto}
            disabled={presupuesto.presupuestoPorAveria.every(a => a.intervenciones.length === 0)}
            className={`w-full py-2 px-4 rounded-md font-medium ${
              presupuesto.presupuestoPorAveria.some(a => a.intervenciones.length > 0)
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {terminalActual.presupuestoCompletado ? 'Actualizar Presupuesto' : 'Guardar Presupuesto'}
          </button>
        </div>

        {/* Progreso */}
        <div className="mb-6 bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
            <span>Progreso de Presupuestos</span>
            <span>
              {terminalesCompletos.filter(t => t.presupuestoCompletado).length} de {terminalesCompletos.length} completados
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${(terminalesCompletos.filter(t => t.presupuestoCompletado).length / terminalesCompletos.length) * 100}%`
              }}
            />
          </div>
        </div>

        {/* Botones de navegación */}
        <div className="flex justify-between pt-4 border-t border-gray-200">
          <button
            onClick={onBack}
            className="flex items-center px-6 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Anterior
          </button>

          <button
            onClick={onNext}
            disabled={!todosPresupuestosCompletos}
            className={`flex items-center px-6 py-2 rounded-md ${
              todosPresupuestosCompletos
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Finalizar
            <ArrowRightIcon className="w-4 h-4 ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Paso4PresupuestoNew;