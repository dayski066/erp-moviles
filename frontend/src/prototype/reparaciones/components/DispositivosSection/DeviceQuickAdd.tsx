import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PlusIcon, 
  CameraIcon,
  DevicePhoneMobileIcon
} from '@heroicons/react/24/outline';
import { useReparacionFlow } from '../../hooks/useReparacionFlow';
import { Dispositivo } from '../../types/reparacion.types';

export const DeviceQuickAdd: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [formData, setFormData] = useState({
    marca: '',
    modelo: '',
    imei: '',
    numero_serie: '',
    color: '',
    capacidad: '',
    observaciones: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { addDispositivo, validateIMEI } = useReparacionFlow();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpiar error del campo
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.marca.trim()) {
      newErrors.marca = 'La marca es requerida';
    }
    if (!formData.modelo.trim()) {
      newErrors.modelo = 'El modelo es requerido';
    }
    if (formData.imei && formData.imei.length !== 15) {
      newErrors.imei = 'El IMEI debe tener 15 dígitos';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      await addDispositivo(formData);
      setIsExpanded(false);
      setFormData({
        marca: '',
        modelo: '',
        imei: '',
        numero_serie: '',
        color: '',
        capacidad: '',
        observaciones: ''
      });
      setErrors({});
    } catch (error) {
      console.error('Error añadiendo dispositivo:', error);
    }
  };

  const handleScanIMEI = async () => {
    // TODO: Implementar escáner de IMEI
    console.log('Escanear IMEI');
  };

  const handleIMEIValidation = async () => {
    if (formData.imei && formData.imei.length === 15) {
      try {
        const result = await validateIMEI(formData.imei);
        if (result.valid && result.device) {
          // Auto-rellenar con datos del dispositivo
          setFormData(prev => ({
            ...prev,
            marca: result.device.marca || prev.marca,
            modelo: result.device.modelo || prev.modelo
          }));
        }
      } catch (error) {
        console.error('Error validando IMEI:', error);
      }
    }
  };

  const isFormValid = () => {
    return formData.marca.trim() && 
           formData.modelo.trim() &&
           Object.keys(errors).length === 0;
  };

  const colorOptions = [
    'Negro', 'Blanco', 'Azul', 'Rojo', 'Verde', 'Amarillo', 
    'Rosa', 'Púrpura', 'Gris', 'Plateado', 'Dorado'
  ];

  const capacityOptions = [
    '16GB', '32GB', '64GB', '128GB', '256GB', '512GB', '1TB'
  ];

  return (
    <div className="border-t border-gray-200 pt-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium"
      >
        <PlusIcon className="w-4 h-4" />
        <span>Añadir dispositivo</span>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200"
          >
            <div className="flex items-center space-x-2 mb-4">
              <DevicePhoneMobileIcon className="w-5 h-5 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900">
                Nuevo Dispositivo
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Marca *
                  </label>
                  <input
                    type="text"
                    value={formData.marca}
                    onChange={(e) => handleInputChange('marca', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.marca ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Apple, Samsung, etc."
                  />
                  {errors.marca && (
                    <p className="text-sm text-red-600 mt-1">{errors.marca}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Modelo *
                  </label>
                  <input
                    type="text"
                    value={formData.modelo}
                    onChange={(e) => handleInputChange('modelo', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.modelo ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="iPhone 13, Galaxy S21, etc."
                  />
                  {errors.modelo && (
                    <p className="text-sm text-red-600 mt-1">{errors.modelo}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    IMEI
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={formData.imei}
                      onChange={(e) => handleInputChange('imei', e.target.value)}
                      onBlur={handleIMEIValidation}
                      className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.imei ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="15 dígitos"
                      maxLength={15}
                    />
                    <button
                      type="button"
                      onClick={handleScanIMEI}
                      className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <CameraIcon className="w-4 h-4" />
                    </button>
                  </div>
                  {errors.imei && (
                    <p className="text-sm text-red-600 mt-1">{errors.imei}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número de Serie
                  </label>
                  <input
                    type="text"
                    value={formData.numero_serie}
                    onChange={(e) => handleInputChange('numero_serie', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Opcional"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Color
                  </label>
                  <select
                    value={formData.color}
                    onChange={(e) => handleInputChange('color', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar color</option>
                    {colorOptions.map(color => (
                      <option key={color} value={color}>{color}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Capacidad
                  </label>
                  <select
                    value={formData.capacidad}
                    onChange={(e) => handleInputChange('capacidad', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar capacidad</option>
                    {capacityOptions.map(capacity => (
                      <option key={capacity} value={capacity}>{capacity}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observaciones
                </label>
                <textarea
                  value={formData.observaciones}
                  onChange={(e) => handleInputChange('observaciones', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Descripción del problema, estado del dispositivo, etc."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!isFormValid()}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Añadir Dispositivo
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}; 