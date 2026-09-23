import { FileText, Download, ChevronDown } from 'lucide-react';

export function ProgresionAnalitica() {
  return (
    <div className="mx-auto max-w-[1440px] space-y-10 p-5 sm:p-8 lg:p-10 bg-[#F8FAFC] min-h-screen">
      
      {/* HEADER INSTITUCIONAL */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold tracking-widest text-slate-500 uppercase mb-2">
            INGENIERÍA CIVIL INFORMÁTICA
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
            <FileText className="size-4" /> Exportar a PDF
          </button>
          <button className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
            <Download className="size-4" /> Descargar Excel
          </button>
        </div>
      </div>

      {/* TABLA 1: Matrícula y admisión por cohorte */}
      <div className="rounded-xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
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
              <tr>
                <td className="py-3.5 px-6 font-medium text-slate-800">Matrícula admisión especial PACE</td>
                <td className="py-3.5 px-6">1</td>
                <td className="py-3.5 px-6">1</td>
                <td className="py-3.5 px-6">4</td>
                <td className="py-3.5 px-6">4</td>
                <td className="py-3.5 px-6">4</td>
              </tr>
              <tr>
                <td className="py-3.5 px-6 font-medium text-slate-800">Matrícula ingreso Especial RAE</td>
                <td className="py-3.5 px-6">6</td>
                <td className="py-3.5 px-6">4</td>
                <td className="py-3.5 px-6">10</td>
                <td className="py-3.5 px-6">8</td>
                <td className="py-3.5 px-6">9</td>
              </tr>
              <tr className="bg-slate-50/50">
                <td className="py-3.5 px-6 font-bold text-slate-900">Matrícula Total</td>
                <td className="py-3.5 px-6 font-bold text-slate-900">345</td>
                <td className="py-3.5 px-6 font-bold text-slate-900">348</td>
                <td className="py-3.5 px-6 font-bold text-slate-900">346</td>
                <td className="py-3.5 px-6 font-bold text-slate-900">326</td>
                <td className="py-3.5 px-6 font-bold text-slate-900">312</td>
              </tr>
              <tr>
                <td className="py-3.5 px-6 font-medium text-slate-800">% Mujeres</td>
                <td className="py-3.5 px-6">93%</td>
                <td className="py-3.5 px-6">94%</td>
                <td className="py-3.5 px-6">95%</td>
                <td className="py-3.5 px-6">94%</td>
                <td className="py-3.5 px-6">95%</td>
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
              <tr>
                <td className="py-3.5 px-6 font-medium text-slate-800">Ingreso RAE</td>
                <td className="py-3.5 px-6">100%</td>
                <td className="py-3.5 px-6">100%</td>
                <td className="py-3.5 px-6">100%</td>
                <td className="py-3.5 px-6">80%</td>
                <td className="py-3.5 px-6">90%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* TABLA 3: Cohortes / Tasas de retención */}
      <div className="rounded-xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-4">
          <h3 className="font-bold text-slate-800 text-lg">Cohortes / Tasas de retención</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-[#FFF9E6]">
                <th className="py-3 px-6 font-semibold text-slate-700 border-b border-slate-200">Indicador</th>
                <th className="py-3 px-6 font-semibold text-slate-700 border-b border-slate-200">2021</th>
                <th className="py-3 px-6 font-semibold text-slate-700 border-b border-slate-200">2022</th>
                <th className="py-3 px-6 font-semibold text-slate-700 border-b border-slate-200">2023</th>
                <th className="py-3 px-6 font-semibold text-slate-700 border-b border-slate-200">2024</th>
                <th className="py-3 px-6 font-semibold text-slate-700 border-b border-slate-200">2025</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              <tr>
                <td className="py-3.5 px-6 font-medium text-slate-800">1er año por cohorte</td>
                <td className="py-3.5 px-6">98%</td>
                <td className="py-3.5 px-6">91%</td>
                <td className="py-3.5 px-6">90%</td>
                <td className="py-3.5 px-6">93%</td>
                <td className="py-3.5 px-6">95%</td>
              </tr>
              <tr>
                <td className="py-3.5 px-6 font-medium text-slate-800">3er año por cohorte</td>
                <td className="py-3.5 px-6">91%</td>
                <td className="py-3.5 px-6">88%</td>
                <td className="py-3.5 px-6">82%</td>
                <td className="py-3.5 px-6">-</td>
                <td className="py-3.5 px-6">-</td>
              </tr>
              <tr>
                <td className="py-3.5 px-6 font-medium text-slate-800">Retención total</td>
                <td className="py-3.5 px-6">91%</td>
                <td className="py-3.5 px-6">83%</td>
                <td className="py-3.5 px-6">82%</td>
                <td className="py-3.5 px-6">90%</td>
                <td className="py-3.5 px-6">95%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* TABLA 4: Titulación y tiempo de egreso */}
      <div className="rounded-xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-4">
          <h3 className="font-bold text-slate-800 text-lg">Titulación y tiempo de egreso</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-[#FFF9E6]">
                <th className="py-3 px-6 font-semibold text-slate-700 border-b border-slate-200">Indicador</th>
                <th className="py-3 px-6 font-semibold text-slate-700 border-b border-slate-200">2017</th>
                <th className="py-3 px-6 font-semibold text-slate-700 border-b border-slate-200">2018</th>
                <th className="py-3 px-6 font-semibold text-slate-700 border-b border-slate-200">2019</th>
                <th className="py-3 px-6 font-semibold text-slate-700 border-b border-slate-200">2020</th>
                <th className="py-3 px-6 font-semibold text-slate-700 border-b border-slate-200">2021</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              <tr>
                <td className="py-3.5 px-6 font-medium text-slate-800">Tasa Titulación Total</td>
                <td className="py-3.5 px-6">83%</td>
                <td className="py-3.5 px-6">80%</td>
                <td className="py-3.5 px-6">82%</td>
                <td className="py-3.5 px-6">75%</td>
                <td className="py-3.5 px-6">39%</td>
              </tr>
              <tr>
                <td className="py-3.5 px-6 font-medium text-slate-800">Tasa de titulación en tiempo efectivo</td>
                <td className="py-3.5 px-6">25%</td>
                <td className="py-3.5 px-6">30%</td>
                <td className="py-3.5 px-6">50%</td>
                <td className="py-3.5 px-6">22%</td>
                <td className="py-3.5 px-6">37%</td>
              </tr>
              <tr>
                <td className="py-3.5 px-6 font-medium text-slate-800">Tasas de titulación en tiempo oportuno</td>
                <td className="py-3.5 px-6">30%</td>
                <td className="py-3.5 px-6">42%</td>
                <td className="py-3.5 px-6">62%</td>
                <td className="py-3.5 px-6">75%</td>
                <td className="py-3.5 px-6">-</td>
              </tr>
              <tr>
                <td className="py-3.5 px-6 font-medium text-slate-800">Tiempo en obtener titulación (semestres)</td>
                <td className="py-3.5 px-6">13,4</td>
                <td className="py-3.5 px-6">12,8</td>
                <td className="py-3.5 px-6">12,2</td>
                <td className="py-3.5 px-6">11,1</td>
                <td className="py-3.5 px-6">10,0</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}