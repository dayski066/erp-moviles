// pages/Reparaciones/components/Paso4PresupuestoPorTerminal.tsx - MODIFICADO
import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  CalculatorIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  PlusCircleIcon,
  TrashIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";

import type {
  PresupuestoData,
  TerminalCompleto,
  PresupuestoItem
} from "../../../types/Reparacion";
import { useNotification } from "../../../contexts/NotificationContext"; // IMPORTADO
import catalogosApi from "../../../services/catalogosApi";

interface Intervencion {
  id: number;
  concepto: string;
  descripcion: string;
  precio_base: number;
  tipo: 'mano_obra' | 'repuesto' | 'mixto';
  tiempo_estimado_minutos: number;
  dificultad: 'facil' | 'media' | 'dificil';
  requiere_especialista: boolean;
}

interface ConceptoDisponible {
  intervencion_id?: number;
  concepto: string;
  precio: number;
  tipo: "mano_obra" | "repuesto" | "mixto";
  tiempo: number;
  descripcion: string;
}

interface Paso4PresupuestoPorTerminalProps {
  terminalesCompletos: TerminalCompleto[];
  onGuardarPresupuesto: (
    terminalId: number,
    presupuesto: PresupuestoData
  ) => void;
  onEditarPresupuesto: (terminalId: number) => void;
  onNext: () => void;
  onBack: () => void;
}

