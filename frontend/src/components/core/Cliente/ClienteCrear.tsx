import React, { useState, useEffect, useCallback } from 'react';
import type { ClienteData, ValidationErrors } from '../../../types/Cliente';

interface ClienteCrearProps {
  onClienteChange?: (cliente: ClienteData, isValid: boolean) => void;
  onValidationChange?: (isValid: boolean) => void;
  initialData?: Partial<ClienteData>;
  title?: string;
  showTitle?: boolean;
  disabled?: boolean;
  compact?: boolean;
}

const ClienteCrear: React.FC<ClienteCrearProps> = ({
  onClienteChange,
  onValidationChange,
  initialData = {},
  title = 'Datos del Cliente',
  showTitle = true,
  disabled = false,
  compact = false
}) => {
  const [formData, setFormData] = useState<ClienteData>({
    nombre: initialData.nombre || '',
    apellidos: initialData.apellidos || '',
    dni: initialData.dni || '',
    telefono: initialData.telefono || '',
    email: initialData.email || '',
    direccion: initialData.direccion || '',
    ciudad: initialData.ciudad || '',
    codigoPostal: initialData.codigoPostal || ''
  });

  const [errors, setErrors] = useState<ValidationErrors>({});

  // Funciones de validación individuales
  const validateDNI = useCallback((dni: string): boolean => {
    const regex = /^[0-9]{8}[TRWAGMYFPDXBNJZSQVHLCKE]$/i;
    return regex.test(dni);
  }, []);

  const validatePhone = useCallback((phone: string): boolean => {
    const regex = /^[0-9]{9}$|^[0-9]{3}[0-9]{3}[0-9]{3}$/;
    return regex.test(phone.replace(/[-\s]/g, ''));
  }, []);

  const validateEmail = useCallback((email: string): boolean => {
    if (!email) return true;
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }, []);

  // Función de validación principal
  const validateFormData = useCallback((data: ClienteData): boolean => {
    const newErrors: ValidationErrors = {};

    if (!data.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }

    if (!data.apellidos.trim()) {
      newErrors.apellidos = 'Los apellidos son requeridos';
    }

    if (!data.dni.trim()) {
      newErrors.dni = 'El DNI/NIE es requerido';
    } else if (!validateDNI(data.dni)) {
      newErrors.dni = 'DNI/NIE no válido';
    }

    if (!data.telefono.trim()) {
      newErrors.telefono = 'El teléfono es requerido';
    } else if (!validatePhone(data.telefono)) {
      newErrors.telefono = 'Teléfono no válido';
    }

    if (data.email && !validateEmail(data.email)) {
      newErrors.email = 'Email no válido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [validateDNI, validatePhone, validateEmail]);

  // Función para validar y notificar cambios
  const validateAndNotify = useCallback((data: ClienteData) => {
    const isValid = validateFormData(data);
    
    if (onClienteChange) {
      onClienteChange(data, isValid);
    }
    
    if (onValidationChange) {
      onValidationChange(isValid);
    }
    
    return isValid;
  }, [onClienteChange, onValidationChange, validateFormData]);

  // Efecto para validar automáticamente cuando se reciben datos iniciales
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0 && formData.dni) {
      validateAndNotify(formData);
    }
  }, [initialData, formData, validateAndNotify]);

  const updateField = (field: keyof ClienteData, value: string) => {
    const newFormData = {
      ...formData,
      [field]: value
    };
    
    setFormData(newFormData);
    
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
    
    validateAndNotify(newFormData);
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden ${compact ? '' : 'mb-6'}`}>
      {showTitle && (
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <h5 className="text-xl font-semibold flex items-center">
            <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
            </svg>
            {title}
          </h5>
        </div>
      )}
      
      <div className={`p-6 ${compact ? 'p-4' : ''}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
                </svg>
              </div>
              <input
                type="text"
                className={`
                  pl-10 pr-12 w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all
                  ${errors.nombre ? 'border-red-500 bg-red-50' : formData.nombre.trim().length > 0 ? 'border-green-500 bg-green-50' : 'border-gray-300'}
                  ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:border-gray-400'}
                `}
                value={formData.nombre}
                onChange={(e) => updateField('nombre', e.target.value)}
                placeholder="Nombre del cliente"
                disabled={disabled}
              />
              {/* Indicador visual en tiempo real */}
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                {formData.nombre.trim().length > 0 && (
                  <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                )}
              </div>
            </div>
            {errors.nombre && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                </svg>
                {errors.nombre}
              </p>
            )}
          </div>

          {/* Apellidos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Apellidos <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                className={`
                  pr-12 w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all
                  ${errors.apellidos ? 'border-red-500 bg-red-50' : formData.apellidos.trim().length > 0 ? 'border-green-500 bg-green-50' : 'border-gray-300'}
                  ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:border-gray-400'}
                `}
                value={formData.apellidos}
                onChange={(e) => updateField('apellidos', e.target.value)}
                placeholder="Apellidos del cliente"
                disabled={disabled}
              />
              {/* Indicador visual en tiempo real */}
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                {formData.apellidos.trim().length > 0 && (
                  <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                )}
              </div>
            </div>
            {errors.apellidos && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                </svg>
                {errors.apellidos}
              </p>
            )}
          </div>

          {/* DNI */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              DNI/NIE <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zM8 6a2 2 0 114 0v1H8V6z" clipRule="evenodd"/>
                </svg>
              </div>
              <input
                type="text"
                className={`
                  pl-10 pr-12 w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all uppercase
                  ${errors.dni ? 'border-red-500 bg-red-50' : validateDNI(formData.dni) && formData.dni.length === 9 ? 'border-green-500 bg-green-50' : 'border-gray-300'}
                  ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:border-gray-400'}
                `}
                value={formData.dni}
                onChange={(e) => updateField('dni', e.target.value.toUpperCase())}
                placeholder="12345678A"
                maxLength={9}
                disabled={disabled}
              />
              {/* Indicador visual en tiempo real */}
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                {formData.dni.length > 0 && (
                  validateDNI(formData.dni) && formData.dni.length === 9 ? (
                    <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                  ) : (
                    <div className="text-xs text-gray-500 font-mono">
                      {formData.dni.length}/9
                    </div>
                  )
                )}
              </div>
            </div>
            {errors.dni && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                </svg>
                {errors.dni}
              </p>
            )}
          </div>

          {/* Teléfono */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Teléfono <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
                </svg>
              </div>
              <input
                type="tel"
                className={`
                  pl-10 pr-12 w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all
                  ${errors.telefono ? 'border-red-500 bg-red-50' : validatePhone(formData.telefono) && formData.telefono.length === 9 ? 'border-green-500 bg-green-50' : 'border-gray-300'}
                  ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:border-gray-400'}
                `}
                value={formData.telefono}
                onChange={(e) => updateField('telefono', e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="666123456"
                maxLength={9}
                disabled={disabled}
              />
              {/* Indicador visual en tiempo real */}
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                {formData.telefono.length > 0 && (
                  validatePhone(formData.telefono) && formData.telefono.length === 9 ? (
                    <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                  ) : (
                    <div className="text-xs text-gray-500 font-mono">
                      {formData.telefono.length}/9
                    </div>
                  )
                )}
              </div>
            </div>
            {errors.telefono && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                </svg>
                {errors.telefono}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email <span className="text-gray-500 text-xs font-normal">(opcional)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                </svg>
              </div>
              <input
                type="email"
                className={`
                  pl-10 pr-12 w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all
                  ${errors.email ? 'border-red-500 bg-red-50' : formData.email && validateEmail(formData.email) ? 'border-green-500 bg-green-50' : 'border-gray-300'}
                  ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:border-gray-400'}
                `}
                value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="cliente@email.com"
                disabled={disabled}
              />
              {/* Indicador visual en tiempo real */}
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                {formData.email.length > 0 && (
                  validateEmail(formData.email) ? (
                    <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                    </svg>
                  )
                )}
              </div>
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                </svg>
                {errors.email}
              </p>
            )}
          </div>

          {!compact && (
            <>
              {/* Dirección */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dirección <span className="text-gray-500 text-xs font-normal">(opcional)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <input
                    type="text"
                    className={`
                      pl-10 w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all
                      border-gray-300
                      ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:border-gray-400'}
                    `}
                    value={formData.direccion}
                    onChange={(e) => updateField('direccion', e.target.value)}
                    placeholder="Calle, número, piso..."
                    disabled={disabled}
                  />
                </div>
              </div>

              {/* Ciudad y Código Postal */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ciudad <span className="text-gray-500 text-xs font-normal">(opcional)</span>
                </label>
                <input
                  type="text"
                  className={`
                    w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all
                    border-gray-300
                    ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:border-gray-400'}
                  `}
                  value={formData.ciudad}
                  onChange={(e) => updateField('ciudad', e.target.value)}
                  placeholder="Madrid"
                  disabled={disabled}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Código Postal <span className="text-gray-500 text-xs font-normal">(opcional)</span>
                </label>
                <input
                  type="text"
                  className={`
                    w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all
                    border-gray-300
                    ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:border-gray-400'}
                  `}
                  value={formData.codigoPostal}
                  onChange={(e) => updateField('codigoPostal', e.target.value)}
                  placeholder="28001"
                  maxLength={5}
                  disabled={disabled}
                />
              </div>
            </>
          )}
        </div>

        {/* Resumen de validación */}
        {Object.keys(errors).length > 0 && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
              </svg>
              <h4 className="text-sm font-medium text-red-800">
                Por favor corrige los siguientes errores:
              </h4>
            </div>
            <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
              {Object.values(errors).map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Indicador de éxito */}
        {Object.keys(errors).length === 0 && formData.nombre && formData.apellidos && formData.dni && formData.telefono && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              <p className="text-sm font-medium text-green-800">
                ✅ Datos del cliente completados correctamente
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClienteCrear;