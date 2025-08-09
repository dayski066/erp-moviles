import React, { useCallback, useState } from 'react';

interface Paso3FotosCompraProps {
  fotos: string[];
  onSubirArchivos: (archivos: File[]) => void;
  onEliminarFoto: (index: number) => void;
  onSiguiente: () => void;
  onAtras: () => void;
}

const Paso3FotosCompra: React.FC<Paso3FotosCompraProps> = ({ 
  fotos, 
  onSubirArchivos, 
  onEliminarFoto, 
  onSiguiente, 
  onAtras 
}) => {
  const [arrastrando, setArrastrando] = useState(false);
  const [error, setError] = useState<string>('');

  const manejarSubida = useCallback((archivos: FileList | File[]) => {
    setError('');
    const archivosArray = Array.from(archivos);
    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp'];
    const tamañoMaximo = 5 * 1024 * 1024; // 5MB
    
    const archivosValidos = archivosArray.filter(archivo => {
      if (!tiposPermitidos.includes(archivo.type)) {
        setError('Solo se permiten archivos JPEG, PNG o WebP');
        return false;
      }
      if (archivo.size > tamañoMaximo) {
        setError('Los archivos no pueden ser mayores a 5MB');
        return false;
      }
      return true;
    });
    
    if (archivosValidos.length !== archivosArray.length) {
      setTimeout(() => setError(''), 5000);
    }
    
    if (archivosValidos.length > 0) {
      onSubirArchivos(archivosValidos);
    }
  }, [onSubirArchivos]);

  const manejarCambioArchivo = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      manejarSubida(e.target.files);
    }
  }, [manejarSubida]);

  const manejarDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setArrastrando(false);
    if (e.dataTransfer.files) {
      manejarSubida(e.dataTransfer.files);
    }
  }, [manejarSubida]);

  const manejarDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setArrastrando(true);
  }, []);

  const manejarDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setArrastrando(false);
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-yellow-100 text-yellow-800 p-6 border-b border-yellow-200">
        <h5 className="text-xl font-semibold flex items-center">
          <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd"/>
          </svg>
          Fotos del Dispositivo
          <span className="ml-2 text-sm font-normal">({fotos.length} foto{fotos.length !== 1 ? 's' : ''})</span>
        </h5>
      </div>
      
      <div className="p-6">
        {/* Zona de subida de archivos */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subir fotos del dispositivo
          </label>
          
          <div 
            className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 ${
              arrastrando 
                ? 'border-yellow-400 bg-yellow-50' 
                : 'border-gray-300 hover:border-yellow-400 hover:bg-gray-50'
            }`}
            onDrop={manejarDrop}
            onDragOver={manejarDragOver}
            onDragLeave={manejarDragLeave}
          >
            <div className="space-y-1">
              <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div className="flex text-sm text-gray-600 justify-center">
                <label className="relative cursor-pointer bg-white rounded-md font-medium text-yellow-600 hover:text-yellow-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-yellow-500 transition-colors">
                  <span>Subir archivos</span>
                  <input 
                    type="file" 
                    multiple 
                    accept="image/jpeg,image/png,image/webp" 
                    onChange={manejarCambioArchivo}
                    className="sr-only"
                  />
                </label>
                <p className="pl-1">o arrastra y suelta aquí</p>
              </div>
              <p className="text-xs text-gray-500">PNG, JPG, WebP hasta 5MB cada uno</p>
              <p className="text-xs text-gray-400">Recomendado: fotos del frente, parte trasera, pantalla encendida y detalles</p>
            </div>
          </div>

          {/* Mensaje de error */}
          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                </svg>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Galería de fotos */}
        {fotos.length > 0 && (
          <div className="mb-6">
            <h6 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd"/>
              </svg>
              Fotos subidas ({fotos.length})
            </h6>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {fotos.map((foto, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-square">
                    <img 
                      src={foto} 
                      alt={`Foto ${index + 1} del dispositivo`} 
                      className="w-full h-full object-cover rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                    />
                  </div>
                  <button 
                    onClick={() => onEliminarFoto(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    title="Eliminar foto"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                    </svg>
                  </button>
                  <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-xs">
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Consejos para mejores fotos */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h6 className="font-medium text-blue-800 mb-2 flex items-center">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
            </svg>
            Consejos para mejores fotos:
          </h6>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Usa buena iluminación natural</li>
            <li>• Incluye fotos del frente, parte trasera y laterales</li>
            <li>• Captura la pantalla encendida mostrando el escritorio</li>
            <li>• Enfoca cualquier daño o defecto visible</li>
            <li>• Toma fotos de los accesorios incluidos</li>
          </ul>
        </div>

        {/* Estado de las fotos */}
        {fotos.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
              </svg>
              <p className="text-sm text-yellow-800">
                <strong>Recomendación:</strong> Aunque las fotos son opcionales, ayudan mucho en la evaluación y documentación del dispositivo.
              </p>
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
            Volver a Dispositivo
          </button>
          <button 
            onClick={onSiguiente} 
            className="flex items-center px-6 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-lg transition-colors shadow-lg transform hover:scale-105"
          >
            Continuar a Evaluación
            <svg className="w-5 h-5 ml-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Paso3FotosCompra;