import React from 'react';

interface AutoridadSelectorsProps {
  facultades: { id: string; nombre: string }[];
  carreras: { id: string; nombre: string; facultadId: string; car_codigo?: string }[];
  selectedFacultad: string | null;
  selectedCarrera: string | null;
  onFacultadChange: (id: string) => void;
  onCarreraChange: (id: string) => void;
}

export const AutoridadSelectors: React.FC<AutoridadSelectorsProps> = ({
  facultades, carreras, selectedFacultad, selectedCarrera, onFacultadChange, onCarreraChange
}) => {
  // Filtrar carreras según la facultad seleccionada
  const carrerasFiltradas = selectedFacultad
    ? carreras.filter(c => c.facultadId === selectedFacultad)
    : [];

  return (
    <div className="flex gap-6 mb-8 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
      <div className="flex-1">
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">1. Seleccionar Facultad</label>
        <select
          className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
          value={selectedFacultad || ''}
          onChange={(e) => onFacultadChange(e.target.value)}
        >
          <option value="" disabled>Seleccione una facultad...</option>
          {facultades.map(f => (
            <option key={f.id} value={f.id}>{f.nombre}</option>
          ))}
        </select>
      </div>

      <div className="flex-1">
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">2. Seleccionar Carrera</label>
        <select
          className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
          value={selectedCarrera || ''}
          onChange={(e) => onCarreraChange(e.target.value)}
          disabled={!selectedFacultad}
        >
          <option value="" disabled>
            {selectedFacultad ? 'Seleccione una carrera...' : 'Primero seleccione una facultad'}
          </option>
          {carrerasFiltradas.map(c => (
            <option key={c.id} value={c.id}>
              {c.nombre} {c.car_codigo ? `· ${c.car_codigo}` : ''}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
