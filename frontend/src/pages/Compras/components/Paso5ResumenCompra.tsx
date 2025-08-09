import React, { useCallback, useState } from 'react';

export interface ClienteData {
  nombre: string;
  apellidos: string;
  dni: string;
  telefono: string;
  email?: string;
  direccion?: string;
  ciudad?: string;
  codigoPostal?: string;
}

export interface DispositivoUsado {
  marca: string;
  modelo: string;
  imei: string;
  color: string;
  capacidad: string;
  estadoFisico: "excelente" | "bueno" | "regular" | "malo";
  estadoFuncional: "perfecto" | "funciona" | "problemas" | "no_funciona";
  accesorios: string[];
  observaciones: string;
  precioCompra: number;
  precioEstimadoVenta: number;
}

export interface EvaluacionDispositivo {
  pantalla: "perfecto" | "rayones_leves" | "rayones_visibles" | "grietas" | "rota";
  marco: "perfecto" | "desgaste_leve" | "golpes_leves" | "golpes_visibles" | "muy_dañado";
  parte_trasera: "perfecto" | "rayones_leves" | "rayones_visibles" | "grietas" | "muy_dañada";
  botones: "funcionan_perfecto" | "funcionan_bien" | "alguno_falla" | "varios_fallan" | "no_funcionan";
  camara: "perfecto" | "funciona_bien" | "calidad_regular" | "problemas" | "no_funciona";
  bateria: "excelente" | "buena" | "regular" | "mala" | "muy_mala";
  carga: "carga_perfecta" | "carga_lenta" | "problemas_carga" | "no_carga";
  conectividad: "todo_perfecto" | "algún_problema" | "varios_problemas" | "muchos_problemas";
}

export interface CompraDataCompleta {
  cliente: ClienteData;
  dispositivo: DispositivoUsado;
  evaluacion: EvaluacionDispositivo;
  metodoPago: "efectivo" | "transferencia";
  observacionesCompra: string;
  documentosGenerados: {
    contrato: boolean;
    registroPolicial: boolean;
    registroREBU: boolean;
  };
  fechaCompra: string;
  horaCompra: string;
}

interface Paso5ResumenCompraProps {
  clienteData: ClienteData | null;
  dispositivoData: DispositivoUsado;
  evaluacionData: EvaluacionDispositivo;
  onConfirmar: (datos: CompraDataCompleta) => void;
  onAtras: () => void;
  estaCargando: boolean;
}

