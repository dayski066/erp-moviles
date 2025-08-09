import React from 'react';
import ClienteCrear from '../../../components/core/Cliente/ClienteCrear';
import type { ClienteData } from '../../../types/Cliente';

interface Paso1VendedorProps {
  onClienteChange: (cliente: ClienteData, isValid: boolean) => void;
  onSiguiente: () => void;
  esValido: boolean;
}

const Paso1Vendedor: React.FC<Paso1VendedorProps> = ({
  onClienteChange,
  onSiguiente,
  esValido
}) => {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-blue-100 text-blue-800 p-6 border-b border-blue-200">
        <h5 className="text-xl font-semibold flex items-center">
          <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"/>
          </svg>
          Datos del Vendedor
        </h5>
      </div>
      
      <div className="p-6">
        {/* Usar el componente ClienteCrear con TODOS los campos */}
        <ClienteCrear
          onClienteChange={onClienteChange}
          title="Información del Vendedor"
          showTitle={false}
          compact={false}
        />
        
        <div className="flex justify-end mt-6">
          <button
            className={`flex items-center px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              esValido 
                ? 'bg-blue-600 hover:bg-blue-700 text-white transform hover:scale-105 shadow-lg' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            onClick={onSiguiente}
            disabled={!esValido}
          >
            Continuar a Dispositivo
            <svg className="w-5 h-5 ml-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Paso1Vendedor;