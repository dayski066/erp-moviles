import React, { useCallback, useMemo } from 'react';

// === INTERFACES ===
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

// === PROPS DEL COMPONENTE ===
interface Paso2DispositivoCompraProps {
  dispositivoData: DispositivoUsado;
  onChange: (data: DispositivoUsado) => void;
  onSiguiente: () => void;
  onAtras: () => void;
}

// === COMPONENTE PASO 2 ===
const Paso2DispositivoCompra: React.FC<Paso2DispositivoCompraProps> = ({ 
  dispositivoData, 
  onChange, 
  onSiguiente, 
  onAtras 
}) => {
  const accesoriosComunes = [
    "Cargador original", "Cable USB", "Auriculares", "Funda", 
    "Protector de pantalla", "Caja original", "Documentación", "Adaptador"
  ] as const;

  const marcas = [
    "Apple", "Samsung", "Xiaomi", "Huawei", "OnePlus", 
    "Google", "Sony", "Motorola", "Otro"
  ] as const;
  
  const colores = [
    "Negro", "Blanco", "Gris", "Azul", "Verde", 
    "Rojo", "Rosa", "Dorado", "Plateado", "Otro"
  ] as const;
  
  const capacidades = ["32GB", "64GB", "128GB", "256GB", "512GB", "1TB"] as const;

  const esValido = useMemo(() => {
    return dispositivoData.marca && 
           dispositivoData.modelo && 
           dispositivoData.imei && 
           dispositivoData.color && 
           dispositivoData.capacidad &&
           dispositivoData.imei.length === 15 &&
           /^\d+$/.test(dispositivoData.imei);
  }, [dispositivoData]);

  const actualizarCampo = useCallback(<K extends keyof DispositivoUsado>(
    campo: K, 
    valor: DispositivoUsado[K]
  ) => {
    onChange({ ...dispositivoData, [campo]: valor });
  }, [dispositivoData, onChange]);

  const manejarAccesorio = useCallback((accesorio: string) => {
    const nuevosAccesorios = dispositivoData.accesorios.includes(accesorio)
      ? dispositivoData.accesorios.filter(a => a !== accesorio)
      : [...dispositivoData.accesorios, accesorio];
    actualizarCampo('accesorios', nuevosAccesorios);
  }, [dispositivoData.accesorios, actualizarCampo]);

  const manejarCambioTexto = useCallback((campo: 'modelo' | 'observaciones') => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    actualizarCampo(campo, e.target.value);
  }, [actualizarCampo]);

  const manejarCambioSelect = useCallback((campo: 'marca' | 'color' | 'capacidad' | 'estadoFisico' | 'estadoFuncional') => (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    actualizarCampo(campo, e.target.value as DispositivoUsado[typeof campo]);
  }, [actualizarCampo]);

  const manejarCambioIMEI = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const valorLimpio = e.target.value.replace(/\D/g, '');
    actualizarCampo('imei', valorLimpio);
  }, [actualizarCampo]);

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-cyan-100 text-cyan-800 p-6 border-b border-cyan-200">
        <h5 className="text-xl font-semibold flex items-center">
          <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
          </svg>
          Datos del Dispositivo
        </h5>
      </div>
      
      <div className="p-6 space-y-4">
        {/* Información básica del dispositivo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Marca *</label>
            <select 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
              value={dispositivoData.marca} 
              onChange={manejarCambioSelect('marca')}
            >
              <option value="">Seleccionar marca</option>
              {marcas.map(marca => (
                <option key={marca} value={marca}>{marca}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Modelo *</label>
            <input 
              type="text" 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="iPhone 15, Galaxy S24, etc." 
              value={dispositivoData.modelo} 
              onChange={manejarCambioTexto('modelo')} 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Color *</label>
            <select 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
              value={dispositivoData.color} 
              onChange={manejarCambioSelect('color')}
            >
              <option value="">Seleccionar color</option>
              {colores.map(color => (
                <option key={color} value={color}>{color}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Capacidad e IMEI */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Capacidad *</label>
            <select 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
              value={dispositivoData.capacidad} 
              onChange={manejarCambioSelect('capacidad')}
            >
              <option value="">Seleccionar capacidad</option>
              {capacidades.map(capacidad => (
                <option key={capacidad} value={capacidad}>{capacidad}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">IMEI *</label>
            <input 
              type="text" 
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                dispositivoData.imei && (dispositivoData.imei.length !== 15 || !/^\d+$/.test(dispositivoData.imei))
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-gray-300 focus:ring-cyan-500'
              }`}
              placeholder="15 dígitos del IMEI" 
              value={dispositivoData.imei} 
              onChange={manejarCambioIMEI}
              maxLength={15}
            />
            {dispositivoData.imei && (dispositivoData.imei.length !== 15 || !/^\d+$/.test(dispositivoData.imei)) && (
              <p className="text-red-500 text-xs mt-1">IMEI debe tener exactamente 15 dígitos</p>
            )}
          </div>
        </div>

        {/* Estados físico y funcional */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado Físico</label>
            <select 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
              value={dispositivoData.estadoFisico} 
              onChange={manejarCambioSelect('estadoFisico')}
            >
              <option value="excelente">Excelente - Como nuevo</option>
              <option value="bueno">Bueno - Signos mínimos de uso</option>
              <option value="regular">Regular - Signos evidentes de uso</option>
              <option value="malo">Malo - Daños visibles</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado Funcional</label>
            <select 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
              value={dispositivoData.estadoFuncional} 
              onChange={manejarCambioSelect('estadoFuncional')}
            >
              <option value="perfecto">Perfecto - Funciona como nuevo</option>
              <option value="funciona">Funciona bien - Sin problemas</option>
              <option value="problemas">Algunos problemas - Fallos menores</option>
              <option value="no_funciona">No funciona - Problemas graves</option>
            </select>
          </div>
        </div>

        {/* Accesorios incluidos */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Accesorios Incluidos</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {accesoriosComunes.map(accesorio => (
              <label key={accesorio} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                <input
                  type="checkbox"
                  checked={dispositivoData.accesorios.includes(accesorio)}
                  onChange={() => manejarAccesorio(accesorio)}
                  className="rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                />
                <span className="text-sm text-gray-700">{accesorio}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Observaciones */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
          <textarea 
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
            rows={3}
            placeholder="Detalles adicionales sobre el dispositivo, defectos específicos, funcionamiento..."
            value={dispositivoData.observaciones} 
            onChange={manejarCambioTexto('observaciones')}
          />
        </div>

        {/* Resumen del dispositivo */}
        {dispositivoData.marca && dispositivoData.modelo && (
          <div className="bg-cyan-50 p-4 rounded-lg border border-cyan-200">
            <h6 className="font-medium text-cyan-800 mb-2">Resumen del Dispositivo:</h6>
            <div className="text-sm text-cyan-700">
              <span className="font-medium">{dispositivoData.marca} {dispositivoData.modelo}</span>
              {dispositivoData.capacidad && <span> - {dispositivoData.capacidad}</span>}
              {dispositivoData.color && <span> - {dispositivoData.color}</span>}
              {dispositivoData.imei && (
                <div className="font-mono text-xs mt-1">IMEI: {dispositivoData.imei}</div>
              )}
            </div>
          </div>
        )}

        {/* Botones de navegación */}
        <div className="flex justify-between mt-6 pt-4 border-t">
          <button 
            onClick={onAtras} 
            className="flex items-center px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd"/>
            </svg>
            Volver a Cliente
          </button>
          <button 
            onClick={onSiguiente} 
            disabled={!esValido} 
            className={`flex items-center px-6 py-2 font-medium rounded-lg transition-colors ${
              esValido 
                ? 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg transform hover:scale-105' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Continuar a Fotos
            <svg className="w-5 h-5 ml-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Paso2DispositivoCompra;