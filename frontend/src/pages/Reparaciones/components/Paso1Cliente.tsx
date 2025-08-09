// pages/Reparaciones/components/Paso1Cliente.tsx - CORREGIDO
import React, { useState, useCallback, useEffect } from 'react';
import { UserIcon, ArrowRightIcon, MagnifyingGlassIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import ClienteCrear from '../../../components/core/Cliente/ClienteCrear';
import type { ClienteData } from '../../../types/Cliente';
import { useNotification } from '../../../contexts/NotificationContext';
import { useSugerenciasInteligentes, type SugerenciaCliente } from '../../../hooks/useSugerenciasInteligentes';

interface Paso1ClienteProps {
  onClienteChange: (cliente: ClienteData, isValid: boolean) => void;
  onNext: () => void;
  isValid: boolean;
  clienteInicial?: ClienteData; // ✅ NUEVA PROP para recibir datos del cliente
}

const Paso1Cliente: React.FC<Paso1ClienteProps> = ({
  onClienteChange,
  onNext,
  isValid,
  clienteInicial // ✅ RECIBIR DATOS INICIALES
}) => {
  const { showWarning, showError } = useNotification();
  const { obtenerSugerenciasClientes } = useSugerenciasInteligentes();

  // Estados para búsqueda inteligente
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [clienteEncontrado, setClienteEncontrado] = useState<boolean | null>(null);
  const [clienteData, setClienteData] = useState<ClienteData | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  
  // ✅ NUEVO: Estados para búsqueda inteligente
  const [resultadosBusqueda, setResultadosBusqueda] = useState<ClienteData[]>([]);
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const [tipoBusqueda, setTipoBusqueda] = useState<'dni' | 'nombre' | 'telefono' | 'email'>('dni');
  
  // ✅ NUEVO: Estados para sugerencias
  const [sugerenciasClientes, setSugerenciasClientes] = useState<SugerenciaCliente[]>([]);
  const [mostrandoSugerencias, setMostrandoSugerencias] = useState(false);

  // ✅ NUEVO: Effect para cargar datos iniciales si ya existen
  useEffect(() => {
    if (clienteInicial && clienteInicial.dni) {
      // Si ya tenemos datos del cliente, mostrar directamente el formulario
      setClienteData(clienteInicial);
      setMostrarFormulario(true);
      setClienteEncontrado(true); // Marcar como encontrado para mostrar el mensaje verde
      setTerminoBusqueda(clienteInicial.dni);
      console.log('✅ Cargando cliente inicial:', clienteInicial);
    }
  }, [clienteInicial]);

  // ✅ NUEVO: Cargar sugerencias al iniciar
  useEffect(() => {
    const cargarSugerencias = () => {
      const sugerencias = obtenerSugerenciasClientes();
      setSugerenciasClientes(sugerencias);
      setMostrandoSugerencias(sugerencias.length > 0);
    };

    // Cargar sugerencias solo si no hay datos iniciales
    if (!clienteInicial) {
      cargarSugerencias();
    }
  }, [obtenerSugerenciasClientes, clienteInicial]);

  // ✅ NUEVA: Función para detectar tipo de búsqueda automáticamente
  const detectarTipoBusqueda = useCallback((termino: string): 'dni' | 'nombre' | 'telefono' | 'email' => {
    const terminoLimpio = termino.trim();
    
    // Detectar DNI/NIE (8 dígitos + letra o X + 7 dígitos + letra)
    if (/^[0-9]{8}[TRWAGMYFPDXBNJZSQVHLCKE]$/i.test(terminoLimpio) || 
        /^[XYZ][0-9]{7}[TRWAGMYFPDXBNJZSQVHLCKE]$/i.test(terminoLimpio)) {
      return 'dni';
    }
    
    // Detectar teléfono (9 dígitos, con o sin espacios/guiones)
    if (/^[0-9\s-]{9,12}$/.test(terminoLimpio) && terminoLimpio.replace(/[\s-]/g, '').length === 9) {
      return 'telefono';
    }
    
    // Detectar email
    if (terminoLimpio.includes('@') && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(terminoLimpio)) {
      return 'email';
    }
    
    // Por defecto, buscar por nombre
    return 'nombre';
  }, []);

  // ✅ FUNCIÓN CORREGIDA: Búsqueda exacta y completa
  const buscarClienteInteligente = useCallback(async () => {
    const terminoLimpio = terminoBusqueda.trim();
    
    if (!terminoLimpio) {
      showWarning('Campo Requerido', 'Introduce un término para buscar');
      return;
    }

    const tipoDetectado = detectarTipoBusqueda(terminoLimpio);
    setTipoBusqueda(tipoDetectado);

    // ✅ VALIDACIÓN ESTRICTA: Para DNI debe estar completo (9 caracteres)
    if (tipoDetectado === 'dni') {
      if (terminoLimpio.length !== 9) {
        showWarning('DNI Incompleto', 'El DNI debe tener exactamente 9 caracteres (8 números + 1 letra)');
        return;
      }
      
      // Validar formato DNI/NIE exacto
      const formatoValido = /^[0-9]{8}[TRWAGMYFPDXBNJZSQVHLCKE]$/i.test(terminoLimpio) || 
                           /^[XYZ][0-9]{7}[TRWAGMYFPDXBNJZSQVHLCKE]$/i.test(terminoLimpio);
      
      if (!formatoValido) {
        showWarning('DNI Inválido', 'Formato de DNI/NIE no válido');
        return;
      }
    }

    setBuscando(true);
    setClienteEncontrado(null);
    setResultadosBusqueda([]);
    setMostrarResultados(false);

    try {
      // Construir URL según el tipo de búsqueda detectado
      let url = '';
      const terminoLimpio = terminoBusqueda.trim();
      
      switch (tipoDetectado) {
        case 'dni':
          url = `http://localhost:5001/api/catalogos/clientes/buscar/${terminoLimpio}`;
          break;
        case 'telefono': {
          const telefonoLimpio = terminoLimpio.replace(/[\s-]/g, '');
          url = `http://localhost:5001/api/catalogos/clientes/buscar-telefono/${telefonoLimpio}`;
          break;
        }
        case 'email':
          url = `http://localhost:5001/api/catalogos/clientes/buscar-email/${encodeURIComponent(terminoLimpio)}`;
          break;
        case 'nombre':
          url = `http://localhost:5001/api/catalogos/clientes/buscar-nombre/${encodeURIComponent(terminoLimpio)}`;
          break;
      }

      console.log(`🔍 Buscando cliente por ${tipoDetectado}:`, terminoLimpio);
      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        if (tipoDetectado === 'dni') {
          // Búsqueda por DNI - resultado único
          if (data.encontrado && data.cliente) {
            setClienteData(data.cliente);
            setClienteEncontrado(true);
            setMostrarFormulario(true);
          } else {
            // Cliente no encontrado - formulario nuevo con DNI
            const datosIniciales: ClienteData = {
              nombre: '',
              apellidos: '',
              dni: terminoLimpio, // Sabemos que es DNI en esta rama
              telefono: '',
              email: '',
              direccion: '',
              codigoPostal: '',
              ciudad: ''
            };
            setClienteData(datosIniciales);
            setClienteEncontrado(false);
            setMostrarFormulario(true);
          }
        } else {
          // Búsqueda por nombre/teléfono/email - múltiples resultados posibles
          if (data.clientes && data.clientes.length > 0) {
            if (data.clientes.length === 1) {
              // Un solo resultado - cargar directamente
              setClienteData(data.clientes[0]);
              setClienteEncontrado(true);
              setMostrarFormulario(true);
            } else {
              // Múltiples resultados - mostrar lista para elegir
              setResultadosBusqueda(data.clientes);
              setMostrarResultados(true);
            }
          } else {
            // No se encontraron resultados - formulario nuevo
            const datosNuevoCliente: ClienteData = {
              nombre: '',
              apellidos: '',
              dni: '',
              telefono: '',
              email: '',
              direccion: '',
              codigoPostal: '',
              ciudad: ''
            };
            
            // Asignar el valor según el tipo de búsqueda
            switch (tipoDetectado) {
              case 'nombre':
                datosNuevoCliente.nombre = terminoLimpio;
                break;
              case 'telefono':
                datosNuevoCliente.telefono = terminoLimpio.replace(/[\s-]/g, '');
                break;
              case 'email':
                datosNuevoCliente.email = terminoLimpio;
                break;
            }
            setClienteData(datosNuevoCliente);
            setClienteEncontrado(false);
            setMostrarFormulario(true);
          }
        }
      } else {
        throw new Error(data.message || 'Error en la búsqueda');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error(`Error buscando cliente por ${tipoDetectado}:`, error);
      showError('Error de Búsqueda', `Error al buscar el cliente: ${errorMessage}`);
    } finally {
      setBuscando(false);
    }
  }, [terminoBusqueda, detectarTipoBusqueda, showWarning, showError]);

  // ✅ NUEVA: Función para seleccionar cliente de múltiples resultados
  const seleccionarCliente = useCallback((cliente: ClienteData) => {
    setClienteData(cliente);
    setClienteEncontrado(true);
    setMostrarFormulario(true);
    setResultadosBusqueda([]);
    setMostrarResultados(false);
    console.log('✅ Cliente seleccionado:', cliente.nombre, cliente.apellidos);
  }, []);

  // Función para resetear búsqueda
  const resetearBusqueda = useCallback(() => {
    setTerminoBusqueda('');
    setBuscando(false);
    setClienteEncontrado(null);
    setClienteData(null);
    setMostrarFormulario(false);
    setResultadosBusqueda([]);
    setMostrarResultados(false);
  }, []);

  // Manejar Enter en el campo de búsqueda (solo si es válido)
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const terminoLimpio = terminoBusqueda.trim();
      if (!terminoLimpio) return;
      
      const tipo = detectarTipoBusqueda(terminoLimpio);
      
      // Para DNI: solo buscar si está completo y válido
      if (tipo === 'dni') {
        const esCompleto = terminoLimpio.length === 9;
        const esValido = /^[0-9]{8}[TRWAGMYFPDXBNJZSQVHLCKE]$/i.test(terminoLimpio) || 
                       /^[XYZ][0-9]{7}[TRWAGMYFPDXBNJZSQVHLCKE]$/i.test(terminoLimpio);
        
        if (esCompleto && esValido) {
          buscarClienteInteligente();
        }
      } else {
        // Para otros tipos, buscar directamente
        buscarClienteInteligente();
      }
    }
  }, [terminoBusqueda, detectarTipoBusqueda, buscarClienteInteligente]);

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-blue-100 text-blue-800 p-6 border-b border-blue-200">
        <h5 className="text-xl font-semibold flex items-center">
          <UserIcon className="w-6 h-6 mr-3" />
          Datos del Cliente
        </h5>
      </div>
      
      <div className="p-4 sm:p-6">
        {/* ✅ NUEVA SECCIÓN DE BÚSQUEDA INTELIGENTE */}
        {!mostrarFormulario && !mostrarResultados && (
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 sm:p-8 border border-gray-200 mb-6">
            <div className="text-center">
              <MagnifyingGlassIcon className="w-16 h-16 text-blue-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                🔍 Búsqueda Inteligente de Clientes
              </h3>
              <p className="text-gray-600 mb-6">
                Busca por <strong>DNI</strong>, <strong>nombre</strong>, <strong>teléfono</strong> o <strong>email</strong>. 
                El sistema detectará automáticamente el tipo de búsqueda.
              </p>
              
              <div className="max-w-md mx-auto">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={terminoBusqueda}
                      onChange={(e) => {
                        // Convertir automáticamente a mayúsculas para DNI
                        const valor = e.target.value;
                        const tipoBusquedaDetectado = detectarTipoBusqueda(valor);
                        
                        if (tipoBusquedaDetectado === 'dni') {
                          // Para DNI: convertir a mayúsculas
                          setTerminoBusqueda(valor.toUpperCase());
                        } else {
                          // Para otros tipos: mantener el valor original
                          setTerminoBusqueda(valor);
                        }
                      }}
                      onKeyPress={handleKeyPress}
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-center text-lg"
                      placeholder="12345678A, Juan García, 666123456 o juan@email.com"
                      disabled={buscando}
                    />
                    {/* Indicador del tipo de búsqueda detectado con validación */}
                    {terminoBusqueda.trim() && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        {(() => {
                          const tipo = detectarTipoBusqueda(terminoBusqueda);
                          const terminoLimpio = terminoBusqueda.trim();
                          
                          // Para DNI: mostrar estado de completitud
                          if (tipo === 'dni') {
                            const esCompleto = terminoLimpio.length === 9;
                            const esValido = /^[0-9]{8}[TRWAGMYFPDXBNJZSQVHLCKE]$/i.test(terminoLimpio) || 
                                           /^[XYZ][0-9]{7}[TRWAGMYFPDXBNJZSQVHLCKE]$/i.test(terminoLimpio);
                            
                            return (
                              <span className={`
                                px-2 py-1 text-xs rounded-full font-medium
                                ${esCompleto && esValido ? 'bg-green-100 text-green-800' :
                                  esCompleto ? 'bg-red-100 text-red-800' :
                                  'bg-blue-100 text-blue-800'
                                }
                              `}>
                                {esCompleto && esValido ? '✅ DNI Válido' :
                                 esCompleto ? '❌ DNI Inválido' :
                                 `📝 DNI ${terminoLimpio.length}/9`
                                }
                              </span>
                            );
                          }
                          
                          // Para otros tipos
                          return (
                            <span className={`
                              px-2 py-1 text-xs rounded-full font-medium
                              ${tipo === 'telefono' ? 'bg-green-100 text-green-800' :
                                tipo === 'email' ? 'bg-purple-100 text-purple-800' :
                                'bg-gray-100 text-gray-800'
                              }
                            `}>
                              {tipo === 'telefono' ? '📞 Teléfono' :
                               tipo === 'email' ? '📧 Email' :
                               '👤 Nombre'
                              }
                            </span>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={buscarClienteInteligente}
                    disabled={(() => {
                      if (buscando || !terminoBusqueda.trim()) return true;
                      
                      const tipo = detectarTipoBusqueda(terminoBusqueda);
                      if (tipo === 'dni') {
                        const terminoLimpio = terminoBusqueda.trim();
                        const esCompleto = terminoLimpio.length === 9;
                        const esValido = /^[0-9]{8}[TRWAGMYFPDXBNJZSQVHLCKE]$/i.test(terminoLimpio) || 
                                       /^[XYZ][0-9]{7}[TRWAGMYFPDXBNJZSQVHLCKE]$/i.test(terminoLimpio);
                        return !(esCompleto && esValido);
                      }
                      
                      return false; // Para otros tipos, permitir búsqueda
                    })()}
                    className={`
                      px-6 py-3 rounded-lg font-medium transition-all duration-200
                      ${(() => {
                        if (buscando || !terminoBusqueda.trim()) return 'bg-gray-300 text-gray-500 cursor-not-allowed';
                        
                        const tipo = detectarTipoBusqueda(terminoBusqueda);
                        if (tipo === 'dni') {
                          const terminoLimpio = terminoBusqueda.trim();
                          const esCompleto = terminoLimpio.length === 9;
                          const esValido = /^[0-9]{8}[TRWAGMYFPDXBNJZSQVHLCKE]$/i.test(terminoLimpio) || 
                                         /^[XYZ][0-9]{7}[TRWAGMYFPDXBNJZSQVHLCKE]$/i.test(terminoLimpio);
                          return (esCompleto && esValido) ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl' : 'bg-gray-300 text-gray-500 cursor-not-allowed';
                        }
                        
                        return 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl';
                      })()}
                    `}
                  >
                    {buscando ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Buscando...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <MagnifyingGlassIcon className="w-5 h-5" />
                        <span>Buscar</span>
                      </div>
                    )}
                  </button>
                </div>
              </div>
              
              <div className="mt-6">
                <button
                  onClick={() => {
                    setMostrarFormulario(true);
                    setClienteEncontrado(false);
                  }}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  ¿No tienes ningún dato? Registrar cliente directamente
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ✅ NUEVA SECCIÓN: Sugerencias de clientes */}
        {mostrandoSugerencias && sugerenciasClientes.length > 0 && !mostrarFormulario && !mostrarResultados && (
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <span className="text-xl mr-2">🤖</span>
                  Sugerencias Inteligentes
                </h3>
                <p className="text-purple-700 text-sm">
                  Clientes basados en tu historial reciente
                </p>
              </div>
              <button
                onClick={() => setMostrandoSugerencias(false)}
                className="text-sm text-purple-600 hover:text-purple-800 font-medium"
              >
                Ocultar sugerencias
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {sugerenciasClientes.map((sugerencia, index) => (
                <button
                  key={index}
                  onClick={() => seleccionarCliente(sugerencia.cliente)}
                  className="p-4 bg-white border border-purple-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-all text-left group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 group-hover:text-purple-900">
                        {sugerencia.cliente.nombre} {sugerencia.cliente.apellidos}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        📝 {sugerencia.cliente.dni} • 📞 {sugerencia.cliente.telefono}
                      </div>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className={`
                          px-2 py-1 text-xs rounded-full font-medium
                          ${sugerencia.tipo === 'cliente_frecuente' 
                            ? 'bg-orange-100 text-orange-800' 
                            : 'bg-green-100 text-green-800'
                          }
                        `}>
                          {sugerencia.tipo === 'cliente_frecuente' 
                            ? `⭐ ${sugerencia.frecuencia} reparaciones` 
                            : '🆕 Cliente reciente'
                          }
                        </span>
                        {sugerencia.ultimaReparacion && (
                          <span className="text-xs text-gray-500">
                            {Math.floor((Date.now() - sugerencia.ultimaReparacion.getTime()) / (1000 * 60 * 60 * 24))} días
                          </span>
                        )}
                      </div>
                      {sugerencia.dispositivos_comunes && sugerencia.dispositivos_comunes.length > 0 && (
                        <div className="text-xs text-purple-600 mt-1">
                          🔧 Suele reparar: {sugerencia.dispositivos_comunes.slice(0, 2).join(', ')}
                        </div>
                      )}
                    </div>
                    <div className="text-purple-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ✅ NUEVA SECCIÓN: Múltiples resultados de búsqueda */}
        {mostrarResultados && resultadosBusqueda.length > 0 && (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border border-green-200 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  🎯 Se encontraron {resultadosBusqueda.length} clientes
                </h3>
                <p className="text-gray-600 text-sm">
                  Buscando por <strong>{tipoBusqueda}</strong>: "{terminoBusqueda}"
                </p>
              </div>
              <button
                onClick={resetearBusqueda}
                className="text-sm text-gray-600 hover:text-gray-800 font-medium"
              >
                ← Nueva búsqueda
              </button>
            </div>
            
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {resultadosBusqueda.map((cliente, index) => (
                <button
                  key={index}
                  onClick={() => seleccionarCliente(cliente)}
                  className="w-full p-4 bg-white border border-gray-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition-all text-left"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">
                        {cliente.nombre} {cliente.apellidos}
                      </div>
                      <div className="text-sm text-gray-600 grid grid-cols-1 sm:grid-cols-3 gap-1 mt-1">
                        <span>📝 {cliente.dni}</span>
                        <span>📞 {cliente.telefono}</span>
                        {cliente.email && <span>📧 {cliente.email}</span>}
                      </div>
                    </div>
                    <div className="text-green-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* RESULTADO DE BÚSQUEDA - Solo mostrar si se realizó una búsqueda nueva */}
        {mostrarFormulario && clienteEncontrado !== null && (
          <div className={`p-4 rounded-lg border mb-6 ${
            clienteEncontrado 
              ? 'bg-green-50 border-green-200' 
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {clienteEncontrado ? (
                  <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2" />
                ) : (
                  <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500 mr-2" />
                )}
                <span className={`font-medium ${
                  clienteEncontrado ? 'text-green-800' : 'text-yellow-800'
                }`}>
                  {clienteEncontrado 
                    ? `Cliente: ${clienteData?.nombre} ${clienteData?.apellidos} - Puedes modificar los datos si es necesario`
                    : `Nuevo cliente con ${tipoBusqueda === 'dni' ? 'DNI' : tipoBusqueda} "${terminoBusqueda}" - Completa todos los campos obligatorios`
                  }
                </span>
              </div>
              <button
                onClick={resetearBusqueda}
                className="text-sm text-gray-600 hover:text-gray-800 font-medium"
              >
                ← Nueva búsqueda
              </button>
            </div>
          </div>
        )}

        {/* FORMULARIO DE CLIENTE */}
        {mostrarFormulario && clienteData && (
          <ClienteCrear
            onClienteChange={onClienteChange}
            initialData={clienteData}
            showTitle={false}
            compact={false}
          />
        )}

        {/* FORMULARIO DIRECTO (sin búsqueda) */}
        {mostrarFormulario && !clienteData && (
          <ClienteCrear
            onClienteChange={onClienteChange}
            showTitle={false}
            compact={false}
          />
        )}

        {/* BOTÓN CONTINUAR */}
        {mostrarFormulario && (
          <div className="flex justify-end mt-6">
            <button
              className={`
                flex items-center px-6 py-3 rounded-lg font-medium
                transition-all duration-200 transform
                ${isValid 
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 hover:scale-105 shadow-lg' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }
              `}
              onClick={onNext}
              disabled={!isValid}
            >
              <span>Continuar a Dispositivo</span>
              <ArrowRightIcon className="w-5 h-5 ml-2" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Paso1Cliente;