const Paso4PresupuestoPorTerminal: React.FC<Paso4PresupuestoPorTerminalProps> = ({
  terminalesCompletos,
  onGuardarPresupuesto,
  onEditarPresupuesto,
  onNext,
  onBack
}) => {
  const { showInfo, showWarning, showError, showSuccess } = useNotification(); // AÑADIDO

  const [terminalSeleccionado, setTerminalSeleccionado] = useState<number | null>(null);
  const [presupuestoActual, setPresupuestoActual] = useState<PresupuestoData>({
    items: [],
    presupuestoPorAveria: [],
    descuento: 0,
    tipo_descuento: "porcentaje",
    notas_presupuesto: "",
    validez_dias: 15,
    requiere_anticipo: false,
    porcentaje_anticipo: 0,
  });

  const [modoEdicion, setModoEdicion] = useState<number | null>(null);
  const [averiaSeleccionadaParaAñadir, setAveriaSeleccionadaParaAñadir] = useState<string>("");
  const [conceptoSeleccionado, setConceptoSeleccionado] = useState<string>("");

  const [intervenciones, setIntervenciones] = useState<Intervencion[]>([]);
  const [cargandoIntervenciones, setCargandoIntervenciones] = useState(false);
  
  // Estados para sugerencias inteligentes
  const [sugerenciasIntervenciones, setSugerenciasIntervenciones] = useState<Array<any>>([]);
  const [cargandoSugerencias, setCargandoSugerencias] = useState(false);

  // Nuevos estados
  const [averiasBD, setAveriasBD] = useState<Array<{id: number, nombre: string}>>([]);
  const [modelosBD, setModelosBD] = useState<Array<{id: number, nombre: string, marca_id: number}>>([]);
  const [mostrarFormularioNuevaIntervencion, setMostrarFormularioNuevaIntervencion] = useState(false);
  const [creandoIntervencion, setCreandoIntervencion] = useState(false);
  const [nuevaIntervencion, setNuevaIntervencion] = useState<{
    concepto: string;
    descripcion: string;
    precio_base: number;
    tipo: "mano_obra" | "repuesto" | "mixto";
    tiempo_estimado_minutos: number;
    dificultad: "facil" | "media" | "dificil";
    requiere_especialista: boolean;
  }>({
    concepto: "",
    descripcion: "",
    precio_base: 0,
    tipo: "mano_obra",
    tiempo_estimado_minutos: 30,
    dificultad: "media",
    requiere_especialista: false,
  });

  const [presupuestosEnProgreso, setPresupuestosEnProgreso] = useState<Record<number, PresupuestoData>>({});

  // Computed values
  const terminalActual = useMemo(() => {
    return terminalesCompletos.find(t => t.dispositivo.id === terminalSeleccionado);
  }, [terminalesCompletos, terminalSeleccionado]);

  const estadisticasProgreso = useMemo(() => {
    const total = terminalesCompletos.length;
    const completados = terminalesCompletos.filter(t => t.presupuestoCompletado).length;
    const porcentaje = total > 0 ? (completados / total) * 100 : 0;
    return { total, completados, porcentaje };
  }, [terminalesCompletos]);

  const problemasDetectados = useMemo(() => {
    if (!terminalActual?.diagnostico) return [];
    return terminalActual.diagnostico.problemas_reportados;
  }, [terminalActual]);

  const todosTerminalesConPresupuesto = useMemo(() => {
  return terminalesCompletos.length > 0 && terminalesCompletos.every(terminal => {
    // ✅ Completado y con al menos un concepto
    if (terminal.presupuestoCompletado && (terminal.presupuesto?.items?.length ?? 0) > 0) {
      return true;
    }
    // ✅ En progreso y con al menos un concepto
    const presupuestoProgreso = presupuestosEnProgreso[terminal.dispositivo.id];
    if ((presupuestoProgreso?.items?.length ?? 0) > 0) {
      return true;
    }
    // ✅ Terminal actualmente seleccionado y con al menos un concepto
    if (
      terminal.dispositivo.id === terminalSeleccionado &&
      (presupuestoActual.items?.length ?? 0) > 0
    ) {
      return true;
    }
    return false;
  });
}, [terminalesCompletos, presupuestosEnProgreso, terminalSeleccionado, presupuestoActual.items]);

  // Funciones BD
  const cargarAverias = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:5001/api/catalogos/averias');
      const data = await response.json();
      if (data.success && data.data) {
        setAveriasBD(data.data);
        console.log('✅ Averías cargadas desde BD:', data.data.length);
      } else {
        console.error('❌ Error cargando averías:', data.message);
        setAveriasBD([]);
      }
    } catch (error) {
      console.error('❌ Error cargando averías:', error);
      setAveriasBD([]);
    }
  }, []);

  const cargarModelos = useCallback(async () => {
    if (!terminalActual) return;
    try {
      const marcasResponse = await fetch('http://localhost:5001/api/catalogos/marcas');
      const marcasData = await marcasResponse.json();
      if (marcasData.success && marcasData.data) {
        const marca = marcasData.data.find((m: { id: number; nombre: string }) => m.nombre === terminalActual.dispositivo.marca);
        if (marca) {
          const modelosResponse = await fetch(`http://localhost:5001/api/catalogos/modelos/marca/${marca.id}`);
          const modelosData = await modelosResponse.json();
          if (modelosData.success && modelosData.data) {
            setModelosBD(modelosData.data);
            console.log('✅ Modelos cargados desde BD:', modelosData.data.length);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error cargando modelos:', error);
      setModelosBD([]);
    }
  }, [terminalActual]);

  const obtenerAveriaId = useCallback((nombreAveria: string): number | null => {
    console.log(`🔍 DEBUG: Buscando avería "${nombreAveria}" en ${averiasBD.length} averías de BD`);
    const averia = averiasBD.find(a => a.nombre === nombreAveria);
    console.log(`🔍 DEBUG: Avería encontrada:`, averia);
    return averia?.id || null;
  }, [averiasBD]);

  const obtenerModeloId = useCallback((): number | null => {
    if (!terminalActual) return null;
    console.log(`🔍 DEBUG: Buscando modelo "${terminalActual.dispositivo.modelo}" en ${modelosBD.length} modelos de BD`);
    const modelo = modelosBD.find(m => m.nombre === terminalActual.dispositivo.modelo);
    console.log(`🔍 DEBUG: Modelo encontrado:`, modelo);
    return modelo?.id || null;
  }, [modelosBD, terminalActual]);

  const cargarIntervenciones = useCallback(async (averiaSeleccionada: string) => {
    if (!terminalActual || !averiaSeleccionada) {
      setIntervenciones([]);
      return;
    }
    try {
      setCargandoIntervenciones(true);
      const averiaId = obtenerAveriaId(averiaSeleccionada);
      const modeloId = obtenerModeloId();
      if (!averiaId || !modeloId) {
        console.log(`ℹ️ No se encontraron IDs: averiaId=${averiaId}, modeloId=${modeloId}`);
        console.log(`📋 Avería: "${averiaSeleccionada}" | Modelo: "${terminalActual.dispositivo.modelo}"`);
        setIntervenciones([]);
        return;
      }
      const response = await fetch(
        `http://localhost:5001/api/catalogos/intervenciones/filtradas?modelo_id=${modeloId}&averia_id=${averiaId}`
      );
      const data = await response.json();
      if (data.success && data.data && Array.isArray(data.data) && data.data.length > 0) {
        setIntervenciones(data.data);
        console.log(`✅ Intervenciones cargadas desde BD: ${data.data.length} para "${averiaSeleccionada}" (modelo ${modeloId}, avería ${averiaId})`);
      } else {
        setIntervenciones([]);
        console.log(`ℹ️ No hay intervenciones en BD para "${averiaSeleccionada}" en modelo "${terminalActual.dispositivo.modelo}" (modelo ${modeloId}, avería ${averiaId})`);
      }
    } catch (error) {
      console.error('❌ Error cargando intervenciones:', error);
      setIntervenciones([]);
    } finally {
      setCargandoIntervenciones(false);
    }
  }, [terminalActual, obtenerAveriaId, obtenerModeloId]);

  // NUEVA: Cargar sugerencias inteligentes basadas en historial real
  const cargarSugerenciasInteligentes = useCallback(async (averiaSeleccionada: string) => {
    if (!terminalActual || !averiaSeleccionada) {
      setSugerenciasIntervenciones([]);
      return;
    }
    
    try {
      setCargandoSugerencias(true);
      const averiaId = obtenerAveriaId(averiaSeleccionada);
      const modeloId = obtenerModeloId();
      
      if (!averiaId || !modeloId) {
        console.log(`ℹ️ No se pueden cargar sugerencias: averiaId=${averiaId}, modeloId=${modeloId}`);
        setSugerenciasIntervenciones([]);
        return;
      }

      console.log(`💡 Buscando sugerencias para modelo ${modeloId} + avería ${averiaId}`);
      
      const response = await catalogosApi.obtenerSugerenciasIntervenciones(modeloId, averiaId, 3);
      
      if (response.success && response.data?.sugerencias && response.data.sugerencias.length > 0) {
        setSugerenciasIntervenciones(response.data.sugerencias);
        console.log(`✅ ${response.data.sugerencias.length} sugerencias inteligentes cargadas para "${averiaSeleccionada}" en "${terminalActual.dispositivo.modelo}"`);
        
        showInfo(
          'Sugerencias Inteligentes',
          `Se encontraron ${response.data.sugerencias.length} intervenciones más usadas para esta avería en ${terminalActual.dispositivo.modelo}`
        );
      } else {
        setSugerenciasIntervenciones([]);
        console.log(`ℹ️ No hay sugerencias inteligentes para "${averiaSeleccionada}" en "${terminalActual.dispositivo.modelo}" (sin historial)`);
      }
    } catch (error) {
      console.error('❌ Error cargando sugerencias inteligentes:', error);
      setSugerenciasIntervenciones([]);
    } finally {
      setCargandoSugerencias(false);
    }
  }, [terminalActual, obtenerAveriaId, obtenerModeloId, showInfo]);

  const obtenerConceptosDisponibles = useCallback((): ConceptoDisponible[] => {
    if (intervenciones.length > 0) {
      return intervenciones.map(interv => ({
        intervencion_id: interv.id,
        concepto: interv.nombre, // Cambiado de concepto a nombre
        precio: parseFloat(interv.precio_base), // Asegurar que sea número
        tipo: interv.tipo,
        tiempo: interv.tiempo_estimado_minutos,
        descripcion: interv.descripcion
      }));
    }
    return [];
  }, [intervenciones]);

  // Effects
  useEffect(() => {
    cargarAverias();
  }, [cargarAverias]);

  useEffect(() => {
    if (terminalActual) {
      cargarModelos();
    }
  }, [terminalActual, cargarModelos]);

  useEffect(() => {
    if (averiaSeleccionadaParaAñadir) {
      // Cargar tanto intervenciones disponibles como sugerencias inteligentes
      cargarIntervenciones(averiaSeleccionadaParaAñadir);
      cargarSugerenciasInteligentes(averiaSeleccionadaParaAñadir);
    } else {
      // Limpiar sugerencias si no hay avería seleccionada
      setSugerenciasIntervenciones([]);
    }
  }, [averiaSeleccionadaParaAñadir, cargarIntervenciones, cargarSugerenciasInteligentes]);

  useEffect(() => {
    if (terminalSeleccionado && presupuestoActual.items.length > 0) {
      console.log('💾 Auto-guardando presupuesto del terminal:', terminalSeleccionado);
      
      // Guardar en progreso temporal
      setPresupuestosEnProgreso(prev => ({
        ...prev,
        [terminalSeleccionado]: { ...presupuestoActual }
      }));
      
      // Auto-guardar definitivamente después de 1 segundo
      const timer = setTimeout(() => {
        console.log('✅ Auto-guardando presupuesto definitivo para terminal:', terminalSeleccionado);
        onGuardarPresupuesto(terminalSeleccionado, presupuestoActual);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [presupuestoActual, terminalSeleccionado, onGuardarPresupuesto]);

  const seleccionarTerminal = useCallback((id: number) => {
    console.log('🔄 Seleccionando terminal:', id);
    
    // NUEVO: Auto-guardar presupuesto válido del terminal anterior
    if (terminalSeleccionado && terminalSeleccionado !== id && presupuestoActual.items.length > 0) {
      console.log('💾 Auto-guardando presupuesto del terminal anterior:', terminalSeleccionado);
      onGuardarPresupuesto(terminalSeleccionado, presupuestoActual);
      
      // Limpiar del progreso temporal
      setPresupuestosEnProgreso(prev => {
        const nuevos = { ...prev };
        delete nuevos[terminalSeleccionado];
        return nuevos;
      });
    }
    
    setTerminalSeleccionado(id);
    setModoEdicion(null);
    setAveriaSeleccionadaParaAñadir("");
    setConceptoSeleccionado("");
    
    const terminal = terminalesCompletos.find(t => t.dispositivo.id === id);
    
    if (terminal?.presupuesto) {
      // Terminal ya tiene presupuesto guardado (completado)
      console.log('📋 Cargando presupuesto guardado');
      setPresupuestoActual(terminal.presupuesto);
    } else if (presupuestosEnProgreso[id]) {
      // Terminal tiene presupuesto en progreso
      console.log('📝 Cargando presupuesto en progreso');
      setPresupuestoActual(presupuestosEnProgreso[id]);
    } else {
      // Terminal nuevo, presupuesto inicial
      console.log('🆕 Nuevo presupuesto');
      setPresupuestoActual({
        items: [],
        presupuestoPorAveria: [],
        descuento: 0,
        tipo_descuento: "porcentaje",
        notas_presupuesto: "",
        validez_dias: 15,
        requiere_anticipo: false,
        porcentaje_anticipo: 0,
      });
    }
  }, [terminalesCompletos, terminalSeleccionado, presupuestoActual, presupuestosEnProgreso, onGuardarPresupuesto]);

  const añadirConceptoAlPresupuesto = useCallback(() => {
    if (!averiaSeleccionadaParaAñadir || !conceptoSeleccionado) return;
    const conceptosDisponibles = obtenerConceptosDisponibles();
    const concepto = conceptosDisponibles.find(c => c.concepto === conceptoSeleccionado);
    if (!concepto) return;
    const nuevoItem: PresupuestoItem = {
      intervencion_id: concepto.intervencion_id,
      concepto: concepto.concepto,
      precio: concepto.precio,
      cantidad: 1,
      tipo: concepto.tipo,
    };
    const averiaExistente = presupuestoActual.presupuestoPorAveria.find(
      p => p.problema === averiaSeleccionadaParaAñadir
    );
    if (averiaExistente && averiaExistente.items.some(item => item.concepto === concepto.concepto)) {
      showInfo("Concepto Duplicado", "Este concepto ya está añadido para esta avería."); // MODIFICADO
      return;
    }
    const presupuestoPorAveriaActualizado = [...presupuestoActual.presupuestoPorAveria];
    const averiaIndex = presupuestoPorAveriaActualizado.findIndex(
      p => p.problema === averiaSeleccionadaParaAñadir
    );
    if (averiaIndex >= 0) {
      presupuestoPorAveriaActualizado[averiaIndex].items.push(nuevoItem);
    } else {
      presupuestoPorAveriaActualizado.push({
        problema: averiaSeleccionadaParaAñadir,
        items: [nuevoItem],
      });
    }
    const itemsActualizados = [...presupuestoActual.items, nuevoItem];
    setPresupuestoActual(prev => ({
      ...prev,
      items: itemsActualizados,
      presupuestoPorAveria: presupuestoPorAveriaActualizado,
    }));
    setConceptoSeleccionado("");
  }, [averiaSeleccionadaParaAñadir, conceptoSeleccionado, presupuestoActual, obtenerConceptosDisponibles, showInfo]);

  const crearNuevaIntervencion = useCallback(async () => {
    if (!averiaSeleccionadaParaAñadir || !terminalActual || !nuevaIntervencion.concepto || nuevaIntervencion.precio_base <= 0) {
      showWarning("Campos Incompletos", "Por favor, completa todos los campos obligatorios para crear la intervención."); // MODIFICADO
      return;
    }
    try {
      setCreandoIntervencion(true);
      const averiaId = obtenerAveriaId(averiaSeleccionadaParaAñadir);
      const modeloId = obtenerModeloId();
      if (!averiaId || !modeloId) {
        showError("Datos No Encontrados", `No se encontraron los IDs necesarios en la base de datos para la avería o el modelo.`); // MODIFICADO
        return;
      }
      const response = await fetch('http://localhost:5001/api/catalogos/intervenciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          averia_id: averiaId,
          modelo_id: modeloId,
          nombre: nuevaIntervencion.concepto,
          descripcion: nuevaIntervencion.descripcion,
          precio_base: nuevaIntervencion.precio_base,
          tipo: nuevaIntervencion.tipo,
          tiempo_estimado_minutos: nuevaIntervencion.tiempo_estimado_minutos,
          dificultad: nuevaIntervencion.dificultad,
          requiere_especialista: nuevaIntervencion.requiere_especialista
        })
      });
      const result = await response.json();
      if (result.success) {
        showSuccess('Intervención Creada', `La intervención "${nuevaIntervencion.concepto}" se ha creado exitosamente.`); // MODIFICADO
        await cargarIntervenciones(averiaSeleccionadaParaAñadir);
        setNuevaIntervencion({
          concepto: "",
          descripcion: "",
          precio_base: 0,
          tipo: "mano_obra",
          tiempo_estimado_minutos: 30,
          dificultad: "media",
          requiere_especialista: false,
        });
        setMostrarFormularioNuevaIntervencion(false);
      } else {
        throw new Error(result.message || 'Error creando intervención');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('❌ Error creando intervención:', error);
      showError('Error al Crear', `No se pudo crear la intervención: ${errorMessage}`); // MODIFICADO
    } finally {
      setCreandoIntervencion(false);
    }
  }, [averiaSeleccionadaParaAñadir, terminalActual, nuevaIntervencion, cargarIntervenciones, obtenerAveriaId, obtenerModeloId, showError, showSuccess]);

  const eliminarItem = useCallback((averiaProblema: string, itemIndex: number) => {
    const presupuestoPorAveriaActualizado = presupuestoActual.presupuestoPorAveria
      .map(averia => {
        if (averia.problema === averiaProblema) {
          return {
            ...averia,
            items: averia.items.filter((_, index) => index !== itemIndex)
          };
        }
        return averia;
      })
      .filter(averia => averia.items.length > 0);
    const itemsActualizados = presupuestoPorAveriaActualizado.flatMap(averia => averia.items);
    setPresupuestoActual(prev => ({
      ...prev,
      items: itemsActualizados,
      presupuestoPorAveria: presupuestoPorAveriaActualizado,
    }));
  }, [presupuestoActual]);

  const actualizarCantidad = useCallback((averiaProblema: string, itemIndex: number, cantidad: number) => {
    if (cantidad < 1) return;
    const presupuestoPorAveriaActualizado = presupuestoActual.presupuestoPorAveria.map(averia => {
      if (averia.problema === averiaProblema) {
        return {
          ...averia,
          items: averia.items.map((item, index) =>
            index === itemIndex ? { ...item, cantidad } : item
          )
        };
      }
      return averia;
    });
    const itemsActualizados = presupuestoPorAveriaActualizado.flatMap(averia => averia.items);
    setPresupuestoActual(prev => ({
      ...prev,
      items: itemsActualizados,
      presupuestoPorAveria: presupuestoPorAveriaActualizado,
    }));
  }, [presupuestoActual]);

  const actualizarPrecio = useCallback((averiaProblema: string, itemIndex: number, precio: number) => {
    if (precio < 0) return;
    const presupuestoPorAveriaActualizado = presupuestoActual.presupuestoPorAveria.map(averia => {
      if (averia.problema === averiaProblema) {
        return {
          ...averia,
          items: averia.items.map((item, index) =>
            index === itemIndex ? { ...item, precio } : item
          )
        };
      }
      return averia;
    });
    const itemsActualizados = presupuestoPorAveriaActualizado.flatMap(averia => averia.items);
    setPresupuestoActual(prev => ({
      ...prev,
      items: itemsActualizados,
      presupuestoPorAveria: presupuestoPorAveriaActualizado,
    }));
  }, [presupuestoActual]);

  const calcularTotales = useMemo(() => {
    const subtotal = presupuestoActual.items.reduce((sum, item) =>
      sum + (item.precio * item.cantidad), 0
    );
    const descuentoAplicado = presupuestoActual.tipo_descuento === "porcentaje"
      ? (subtotal * presupuestoActual.descuento) / 100
      : presupuestoActual.descuento;
    const total = subtotal - descuentoAplicado;
    const anticipo = presupuestoActual.requiere_anticipo
      ? (total * presupuestoActual.porcentaje_anticipo) / 100
      : 0;
    return { subtotal, descuentoAplicado, total, anticipo };
  }, [presupuestoActual]);

  const activarEdicion = useCallback((terminalId: number) => {
    setModoEdicion(terminalId);
    onEditarPresupuesto(terminalId);
    seleccionarTerminal(terminalId);
  }, [onEditarPresupuesto, seleccionarTerminal]);

  const puedeAvanzar = todosTerminalesConPresupuesto;
  

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-6">
        <h5 className="text-xl font-semibold flex items-center">
          <CalculatorIcon className="w-6 h-6 mr-3" />
          Presupuesto Detallado por Avería
        </h5>
      </div>

      <div className="p-6">
        {/* Selector de terminales */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-3">
            Selecciona Terminal para Presupuestar ({estadisticasProgreso.completados}/{estadisticasProgreso.total} completados)
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
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-medium text-gray-900">
                      {terminal.dispositivo.marca} {terminal.dispositivo.modelo}
                    </div>
                    <div className="text-sm text-gray-500">
                      Averías: {terminal.diagnostico?.problemas_reportados.length || 0}
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className={`w-2 h-2 rounded-full ${
                      terminal.presupuestoCompletado 
                        ? 'bg-green-500' 
                        : presupuestosEnProgreso[terminal.dispositivo.id]?.items.length > 0
                          ? 'bg-purple-500'
                          : 'bg-gray-300'
                    }`}></div>
                    {terminal.presupuestoCompletado && (
                      <CheckCircleIcon className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                </div>

                {presupuestosEnProgreso[terminal.dispositivo.id]?.items.length > 0 && !terminal.presupuestoCompletado && (
                  <div className="text-xs text-purple-600 mt-1">
                    📝 {presupuestosEnProgreso[terminal.dispositivo.id].items.length} concepto(s) en progreso
                  </div>
                )}

                {terminal.presupuestoCompletado && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      activarEdicion(terminal.dispositivo.id);
                    }}
                    className="absolute top-2 right-2 p-1 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-full transition-all duration-200"
                    title="Editar presupuesto"
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
          <>
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

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                <div>
                  <span className="text-gray-500">IMEI:</span>
                  <div className="font-medium">{terminalActual.dispositivo.imei || 'N/A'}</div>
                </div>
                <div>
                  <span className="text-gray-500">Color:</span>
                  <div className="font-medium">{terminalActual.dispositivo.color || 'N/A'}</div>
                </div>
                <div>
                  <span className="text-gray-500">Capacidad:</span>
                  <div className="font-medium">{terminalActual.dispositivo.capacidad || 'N/A'}</div>
                </div>
                <div>
                  <span className="text-gray-500">Prioridad:</span>
                  <div className="font-medium">{terminalActual.diagnostico?.prioridad || 'Normal'}</div>
                </div>
              </div>

              <div className="mb-4">
                <h5 className="font-medium text-gray-900 mb-2">Averías Detectadas:</h5>
                <div className="flex flex-wrap gap-2">
                  {problemasDetectados.map((problema, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-red-100 text-red-800"
                    >
                      🔧 {problema}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Añadir conceptos al presupuesto */}
            <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-900 mb-4">Añadir Conceptos al Presupuesto</h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {/* Selector de avería */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Selecciona Avería <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={averiaSeleccionadaParaAñadir}
                    onChange={(e) => {
                      setAveriaSeleccionadaParaAñadir(e.target.value);
                      setConceptoSeleccionado("");
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  >
                    <option value="">Selecciona una avería</option>
                    {problemasDetectados.map((problema, index) => (
                      <option key={index} value={problema}>
                        {problema}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sugerencias Inteligentes */}
                {averiaSeleccionadaParaAñadir && sugerenciasIntervenciones.length > 0 && (
                  <div className="md:col-span-3 mb-4">
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center mb-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
                        <h5 className="font-medium text-blue-900">
                          💡 Sugerencias Inteligentes para "{averiaSeleccionadaParaAñadir}" en {terminalActual?.dispositivo.modelo}
                        </h5>
                      </div>
                      <p className="text-xs text-blue-700 mb-3">Intervenciones más usadas basadas en historial real:</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        {sugerenciasIntervenciones.map((sugerencia, index) => (
                          <button
                            key={index}
                            onClick={() => setConceptoSeleccionado(sugerencia.nombre)}
                            className="p-3 bg-white rounded-lg border border-blue-300 hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 text-left group"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-sm text-blue-900 group-hover:text-blue-700">
                                {sugerencia.nombre}
                              </span>
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                #{index + 1}
                              </span>
                            </div>
                            <div className="text-xs text-blue-600 mb-1">
                              €{sugerencia.precio_base} • {sugerencia.tiempo_estimado_minutos}min
                            </div>
                            {sugerencia.frecuencia_uso > 0 && (
                              <div className="text-xs text-blue-500">
                                Usada {sugerencia.frecuencia_uso} veces
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Selector de concepto */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Concepto/Intervención
                    {cargandoIntervenciones && <span className="ml-2 text-xs text-blue-600">(Cargando...)</span>}
                  </label>
                  <select
                    value={conceptoSeleccionado}
                    onChange={(e) => setConceptoSeleccionado(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    disabled={!averiaSeleccionadaParaAñadir || cargandoIntervenciones}
                  >
                    <option value="">
                      {!averiaSeleccionadaParaAñadir ? 'Primero selecciona avería' :
                       cargandoIntervenciones ? 'Cargando intervenciones...' : 'Selecciona concepto'}
                    </option>
                    {averiaSeleccionadaParaAñadir && obtenerConceptosDisponibles().map((concepto, index) => (
                      <option key={index} value={concepto.concepto}>
                        {concepto.concepto} - €{concepto.precio} ({concepto.tipo})
                        {concepto.intervencion_id && ` [ID: ${concepto.intervencion_id}]`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Botones de acción */}
                <div className="flex flex-col justify-end space-y-2">
                  <button
                    onClick={añadirConceptoAlPresupuesto}
                    disabled={!averiaSeleccionadaParaAñadir || !conceptoSeleccionado}
                    className={`
                      flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-all duration-200
                      ${averiaSeleccionadaParaAñadir && conceptoSeleccionado
                        ? 'bg-green-600 text-white hover:bg-green-700 shadow-md hover:shadow-lg'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }
                    `}
                  >
                    <PlusCircleIcon className="w-4 h-4 mr-2" />
                    Añadir Concepto
                  </button>

                  <button
                    onClick={() => setMostrarFormularioNuevaIntervencion(!mostrarFormularioNuevaIntervencion)}
                    disabled={!averiaSeleccionadaParaAñadir}
                    className={`
                      flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-all duration-200
                      ${averiaSeleccionadaParaAñadir
                        ? 'bg-purple-600 text-white hover:bg-purple-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }
                    `}
                    title="Crear nueva intervención en la base de datos"
                  >
                    <PlusCircleIcon className="w-4 h-4 mr-2" />
                    Crear Intervención
                  </button>
                </div>
              </div>

              {/* Formulario nueva intervención */}
              {mostrarFormularioNuevaIntervencion && averiaSeleccionadaParaAñadir && (
                <div className="mt-4 p-6 bg-purple-50 rounded-lg border border-purple-200">
                  <h5 className="font-medium text-purple-900 mb-4 flex items-center">
                    <PlusCircleIcon className="w-5 h-5 mr-2" />
                    Crear Nueva Intervención en BD
                  </h5>
                  <div className="text-sm text-purple-700 mb-4 p-3 bg-purple-100 rounded border">
                    📋 <strong>Avería:</strong> {averiaSeleccionadaParaAñadir} |
                    <strong> Modelo:</strong> {terminalActual?.dispositivo.marca} {terminalActual?.dispositivo.modelo}
                    <br />
                    💡 Esta intervención quedará guardada permanentemente para futuros presupuestos
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Concepto */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Concepto/Nombre <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={nuevaIntervencion.concepto}
                        onChange={(e) => setNuevaIntervencion(prev => ({ ...prev, concepto: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="Ej: Cambio de pantalla iPhone 13"
                      />
                    </div>

                    {/* Descripción */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                      <textarea
                        value={nuevaIntervencion.descripcion}
                        onChange={(e) => setNuevaIntervencion(prev => ({ ...prev, descripcion: e.target.value }))}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="Descripción detallada del trabajo a realizar"
                      />
                    </div>

                    {/* Precio */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Precio Base (€) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={nuevaIntervencion.precio_base}
                        onChange={(e) => setNuevaIntervencion(prev => ({ ...prev, precio_base: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    {/* Tipo */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                      <select
                        value={nuevaIntervencion.tipo}
                        onChange={(e) => setNuevaIntervencion(prev => ({ ...prev, tipo: e.target.value as "mano_obra" | "repuesto" | "mixto" }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="mano_obra">Mano de Obra</option>
                        <option value="repuesto">Repuesto</option>
                        <option value="mixto">Mixto</option>
                      </select>
                    </div>

                    {/* Tiempo */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tiempo Estimado (min)</label>
                      <input
                        type="number"
                        min="0"
                        value={nuevaIntervencion.tiempo_estimado_minutos}
                        onChange={(e) => setNuevaIntervencion(prev => ({ ...prev, tiempo_estimado_minutos: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    {/* Dificultad */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Dificultad</label>
                      <select
                        value={nuevaIntervencion.dificultad}
                        onChange={(e) => setNuevaIntervencion(prev => ({ ...prev, dificultad: e.target.value as "facil" | "media" | "dificil" }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="facil">Fácil</option>
                        <option value="media">Media</option>
                        <option value="dificil">Difícil</option>
                      </select>
                    </div>
                  </div>

                  {/* Especialista */}
                  <div className="mt-4">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={nuevaIntervencion.requiere_especialista}
                        onChange={(e) => setNuevaIntervencion(prev => ({ ...prev, requiere_especialista: e.target.checked }))}
                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Requiere técnico especialista</span>
                    </label>
                  </div>

                  {/* Botones */}
                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      onClick={() => setMostrarFormularioNuevaIntervencion(false)}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-all"
                      disabled={creandoIntervencion}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={crearNuevaIntervencion}
                      disabled={!nuevaIntervencion.concepto || nuevaIntervencion.precio_base <= 0 || creandoIntervencion}
                      className={`
                        flex items-center px-6 py-2 rounded-lg font-medium transition-all
                        ${nuevaIntervencion.concepto && nuevaIntervencion.precio_base > 0 && !creandoIntervencion
                          ? 'bg-purple-600 text-white hover:bg-purple-700'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }
                      `}
                    >
                      {creandoIntervencion ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Creando...
                        </>
                      ) : (
                        <>
                          <PlusCircleIcon className="w-4 h-4 mr-2" />
                          Crear Intervención
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Lista de conceptos añadidos */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-4">Presupuesto Detallado por Avería</h4>

              {presupuestoActual.presupuestoPorAveria.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <CalculatorIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Sin conceptos añadidos</h3>
                  <p className="text-gray-600 mb-4">Selecciona una avería y añade conceptos para crear el presupuesto</p>
                  {!terminalActual?.diagnostico?.problemas_reportados.length && (
                    <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800">
                      <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                      Este terminal no tiene averías diagnosticadas
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {presupuestoActual.presupuestoPorAveria.map((averia, averiaIndex) => (
                    <div key={averiaIndex} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-red-50 px-4 py-3 border-b border-red-200">
                        <h5 className="font-medium text-red-900 flex items-center">
                          <span className="text-red-500 mr-2">🔧</span>
                          {averia.problema}
                          <span className="ml-auto text-sm text-red-700">
                            {averia.items.length} concepto{averia.items.length !== 1 ? 's' : ''}
                          </span>
                        </h5>
                      </div>

                      <div className="p-4">
                        <div className="space-y-3">
                          {averia.items.map((item, itemIndex) => (
                            <div key={itemIndex} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                              <div className="flex-1">
                                <div className="flex items-center">
                                  <div className="flex-1">
                                    <div className="font-medium text-gray-900">{item.concepto}</div>
                                    <div className="text-sm text-gray-600 flex items-center space-x-3">
                                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                                        item.tipo === 'mano_obra'
                                          ? 'bg-blue-100 text-blue-800'
                                          : 'bg-purple-100 text-purple-800'
                                      }`}>
                                        {item.tipo === 'mano_obra' ? '🔧 Mano de Obra' : item.tipo === 'repuesto' ? '🔩 Repuesto' : '🔄 Mixto'}
                                      </span>
                                      {item.intervencion_id && (
                                        <span className="text-xs text-gray-500">
                                          ID: {item.intervencion_id}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center space-x-4 ml-4">
                                {/* Cantidad */}
                                <div className="flex items-center space-x-2">
                                  <label className="text-sm text-gray-600">Cant:</label>
                                  <input
                                    type="number"
                                    min="1"
                                    max="99"
                                    value={item.cantidad}
                                    onChange={(e) => actualizarCantidad(averia.problema, itemIndex, parseInt(e.target.value) || 1)}
                                    className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm focus:ring-2 focus:ring-indigo-500"
                                  />
                                </div>

                                {/* Precio unitario */}
                                <div className="flex items-center space-x-2">
                                  <label className="text-sm text-gray-600">€/u:</label>
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={item.precio}
                                    onChange={(e) => actualizarPrecio(averia.problema, itemIndex, parseFloat(e.target.value) || 0)}
                                    className="w-20 px-2 py-1 border border-gray-300 rounded text-center text-sm focus:ring-2 focus:ring-indigo-500"
                                  />
                                </div>

                                {/* Total */}
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm text-gray-600">=</span>
                                  <div className="font-bold text-indigo-600 text-lg min-w-[80px] text-right">
                                    €{(item.precio * item.cantidad).toFixed(2)}
                                  </div>
                                </div>

                                {/* Botón eliminar */}
                                <button
                                  onClick={() => eliminarItem(averia.problema, itemIndex)}
                                  className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-full transition-all duration-200"
                                  title="Eliminar concepto"
                                >
                                  <TrashIcon className="w-5 h-5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Subtotal por avería */}
                        <div className="mt-4 pt-3 border-t border-gray-200">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-700">Subtotal {averia.problema}:</span>
                            <span className="font-bold text-lg text-indigo-600">
                              €{averia.items.reduce((sum, item) => sum + (item.precio * item.cantidad), 0).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Configuración del presupuesto */}
            {presupuestoActual.items.length > 0 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Descuento */}
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <label className="block text-sm font-medium text-yellow-800 mb-2">
                      Descuento
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        min="0"
                        step={presupuestoActual.tipo_descuento === "porcentaje" ? "1" : "0.01"}
                        max={presupuestoActual.tipo_descuento === "porcentaje" ? "100" : undefined}
                        value={presupuestoActual.descuento}
                        onChange={(e) => setPresupuestoActual(prev => ({
                          ...prev,
                          descuento: parseFloat(e.target.value) || 0
                        }))}
                        className="flex-1 px-3 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 bg-white"
                      />
                      <select
                        value={presupuestoActual.tipo_descuento}
                        onChange={(e) => setPresupuestoActual(prev => ({
                          ...prev,
                          tipo_descuento: e.target.value as "porcentaje" | "cantidad",
                          descuento: 0
                        }))}
                        className="px-3 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 bg-white"
                      >
                        <option value="porcentaje">%</option>
                        <option value="cantidad">€</option>
                      </select>
                    </div>
                  </div>

                  {/* Validez */}
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <label className="block text-sm font-medium text-blue-800 mb-2">
                      Validez del presupuesto
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min="1"
                        max="365"
                        value={presupuestoActual.validez_dias}
                        onChange={(e) => setPresupuestoActual(prev => ({
                          ...prev,
                          validez_dias: parseInt(e.target.value) || 15
                        }))}
                        className="flex-1 px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                      <span className="text-blue-800 font-medium">días</span>
                    </div>
                  </div>
                </div>

                {/* Anticipo */}
                <div className="mb-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex items-center justify-between mb-3">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={presupuestoActual.requiere_anticipo}
                        onChange={(e) => setPresupuestoActual(prev => ({
                          ...prev,
                          requiere_anticipo: e.target.checked,
                          porcentaje_anticipo: e.target.checked ? 50 : 0
                        }))}
                        className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                      />
                      <span className="ml-2 font-medium text-orange-800">Requiere anticipo</span>
                    </label>

                    {presupuestoActual.requiere_anticipo && (
                      <div className="text-sm text-orange-700">
                        €{calcularTotales.anticipo.toFixed(2)} de anticipo
                      </div>
                    )}
                  </div>

                  {presupuestoActual.requiere_anticipo && (
                    <div>
                      <label className="block text-sm font-medium text-orange-700 mb-1">
                        Porcentaje de anticipo (%)
                      </label>
                      <div className="flex items-center space-x-4">
                        <input
                          type="range"
                          min="10"
                          max="100"
                          step="5"
                          value={presupuestoActual.porcentaje_anticipo}
                          onChange={(e) => setPresupuestoActual(prev => ({
                            ...prev,
                            porcentaje_anticipo: parseInt(e.target.value)
                          }))}
                          className="flex-1"
                        />
                        <input
                          type="number"
                          min="10"
                          max="100"
                          value={presupuestoActual.porcentaje_anticipo}
                          onChange={(e) => setPresupuestoActual(prev => ({
                            ...prev,
                            porcentaje_anticipo: parseInt(e.target.value) || 50
                          }))}
                          className="w-20 px-3 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white text-center"
                        />
                        <span className="text-orange-800 font-medium">%</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Notas */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notas del presupuesto
                  </label>
                  <textarea
                    value={presupuestoActual.notas_presupuesto}
                    onChange={(e) => setPresupuestoActual(prev => ({
                      ...prev,
                      notas_presupuesto: e.target.value
                    }))}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    placeholder="Condiciones especiales, garantías, tiempo de entrega, etc."
                  />
                </div>

                {/* Resumen de totales */}
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6 border border-indigo-200 mb-6">
                  <h4 className="font-semibold text-indigo-900 mb-4">Resumen del Presupuesto</h4>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Subtotal:</span>
                      <span className="font-medium text-lg">€{calcularTotales.subtotal.toFixed(2)}</span>
                    </div>

                    {calcularTotales.descuentoAplicado > 0 && (
                      <div className="flex justify-between items-center text-red-600">
                        <span>
                          Descuento ({presupuestoActual.descuento}{presupuestoActual.tipo_descuento === "porcentaje" ? "%" : "€"}):
                        </span>
                        <span className="font-medium">-€{calcularTotales.descuentoAplicado.toFixed(2)}</span>
                      </div>
                    )}

                    <div className="border-t border-indigo-200 pt-3">
                      <div className="flex justify-between items-center text-xl font-bold">
                        <span className="text-indigo-900">TOTAL:</span>
                        <span className="text-indigo-900">€{calcularTotales.total.toFixed(2)}</span>
                      </div>
                    </div>

                    {calcularTotales.anticipo > 0 && (
                      <div className="flex justify-between items-center text-orange-700 font-medium border-t border-orange-200 pt-2">
                        <span>Anticipo requerido ({presupuestoActual.porcentaje_anticipo}%):</span>
                        <span>€{calcularTotales.anticipo.toFixed(2)}</span>
                      </div>
                    )}

                    <div className="text-sm text-gray-600 mt-3">
                      <div>• Presupuesto válido por {presupuestoActual.validez_dias} días</div>
                      <div>• {presupuestoActual.items.length} concepto{presupuestoActual.items.length !== 1 ? 's' : ''} incluido{presupuestoActual.items.length !== 1 ? 's' : ''}</div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Mensajes informativos */}
            {terminalSeleccionado && presupuestoActual.items.length === 0 && (
              <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 flex items-center">
                  <span className="text-blue-500 mr-2">💡</span>
                  Selecciona una avería y añade conceptos para este terminal
                </p>
              </div>
            )}

            {terminalSeleccionado && presupuestoActual.items.length > 0 && (
              <div className="mt-6 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800 flex items-center">
                  <span className="text-green-500 mr-2">✅</span>
                  Presupuesto guardado automáticamente. Puedes pasar al siguiente terminal o continuar al resumen.
                </p>
              </div>
            )}
          </>
        )}

        {/* Validaciones y mensajes */}
        {!terminalSeleccionado && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500 mr-3" />
              <div>
                <p className="font-medium text-yellow-800">Selecciona un terminal</p>
                <p className="text-sm text-yellow-700">Elige un terminal de la lista para comenzar a crear su presupuesto</p>
              </div>
            </div>
          </div>
        )}

        {/* Indicador de progreso global */}
        <div className="mt-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-indigo-800 font-medium">
              Progreso Global: {estadisticasProgreso.completados} de {estadisticasProgreso.total} presupuestos completados
            </span>
            <span className="text-indigo-600 font-bold text-lg">
              {Math.round(estadisticasProgreso.porcentaje)}%
            </span>
          </div>
          <div className="w-full bg-indigo-200 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-500 ease-out"
              style={{ width: `${estadisticasProgreso.porcentaje}%` }}
            ></div>
          </div>
          {estadisticasProgreso.porcentaje === 100 && (
            <div className="mt-2 text-center">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                <CheckCircleIcon className="w-4 h-4 mr-1" />
                ¡Todos los presupuestos completados!
              </span>
            </div>
          )}
        </div>

        {/* Botones de navegación - Responsive */}
        <div className="flex flex-col sm:flex-row sm:justify-between gap-4 mt-8">
          <button
            className="flex items-center px-6 py-3 rounded-lg font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition-all duration-200"
            onClick={onBack}
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Volver a Diagnóstico
          </button>

          <button
            className={`
              flex items-center px-6 py-3 rounded-lg font-medium
              transition-all duration-200 transform
              ${puedeAvanzar
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:from-indigo-700 hover:to-indigo-800 hover:scale-105 shadow-lg'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }
            `}
            onClick={onNext}
            disabled={!puedeAvanzar}
          >
            <span>Continuar a Resumen</span>
            <ArrowRightIcon className="w-5 h-5 ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Paso4PresupuestoPorTerminal;