import { useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Building2, BarChart3, AlertCircle /* y los que ya tenías */ } from 'lucide-react';

import { DashboardLayout } from '../../../shared/layout/DashboardLayout';
import type { Section } from '../../../shared/components/Sidebar';
import DashboardHeader from '../../../shared/components/dashboard/DashboardHeader';

import { ProgresionAnaliticaAutoridad } from './components/ProgresionAnaliticaAutoridad';
import { ProgresionCurricularAutoridad } from './components/ProgresionCurricularAutoridad';
import { ReporteriaAutoridad } from './components/ReporteriaAutoridad';

import { autoridadHomeData } from './data/homeData';
import type { AutoridadHomeData } from './data/homeData';

const ALERTA_ESTILOS: Record<AutoridadHomeData['alertas'][number]['tipo'], { badge: string; icono: string }> = {
  critica: { badge: 'bg-amber-100 text-amber-600', icono: '!' },
  positiva: { badge: 'bg-emerald-100 text-emerald-600', icono: '✓' },
  informativa: { badge: 'bg-blue-100 text-blue-600', icono: 'i' },
};

function CareerRow({ career }: { career: any }) {
  return (
    <tr className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors">
      <td className="py-3 px-4 font-semibold text-[#1E293B]">{career.name}</td>
      <td className="py-3 px-4 text-[#878787]">{career.enrollment}</td>
      <td className="py-3 px-4">
        <span className="inline-flex items-center gap-1 font-semibold text-[#22C55E]">
          {career.retention}%
        </span>
      </td>
      <td className="py-3 px-4">
        <span className={`inline-flex items-center gap-1 font-semibold ${career.graduation >= 80 ? 'text-[#22C55E]' : 'text-[#FFB800]'}`}>
          {career.graduation}%
        </span>
      </td>
    </tr>
  );
}

