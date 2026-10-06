import { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Building2, BarChart3, AlertCircle /* y los que ya tenías */ } from 'lucide-react';

import { DashboardLayout } from '../../../shared/layout/DashboardLayout';
import type { Section } from '../../../shared/components/Sidebar';
import DashboardHeader from '../../../shared/components/dashboard/DashboardHeader';

import { ProgresionAnaliticaAutoridad } from './components/ProgresionAnaliticaAutoridad';
import { ProgresionCurricularAutoridad } from './components/ProgresionCurricularAutoridad';
import { ReporteriaAutoridad } from './components/ReporteriaAutoridad';
import { obtenerResumenInstitucional } from './api';

import { autoridadHomeData as fallbackData } from './data/homeData';
import type { AutoridadHomeData } from './data/homeData';

const ALERTA_ESTILOS: Record<AutoridadHomeData['alertas'][number]['tipo'], { badge: string; icono: string }> = {
  critica: { badge: 'bg-amber-100 text-amber-600', icono: '!' },
  positiva: { badge: 'bg-emerald-100 text-emerald-600', icono: '✓' },
  informativa: { badge: 'bg-blue-100 text-blue-600', icono: 'i' },
};

// Paleta corporativa monocromática para el donut de distribución por facultad.
const COLORES_FACULTAD = ['#1e3a8a', '#1d4ed8', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];

export default function DashboardAutoridad() {
  const [section, setSection] = useState<Section>('Home');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [data, setData] = useState<AutoridadHomeData | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const fetchDatosInstitucionales = async () => {
      try {
        setCargando(true);
        // Llamada real al backend: GET /api/autoridad/resumen
        const dataReal = await obtenerResumenInstitucional();
        setData(dataReal);
      } catch (error) {
        console.error('Error al cargar los datos institucionales:', error);
        setData(fallbackData); // Mantenemos el fallback en caso de error de red
      } finally {
        setCargando(false);
      }
    };

    fetchDatosInstitucionales();
  }, []);

  // Renderizado del estado de carga
  if (cargando || !data) {
    return (
      <div className="flex h-full w-full items-center justify-center p-10">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
          <p className="text-sm font-medium text-slate-500">Cargando reporte institucional...</p>
        </div>
      </div>
    );
  }

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
        const { kpis, alertas, graficos } = data;
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
                <p className="text-sm mt-2 text-gray-500">Meta institucional · Cohorte {kpis.cohorte_titulacion || 'Histórica'}</p>
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
                    <YAxis domain={['dataMin - 500', 'dataMax + 500']} tickFormatter={(value) => value.toLocaleString('es-CL')} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
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
                    <Pie data={graficos.distribucionFacultad} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name} ${value}%`} innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value">
                      {graficos.distribucionFacultad.map((entry, index) => (
                        <Cell key={`cell-${entry.name}`} fill={COLORES_FACULTAD[index % COLORES_FACULTAD.length]} />
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
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50/50 text-xs font-bold uppercase tracking-wider text-gray-500">
                      <tr>
                        <th className="px-4 py-3 rounded-tl-lg">Carrera</th>
                        <th className="px-4 py-3 text-right rounded-tr-lg">Matrícula</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {graficos.topCarreras.map((entry, index) => (
                        <tr key={`top-${index}`} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 font-medium text-gray-900">{entry.name}</td>
                          <td className="px-4 py-3 text-right text-gray-600 font-semibold">{entry.enrollment}</td>
                        </tr>
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
                      <Bar dataKey="rate" radius={[0, 4, 4, 0]} barSize={20}>
                        {graficos.retencionPorFacultad.map((entry) => (
                          <Cell
                            key={`cell-${entry.faculty}`}
                            // Umbral 80 % (igual que el backend): rojo por debajo, azul en adelante.
                            fill={entry.rate < 80 ? '#ef4444' : '#3b82f6'}
                          />
                        ))}
                      </Bar>
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