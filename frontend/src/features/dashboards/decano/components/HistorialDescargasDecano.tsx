import { Search, SlidersHorizontal, Download, FileText, ChevronDown, Building2 } from 'lucide-react';

export function HistorialDescargasDecano() {
  // Datos simulados
  const descargas = [
    { nombre: 'Datos de Progresión Analítica Ing. Civil Informática', formato: 'Excel', periodo: 'Cohortes 2021–2026', fecha: '18 ago, 2026 · 09:42', tamano: '24 KB' },
    { nombre: 'Datos de Progresión Curricular Ing. Civil en Obras Civiles', formato: 'PDF', periodo: 'Cohortes 2021–2025', fecha: '17 ago, 2026 · 16:18', tamano: '188 KB' },
    { nombre: 'Datos de Progresión Analítica Ing. Civil en Obras Civiles', formato: 'PDF', periodo: 'Cohortes 2017–2026', fecha: '12 ago, 2026 · 11:06', tamano: '214 KB' },
    { nombre: 'Datos de Progresión Analítica Ing. Civil Acústica', formato: 'Excel', periodo: 'Cohortes 2017–2026', fecha: '28 jul, 2026 · 10:12', tamano: '25 KB' },
  ];

  return (
    <div className="mx-auto max-w-[1440px] space-y-10 p-5 sm:p-8 lg:p-10 bg-[#F8FAFC] min-h-screen">
      
      {/* ENCABEZADO SIMPLIFICADO */}
      <div>
        <p className="flex items-center gap-2 text-xs font-bold tracking-widest text-slate-500 uppercase mb-2">
          <Building2 className="size-4 text-[#FFB800]" />
          Facultad de Ingeniería
        </p>
        <h1 className="text-3xl font-bold text-[#0A192F]">Registro de descargas</h1>
        <p className="mt-1 text-sm text-slate-500 max-w-2xl">
          Historial general de archivos y reportes generados desde el panel de decanatura.
        </p>
      </div>

      {/* TARJETAS DE MÉTRICAS SUPERIORES */}
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Archivos descargados</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">24</p>
          <p className="text-xs text-slate-400 mt-1">En los últimos 90 días</p>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Última descarga</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">18 ago</p>
          <p className="text-xs text-slate-400 mt-1">Datos de Progresión Analítica</p>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Formatos utilizados</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">2</p>
          <p className="text-xs text-slate-400 mt-1">Excel y PDF</p>
        </div>
      </section>

      {/* SECCIÓN PRINCIPAL: TABLA DE ARCHIVOS */}
      <div className="rounded-xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-lg">Archivos descargados</h3>
            <p className="text-xs text-slate-500 mt-0.5">Consulta y vuelve a descargar reportes institucionales anteriores.</p>
          </div>
          <button className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 w-fit">
            <SlidersHorizontal className="size-4 text-slate-400" /> Auditoría de reportes
          </button>
        </div>

        {/* BARRA DE BÚSQUEDA */}
        <div className="p-6 pb-4 flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por nombre de reporte o carrera..." 
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2.5 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FFB800]/50"
            />
          </div>
          <button className="flex items-center justify-between w-full sm:w-36 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
            <span>Todos</span> <ChevronDown className="size-4 text-slate-400" />
          </button>
        </div>

        {/* TABLA DE REGISTROS */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-[#FFF9E6]">
                <th className="py-3 px-6 font-semibold text-slate-700 border-b border-slate-200">ARCHIVO</th>
                <th className="py-3 px-6 font-semibold text-slate-700 border-b border-slate-200">FORMATO</th>
                <th className="py-3 px-6 font-semibold text-slate-700 border-b border-slate-200">PERIODO</th>
                <th className="py-3 px-6 font-semibold text-slate-700 border-b border-slate-200">FECHA DE DESCARGA</th>
                <th className="py-3 px-6 font-semibold text-slate-700 border-b border-slate-200">TAMAÑO</th>
                <th className="py-3 px-6 font-semibold text-slate-700 border-b border-slate-200 text-right">ACCIÓN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {descargas.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
                        <FileText className="size-4" />
                      </div>
                      <span className="font-bold text-slate-800">{item.nombre}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-bold ${
                      item.formato === 'Excel' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
                    }`}>
                      {item.formato}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-slate-600">{item.periodo}</td>
                  <td className="py-4 px-6 text-slate-500">{item.fecha}</td>
                  <td className="py-4 px-6 text-slate-500">{item.tamano}</td>
                  <td className="py-4 px-6 text-right">
                    <button className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900">
                      <Download className="size-3.5 text-slate-400" /> Descargar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}