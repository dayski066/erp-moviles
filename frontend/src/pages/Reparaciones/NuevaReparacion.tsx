// pages/Reparaciones/NuevaReparacion.tsx - MODIFICADO CON DISEÑO MEJORADO
import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useReparacionNotifications } from "../../hooks/useReparacionNotifications";
import { useNotification } from "../../contexts/NotificationContext";

// Importar tipos consolidados
import type { ClienteData } from "../../types/Cliente";
import { DispositivoGuardado } from "../../types/Dispositivo";
import {
  DiagnosticoData,
  PresupuestoData,
  TerminalCompleto,
} from "../../types/Reparacion";

// Importar componentes de pasos ORIGINALES (funcionaban bien)
import Paso1Cliente from "./components/Paso1Cliente";
import Paso2DispositivosMultiples from "./components/Paso2DispositivosMultiples";
import Paso3DiagnosticoPorTerminal from "./components/Paso3DiagnosticoPorTerminal";
import Paso4PresupuestoPorTerminal from "./components/Paso4PresupuestoPorTerminal";
import Paso5ResumenCompleto from "./components/Paso5ResumenCompleto";

// Importar APIs V2
import reparacionesApi from "../../services/reparacionesApi";

interface EstadoProceso {
  pasoActual: number;
  clienteValido: boolean;
  dispositivosValidos: boolean;
  terminalesMinimos: boolean;
  diagnosticosCompletos: boolean;
  presupuestosCompletos: boolean;
}

interface BorradorReparacion {
  timestamp: number;
  pasoActual: number;
  clienteData: ClienteData;
  clienteValido: boolean;
  dispositivosAgregados: DispositivoGuardado[];
  dispositivosValidos: boolean;
  terminalesCompletos: TerminalCompleto[];
  version: string;
}

