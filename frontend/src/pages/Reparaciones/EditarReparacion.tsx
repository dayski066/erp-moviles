// pages/Reparaciones/EditarReparacion.tsx - CON PROTECCIÓN DE DATOS
import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useReparacionNotifications } from "../../hooks/useReparacionNotifications";
import useProteccionDatos from "../../hooks/useProteccionDatos"; // ✅ IMPORTAR HOOK

// Importar tipos consolidados
import type { ClienteData } from "../../types/Cliente";
import { DispositivoGuardado } from "../../types/Dispositivo";
import {
  DiagnosticoData,
  PresupuestoData,
  TerminalCompleto,
} from "../../types/Reparacion";

// IMPORTAR los tipos desde ListaReparaciones
import type {
  ReparacionInfo,
  DispositivoDetalle,
  AveriaDetalle,
  ServicioDetalle,
} from "./ListaReparaciones";

// Importar componentes de pasos
import Paso1Cliente from "./components/Paso1Cliente";
import Paso2DispositivosMultiples from "./components/Paso2DispositivosMultiples";
import Paso3DiagnosticoPorTerminal from "./components/Paso3DiagnosticoPorTerminal";
import Paso4PresupuestoPorTerminal from "./components/Paso4PresupuestoPorTerminal";
import Paso5ResumenCompleto from "./components/Paso5ResumenCompleto";

interface ReparacionOriginal {
  reparacion: ReparacionInfo;
  dispositivos: DispositivoDetalle[];
  averias: AveriaDetalle[];
  pagos: unknown[];
  historial: unknown[];
  comunicaciones: unknown[];
  estadisticas: unknown;
}

