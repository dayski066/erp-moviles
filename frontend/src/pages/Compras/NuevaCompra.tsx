import React, { useState, useCallback, useMemo } from "react";
import { useNavigate } from 'react-router-dom';

import Paso1Vendedor from "./components/Paso1Vendedor";
import Paso2DispositivoCompra from "./components/Paso2DispositivoCompra";
import Paso3FotosCompra from "./components/Paso3FotosCompra";
import Paso4Evaluacion from "./components/Paso4Evaluacion";
import Paso5ResumenCompra from "./components/Paso5ResumenCompra";

import StepIndicator from '../../components/core/Common/StepIndicator';

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

const NuevaCompra: React.FC = () => {
  const navigate = useNavigate();
  
  const [clienteData, setClienteData] = useState<ClienteData | null>(null);
  const [esClienteValido, setEsClienteValido] = useState<boolean>(false);
  const [dispositivoData, setDispositivoData] = useState<DispositivoUsado>({
    marca: "",
    modelo: "",
    imei: "",
    color: "",
    capacidad: "",
    estadoFisico: "bueno",
    estadoFuncional: "funciona",
    accesorios: [],
    observaciones: "",
    precioCompra: 0,
    precioEstimadoVenta: 0
  });
  
  const [evaluacionData, setEvaluacionData] = useState<EvaluacionDispositivo>({
    pantalla: "perfecto",
    marco: "perfecto",
    parte_trasera: "perfecto",
    botones: "funcionan_perfecto",
    camara: "perfecto",
    bateria: "excelente",
    carga: "carga_perfecta",
    conectividad: "todo_perfecto"
  });
  
  const [pasoActual, setPasoActual] = useState<number>(1);
  const [estaCargando, setEstaCargando] = useState<boolean>(false);
  const [mostrarExito, setMostrarExito] = useState<boolean>(false);
  const [fotos, setFotos] = useState<string[]>([]);

  const steps = [
    { number: 1, text: 'Cliente', icon: 'bi-person' },
    { number: 2, text: 'Dispositivo', icon: 'bi-phone' },
    { number: 3, text: 'Fotos', icon: 'bi-camera' },
    { number: 4, text: 'Evaluación', icon: 'bi-clipboard-check' },
    { number: 5, text: 'Resumen', icon: 'bi-file-earmark-text' }
  ];

  const manejarCambioCliente = useCallback((cliente: ClienteData, esValido: boolean) => {
    setClienteData(cliente);
    setEsClienteValido(esValido);
  }, []);

  const manejarCambioDispositivo = useCallback((dispositivo: DispositivoUsado) => {
    setDispositivoData(dispositivo);
  }, []);

  const manejarCambioEvaluacion = useCallback((evaluacion: EvaluacionDispositivo) => {
    setEvaluacionData(evaluacion);
  }, []);
  
  const manejarCambioPrecioCompra = useCallback((precio: number) => {
    setDispositivoData(previo => ({
      ...previo,
      precioCompra: precio
    }));
  }, []);

  const manejarSubidaArchivos = useCallback((archivos: File[]) => {
    const nuevasFotos = archivos.map(archivo => URL.createObjectURL(archivo));
    setFotos(previo => [...previo, ...nuevasFotos]);
  }, []);

  const eliminarFoto = useCallback((index: number) => {
    setFotos(previo => previo.filter((_, i) => i !== index));
  }, []);

  const reiniciarFormulario = useCallback(() => {
    setMostrarExito(false);
    setPasoActual(1);
    setClienteData(null);
    setEsClienteValido(false);
    setDispositivoData({
      marca: "",
      modelo: "",
      imei: "",
      color: "",
      capacidad: "",
      estadoFisico: "bueno",
      estadoFuncional: "funciona",
      accesorios: [],
      observaciones: "",
      precioCompra: 0,
      precioEstimadoVenta: 0
    });
    setEvaluacionData({
      pantalla: "perfecto",
      marco: "perfecto",
      parte_trasera: "perfecto",
      botones: "funcionan_perfecto",
      camara: "perfecto",
      bateria: "excelente",
      carga: "carga_perfecta",
      conectividad: "todo_perfecto"
    });
    setFotos([]);
  }, []);

  const procesarCompra = useCallback(async (datosFinales: CompraDataCompleta) => {
    setEstaCargando(true);
    
    try {
      await new Promise<void>(resolve => setTimeout(resolve, 2500));
      
      const compraData = {
        ...datosFinales,
        numero_orden: `C-${Date.now()}`,
        estado: 'completada',
        fotos: fotos.length
      };
      
      console.log('Compra procesada exitosamente:', compraData);
      
      setMostrarExito(true);
      
    } catch (error) {
      console.error('Error al procesar la compra:', error);
      alert('Error al procesar la compra. Por favor, inténtelo de nuevo.');
    } finally {
      setEstaCargando(false);
    }
  }, [fotos]);

  const PanelResumen = useMemo(() => (
    <div className="bg-white rounded-lg shadow-sm sticky-top" style={{ top: '20px' }}>
      <div className="p-6 bg-gray-200 text-gray-800 rounded-t-lg">
        <h5 className="text-xl font-semibold flex items-center mb-0">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" viewBox="0 0 20 20" fill="currentColor">
            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
          </svg>
          Información de la Compra
        </h5>
      </div>
      
      <div className="p-4">
        <h6 className="font-bold mb-3">Estado del Proceso:</h6>
        <div className="mb-3">
          {steps.map((step) => (
            <div key={step.number} className="flex items-center justify-between mb-2">
              <span className="flex items-center">
                <span className="mr-2">{step.text}:</span>
              </span>
              {pasoActual > step.number ? (
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">✓ Completo</span>
              ) : pasoActual === step.number ? (
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">En proceso</span>
              ) : (
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">Pendiente</span>
              )}
            </div>
          ))}
        </div>

        <hr className="my-4" />

        {clienteData && (
          <>
            <h6 className="font-bold mb-2">Vendedor:</h6>
            <p className="text-sm mb-3">
              {clienteData.nombre} {clienteData.apellidos}<br />
              <span className="text-gray-500">Tel: {clienteData.telefono}</span>
            </p>
          </>
        )}

        {dispositivoData.marca && (
          <>
            <h6 className="font-bold mb-2">Dispositivo:</h6>
            <p className="text-sm mb-3">
              {dispositivoData.marca} {dispositivoData.modelo}<br />
              {dispositivoData.color && <span className="text-gray-500">Color: {dispositivoData.color}</span>}
              <br />
              {dispositivoData.capacidad && <span className="text-gray-500">Capacidad: {dispositivoData.capacidad}</span>}
            </p>
          </>
        )}

        {fotos.length > 0 && (
          <>
            <h6 className="font-bold mb-2">Fotos:</h6>
            <p className="text-sm mb-3">
              <span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium mr-2 mb-2 px-2.5 py-0.5 rounded-full">
                {fotos.length} foto{fotos.length !== 1 ? 's' : ''} subida{fotos.length !== 1 ? 's' : ''}
              </span>
            </p>
          </>
        )}

        {dispositivoData.precioCompra > 0 && (
          <>
            <h6 className="font-bold mb-2">Precio Acordado:</h6>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm">Precio de compra:</span>
              <span className="text-green-600 font-bold text-xl">€{dispositivoData.precioCompra.toFixed(2)}</span>
            </div>
          </>
        )}

        <hr className="my-4" />

        <div className="bg-blue-50 text-blue-700 p-3 rounded-lg text-sm mb-0">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Recordatorio</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>Verifique todos los datos antes de confirmar la compra del dispositivo.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  ), [clienteData, dispositivoData, fotos, pasoActual, steps]);

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="mb-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-2 text-cyan-500 inline" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
              </svg>
              Nueva Compra de Dispositivo Usado
            </h2>
            <button 
              className="btn btn-outline-secondary"
              onClick={() => navigate('/compras/historial')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 inline" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd"/>
              </svg>
              Volver
            </button>
          </div>
        </div>
      </div>

      <StepIndicator currentStep={pasoActual} steps={steps} />

      {mostrarExito && (
        <div className="alert alert-success" role="alert">
          <div className="d-flex align-items-center mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
            </svg>
            <div className="flex-grow-1">
              <h5 className="alert-heading mb-1">¡Compra procesada exitosamente!</h5>
              <p className="mb-0">
                Se ha registrado la compra del dispositivo {dispositivoData.marca} {dispositivoData.modelo}.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => navigate('/compras/historial')}
              className="btn btn-outline-success"
            >
              Ir al Historial
            </button>
            <button
              onClick={reiniciarFormulario}
              className="btn btn-success"
            >
              Registrar Otra Compra
            </button>
          </div>
        </div>
      )}

      {!mostrarExito && (
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-2/3">
            {pasoActual === 1 && (
              <Paso1Vendedor
                onClienteChange={manejarCambioCliente}
                onSiguiente={() => setPasoActual(2)}
                esValido={esClienteValido}
              />
            )}

            {pasoActual === 2 && (
              <Paso2DispositivoCompra
                dispositivoData={dispositivoData}
                onChange={manejarCambioDispositivo}
                onSiguiente={() => setPasoActual(3)}
                onAtras={() => setPasoActual(1)}
              />
            )}

            {pasoActual === 3 && (
              <Paso3FotosCompra
                fotos={fotos}
                onSubirArchivos={manejarSubidaArchivos}
                onEliminarFoto={eliminarFoto}
                onSiguiente={() => setPasoActual(4)}
                onAtras={() => setPasoActual(2)}
              />
            )}

            {pasoActual === 4 && (
              <Paso4Evaluacion
                evaluacionData={evaluacionData}
                onChange={manejarCambioEvaluacion}
                precioCompra={dispositivoData.precioCompra}
                onPrecioCompraChange={manejarCambioPrecioCompra}
                onSiguiente={() => setPasoActual(5)}
                onAtras={() => setPasoActual(3)}
                dispositivo={dispositivoData}
              />
            )}

            {pasoActual === 5 && (
              <Paso5ResumenCompra
                clienteData={clienteData}
                dispositivoData={dispositivoData}
                evaluacionData={evaluacionData}
                onConfirmar={procesarCompra}
                onAtras={() => setPasoActual(4)}
                estaCargando={estaCargando}
              />
            )}
          </div>
          
          <div className="w-full lg:w-1/3">
            {PanelResumen}
          </div>
        </div>
      )}
    </div>
  );
};

export default NuevaCompra;