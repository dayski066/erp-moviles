// src/pages/Ventas/NuevaVenta.tsx
import React from 'react';

const NuevaVenta: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Nueva Venta
            </h1>
            <p className="text-gray-600 mb-8">
              Módulo de ventas en desarrollo
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center justify-center mb-4">
                <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                Próximamente
              </h3>
              <p className="text-blue-700">
                El módulo de ventas estará disponible próximamente.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// IMPORTANTE: Exportación por defecto
export default NuevaVenta;