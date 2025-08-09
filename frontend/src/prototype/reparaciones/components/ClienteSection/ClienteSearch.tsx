import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MagnifyingGlassIcon, 
  UserPlusIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  IdentificationIcon
} from '@heroicons/react/24/outline';
import { useReparacionFlow } from '../../hooks/useReparacionFlow';
import { useReparacionStore } from '../../store/reparacionStore';
import { Cliente } from '../../types/reparacion.types';

export const ClienteSearch: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<Cliente[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const { searchCliente, updateCliente } = useReparacionFlow();
  const clienteSearchState = useReparacionStore().clienteSearchState;
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Función para normalizar el input (mayúsculas para DNI/NIE)
  const normalizeInput = (value: string): string => {
    // Detectar si es un DNI/NIE (patrón: letras + números)
    const dniPattern = /^[A-Za-z]{1,3}\d{6,8}[A-Za-z]?$/;
    const isDNI = dniPattern.test(value.replace(/\s/g, ''));
    
    if (isDNI) {
      // Convertir a mayúsculas y limpiar espacios
      return value.toUpperCase().replace(/\s/g, '');
    }
    
    // Para nombres y teléfonos, mantener formato original
    return value;
  };

  // Manejar cambios en el input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const normalizedValue = normalizeInput(value);
    setSearchTerm(normalizedValue);
  };

  // Buscar clientes cuando cambia el término
  useEffect(() => {
    const searchClientes = async () => {
      if (searchTerm.length >= 2) {
        const searchResults = await searchCliente(searchTerm);
        setResults(searchResults);
        setIsOpen(true);
        setSelectedIndex(-1);
      } else {
        setResults([]);
        setIsOpen(false);
      }
    };

    const timeoutId = setTimeout(searchClientes, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, searchCliente]);

  // Manejar navegación con teclado
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleSelectCliente(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleSelectCliente = (cliente: Cliente) => {
    updateCliente(cliente);
    setSearchTerm('');
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  const handleCreateNew = () => {
    // TODO: Implementar creación rápida
    console.log('Crear nuevo cliente');
  };

  const getBorderColor = () => {
    switch (clienteSearchState) {
      case 'searching':
        return 'border-blue-500';
      case 'found':
        return 'border-green-500';
      case 'not-found':
        return 'border-yellow-500';
      case 'error':
        return 'border-red-500';
      default:
        return 'border-gray-300';
    }
  };

  const getIcon = () => {
    switch (clienteSearchState) {
      case 'searching':
        return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />;
      case 'found':
        return <CheckIcon className="w-4 h-4 text-green-500" />;
      case 'not-found':
        return <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />;
      default:
        return <MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />;
    }
  };

  // Detectar si el input parece ser un DNI/NIE
  const isDNIInput = /^[A-Z]{1,3}\d{6,8}[A-Z]?$/.test(searchTerm.replace(/\s/g, ''));

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          placeholder="Buscar por DNI, nombre o teléfono..."
          className={`
            w-full px-4 py-3 pl-10 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            ${getBorderColor()}
            ${isDNIInput ? 'font-mono tracking-wider' : ''}
          `}
        />
        
        {/* Icono izquierdo */}
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
          {isDNIInput ? (
            <IdentificationIcon className="w-4 h-4 text-blue-500" />
          ) : (
            getIcon()
          )}
        </div>

        {/* Botón crear nuevo */}
        {clienteSearchState === 'not-found' && (
          <button
            onClick={handleCreateNew}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-blue-500 hover:text-blue-600"
          >
            <UserPlusIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Resultados */}
      <AnimatePresence>
        {isOpen && results.length > 0 && (
          <motion.div
            ref={resultsRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
          >
            {results.map((cliente, index) => (
              <button
                key={cliente.id}
                onClick={() => handleSelectCliente(cliente)}
                className={`
                  w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none
                  ${selectedIndex === index ? 'bg-gray-50' : ''}
                `}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">
                      {cliente.nombre} {cliente.apellidos}
                    </div>
                    <div className="text-sm text-gray-500">
                      <span className="font-mono tracking-wider">DNI: {cliente.dni}</span> • Tel: {cliente.telefono}
                    </div>
                  </div>
                  {selectedIndex === index && (
                    <CheckIcon className="w-4 h-4 text-blue-500" />
                  )}
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mensaje de estado */}
      {clienteSearchState === 'error' && (
        <p className="text-sm text-red-600 mt-2">
          Error al buscar clientes. Inténtalo de nuevo.
        </p>
      )}

      {/* Ayuda visual para DNI */}
      {isDNIInput && searchTerm.length > 0 && (
        <p className="text-xs text-blue-600 mt-1">
          ✓ DNI/NIE en mayúsculas detectado
        </p>
      )}
    </div>
  );
}; 