const NuevaReparacion: React.FC = () => {
  const navigate = useNavigate();
  const { notificarReparacionCreada, notificarErrorCreacion } =
    useReparacionNotifications();
  const { showInfo, showSuccess, showError, showWarning } = useNotification();

  // Estados principales
  const [pasoActual, setPasoActual] = useState<number>(1);
  const [enviando, setEnviando] = useState<boolean>(false);

  // Estados para auto-guardado y recuperación
  const [mostrarModalRecuperacion, setMostrarModalRecuperacion] = useState<boolean>(false);
  const [borradorDetectado, setBorradorDetectado] = useState<BorradorReparacion | null>(null);
  const [autoGuardadoActivo, setAutoGuardadoActivo] = useState<boolean>(false);

  // Estado del cliente
  const [clienteData, setClienteData] = useState<ClienteData>({
    nombre: "",
    apellidos: "",
    dni: "",
    telefono: "",
    email: "",
    direccion: "",
    codigoPostal: "",
    ciudad: "",
  });
  const [clienteValido, setClienteValido] = useState<boolean>(false);

  // Estado de dispositivos múltiples
  const [dispositivosAgregados, setDispositivosAgregados] = useState<
    DispositivoGuardado[]
  >([]);
  const [dispositivosValidos, setDispositivosValidos] =
    useState<boolean>(false);

  // Estado de terminales completos
  const [terminalesCompletos, setTerminalesCompletos] = useState<
    TerminalCompleto[]
  >([]);

  // ✅ NUEVA: Configuración de pasos para el panel lateral
  // ✅ OPTIMIZADO: Memoizar array de pasos para evitar re-renders innecesarios
  const pasos = useMemo(() => [
    {
      number: 1,
      text: "Cliente",
      icon: "👤",
      description: "Datos del cliente",
    },
    {
      number: 2,
      text: "Dispositivos",
      icon: "📱",
      description: "Información de dispositivos",
    },
    {
      number: 3,
      text: "Diagnóstico",
      icon: "🔍",
      description: "Diagnóstico inicial",
    },
    {
      number: 4,
      text: "Presupuesto",
      icon: "💰",
      description: "Presupuesto detallado",
    },
    {
      number: 5,
      text: "Resumen",
      icon: "📋",
      description: "Resumen final",
    },
  ], []); // Array vacío porque los pasos son estáticos

  // ✅ NUEVA: Constantes para auto-guardado
  const DRAFT_KEY = 'nueva_reparacion_draft';
  const DRAFT_EXPIRY_HOURS = 24; // Borrador expira en 24 horas

  // ✅ NUEVA: Función para verificar si hay datos significativos
  const hayDatosSignificativos = useMemo(() => {
    return clienteValido || 
           dispositivosAgregados.length > 0 || 
           terminalesCompletos.some(t => t.diagnosticoCompletado || t.presupuestoCompletado);
  }, [clienteValido, dispositivosAgregados.length, terminalesCompletos]);

  // ✅ NUEVA: Función de auto-guardado
  const autoGuardar = useCallback(() => {
    if (!hayDatosSignificativos || !autoGuardadoActivo) return;

    const borrador = {
      timestamp: Date.now(),
      pasoActual,
      clienteData,
      clienteValido,
      dispositivosAgregados,
      dispositivosValidos,
      terminalesCompletos,
      version: '1.0' // Para futuras migraciones
    };

    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(borrador));
      console.log('💾 Borrador auto-guardado:', new Date().toLocaleTimeString());
    } catch (error) {
      console.error('❌ Error al auto-guardar:', error);
      showError('Error de Auto-guardado', 'No se pudo guardar el progreso automáticamente');
    }
  }, [
    hayDatosSignificativos,
    autoGuardadoActivo,
    pasoActual,
    clienteData,
    clienteValido,
    dispositivosAgregados,
    dispositivosValidos,
    terminalesCompletos,
    showError
  ]);

  // ✅ NUEVA: Función para cargar borrador
  const cargarBorrador = useCallback((borrador: BorradorReparacion) => {
    try {
      setPasoActual(borrador.pasoActual || 1);
      setClienteData(borrador.clienteData || {
        nombre: "", apellidos: "", dni: "", telefono: "",
        email: "", direccion: "", codigoPostal: "", ciudad: ""
      });
      setClienteValido(borrador.clienteValido || false);
      setDispositivosAgregados(borrador.dispositivosAgregados || []);
      setDispositivosValidos(borrador.dispositivosValidos || false);
      setTerminalesCompletos(borrador.terminalesCompletos || []);
      
      setAutoGuardadoActivo(true);
      // Marcar que ya se notificó para evitar notificación duplicada
      sessionStorage.setItem('autoguardado_notificado', 'true');
      showSuccess(
        'Borrador Recuperado', 
        `Se ha restaurado tu trabajo desde ${new Date(borrador.timestamp).toLocaleString()}`
      );
    } catch (error) {
      console.error('❌ Error al cargar borrador:', error);
      showError('Error de Recuperación', 'No se pudo cargar el borrador guardado');
    }
  }, [showSuccess, showError]);

  // ✅ NUEVA: Función para detectar borrador al cargar
  const detectarBorrador = useCallback(() => {
    try {
      const borradorStr = localStorage.getItem(DRAFT_KEY);
      if (!borradorStr) return;

      const borrador = JSON.parse(borradorStr);
      const ahora = Date.now();
      const tiempoTranscurrido = ahora - borrador.timestamp;
      const horasTranscurridas = tiempoTranscurrido / (1000 * 60 * 60);

      // Verificar si el borrador no ha expirado
      if (horasTranscurridas > DRAFT_EXPIRY_HOURS) {
        localStorage.removeItem(DRAFT_KEY);
        return;
      }

      // Verificar si tiene datos significativos
      const tieneDatos = borrador.clienteValido || 
                        (borrador.dispositivosAgregados && borrador.dispositivosAgregados.length > 0) ||
                        (borrador.terminalesCompletos && borrador.terminalesCompletos.some((t: TerminalCompleto) => 
                          t.diagnosticoCompletado || t.presupuestoCompletado));

      if (tieneDatos) {
        setBorradorDetectado(borrador);
        setMostrarModalRecuperacion(true);
      }
    } catch (error) {
      console.error('❌ Error al detectar borrador:', error);
      localStorage.removeItem(DRAFT_KEY); // Limpiar borrador corrupto
    }
  }, []);

  // ✅ NUEVA: Función para limpiar borrador
  const limpiarBorrador = useCallback(() => {
    localStorage.removeItem(DRAFT_KEY);
    sessionStorage.removeItem('autoguardado_notificado');
    setBorradorDetectado(null);
    setAutoGuardadoActivo(false);
  }, []);

  // Estado calculado del proceso
  const estadoProceso = useMemo((): EstadoProceso => {
    const terminalesMinimos = terminalesCompletos.length > 0;
    const diagnosticosCompletos =
      terminalesCompletos.length > 0 &&
      terminalesCompletos.every((terminal) => terminal.diagnosticoCompletado);
    const presupuestosCompletos =
      terminalesCompletos.length > 0 &&
      terminalesCompletos.every((terminal) => terminal.presupuestoCompletado);

    return {
      pasoActual,
      clienteValido,
      dispositivosValidos,
      terminalesMinimos,
      diagnosticosCompletos,
      presupuestosCompletos,
    };
  }, [pasoActual, clienteValido, dispositivosValidos, terminalesCompletos]);

  // ✅ MEJORADA: Función para determinar el estado de cada paso
  const getEstadoPaso = useCallback(
    (numeroPaso: number) => {
      if (numeroPaso < pasoActual) return "completado";
      if (numeroPaso === pasoActual) {
        // Verificar si el paso actual tiene errores o está incompleto
        switch (numeroPaso) {
          case 1:
            return clienteValido ? "actual" : "actual-incompleto";
          case 2:
            return dispositivosValidos ? "actual" : "actual-incompleto";
          case 3:
            return estadoProceso.diagnosticosCompletos ? "actual" : "actual-incompleto";
          case 4:
            return estadoProceso.presupuestosCompletos ? "actual" : "actual-incompleto";
          default:
            return "actual";
        }
      }
      return "pendiente";
    },
    [pasoActual, clienteValido, dispositivosValidos, estadoProceso]
  );

  // ✅ NUEVA: Función para calcular progreso general
  const progresoGeneral = useMemo(() => {
    let completados = 0;
    if (clienteValido) completados++;
    if (dispositivosValidos) completados++;
    if (estadoProceso.diagnosticosCompletos) completados++;
    if (estadoProceso.presupuestosCompletos) completados++;
    if (pasoActual === 5) completados++; // Paso 5 es solo visualización
    
    return Math.round((completados / 5) * 100);
  }, [clienteValido, dispositivosValidos, estadoProceso, pasoActual]);

  // ✅ MOVIDA: Función para verificar si se puede avanzar a un paso (necesaria antes que navegarAPaso)
  const puedeAvanzarAPaso = useCallback(
    (paso: number): boolean => {
      switch (paso) {
        case 1:
          return true;
        case 2:
          return clienteValido;
        case 3:
          return clienteValido && dispositivosValidos;
        case 4:
          return (
            clienteValido &&
            dispositivosValidos &&
            terminalesCompletos.length > 0 &&
            terminalesCompletos.every(
              (terminal) => terminal.diagnosticoCompletado
            )
          );
        case 5:
          return (
            clienteValido &&
            dispositivosValidos &&
            terminalesCompletos.length > 0 &&
            terminalesCompletos.every(
              (terminal) =>
                terminal.diagnosticoCompletado && terminal.presupuestoCompletado
            )
          );
        default:
          return false;
      }
    },
    [clienteValido, dispositivosValidos, terminalesCompletos]
  );

  // ✅ NUEVA: Función para navegación inteligente entre pasos
  const navegarAPaso = useCallback((numeroPaso: number) => {
    const estado = getEstadoPaso(numeroPaso);
    
    // Permitir navegación a pasos completados y al paso actual
    if (estado === "completado" || estado === "actual") {
      setPasoActual(numeroPaso);
      showInfo(
        'Navegación', 
        `Has regresado al Paso ${numeroPaso}: ${pasos[numeroPaso - 1].text}`
      );
    } else {
      // Verificar si puede avanzar al paso solicitado
      if (puedeAvanzarAPaso(numeroPaso)) {
        setPasoActual(numeroPaso);
        showInfo(
          'Avanzando', 
          `Has avanzado al Paso ${numeroPaso}: ${pasos[numeroPaso - 1].text}`
        );
      } else {
        showWarning(
          'Paso Bloqueado', 
          `Completa los pasos anteriores antes de acceder al Paso ${numeroPaso}`
        );
      }
    }
  }, [getEstadoPaso, puedeAvanzarAPaso, pasos, showInfo, showWarning]);

  // ✅ NUEVA: Función para verificar si un paso es clickeable
  const esPasoClickeable = useCallback((numeroPaso: number) => {
    const estado = getEstadoPaso(numeroPaso);
    return estado === "completado" || estado === "actual" || puedeAvanzarAPaso(numeroPaso);
  }, [getEstadoPaso, puedeAvanzarAPaso]);

  // Funciones de navegación (mantener las existentes)

  const avanzarPaso = useCallback(() => {
    const siguientePaso = pasoActual + 1;

    if (pasoActual === 2 && siguientePaso === 3 && dispositivosValidos) {
      crearTerminalesDesdeDispositivos();
    }

    if (siguientePaso <= 5 && puedeAvanzarAPaso(siguientePaso)) {
      setPasoActual(siguientePaso);
    }
  }, [pasoActual, puedeAvanzarAPaso, dispositivosValidos]);

  const retrocederPaso = useCallback(() => {
    if (pasoActual > 1) {
      setPasoActual(pasoActual - 1);
    }
  }, [pasoActual]);

  // Función para crear terminales desde dispositivos
  const crearTerminalesDesdeDispositivos = useCallback(() => {
    if (!dispositivosValidos || dispositivosAgregados.length === 0) {
      return;
    }

    const nuevosTerminales: TerminalCompleto[] = dispositivosAgregados.map(
      (dispositivo) => ({
        dispositivo,
        diagnostico: null,
        presupuesto: null,
        diagnosticoCompletado: false,
        presupuestoCompletado: false,
        fechaUltimaModificacion: new Date(),
      })
    );

    setTerminalesCompletos(nuevosTerminales);
  }, [dispositivosAgregados, dispositivosValidos]);

  // Effect para crear terminales
  useEffect(() => {
    if (
      pasoActual === 3 &&
      dispositivosValidos &&
      dispositivosAgregados.length > 0
    ) {
      if (terminalesCompletos.length !== dispositivosAgregados.length) {
        crearTerminalesDesdeDispositivos();
      }
    }
  }, [
    pasoActual,
    dispositivosValidos,
    dispositivosAgregados,
    terminalesCompletos.length,
    crearTerminalesDesdeDispositivos,
  ]);

  // ✅ NUEVO: useEffect para detectar borrador al cargar el componente
  useEffect(() => {
    detectarBorrador();
  }, []); // Solo ejecutar una vez al montar

  // ✅ NUEVO: useEffect para auto-guardado automático
  useEffect(() => {
    if (!autoGuardadoActivo || !hayDatosSignificativos) return;

    // Guardar cada 30 segundos
    const intervalo = setInterval(autoGuardar, 30000);

    return () => clearInterval(intervalo);
  }, [autoGuardadoActivo, hayDatosSignificativos, autoGuardar]);

  // ✅ NUEVO: useEffect para auto-guardar en cambios importantes
  useEffect(() => {
    if (autoGuardadoActivo && hayDatosSignificativos) {
      // Debounce: guardar 2 segundos después del último cambio
      const timeoutId = setTimeout(autoGuardar, 2000);
      return () => clearTimeout(timeoutId);
    }
  }, [
    autoGuardadoActivo,
    hayDatosSignificativos,
    clienteData,
    dispositivosAgregados,
    terminalesCompletos,
    autoGuardar
  ]);

  // Funciones de manejo de datos (mantener las existentes)
  const manejarCambioCliente = useCallback(
    (cliente: ClienteData, esValido: boolean) => {
      setClienteData(cliente);
      setClienteValido(esValido);
      
      // ✅ MEJORADO: Activar auto-guardado sin notificación duplicada
      if (!autoGuardadoActivo && (esValido || cliente.nombre || cliente.dni)) {
        setAutoGuardadoActivo(true);
        // Solo mostrar notificación si realmente es la primera vez
        const yaSeNotifico = sessionStorage.getItem('autoguardado_notificado');
        if (!yaSeNotifico) {
          showInfo('Auto-guardado Activado', 'Tu progreso se guardará automáticamente');
          sessionStorage.setItem('autoguardado_notificado', 'true');
        }
      }
    },
    [autoGuardadoActivo, showInfo]
  );

  const manejarCambioDispositivos = useCallback(
    (dispositivos: DispositivoGuardado[], esValido: boolean) => {
      setDispositivosAgregados(dispositivos);
      setDispositivosValidos(esValido);
      
      // ✅ MEJORADO: Activar auto-guardado sin notificación duplicada
      if (!autoGuardadoActivo && dispositivos.length > 0) {
        setAutoGuardadoActivo(true);
        // Solo mostrar notificación si realmente es la primera vez
        const yaSeNotifico = sessionStorage.getItem('autoguardado_notificado');
        if (!yaSeNotifico) {
          showInfo('Auto-guardado Activado', 'Tu progreso se guardará automáticamente');
          sessionStorage.setItem('autoguardado_notificado', 'true');
        }
      }
    },
    [autoGuardadoActivo, showInfo]
  );

  const guardarDiagnostico = useCallback(
    (terminalId: number, diagnostico: DiagnosticoData | null) => {
      setTerminalesCompletos((prev) =>
        prev.map((terminal) =>
          terminal.dispositivo.id === terminalId
            ? {
                ...terminal,
                diagnostico: diagnostico ? { ...diagnostico } : null,
                diagnosticoCompletado: diagnostico !== null && diagnostico.problemas_reportados?.length > 0,
                fechaUltimaModificacion: new Date(),
              }
            : terminal
        )
      );
    },
    []
  );

  const editarDiagnostico = useCallback((terminalId: number) => {
    setTerminalesCompletos((prev) =>
      prev.map((terminal) =>
        terminal.dispositivo.id === terminalId
          ? {
              ...terminal,
              diagnosticoCompletado: false,
              fechaUltimaModificacion: new Date(),
            }
          : terminal
      )
    );
  }, []);

  const guardarPresupuesto = useCallback(
    (terminalId: number, presupuesto: PresupuestoData | null) => {
      setTerminalesCompletos((prev) =>
        prev.map((terminal) =>
          terminal.dispositivo.id === terminalId
            ? {
                ...terminal,
                presupuesto: presupuesto ? { ...presupuesto } : null,
                presupuestoCompletado: presupuesto !== null && presupuesto.presupuestoPorAveria?.some(averia => averia.intervenciones?.length > 0),
                fechaUltimaModificacion: new Date(),
              }
            : terminal
        )
      );
    },
    []
  );

  const editarPresupuesto = useCallback((terminalId: number) => {
    setTerminalesCompletos((prev) =>
      prev.map((terminal) =>
        terminal.dispositivo.id === terminalId
          ? {
              ...terminal,
              presupuestoCompletado: false,
              fechaUltimaModificacion: new Date(),
            }
          : terminal
      )
    );
  }, []);

  // Cálculos globales (mantener los existentes)
  const totalesGlobales = useMemo(() => {
    const terminalesConPresupuesto = terminalesCompletos.filter(
      (t) => t.presupuesto && t.presupuestoCompletado
    );

    const subtotalGeneral = terminalesConPresupuesto.reduce(
      (total, terminal) => {
        if (!terminal.presupuesto) return total;
        return (
          total +
          terminal.presupuesto.items.reduce(
            (sum, item) => sum + item.precio * item.cantidad,
            0
          )
        );
      },
      0
    );

    const descuentoGeneral = terminalesConPresupuesto.reduce(
      (total, terminal) => {
        if (!terminal.presupuesto) return total;
        return total + terminal.presupuesto.descuento;
      },
      0
    );

    const totalGeneral = subtotalGeneral - descuentoGeneral;

    const anticipoGeneral = terminalesConPresupuesto.reduce(
      (total, terminal) => {
        if (!terminal.presupuesto?.requiere_anticipo) return total;
        return (
          total +
          (totalGeneral * terminal.presupuesto.porcentaje_anticipo) / 100
        );
      },
      0
    );

    return {
      subtotal: subtotalGeneral,
      descuento: descuentoGeneral,
      total: totalGeneral,
      anticipo: anticipoGeneral,
      terminalesConPresupuesto: terminalesConPresupuesto.length,
    };
  }, [terminalesCompletos]);

  // Función de envío ACTUALIZADA para API V2
  const enviarReparacion = useCallback(async () => {
    setEnviando(true);

    try {
      if (!clienteValido || !dispositivosValidos) {
        throw new Error("Datos incompletos");
      }

      if (!estadoProceso.presupuestosCompletos) {
        throw new Error("Faltan presupuestos por completar");
      }

      console.log('🚀 Preparando datos para envío con API V2...');

      // Validar datos antes de enviar
      const validacion = reparacionesApi.validarDatosAnteDeEnviar(clienteData, terminalesCompletos);
      if (!validacion.esValido) {
        throw new Error(`Validación fallida: ${validacion.errores.join(', ')}`);
      }

      // Transformar datos al formato esperado por API V2
      const datosTransformados = reparacionesApi.transformarDatosParaBackend(
        clienteData,
        terminalesCompletos,
        totalesGlobales,
        {
          notas: 'Reparación creada desde frontend optimizado V2',
          origen: 'frontend_v2'
        }
      );

      console.log('📦 Datos transformados para backend V2:', JSON.stringify(datosTransformados, null, 2));

      // Intentar usar la API V2 optimizada, si falla usar V1
      let resultado;
      try {
        resultado = await reparacionesApi.crearReparacionCompleta(datosTransformados);
      } catch (errorV2) {
        console.warn('⚠️ API V2 falló, intentando con método original:', errorV2);
        // Fallback al método original
        const datosOriginales = {
          cliente: clienteData,
          terminales: terminalesCompletos.map((terminal) => ({
            dispositivo: {
              marca: terminal.dispositivo.marca,
              modelo: terminal.dispositivo.modelo,
              imei: terminal.dispositivo.imei,
              color: terminal.dispositivo.color,
              capacidad: terminal.dispositivo.capacidad,
              observaciones: terminal.dispositivo.observaciones,
            },
            diagnostico: terminal.diagnostico,
            presupuesto: terminal.presupuesto,
          })),
          totales: totalesGlobales,
        };

        const response = await fetch(
          "http://localhost:5001/api/reparaciones/crear-completa",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(datosOriginales),
          }
        );

        resultado = await response.json();
      }

      if (resultado.success) {
        // ✅ Limpiar borrador al completar exitosamente
        limpiarBorrador();
        notificarReparacionCreada(resultado.data?.numero_orden || resultado.data?.id || "Nueva");
        showSuccess(
          'Reparación Creada',
          `Orden ${resultado.data?.numero_orden || 'nueva'} creada exitosamente con ${terminalesCompletos.length} dispositivo(s)`
        );
        navigate("/reparaciones");
      } else {
        throw new Error(resultado.message || "Error al procesar la reparación");
      }
    } catch (error) {
      console.error('❌ Error creando reparación:', error);
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      notificarErrorCreacion(errorMessage);
      showError('Error al Crear Reparación', errorMessage);
    } finally {
      setEnviando(false);
    }
  }, [
    clienteValido,
    dispositivosValidos,
    estadoProceso,
    clienteData,
    terminalesCompletos,
    totalesGlobales,
    navigate,
    notificarReparacionCreada,
    notificarErrorCreacion,
    limpiarBorrador,
    showSuccess,
    showError,
  ]);

  const resetearFormulario = useCallback(() => {
    setPasoActual(1);
    setClienteData({
      nombre: "",
      apellidos: "",
      dni: "",
      telefono: "",
      email: "",
      direccion: "",
      codigoPostal: "",
      ciudad: "",
    });
    setClienteValido(false);
    setDispositivosAgregados([]);
    setDispositivosValidos(false);
    setTerminalesCompletos([]);
    setEnviando(false);
    
    // ✅ NUEVO: Limpiar borrador y notificación al resetear
    limpiarBorrador();
    sessionStorage.removeItem('autoguardado_notificado');
    showInfo('Formulario Reiniciado', 'Se ha limpiado todo el progreso guardado');
  }, [limpiarBorrador, showInfo]);

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100">
      {/* ✅ Header simplificado (sin barra de pasos) */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/reparaciones")}
                className="flex items-center px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 hover:text-blue-800 rounded-lg transition-all duration-200 border border-blue-200 shadow-sm hover:shadow-md font-medium"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                <span className="font-medium">Lista de Reparaciones</span>
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Nueva Reparación
                </h1>
                <p className="text-sm text-gray-500">
                  Crear orden de trabajo completa
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {dispositivosValidos && (
                <div className="text-sm text-gray-500">
                  {dispositivosAgregados.length} dispositivo
                  {dispositivosAgregados.length !== 1 ? "s" : ""}
                </div>
              )}
              {totalesGlobales.total > 0 && (
                <div className="text-sm font-semibold text-green-600">
                  €{totalesGlobales.total.toFixed(2)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ✅ Contenido principal con grid responsive mejorado */}
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col xl:flex-row gap-6 xl:gap-8">
          {/* ✅ Área principal de contenido (responsive) */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              {/* Paso 1: Cliente */}
              {pasoActual === 1 && (
                <Paso1Cliente
                  onClienteChange={manejarCambioCliente}
                  onNext={avanzarPaso}
                  isValid={clienteValido}
                  clienteInicial={clienteData} // ✅ AGREGAR ESTA LÍNEA
                />
              )}
              {/* Paso 2: Dispositivos ORIGINAL (funcionaba bien) */}
              {pasoActual === 2 && (
                <Paso2DispositivosMultiples
                  onDispositivosChange={manejarCambioDispositivos}
                  onNext={avanzarPaso}
                  onPrev={retrocederPaso}
                  isValid={dispositivosValidos}
                  dispositivosIniciales={dispositivosAgregados}
                />
              )}

              {/* Paso 3: Diagnóstico ORIGINAL (funcionaba bien) */}
              {pasoActual === 3 && (
                <Paso3DiagnosticoPorTerminal
                  terminalesCompletos={terminalesCompletos}
                  onGuardarDiagnostico={guardarDiagnostico}
                  onEditarDiagnostico={editarDiagnostico}
                  onNext={avanzarPaso}
                  onBack={retrocederPaso}
                />
              )}

              {/* Paso 4: Presupuesto ORIGINAL (funcionaba bien) */}
              {pasoActual === 4 && (
                <Paso4PresupuestoPorTerminal
                  terminalesCompletos={terminalesCompletos}
                  onGuardarPresupuesto={guardarPresupuesto}
                  onEditarPresupuesto={editarPresupuesto}
                  onNext={avanzarPaso}
                  onBack={retrocederPaso}
                />
              )}

              {/* Paso 5: Resumen */}
              {pasoActual === 5 && (
                <Paso5ResumenCompleto
                  clienteData={clienteData}
                  terminalesCompletos={terminalesCompletos}
                  totalesGlobales={totalesGlobales}
                  onBack={retrocederPaso}
                  onConfirmar={enviarReparacion}
                  onReset={resetearFormulario}
                  isLoading={enviando}
                />
              )}
            </div>
          </div>

          {/* ✅ Panel lateral de progreso MEJORADO - Responsive */}
          <div className="xl:w-80 xl:flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 xl:sticky xl:top-6">
              {/* Header del panel */}
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <span className="text-white text-2xl">📋</span>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Progreso
                  </h3>
                  <p className="text-sm text-gray-500">
                    Paso {pasoActual} de {pasos.length} • {progresoGeneral}% completado
                  </p>
                </div>
              </div>

              {/* ✅ NUEVA: Barra de progreso visual */}
              <div className="mb-6">
                <div className="flex justify-between text-xs text-gray-500 mb-2">
                  <span>Progreso General</span>
                  <span>{progresoGeneral}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progresoGeneral}%` }}
                  ></div>
                </div>
              </div>

              {/* ✅ Lista de pasos con círculos numerados */}
              <div className="space-y-4">
                {pasos.map((paso) => {
                  const estado = getEstadoPaso(paso.number);
                  const esClickeable = esPasoClickeable(paso.number);
                  
                  return (
                    <div key={paso.number} className="flex items-center">
                      {/* ✅ Paso clickeable mejorado */}
                      <button
                        onClick={() => navegarAPaso(paso.number)}
                        disabled={!esClickeable}
                        className={`
                          flex items-center w-full p-2 rounded-lg transition-all duration-300 
                          ${esClickeable 
                            ? 'hover:bg-gray-50 hover:shadow-sm cursor-pointer' 
                            : 'cursor-not-allowed opacity-60'
                          }
                          ${estado === "actual" ? 'bg-blue-50 border border-blue-200' : ''}
                        `}
                        title={
                          esClickeable 
                            ? `Ir al ${paso.text}` 
                            : `Completa los pasos anteriores para acceder a ${paso.text}`
                        }
                      >
                        {/* ✅ Círculo numerado con estados mejorados */}
                        <div
                          className={`
                          w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300
                          ${
                            estado === "completado"
                              ? "bg-green-500 text-white shadow-lg"
                              : estado === "actual"
                              ? "bg-blue-500 text-white shadow-lg ring-4 ring-blue-100"
                              : estado === "actual-incompleto"
                              ? "bg-yellow-500 text-white shadow-lg ring-4 ring-yellow-100"
                              : esClickeable
                              ? "bg-blue-100 text-blue-600 hover:bg-blue-200"
                              : "bg-gray-200 text-gray-500"
                          }
                        `}
                        >
                          {estado === "completado" 
                            ? "✓" 
                            : estado === "actual-incompleto" 
                            ? "⚠" 
                            : paso.number}
                        </div>

                        {/* Información del paso */}
                        <div className="ml-4 flex-1 text-left">
                          <div
                            className={`font-medium transition-all duration-300 ${
                              estado === "actual"
                                ? "text-blue-600"
                                : estado === "actual-incompleto"
                                ? "text-yellow-600"
                                : estado === "completado"
                                ? "text-green-600"
                                : esClickeable
                                ? "text-blue-500 hover:text-blue-700"
                                : "text-gray-500"
                            }`}
                          >
                            {paso.text}
                          </div>
                          <div className={`text-xs transition-all duration-300 ${
                            estado === "actual" 
                              ? "text-blue-400" 
                              : estado === "actual-incompleto"
                              ? "text-yellow-400"
                              : estado === "completado"
                              ? "text-green-400"
                              : "text-gray-400"
                          }`}>
                            {paso.description}
                          </div>
                        </div>

                        {/* Icono del paso */}
                        <div className="text-lg ml-2">{paso.icon}</div>
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Información del cliente */}
              {clienteValido && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">
                    Cliente
                  </h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div>
                      {clienteData.nombre} {clienteData.apellidos}
                    </div>
                    <div>{clienteData.telefono}</div>
                    <div>{clienteData.dni}</div>
                  </div>
                </div>
              )}

              {/* Información de dispositivos múltiples */}
              {dispositivosValidos && dispositivosAgregados.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">
                    Dispositivos ({dispositivosAgregados.length})
                  </h4>
                  <div className="space-y-3 max-h-40 overflow-y-auto">
                    {dispositivosAgregados.map((dispositivo) => (
                      <div
                        key={dispositivo.id}
                        className="text-sm text-gray-600 p-2 bg-gray-50 rounded"
                      >
                        <div className="font-medium">
                          {dispositivo.marca} {dispositivo.modelo}
                        </div>
                        <div className="text-xs">IMEI: {dispositivo.imei}</div>
                        {dispositivo.numero_serie && (
                          <div className="text-xs">
                            S/N: {dispositivo.numero_serie}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Totales */}
              {totalesGlobales.total > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">
                    Totales
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">
                        €{totalesGlobales.subtotal.toFixed(2)}
                      </span>
                    </div>
                    {totalesGlobales.descuento > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>Descuento:</span>
                        <span>-€{totalesGlobales.descuento.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold pt-2 border-t">
                      <span>Total:</span>
                      <span className="text-green-600">
                        €{totalesGlobales.total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ✅ NUEVO: Modal de Recuperación de Borrador */}
      {mostrarModalRecuperacion && borradorDetectado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Trabajo en Progreso Detectado
                  </h3>
                  <p className="text-sm text-gray-600">
                    Encontramos una reparación sin terminar
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Guardado:</span>
                    <span className="font-medium">
                      {new Date(borradorDetectado.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Paso:</span>
                    <span className="font-medium">
                      {borradorDetectado.pasoActual} de 5
                    </span>
                  </div>
                  {borradorDetectado.clienteData?.nombre && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cliente:</span>
                      <span className="font-medium">
                        {borradorDetectado.clienteData.nombre} {borradorDetectado.clienteData.apellidos}
                      </span>
                    </div>
                  )}
                  {borradorDetectado.dispositivosAgregados?.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Dispositivos:</span>
                      <span className="font-medium">
                        {borradorDetectado.dispositivosAgregados.length}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    cargarBorrador(borradorDetectado);
                    setMostrarModalRecuperacion(false);
                  }}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  ✅ Recuperar Trabajo
                </button>
                <button
                  onClick={() => {
                    limpiarBorrador();
                    setMostrarModalRecuperacion(false);
                    showInfo('Borrador Descartado', 'Se ha eliminado el trabajo anterior');
                  }}
                  className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  🗑️ Empezar de Nuevo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NuevaReparacion;
