// pages/Reparaciones/components/Paso3DiagnosticoPorTerminal.tsx - MODIFICADO
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { ClipboardDocumentCheckIcon, ArrowLeftIcon, ArrowRightIcon, CheckCircleIcon, PencilIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

// IMPORTAR TIPOS NECESARIOS
import type { DiagnosticoData, TerminalCompleto } from "../../../types/Reparacion";
import type { Averia } from "../../../types/Catalogo";
import type { PlantillaReparacion } from "../../../types/PlantillaReparacion";
import { useNotification } from '../../../contexts/NotificationContext'; // IMPORTADO
import { useSugerenciasInteligentes, type SugerenciaPlantilla } from '../../../hooks/useSugerenciasInteligentes';

interface Paso3DiagnosticoPorTerminalProps {
  terminalesCompletos: TerminalCompleto[];
  onGuardarDiagnostico: (terminalId: number, diagnostico: DiagnosticoData) => void;
  onEditarDiagnostico: (terminalId: number) => void;
  onNext: () => void;
  onBack: () => void;
}

const Paso3DiagnosticoPorTerminal: React.FC<Paso3DiagnosticoPorTerminalProps> = ({
  terminalesCompletos,
  onGuardarDiagnostico,
  onEditarDiagnostico,
  onNext,
  onBack
}) => {
  const { showInfo, showSuccess, showError, showWarning } = useNotification(); // AÑADIDO
  const { obtenerSugerenciasPlantillas } = useSugerenciasInteligentes();

  // ESTADOS EXISTENTES
  const [terminalSeleccionado, setTerminalSeleccionado] = useState<number | null>(null);
  const [diagnosticoActual, setDiagnosticoActual] = useState<DiagnosticoData>({
    tipo_servicio: 'reparacion',
    problemas_reportados: [],
    sintomas_adicionales: '',
    prioridad: 'normal',
    requiere_backup: false,
    patron_desbloqueo: '',
    observaciones_tecnicas: ''
  });
  const [modoEdicion, setModoEdicion] = useState<number | null>(null);

  // ESTADOS PARA AVERÍAS DINÁMICAS
  const [averias, setAverias] = useState<Averia[]>([]);
  const [averiaSeleccionada, setAveriaSeleccionada] = useState<number | null>(null);
  const [cargandoAverias, setCargandoAverias] = useState(false);
  const [mostrarModalAveria, setMostrarModalAveria] = useState(false);
  const [nuevaAveria, setNuevaAveria] = useState({ nombre: '', descripcion: '', categoria_id: null });
  const [categoriasAverias, setCategorias] = useState([]);
  const [cargandoCategorias, setCargandoCategorias] = useState(false);
  
  // ✅ NUEVO: Estado para diagnósticos en progreso
  const [diagnosticosEnProgreso, setDiagnosticosEnProgreso] = useState<Record<number, DiagnosticoData>>({});
  
  // ✅ NUEVO: Estados para plantillas dinámicas
  const [mostrarPlantillas, setMostrarPlantillas] = useState(false);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string | null>(null);
  const [plantillasDinamicas, setPlantillasDinamicas] = useState<PlantillaReparacion[]>([]);
  const [categoriasDinamicas, setCategoriasDinamicas] = useState<{id: string, nombre: string, icono: string, color: string}[]>([]);
  const [cargandoPlantillas, setCargandoPlantillas] = useState(false);
  
  // ✅ NUEVO: Estados para sugerencias de plantillas
  const [sugerenciasPlantillas, setSugerenciasPlantillas] = useState<SugerenciaPlantilla[]>([]);
  const [mostrarSugerenciasPlantillas, setMostrarSugerenciasPlantillas] = useState(false);

  const terminalActual = useMemo(() => {
    return terminalesCompletos.find(t => t.dispositivo.id === terminalSeleccionado);
  }, [terminalesCompletos, terminalSeleccionado]);

  const estadisticasProgreso = useMemo(() => {
    const total = terminalesCompletos.length;
    const completados = terminalesCompletos.filter(t => t.diagnosticoCompletado).length;
    const porcentaje = total > 0 ? (completados / total) * 100 : 0;
    return { total, completados, porcentaje };
  }, [terminalesCompletos]);

  // CARGAR AVERÍAS Y PLANTILLAS DINÁMICAS DESDE LA API
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setCargandoAverias(true);
        setCargandoPlantillas(true);
        
        // Cargar averías
        const averiasResponse = await fetch('http://localhost:5001/api/catalogos/averias');
        const averiasData = await averiasResponse.json();
        
        if (averiasData.success && averiasData.data) {
          setAverias(averiasData.data);
          console.log('✅ Averías cargadas:', averiasData.data.length);
        }
        
        // Cargar plantillas dinámicas
        const plantillasResponse = await fetch('http://localhost:5001/api/catalogos/plantillas');
        const plantillasData = await plantillasResponse.json();
        
        if (plantillasData.success) {
          setPlantillasDinamicas(plantillasData.data || []);
          setCategoriasDinamicas(plantillasData.categorias || []);
          console.log('✅ Plantillas dinámicas cargadas:', plantillasData.data?.length || 0);
          console.log('✅ Categorías dinámicas:', plantillasData.categorias?.length || 0);
          
          if (plantillasData.data?.length === 0) {
            console.log('⚠️ No hay plantillas - no hay averías en BD');
          }
        } else {
          console.error('❌ Error cargando plantillas:', plantillasData.message);
        }

        // 🔧 NUEVO: Cargar categorías para el modal de creación
        const categoriasResponse = await fetch('http://localhost:5001/api/catalogos/categorias-averias');
        const categoriasData = await categoriasResponse.json();
        
        if (categoriasData.success) {
          setCategorias(categoriasData.data || []);
          console.log('✅ Categorías de averías cargadas:', categoriasData.data?.length || 0);
        } else {
          console.error('❌ Error cargando categorías:', categoriasData.message);
        }
        
      } catch (error) {
        console.error('❌ Error cargando datos:', error);
      } finally {
        setCargandoAverias(false);
        setCargandoPlantillas(false);
      }
    };

    cargarDatos();
  }, []);

  // ✅ CORREGIDO: Auto-guardar cuando un diagnóstico cambie (incluso si queda vacío)
  useEffect(() => {
    if (terminalSeleccionado) {
      console.log('💾 Auto-guardando progreso del terminal:', terminalSeleccionado);
      
      if (diagnosticoActual.problemas_reportados.length > 0) {
        // Diagnóstico válido: guardar en progreso temporal
        setDiagnosticosEnProgreso(prev => ({
          ...prev,
          [terminalSeleccionado]: { ...diagnosticoActual }
        }));
        
        // Auto-guardar definitivamente si es válido
        const timer = setTimeout(() => {
          console.log('✅ Auto-guardando diagnóstico definitivo para terminal:', terminalSeleccionado);
          onGuardarDiagnostico(terminalSeleccionado, diagnosticoActual);
        }, 1000);
        
        return () => clearTimeout(timer);
      } else {
        // Diagnóstico vacío: marcar como incompleto inmediatamente
        console.log('❌ Diagnóstico vacío - marcando como incompleto para terminal:', terminalSeleccionado);
        
        // Remover del progreso temporal
        setDiagnosticosEnProgreso(prev => {
          const nuevos = { ...prev };
          delete nuevos[terminalSeleccionado];
          return nuevos;
        });
        
        // Marcar como incompleto en el padre
        const timer = setTimeout(() => {
          onGuardarDiagnostico(terminalSeleccionado, null);
        }, 500); // Tiempo menor para marcar incompleto más rápido
        
        return () => clearTimeout(timer);
      }
    }
  }, [diagnosticoActual, terminalSeleccionado, onGuardarDiagnostico]);

  // ✅ CORREGIDO: Función seleccionarTerminal con auto-guardado
  const seleccionarTerminal = useCallback((id: number) => {
    console.log('🔄 Seleccionando terminal:', id);
    console.log('💾 Terminal actual antes del cambio:', terminalSeleccionado);
    
    // ✅ NUEVO: Auto-guardar diagnóstico válido del terminal anterior
    if (terminalSeleccionado && terminalSeleccionado !== id && diagnosticoActual.problemas_reportados.length > 0) {
      console.log('💾 Auto-guardando diagnóstico del terminal anterior:', terminalSeleccionado);
      onGuardarDiagnostico(terminalSeleccionado, diagnosticoActual);
      
      // Limpiar del progreso temporal
      setDiagnosticosEnProgreso(prev => {
        const nuevos = { ...prev };
        delete nuevos[terminalSeleccionado];
        return nuevos;
      });
    }
    
    setTerminalSeleccionado(id);
    setModoEdicion(null);
    const terminal = terminalesCompletos.find(t => t.dispositivo.id === id);
    
    if (terminal?.diagnostico) {
      // Terminal ya tiene diagnóstico guardado (completado)
      console.log('📋 Cargando diagnóstico guardado');
      setDiagnosticoActual(terminal.diagnostico);
    } else if (diagnosticosEnProgreso[id]) {
      // Terminal tiene diagnóstico en progreso
      console.log('📝 Cargando diagnóstico en progreso');
      setDiagnosticoActual(diagnosticosEnProgreso[id]);
    } else {
      // Terminal nuevo, diagnóstico inicial
      console.log('🆕 Nuevo diagnóstico');
      setDiagnosticoActual({
        tipo_servicio: 'reparacion',
        problemas_reportados: [],
        sintomas_adicionales: '',
        prioridad: 'normal',
        requiere_backup: false,
        patron_desbloqueo: '',
        observaciones_tecnicas: ''
      });
    }
  }, [terminalesCompletos, terminalSeleccionado, diagnosticoActual, diagnosticosEnProgreso, onGuardarDiagnostico]);

  // ✅ ELIMINADA: Función guardarDiagnostico manual (ya no necesaria)
  // El guardado es automático ahora

  const activarEdicion = useCallback((terminalId: number) => {
    setModoEdicion(terminalId);
    onEditarDiagnostico(terminalId);
    seleccionarTerminal(terminalId);
  }, [onEditarDiagnostico, seleccionarTerminal]);

  const actualizarCampo = useCallback(<K extends keyof DiagnosticoData>(
    campo: K,
    valor: DiagnosticoData[K]
  ) => {
    setDiagnosticoActual(prev => ({
      ...prev,
      [campo]: valor
    }));
  }, []);

  // ✅ NUEVO: Cargar sugerencias contextuales cuando se selecciona terminal
  useEffect(() => {
    if (terminalActual) {
      const dispositivoInfo = {
        marca: terminalActual.dispositivo.marca,
        modelo: terminalActual.dispositivo.modelo
      };
      
      const sugerencias = obtenerSugerenciasPlantillas(undefined, dispositivoInfo);
      setSugerenciasPlantillas(sugerencias);
      setMostrarSugerenciasPlantillas(sugerencias.length > 0);
      
      console.log(`🤖 Cargadas ${sugerencias.length} sugerencias para ${dispositivoInfo.marca} ${dispositivoInfo.modelo}`);
    }
  }, [terminalActual, obtenerSugerenciasPlantillas]);

  // FUNCIONES PARA AVERÍAS DINÁMICAS
  const añadirAveria = useCallback(() => {
    if (!averiaSeleccionada) return;
    
    const averia = averias.find(a => a.id === averiaSeleccionada);
    if (!averia) return;
    
    // Verificar que no esté ya añadida
    if (diagnosticoActual.problemas_reportados.includes(averia.nombre)) {
      showInfo('Avería Duplicada', 'Esta avería ya está añadida a la lista.'); // MODIFICADO
      return;
    }
    
    actualizarCampo('problemas_reportados', [
      ...diagnosticoActual.problemas_reportados, 
      averia.nombre
    ]);
    
    setAveriaSeleccionada(null); // Limpiar selección
  }, [averiaSeleccionada, averias, diagnosticoActual.problemas_reportados, actualizarCampo, showInfo]);

  const eliminarAveria = useCallback((averiaAEliminar: string) => {
    const nuevasAverias = diagnosticoActual.problemas_reportados.filter(p => p !== averiaAEliminar);
    
    console.log(`🗑️ Eliminando avería: ${averiaAEliminar}`);
    console.log(`📊 Averías restantes: ${nuevasAverias.length}`);
    
    actualizarCampo('problemas_reportados', nuevasAverias);
    
    // Mostrar notificación
    if (nuevasAverias.length === 0) {
      showInfo('Diagnóstico incompleto', 'Se eliminó la última avería. Añade al menos una para continuar.');
    } else {
      showInfo('Avería eliminada', `${averiaAEliminar} eliminada del diagnóstico`);
    }
  }, [diagnosticoActual.problemas_reportados, actualizarCampo, showInfo]);

  const crearNuevaAveria = useCallback(async () => {
    if (!nuevaAveria.nombre.trim()) return;

    try {
      const response = await fetch('http://localhost:5001/api/catalogos/averias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nuevaAveria.nombre.trim(),
          descripcion: nuevaAveria.descripcion.trim(),
          categoria_id: nuevaAveria.categoria_id
        })
      });

      const data = await response.json();
      if (data.success) {
        // Recargar averías
        const reloadResponse = await fetch('http://localhost:5001/api/catalogos/averias');
        const reloadData = await reloadResponse.json();
        if (reloadData.success) {
          setAverias(reloadData.data);
        }
        
        setMostrarModalAveria(false);
        setNuevaAveria({ nombre: '', descripcion: '', categoria_id: null });
        showSuccess('Avería Creada', 'La nueva avería se ha guardado exitosamente.'); // MODIFICADO
      } else {
        throw new Error(data.message || "Error desconocido"); // MODIFICADO
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error al conectar con el servidor";
      console.error('Error creando avería:', error);
      showError('Error al Crear', errorMessage); // MODIFICADO
    }
  }, [nuevaAveria, showSuccess, showError]);

  // ✅ NUEVA FUNCIÓN: Aplicar plantilla predefinida
  const aplicarPlantilla = useCallback((plantilla: PlantillaReparacion) => {
    if (!terminalSeleccionado) {
      showWarning('Sin Terminal', 'Selecciona un terminal antes de aplicar una plantilla.');
      return;
    }

    console.log('📋 Aplicando plantilla:', plantilla.nombre);
    
    // Crear nuevo diagnóstico basado en la plantilla
    const nuevoDiagnostico: DiagnosticoData = {
      tipo_servicio: plantilla.tipo_servicio,
      problemas_reportados: [...plantilla.problemas_reportados],
      sintomas_adicionales: plantilla.sintomas_adicionales,
      prioridad: plantilla.prioridad,
      requiere_backup: plantilla.requiere_backup,
      patron_desbloqueo: '',
      observaciones_tecnicas: plantilla.observaciones_tecnicas
    };

    // Aplicar diagnóstico y cerrar modal
    setDiagnosticoActual(nuevoDiagnostico);
    setMostrarPlantillas(false);
    setCategoriaSeleccionada(null);
    
    // Mostrar confirmación
    showSuccess(
      'Plantilla Aplicada', 
      `Se ha aplicado la plantilla "${plantilla.nombre}". Puedes modificar los datos si es necesario.`
    );
  }, [terminalSeleccionado, showWarning, showSuccess]);

  // ✅ FUNCIÓN ACTUALIZADA: Obtener plantillas de una categoría (dinámicas)
  const obtenerPlantillasCategoria = useCallback((categoriaId: string): PlantillaReparacion[] => {
    return plantillasDinamicas
      .filter(p => p.categoria === categoriaId)
      .sort((a, b) => b.frecuencia_uso - a.frecuencia_uso); // Ordenar por popularidad
  }, [plantillasDinamicas]);

  const puedeAvanzar = terminalesCompletos.length > 0 && terminalesCompletos.every(t => t.diagnosticoCompletado);
  
  // 🐛 DEBUG: Log para verificar estado del botón
  useEffect(() => {
    console.log('🔍 Estado del botón "Continuar a Presupuesto":');
    console.log(`  - Terminales totales: ${terminalesCompletos.length}`);
    console.log(`  - Terminales completados: ${terminalesCompletos.filter(t => t.diagnosticoCompletado).length}`);
    console.log(`  - Puede avanzar: ${puedeAvanzar}`);
    terminalesCompletos.forEach((t, i) => {
      console.log(`  - Terminal ${i+1}: ${t.diagnostico?.problemas_reportados?.length || 0} averías, completado: ${t.diagnosticoCompletado}`);
    });
  }, [terminalesCompletos, puedeAvanzar]);

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white p-6">
        <h5 className="text-xl font-semibold flex items-center">
          <ClipboardDocumentCheckIcon className="w-6 h-6 mr-3" />
          Diagnóstico Inicial
        </h5>
      </div>
      
      <div className="p-6">
        {/* Selector de terminales con indicadores de progreso mejorados */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-3">
            Selecciona Terminal para Diagnosticar ({estadisticasProgreso.completados}/{estadisticasProgreso.total} completados)
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {terminalesCompletos.map((terminal) => (
              <button
                key={terminal.dispositivo.id}
                onClick={() => seleccionarTerminal(terminal.dispositivo.id)}
                className={`
                  p-3 rounded-lg border-2 transition-all duration-200 text-left relative
                  ${terminalSeleccionado === terminal.dispositivo.id
                    ? 'border-blue-500 bg-blue-100 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">
                      {terminal.dispositivo.marca} {terminal.dispositivo.modelo}
                    </div>
                    <div className="text-sm text-gray-500">
                      {terminal.dispositivo.imei || terminal.dispositivo.numero_serie}
                    </div>
                    {/* ✅ NUEVO: Mostrar progreso de averías */}
                    {diagnosticosEnProgreso[terminal.dispositivo.id]?.problemas_reportados.length > 0 && !terminal.diagnosticoCompletado && (
                      <div className="text-xs text-amber-600 mt-1">
                        📝 {diagnosticosEnProgreso[terminal.dispositivo.id].problemas_reportados.length} avería(s) en progreso
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-1">
                    {/* ✅ MEJORADO: Estado visual con progreso */}
                    <div className={`w-2 h-2 rounded-full ${
                      terminal.diagnosticoCompletado 
                        ? 'bg-green-500' 
                        : diagnosticosEnProgreso[terminal.dispositivo.id]?.problemas_reportados.length > 0
                          ? 'bg-amber-500'
                          : 'bg-gray-300'
                    }`}></div>
                    {terminal.diagnosticoCompletado && (
                      <CheckCircleIcon className="w-4 h-4 text-green-500" />
                    )}
                    {diagnosticosEnProgreso[terminal.dispositivo.id]?.problemas_reportados.length > 0 && !terminal.diagnosticoCompletado && (
                      <span className="text-amber-500 text-xs">●</span>
                    )}
                  </div>
                </div>
                
                {terminal.diagnosticoCompletado && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      activarEdicion(terminal.dispositivo.id);
                    }}
                    className="absolute top-2 right-2 p-1 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-full transition-all duration-200"
                    title="Editar diagnóstico"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                )}
                
                {modoEdicion === terminal.dispositivo.id && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full animate-pulse"></div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Información del terminal seleccionado */}
        {terminalSeleccionado && terminalActual && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-900">
                Terminal Seleccionado: {terminalActual.dispositivo.marca} {terminalActual.dispositivo.modelo}
              </h4>
              {modoEdicion === terminalSeleccionado && (
                <div className="flex items-center text-amber-600">
                  <PencilIcon className="w-4 h-4 mr-1" />
                  <span className="text-sm font-medium">Modo Edición</span>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">IMEI:</span>
                <div className="font-medium">{terminalActual.dispositivo.imei || 'N/A'}</div>
              </div>
              <div>
                <span className="text-gray-500">N° Serie:</span>
                <div className="font-medium">{terminalActual.dispositivo.numero_serie || 'N/A'}</div>
              </div>
              <div>
                <span className="text-gray-500">Color:</span>
                <div className="font-medium">{terminalActual.dispositivo.color || 'N/A'}</div>
              </div>
              <div>
                <span className="text-gray-500">Capacidad:</span>
                <div className="font-medium">{terminalActual.dispositivo.capacidad || 'N/A'}</div>
              </div>
            </div>
          </div>
        )}

        {terminalSeleccionado && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tipo de Servicio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Servicio <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  value={diagnosticoActual.tipo_servicio}
                  onChange={(e) => actualizarCampo('tipo_servicio', e.target.value as 'reparacion' | 'diagnostico' | 'mantenimiento')}
                >
                  <option value="reparacion">Reparación</option>
                  <option value="diagnostico">Solo Diagnóstico</option>
                  <option value="mantenimiento">Mantenimiento Preventivo</option>
                </select>
              </div>

              {/* Prioridad */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prioridad <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  value={diagnosticoActual.prioridad}
                  onChange={(e) => actualizarCampo('prioridad', e.target.value as 'normal' | 'urgente' | 'express')}
                >
                  <option value="normal">Normal (3-5 días)</option>
                  <option value="urgente">Urgente (24-48 horas)</option>
                  <option value="express">Express (mismo día) +30%</option>
                </select>
              </div>
            </div>

            {/* ✅ NUEVA SECCIÓN: Sugerencias Contextuales */}
            {mostrarSugerenciasPlantillas && sugerenciasPlantillas.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                    <span className="text-xl mr-2">🤖</span>
                    Sugerencias para {terminalActual?.dispositivo.marca} {terminalActual?.dispositivo.modelo}
                  </h4>
                  <button
                    onClick={() => setMostrarSugerenciasPlantillas(false)}
                    className="text-sm text-indigo-600 hover:text-indigo-800"
                  >
                    Ocultar sugerencias
                  </button>
                </div>
                
                <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-4 border border-indigo-200 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {sugerenciasPlantillas.slice(0, 4).map((sugerencia, index) => (
                      <button
                        key={index}
                        onClick={() => aplicarPlantilla(sugerencia.plantilla)}
                        className="p-4 bg-white border border-indigo-200 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition-all text-left group"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3 flex-1">
                            <span className="text-2xl">{sugerencia.plantilla.icono}</span>
                            <div className="flex-1">
                              <div className="font-medium text-gray-900 group-hover:text-indigo-900">
                                {sugerencia.plantilla.nombre}
                              </div>
                              <div className="text-sm text-gray-600 group-hover:text-indigo-700">
                                {sugerencia.razon}
                              </div>
                              <div className="flex items-center space-x-2 mt-2">
                                <span className={`
                                  px-2 py-1 text-xs rounded-full font-medium
                                  ${sugerencia.tipo === 'plantilla_marca' ? 'bg-blue-100 text-blue-800' :
                                    sugerencia.tipo === 'plantilla_cliente' ? 'bg-green-100 text-green-800' :
                                    'bg-gray-100 text-gray-800'
                                  }
                                `}>
                                  {sugerencia.tipo === 'plantilla_marca' ? '📱 Por marca' :
                                   sugerencia.tipo === 'plantilla_cliente' ? '👤 Historial' :
                                   '🔥 Popular'
                                  }
                                </span>
                                <span className="text-xs text-indigo-600 font-medium">
                                  {sugerencia.confianza}% precisión
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-indigo-600">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ✅ NUEVA SECCIÓN: Plantillas Predefinidas */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-900">
                  🚀 Diagnóstico Rápido
                </h4>
                <button
                  onClick={() => setMostrarPlantillas(true)}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg flex items-center space-x-2"
                >
                  <span className="text-lg">📋</span>
                  <span>Usar Plantilla</span>
                </button>
              </div>
              
              {/* Plantillas populares dinámicas (mostrar las 3 más usadas) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                {cargandoPlantillas ? (
                  <div className="col-span-3 text-center py-8 text-gray-500">
                    <div className="text-2xl mb-2">⏳</div>
                    <div>Cargando plantillas...</div>
                  </div>
                ) : plantillasDinamicas.length === 0 ? (
                  <div className="col-span-3 text-center py-8 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed">
                    <div className="text-2xl mb-2">📋</div>
                    <div className="font-medium">No hay plantillas disponibles</div>
                    <div className="text-sm">Agrega averías al catálogo para generar plantillas</div>
                  </div>
                ) : (
                  plantillasDinamicas
                    .sort((a, b) => b.frecuencia_uso - a.frecuencia_uso)
                    .slice(0, 3)
                    .map((plantilla) => (
                    <button
                      key={plantilla.id}
                      onClick={() => aplicarPlantilla(plantilla)}
                      className="p-4 border-2 border-gray-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-all text-left group"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{plantilla.icono}</span>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 group-hover:text-purple-900">
                            {plantilla.nombre}
                          </div>
                          <div className="text-sm text-gray-600 group-hover:text-purple-700">
                            {plantilla.descripcion}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Selector de Averías DINÁMICO */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Averías Detectadas <span className="text-red-500">*</span>
              </label>
              
              {/* Selector y botón añadir */}
              <div className="flex flex-col md:flex-row md:flex-wrap gap-2 overflow-hidden mb-4">
                <select
                  value={averiaSeleccionada || ''}
                  onChange={(e) => setAveriaSeleccionada(parseInt(e.target.value) || null)}
                  className="min-w-0 flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  disabled={cargandoAverias}
                >
                  <option value="">
                    {cargandoAverias ? 'Cargando averías...' : 'Selecciona una avería'}
                  </option>
                  {averias.map(averia => (
                    <option key={averia.id} value={averia.id}>
                      {averia.nombre} {averia.descripcion ? ` - ${averia.descripcion}` : ''}
                    </option>
                  ))}
                </select>
                
                {/* Botones de averías - Responsivos */}
                <div className="flex gap-1 justify-center md:justify-start">
                  <button
                    onClick={añadirAveria}
                    disabled={!averiaSeleccionada}
                    className="w-10 h-10 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
                    title="Añadir avería"
                  >
                    <PlusIcon className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => setMostrarModalAveria(true)}
                    className="w-10 h-10 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all flex items-center justify-center"
                    title="Crear nueva avería"
                  >
                    <PlusIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {/* Lista de averías añadidas */}
              <div className="space-y-2">
                {diagnosticoActual.problemas_reportados.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <div className="text-4xl mb-2">🔧</div>
                    <div className="font-medium">No hay averías añadidas</div>
                    <div className="text-sm">Selecciona una avería y haz clic en +</div>
                  </div>
                ) : (
                  diagnosticoActual.problemas_reportados.map((averia, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-all">
                      <div className="flex items-center">
                        <span className="text-amber-600 mr-3 text-xl">🔧</span>
                        <div>
                          <span className="font-medium text-amber-900">{averia}</span>
                          <div className="text-sm text-amber-700">Avería detectada</div>
                        </div>
                      </div>
                      <button
                        onClick={() => eliminarAveria(averia)}
                        className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-full transition-all"
                        title="Eliminar avería"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Síntomas adicionales */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Síntomas adicionales
              </label>
              <div className="relative">
                <textarea
                  className={`
                    pr-12 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all
                    ${diagnosticoActual.sintomas_adicionales.trim().length > 0 ? 'border-green-500 bg-green-50' : 'border-gray-300'}
                  `}
                  rows={3}
                  placeholder="Describe con detalle los problemas..."
                  value={diagnosticoActual.sintomas_adicionales}
                  onChange={(e) => actualizarCampo('sintomas_adicionales', e.target.value)}
                />
                {/* Indicador visual */}
                {diagnosticoActual.sintomas_adicionales.trim().length > 0 && (
                  <div className="absolute top-2 right-2">
                    <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {/* Requiere backup */}
              <div className="flex items-center">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-5 h-5 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                    checked={diagnosticoActual.requiere_backup}
                    onChange={(e) => actualizarCampo('requiere_backup', e.target.checked)}
                  />
                  <span className="ml-3 text-sm font-medium text-gray-700">
                    Requiere backup de datos
                  </span>
                </label>
              </div>

              {/* Patrón/PIN */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Patrón/PIN de desbloqueo
                </label>
                <div className="relative">
                  <input
                    type="text"
                    className={`
                      pr-12 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all
                      ${diagnosticoActual.patron_desbloqueo.trim().length > 0 ? 'border-green-500 bg-green-50' : 'border-gray-300'}
                    `}
                    placeholder="Solo si es necesario para la reparación"
                    value={diagnosticoActual.patron_desbloqueo}
                    onChange={(e) => actualizarCampo('patron_desbloqueo', e.target.value)}
                  />
                  {/* Indicador visual */}
                  {diagnosticoActual.patron_desbloqueo.trim().length > 0 && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Observaciones técnicas */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observaciones técnicas
              </label>
              <div className="relative">
                <textarea
                  className={`
                    pr-12 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all
                    ${diagnosticoActual.observaciones_tecnicas.trim().length > 0 ? 'border-green-500 bg-green-50' : 'border-gray-300'}
                  `}
                  rows={2}
                  placeholder="Notas para el técnico..."
                  value={diagnosticoActual.observaciones_tecnicas}
                  onChange={(e) => actualizarCampo('observaciones_tecnicas', e.target.value)}
                />
                {/* Indicador visual */}
                {diagnosticoActual.observaciones_tecnicas.trim().length > 0 && (
                  <div className="absolute top-2 right-2">
                    <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Validación visual solo para información */}
        {!terminalSeleccionado && (
          <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800 flex items-center">
              <span className="text-yellow-500 mr-2">⚠️</span>
              Selecciona un terminal para diagnosticar
            </p>
          </div>
        )}

        {terminalSeleccionado && diagnosticoActual.problemas_reportados.length === 0 && (
          <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 flex items-center">
              <span className="text-blue-500 mr-2">💡</span>
              Selecciona al menos una avería para este terminal
            </p>
          </div>
        )}

        {terminalSeleccionado && diagnosticoActual.problemas_reportados.length > 0 && (
          <div className="mt-6 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800 flex items-center">
              <span className="text-green-500 mr-2">✅</span>
              Diagnóstico guardado automáticamente. Puedes pasar al siguiente terminal o continuar al presupuesto.
            </p>
          </div>
        )}

        {/* Indicador de progreso */}
        <div className="mt-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
          <div className="flex items-center justify-between">
            <span className="text-indigo-800 font-medium">
              Progreso: {estadisticasProgreso.completados} de {estadisticasProgreso.total} terminales
            </span>
            <div className="flex items-center space-x-2">
              <div className="w-32 h-2 bg-indigo-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-600 transition-all duration-500"
                  style={{ width: `${estadisticasProgreso.porcentaje}%` }}
                ></div>
              </div>
              <span className="text-indigo-600 font-bold">
                {Math.round(estadisticasProgreso.porcentaje)}%
              </span>
            </div>
          </div>
        </div>

        {/* Botones de navegación - Responsive */}
        <div className="flex flex-col sm:flex-row sm:justify-between gap-4 mt-6">
          <button
            className="flex items-center px-6 py-3 rounded-lg font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition-all duration-200"
            onClick={onBack}
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Volver a Dispositivos
          </button>
          
          <button
            className={`
              flex items-center px-6 py-3 rounded-lg font-medium
              transition-all duration-200 transform
              ${puedeAvanzar 
                ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white hover:from-amber-700 hover:to-amber-800 hover:scale-105 shadow-lg' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }
            `}
            onClick={onNext}
            disabled={!puedeAvanzar}
          >
            <span>Continuar a Presupuesto</span>
            <ArrowRightIcon className="w-5 h-5 ml-2" />
          </button>
        </div>
      </div>

      {/* Modal Crear Avería */}
      {mostrarModalAveria && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Crear Nueva Avería</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la avería <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={nuevaAveria.nombre}
                  onChange={(e) => setNuevaAveria(prev => ({ ...prev, nombre: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  placeholder="Ej: Pantalla rota, No enciende..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoría <span className="text-red-500">*</span>
                </label>
                <select
                  value={nuevaAveria.categoria_id || ''}
                  onChange={(e) => setNuevaAveria(prev => ({ ...prev, categoria_id: e.target.value ? parseInt(e.target.value) : null }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">Selecciona una categoría</option>
                  {categoriasAverias.map((categoria: any) => (
                    <option key={categoria.id} value={categoria.id}>
                      {categoria.icono} {categoria.nombre.charAt(0).toUpperCase() + categoria.nombre.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción (opcional)
                </label>
                <textarea
                  value={nuevaAveria.descripcion}
                  onChange={(e) => setNuevaAveria(prev => ({ ...prev, descripcion: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  rows={3}
                  placeholder="Descripción detallada de la avería..."
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setMostrarModalAveria(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                onClick={crearNuevaAveria}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                disabled={!nuevaAveria.nombre.trim() || !nuevaAveria.categoria_id}
              >
                Crear Avería
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ NUEVO: Modal de Plantillas */}
      {mostrarPlantillas && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold flex items-center">
                  <span className="text-2xl mr-3">📋</span>
                  Plantillas de Diagnóstico
                </h3>
                <button
                  onClick={() => {
                    setMostrarPlantillas(false);
                    setCategoriaSeleccionada(null);
                  }}
                  className="text-white hover:text-gray-300 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {!categoriaSeleccionada ? (
                // Mostrar categorías
                <div>
                  <p className="text-gray-600 mb-6">
                    Selecciona una categoría para ver las plantillas disponibles:
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {cargandoPlantillas ? (
                      <div className="col-span-4 text-center py-8 text-gray-500">
                        <div className="text-2xl mb-2">⏳</div>
                        <div>Cargando categorías...</div>
                      </div>
                    ) : categoriasDinamicas.length === 0 ? (
                      <div className="col-span-4 text-center py-8 text-gray-500">
                        <div className="text-2xl mb-2">📂</div>
                        <div>No hay categorías disponibles</div>
                      </div>
                    ) : (
                      categoriasDinamicas.map((categoria) => (
                      <button
                        key={categoria.id}
                        onClick={() => setCategoriaSeleccionada(categoria.id)}
                        className={`
                          p-6 rounded-xl border-2 transition-all text-center hover:scale-105 hover:shadow-lg
                          ${categoria.color === 'red' ? 'border-red-200 hover:border-red-400 hover:bg-red-50' :
                            categoria.color === 'orange' ? 'border-orange-200 hover:border-orange-400 hover:bg-orange-50' :
                            categoria.color === 'blue' ? 'border-blue-200 hover:border-blue-400 hover:bg-blue-50' :
                            categoria.color === 'yellow' ? 'border-yellow-200 hover:border-yellow-400 hover:bg-yellow-50' :
                            categoria.color === 'purple' ? 'border-purple-200 hover:border-purple-400 hover:bg-purple-50' :
                            categoria.color === 'green' ? 'border-green-200 hover:border-green-400 hover:bg-green-50' :
                            'border-gray-200 hover:border-gray-400 hover:bg-gray-50'
                          }
                        `}
                      >
                        <div className="text-4xl mb-3">{categoria.icono}</div>
                        <div className="font-semibold text-gray-900">{categoria.nombre}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          {categoria.plantillas.length} plantillas
                        </div>
                      </button>
                    ))
                    )}
                  </div>
                </div>
              ) : (
                // Mostrar plantillas de la categoría seleccionada
                <div>
                  <div className="flex items-center mb-6">
                    <button
                      onClick={() => setCategoriaSeleccionada(null)}
                      className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <h4 className="text-lg font-semibold text-gray-900">
                      {categoriasDinamicas.find(c => c.id === categoriaSeleccionada)?.nombre} - Plantillas
                    </h4>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {obtenerPlantillasCategoria(categoriaSeleccionada).map((plantilla) => (
                      <div
                        key={plantilla.id}
                        className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 hover:shadow-md transition-all"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">{plantilla.icono}</span>
                            <div>
                              <h5 className="font-semibold text-gray-900">{plantilla.nombre}</h5>
                              <p className="text-sm text-gray-600">{plantilla.descripcion}</p>
                            </div>
                          </div>
                          <div className="text-right text-xs text-gray-500">
                            <div>{plantilla.tiempo_estimado}h</div>
                            {plantilla.precio_aproximado && (
                              <div>€{plantilla.precio_aproximado}</div>
                            )}
                          </div>
                        </div>
                        
                        <div className="space-y-2 mb-4">
                          <div className="flex flex-wrap gap-1">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              {plantilla.tipo_servicio}
                            </span>
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                              {plantilla.prioridad}
                            </span>
                            {plantilla.requiere_backup && (
                              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                                Backup requerido
                              </span>
                            )}
                          </div>
                          
                          <div className="text-sm text-gray-700">
                            <strong>Problemas:</strong> {plantilla.problemas_reportados.join(', ')}
                          </div>
                        </div>
                        
                        <button
                          onClick={() => aplicarPlantilla(plantilla)}
                          className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                          Aplicar Plantilla
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Paso3DiagnosticoPorTerminal;