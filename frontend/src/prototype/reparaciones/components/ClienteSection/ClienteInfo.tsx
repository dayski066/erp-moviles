import React from 'react';
import { motion } from 'framer-motion';
import { 
  UserIcon, 
  PhoneIcon, 
  EnvelopeIcon, 
  IdentificationIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { useReparacionFlow } from '../../hooks/useReparacionFlow';
import { Cliente } from '../../types/reparacion.types';

interface ClienteInfoProps {
  cliente: Cliente;
}

export const ClienteInfo: React.FC<ClienteInfoProps> = ({ cliente }) => {
  const { updateCliente } = useReparacionFlow();

  const handleEdit = () => {
    // TODO: Implementar edición de cliente
    console.log('Editar cliente:', cliente);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-green-50 border border-green-200 rounded-lg p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <UserIcon className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Cliente Seleccionado
            </h3>
            <p className="text-sm text-green-600">✓ Información válida</p>
          </div>
        </div>
        <button
          onClick={handleEdit}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <PencilIcon className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <UserIcon className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Nombre completo</p>
              <p className="font-medium text-gray-900">
                {cliente.nombre} {cliente.apellidos}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <IdentificationIcon className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">DNI/NIE</p>
              <p className="font-medium text-gray-900">{cliente.dni}</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <PhoneIcon className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Teléfono</p>
              <p className="font-medium text-gray-900">{cliente.telefono}</p>
            </div>
          </div>

          {cliente.email && (
            <div className="flex items-center space-x-3">
              <EnvelopeIcon className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium text-gray-900">{cliente.email}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {cliente.direccion && (
        <div className="mt-4 pt-4 border-t border-green-200">
          <div className="flex items-start space-x-3">
            <div className="w-4 h-4 mt-0.5">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Dirección</p>
              <p className="font-medium text-gray-900">{cliente.direccion}</p>
              {cliente.codigo_postal && cliente.ciudad && (
                <p className="text-sm text-gray-600">
                  {cliente.codigo_postal} {cliente.ciudad}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-green-200">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Cliente ID: {cliente.id}
          </div>
          <div className="text-sm text-gray-500">
            {cliente.fecha_creacion && (
              <span>
                Creado: {new Date(cliente.fecha_creacion).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}; 