const EditarReparacion: React.FC = () => {
  const navigate = useNavigate();
  const { id, paso: pasoParam } = useParams<{ id: string; paso?: string }>();
  const { notificarReparacionEditada, notificarErrorEdicion } =
    useReparacionNotifications();

  // Estados principales
  const [pasoActual, setPasoActual] = useState<number>(1);
  const [enviando, setEnviando] = useState<boolean>(false);
  const [cargando, setCargando] = useState<boolean>(true);
  const [datosYaCargados, setDatosYaCargados] = useState<boolean>(false);

  const [reparacionOriginal, setReparacionOriginal] =
    useState<ReparacionOriginal | null>(null);

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

  // ✅ NUEVOS ESTADOS: Para controlar cambios realizados
  const [datosOriginalesCliente, setDatosOriginalesCliente] = useState<ClienteData | null>(null);
  const [datosOriginalesDispositivos, setDatosOriginalesDispositivos] = useState<DispositivoGuardado[]>([]);
  const [datosOriginalesTerminales, setDatosOriginalesTerminales] = useState<TerminalCompleto[]>([]);

  // Estado de dispositivos
  const [dispositivosAgregados, setDispositivosAgregados] = useState<
    DispositivoGuardado[]
  >([]);
  const [dispositivosValidos, setDispositivosValidos] =
    useState<boolean>(false);

  // Estado de terminales
  const [terminalesCompletos, setTerminalesCompletos] = useState<
    TerminalCompleto[]
  >([]);

  // ✅ FUNCIÓN: Detectar si hay cambios sin guardar
  const hayDatosSinGuardar = useMemo(() => {
    if (cargando || !datosYaCargados || enviando) {
      return false; // No mostrar protección mientras carga o envía
    }

    // ✅ COMPARAR CLIENTE
    const clienteCambio = datosOriginalesCliente && (
      clienteData.nombre !== datosOriginalesCliente.nombre ||
      clienteData.apellidos !== datosOriginalesCliente.apellidos ||
      clienteData.dni !== datosOriginalesCliente.dni ||
      clienteData.telefono !== datosOriginalesCliente.telefono ||
      clienteData.email !== datosOriginalesCliente.email ||
      clienteData.direccion !== datosOriginalesCliente.direccion ||
      clienteData.codigoPostal !== datosOriginalesCliente.codigoPostal ||
      clienteData.ciudad !== datosOriginalesCliente.ciudad
    );

    // ✅ COMPARAR DISPOSITIVOS (cantidad y datos básicos)
    const dispositivosCambio = 
      dispositivosAgregados.length !== datosOriginalesDispositivos.length ||
      dispositivosAgregados.some((dispositivo, index) => {
        const original = datosOriginalesDispositivos[index];
        if (!original) return true; // Dispositivo nuevo
        
        return (
          dispositivo.marca !== original.marca ||
          dispositivo.modelo !== original.modelo ||
          dispositivo.imei !== original.imei ||
          dispositivo.numero_serie !== original.numero_serie ||
          dispositivo.color !== original.color ||
          dispositivo.capacidad !== original.capacidad ||
          dispositivo.observaciones !== original.observaciones ||
          dispositivo.requiere_backup !== original.requiere_backup ||
          dispositivo.patron_desbloqueo !== original.patron_desbloqueo
        );
      });

    // ✅ COMPARAR TERMINALES (diagnósticos y presupuestos)
    const terminalesCambio = terminalesCompletos.some((terminal, index) => {
      const originalTerminal = datosOriginalesTerminales[index];
      if (!originalTerminal) return true; // Terminal nuevo

      // Comparar diagnóstico
      const diagnosticoCambio = JSON.stringify(terminal.diagnostico) !== JSON.stringify(originalTerminal.diagnostico);
      
      // Comparar presupuesto
      const presupuestoCambio = JSON.stringify(terminal.presupuesto) !== JSON.stringify(originalTerminal.presupuesto);

      // Comparar estados de completado
      const estadoCambio = 
        terminal.diagnosticoCompletado !== originalTerminal.diagnosticoCompletado ||
        terminal.presupuestoCompletado !== originalTerminal.presupuestoCompletado;

      return diagnosticoCambio || presupuestoCambio || estadoCambio;
    });

    const hayCambios = !!(clienteCambio || dispositivosCambio || terminalesCambio);
    
    // ✅ LOG PARA DEBUG
    if (hayCambios) {
      console.log('🔍 Cambios detectados:', {
        cliente: !!clienteCambio,
        dispositivos: !!dispositivosCambio,
        terminales: !!terminalesCambio,
        paso: pasoActual
      });
    }

    return hayCambios;
  }, [
    cargando, 
    datosYaCargados, 
    enviando,
    clienteData, 
    datosOriginalesCliente,
    dispositivosAgregados, 
    datosOriginalesDispositivos,
    terminalesCompletos, 
    datosOriginalesTerminales,
    pasoActual
  ]);

  // ✅ ACTIVAR PROTECCIÓN DE DATOS
  const { protegido } = useProteccionDatos({
    hayDatosSinGuardar,
    mensajePersonalizado: `¡Atención! Tienes cambios sin guardar en la reparación ${reparacionOriginal?.reparacion?.numero_orden || `ID-${id}`}.\n\n¿Estás seguro de que quieres salir? Se perderán todos los cambios realizados.`
  });

  // Configuración de pasos para el panel lateral
  const pasos = [
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
    { number: 5, text: "Resumen", icon: "📋", description: "Resumen final" },
  ];

  // ✅ CARGA INICIAL CON GUARDADO DE DATOS ORIGINALES
  const cargarDatosReparacion = useCallback(async () => {
    if (!id) return;

    try {
      setCargando(true);
      console.log("📥 Cargando datos de reparación ID:", id);
      const response = await fetch(
        `http://localhost:5001/api/reparaciones/${id}`
      );
      const result = await response.json();

      if (result.success && result.data) {
        const datos = result.data;
        setReparacionOriginal(datos);

        console.log("✅ Cargando datos como si fuera nueva reparación...");
        console.log("📊 DEBUG - Datos recibidos:", {
          dispositivos: datos.dispositivos.length,
          averias: datos.averias.length,
          muestraDispositivos: datos.dispositivos.map(d => ({ id: d.id, marca: d.marca_nombre, modelo: d.modelo_nombre })),
          muestraAverias: datos.averias.map(a => ({ id: a.id, reparacion_detalle_id: a.reparacion_detalle_id, averia_nombre: a.averia_nombre }))
        });

        // ✅ HIDRATAR CLIENTE
        const cliente: ClienteData = {
          nombre: datos.reparacion.nombre,
          apellidos: datos.reparacion.apellidos,
          dni: datos.reparacion.dni,
          telefono: datos.reparacion.telefono,
          email: datos.reparacion.email || "",
          direccion: datos.reparacion.direccion || "",
          codigoPostal: datos.reparacion.codigo_postal || "",
          ciudad: "",
        };
        setClienteData(cliente);
        setDatosOriginalesCliente({...cliente}); // ✅ GUARDAR ORIGINAL
        setClienteValido(true);

        // ✅ HIDRATAR DISPOSITIVOS
        const dispositivos: DispositivoGuardado[] = datos.dispositivos.map(
          (dispositivo: any, index: number) => ({
            id: dispositivo.id,
            orden: index + 1,
            marca: dispositivo.marca_nombre,
            modelo: dispositivo.modelo_nombre,
            imei: dispositivo.imei || "",
            numero_serie: dispositivo.numero_serie || "",
            color: dispositivo.color || "",
            capacidad: dispositivo.capacidad || "",
            observaciones: dispositivo.observaciones_recepcion || "",
            fechaCreacion: new Date(dispositivo.fecha_recepcion),
            requiere_backup: dispositivo.requiere_backup || false,
            patron_desbloqueo: dispositivo.patron_desbloqueo || "",
            backup_realizado: dispositivo.backup_realizado || false,
            estado_dispositivo: dispositivo.estado_dispositivo || "recibido",
            fecha_recepcion: dispositivo.fecha_recepcion,
            fecha_entrega: dispositivo.fecha_entrega || undefined,
          })
        );

        console.log("📱 Dispositivos hidratados:", dispositivos.length);
        setDispositivosAgregados(dispositivos);
        setDatosOriginalesDispositivos([...dispositivos]); // ✅ GUARDAR ORIGINAL
        setDispositivosValidos(dispositivos.length > 0);

        // ✅ HIDRATAR TERMINALES COMPLETOS
        const terminales: TerminalCompleto[] = dispositivos.map(
          (dispositivo) => {
            // Buscar averías de este dispositivo
            const averiasDispositivo = datos.averias.filter(
              (averia: AveriaDetalle) =>
                averia.reparacion_detalle_id === dispositivo.id
            );
            
            console.log(`🔍 Averías para dispositivo ${dispositivo.id}:`, {
              dispositivo_id: dispositivo.id,
              averias_encontradas: averiasDispositivo.length,
              averias: averiasDispositivo.map(a => ({ id: a.id, nombre: a.averia_nombre }))
            });

            // Crear diagnóstico desde BD
            let diagnostico: DiagnosticoData | null = null;
            if (averiasDispositivo.length > 0) {
              const primeraAveria = averiasDispositivo[0];
              diagnostico = {
                tipo_servicio:
                  (primeraAveria.tipo_servicio as
                    | "reparacion"
                    | "diagnostico"
                    | "mantenimiento") || "reparacion",
                problemas_reportados: averiasDispositivo.map(
                  (a: AveriaDetalle) => a.averia_nombre
                ),
                sintomas_adicionales: primeraAveria.sintomas_observados || "",
                prioridad:
                  (primeraAveria.prioridad as
                    | "normal"
                    | "urgente"
                    | "express") || "normal",
                requiere_backup: dispositivo.requiere_backup || false,
                patron_desbloqueo: dispositivo.patron_desbloqueo || "",
                observaciones_tecnicas:
                  primeraAveria.observaciones_tecnicas || "",
              };
            }

            // Crear presupuesto desde BD
            let presupuesto: PresupuestoData | null = null;
            if (averiasDispositivo.length > 0) {
              const presupuestoPorAveria = averiasDispositivo.map(
                (averia: AveriaDetalle) => ({
                  problema: averia.averia_nombre,
                  items: (averia.servicios || []).map(
                    (servicio: ServicioDetalle) => ({
                      intervencion_id: servicio.id,
                      concepto: servicio.concepto,
                      precio: parseFloat(String(servicio.precio_unitario)) || 0,
                      cantidad: parseInt(String(servicio.cantidad)) || 1,
                      tipo: (servicio.tipo === "mano_obra"
                        ? "servicio"
                        : "repuesto") as "servicio" | "repuesto",
                    })
                  ),
                })
              );

              const todosLosItems = presupuestoPorAveria.flatMap(
                (p) => p.items
              );

              presupuesto = {
                items: todosLosItems,
                presupuestoPorAveria,
                descuento:
                  parseFloat(String(datos.reparacion.descuento_general)) || 0,
                tipo_descuento:
                  (datos.reparacion.tipo_descuento_general as
                    | "porcentaje"
                    | "cantidad") || "porcentaje",
                notas_presupuesto: datos.reparacion.notas_generales || "",
                validez_dias: datos.reparacion.validez_presupuesto_dias || 15,
                requiere_anticipo: datos.reparacion.anticipo_requerido || false,
                porcentaje_anticipo: datos.reparacion.porcentaje_anticipo || 0,
              };
            }

            return {
              dispositivo,
              diagnostico,
              presupuesto,
              diagnosticoCompletado: diagnostico !== null,
              presupuestoCompletado: presupuesto !== null,
              fechaUltimaModificacion: new Date(),
            };
          }
        );

        console.log("🖥️ Terminales hidratados:", terminales.length);
        setTerminalesCompletos(terminales);
        setDatosOriginalesTerminales([...terminales]); // ✅ GUARDAR ORIGINAL con deep copy

        // Determinar paso inicial
        const pasoInicial = pasoParam ? parseInt(pasoParam) : 1;
        if (pasoActual === 1) {
          setPasoActual(pasoInicial);
        }

        console.log("✅ Datos hidratados y originales guardados:", {
          cliente: cliente.nombre,
          dispositivos: dispositivos.length,
          terminales: terminales.length,
          pasoInicial,
        });

        setDatosYaCargados(true);
      } else {
        throw new Error(result.message || "Error cargando reparación");
      }
    } catch (error) {
      console.error("❌ Error cargando reparación:", error);
      setDatosYaCargados(true);
      notificarErrorEdicion(
        error instanceof Error ? error.message : "Error desconocido"
      );
      navigate("/reparaciones");
    } finally {
      setCargando(false);
    }
  }, [id, navigate]);

  // ✅ Solo cargar datos una vez al montar
  useEffect(() => {
    if (id && !datosYaCargados) {
      console.log("🔄 Cargando datos por primera vez para ID:", id);
      cargarDatosReparacion();
    }
  }, [id, datosYaCargados]);

  // Estado calculado del proceso
  const estadoProceso = useMemo(() => {
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

  // Función para determinar el estado de cada paso
  const getEstadoPaso = useCallback(
    (numeroPaso: number) => {
      if (numeroPaso < pasoActual) return "completado";
      if (numeroPaso === pasoActual) return "actual";
      return "pendiente";
    },
    [pasoActual]
  );

  // Funciones de navegación
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

  const avanzarPaso = useCallback(() => {
    const siguientePaso = pasoActual + 1;
    if (siguientePaso <= 5 && puedeAvanzarAPaso(siguientePaso)) {
      setPasoActual(siguientePaso);
      navigate(`/reparaciones/editar/${id}/${siguientePaso}`, {
        replace: true,
      });
    }
  }, [pasoActual, puedeAvanzarAPaso, navigate, id]);

  const retrocederPaso = useCallback(() => {
    if (pasoActual > 1) {
      const anteriorPaso = pasoActual - 1;
      setPasoActual(anteriorPaso);
      navigate(`/reparaciones/editar/${id}/${anteriorPaso}`, { replace: true });
    }
  }, [pasoActual, navigate, id]);

  // Funciones de manejo de datos
  const manejarCambioCliente = useCallback(
    (cliente: ClienteData, esValido: boolean) => {
      setClienteData(cliente);
      setClienteValido(esValido);
    },
    []
  );

  const manejarCambioDispositivos = useCallback(
    (dispositivos: DispositivoGuardado[], esValido: boolean) => {
      console.log('🔄 Manejando cambio de dispositivos:', dispositivos.length);
      
      // Asignar IDs temporales a dispositivos nuevos
      const dispositivosConId = dispositivos.map(dispositivo => {
        if (!dispositivo.id || dispositivo.id === 0) {
          return {
            ...dispositivo,
            id: -(Date.now() + Math.random() * 1000)
          };
        }
        return dispositivo;
      });
      
      setDispositivosAgregados(dispositivosConId);
      setDispositivosValidos(esValido);
      
      // Sincronizar terminales inmediatamente
      sincronizarTerminalesConDispositivos(dispositivosConId);
      
      console.log('✅ Dispositivos actualizados y terminales sincronizados');
    },
    []
  );

  // Sincronizar terminales con dispositivos
  const sincronizarTerminalesConDispositivos = useCallback((dispositivos: DispositivoGuardado[]) => {
    console.log('🔄 Sincronizando terminales con dispositivos...');
    
    if (dispositivos.length === 0) {
      setTerminalesCompletos([]);
      return;
    }
    
    setTerminalesCompletos(prevTerminales => {
      const nuevosTerminales: TerminalCompleto[] = dispositivos.map(dispositivo => {
        const terminalExistente = prevTerminales.find(terminal => {
          return terminal.dispositivo.id === dispositivo.id;
        });
        
        if (terminalExistente) {
          return {
            ...terminalExistente,
            dispositivo: { ...dispositivo },
            fechaUltimaModificacion: new Date(),
          };
        } else {
          return {
            dispositivo,
            diagnostico: null,
            presupuesto: null,
            diagnosticoCompletado: false,
            presupuestoCompletado: false,
            fechaUltimaModificacion: new Date(),
          };
        }
      });
      
      return nuevosTerminales;
    });
  }, [terminalesCompletos]);

  // Funciones de terminales
  const guardarDiagnostico = useCallback(
    (terminalId: number, diagnostico: DiagnosticoData) => {
      console.log('💾 Guardando diagnóstico para terminal:', terminalId);
      setTerminalesCompletos((prev) =>
        prev.map((terminal) =>
          terminal.dispositivo.id === terminalId
            ? {
                ...terminal,
                diagnostico: { ...diagnostico },
                diagnosticoCompletado: true,
                fechaUltimaModificacion: new Date(),
              }
            : terminal
        )
      );
    },
    []
  );

  const editarDiagnostico = useCallback((terminalId: number) => {
    console.log('✏️ Editando diagnóstico para terminal:', terminalId);
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
    (terminalId: number, presupuesto: PresupuestoData) => {
      console.log('💰 Guardando presupuesto para terminal:', terminalId);
      setTerminalesCompletos((prev) =>
        prev.map((terminal) =>
          terminal.dispositivo.id === terminalId
            ? {
                ...terminal,
                presupuesto: { ...presupuesto },
                presupuestoCompletado: true,
                fechaUltimaModificacion: new Date(),
              }
            : terminal
        )
      );
    },
    []
  );

  const editarPresupuesto = useCallback((terminalId: number) => {
    console.log('💰 Editando presupuesto para terminal:', terminalId);
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

  // Cálculos globales
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

  // ✅ GUARDADO CON DESACTIVACIÓN TEMPORAL DE PROTECCIÓN
  const enviarReparacion = useCallback(async () => {
    setEnviando(true); // ✅ Esto desactiva automáticamente la protección

    try {
      if (!clienteValido || !dispositivosValidos) {
        throw new Error("Datos incompletos");
      }

      if (!estadoProceso.presupuestosCompletos) {
        throw new Error("Faltan presupuestos por completar");
      }

      console.log("📤 Enviando actualización con análisis automático...");

      const datosActualizados = {
        cliente: clienteData,
        terminales: terminalesCompletos.map((terminal) => ({
          dispositivo: {
            ...(terminal.dispositivo.id > 0 && { id: terminal.dispositivo.id }),
            marca: terminal.dispositivo.marca,
            modelo: terminal.dispositivo.modelo,
            imei: terminal.dispositivo.imei,
            numero_serie: terminal.dispositivo.numero_serie,
            color: terminal.dispositivo.color,
            capacidad: terminal.dispositivo.capacidad,
            observaciones: terminal.dispositivo.observaciones,
            es_nuevo: terminal.dispositivo.id <= 0
          },
          diagnostico: terminal.diagnostico,
          presupuesto: terminal.presupuesto,
        })),
        totales: totalesGlobales,
        reparacion_id: parseInt(id!),
      };

      const response = await fetch(
        `http://localhost:5001/api/reparaciones/${id}/actualizar-completa`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(datosActualizados),
        }
      );

      const resultado = await response.json();

      if (resultado.success) {
        console.log("✅ Backend procesó cambios automáticamente:", resultado.data);

        notificarReparacionEditada(
          resultado.data?.numero_orden ||
            reparacionOriginal?.reparacion?.numero_orden ||
            `ID-${id}`
        );

        // ✅ ACTUALIZAR DATOS ORIGINALES para evitar protección al navegar
        if (resultado.data) {
          console.log('🔄 Actualizando datos originales tras guardado exitoso...');
          setDatosOriginalesCliente({...clienteData});
          setDatosOriginalesDispositivos([...dispositivosAgregados]);
          setDatosOriginalesTerminales([...terminalesCompletos]);
        }

        navigate("/reparaciones");
      } else {
        throw new Error(
          resultado.message || "Error al actualizar la reparación"
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido";
      console.error("❌ Error actualizando reparación:", errorMessage);
      notificarErrorEdicion(errorMessage);
    } finally {
      setEnviando(false); // ✅ Esto reactiva la protección si hay cambios
    }
  }, [
    clienteValido,
    dispositivosValidos,
    estadoProceso,
    clienteData,
    terminalesCompletos,
    totalesGlobales,
    id,
    navigate,
    notificarReparacionEditada,
    notificarErrorEdicion,
    reparacionOriginal,
    dispositivosAgregados,
  ]);

  // ✅ CANCELAR CON CONFIRMACIÓN SI HAY CAMBIOS
  const cancelarEdicion = useCallback(() => {
    if (hayDatosSinGuardar) {
      const confirmar = window.confirm(
        `¿Estás seguro de que quieres cancelar la edición?\n\nSe perderán todos los cambios realizados en la reparación ${reparacionOriginal?.reparacion?.numero_orden || `ID-${id}`}.`
      );
      
      if (!confirmar) {
        return; // No cancelar si el usuario decide continuar
      }
    }
    
    console.log('🚪 Cancelando edición...');
    navigate("/reparaciones");
  }, [hayDatosSinGuardar, navigate, reparacionOriginal, id]);

  // Mostrar loading
  if (cargando) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando datos de la reparación...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
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
                  Editar Reparación
                </h1>
                <p className="text-sm text-gray-500">
                  {reparacionOriginal?.reparacion?.numero_orden || `ID: ${id}`}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* ✅ INDICADOR DE PROTECCIÓN ACTIVA */}
              {protegido && (
                <div className="flex items-center px-3 py-1 bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-sm">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L5.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span className="font-medium">Cambios sin guardar</span>
                </div>
              )}
              
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

      {/* Contenido principal */}
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col xl:flex-row gap-6 xl:gap-8">
          {/* Área principal de contenido */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              
              {/* Paso 1: Cliente */}
              {pasoActual === 1 && (
                <Paso1Cliente
                  onClienteChange={manejarCambioCliente}
                  onNext={avanzarPaso}
                  isValid={clienteValido}
                  clienteInicial={clienteData}
                />
              )}

              {/* Paso 2: Dispositivos Múltiples */}
              {pasoActual === 2 && (
                <Paso2DispositivosMultiples
                  onDispositivosChange={manejarCambioDispositivos}
                  onNext={avanzarPaso}
                  onPrev={retrocederPaso}
                  isValid={dispositivosValidos}
                  dispositivosIniciales={dispositivosAgregados}
                />
              )}

              {/* Paso 3: Diagnóstico */}
              {pasoActual === 3 && (
                <Paso3DiagnosticoPorTerminal
                  terminalesCompletos={terminalesCompletos}
                  onGuardarDiagnostico={guardarDiagnostico}
                  onEditarDiagnostico={editarDiagnostico}
                  onNext={avanzarPaso}
                  onBack={retrocederPaso}
                />
              )}

              {/* Paso 4: Presupuesto */}
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
                  onReset={cancelarEdicion}
                  isLoading={enviando}
                />
              )}
            </div>
          </div>

          {/* Panel lateral de progreso */}
          <div className="xl:w-80 xl:flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 xl:sticky xl:top-6">
              {/* Header del panel */}
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                  <span className="text-white text-2xl">✏️</span>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Editando
                  </h3>
                  <p className="text-sm text-gray-500">
                    Paso {pasoActual} de {pasos.length}
                  </p>
                </div>
              </div>

              {/* ✅ INDICADOR DE ESTADO DE PROTECCIÓN */}
              {protegido && (
                <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center text-amber-800 text-sm">
                    <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <div>
                      <div className="font-medium">Protección Activada</div>
                      <div className="text-xs mt-1">Los cambios se guardarán automáticamente al salir</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Lista de pasos */}
              <div className="space-y-4">
                {pasos.map((paso) => {
                  const estado = getEstadoPaso(paso.number);
                  return (
                    <div key={paso.number} className="flex items-center">
                      {/* Círculo numerado con estados */}
                      <div
                        className={`
                        w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300
                        ${
                          estado === "completado"
                            ? "bg-green-500 text-white shadow-lg"
                            : estado === "actual"
                            ? "bg-orange-500 text-white shadow-lg ring-4 ring-orange-100"
                            : "bg-gray-200 text-gray-500"
                        }
                      `}
                      >
                        {estado === "completado" ? "✓" : paso.number}
                      </div>

                      {/* Información del paso */}
                      <div className="ml-4 flex-1">
                        <div
                          className={`font-medium transition-all duration-300 ${
                            estado === "actual"
                              ? "text-orange-600"
                              : estado === "completado"
                              ? "text-green-600"
                              : "text-gray-500"
                          }`}
                        >
                          {paso.text}
                        </div>
                        <div className="text-xs text-gray-400">
                          {paso.description}
                        </div>
                      </div>

                      {/* Icono del paso */}
                      <div className="text-lg">{paso.icon}</div>
                    </div>
                  );
                })}
              </div>

              {/* Información de la reparación original */}
              {reparacionOriginal && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">
                    Reparación Original
                  </h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Orden:</span>{" "}
                      {reparacionOriginal.reparacion.numero_orden}
                    </div>
                    <div>
                      <span className="font-medium">Estado:</span>{" "}
                      {reparacionOriginal.reparacion.estado_general}
                    </div>
                    <div>
                      <span className="font-medium">Fecha:</span>{" "}
                      {new Date(
                        reparacionOriginal.reparacion.fecha_ingreso
                      ).toLocaleDateString("es-ES")}
                    </div>
                    <div>
                      <span className="font-medium">Total Original:</span> €
                      {Number(
                        reparacionOriginal.reparacion.total_final
                      ).toFixed(2)}
                    </div>
                  </div>
                </div>
              )}

              {/* Información del cliente hidratado */}
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

              {/* Totales actuales dinámicos */}
              {totalesGlobales.total > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">
                    Totales Actuales
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

                  {/* Comparación con total original */}
                  {reparacionOriginal && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="text-xs text-gray-500">
                        <div className="flex justify-between">
                          <span>Original:</span>
                          <span>
                            €
                            {Number(
                              reparacionOriginal.reparacion.total_final
                            ).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between font-medium">
                          <span>Diferencia:</span>
                          <span
                            className={
                              totalesGlobales.total >
                              Number(reparacionOriginal.reparacion.total_final)
                                ? "text-red-600"
                                : totalesGlobales.total <
                                  Number(
                                    reparacionOriginal.reparacion.total_final
                                  )
                                ? "text-green-600"
                                : "text-gray-600"
                            }
                          >
                            {totalesGlobales.total >
                            Number(reparacionOriginal.reparacion.total_final)
                              ? "+"
                              : ""}
                            €
                            {(
                              totalesGlobales.total -
                              Number(reparacionOriginal.reparacion.total_final)
                            ).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Indicador de dispositivos hidratados */}
              {dispositivosValidos && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">
                    Dispositivos
                  </h4>
                  <div className="space-y-2">
                    {dispositivosAgregados.map((dispositivo, index) => (
                      <div
                        key={dispositivo.id || index}
                        className="text-xs text-gray-600 flex items-center"
                      >
                        <div
                          className={`w-2 h-2 rounded-full mr-2 ${
                            dispositivo.id > 0 ? "bg-blue-500" : "bg-green-500"
                          }`}
                        ></div>
                        <div className="flex-1">
                          {dispositivo.marca} {dispositivo.modelo}
                        </div>
                        <div className="text-xs text-gray-400">
                          {dispositivo.id > 0 ? "BD" : "Nuevo"}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    💡 <span className="text-blue-600">BD</span> = Desde base de
                    datos,
                    <span className="text-green-600"> Nuevo</span> = Agregado en
                    edición
                  </div>
                </div>
              )}

              {/* Estado del proceso */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">
                  Estado del Proceso
                </h4>
                <div className="space-y-2 text-xs">
                  <div
                    className={`flex items-center ${
                      clienteValido ? "text-green-600" : "text-gray-400"
                    }`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full mr-2 ${
                        clienteValido ? "bg-green-500" : "bg-gray-300"
                      }`}
                    ></div>
                    Cliente válido
                  </div>
                  <div
                    className={`flex items-center ${
                      dispositivosValidos ? "text-green-600" : "text-gray-400"
                    }`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full mr-2 ${
                        dispositivosValidos ? "bg-green-500" : "bg-gray-300"
                      }`}
                    ></div>
                    Dispositivos válidos
                  </div>
                  <div
                    className={`flex items-center ${
                      estadoProceso.diagnosticosCompletos
                        ? "text-green-600"
                        : "text-gray-400"
                    }`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full mr-2 ${
                        estadoProceso.diagnosticosCompletos
                          ? "bg-green-500"
                          : "bg-gray-300"
                      }`}
                    ></div>
                    Diagnósticos completos
                  </div>
                  <div
                    className={`flex items-center ${
                      estadoProceso.presupuestosCompletos
                        ? "text-green-600"
                        : "text-gray-400"
                    }`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full mr-2 ${
                        estadoProceso.presupuestosCompletos
                          ? "bg-green-500"
                          : "bg-gray-300"
                      }`}
                    ></div>
                    Presupuestos completos
                  </div>
                </div>
              </div>

              {/* ✅ MENSAJE INFORMATIVO CON ESTADO DE PROTECCIÓN */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className={`border rounded-lg p-3 ${protegido ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'}`}>
                  <div className={`text-xs ${protegido ? 'text-amber-800' : 'text-blue-800'}`}>
                    <div className="font-medium mb-1 flex items-center">
                      {protegido ? '🛡️' : '💡'} {protegido ? 'Protección Activa' : 'Modo Edición Inteligente'}
                    </div>
                    {protegido ? (
                      <div>
                        <div>• Hay cambios sin guardar</div>
                        <div>• Se te avisará antes de salir</div>
                        <div>• Guarda para desactivar protección</div>
                      </div>
                    ) : (
                      <div>
                        <div>• Funciona igual que nueva reparación</div>
                        <div>• Los cambios se guardan automáticamente</div>
                        <div>• Backend analiza diferencias al guardar</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditarReparacion;