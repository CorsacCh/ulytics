import React, { useState } from 'react';

interface DataCardViewProps {
  title: string;
  description?: string;
  chartComponent: React.ReactNode;
  tableComponent: React.ReactNode;
  defaultView?: 'chart' | 'table';
}

export const DataCardView: React.FC<DataCardViewProps> = ({
  title,
  description,
  chartComponent,
  tableComponent,
  defaultView = 'chart',
}) => {
  const [view, setView] = useState<'chart' | 'table'>(defaultView);

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-8 transition-shadow hover:shadow-md duration-300">
      <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>
          {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
        </div>

        {/* Controles Toggle con transición de color y sombra */}
        <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
          <button
            type="button"
            onClick={() => setView('chart')}
            aria-pressed={view === 'chart'}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ease-in-out ${
              view === 'chart'
                ? 'bg-white text-blue-600 shadow-sm transform scale-100'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
            }`}
          >
            Gráfico
          </button>
          <button
            type="button"
            onClick={() => setView('table')}
            aria-pressed={view === 'table'}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ease-in-out ${
              view === 'table'
                ? 'bg-white text-blue-600 shadow-sm transform scale-100'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
            }`}
          >
            Tabla
          </button>
        </div>
      </div>

      {/* Renderizado con animación de fundido (Fade-in) */}
      <div
        key={view}
        className="w-full min-w-0 animate-[fadeIn_0.3s_ease-in-out]"
        style={{ animation: 'fadeIn 0.3s ease-in-out' }}
      >
        {view === 'chart' ? chartComponent : tableComponent}
      </div>

      {/* Definición global del keyframe fadeIn (fundido sutil con desplazamiento de 4px) */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};
