
import React from 'react';
import { XMarkIcon, UserIcon, DevicePhoneMobileIcon, ClipboardDocumentCheckIcon, CalculatorIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

interface Paso {
  numero: number;
  titulo: string;
  descripcion: string;
  icon: React.ElementType;
  color: string;
  disponible: boolean;
}

interface ModalSeleccionPasoProps {
  isOpen: boolean;
  onClose: () => void;
  onSeleccionar: (paso: number) => void;
  reparacion: {
    numero_orden: string;
    cliente_nombre: string;
    cliente_apellidos: string;
    total_dispositivos: number;
    estado_general: string;
  };
}

const ModalSeleccionPaso: React.FC<ModalSeleccionPasoProps> = ({
  isOpen,
  onClose,
  onSeleccionar,
  reparacion
}) => {
  if (!isOpen) return null;

  const pasos: Paso[] = [
    {
      numero: 1,
      titulo: "Datos del Cliente",
      descripcion: "Editar información personal y de contacto",
      icon: UserIcon,
      color: "blue",
      disponible: true
    },
    {
      numero: 2,
      titulo: "Dispositivos",
      descripcion: "Modificar información de los dispositivos",
      icon: DevicePhoneMobileIcon,
      color: "green",
      disponible: true
    },
    {
      numero: 3,
      titulo: "Diagnóstico",
      descripcion: "Actualizar averías y diagnósticos",
      icon: ClipboardDocumentCheckIcon,
      color: "amber",
      disponible: true
    },
    {
      numero: 4,
      titulo: "Presupuesto",
      descripcion: "Modificar servicios y precios",
      icon: CalculatorIcon,
      color: "indigo",
      disponible: true
    },
    {
      numero: 5,
      titulo: "Resumen Final",
      descripcion: "Ver resumen completo de cambios",
      icon: DocumentTextIcon,
      color: "purple",
      disponible: true
    }
  ];

  const getColorClasses = (color: string, isHover = false) => {
    const colorMap = {
      blue: isHover 
        ? "bg-blue-600 border-blue-600 text-white" 
        : "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100",
      green: isHover 
        ? "bg-green-600 border-green-600 text-white" 
        : "bg-green-50 border-green-200 text-green-700 hover:bg-green-100",
      amber: isHover 
        ? "bg-amber-600 border-amber-600 text-white" 
        : "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100",
      indigo: isHover 
        ? "bg-indigo-600 border-indigo-600 text-white" 
        : "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100",
      purple: isHover 
        ? "bg-purple-600 border-purple-600 text-white" 
        : "bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  const getIconColor = (color: string) => {
    const iconColorMap = {
      blue: "text-blue-600",
      green: "text-green-600",
      amber: "text-amber-600",
      indigo: "text-indigo-600",
      purple: "text-purple-600"
    };
    return iconColorMap[color as keyof typeof iconColorMap] || "text-blue-600";
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                ¿Qué deseas editar?
              </h2>
              <p className="text-gray-300">
                Selecciona el paso que quieres modificar en la reparación
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700 rounded-full transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Información de la reparación */}
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl font-bold">
                {reparacion.numero_orden.split('-').pop()}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {reparacion.numero_orden}
              </h3>
              <p className="text-sm text-gray-600">
                {reparacion.cliente_nombre} {reparacion.cliente_apellidos} • {reparacion.total_dispositivos} dispositivo{reparacion.total_dispositivos !== 1 ? 's' : ''}
              </p>
              <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                reparacion.estado_general === 'iniciada' ? 'bg-blue-100 text-blue-800' :
                reparacion.estado_general === 'en_diagnostico' ? 'bg-yellow-100 text-yellow-800' :
                reparacion.estado_general === 'lista' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {reparacion.estado_general}
              </span>
            </div>
          </div>
        </div>

        {/* Lista de pasos */}
        <div className="p-6">
          <div className="grid grid-cols-1 gap-4">
            {pasos.map((paso) => {
              const Icon = paso.icon;
              return (
                <button
                  key={paso.numero}
                  onClick={() => onSeleccionar(paso.numero)}
                  disabled={!paso.disponible}
                  className={`
                    w-full p-4 rounded-xl border-2 transition-all duration-200 text-left
                    transform hover:scale-[1.02] hover:shadow-lg
                    ${paso.disponible 
                      ? `${getColorClasses(paso.color)} cursor-pointer` 
                      : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                    }
                  `}
                >
                  <div className="flex items-center space-x-4">
                    {/* Número del paso */}
                    <div className={`
                      w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg
                      ${paso.disponible 
                        ? `bg-white ${getIconColor(paso.color)} shadow-md` 
                        : 'bg-gray-200 text-gray-400'
                      }
                    `}>
                      {paso.numero}
                    </div>

                    {/* Icono */}
                    <div className={`
                      w-10 h-10 rounded-lg flex items-center justify-center
                      ${paso.disponible 
                        ? `bg-white ${getIconColor(paso.color)} shadow-sm` 
                        : 'bg-gray-200 text-gray-400'
                      }
                    `}>
                      <Icon className="w-6 h-6" />
                    </div>

                    {/* Contenido */}
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">
                        {paso.titulo}
                      </h3>
                      <p className={`text-sm ${
                        paso.disponible 
                          ? 'opacity-80' 
                          : 'text-gray-400'
                      }`}>
                        {paso.descripcion}
                      </p>
                    </div>

                    {/* Flecha */}
                    <div className={`
                      transition-transform duration-200 group-hover:translate-x-1
                      ${paso.disponible ? 'opacity-60' : 'opacity-30'}
                    `}>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 rounded-b-2xl border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              💡 <strong>Tip:</strong> Puedes navegar entre pasos durante la edición
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalSeleccionPaso;