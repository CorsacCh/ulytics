import React, { useState, useRef } from 'react';

export const CargaDatosPanel = () => {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [periodo, setPeriodo] = useState('2026-1'); // Valor por defecto del select
  const [estado, setEstado] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [mensaje, setMensaje] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setArchivo(e.target.files[0]);
      setEstado('idle');
      setMensaje('');
    }
  };

  const handleUpload = async () => {
    if (!archivo) return;

    setEstado('loading');
    setMensaje('');

    // 1. Preparar los datos en formato multipart/form-data
    const formData = new FormData();
    formData.append('archivo', archivo);
    formData.append('periodo', periodo);

    try {
      // 2. Enviar al backend (Ajusta la URL base si la tienes centralizada en un archivo api.ts)
      const response = await fetch('http://localhost:4004/api/cargas/upload', {
        method: 'POST',
        body: formData,
        // CRÍTICO: 'include' obliga al navegador a enviar la cookie de sesión JWT al backend
        credentials: 'include', 
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error desconocido al procesar el archivo');
      }

      // 3. Éxito
      setEstado('success');
      setMensaje(`¡Carga exitosa! Se procesaron y guardaron ${data.filas_procesadas} filas.`);
      setArchivo(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

    } catch (error: unknown) {
      setEstado('error');
      if (error instanceof Error) {
        setMensaje(error.message);
      } else {
        setMensaje('Error desconocido al procesar el archivo');
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-6 flex items-center gap-4">
        <label className="text-sm font-medium text-gray-700">Período:</label>
        <select 
          value={periodo} 
          onChange={(e) => setPeriodo(e.target.value)}
          className="border border-gray-300 rounded-md text-sm p-2 bg-white"
        >
          <option value="2026-1">2026 - Semestre 1</option>
          <option value="2026-2">2026 - Semestre 2</option>
          <option value="2025-2">2025 - Semestre 2</option>
        </select>
      </div>

      <div className="border border-dashed border-gray-300 rounded-lg p-10 text-center bg-gray-50">
        <div className="mx-auto w-12 h-12 mb-4 text-yellow-600 bg-yellow-50 rounded-full flex items-center justify-center">
          {/* Icono de subida */}
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
          </svg>
        </div>
        
        <h3 className="text-lg font-semibold text-[#002B49] mb-2">Carga única de información académica</h3>
        <p className="text-sm text-gray-600 mb-6 max-w-2xl mx-auto">
          Sube un solo archivo Excel (.xlsx) con toda la información de matrícula, calificaciones, progresión, retención y titulación.
        </p>

        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".xlsx, .xls"
          className="hidden"
          id="file-upload"
        />
        
        <label 
          htmlFor="file-upload"
          className="cursor-pointer inline-flex items-center px-6 py-2 bg-[#D4A32C] hover:bg-yellow-600 text-white font-medium rounded-md transition-colors"
        >
          {archivo ? archivo.name : 'Seleccionar Excel'}
        </label>
        
        <p className="mt-3 text-xs text-gray-500">
          Formato permitido: XLSX · Incluye todos los campos del período seleccionado
        </p>

        {archivo && (
          <div className="mt-6">
            <button 
              onClick={handleUpload}
              disabled={estado === 'loading'}
              className="px-8 py-2 bg-[#002B49] text-white font-medium rounded-md hover:bg-blue-900 disabled:opacity-50"
            >
              {estado === 'loading' ? 'Procesando...' : 'Iniciar Carga de Datos'}
            </button>
          </div>
        )}

        {/* Mensajes de feedback */}
        {mensaje && (
          <div className={`mt-4 p-3 rounded-md text-sm ${estado === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {mensaje}
          </div>
        )}
      </div>
    </div>
  );
};
