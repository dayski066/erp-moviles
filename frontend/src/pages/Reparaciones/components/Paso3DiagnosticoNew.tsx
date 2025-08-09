// pages/Reparaciones/components/Paso3DiagnosticoNew.tsx - Con sugerencias inteligentes por modelo
import React, { useState, useCallback, useEffect } from "react";
import {
  WrenchScrewdriverIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  PlusIcon,
  XMarkIcon,
  LightBulbIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

import { TerminalCompleto, DiagnosticoData } from "../../../types/Reparacion";
import { useNotification } from "../../../contexts/NotificationContext";
import catalogosApi from "../../../services/catalogosApi";

interface Paso3DiagnosticoNewProps {
  terminalesCompletos: TerminalCompleto[];
  onGuardarDiagnostico: (terminalId: number, diagnostico: DiagnosticoData | null) => void;
  onEditarDiagnostico: (terminalId: number) => void;
  onNext: () => void;
  onBack: () => void;
}

interface Averia {
  id: number;
  nombre: string;
  descripcion: string;
  categoria: string;
  tiempo_estimado_horas: number;
  frecuencia?: number; // Para sugerencias
}

// DiagnosticoData se importa desde types/Reparacion.ts

const Paso3DiagnosticoNew: React.FC<Paso3DiagnosticoNewProps> = ({
  terminalesCompletos,
  onGuardarDiagnostico,
  onEditarDiagnostico,
  onNext,
  onBack,
}) => {
  const { showWarning, showError, showSuccess, showInfo } = useNotification();

  // Estados principales
  const [terminalActivo, setTerminalActivo] = useState(0);
  const [averias, setAverias] = useState<Averia[]>([]);
  const [sugerencias, setSugerencias] = useState<Averia[]>([]);
  const [cargandoAverias, setCargandoAverias] = useState(false);
  const [cargandoSugerencias, setCargandoSugerencias] = useState(false);

  // Estados del diagnóstico actual
  const [diagnostico, setDiagnostico] = useState<DiagnosticoData>({
    problemas_reportados: [],
    sintomas_adicionales: '',
    prioridad: 'normal',
    tipo_servicio: 'reparacion',
    patron_desbloqueo: '',
    requiere_backup: false,
    observaciones_tecnicas: '',
  });

  const terminalActual = terminalesCompletos[terminalActivo];

  // Cargar averías y sugerencias al cambiar de terminal
  useEffect(() => {
    if (terminalActual) {
      cargarAverias();
      cargarSugerenciasPorModelo();
      
      // Cargar diagnóstico existente si existe
      if (terminalActual.diagnostico && terminalActual.diagnosticoCompletado) {
        setDiagnostico(terminalActual.diagnostico);
      } else {
        // Limpiar formulario para nuevo diagnóstico
        setDiagnostico({
          problemas_reportados: [],
          sintomas_adicionales: '',
          prioridad: 'normal',
          tipo_servicio: 'reparacion',
          patron_desbloqueo: '',
          requiere_backup: false,
          observaciones_tecnicas: '',
        });
      }
    }
  }, [terminalActivo, terminalActual]);

  // Cargar todas las averías disponibles
  const cargarAverias = async () => {
    setCargandoAverias(true);
    try {
      const response = await catalogosApi.obtenerAverias();
      if (response.success) {
        setAverias(response.data);
        console.log('✅ Averías cargadas:', response.data.length);
      }
    } catch (error) {
      console.error('❌ Error cargando averías:', error);
      showError('Error', 'No se pudieron cargar las averías');
    } finally {
      setCargandoAverias(false);
    }
  };

  // Cargar sugerencias específicas por modelo (FUNCIONALIDAD CLAVE)
  const cargarSugerenciasPorModelo = async () => {
    if (!terminalActual?.dispositivo) {
      console.log('ℹ️ No hay terminal seleccionado');
      setSugerencias([]);
      return;
    }

    setCargandoSugerencias(true);
    try {
      const { marca, modelo } = terminalActual.dispositivo;
      console.log(`💡 Buscando modelo_id para: ${marca} ${modelo}`);
      
      // 1. Primero obtener el modelo_id real desde la BD
      const marcasResponse = await catalogosApi.obtenerMarcas();
      if (!marcasResponse.success) {
        throw new Error('No se pudieron cargar las marcas');
      }
      
      const marcaEncontrada = marcasResponse.data.find(
        (m: any) => m.nombre.toLowerCase() === marca.toLowerCase()
      );
      
      if (!marcaEncontrada) {
        console.log(`⚠️ Marca "${marca}" no encontrada en BD. Sin sugerencias.`);
        setSugerencias([]);
        return;
      }
      
      // 2. Obtener modelos de esa marca
      const modelosResponse = await catalogosApi.obtenerModelosPorMarca(marcaEncontrada.id);
      if (!modelosResponse.success) {
        console.log(`⚠️ No se pudieron cargar modelos para marca ${marca}`);
        setSugerencias([]);
        return;
      }
      
      const modeloEncontrado = modelosResponse.data.find(
        (m: any) => m.nombre.toLowerCase() === modelo.toLowerCase()
      );
      
      if (!modeloEncontrado) {
        console.log(`⚠️ Modelo "${modelo}" no encontrado en BD para marca ${marca}. Sin sugerencias.`);
        setSugerencias([]);
        return;
      }
      
      console.log(`✅ Modelo encontrado: ID ${modeloEncontrado.id} - ${marca} ${modelo}`);
      
      // 3. Obtener sugerencias reales para este modelo específico
      const response = await catalogosApi.obtenerSugerenciasPorModelo(modeloEncontrado.id);
      if (response.success && response.data?.sugerencias && response.data.sugerencias.length > 0) {
        setSugerencias(response.data.sugerencias);
        console.log(`💡 ${response.data.sugerencias.length} sugerencias cargadas basadas en historial real para ${marca} ${modelo}`);
        
        showInfo(
          'Sugerencias Inteligentes', 
          `Se encontraron ${response.data.sugerencias.length} averías comunes para ${marca} ${modelo} basadas en reparaciones anteriores`
        );
      } else {
        console.log(`ℹ️ No hay sugerencias para ${marca} ${modelo} (sin historial de reparaciones)`);
        setSugerencias([]);
      }
    } catch (error) {
      console.error('❌ Error cargando sugerencias:', error);
      setSugerencias([]);
    } finally {
      setCargandoSugerencias(false);
    }
  };

  // Agregar avería desde sugerencia
  const agregarAveriaSugerida = (averia: Averia) => {
    if (diagnostico.problemas_reportados.includes(averia.nombre)) {
      showWarning('Duplicado', 'Esta avería ya está agregada');
      return;
    }

    setDiagnostico(prev => ({
      ...prev,
      problemas_reportados: [...prev.problemas_reportados, averia.nombre]
    }));

    showSuccess('Avería agregada', `${averia.nombre} agregada desde sugerencias`);
  };

  // Agregar avería manualmente
  const agregarAveriaManual = (averiaId: number) => {
    const averia = averias.find(a => a.id === averiaId);
    if (!averia) return;

    if (diagnostico.problemas_reportados.includes(averia.nombre)) {
      showWarning('Duplicado', 'Esta avería ya está agregada');
      return;
    }

    setDiagnostico(prev => ({
      ...prev,
      problemas_reportados: [...prev.problemas_reportados, averia.nombre]
    }));
  };

  // Eliminar avería del diagnóstico
  const eliminarAveria = (nombreAveria: string) => {
    const nuevosDiagnostico = {
      ...diagnostico,
      problemas_reportados: diagnostico.problemas_reportados.filter(p => p !== nombreAveria)
    };
    
    setDiagnostico(nuevosDiagnostico);
    
    // 🔧 CORRECCIÓN: Comunicar cambios al padre inmediatamente
    // Si no quedan averías, marcar como incompleto
    if (nuevosDiagnostico.problemas_reportados.length === 0) {
      // El diagnóstico ya no es válido, notificar al padre
      onGuardarDiagnostico(terminalActual.dispositivo.id, null); // null = diagnóstico incompleto
      showWarning('Diagnóstico incompleto', 'Se eliminó la última avería. El diagnóstico está incompleto.');
    } else {
      // Actualizar diagnóstico con cambios
      onGuardarDiagnostico(terminalActual.dispositivo.id, nuevosDiagnostico);
    }
    
    showInfo('Avería eliminada', `${nombreAveria} eliminada del diagnóstico`);
  };

  // Manejar cambios en campos del formulario
  const handleInputChange = (field: keyof DiagnosticoData, value: any) => {
    setDiagnostico(prev => ({ ...prev, [field]: value }));
  };

  // Validar diagnóstico
  const validarDiagnostico = () => {
    if (diagnostico.problemas_reportados.length === 0) {
      showWarning('Validación', 'Debe seleccionar al menos una avería');
      return false;
    }
    return true;
  };

  // Guardar diagnóstico
  const guardarDiagnostico = () => {
    if (!validarDiagnostico()) return;

    onGuardarDiagnostico(terminalActual.dispositivo.id, diagnostico);
    showSuccess('Diagnóstico guardado', `Diagnóstico completado para ${terminalActual.dispositivo.marca} ${terminalActual.dispositivo.modelo}`);

    // Avanzar al siguiente terminal si existe
    if (terminalActivo < terminalesCompletos.length - 1) {
      setTerminalActivo(terminalActivo + 1);
    }
  };

  // Verificar si todos los diagnósticos están completos
  const todosDiagnosticosCompletos = terminalesCompletos.every(t => t.diagnosticoCompletado);

  if (!terminalActual) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <p className="text-center text-gray-500">No hay dispositivos para diagnosticar</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <WrenchScrewdriverIcon className="w-6 h-6 text-green-600 mr-3" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Diagnóstico por Dispositivo</h2>
              <p className="text-sm text-gray-600">
                Diagnóstico para {terminalActual.dispositivo.marca} {terminalActual.dispositivo.modelo}
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
                      ? 'bg-blue-600 text-white'
                      : terminal.diagnosticoCompletado
                      ? 'bg-green-100 text-green-800 border border-green-200'
                      : 'bg-gray-100 text-gray-700 border border-gray-200'
                  }`}
                >
                  {terminal.diagnosticoCompletado && (
                    <CheckCircleIcon className="w-4 h-4 inline mr-1" />
                  )}
                  {terminal.dispositivo.marca} {terminal.dispositivo.modelo}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Sugerencias Inteligentes */}
        {sugerencias.length > 0 && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <LightBulbIcon className="w-5 h-5 text-amber-600 mr-2" />
              <h3 className="text-md font-semibold text-amber-800">
                Sugerencias Inteligentes para {terminalActual.dispositivo.modelo}
              </h3>
            </div>
            <p className="text-sm text-amber-700 mb-3">
              Averías más frecuentes basadas en reparaciones anteriores de este modelo:
            </p>
            <div className="flex flex-wrap gap-2">
              {sugerencias.map((sugerencia) => (
                <button
                  key={sugerencia.id}
                  onClick={() => agregarAveriaSugerida(sugerencia)}
                  disabled={diagnostico.problemas_reportados.includes(sugerencia.nombre)}
                  className={`px-3 py-2 rounded-md text-sm transition-colors ${
                    diagnostico.problemas_reportados.includes(sugerencia.nombre)
                      ? 'bg-green-100 text-green-800 border border-green-200 cursor-not-allowed'
                      : 'bg-white text-amber-800 border border-amber-300 hover:bg-amber-100'
                  }`}
                >
                  {diagnostico.problemas_reportados.includes(sugerencia.nombre) && (
                    <CheckCircleIcon className="w-4 h-4 inline mr-1" />
                  )}
                  {sugerencia.nombre}
                  {sugerencia.frecuencia && (
                    <span className="ml-1 text-xs opacity-75">({sugerencia.frecuencia})</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Selector de averías manual */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Agregar Avería Manualmente
          </label>
          <select
            onChange={(e) => {
              if (e.target.value) {
                agregarAveriaManual(parseInt(e.target.value));
                e.target.value = '';
              }
            }}
            disabled={cargandoAverias}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">
              {cargandoAverias ? 'Cargando averías...' : 'Selecciona una avería'}
            </option>
            {averias.map(averia => (
              <option key={averia.id} value={averia.id}>
                {averia.nombre} - {averia.categoria}
              </option>
            ))}
          </select>
        </div>

        {/* Averías seleccionadas */}
        {diagnostico.problemas_reportados.length > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Averías Diagnosticadas ({diagnostico.problemas_reportados.length})
            </label>
            <div className="flex flex-wrap gap-2">
              {diagnostico.problemas_reportados.map((problema) => (
                <div
                  key={problema}
                  className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                >
                  <span>{problema}</span>
                  <button
                    onClick={() => eliminarAveria(problema)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Campos adicionales del diagnóstico */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Síntomas adicionales */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Síntomas Adicionales
            </label>
            <textarea
              value={diagnostico.sintomas_adicionales}
              onChange={(e) => handleInputChange('sintomas_adicionales', e.target.value)}
              rows={3}
              placeholder="Describe síntomas adicionales observados..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Prioridad */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prioridad
            </label>
            <select
              value={diagnostico.prioridad}
              onChange={(e) => handleInputChange('prioridad', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="baja">Baja</option>
              <option value="normal">Normal</option>
              <option value="alta">Alta</option>
              <option value="urgente">Urgente</option>
            </select>
          </div>

          {/* Tipo de servicio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Servicio
            </label>
            <select
              value={diagnostico.tipo_servicio}
              onChange={(e) => handleInputChange('tipo_servicio', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="reparacion">Reparación</option>
              <option value="revision">Revisión</option>
              <option value="mantenimiento">Mantenimiento</option>
            </select>
          </div>

          {/* Patrón de desbloqueo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Patrón de Desbloqueo
            </label>
            <input
              type="text"
              value={diagnostico.patron_desbloqueo}
              onChange={(e) => handleInputChange('patron_desbloqueo', e.target.value)}
              placeholder="PIN, patrón, etc."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Requiere backup */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="requiere_backup"
              checked={diagnostico.requiere_backup}
              onChange={(e) => handleInputChange('requiere_backup', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="requiere_backup" className="ml-2 block text-sm text-gray-700">
              Requiere backup de datos
            </label>
          </div>
        </div>

        {/* Observaciones técnicas */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Observaciones Técnicas
          </label>
          <textarea
            value={diagnostico.observaciones_tecnicas}
            onChange={(e) => handleInputChange('observaciones_tecnicas', e.target.value)}
            rows={2}
            placeholder="Notas técnicas adicionales..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Botón guardar diagnóstico */}
        <div className="mb-6">
          <button
            onClick={guardarDiagnostico}
            disabled={diagnostico.problemas_reportados.length === 0}
            className={`w-full py-2 px-4 rounded-md font-medium ${
              diagnostico.problemas_reportados.length > 0
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {terminalActual.diagnosticoCompletado ? 'Actualizar Diagnóstico' : 'Guardar Diagnóstico'}
          </button>
        </div>

        {/* Progreso */}
        <div className="mb-6 bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
            <span>Progreso de Diagnósticos</span>
            <span>
              {terminalesCompletos.filter(t => t.diagnosticoCompletado).length} de {terminalesCompletos.length} completados
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${(terminalesCompletos.filter(t => t.diagnosticoCompletado).length / terminalesCompletos.length) * 100}%`
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
            disabled={!todosDiagnosticosCompletos}
            className={`flex items-center px-6 py-2 rounded-md ${
              todosDiagnosticosCompletos
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Siguiente
            <ArrowRightIcon className="w-4 h-4 ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Paso3DiagnosticoNew;