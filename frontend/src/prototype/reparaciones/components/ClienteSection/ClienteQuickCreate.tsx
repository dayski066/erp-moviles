import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useReparacionFlow } from '../../hooks/useReparacionFlow';
import { Cliente } from '../../types/reparacion.types';

export const ClienteQuickCreate: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    dni: '',
    telefono: '',
    email: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { createCliente } = useReparacionFlow();

  const handleInputChange = (field: string, value: string) => {
    let processedValue = value;
    
    // Procesar DNI/NIE específicamente
    if (field === 'dni') {
      // Convertir a mayúsculas y limpiar espacios
      processedValue = value.toUpperCase().replace(/\s/g, '');
      
      // Validar formato en tiempo real
      const dniPattern = /^[XYZ]?\d{7,8}[A-Z]$/;
      if (processedValue.length > 0 && !dniPattern.test(processedValue)) {
        // Mostrar error visual pero permitir seguir escribiendo
        setErrors(prev => ({ ...prev, dni: 'Formato DNI/NIE inválido' }));
      } else {
        // Limpiar error si el formato es correcto
        setErrors(prev => ({ ...prev, dni: '' }));
      }
    }
    
    setFormData(prev => ({ ...prev, [field]: processedValue }));
    
    // Limpiar error del campo (excepto DNI que se maneja arriba)
    if (field !== 'dni' && errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }
    if (!formData.apellidos.trim()) {
      newErrors.apellidos = 'Los apellidos son requeridos';
    }
    if (!formData.dni.trim()) {
      newErrors.dni = 'El DNI es requerido';
    } else if (!/^[XYZ]?\d{7,8}[A-Z]$/.test(formData.dni.toUpperCase())) {
      newErrors.dni = 'DNI/NIE inválido';
    }
    if (!formData.telefono.trim()) {
      newErrors.telefono = 'El teléfono es requerido';
    } else if (!/^[6789]\d{8}$/.test(formData.telefono)) {
      newErrors.telefono = 'Teléfono inválido';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      await createCliente(formData);
      setIsExpanded(false);
      setFormData({
        nombre: '',
        apellidos: '',
        dni: '',
        telefono: '',
        email: ''
      });
      setErrors({});
    } catch (error) {
      console.error('Error creando cliente:', error);
    }
  };

  const isFormValid = () => {
    return formData.nombre.trim() && 
           formData.apellidos.trim() && 
           formData.dni.trim() && 
           formData.telefono.trim() &&
           Object.keys(errors).length === 0;
  };

  return (
    <div className="border-t border-gray-200 pt-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium"
      >
        <UserPlusIcon className="w-4 h-4" />
        <span>Crear nuevo cliente</span>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Nuevo Cliente
              </h3>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => handleInputChange('nombre', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.nombre ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Nombre"
                  />
                  {errors.nombre && (
                    <p className="text-sm text-red-600 mt-1">{errors.nombre}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Apellidos *
                  </label>
                  <input
                    type="text"
                    value={formData.apellidos}
                    onChange={(e) => handleInputChange('apellidos', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.apellidos ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Apellidos"
                  />
                  {errors.apellidos && (
                    <p className="text-sm text-red-600 mt-1">{errors.apellidos}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    DNI/NIE *
                  </label>
                  <input
                    type="text"
                    value={formData.dni}
                    onChange={(e) => handleInputChange('dni', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono tracking-wider ${
                      errors.dni ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="12345678A"
                    maxLength={9}
                  />
                  {errors.dni && (
                    <p className="text-sm text-red-600 mt-1">{errors.dni}</p>
                  )}
                  {formData.dni && !errors.dni && (
                    <p className="text-xs text-green-600 mt-1">
                      ✓ Formato DNI/NIE válido
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono *
                  </label>
                  <input
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => handleInputChange('telefono', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.telefono ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="612345678"
                  />
                  {errors.telefono && (
                    <p className="text-sm text-red-600 mt-1">{errors.telefono}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="cliente@email.com"
                />
                {errors.email && (
                  <p className="text-sm text-red-600 mt-1">{errors.email}</p>
                )}
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
                  Crear Cliente
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}; 