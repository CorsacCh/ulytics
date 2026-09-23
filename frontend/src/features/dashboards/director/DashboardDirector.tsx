import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { DashboardLayout } from '../../../shared/layout/DashboardLayout';
import type { Section } from '../../../shared/components/Sidebar';
import DashboardHeader from '../../../shared/components/dashboard/DashboardHeader';
import { KpiCard } from '../../../shared/components/dashboard/KpiCard';
import { ChevronDown, FileText, Download, BarChart2, BookOpen } from 'lucide-react';

import { keyMetrics } from './data/metrics';
import { retentionData } from './data/retentionData';
import { efficiencyData } from './data/efficiencyData';
import { criticalCourses } from './data/criticalCourses';
import { courseProgress } from './data/courseProgress';

import { ProgresionAnalitica } from './components/ProgresionAnalitica';
import { ProgresionCurricular } from './components/ProgresionCurricular';
import { HistorialDescargas } from './components/HistorialDescargas';

export default function DashboardDirector() {
  const [section, setSection] = useState<Section>('Home');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const renderContent = () => {
    switch (section) {
      case 'Progresión analítica':
        return <ProgresionAnalitica />;
      case 'Progresión curricular':
        return <ProgresionCurricular />;
      case 'Historial de descargas':
        return <HistorialDescargas />;
      case 'Home':
default:
  return (
    <div className="mx-auto max-w-[1440px] space-y-10 p-5 sm:p-8 lg:p-10 bg-[#F8FAFC] min-h-screen">
      
      {/* 1. HEADER PERSONALIZADO (Mockup v0) */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-slate-500 uppercase mb-2">
            <span className="text-[#FFB800]">🎓</span> DIRECCIÓN DE CARRERA
          </div>
          <h1 className="text-3xl font-bold text-[#0A192F]">Ingeniería Civil Informática</h1>
          <p className="mt-1 text-sm text-slate-500">Lectura institucional de la progresión académica y curricular</p>
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

      {/* 2. TARJETAS KPI */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {keyMetrics.map((metric, index) => (
          <KpiCard key={index} {...(metric as any)} variant="spacious" />
        ))}
      </section>

      {/* 3. SECCIÓN 01: RENDIMIENTO */}
      <div className="border-l-4 border-[#FFB800] pl-4 mt-12 mb-6">
        <p className="text-xs font-bold tracking-widest text-slate-500 uppercase">Sección 01 · Rendimiento</p>
        <h2 className="text-2xl font-bold text-[#0A192F]">Progresión analítica</h2>
        <p className="text-slate-500 text-sm mt-1">Indicadores de avance, retención y eficiencia de la cohorte seleccionada.</p>
      </div>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          {/* Gráfico 1: Tasa de Eficiencia (Hecho con HTML/Tailwind para control total) */}
          <div className="flex flex-col rounded-xl border border-slate-200/80 bg-white p-8 shadow-sm">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Tasa de eficiencia curricular</h3>
                <p className="text-sm text-slate-500 mt-1">Distribución de estudiantes por avance curricular</p>
              </div>
              <div className="bg-amber-50 px-4 py-2 rounded-md text-right border border-amber-100/50">
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Cohorte 2026</p>
                <p className="text-lg font-bold text-amber-900">100 alumnos</p>
              </div>
            </div>

            {/* Barra apilada 100% nativa */}
            <div className="flex h-14 w-full rounded-lg overflow-hidden shadow-inner mb-8">
              <div className="bg-[#94A3B8] w-[12%] flex items-center justify-center text-white text-xs font-bold">12%</div>
              <div className="bg-[#64748B] w-[28%] flex items-center justify-center text-white text-xs font-bold">28%</div>
              <div className="bg-[#3B82F6] w-[42%] flex items-center justify-center text-white text-xs font-bold">42%</div>
              <div className="bg-[#22C55E] w-[18%] flex items-center justify-center text-white text-xs font-bold">18%</div>
            </div>

          {/* Leyenda descriptiva */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {efficiencyData.map((item, i) => (
              <div key={i} className={`p-3 rounded-lg ${item.name === 'Eficiente' ? 'bg-slate-50 border border-slate-100' : ''}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="size-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="font-bold text-slate-800 text-sm">{item.name}</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">{item.subtext}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-100 pt-4">
            <p className="text-sm text-slate-600"><span className="font-bold text-slate-800">Eficiente:</span> 18 alumnos de la cohorte seleccionada.</p>
          </div>
        </div>

        {/* Gráfico 2: Comparativa Institucional (Nativo con Tailwind) */}
        <div className="flex flex-col rounded-xl border border-slate-200/80 bg-white p-8 shadow-sm">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Comparativa institucional</p>
              <h3 className="text-xl font-bold text-slate-800 mt-1">Posicionamiento de tu carrera</h3>
              <p className="text-sm text-slate-500 mt-1">Ranking anónimo por retención</p>
            </div>
            <BarChart2 className="size-5 text-slate-400" />
          </div>
          
          <div className="flex-1 flex flex-col justify-around py-4 space-y-6">
            {retentionData.map((item, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className={`${item.isCurrent ? 'font-bold text-slate-900' : 'text-slate-600'}`}>
                    {item.name}
                  </span>
                  <span className="font-bold text-slate-800">{item.value}%</span>
                </div>
                {/* Barra de progreso personalizada */}
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      item.isCurrent ? 'bg-[#FFB800]' : 'bg-slate-300'
                    }`} 
                    style={{ width: `${item.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div> 
          <p className="text-xs text-slate-400 mt-6 border-t border-slate-100 pt-4">
            Las identidades de otras carreras se mantienen anónimas por política institucional.
          </p>
        </div>
      </section>
      {/* 4. SECCIÓN 02: TRAYECTORIA FORMATIVA */}
      <div className="border-l-4 border-[#FFB800] pl-4 mt-12 mb-6">
        <p className="text-xs font-bold tracking-widest text-slate-500 uppercase">Sección 02 · Trayectoria Formativa</p>
        <h2 className="text-2xl font-bold text-[#0A192F]">Progresión curricular</h2>
        <p className="text-slate-500 text-sm mt-1">Lectura de la malla, hitos de avance y asignaturas que requieren atención.</p>
      </div>

      <section className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
        
        {/* Avance por ciclo */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-8 shadow-sm">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Avance por ciclo formativo</h3>
              <p className="text-sm text-slate-500 mt-1">Cumplimiento esperado de la trayectoria</p>
            </div>
            <BookOpen className="size-5 text-slate-400" />
          </div>

          <div className="space-y-6">
            {courseProgress.map((cycle, i) => (
              <div key={i}>
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">{cycle.name}</h4>
                    <p className="text-xs text-slate-500">{cycle.subtitle}</p>
                  </div>
                  <span className="text-sm font-bold text-slate-800">{cycle.value}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5">
                  <div className="bg-[#3B82F6] h-2.5 rounded-full" style={{ width: `${cycle.value}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alertas y Asignaturas Críticas */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-8 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Alertas académicas</p>
          <h3 className="text-lg font-bold text-slate-800 mt-1 mb-6">Asignaturas críticas</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr>
                  <th className="border-b border-slate-200 py-3 font-semibold text-slate-500 uppercase tracking-wider text-xs">Código</th>
                  <th className="border-b border-slate-200 py-3 font-semibold text-slate-500 uppercase tracking-wider text-xs">Asignatura</th>
                  <th className="border-b border-slate-200 py-3 font-semibold text-slate-500 uppercase tracking-wider text-xs">Semestre</th>
                  <th className="border-b border-slate-200 py-3 font-semibold text-slate-500 uppercase tracking-wider text-xs text-right">Reprobación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {criticalCourses.map((course, idx) => {
                  const rate = parseFloat(course.failure);
                  const isCritical = rate > 30;
                  return (
                    <tr key={idx}>
                      <td className="py-4 text-slate-500">{course.code}</td>
                      <td className="py-4 font-bold text-slate-800">{course.name}</td>
                      <td className="py-4 text-slate-500">Semestre {idx + 1}</td>
                      <td className="py-4 text-right">
                        <div className="flex flex-col items-end">
                          <span className={`font-bold ${isCritical ? 'text-red-600' : 'text-amber-500'}`}>{course.failure}</span>
                          <span className="text-[10px] text-slate-400 uppercase">{isCritical ? 'Crítica' : 'Atención'}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

    </div>
  );
    }
  }
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-colors hover:border-slate-300">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h4 className="font-bold text-slate-800">{course.name}</h4>
          <p className="mt-1 text-sm text-slate-500">{course.code} - {course.semester} semestre</p>
        </div>
        {course.critical && (
          <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">Crítica</span>
        )}
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-xs text-slate-500">Aprobación</p>
          <p className="mt-1 text-xl font-bold text-slate-800">{course.passingRate}%</p>
        </div>
      </div>
    </div>
  )
    <DashboardLayout
      section={section}
      open={sidebarOpen}
      onToggle={() => setSidebarOpen((prev) => !prev)}
      onNavigate={(sec) => setSection(sec)}
      role="academic"
    >
      {renderContent()}
    </DashboardLayout>
  );
<<<<<<< HEAD
}
export default function DashboardDirector() {
  const { user } = useAuth()
  const [section, setSection] = useState<Section>('Dashboard')
  const [open, setOpen] = useState(true)
  const go = (label: Section) => { setSection(label) }

  // El usuario logueado con rol DIRECTOR tiene asociado un ámbito académico de tipo
  // PROGRAMA, y su código es el de la carrera (backend: user.ambito.codigo).
  const carCodigoActivo = user?.ambito?.codigo

  return (
    <DashboardLayout section={section} open={open} onToggle={() => setOpen(!open)} onNavigate={go}>
      <div className="mx-auto max-w-[1440px] space-y-8 p-5 sm:p-8 lg:p-10 grid grid-cols-12 gap-6">
        <div className="col-span-12">
          <DashboardHeader title="DIRECCIÓN DE CARRERA" subtitle="Ingeniería Civil Informática - Lectura institucional de la progresión académica y curricular" />
          <div className="flex items-center justify-between mb-4">
            <div />
            <div className="flex gap-3">
              <select className="rounded-lg border border-slate-200/80 bg-white p-2 text-sm text-slate-800">
                <option value="2026">2026</option>
              </select>
              <button className="rounded-lg bg-[#FFB800] py-2 px-4 text-sm text-white">Exportar a PDF</button>
              <button className="rounded-lg bg-[#FFB800] py-2 px-4 text-sm text-white">Descargar Excel</button>
            </div>
          </div>
        </div>

        {/* En lugar de "0001" estático, pasamos el código real del usuario logueado */}
        {carCodigoActivo ? (
          <TablaMatricula carCodigo={carCodigoActivo} />
        ) : (
          <div className="border-l-4 border-yellow-400 bg-yellow-50 p-4">
            <p className="text-yellow-700">Tu cuenta de Director no tiene un código de carrera asociado. Contacta al Administrador.</p>
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="col-span-12 grid grid-cols-4 gap-4">
          {keyMetrics.map((metric) => (
            <KpiCard key={metric.label} description={metric.trend} {...metric} />
          ))}
        </div>

        <div className="col-span-12 grid grid-cols-2 gap-6">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">SECCIÓN 01 · RENDIMIENTO</p>
                <h3 className="mt-1 text-lg font-bold text-slate-800">Indicadores de avance, retención y eficiencia de la cohorte seleccionada.</h3>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm relative">
                <span className="absolute top-2 right-2 rounded-full bg-[#FFB800]/10 px-2 py-1 text-xs font-bold text-[#FFB800]">COHORTE 2026 - 100 alumnos</span>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Tasa de eficiencia curricular</p>
                <div className="h-40 w-full rounded-full bg-slate-100">
                  <div className="h-40 rounded-full" style={{ width: '12%', backgroundColor: '#EF4444' }}></div>
                  <div className="h-40 rounded-full" style={{ width: '28%', backgroundColor: '#94A3B8', marginLeft: '12%' }}></div>
                  <div className="h-40 rounded-full" style={{ width: '42%', backgroundColor: '#22C55E', marginLeft: '40%' }}></div>
                  <div className="h-40 rounded-full" style={{ width: '18%', backgroundColor: '#003366', marginLeft: '82%' }}></div>
                </div>
                <ul className="space-y-3">
                  {efficiencyData.map((data) => (
                    <li key={data.name} className="flex items-start gap-3 text-sm">
                      <span className="mt-1 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-[#94A3B8]/10 text-[#94A3B8]">●</span>
                      <span className="text-slate-800">{data.name} - {data.value} alumnos ({(data.value / 100) * 100}%)</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Comparativa institucional / Posicionamiento de tu carrera</p>
                <ul className="space-y-3">
                  {retentionData.map((data) => (
                    <li key={data.name} className="flex items-start gap-3 text-sm">
                      <div className="h-2.5 rounded-full bg-slate-100 w-full">
                        <div className="h-2.5 rounded-full" style={{ width: `${data.value}%`, backgroundColor: data.name === 'Ing. Informática'? '#FFB800' : '#94A3B8' }}></div>
                      </div>
                      <span className="text-slate-800">{data.name} - {data.value}%</span>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-slate-500">Las identidades de otras carreras se mantienen anónimas por política institucional.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-12 grid grid-cols-2 gap-6">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">SECCIÓN 02 · TRAYECTORIA FORMATIVA</p>
                <h3 className="mt-1 text-lg font-bold text-slate-800">Lectura de la malla, hitos de avance y asignaturas que requieren atención.</h3>
              </div>
              <BookOpen className="size-5 text-[#22C55E]" />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Avance por ciclo formativo</p>
                <ul className="space-y-3">
                  {courseProgress.map((course) => (
                    <li key={course.name} className="flex items-start gap-3 text-sm">
                      <div className="h-2.5 rounded-full bg-slate-100 w-full">
                        <div className="h-2.5 rounded-full" style={{ width: `${course.value}%`, backgroundColor: '#22C55E' }}></div>
                      </div>
                      <span className="text-slate-800">{course.name} - {course.value}% - {course.value === 84? 12 : course.value === 68? 18 : course.value === 51? 16 : 4} {course.value === 37? 'hitos' : 'asignaturas'}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Alertas académicas / Asignaturas críticas</p>
                <table className="w-full text-left border-collapse divide-y divide-slate-100">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-xs font-semibold uppercase text-slate-500">CÓDIGO</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase text-slate-500">ASIGNATURA</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase text-slate-500">SEMESTRE</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase text-slate-500">REPROBACIÓN</th>
                    </tr>
                  </thead>
                  <tbody>
                    {criticalCourses.map((course) => (
                      <tr key={course.name}>
                        <td className="px-4 py-3">{course.code}</td>
                        <td className="px-4 py-3">{course.name}</td>
                        <td className="px-4 py-3">{course.semester}</td>
                        <td className="px-4 py-3">
                          {course.passingRate}% 
                          {course.critical? (
                            <span className="rounded-md bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">Crítica</span>
                          ) : (
                            <span className="rounded-md bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">Atención</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>


        <section>
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#878787]">Seguimiento Académico</p>
              <h3 className="mt-1 text-xl font-bold text-[#1E293B]">Estado de Asignaturas Críticas</h3>
            </div>
            <AlertCircle className="size-5 text-[#EF4444]" />
          </div>
        </section>
      </div>
    </div>
  </DashboardLayout>
  );
=======
>>>>>>> 42e5696 (feat(dashboards): finalización de vistas autoridad, decano y reestructuración de directorios)
}