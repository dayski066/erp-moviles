import React, { useCallback } from 'react';

// === INTERFACES ===
export interface EvaluacionDispositivo {
  pantalla: 'perfecto' | 'rayones_leves' | 'rayones_visibles' | 'grietas' | 'rota';
  marco: 'perfecto' | 'desgaste_leve' | 'golpes_leves' | 'golpes_visibles' | 'muy_dañado';
  parte_trasera: 'perfecto' | 'rayones_leves' | 'rayones_visibles' | 'grietas' | 'muy_dañada';
  botones: 'funcionan_perfecto' | 'funcionan_bien' | 'alguno_falla' | 'varios_fallan' | 'no_funcionan';
  camara: 'perfecto' | 'funciona_bien' | 'calidad_regular' | 'problemas' | 'no_funciona';
  bateria: 'excelente' | 'buena' | 'regular' | 'mala' | 'muy_mala';
  carga: 'carga_perfecta' | 'carga_lenta' | 'problemas_carga' | 'no_carga';
  conectividad: 'todo_perfecto' | 'algún_problema' | 'varios_problemas' | 'muchos_problemas';
}

export interface DispositivoData {
  marca: string;
  modelo: string;
  capacidad: string;
  color: string;
}

// === PROPS DEL COMPONENTE (ACTUALIZADAS) ===
interface Paso4EvaluacionProps {
  evaluacionData: EvaluacionDispositivo;
  onChange: (data: EvaluacionDispositivo) => void;
  precioCompra: number; // AÑADIDO: Para controlar el input
  onPrecioCompraChange: (precio: number) => void; // AÑADIDO: Para notificar el cambio de precio
  onSiguiente: () => void;
  onAtras: () => void;
  dispositivo: DispositivoData;
}

// === COMPONENTE PASO 4 (SIMPLIFICADO) ===
const Paso4Evaluacion: React.FC<Paso4EvaluacionProps> = ({
  evaluacionData,
  onChange,
  precioCompra,
  onPrecioCompraChange,
  onSiguiente,
  onAtras,
  dispositivo
}) => {
  const opcionesEvaluacion = {
    pantalla: { perfecto: 'Perfecto - Sin rayones ni grietas', rayones_leves: 'Rayones Leves - Apenas perceptibles', rayones_visibles: 'Rayones Visibles - Se notan al usar', grietas: 'Grietas - Funciona pero con daños', rota: 'Rota - No funciona correctamente' },
    marco: { perfecto: 'Perfecto - Como nuevo', desgaste_leve: 'Desgaste Leve - Uso normal', golpes_leves: 'Golpes Leves - Marcas menores', golpes_visibles: 'Golpes Visibles - Daños evidentes', muy_dañado: 'Muy Dañado - Deformaciones' },
    parte_trasera: { perfecto: 'Perfecto - Sin daños', rayones_leves: 'Rayones Leves - Uso normal', rayones_visibles: 'Rayones Visibles - Marcas claras', grietas: 'Grietas - Daños estructurales', muy_dañada: 'Muy Dañada - Rotura severa' },
    botones: { funcionan_perfecto: 'Funcionan Perfecto - Respuesta ideal', funcionan_bien: 'Funcionan Bien - Respuesta normal', alguno_falla: 'Alguno Falla - Un botón problemático', varios_fallan: 'Varios Fallan - Múltiples problemas', no_funcionan: 'No Funcionan - Inoperativos' },
    camara: { perfecto: 'Perfecto - Calidad óptima', funciona_bien: 'Funciona Bien - Calidad buena', calidad_regular: 'Calidad Regular - Funcional', problemas: 'Problemas - Calidad deficiente', no_funciona: 'No Funciona - Inoperativa' },
    bateria: { excelente: 'Excelente (90-100%) - Como nueva', buena: 'Buena (70-89%) - Duración adecuada', regular: 'Regular (50-69%) - Duración limitada', mala: 'Mala (30-49%) - Duración muy corta', muy_mala: 'Muy Mala (<30%) - Requiere cambio' },
    carga: { carga_perfecta: 'Carga Perfecta - Sin problemas', carga_lenta: 'Carga Lenta - Funciona pero despacio', problemas_carga: 'Problemas de Carga - Intermitente', no_carga: 'No Carga - Puerto dañado' },
    conectividad: { todo_perfecto: 'Todo Perfecto - WiFi, Bluetooth, móvil OK', algún_problema: 'Algún Problema - Un aspecto falla', varios_problemas: 'Varios Problemas - Múltiples fallos', muchos_problemas: 'Muchos Problemas - Conectividad muy limitada' }
  } as const;

  const actualizarCampo = useCallback(<K extends keyof EvaluacionDispositivo>(campo: K, valor: EvaluacionDispositivo[K]) => {
    onChange({ ...evaluacionData, [campo]: valor });
  }, [evaluacionData, onChange]);

  const manejarCambioSelect = useCallback((campo: keyof EvaluacionDispositivo) => (e: React.ChangeEvent<HTMLSelectElement>) => {
    actualizarCampo(campo, e.target.value as EvaluacionDispositivo[typeof campo]);
  }, [actualizarCampo]);

  const manejarCambioPrecio = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value === '' ? 0 : parseFloat(e.target.value);
    onPrecioCompraChange(Math.max(0, valor));
  };

  const esValido = precioCompra > 0;

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-red-100 text-red-800 p-6 border-b border-red-200">
        <h5 className="text-xl font-semibold flex items-center">
          <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"/></svg>
          Evaluación y Precio de Compra
        </h5>
      </div>
      
      <div className="p-6">
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h6 className="font-medium text-gray-800 mb-2">Dispositivo a evaluar:</h6>
          <p className="text-lg font-semibold text-gray-900">{dispositivo.marca} {dispositivo.modelo} <span className="text-gray-600">- {dispositivo.capacidad} - {dispositivo.color}</span></p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {(Object.keys(opcionesEvaluacion) as Array<keyof typeof opcionesEvaluacion>).map(campo => (
            <div key={campo} className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 capitalize">{campo.replace('_', ' ')}</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500" value={evaluacionData[campo]} onChange={manejarCambioSelect(campo)}>
                {Object.entries(opcionesEvaluacion[campo]).map(([valor, etiqueta]) => (<option key={valor} value={valor}>{etiqueta}</option>))}
              </select>
            </div>
          ))}
        </div>
        
        {/* --- AÑADIDO: Input para el precio manual --- */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <label htmlFor="precio-compra" className="block text-sm font-medium text-gray-700 mb-2">Precio de Compra Acordado (€)</label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">€</span>
                </div>
                <input
                    type="number"
                    id="precio-compra"
                    className="w-full pl-7 pr-12 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="0.00"
                    value={precioCompra === 0 ? '' : precioCompra}
                    onChange={manejarCambioPrecio}
                    step="0.01"
                    min="0"
                />
            </div>
            {!esValido && (
                <p className="mt-2 text-sm text-yellow-800">Debe introducir un precio de compra para poder continuar.</p>
            )}
        </div>
        {/* --- FIN DEL AÑADIDO --- */}

        <div className="flex justify-between items-center mt-6 pt-4 border-t">
          <button onClick={onAtras} className="flex items-center px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd"/></svg>
            Volver a Fotos
          </button>
          
          <button onClick={onSiguiente} disabled={!esValido} className={`flex items-center px-6 py-2 font-medium rounded-lg transition-colors shadow-lg transform hover:scale-105 ${esValido ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}>
            Continuar a Resumen
            <svg className="w-5 h-5 ml-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Paso4Evaluacion;