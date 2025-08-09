// pages/Reparaciones/components/Paso2DispositivosMultiples.tsx - PARTE 1/3
import React, { useState, useCallback, useEffect } from "react";
import {
  DevicePhoneMobileIcon,
  ArrowRightIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  TrashIcon,
  ArrowLeftIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";

import { useEstados } from "../../../hooks/useEstados";
import { ModalGestionEstados } from "../../../components/core/Common/ModalGestionEstados";

import {
  DispositivoData,
  DispositivoGuardado,
  CAPACIDADES_COMUNES,
} from "../../../types/Dispositivo";
import type {
  Marca,
  Modelo,
  DispositivoBusqueda,
} from "../../../types/Catalogo";
import { useCatalogos } from "../../../hooks/useCatalogos";
import { useNotification } from "../../../contexts/NotificationContext";
import { useSugerenciasInteligentes, type SugerenciaDispositivo } from "../../../hooks/useSugerenciasInteligentes";

interface Paso2DispositivoProps {
  onDispositivosChange: (
    dispositivos: DispositivoGuardado[],
    isValid: boolean
  ) => void;
  onNext: () => void;
  onPrev: () => void;
  isValid: boolean;
  dispositivosIniciales?: DispositivoGuardado[];
}

const Paso2Dispositivo: React.FC<Paso2DispositivoProps> = ({
  onDispositivosChange,
  onNext,
  onPrev,
  dispositivosIniciales = [],
}) => {
  const {
    marcas,
    modelos,
    cargandoMarcas,
    cargandoModelos,
    errorMarcas,
    errorModelos,
    cargarModelos,
    buscarDispositivos,
    cargarMarcas,
    crearModelo,
    actualizarMarca,
    eliminarMarca,
    eliminarModelo,
    actualizarModelo,
  } = useCatalogos();

  const { showWarning, showError, showSuccess } = useNotification();
  const { obtenerSugerenciasDispositivos } = useSugerenciasInteligentes();
  
  // ✅ HOOK para estados unificados
  console.log('🔧 Paso2Dispositivo - Inicializando useEstados hook');
  const { getOpcionesEstados } = useEstados();
  console.log('📱 Paso2Dispositivo - Obteniendo opciones de estados unificados');
  const opcionesEstadosDispositivo = getOpcionesEstados();
  console.log('✅ Paso2Dispositivo - Opciones obtenidas:', opcionesEstadosDispositivo.length, 'elementos');

  // Estados para el formulario actual
  const [formData, setFormData] = useState<DispositivoData>({
    marca: "",
    modelo: "",
    capacidad: "",
    color: "",
    imei: "",
    estado: "",
    observaciones: "",
    numero_serie: "",
  });

  // Lista de dispositivos agregados (carga inicial si existe)
  const [dispositivosAgregados, setDispositivosAgregados] = useState<
    DispositivoGuardado[]
  >(dispositivosIniciales);

  const [marcaSeleccionada, setMarcaSeleccionada] = useState<number | null>(
    null
  );
  const [busquedaTermino, setBusquedaTermino] = useState("");
  const [resultadosBusqueda, setResultadosBusqueda] = useState<
    DispositivoBusqueda[]
  >([]);
  const [mostrandoBusqueda, setMostrandoBusqueda] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [mostrarModalMarca, setMostrarModalMarca] = useState(false);
  const [mostrarModalModelo, setMostrarModalModelo] = useState(false);
  const [modoModal, setModoModal] = useState<"crear" | "editar">("crear");
  const [marcaEditando, setMarcaEditando] = useState<number | null>(null);
  const [nuevaMarca, setNuevaMarca] = useState({
    nombre: "",
    emoji: "📱",
    tipo_icono: "emoji" as "emoji" | "imagen",
    archivo: null as File | null,
  });
  const [previewIcono, setPreviewIcono] = useState("");
  const [nuevoModelo, setNuevoModelo] = useState({ nombre: "" });

  const [showDeleteMarcaModal, setShowDeleteMarcaModal] = useState<
    number | null
  >(null);
  const [showDeleteModeloModal, setShowDeleteModeloModal] = useState<
    number | null
  >(null);
  const [modoModalModelo, setModoModalModelo] = useState<"crear" | "editar">(
    "crear"
  );
  const [modeloEditando, setModeloEditando] = useState<number | null>(null);
  
  // ✅ Estados para modal de gestión de estados
  const [modalEstadosAbierto, setModalEstadosAbierto] = useState(false);
  const [estadoParaEditar, setEstadoParaEditar] = useState<string>("");
  
  // ✅ NUEVO: Estados para sugerencias de dispositivos
  const [sugerenciasDispositivos, setSugerenciasDispositivos] = useState<SugerenciaDispositivo[]>([]);
  const [mostrarSugerenciasDispositivos, setMostrarSugerenciasDispositivos] = useState(false);

  // Validar formulario actual
  const formularioValido = !!(
    formData.marca &&
    formData.modelo &&
    formData.imei &&
    formData.estado
  );

  // Notificar cambios al componente padre (ahora envía toda la lista)
  useEffect(() => {
    const isValid = dispositivosAgregados.length > 0;
    onDispositivosChange(dispositivosAgregados, isValid);
  }, [dispositivosAgregados, onDispositivosChange]);

  // ✅ NUEVA FUNCIÓN: Validar IMEI duplicado
  const isImeiDuplicado = useCallback((imei: string): boolean => {
    if (!imei || imei.length !== 15) return false;
    return dispositivosAgregados.some(dispositivo => dispositivo.imei === imei);
  }, [dispositivosAgregados]);


  // ✅ NUEVO: Cargar sugerencias de dispositivos
  useEffect(() => {
    const cargarSugerencias = () => {
      const sugerencias = obtenerSugerenciasDispositivos();
      setSugerenciasDispositivos(sugerencias);
      setMostrarSugerenciasDispositivos(sugerencias.length > 0);
    };

    cargarSugerencias();
  }, [obtenerSugerenciasDispositivos]);

  const updateField = useCallback(
    (field: keyof DispositivoData, value: string) => {
      setFormData(prevFormData => {
        const newFormData = { ...prevFormData, [field]: value };
        return newFormData;
      });
    },
    []
  );

  // ✅ NUEVO: Aplicar sugerencia de dispositivo
  const aplicarSugerenciaDispositivo = useCallback((sugerencia: SugerenciaDispositivo) => {
    // Encontrar la marca para establecer marcaSeleccionada
    const marca: Marca | undefined = marcas.find(
      (m) => m.nombre === sugerencia.marca
    );
    
    if (marca) {
      setMarcaSeleccionada(marca.id);
      cargarModelos(marca.id);
      
      // Actualizar formData directamente
      setFormData(prevFormData => ({
        ...prevFormData,
        marca: sugerencia.marca,
        modelo: sugerencia.modelo
      }));
      
      showSuccess(
        'Sugerencia Aplicada',
        `Dispositivo ${sugerencia.marca} ${sugerencia.modelo} pre-seleccionado`
      );
    }
  }, [marcas, cargarModelos, showSuccess]);

  // ✅ 1. LIMPIAR FORMULARIO (DEBE IR PRIMERA)
  const limpiarFormulario = useCallback(() => {
    setFormData({
      marca: "",
      modelo: "",
      capacidad: "",
      color: "",
      imei: "",
      estado: "",
      observaciones: "",
      numero_serie: "",
    });
    setMarcaSeleccionada(null);
    setBusquedaTermino("");
    setMostrandoBusqueda(false);
  }, []);

  // ✅ 2. CERRAR MODAL MARCA (DEBE IR SEGUNDA)
  const cerrarModalMarca = useCallback(() => {
    setMostrarModalMarca(false);
    setModoModal("crear");
    setMarcaEditando(null);
    setNuevaMarca({
      nombre: "",
      emoji: "📱",
      tipo_icono: "emoji",
      archivo: null,
    });
    setPreviewIcono("");
  }, []);

  // ✅ 3. AGREGAR DISPOSITIVO (TERCERA - USA limpiarFormulario)
  const agregarDispositivo = useCallback(() => {
    if (!formularioValido) return;

    // Verificar IMEI duplicado
    const imeiExiste = dispositivosAgregados.some(
      (d) => d.imei === formData.imei
    );
    if (imeiExiste) {
      showWarning(
        "IMEI Duplicado",
        "Ya existe un dispositivo con este IMEI en la lista."
      );
      return;
    }

    const nuevoDispositivo: DispositivoGuardado = {
      ...formData,
      id: Date.now(), // ID temporal
      orden: dispositivosAgregados.length + 1,
      fechaCreacion: new Date(),
      numero_serie: formData.numero_serie || "", // Asegurar que no sea undefined
    };

    setDispositivosAgregados((prev) => [...prev, nuevoDispositivo]);

    // Limpiar formulario para el siguiente dispositivo
    limpiarFormulario();

    showSuccess(
      "Dispositivo Agregado",
      `El ${nuevoDispositivo.marca} ${nuevoDispositivo.modelo} se ha añadido a la lista.`
    );
    console.log("✅ Dispositivo agregado:", nuevoDispositivo);
  }, [
    formData,
    formularioValido,
    dispositivosAgregados,
    showWarning,
    showSuccess,
    limpiarFormulario,
  ]);

  // Eliminar dispositivo de la lista
  const eliminarDispositivo = useCallback((id: number) => {
    setDispositivosAgregados((prev) => {
      const nuevaLista = prev.filter((d) => d.id !== id);
      // Reordenar números
      return nuevaLista.map((dispositivo, index) => ({
        ...dispositivo,
        orden: index + 1,
      }));
    });
  }, []);

  const handleBusquedaChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const valor = e.target.value;
      setBusquedaTermino(valor);
      if (valor.length < 2) {
        setResultadosBusqueda([]);
        setMostrandoBusqueda(false);
        return;
      }
      setBuscando(true);
      try {
        const resultados = await buscarDispositivos(valor);
        setResultadosBusqueda(resultados);
        setMostrandoBusqueda(resultados.length > 0);
      } catch (error) {
        console.error("Error en búsqueda:", error);
      } finally {
        setBuscando(false);
      }
    },
    [buscarDispositivos]
  );

  const seleccionarResultadoBusqueda = useCallback(
    (resultado: DispositivoBusqueda) => {
      const marca: Marca | undefined = marcas.find(
        (m) => m.nombre === resultado.marca
      );
      if (marca) {
        setMarcaSeleccionada(marca.id);
        cargarModelos(marca.id);
        
        // Actualizar formData directamente para asegurar sincronización
        const nuevoFormData = {
          ...formData,
          marca: resultado.marca,
          modelo: resultado.modelo !== "Todos los modelos" ? resultado.modelo : ""
        };
        setFormData(nuevoFormData);
      }
      setBusquedaTermino("");
      setMostrandoBusqueda(false);
    },
    [marcas, cargarModelos, formData]
  );

  const handleMarcaChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const marcaId = parseInt(e.target.value);
      setMarcaSeleccionada(marcaId);
      const marca = marcas.find((m) => m.id === marcaId);
      if (marca) {
        const newData = { ...formData, marca: marca.nombre, modelo: "" };
        setFormData(newData);
        cargarModelos(marcaId);
      } else {
        setFormData({ ...formData, marca: "", modelo: "" });
      }
    },
    [formData, marcas, cargarModelos]
  );

  // ✅ 4. CREAR NUEVA MARCA (USA cerrarModalMarca)
  const crearNuevaMarca = useCallback(async () => {
    if (!nuevaMarca.nombre.trim()) return;

    try {
      const formData = new FormData();
      formData.append("nombre", nuevaMarca.nombre);
      formData.append("tipo_icono", nuevaMarca.tipo_icono);

      if (nuevaMarca.tipo_icono === "emoji") {
        formData.append("logo_emoji", nuevaMarca.emoji);
      } else if (nuevaMarca.tipo_icono === "imagen" && nuevaMarca.archivo) {
        formData.append("icono", nuevaMarca.archivo);
      } else {
        showError("Error", "Selecciona un emoji o sube una imagen");
        return;
      }

      console.log("📤 Creando marca:", {
        nombre: nuevaMarca.nombre,
        tipo_icono: nuevaMarca.tipo_icono,
        emoji: nuevaMarca.emoji,
        archivo: nuevaMarca.archivo?.name,
      });

      const response = await fetch(
        "http://localhost:5001/api/catalogos/marcas",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (data.success) {
        await cargarMarcas();
        cerrarModalMarca();
        showSuccess(
          "Marca Creada",
          `La marca "${data.data.nombre}" se ha creado exitosamente.`
        );
      } else {
        throw new Error(data.message || "No se pudo crear la marca");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido";
      console.error("❌ Error creando marca:", error);
      showError(
        "Error al Crear Marca",
        `No se pudo crear la marca: ${errorMessage}`
      );
    }
  }, [nuevaMarca, showSuccess, showError, cargarMarcas, cerrarModalMarca]);

  // ✅ 5. ACTUALIZAR MARCA EXISTENTE (USA cerrarModalMarca)
  const actualizarMarcaExistente = useCallback(async () => {
    if (!nuevaMarca.nombre.trim() || !marcaEditando) return;

    try {
      const formData = new FormData();
      formData.append("nombre", nuevaMarca.nombre);
      formData.append("tipo_icono", nuevaMarca.tipo_icono);

      if (nuevaMarca.tipo_icono === "emoji") {
        formData.append("logo_emoji", nuevaMarca.emoji);
      } else if (nuevaMarca.tipo_icono === "imagen" && nuevaMarca.archivo) {
        formData.append("icono", nuevaMarca.archivo);
      } else if (nuevaMarca.tipo_icono === "imagen") {
        // Si es imagen pero no hay archivo nuevo, mantener el actual
        // El backend mantendrá la imagen actual
      } else {
        showError("Error", "Selecciona un emoji o sube una imagen");
        return;
      }

      console.log("📝 Actualizando marca ID:", marcaEditando, {
        nombre: nuevaMarca.nombre,
        tipo_icono: nuevaMarca.tipo_icono,
        emoji: nuevaMarca.emoji,
        archivo: nuevaMarca.archivo?.name,
      });

      // Usar la función del hook
      const exito = await actualizarMarca(marcaEditando, formData);

      if (exito) {
        cerrarModalMarca();
        showSuccess(
          "Marca Actualizada",
          `La marca "${nuevaMarca.nombre}" se ha actualizado exitosamente.`
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido";
      console.error("❌ Error actualizando marca:", error);
      showError(
        "Error al Actualizar Marca",
        `No se pudo actualizar la marca: ${errorMessage}`
      );
    }
  }, [
    nuevaMarca,
    marcaEditando,
    actualizarMarca,
    showSuccess,
    showError,
    cerrarModalMarca,
  ]);

  // FUNCIONES PARA MANEJAR MODALES
  const abrirModalCrear = useCallback(() => {
    setModoModal("crear");
    setMarcaEditando(null);
    setNuevaMarca({
      nombre: "",
      emoji: "📱",
      tipo_icono: "emoji",
      archivo: null,
    });
    setPreviewIcono("");
    setMostrarModalMarca(true);
  }, []);

  const abrirModalEditar = useCallback(() => {
    if (!marcaSeleccionada) return;

    const marca = marcas.find((m) => m.id === marcaSeleccionada);
    if (!marca) return;

    console.log("📝 Editando marca:", marca);

    setModoModal("editar");
    setMarcaEditando(marcaSeleccionada);
    setNuevaMarca({
      nombre: marca.nombre,
      emoji: marca.logo_emoji || "📱",
      tipo_icono: marca.tipo_icono || "emoji",
      archivo: null,
    });

    // Si tiene icono de imagen, mostrar preview
    if (marca.tipo_icono === "imagen" && marca.icono_path) {
      setPreviewIcono(`http://localhost:5001/logos/${marca.icono_path}`);
    } else {
      setPreviewIcono("");
    }

    setMostrarModalMarca(true);
  }, [marcaSeleccionada, marcas]);

  const manejarArchivoIcono = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        if (!file.type.startsWith("image/")) {
          showError("Archivo Inválido", "Solo se permiten imágenes");
          return;
        }
        if (file.size > 2 * 1024 * 1024) {
          showError("Archivo Grande", "Máximo 2MB");
          return;
        }

        setNuevaMarca((prev) => ({
          ...prev,
          archivo: file,
          tipo_icono: "imagen",
        }));

        const reader = new FileReader();
        reader.onload = (e) => setPreviewIcono(e.target?.result as string);
        reader.readAsDataURL(file);
      }
    },
    [showError]
  );

  // ✅ NUEVA FUNCIÓN: Eliminar marca
  const eliminarMarcaSeleccionada = useCallback(async () => {
    if (!showDeleteMarcaModal) return;

    try {
      await eliminarMarca(showDeleteMarcaModal);
      setShowDeleteMarcaModal(null);
      setMarcaSeleccionada(null);
      setFormData({ ...formData, marca: "", modelo: "" });
      showSuccess("Marca Eliminada", "La marca se ha eliminado exitosamente.");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido";
      console.error("Error eliminando marca:", error);
      showError(
        "Error al Eliminar Marca",
        `No se pudo eliminar la marca: ${errorMessage}`
      );
    }
  }, [showDeleteMarcaModal, eliminarMarca, formData, showSuccess, showError]);

  // ✅ NUEVA FUNCIÓN: Eliminar modelo
  const eliminarModeloSeleccionado = useCallback(async () => {
    if (!showDeleteModeloModal) return;

    try {
      await eliminarModelo(showDeleteModeloModal);
      setShowDeleteModeloModal(null);
      updateField("modelo", "");
      showSuccess(
        "Modelo Eliminado",
        "El modelo se ha eliminado exitosamente."
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido";
      console.error("Error eliminando modelo:", error);
      showError(
        "Error al Eliminar Modelo",
        `No se pudo eliminar el modelo: ${errorMessage}`
      );
    }
  }, [
    showDeleteModeloModal,
    eliminarModelo,
    updateField,
    showSuccess,
    showError,
  ]);

  // ✅ NUEVA FUNCIÓN: Abrir modal editar modelo
  const abrirModalEditarModelo = useCallback(() => {
    const modeloSeleccionado = modelos.find(
      (m) => m.nombre === formData.modelo
    );
    if (!modeloSeleccionado) return;

    setModoModalModelo("editar");
    setModeloEditando(modeloSeleccionado.id);
    setNuevoModelo({ nombre: modeloSeleccionado.nombre });
    setMostrarModalModelo(true);
  }, [modelos, formData.modelo]);

  // ✅ FUNCIÓN ACTUALIZADA: Crear/Actualizar modelo
  const crearOActualizarModelo = useCallback(async () => {
    if (!nuevoModelo.nombre.trim() || !marcaSeleccionada) return;

    try {
      if (modoModalModelo === "crear") {
        await crearModelo(marcaSeleccionada, nuevoModelo.nombre);
        updateField("modelo", nuevoModelo.nombre);
        showSuccess(
          "Modelo Creado",
          `El modelo "${nuevoModelo.nombre}" se ha creado exitosamente.`
        );
      } else {
        if (!modeloEditando) return;
        await actualizarModelo(
          modeloEditando,
          nuevoModelo.nombre,
          marcaSeleccionada
        );
        updateField("modelo", nuevoModelo.nombre);
        showSuccess(
          "Modelo Actualizado",
          `El modelo "${nuevoModelo.nombre}" se ha actualizado exitosamente.`
        );
      }

      setMostrarModalModelo(false);
      setNuevoModelo({ nombre: "" });
      setModoModalModelo("crear");
      setModeloEditando(null);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido";
      console.error("Error con modelo:", error);
      showError(
        `Error al ${
          modoModalModelo === "crear" ? "Crear" : "Actualizar"
        } Modelo`,
        `No se pudo ${
          modoModalModelo === "crear" ? "crear" : "actualizar"
        } el modelo: ${errorMessage}`
      );
    }
  }, [
    nuevoModelo,
    marcaSeleccionada,
    modoModalModelo,
    modeloEditando,
    crearModelo,
    actualizarModelo,
    updateField,
    showSuccess,
    showError,
  ]);

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-green-100 text-green-800 p-6 border-b border-green-200">
        <h5 className="text-xl font-semibold flex items-center">
          <DevicePhoneMobileIcon className="w-6 h-6 mr-3" />
          Información de Dispositivos ({dispositivosAgregados.length} agregados)
        </h5>
      </div>

      <div className="p-4 sm:p-6">
        {/* Formulario para agregar nuevo dispositivo */}
        <div className="bg-gradient-to-r from-gray-50 to-green-50 rounded-xl p-4 sm:p-6 border border-gray-200 mb-6">
          <h6 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <PlusIcon className="w-5 h-5 mr-2 text-green-600" />
            {dispositivosAgregados.length === 0
              ? "Agregar Primer Dispositivo"
              : "Agregar Otro Dispositivo"}
          </h6>

          {/* Búsqueda rápida */}
          <div className="mb-6">
            <h6 className="text-md font-medium text-gray-900 mb-3 flex items-center">
              <MagnifyingGlassIcon className="w-5 h-5 mr-2 text-green-600" />
              Búsqueda Rápida
            </h6>
            <div className="relative">
              <div className="flex space-x-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={busquedaTermino}
                    onChange={handleBusquedaChange}
                    className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder="Buscar por marca o modelo (ej: iPhone 15, Samsung Galaxy...)"
                  />
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  {buscando && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-500"></div>
                    </div>
                  )}
                </div>
              </div>
              {mostrandoBusqueda && resultadosBusqueda.length > 0 && (
                <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg">
                  {resultadosBusqueda.map((resultado, index) => (
                    <button
                      key={index}
                      onClick={() => seleccionarResultadoBusqueda(resultado)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center transition-colors border-b border-gray-100 last:border-b-0"
                    >
                      <DevicePhoneMobileIcon className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <div className="font-medium text-gray-900">
                          {resultado.marca}
                        </div>
                        <div className="text-sm text-gray-600">
                          {resultado.modelo}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ✅ NUEVA SECCIÓN: Sugerencias de dispositivos */}
          {mostrarSugerenciasDispositivos && sugerenciasDispositivos.length > 0 && (
            <div className="mb-6 p-4 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg border border-cyan-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-cyan-900 flex items-center">
                  <span className="text-lg mr-2">🤖</span>
                  Dispositivos Sugeridos
                </h4>
                <button
                  onClick={() => setMostrarSugerenciasDispositivos(false)}
                  className="text-sm text-cyan-600 hover:text-cyan-800"
                >
                  Ocultar
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {sugerenciasDispositivos.slice(0, 6).map((sugerencia, index) => (
                  <button
                    key={index}
                    onClick={() => aplicarSugerenciaDispositivo(sugerencia)}
                    className="p-3 bg-white border border-cyan-200 rounded-lg hover:border-cyan-400 hover:bg-cyan-50 transition-all text-center group"
                  >
                    <div className="font-medium text-sm text-gray-900 group-hover:text-cyan-900">
                      {sugerencia.marca}
                    </div>
                    <div className="text-xs text-gray-600 group-hover:text-cyan-700">
                      {sugerencia.modelo}
                    </div>
                    <div className="text-xs text-cyan-600 mt-1">
                      {sugerencia.tipo === 'dispositivo_popular' 
                        ? `🔥 ${sugerencia.frecuencia} veces` 
                        : `👤 ${sugerencia.cliente_relacionado?.split(' ')[0]}`
                      }
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Campos del formulario */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 overflow-hidden">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Marca <span className="text-red-500">*</span>
              </label>
              {errorMarcas && (
                <div className="mb-2 text-red-600 text-sm">
                  Error: {errorMarcas}
                </div>
              )}
              <div className="flex flex-col md:flex-row md:flex-wrap gap-2 overflow-hidden">
                {/* Cuadro del logo a la izquierda - Mismo grosor que el selector */}
                <div className="h-12 px-4 py-3 border border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 flex-shrink-0 min-w-[48px]">
                  {(marcaSeleccionada &&
                    (() => {
                      const marcaActual = marcas.find(
                        (m) => m.id === marcaSeleccionada
                      );
                      if (!marcaActual)
                        return <span className="text-gray-400">📱</span>;

                      return marcaActual.tipo_icono === "imagen" &&
                        marcaActual.icono_path ? (
                        <img
                          src={`http://localhost:5001/logos/${marcaActual.icono_path}`}
                          alt={marcaActual.nombre}
                          className="w-12 h-12 object-contain"
                        />
                      ) : (
                        <span className="text-3xl">
                          {marcaActual.logo_emoji || "📱"}
                        </span>
                      );
                    })()) || <span className="text-gray-400 text-3xl">📱</span>}
                </div>

                {/* Select limpio (sin emojis) */}
                <select
                  value={marcaSeleccionada || ""}
                  onChange={handleMarcaChange}
                  className="min-w-0 flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  disabled={cargandoMarcas}
                >
                  <option value="">
                    {cargandoMarcas
                      ? "Cargando marcas..."
                      : "Selecciona una marca"}
                  </option>
                  {marcas.map((marca) => (
                    <option key={marca.id} value={marca.id}>
                      {marca.nombre}
                    </option>
                  ))}
                </select>

                {/* Botones de marca - Responsivos */}
                <div className="flex gap-1 justify-center md:justify-start">
                  <button
                    onClick={abrirModalCrear}
                    className="w-10 h-10 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all flex items-center justify-center"
                    title="Crear nueva marca"
                    disabled={cargandoMarcas}
                  >
                    <PlusIcon className="w-4 h-4" />
                  </button>

                  <button
                    onClick={abrirModalEditar}
                    disabled={!marcaSeleccionada || cargandoMarcas}
                    className="w-10 h-10 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
                    title="Editar marca seleccionada"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setShowDeleteMarcaModal(marcaSeleccionada)}
                    disabled={!marcaSeleccionada || cargandoMarcas}
                    className="w-10 h-10 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
                    title="Eliminar marca seleccionada"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Modelo <span className="text-red-500">*</span>
              </label>
              {errorModelos && (
                <div className="mb-2 text-red-600 text-sm">
                  Error: {errorModelos}
                </div>
              )}
              <div className="flex flex-col md:flex-row md:flex-wrap gap-2 overflow-hidden">
                <select
                  value={formData.modelo}
                  onChange={(e) => updateField("modelo", e.target.value)}
                  className="min-w-0 flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  disabled={!marcaSeleccionada || cargandoModelos}
                >
                  <option value="">
                    {!marcaSeleccionada
                      ? "Primero selecciona una marca"
                      : cargandoModelos
                      ? "Cargando modelos..."
                      : "Selecciona un modelo"}
                  </option>
                  {modelos.map((modelo: Modelo) => (
                    <option key={modelo.id} value={modelo.nombre}>
                      {modelo.nombre}
                    </option>
                  ))}
                </select>
                <div className="flex gap-1 justify-center md:justify-start">
                  <button
                    onClick={() => {
                      setModoModalModelo("crear");
                      setNuevoModelo({ nombre: "" });
                      setMostrarModalModelo(true);
                    }}
                    disabled={!marcaSeleccionada}
                    className="w-10 h-10 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
                    title="Crear nuevo modelo"
                  >
                    <PlusIcon className="w-4 h-4" />
                  </button>

                  <button
                    onClick={abrirModalEditarModelo}
                    disabled={!marcaSeleccionada || !formData.modelo}
                    className="w-10 h-10 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
                    title="Editar modelo seleccionado"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      const modeloSeleccionado = modelos.find(
                        (m) => m.nombre === formData.modelo
                      );
                      if (modeloSeleccionado)
                        setShowDeleteModeloModal(modeloSeleccionado.id);
                    }}
                    disabled={!marcaSeleccionada || !formData.modelo}
                    className="w-10 h-10 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
                    title="Eliminar modelo seleccionado"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Capacidad{" "}
                <span className="text-gray-500 text-xs">(opcional)</span>
              </label>
              <select
                value={formData.capacidad}
                onChange={(e) => updateField("capacidad", e.target.value)}
                className="min-w-0 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              >
                <option value="">Selecciona capacidad</option>
                {CAPACIDADES_COMUNES.map((capacidad) => (
                  <option key={capacidad} value={capacidad}>
                    {capacidad}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color <span className="text-gray-500 text-xs">(opcional)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.color}
                  onChange={(e) => updateField("color", e.target.value)}
                  className={`
                    pr-12 min-w-0 w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all
                    ${formData.color.trim().length > 0 ? 'border-green-500 bg-green-50' : 'border-gray-300'}
                  `}
                  placeholder="Ej: Negro, Blanco, Azul..."
                />
                {/* Indicador visual */}
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  {formData.color.trim().length > 0 && (
                    <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                IMEI <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.imei}
                  onChange={(e) => updateField("imei", e.target.value.replace(/[^0-9]/g, ''))}
                  className={`
                    pr-16 w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all font-mono
                    ${isImeiDuplicado(formData.imei) 
                      ? 'border-red-500 bg-red-50' 
                      : formData.imei.length === 15 
                        ? 'border-green-500 bg-green-50' 
                        : formData.imei.length > 0 
                          ? 'border-amber-400' 
                          : 'border-gray-300'
                    }
                  `}
                  placeholder="123456789012345"
                  maxLength={15}
                />
                {/* Indicador visual en tiempo real */}
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center space-x-2">
                  <div className="text-xs text-gray-500 font-mono">
                    {formData.imei.length}/15
                  </div>
                  {isImeiDuplicado(formData.imei) ? (
                    <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                    </svg>
                  ) : formData.imei.length === 15 ? (
                    <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                  ) : null}
                </div>
              </div>
              {/* Mensajes de ayuda */}
              {isImeiDuplicado(formData.imei) ? (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                  </svg>
                  Este IMEI ya existe en la lista de dispositivos
                </p>
              ) : formData.imei.length > 0 && formData.imei.length < 15 ? (
                <p className="mt-1 text-sm text-amber-600 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                  </svg>
                  El IMEI debe tener exactamente 15 dígitos
                </p>
              ) : formData.imei.length === 15 ? (
                <p className="mt-1 text-sm text-green-600 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  IMEI válido
                </p>
              ) : null}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de Serie{" "}
                <span className="text-gray-500 text-xs">(opcional)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.numero_serie || ""}
                  onChange={(e) => updateField("numero_serie", e.target.value.toUpperCase())}
                  className={`
                    pr-12 w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all font-mono uppercase
                    ${formData.numero_serie && formData.numero_serie.length > 0 ? 'border-green-500 bg-green-50' : 'border-gray-300'}
                  `}
                  placeholder="ABC123456789"
                />
                {/* Indicador visual */}
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  {formData.numero_serie && formData.numero_serie.length > 0 && (
                    <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                  )}
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado <span className="text-red-500">*</span>
              </label>
              <div className="flex space-x-2">
                <select
                  value={formData.estado}
                  onChange={(e) => updateField("estado", e.target.value)}
                  className={`
                    flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all
                    ${formData.estado ? 'border-green-500 bg-green-50' : 'border-gray-300'}
                  `}
                >
                  <option value="">Selecciona estado</option>
                  {opcionesEstadosDispositivo.map((opcion) => (
                    <option key={opcion.value} value={opcion.value}>
                      {opcion.label}
                    </option>
                  ))}
                </select>
                
                {/* Botón para añadir nuevo estado */}
                <button
                  type="button"
                  onClick={() => setModalEstadosAbierto(true)}
                  className="px-3 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                  title="Gestionar estados"
                >
                  <PlusIcon className="w-5 h-5" />
                </button>
                
                {/* Botón para editar estado seleccionado */}
                {formData.estado && (
                  <button
                    type="button"
                    onClick={() => {
                      setEstadoParaEditar(formData.estado);
                      setModalEstadosAbierto(true);
                    }}
                    className="px-3 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                    title="Editar estado actual"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observaciones{" "}
              <span className="text-gray-500 text-xs">(opcional)</span>
            </label>
            <textarea
              value={formData.observaciones}
              onChange={(e) => updateField("observaciones", e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              rows={3}
              placeholder="Detalles adicionales sobre el dispositivo, daños visibles, accesorios incluidos..."
            />
          </div>

          {/* Botón para agregar dispositivo */}
          <div className="flex justify-center">
            <button
              onClick={agregarDispositivo}
              disabled={!formularioValido}
              className={`
                flex items-center px-8 py-3 rounded-lg font-medium transition-all
                ${
                  formularioValido
                    ? "bg-green-600 text-white hover:bg-green-700 shadow-lg"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }
              `}
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Agregar Dispositivo a la Lista
            </button>
          </div>
        </div>

        {/* Lista de dispositivos agregados en formato tabla */}
        {dispositivosAgregados.length > 0 && (
          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h6 className="text-lg font-semibold text-blue-900 mb-4">
              📋 Dispositivos Agregados ({dispositivosAgregados.length})
            </h6>
            <div className="bg-white rounded-lg overflow-hidden border border-blue-200">
              {/* Versión de tabla para pantallas grandes */}
              <div className="hidden md:block">
                <table className="w-full">
                <thead className="bg-blue-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-blue-900">
                      #
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-blue-900">
                      Dispositivo
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-blue-900">
                      IMEI
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-blue-900">
                      Detalles
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-blue-900">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-blue-900">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {dispositivosAgregados.map((dispositivo) => (
                    <tr
                      key={dispositivo.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {dispositivo.orden}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-semibold text-gray-900">
                            📱 {dispositivo.marca} {dispositivo.modelo}
                          </div>
                          {dispositivo.numero_serie && (
                            <div className="text-xs text-gray-500 font-mono">
                              S/N: {dispositivo.numero_serie}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-mono text-sm text-gray-700">
                          {dispositivo.imei}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          {dispositivo.color && (
                            <div className="text-sm text-gray-600">
                              🎨 {dispositivo.color}
                            </div>
                          )}
                          {dispositivo.capacidad && (
                            <div className="text-sm text-gray-600">
                              💾 {dispositivo.capacidad}
                            </div>
                          )}
                          {!dispositivo.color && !dispositivo.capacidad && (
                            <div className="text-xs text-gray-400">
                              Sin detalles
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ✅ {dispositivo.estado}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => eliminarDispositivo(dispositivo.id)}
                          className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-full transition-all"
                          title="Eliminar dispositivo"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                </table>
              </div>
              
              {/* Versión de cards para pantallas pequeñas */}
              <div className="md:hidden space-y-3 p-4">
                {dispositivosAgregados.map((dispositivo, index) => (
                  <div key={dispositivo.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center">
                        <span className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                          {index + 1}
                        </span>
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {dispositivo.marca} {dispositivo.modelo}
                          </h4>
                          <p className="text-sm text-gray-600">IMEI: {dispositivo.imei}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => eliminarDispositivo(dispositivo.id)}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all"
                        title="Eliminar dispositivo"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Capacidad:</span>
                        <span className="ml-1 font-medium">{dispositivo.capacidad || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Color:</span>
                        <span className="ml-1 font-medium">{dispositivo.color || "N/A"}</span>
                      </div>
                    </div>
                    {dispositivo.observaciones && (
                      <div className="mt-2 text-sm">
                        <span className="text-gray-500">Observaciones:</span>
                        <p className="text-gray-700 mt-1">{dispositivo.observaciones}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-3 text-sm text-blue-700 bg-blue-100 px-3 py-2 rounded-lg">
              💡 <strong>Total:</strong> {dispositivosAgregados.length}{" "}
              dispositivo{dispositivosAgregados.length !== 1 ? "s" : ""}{" "}
              preparado{dispositivosAgregados.length !== 1 ? "s" : ""} para
              diagnóstico
            </div>
          </div>
        )}

        {/* Botones de navegación - Responsive */}
        <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
          <button
            onClick={onPrev}
            className="flex items-center justify-center px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Volver a Cliente
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:space-x-4">
            {dispositivosAgregados.length > 0 && (
              <button
                onClick={limpiarFormulario}
                className="text-gray-600 hover:text-gray-800 font-medium"
              >
                Limpiar Formulario
              </button>
            )}

            <button
              onClick={onNext}
              disabled={dispositivosAgregados.length === 0}
              className={`
               flex items-center px-6 py-3 rounded-lg font-medium transition-all
               ${
                 dispositivosAgregados.length > 0
                   ? "bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 shadow-lg"
                   : "bg-gray-300 text-gray-500 cursor-not-allowed"
               }
             `}
            >
              <span>
                Continuar a Diagnóstico ({dispositivosAgregados.length}{" "}
                dispositivos)
              </span>
              <ArrowRightIcon className="w-5 h-5 ml-2" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal mejorado para marcas */}
      {mostrarModalMarca && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              {modoModal === "crear" ? "Crear Nueva Marca" : "Editar Marca"}
            </h3>
            <div className="space-y-4">
              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la marca
                </label>
                <input
                  type="text"
                  value={nuevaMarca.nombre}
                  onChange={(e) =>
                    setNuevaMarca((prev) => ({
                      ...prev,
                      nombre: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="Ej: Samsung, Xiaomi..."
                />
              </div>

              {/* Tipo de icono */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de icono
                </label>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() =>
                      setNuevaMarca((prev) => ({
                        ...prev,
                        tipo_icono: "emoji",
                      }))
                    }
                    className={`flex-1 p-3 border-2 rounded-lg text-center ${
                      nuevaMarca.tipo_icono === "emoji"
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200"
                    }`}
                  >
                    <div className="text-xl">😀</div>
                    <div className="text-xs">Emoji</div>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setNuevaMarca((prev) => ({
                        ...prev,
                        tipo_icono: "imagen",
                      }))
                    }
                    className={`flex-1 p-3 border-2 rounded-lg text-center ${
                      nuevaMarca.tipo_icono === "imagen"
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200"
                    }`}
                  >
                    <div className="text-xl">🖼️</div>
                    <div className="text-xs">Imagen</div>
                  </button>
                </div>
              </div>

              {/* Campo emoji */}
              {nuevaMarca.tipo_icono === "emoji" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Emoji
                  </label>
                  <input
                    type="text"
                    value={nuevaMarca.emoji}
                    onChange={(e) =>
                      setNuevaMarca((prev) => ({
                        ...prev,
                        emoji: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="📱"
                    maxLength={2}
                  />
                </div>
              )}

              {/* Campo imagen */}
              {nuevaMarca.tipo_icono === "imagen" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subir Imagen
                  </label>
                  {previewIcono && (
                    <div className="mb-2 text-center">
                      <img
                        src={previewIcono}
                        alt="Preview"
                        className="w-12 h-12 mx-auto border rounded"
                      />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={manejarArchivoIcono}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    PNG, JPG, SVG. Máximo 2MB.
                  </p>
                </div>
              )}
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={cerrarModalMarca}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                onClick={
                  modoModal === "crear"
                    ? crearNuevaMarca
                    : actualizarMarcaExistente
                }
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                disabled={!nuevaMarca.nombre.trim()}
              >
                {modoModal === "crear" ? "Crear Marca" : "Actualizar Marca"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para crear/editar modelo */}
      {mostrarModalModelo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              {modoModalModelo === "crear"
                ? "Crear Nuevo Modelo"
                : "Editar Modelo"}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Marca seleccionada
                </label>
                <div className="px-3 py-2 bg-gray-100 rounded-lg text-gray-700">
                  {marcas.find((m) => m.id === marcaSeleccionada)?.nombre ||
                    "No seleccionada"}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del modelo
                </label>
                <input
                  type="text"
                  value={nuevoModelo.nombre}
                  onChange={(e) =>
                    setNuevoModelo((prev) => ({
                      ...prev,
                      nombre: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="Ej: iPhone 16 Pro, Galaxy S25..."
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setMostrarModalModelo(false);
                  setNuevoModelo({ nombre: "" });
                  setModoModalModelo("crear");
                  setModeloEditando(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                onClick={crearOActualizarModelo}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                disabled={!nuevoModelo.nombre.trim() || !marcaSeleccionada}
              >
                {modoModalModelo === "crear"
                  ? "Crear Modelo"
                  : "Actualizar Modelo"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación para eliminar marca */}
      {showDeleteMarcaModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-start mb-4">
              <div className="flex-shrink-0 h-12 w-12 flex items-center justify-center rounded-full bg-red-100">
                <TrashIcon className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4 text-left">
                <h3 className="text-lg font-semibold text-gray-900">
                  Confirmar eliminación de marca
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  ¿Estás seguro de que quieres eliminar esta marca? Esta acción
                  no se puede deshacer y también eliminará la imagen asociada si
                  existe.
                </p>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowDeleteMarcaModal(null)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={eliminarMarcaSeleccionada}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all font-medium shadow-md hover:shadow-lg"
              >
                Eliminar marca
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación para eliminar modelo */}
      {showDeleteModeloModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-start mb-4">
              <div className="flex-shrink-0 h-12 w-12 flex items-center justify-center rounded-full bg-red-100">
                <TrashIcon className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4 text-left">
                <h3 className="text-lg font-semibold text-gray-900">
                  Confirmar eliminación de modelo
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  ¿Estás seguro de que quieres eliminar este modelo? Esta acción
                  no se puede deshacer.
                </p>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowDeleteModeloModal(null)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={eliminarModeloSeleccionado}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all font-medium shadow-md hover:shadow-lg"
              >
                Eliminar modelo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de gestión de estados */}
      <ModalGestionEstados
        isOpen={modalEstadosAbierto}
        onClose={() => {
          setModalEstadosAbierto(false);
          setEstadoParaEditar("");
        }}
        categoria="unificado"
        estadoSeleccionado={estadoParaEditar}
      />
    </div>
  );
};

export default Paso2Dispositivo;
