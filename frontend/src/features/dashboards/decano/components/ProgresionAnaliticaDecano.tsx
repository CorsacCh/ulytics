import { useState } from 'react';
import { FileText, ChevronDown, Building2, Download } from 'lucide-react';

const carreras = [
  'Ingeniería Civil Acústica',
  'Ingeniería Civil en Obras Civiles',
  'Ingeniería en Construcción',
  'Ingeniería Civil Electrónica',
  'Ingeniería Civil Industrial',
  'Ingeniería Naval',
  'Ingeniería Civil en Informática',
  'Ingeniería Civil Mecánica',
  'Ingeniería Plan Común'
];

export function ProgresionAnaliticaDecano() {
  const [carreraActiva, setCarreraActiva] = useState('Ingeniería Civil en Informática');
  const [menuAbierto, setMenuAbierto] = useState(false);

  return (
    <div className="mx-auto max-w-[1440px] space-y-10 p-5 sm:p-8 lg:p-10 bg-[#F8FAFC] min-h-screen">
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-2">
          <p className="flex items-center gap-2 text-xs font-bold tracking-widest text-slate-500 uppercase">
            <Building2 className="size-4 text-[#FFB800]" />
            Facultad de Ingeniería
          </p>
          <h2 className="text-2xl font-bold text-[#0A192F]">Progresión analítica</h2>
          
          {/* Dropdown Selector de Carreras */}
          <div className="relative mt-2">
            <button 
              onClick={() => setMenuAbierto(!menuAbierto)}
              className="flex w-full md:w-[350px] items-center justify-between rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5 text-left font-bold text-[#0A192F] shadow-sm transition-colors hover:bg-slate-100 focus:outline-none"
            >
              <span className="truncate">{carreraActiva}</span>
              <ChevronDown className={`size-4 text-slate-500 transition-transform ${menuAbierto ? 'rotate-180' : ''}`} />
            </button>
            
            {menuAbierto && (
              <div className="absolute left-0 top-full z-50 mt-2 w-full md:w-[350px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl">
                {carreras.map((carrera) => (
                  <button
                    key={carrera}
                    onClick={() => {
                      setCarreraActiva(carrera);
                      setMenuAbierto(false);
                    }}
                    className={`w-full px-4 py-3 text-left text-sm transition-colors hover:bg-slate-50 ${
                      carreraActiva === carrera 
                        ? 'border-l-4 border-[#FFB800] bg-slate-50 font-bold text-[#0A192F]' 
                        : 'border-l-4 border-transparent font-medium text-slate-600'
                    }`}
                  >
                    {carrera}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <button className="flex w-fit items-center gap-2 rounded-lg bg-[#0A192F] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#112a4f]">
          <FileText className="size-4" />
          Exportar reporte a PDF
        </button>
      </div>

      {/* CONTENEDOR DE DATOS DE LA CARRERA SELECCIONADA */}
      <div className="space-y-6">
        
        {/* Encabezado Dinámico de la Carrera */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold tracking-widest text-slate-500 uppercase mb-2">
              {carreraActiva}
            </p>
            <h1 className="text-3xl font-bold text-[#0A192F]">Datos de Progresión Analítica</h1>
            <p className="mt-1 text-sm text-slate-500 max-w-2xl">
              Matrícula, admisión, retención y titulación organizada por cohorte, con los mismos periodos y métricas del reporte institucional.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
              Cohorte: <span className="text-slate-900">2026</span> <ChevronDown className="size-4 text-slate-400" />
            </button>
            <button className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
              <Download className="size-4" /> Descargar Excel
            </button>
          </div>
        </div>

        {/* TABLA 1: Matrícula y admisión por cohorte */}
        <div className="rounded-xl border border-slate-200/80 bg-white shadow-sm overflow-hidden mt-8">
          <div className="border-b border-slate-100 px-6 py-4">
            <h3 className="font-bold text-slate-800 text-lg">Matrícula y admisión por cohorte</h3>
          </div>
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
                <tr>
                  <td className="py-3.5 px-6 font-medium text-slate-800">% Mujeres</td>
                  <td className="py-3.5 px-6">95%</td>
                  <td className="py-3.5 px-6">100%</td>
                  <td className="py-3.5 px-6">98%</td>
                  <td className="py-3.5 px-6">92%</td>
                  <td className="py-3.5 px-6">95%</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-medium text-slate-800">Matrícula admisión regular (prueba)</td>
                  <td className="py-3.5 px-6">51</td>
                  <td className="py-3.5 px-6">44</td>
                  <td className="py-3.5 px-6">46</td>
                  <td className="py-3.5 px-6">51</td>
                  <td className="py-3.5 px-6">45</td>
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
        </div>

        {/* TABLA 2: Cohortes / Tasa de ocupación por vacante */}
        <div className="rounded-xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 px-6 py-4">
            <h3 className="font-bold text-slate-800 text-lg">Cohortes / Tasa de ocupación por vacante</h3>
          </div>
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
                  <td className="py-3.5 px-6 font-medium text-slate-800">Admisión regular</td>
                  <td className="py-3.5 px-6">113%</td>
                  <td className="py-3.5 px-6">98%</td>
                  <td className="py-3.5 px-6">102%</td>
                  <td className="py-3.5 px-6">102%</td>
                  <td className="py-3.5 px-6">100%</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-medium text-slate-800">Admisión especial PACE</td>
                  <td className="py-3.5 px-6">100%</td>
                  <td className="py-3.5 px-6">100%</td>
                  <td className="py-3.5 px-6">100%</td>
                  <td className="py-3.5 px-6">100%</td>
                  <td className="py-3.5 px-6">67%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}