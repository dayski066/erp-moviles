import React from 'react';
import { ClienteSearch } from './ClienteSearch';
import { ClienteQuickCreate } from './ClienteQuickCreate';
import { ClienteInfo } from './ClienteInfo';
import { useReparacionFlow } from '../../hooks/useReparacionFlow';

export const ClienteSection: React.FC = () => {
  const { cliente, loadingStates } = useReparacionFlow();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">
          Información del Cliente
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Busca un cliente existente o crea uno nuevo
        </p>
      </div>

      <div className="p-6">
        {loadingStates.cliente ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-600">Cargando...</span>
          </div>
        ) : cliente ? (
          <ClienteInfo cliente={cliente} />
        ) : (
          <div className="space-y-6">
            <ClienteSearch />
            <ClienteQuickCreate />
          </div>
        )}
      </div>
    </div>
  );
}; 