import { useEffect, useState } from 'react';
import { FileText, ChevronDown, Download, Landmark } from 'lucide-react';
import { facultadesOptions, carrerasOptions, aplicarCodigosCarreras } from '../data/institucionData';
import { obtenerCatalogoCarreras, type CatalogoCarrera } from '../api';
import { AutoridadSelectors } from './AutoridadSelectors';
import { DataCardView } from '../../components/DataCardView';

export function ProgresionAnaliticaAutoridad() {
  const [selectedFacultad, setSelectedFacultad] = useState<string | null>(null);
  const [selectedCarrera, setSelectedCarrera] = useState<string | null>(null);

  // Códigos oficiales desde el catálogo institucional; sin conexión los
  // selectores siguen funcionando y muestran solo el nombre de la carrera.
  const [catalogoCarreras, setCatalogoCarreras] = useState<CatalogoCarrera[]>([]);

  useEffect(() => {
    let activo = true;
    obtenerCatalogoCarreras()
      .then((carreras) => {
        if (activo) setCatalogoCarreras(carreras);
      })
      .catch(() => {
        // Sin catálogo disponible la UI degrada sin códigos, nunca se rompe.
      });
    return () => {
      activo = false;
    };
  }, []);

  const carrerasConCodigo = aplicarCodigosCarreras(carrerasOptions, catalogoCarreras);

  // La carrera se resetea al cambiar la facultad hasta que el usuario elija
  // una carrera de la lista filtrada.
  const handleFacultadChange = (id: string) => {
    setSelectedFacultad(id);
    setSelectedCarrera(null);
  };

  const handleCarreraChange = (id: string) => setSelectedCarrera(id);

  const facultadSeleccionada = facultadesOptions.find((f) => f.id === selectedFacultad)?.nombre ?? null;
  const carreraSeleccionada = carrerasOptions.find((c) => c.id === selectedCarrera)?.nombre ?? null;
  const contextoSeleccion = facultadSeleccionada
    ? carreraSeleccionada
      ? `${facultadSeleccionada} · ${carreraSeleccionada}`
      : `${facultadSeleccionada} · Seleccione una carrera`
    : 'Seleccione una facultad y una carrera para filtrar';

  return (
    <div className="mx-auto max-w-[1440px] space-y-10 p-5 sm:p-8 lg:p-10 bg-[#F8FAFC] min-h-screen">
      
      {/* PANEL DE CONTROL DE AUTORIDAD (DOBLE FILTRO) */}
      <div className="flex flex-col gap-6 rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm xl:flex-row xl:items-end xl:justify-between">
        
        <div className="flex flex-col gap-2 flex-1">
          <p className="flex items-center gap-2 text-xs font-bold tracking-widest text-slate-500 uppercase">
            <Landmark className="size-4 text-[#FFB800]" />
            Nivel Central · Autoridad Institucional
          </p>
          <h2 className="text-2xl font-bold text-[#0A192F]">Progresión analítica</h2>
          
        </div>

        <button
          disabled
          title="Próximamente"
          className="flex w-fit items-center gap-2 rounded-lg bg-[#0A192F] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors opacity-50 cursor-not-allowed"
        >
          <FileText className="size-4" />
          Exportar reporte a PDF
        </button>
      </div>

      {/* SELECTORES JERÁRQUICOS EN CASCADA: FACULTAD -> CARRERA */}
      <AutoridadSelectors
        facultades={facultadesOptions}
        carreras={carrerasConCodigo}
        selectedFacultad={selectedFacultad}
        selectedCarrera={selectedCarrera}
        onFacultadChange={handleFacultadChange}
        onCarreraChange={handleCarreraChange}
      />

      {/* CONTENEDOR DE DATOS DINÁMICOS */}
      <div className="space-y-6">
        
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold tracking-widest text-slate-500 uppercase mb-2">
              {contextoSeleccion}
            </p>
            <h1 className="text-3xl font-bold text-[#0A192F]">Datos de Progresión Analítica</h1>
            <p className="mt-1 text-sm text-slate-500 max-w-2xl">
              Visualización institucional de matrícula, admisión y retención.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
              Cohorte: <span className="text-slate-900">2026</span> <ChevronDown className="size-4 text-slate-400" />
            </button>
            <button
              disabled
              title="Próximamente"
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm opacity-50 cursor-not-allowed"
            >
              <Download className="size-4" /> Descargar Excel
            </button>
          </div>
        </div>

        {/* TABLA 1: Matrícula y admisión */}
        <DataCardView
          title="Matrícula y admisión por cohorte"
          description="Matrícula nueva y total por cohorte de ingreso (2022–2026)."
          defaultView="table"
          chartComponent={
            <div className="flex h-64 items-center justify-center rounded-lg bg-gray-50 text-gray-400">
              Gráfico en desarrollo...
            </div>
          }
          tableComponent={
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-[#FFF9E6]">
                    <th className="py-3 px-6 font-semibold text-slate-700 border-b border-slate-200">Indicador</th>
                    <th className="py-3 px-6 font-semibold text-slate-700 border-b border-slate-200">2022</th>
                    <th className="py-3 px-6 font-semibold text-slate-700 border-b border-slate-200">2023</th>
                    <th className="py-3 px-6 font-semibold text-slate-700 border-b border-slate-200">2024</th>
                    <th className="py-3 px-6 font-semibold text-slate-700 border-b border-slate-200">2025</th>
                    <th className="py-3 px-6 font-semibold text-slate-700 border-b border-slate-200">2026</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  <tr>
                    <td className="py-3.5 px-6 font-medium text-slate-800">Matrícula nueva según cohorte</td>
                    <td className="py-3.5 px-6">58</td>
                    <td className="py-3.5 px-6">49</td>
                    <td className="py-3.5 px-6">60</td>
                    <td className="py-3.5 px-6">63</td>
                    <td className="py-3.5 px-6">58</td>
                  </tr>
                  <tr className="bg-slate-50/50">
                    <td className="py-3.5 px-6 font-bold text-slate-900">Matrícula Total</td>
                    <td className="py-3.5 px-6 font-bold text-slate-900">345</td>
                    <td className="py-3.5 px-6 font-bold text-slate-900">348</td>
                    <td className="py-3.5 px-6 font-bold text-slate-900">346</td>
                    <td className="py-3.5 px-6 font-bold text-slate-900">326</td>
                    <td className="py-3.5 px-6 font-bold text-slate-900">312</td>
                  </tr>
                </tbody>
              </table>
            </div>
          }
        />

      </div>
    </div>
  );
}