export default function DashboardAutoridad() {
  const [section, setSection] = useState<Section>('Home');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const renderContent = () => {
    switch (section) {
      case 'Progresión analítica':
        return <ProgresionAnaliticaAutoridad />;
      case 'Progresión curricular':
        return <ProgresionCurricularAutoridad />;
      case 'Reportería':
        return <ReporteriaAutoridad />;
      case 'Home':
      default: {
        const { kpis, alertas, graficos } = autoridadHomeData;
        return (
          <div className="mx-auto max-w-[1440px] space-y-8 p-5 sm:p-8 lg:p-10 bg-[#F8FAFC] min-h-screen">
            <DashboardHeader title="Reporte Institucional" subtitle="NIVEL CENTRAL · AUTORIDAD" />

            {/* KPIs institucionales con fallbacks para valores nulos */}
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="bg-white border rounded-lg shadow-sm p-6">
                <h3 className="text-gray-500 text-sm font-medium mb-1">Matrícula Total</h3>
                <p className="text-3xl font-bold text-gray-800">
                  {typeof kpis.matricula_total === 'number' ? kpis.matricula_total.toLocaleString() : 'N/A'}
                </p>
                <p
                  className={`text-sm mt-2 ${
                    kpis.crecimiento_matricula === null
                      ? 'text-gray-400'
                      : kpis.crecimiento_matricula > 0
                        ? 'text-green-600'
                        : 'text-red-600'
                  }`}
                >
                  {kpis.crecimiento_matricula !== null
                    ? `${kpis.crecimiento_matricula > 0 ? '+' : ''}${kpis.crecimiento_matricula}% vs anterior`
                    : 'S/I'}
                </p>
              </div>

              <div className="bg-white border rounded-lg shadow-sm p-6">
                <h3 className="text-gray-500 text-sm font-medium mb-1">Retención Institucional</h3>
                <p className="text-3xl font-bold text-gray-800">
                  {kpis.retencion_institucional !== null ? `${kpis.retencion_institucional}%` : 'N/A'}
                </p>
                <p
                  className={`text-sm mt-2 ${
                    kpis.crecimiento_retencion === null
                      ? 'text-gray-400'
                      : kpis.crecimiento_retencion > 0
                        ? 'text-green-600'
                        : 'text-red-600'
                  }`}
                >
                  {kpis.crecimiento_retencion !== null
                    ? `${kpis.crecimiento_retencion > 0 ? '+' : ''}${kpis.crecimiento_retencion}% vs anterior`
                    : 'S/I'}
                </p>
              </div>

              <div className="bg-white border rounded-lg shadow-sm p-6">
                <h3 className="text-gray-500 text-sm font-medium mb-1">Titulación Total</h3>
                <p className="text-3xl font-bold text-gray-800">
                  {kpis.tasa_titulacion_total !== null ? `${kpis.tasa_titulacion_total}%` : 'N/A'}
                </p>
                <p className="text-sm mt-2 text-gray-400">Meta institucional</p>
              </div>

              <div className="bg-white border rounded-lg shadow-sm p-6">
                <h3 className="text-gray-500 text-sm font-medium mb-1">Carreras Monitoreadas</h3>
                <p className="text-3xl font-bold text-gray-800">
                  {typeof kpis.carreras_monitoreadas === 'number'
                    ? kpis.carreras_monitoreadas.toLocaleString()
                    : 'N/A'}
                </p>
                <p className="text-sm mt-2 text-green-600">En seguimiento</p>
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
              {/* Gráfico Líneas */}
              <article className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Evolución Institucional</p>
                    <h3 className="mt-1 text-lg font-bold text-slate-800">Matrícula Total (5 años)</h3>
                  </div>
                  <TrendingUp className="size-5 text-emerald-500" />
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={graficos.evolucionMatricula}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="year" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Line type="monotone" dataKey="total" stroke="#FFB800" strokeWidth={3} dot={{ fill: '#FFB800', r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </article>

              {/* Gráfico Torta */}
              <article className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Distribución de Matrícula</p>
                    <h3 className="mt-1 text-lg font-bold text-slate-800">Por Facultad</h3>
                  </div>
                  <Building2 className="size-5 text-[#FFB800]" />
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={graficos.distribucionFacultad} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name} ${value}%`} outerRadius={100} dataKey="value">
                      {graficos.distribucionFacultad.map((entry) => (
                        <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </article>
            </section>

            {/* Resto de Secciones */}
            <section className="grid gap-6 xl:grid-cols-2">
              {/* Tabla de Carreras */}
              <article className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-3 mb-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Desempeño de Carreras</p>
                    <h3 className="mt-1 text-lg font-bold text-slate-800">Top 4 en Matrícula</h3>
                  </div>
                  <BarChart3 className="size-5 text-[#FFB800]" />
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="py-3 px-4 font-semibold uppercase text-xs tracking-widest text-slate-500 rounded-tl-lg">Carrera</th>
                        <th className="py-3 px-4 font-semibold uppercase text-xs tracking-widest text-slate-500">Matrícula</th>
                        <th className="py-3 px-4 font-semibold uppercase text-xs tracking-widest text-slate-500">Retención</th>
                        <th className="py-3 px-4 font-semibold uppercase text-xs tracking-widest text-slate-500 rounded-tr-lg">Titulación</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {graficos.topCarreras.map((career) => (
                        <CareerRow key={career.name} career={career} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>

              <div className="space-y-6">
                {/* Gráfico Barras */}
                <article className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between gap-3 mb-6">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Análisis Comparativo</p>
                      <h3 className="mt-1 text-lg font-bold text-slate-800">Tasa de Retención por Facultad</h3>
                    </div>
                    <AlertCircle className="size-5 text-[#FFB800]" />
                  </div>
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={graficos.retencionPorFacultad} layout="vertical" margin={{ left: 100, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                      <XAxis type="number" domain={[0, 100]} unit="%" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <YAxis dataKey="faculty" type="category" width={100} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(value) => `${value}%`} />
                      <Bar dataKey="rate" fill="#FFB800" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </article>

                {/* Resumen Ejecutivo */}
                <article className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-800 mb-4">Puntos de Atención Institucional</h3>
                  {alertas.length > 0 ? (
                    <ul className="space-y-4">
                      {alertas.map((alerta) => (
                        <li key={alerta.mensaje} className="flex items-start gap-3 text-sm">
                          <span
                            className={`flex-shrink-0 mt-0.5 flex size-5 items-center justify-center rounded-full font-bold ${ALERTA_ESTILOS[alerta.tipo].badge}`}
                          >
                            {ALERTA_ESTILOS[alerta.tipo].icono}
                          </span>
                          <span className="text-slate-700">{alerta.mensaje}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-500">Sin alertas institucionales activas.</p>
                  )}
                </article>
              </div>
            </section>
          </div>
        );
      }
    }
  };

  return (
    <DashboardLayout 
      section={section} 
      open={sidebarOpen} 
      onToggle={() => setSidebarOpen((prev) => !prev)}
      onNavigate={(sec) => setSection(sec)}
    >
      {renderContent()}
    </DashboardLayout>
  );
}