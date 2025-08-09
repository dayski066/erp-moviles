// components/core/Common/ModalGestionEstados.tsx - Modal para gestionar estados
import React, { useState, useEffect } from 'react';
import { useEstados } from '../../../hooks/useEstados';
import type { Estado, EstadoCrear, CategoriaEstado } from '../../../types/Estado';
import {
  XMarkIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface ModalGestionEstadosProps {
  isOpen: boolean;
  onClose: () => void;
  categoria: CategoriaEstado;
  estadoSeleccionado?: string; // Para editar un estado específico
}

export const ModalGestionEstados: React.FC<ModalGestionEstadosProps> = ({
  isOpen,
  onClose,
  categoria,
  estadoSeleccionado
}) => {
  const {
    estados,
    cargando,
    recargarEstados,
    crearEstado,
    actualizarEstado,
    eliminarEstado
  } = useEstados();

  const [modo, setModo] = useState<'lista' | 'crear' | 'editar'>('lista');
  const [estadoEditando, setEstadoEditando] = useState<Estado | null>(null);
  const [formulario, setFormulario] = useState<EstadoCrear>({
    codigo: '',
    nombre: '',
    categoria: 'unificado',
    color: '#6B7280',
    emoji: '📋',
    orden: 0
  });
  const [confirmandoEliminacion, setConfirmandoEliminacion] = useState<number | null>(null);
  const [enviando, setEnviando] = useState(false);

  // Recargar estados cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      recargarEstados();
    }
  }, [isOpen, recargarEstados]);

  // Resetear formulario cuando cambia la categoría
  useEffect(() => {
    setFormulario({
      codigo: '',
      nombre: '',
      categoria: 'unificado',
      color: '#6B7280',
      emoji: '📋',
      orden: estados.length + 1
    });
    setModo('lista');
    setEstadoEditando(null);
  }, [categoria, estados.length]);

  // Si hay un estado seleccionado, abrir en modo editar
  useEffect(() => {
    if (estadoSeleccionado && isOpen) {
      const estado = estados.find(e => e.codigo === estadoSeleccionado);
      if (estado) {
        setEstadoEditando(estado);
        setFormulario({
          codigo: estado.codigo,
          nombre: estado.nombre,
          categoria: estado.categoria,
          color: estado.color,
          emoji: estado.emoji,
          orden: estado.orden
        });
        setModo('editar');
      }
    }
  }, [estadoSeleccionado, isOpen, estados]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (enviando) return;

    try {
      setEnviando(true);

      if (modo === 'crear') {
        await crearEstado(formulario);
      } else if (modo === 'editar' && estadoEditando) {
        await actualizarEstado(estadoEditando.id, formulario);
      }

      // Resetear y volver a la lista
      setFormulario({
        codigo: '',
        nombre: '',
        categoria,
        color: '#6B7280',
        emoji: '📋',
        orden: estados.length + 2
      });
      setModo('lista');
      setEstadoEditando(null);
    } catch (error) {
      console.error('Error al guardar estado:', error);
      alert(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setEnviando(false);
    }
  };

  const handleEliminar = async (id: number) => {
    if (enviando) return;

    try {
      setEnviando(true);
      await eliminarEstado(id);
      setConfirmandoEliminacion(null);
    } catch (error) {
      console.error('Error al eliminar estado:', error);
      alert(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setEnviando(false);
    }
  };

  const iniciarEdicion = (estado: Estado) => {
    setEstadoEditando(estado);
    setFormulario({
      codigo: estado.codigo,
      nombre: estado.nombre,
      categoria: estado.categoria,
      color: estado.color,
      emoji: estado.emoji,
      orden: estado.orden
    });
    setModo('editar');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Gestionar Estados - {categoria === 'reparacion' ? 'Reparación' : 'Dispositivo'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {modo === 'lista' && (
            <div>
              {/* Botón crear */}
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Estados Actuales ({estados.length})
                </h3>
                <button
                  onClick={() => setModo('crear')}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <PlusIcon className="w-4 h-4 mr-1" />
                  Nuevo Estado
                </button>
              </div>

              {/* Lista de estados */}
              <div className="space-y-2">
                {estados.map((estado) => (
                  <div
                    key={estado.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{estado.emoji}</span>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900">{estado.nombre}</span>
                          <span
                            className="px-2 py-1 text-xs rounded-full text-white"
                            style={{ backgroundColor: estado.color }}
                          >
                            {estado.codigo}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500">Orden: {estado.orden}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => iniciarEdicion(estado)}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Editar estado"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setConfirmandoEliminacion(estado.id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        title="Eliminar estado"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {estados.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No hay estados configurados para esta categoría
                </div>
              )}
            </div>
          )}

          {(modo === 'crear' || modo === 'editar') && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {modo === 'crear' ? 'Crear Nuevo Estado' : 'Editar Estado'}
                </h3>
                <button
                  onClick={() => {
                    setModo('lista');
                    setEstadoEditando(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Volver a la lista
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Código */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Código <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formulario.codigo}
                      onChange={(e) => setFormulario({ ...formulario, codigo: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="ej: recibido"
                      required
                    />
                  </div>

                  {/* Nombre */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formulario.nombre}
                      onChange={(e) => setFormulario({ ...formulario, nombre: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="ej: Recibido"
                      required
                    />
                  </div>

                  {/* Emoji */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Emoji
                    </label>
                    <input
                      type="text"
                      value={formulario.emoji}
                      onChange={(e) => setFormulario({ ...formulario, emoji: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="📥"
                      maxLength={2}
                    />
                  </div>

                  {/* Orden */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Orden
                    </label>
                    <input
                      type="number"
                      value={formulario.orden}
                      onChange={(e) => setFormulario({ ...formulario, orden: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                    />
                  </div>
                </div>

                {/* Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Color
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={formulario.color}
                      onChange={(e) => setFormulario({ ...formulario, color: e.target.value })}
                      className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formulario.color}
                      onChange={(e) => setFormulario({ ...formulario, color: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="#6B7280"
                    />
                  </div>
                </div>

                {/* Preview */}
                <div className="p-3 bg-gray-50 rounded-md">
                  <div className="text-sm text-gray-600 mb-2">Vista previa:</div>
                  <span
                    className="inline-flex items-center px-3 py-1 rounded-full text-white text-sm font-medium"
                    style={{ backgroundColor: formulario.color }}
                  >
                    {formulario.emoji} {formulario.nombre}
                  </span>
                </div>

                {/* Botones */}
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setModo('lista');
                      setEstadoEditando(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={enviando || !formulario.codigo || !formulario.nombre}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {enviando ? 'Guardando...' : (modo === 'crear' ? 'Crear Estado' : 'Actualizar Estado')}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Modal de confirmación de eliminación */}
        {confirmandoEliminacion && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 max-w-md mx-4">
              <div className="flex items-center space-x-3 mb-4">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
                <h3 className="text-lg font-medium text-gray-900">Confirmar Eliminación</h3>
              </div>
              <p className="text-gray-600 mb-6">
                ¿Estás seguro de que quieres eliminar este estado? Esta acción no se puede deshacer.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setConfirmandoEliminacion(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleEliminar(confirmandoEliminacion)}
                  disabled={enviando}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {enviando ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};