const Paso5ResumenCompra: React.FC<Paso5ResumenCompraProps> = ({
  clienteData,
  dispositivoData,
  evaluacionData,
  onConfirmar,
  onAtras,
  estaCargando
}) => {
  const [metodoPago, setMetodoPago] = useState<'efectivo' | 'transferencia'>('efectivo');
  const [observaciones, setObservaciones] = useState<string>('');
  const [generarDocumentos, setGenerarDocumentos] = useState({
    contrato: true,
    registroPolicial: true,
    registroREBU: true
  });

  const manejarCambioMetodoPago = useCallback((evento: React.ChangeEvent<HTMLInputElement>) => {
    setMetodoPago(evento.target.value as 'efectivo' | 'transferencia');
  }, []);

  const manejarCambioObservaciones = useCallback((evento: React.ChangeEvent<HTMLTextAreaElement>) => {
    setObservaciones(evento.target.value);
  }, []);

  const manejarCambioDocumento = useCallback((documento: keyof typeof generarDocumentos) => (
    evento: React.ChangeEvent<HTMLInputElement>
  ) => {
    setGenerarDocumentos(previo => ({
      ...previo,
      [documento]: evento.target.checked
    }));
  }, []);

  const manejarConfirmacion = useCallback(() => {
    if (!clienteData) {
      alert('Error: No hay datos de cliente');
      return;
    }

    const datosCompletos: CompraDataCompleta = {
      cliente: clienteData,
      dispositivo: dispositivoData,
      evaluacion: evaluacionData,
      metodoPago,
      observacionesCompra: observaciones,
      documentosGenerados: generarDocumentos,
      fechaCompra: new Date().toISOString().split("T")[0],
      horaCompra: new Date().toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
    onConfirmar(datosCompletos);
  }, [clienteData, dispositivoData, evaluacionData, metodoPago, observaciones, generarDocumentos, onConfirmar]);

  const formatearEstado = useCallback((estado: string): string => {
    return estado.replace('_', ' ').split(' ').map(palabra => 
      palabra.charAt(0).toUpperCase() + palabra.slice(1)
    ).join(' ');
  }, []);

  if (!clienteData) {
    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 text-center">
          <p className="text-red-600">Error: No hay datos de cliente disponibles</p>
          <button onClick={onAtras} className="mt-4 px-4 py-2 bg-gray-500 text-white rounded">
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-green-100 text-green-800 p-6 border-b border-green-200">
        <h5 className="text-xl font-semibold flex items-center">
          <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
          </svg>
          Resumen Final de la Compra
        </h5>
      </div>
      
      <div className="p-6 space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h6 className="font-semibold text-blue-800 mb-3 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"/>
            </svg>
            Datos del Vendedor
          </h6>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Nombre Completo:</span>
              <div className="font-medium text-gray-900">
                {clienteData.nombre} {clienteData.apellidos}
              </div>
            </div>
            <div>
              <span className="text-gray-600">DNI:</span>
              <div className="font-medium font-mono text-gray-900">{clienteData.dni}</div>
            </div>
            <div>
              <span className="text-gray-600">Teléfono:</span>
              <div className="font-medium text-gray-900">{clienteData.telefono}</div>
            </div>
            <div>
              <span className="text-gray-600">Email:</span>
              <div className="font-medium text-gray-900">
                {clienteData.email || "No proporcionado"}
              </div>
            </div>
            {clienteData.direccion && (
              <div className="md:col-span-2">
                <span className="text-gray-600">Dirección:</span>
                <div className="font-medium text-gray-900">
                  {clienteData.direccion}
                  {clienteData.ciudad && `, ${clienteData.ciudad}`}
                  {clienteData.codigoPostal && ` (${clienteData.codigoPostal})`}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
          <h6 className="font-semibold text-cyan-800 mb-3 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
            </svg>
            Dispositivo a Comprar
          </h6>
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Dispositivo:</span>
                <div className="font-medium text-lg text-gray-900">
                  {dispositivoData.marca} {dispositivoData.modelo}
                </div>
              </div>
              <div>
                <span className="text-gray-600">Capacidad:</span>
                <div className="font-medium text-gray-900">{dispositivoData.capacidad}</div>
              </div>
              <div>
                <span className="text-gray-600">Color:</span>
                <div className="font-medium text-gray-900">{dispositivoData.color}</div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">IMEI:</span>
                <div className="font-medium font-mono text-gray-900">{dispositivoData.imei}</div>
              </div>
              <div>
                <span className="text-gray-600">Estados:</span>
                <div className="font-medium text-gray-900">
                  Físico: {formatearEstado(dispositivoData.estadoFisico)} • 
                  Funcional: {formatearEstado(dispositivoData.estadoFuncional)}
                </div>
              </div>
            </div>
            {dispositivoData.accesorios.length > 0 && (
              <div>
                <span className="text-gray-600 text-sm">Accesorios incluidos:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {dispositivoData.accesorios.map(accesorio => (
                    <span key={accesorio} className="bg-cyan-200 text-cyan-800 px-2 py-1 rounded text-xs">
                      {accesorio}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {dispositivoData.observaciones && (
              <div>
                <span className="text-gray-600 text-sm">Observaciones:</span>
                <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded mt-1">
                  {dispositivoData.observaciones}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h6 className="font-semibold text-green-800 mb-3 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
            </svg>
            Información Financiera
          </h6>
          <div className="text-center bg-white p-4 rounded-lg border">
            <div className="text-sm text-gray-600 mb-1">Precio de Compra</div>
            <div className="text-3xl font-bold text-green-600">
              €{dispositivoData.precioCompra.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-gray-200 rounded-lg p-4">
            <h6 className="font-semibold text-gray-800 mb-3 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
              </svg>
              Método de Pago
            </h6>
            <div className="space-y-3">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  value="efectivo"
                  checked={metodoPago === "efectivo"}
                  onChange={manejarCambioMetodoPago}
                  className="mr-3 text-green-600 focus:ring-green-500"
                />
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                  </svg>
                  <span className="font-medium">Pago en Efectivo</span>
                </div>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  value="transferencia"
                  checked={metodoPago === "transferencia"}
                  onChange={manejarCambioMetodoPago}
                  className="mr-3 text-green-600 focus:ring-green-500"
                />
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"/>
                    <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd"/>
                  </svg>
                  <span className="font-medium">Transferencia Bancaria</span>
                </div>
              </label>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <h6 className="font-semibold text-gray-800 mb-3 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"/>
              </svg>
              Documentos a Generar
            </h6>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={generarDocumentos.contrato}
                  onChange={manejarCambioDocumento('contrato')}
                  className="mr-2 text-green-600 focus:ring-green-500"
                />
                <span className="text-sm">Contrato de Compraventa</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={generarDocumentos.registroPolicial}
                  onChange={manejarCambioDocumento('registroPolicial')}
                  className="mr-2 text-green-600 focus:ring-green-500"
                />
                <span className="text-sm">Registro Policial</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={generarDocumentos.registroREBU}
                  onChange={manejarCambioDocumento('registroREBU')}
                  className="mr-2 text-green-600 focus:ring-green-500"
                />
                <span className="text-sm">Registro REBU</span>
              </label>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Observaciones Adicionales de la Compra
          </label>
          <textarea
            value={observaciones}
            onChange={manejarCambioObservaciones}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            rows={3}
            placeholder="Cualquier nota adicional sobre la transacción, acuerdos especiales, etc..."
          />
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h6 className="font-medium text-gray-800 mb-2">Información de la Transacción:</h6>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Fecha:</span>
              <div className="font-medium">{new Date().toLocaleDateString('es-ES')}</div>
            </div>
            <div>
              <span className="text-gray-600">Hora:</span>
              <div className="font-medium">{new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <button 
            onClick={onAtras} 
            disabled={estaCargando}
            className="flex items-center px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd"/>
            </svg>
            Volver a Evaluación
          </button>
          
          <button 
            onClick={manejarConfirmacion} 
            disabled={estaCargando}
            className="flex items-center px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transform hover:scale-105"
          >
            {estaCargando ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Procesando Compra...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
                Confirmar y Finalizar Compra
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Paso5ResumenCompra;