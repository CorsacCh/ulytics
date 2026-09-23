import { useState, useEffect } from 'react';
import { FileText, ChevronDown, Building2, Download, GraduationCap, Landmark } from 'lucide-react';
import { datosInstitucionales, facultades } from '../data/institucionData';

export function ProgresionCurricularAutoridad() {
  const [facultadActiva, setFacultadActiva] = useState(facultades[0]);
  const [carreraActiva, setCarreraActiva] = useState(datosInstitucionales[facultades[0]][0]);
  
  const [menuFacultadAbierto, setMenuFacultadAbierto] = useState(false);
  const [menuCarreraAbierto, setMenuCarreraAbierto] = useState(false);

  // Efecto para reiniciar la carrera cuando se cambia la facultad
  useEffect(() => {
    setCarreraActiva(datosInstitucionales[facultadActiva][0]);
  }, [facultadActiva]);

  return (
    <div className="mx-auto max-w-[1440px] space-y-10 p-5 sm:p-8 lg:p-10 bg-[#F8FAFC] min-h-screen">
      
      {/* PANEL DE CONTROL DE AUTORIDAD (DOBLE FILTRO) */}
      <div className="flex flex-col gap-6 rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm xl:flex-row xl:items-end xl:justify-between">
        
        <div className="flex flex-col gap-2 flex-1">
          <p className="flex items-center gap-2 text-xs font-bold tracking-widest text-slate-500 uppercase">
            <Landmark className="size-4 text-[#FFB800]" />
            Nivel Central · Autoridad Institucional
          </p>
          <h2 className="text-2xl font-bold text-[#0A192F]">Progresión curricular</h2>
          
          {/* Contenedor de Filtros */}
          <div className="mt-2 flex flex-col sm:flex-row gap-4">
            
            {/* Dropdown 1: FACULTAD */}
            <div className="relative w-full sm:w-[350px]">
              <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">1. Seleccionar Facultad</label>
              <button 
                onClick={() => {
                  setMenuFacultadAbierto(!menuFacultadAbierto);
                  setMenuCarreraAbierto(false);
                }}
                className="flex w-full items-center justify-between rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5 text-left font-bold text-[#0A192F] shadow-sm transition-colors hover:bg-slate-100 focus:outline-none"
              >
                <div className="flex items-center gap-2 truncate">
                  <Building2 className="size-4 text-slate-400 flex-shrink-0" />
                  <span className="truncate">{facultadActiva}</span>
                </div>
                <ChevronDown className={`size-4 text-slate-500 transition-transform ${menuFacultadAbierto ? 'rotate-180' : ''}`} />
              </button>
              
              {menuFacultadAbierto && (
                <div className="absolute left-0 top-[calc(100%+8px)] z-50 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl">
                  {facultades.map((facultad) => (
                    <button
                      key={facultad}
                      onClick={() => {
                        setFacultadActiva(facultad);
                        setMenuFacultadAbierto(false);
                      }}
                      className={`w-full px-4 py-3 text-left text-sm transition-colors hover:bg-slate-50 ${
                        facultadActiva === facultad 
                          ? 'border-l-4 border-[#FFB800] bg-slate-50 font-bold text-[#0A192F]' 
                          : 'border-l-4 border-transparent font-medium text-slate-600'
                      }`}
                    >
                      {facultad}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Dropdown 2: CARRERA */}
            <div className="relative w-full sm:w-[350px]">
              <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">2. Seleccionar Carrera</label>
              <button 
                onClick={() => {
                  setMenuCarreraAbierto(!menuCarreraAbierto);
                  setMenuFacultadAbierto(false);
                }}
                className="flex w-full items-center justify-between rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5 text-left font-bold text-[#0A192F] shadow-sm transition-colors hover:bg-slate-100 focus:outline-none"
              >
                <div className="flex items-center gap-2 truncate">
                  <GraduationCap className="size-4 text-slate-400 flex-shrink-0" />
                  <span className="truncate">{carreraActiva}</span>
                </div>
                <ChevronDown className={`size-4 text-slate-500 transition-transform ${menuCarreraAbierto ? 'rotate-180' : ''}`} />
              </button>
              
              {menuCarreraAbierto && (
                <div className="absolute left-0 top-[calc(100%+8px)] z-50 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl">
                  {datosInstitucionales[facultadActiva].map((carrera) => (
                    <button
                      key={carrera}
                      onClick={() => {
                        setCarreraActiva(carrera);
                        setMenuCarreraAbierto(false);
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
        </div>

        <button className="flex w-fit items-center gap-2 rounded-lg bg-[#0A192F] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#112a4f]">
          <FileText className="size-4" />
          Exportar reporte a PDF
        </button>
      </div>

      {/* CONTENEDOR DE DATOS DINÁMICOS */}
      <div className="space-y-6">
        
        {/* Encabezado Dinámico */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold tracking-widest text-slate-500 uppercase mb-2">
              {facultadActiva} · {carreraActiva}
            </p>
            <h1 className="text-3xl font-bold text-[#0A192F]">Datos de Progresión Curricular</h1>
            <p className="mt-1 text-sm text-slate-500 max-w-2xl">
              Caracterización de la distribución de tipos de estado de avance de estudiantes matriculados en 2026.
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

        {/* TABLA 1: Tasa de eficiencia curricular por cohorte */}
        <div className="rounded-xl border border-slate-200/80 bg-white shadow-sm overflow-hidden mt-8">
          <div className="border-b border-slate-100 px-6 py-4">
            <h3 className="font-bold text-slate-800 text-lg">Tasa de eficiencia curricular por cohorte</h3>
            <p className="text-xs text-slate-500 mt-0.5">Distribución de estudiantes según cohorte de ingreso y estado de avance curricular.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-[#FFF9E6]">
                  <th className="py-3 px-6 font-semibold text-slate-700 border-b border-slate-200">Cohortes / Tasa de Eficiencia</th>
                  <th className="py-3 px-6 font-semibold text-slate-700 border-b border-slate-200">2021</th>
                  <th className="py-3 px-6 font-semibold text-slate-700 border-b border-slate-200">2022</th>
                  <th className="py-3 px-6 font-semibold text-slate-700 border-b border-slate-200">2023</th>
                  <th className="py-3 px-6 font-semibold text-slate-700 border-b border-slate-200">2024</th>
                  <th className="py-3 px-6 font-semibold text-slate-700 border-b border-slate-200">2025</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                <tr className="bg-slate-50/50">
                  <td className="py-3.5 px-6 font-bold text-slate-900">Nº Alumnos regulares</td>
                  <td className="py-3.5 px-6 font-bold text-slate-900">30</td>
                  <td className="py-3.5 px-6 font-bold text-slate-900">48</td>
                  <td className="py-3.5 px-6 font-bold text-slate-900">40</td>
                  <td className="py-3.5 px-6 font-bold text-slate-900">54</td>
                  <td className="py-3.5 px-6 font-bold text-slate-900">59</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-medium text-slate-800">Baja (entre 0&lt;60%)</td>
                  <td className="py-3.5 px-6">0</td>
                  <td className="py-3.5 px-6">1</td>
                  <td className="py-3.5 px-6">1</td>
                  <td className="py-3.5 px-6">2</td>
                  <td className="py-3.5 px-6">2</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-medium text-slate-800">Alta (entre 80 &lt;100%)</td>
                  <td className="py-3.5 px-6">26</td>
                  <td className="py-3.5 px-6">21</td>
                  <td className="py-3.5 px-6">8</td>
                  <td className="py-3.5 px-6">15</td>
                  <td className="py-3.5 px-6">17</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* TABLA 2: Estado de avance por ciclo formativo */}
        <div className="rounded-xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 px-6 py-4">
            <h3 className="font-bold text-slate-800 text-lg">Estado de avance por ciclo formativo</h3>
            <p className="text-xs text-slate-500 mt-0.5">Número de estudiantes con condición académica de Alumno Regular, matriculados en 2026, por estado de avance según ciclo formativo.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-[#FFF9E6]">
                  <th className="py-3 px-6 font-semibold text-slate-700 border-b border-slate-200">Cohorte</th>
                  <th className="py-3 px-6 font-semibold text-slate-700 border-b border-slate-200">Bachillerato</th>
                  <th className="py-3 px-6 font-semibold text-slate-700 border-b border-slate-200">Licenciatura (pendientes)</th>
                  <th className="py-3 px-6 font-semibold text-slate-700 border-b border-slate-200">Licenciatura</th>
                  <th className="py-3 px-6 font-semibold text-slate-700 border-b border-slate-200">Título (pendientes)</th>
                  <th className="py-3 px-6 font-semibold text-slate-700 border-b border-slate-200">Título</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                <tr>
                  <td className="py-3.5 px-6 font-bold text-slate-900">2021</td>
                  <td className="py-3.5 px-6">0%</td>
                  <td className="py-3.5 px-6">13%</td>
                  <td className="py-3.5 px-6">67%</td>
                  <td className="py-3.5 px-6">0%</td>
                  <td className="py-3.5 px-6">20%</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-bold text-slate-900">2022</td>
                  <td className="py-3.5 px-6">0%</td>
                  <td className="py-3.5 px-6">10%</td>
                  <td className="py-3.5 px-6">90%</td>
                  <td className="py-3.5 px-6">0%</td>
                  <td className="py-3.5 px-6">0%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* TABLA 3: Asignaturas críticas */}
        <div className="rounded-xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 px-6 py-4">
            <h3 className="font-bold text-slate-800 text-lg">Asignaturas críticas</h3>
            <p className="text-xs text-slate-500 mt-0.5">Se consideran críticas las asignaturas con reprobación mayor o igual a 30% en al menos 3 de los últimos 5 años, afectando la permanencia, titulación y tiempos de titulación.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-[#FFF9E6]">
                  <th className="py-3 px-6 font-semibold text-slate-700 border-b border-slate-200">Códigos asignaturas críticas</th>
                  <th className="py-3 px-6 font-semibold text-slate-700 border-b border-slate-200">Semestre</th>
                  <th className="py-3 px-6 font-semibold text-slate-700 border-b border-slate-200">2021</th>
                  <th className="py-3 px-6 font-semibold text-slate-700 border-b border-slate-200">2022</th>
                  <th className="py-3 px-6 font-semibold text-slate-700 border-b border-slate-200">2023</th>
                  <th className="py-3 px-6 font-semibold text-slate-700 border-b border-slate-200">2024</th>
                  <th className="py-3 px-6 font-semibold text-slate-700 border-b border-slate-200">2025</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                <tr>
                  <td className="py-3.5 px-6 font-bold text-slate-900">AAAA111-21</td>
                  <td className="py-3.5 px-6">1</td>
                  <td className="py-3.5 px-6">-</td>
                  <td className="py-3.5 px-6">62,8%</td>
                  <td className="py-3.5 px-6">55,0%</td>
                  <td className="py-3.5 px-6">-</td>
                  <td className="py-3.5 px-6">35,0%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}