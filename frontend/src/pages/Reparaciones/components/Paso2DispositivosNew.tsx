// pages/Reparaciones/components/Paso2DispositivosNew.tsx - Versión optimizada con API V2
import React, { useState, useCallback, useEffect } from "react";
import {
  DevicePhoneMobileIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

import { DispositivoGuardado } from "../../../types/Dispositivo";
import { useNotification } from "../../../contexts/NotificationContext";
import catalogosApi from "../../../services/catalogosApi";

interface Paso2DispositivosNewProps {
  onDispositivosChange: (dispositivos: DispositivoGuardado[], isValid: boolean) => void;
  onNext: () => void;
  onPrev: () => void;
  isValid: boolean;
  dispositivosIniciales?: DispositivoGuardado[];
}

interface Marca {
  id: number;
  nombre: string;
  logo_url?: string;
}

interface Modelo {
  id: number;
  nombre: string;
  marca_nombre: string;
  imagen_url?: string;
}

const Paso2DispositivosNew: React.FC<Paso2DispositivosNewProps> = ({
  onDispositivosChange,
  onNext,
  onPrev,
  dispositivosIniciales = [],
}) => {
  const { showWarning, showError, showSuccess, showInfo } = useNotification();

  // Estados principales
  const [dispositivos, setDispositivos] = useState<DispositivoGuardado[]>(dispositivosIniciales);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [cargandoMarcas, setCargandoMarcas] = useState(false);
  const [cargandoModelos, setCargandoModelos] = useState(false);

  // Estados del formulario actual
  const [formData, setFormData] = useState({
    marca: "",
    modelo: "",
    imei: "",
    numero_serie: "",
    color: "",
    capacidad: "",
    observaciones: "",
  });

  const [marcaSeleccionada, setMarcaSeleccionada] = useState<number | null>(null);
  const [modeloSeleccionado, setModeloSeleccionado] = useState<number | null>(null);

  // Cargar marcas al montar el componente
  useEffect(() => {
    cargarMarcas();
  }, []);

  // Cargar marcas desde API V2
  const cargarMarcas = async () => {
    setCargandoMarcas(true);
    try {
      const response = await catalogosApi.obtenerMarcas();
      if (response.success) {
        setMarcas(response.data);
        console.log('✅ Marcas cargadas:', response.data.length);
      }
    } catch (error) {
      console.error('❌ Error cargando marcas:', error);
      showError('Error', 'No se pudieron cargar las marcas');
    } finally {
      setCargandoMarcas(false);
    }
  };

  // Cargar modelos cuando se selecciona una marca
  const cargarModelos = async (marcaId: number) => {
    setCargandoModelos(true);
    try {
      const response = await catalogosApi.obtenerModelosPorMarca(marcaId);
      if (response.success) {
        setModelos(response.data);
        console.log(`✅ Modelos cargados para marca ${marcaId}:`, response.data.length);
      }
    } catch (error) {
      console.error(`❌ Error cargando modelos para marca ${marcaId}:`, error);
      showError('Error', 'No se pudieron cargar los modelos');
      setModelos([]);
    } finally {
      setCargandoModelos(false);
    }
  };

  // Manejar selección de marca
  const handleMarcaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const marcaId = parseInt(e.target.value);
    const marca = marcas.find(m => m.id === marcaId);

    if (marca) {
      setMarcaSeleccionada(marcaId);
      setFormData(prev => ({ ...prev, marca: marca.nombre, modelo: "" }));
      setModeloSeleccionado(null);
      cargarModelos(marcaId);
    } else {
      setMarcaSeleccionada(null);
      setModelos([]);
      setFormData(prev => ({ ...prev, marca: "", modelo: "" }));
    }
  };

  // Manejar selección de modelo
  const handleModeloChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const modeloId = parseInt(e.target.value);
    const modelo = modelos.find(m => m.id === modeloId);

    if (modelo) {
      setModeloSeleccionado(modeloId);
      setFormData(prev => ({ ...prev, modelo: modelo.nombre }));
    } else {
      setModeloSeleccionado(null);
      setFormData(prev => ({ ...prev, modelo: "" }));
    }
  };

  // Manejar cambios en campos del formulario
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Validar formulario actual
  const validarFormulario = () => {
    if (!formData.marca.trim()) {
      showWarning('Validación', 'Selecciona una marca');
      return false;
    }
    if (!formData.modelo.trim()) {
      showWarning('Validación', 'Selecciona un modelo');
      return false;
    }
    return true;
  };

  // Agregar dispositivo a la lista
  const agregarDispositivo = () => {
    if (!validarFormulario()) return;

    // Verificar si ya existe el mismo IMEI
    if (formData.imei && dispositivos.some(d => d.imei === formData.imei)) {
      showWarning('Duplicado', 'Ya existe un dispositivo con este IMEI');
      return;
    }

    const nuevoDispositivo: DispositivoGuardado = {
      id: Date.now(), // ID temporal
      marca: formData.marca,
      modelo: formData.modelo,
      imei: formData.imei || undefined,
      numero_serie: formData.numero_serie || undefined,
      color: formData.color || undefined,
      capacidad: formData.capacidad || undefined,
      observaciones: formData.observaciones || undefined,
    };

    const nuevosDispositivos = [...dispositivos, nuevoDispositivo];
    setDispositivos(nuevosDispositivos);

    // Notificar al componente padre
    onDispositivosChange(nuevosDispositivos, true);

    // Limpiar formulario
    setFormData({
      marca: "",
      modelo: "",
      imei: "",
      numero_serie: "",
      color: "",
      capacidad: "",
      observaciones: "",
    });
    setMarcaSeleccionada(null);
    setModeloSeleccionado(null);
    setModelos([]);

    showSuccess('Dispositivo agregado', `${nuevoDispositivo.marca} ${nuevoDispositivo.modelo} agregado correctamente`);
  };

  // Eliminar dispositivo de la lista
  const eliminarDispositivo = (id: number) => {
    const nuevosDispositivos = dispositivos.filter(d => d.id !== id);
    setDispositivos(nuevosDispositivos);
    onDispositivosChange(nuevosDispositivos, nuevosDispositivos.length > 0);
    
    showInfo('Dispositivo eliminado', 'Dispositivo removido de la lista');
  };

  // Notificar cambios al montar con datos iniciales
  useEffect(() => {
    if (dispositivos.length > 0) {
      onDispositivosChange(dispositivos, true);
    }
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-100">
        <div className="flex items-center">
          <DevicePhoneMobileIcon className="w-6 h-6 text-blue-600 mr-3" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Dispositivos a Reparar</h2>
            <p className="text-sm text-gray-600">Agrega los dispositivos que necesitan reparación</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Formulario para agregar dispositivo */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="text-md font-semibold text-gray-900 mb-4">Agregar Dispositivo</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Selector de Marca */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Marca *
              </label>
              <select
                value={marcaSeleccionada || ""}
                onChange={handleMarcaChange}
                disabled={cargandoMarcas}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">
                  {cargandoMarcas ? 'Cargando marcas...' : 'Selecciona una marca'}
                </option>
                {marcas.map(marca => (
                  <option key={marca.id} value={marca.id}>
                    {marca.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Selector de Modelo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Modelo *
              </label>
              <select
                value={modeloSeleccionado || ""}
                onChange={handleModeloChange}
                disabled={!marcaSeleccionada || cargandoModelos}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">
                  {!marcaSeleccionada 
                    ? 'Primero selecciona una marca'
                    : cargandoModelos 
                    ? 'Cargando modelos...'
                    : 'Selecciona un modelo'
                  }
                </option>
                {modelos.map(modelo => (
                  <option key={modelo.id} value={modelo.id}>
                    {modelo.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* IMEI */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                IMEI
              </label>
              <input
                type="text"
                name="imei"
                value={formData.imei}
                onChange={handleInputChange}
                placeholder="123456789012345"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Número de Serie */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de Serie
              </label>
              <input
                type="text"
                name="numero_serie"
                value={formData.numero_serie}
                onChange={handleInputChange}
                placeholder="Serie del dispositivo"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color
              </label>
              <input
                type="text"
                name="color"
                value={formData.color}
                onChange={handleInputChange}
                placeholder="Negro, Blanco, Azul..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Capacidad */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Capacidad
              </label>
              <select
                name="capacidad"
                value={formData.capacidad}
                onChange={(e) => setFormData(prev => ({ ...prev, capacidad: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Selecciona capacidad</option>
                <option value="64GB">64GB</option>
                <option value="128GB">128GB</option>
                <option value="256GB">256GB</option>
                <option value="512GB">512GB</option>
                <option value="1TB">1TB</option>
              </select>
            </div>
          </div>

          {/* Observaciones */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observaciones
            </label>
            <textarea
              name="observaciones"
              value={formData.observaciones}
              onChange={handleInputChange}
              rows={2}
              placeholder="Estado físico, daños visibles, accesorios incluidos..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Botón Agregar */}
          <div className="mt-4">
            <button
              onClick={agregarDispositivo}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Agregar Dispositivo
            </button>
          </div>
        </div>

        {/* Lista de dispositivos agregados */}
        {dispositivos.length > 0 && (
          <div className="mb-6">
            <h3 className="text-md font-semibold text-gray-900 mb-4">
              Dispositivos Agregados ({dispositivos.length})
            </h3>
            <div className="space-y-3">
              {dispositivos.map((dispositivo) => (
                <div key={dispositivo.id} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <DevicePhoneMobileIcon className="w-5 h-5 text-gray-400 mr-2" />
                        <span className="font-semibold text-gray-900">
                          {dispositivo.marca} {dispositivo.modelo}
                        </span>
                      </div>
                      <div className="mt-1 text-sm text-gray-600 grid grid-cols-2 gap-4">
                        {dispositivo.imei && (
                          <div>IMEI: {dispositivo.imei}</div>
                        )}
                        {dispositivo.color && (
                          <div>Color: {dispositivo.color}</div>
                        )}
                        {dispositivo.capacidad && (
                          <div>Capacidad: {dispositivo.capacidad}</div>
                        )}
                        {dispositivo.numero_serie && (
                          <div>S/N: {dispositivo.numero_serie}</div>
                        )}
                      </div>
                      {dispositivo.observaciones && (
                        <div className="mt-2 text-sm text-gray-500">
                          {dispositivo.observaciones}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => eliminarDispositivo(dispositivo.id)}
                      className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-md"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Información de ayuda */}
        {dispositivos.length === 0 && (
          <div className="text-center py-8">
            <DevicePhoneMobileIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No hay dispositivos agregados</p>
            <p className="text-sm text-gray-400">Utiliza el formulario superior para agregar dispositivos</p>
          </div>
        )}

        {/* Botones de navegación */}
        <div className="flex justify-between pt-6 border-t border-gray-200">
          <button
            onClick={onPrev}
            className="flex items-center px-6 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Anterior
          </button>

          <button
            onClick={onNext}
            disabled={dispositivos.length === 0}
            className={`flex items-center px-6 py-2 rounded-md ${
              dispositivos.length > 0
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

export default Paso2DispositivosNew;