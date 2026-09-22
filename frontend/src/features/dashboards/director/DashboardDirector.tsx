import { useState } from 'react'
import { TablaMatricula } from '../components/TablaMatricula'
import { BarChart3, TrendingUp, AlertCircle, Users, BookOpen, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { DashboardLayout } from '../../../shared/layout/DashboardLayout'
import type { Section } from '../../../shared/components/Sidebar'
import { useAuth } from '../../auth/AuthContext'
import { KpiCard } from '../../../shared/components/dashboard/KpiCard'
import DashboardHeader from '../../../shared/components/dashboard/DashboardHeader'

function CourseCard({ course }: any) {
  return (
    <div className="rounded-lg border border-[#E2E8F0] bg-[#ffffff] p-4 transition-colors hover:border-[#FFB800]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h4 className="font-semibold text-[#1E293B]">{course.name}</h4>
          <p className="mt-1 text-sm text-[#878787]">{course.code} - {course.semester} semestre</p>
        </div>
        {course.critical && (
          <span className="rounded-full bg-[#EF4444]/10 px-2 py-1 text-xs font-bold text-[#EF4444]">
            Crítica
          </span>
        )}
        
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-xs text-[#878787]">Aprobación</p>
          <p className="mt-1 text-xl font-bold text-[#1E293B]">{course.passingRate}%</p>
        </div>
      </div>
    </div>
  )
}

const renderContent = () => {
  switch ('Home') {
    case 'Progresión analítica':
      return <div>Progresión analítica</div>;
    case 'Progresión curricular':
      return <div>Progresión curricular</div>;
    case 'Historial de descargas':
      return <div>Historial de descargas</div>;
    case 'Home':
    default:
      return (
        <div className="mx-auto max-w-[1440px] space-y-8 p-5 sm:p-8 lg:p-10">
          <DashboardHeader title="Dashboard del Director" subtitle="FACULTAD DE INGENIERÍA" />

          {/* Tarjetas KPI */}
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {keyMetrics.map((metric, index) => (
              <KpiCard key={index} {...metric} variant="spacious" />
            ))}
          </section>

          {/* Gráficos Centrales */}
          <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                    Ranking y comparativa de carreras
                  </p>
                  <h2 className="mt-1 text-lg font-bold text-slate-800">
                    Desempeño por Escuelas (Tasa de Retención)
                  </h2>
                </div>
              </div>
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={keyMetrics} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                    <XAxis type="number" domain={[0, 100]} hide />
                    <YAxis dataKey="label" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                    <Tooltip 
                      cursor={{ fill: '#F8FAFC' }}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={40}>
                      {keyMetrics.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.value < 85 ? '#c20430' : '#00693e'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="flex flex-col rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Distribución de trayectoria
                </p>
                <h2 className="mt-1 text-lg font-bold text-slate-800">
                  Estado de estudiantes
                </h2>
              </div>
              <div className="relative flex h-[200px] items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={keyMetrics}
                      innerRadius={65}
                      outerRadius={85}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {keyMetrics.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.value < 85 ? '#c20430' : '#00693e'} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-bold text-slate-800">85%</span>
                  <span className="text-xs text-slate-500">sin alerta</span>
                </div>
              </div>
              
              <div className="mt-auto space-y-3 pt-4">
                {keyMetrics.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="size-3 rounded-full" style={{ backgroundColor: item.value < 85 ? '#c20430' : '#00693e' }} />
                      <span className="text-slate-600">{item.label}</span>
                    </div>
                    <span className="font-bold text-slate-800">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Tabla de Seguimiento Prioritario */}
          <section className="rounded-xl border border-slate-200/80 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-red-500">
                    Seguimiento prioritario
                  </p>
                  <h2 className="mt-1 text-lg font-bold text-slate-800">
                    Ramos críticos trans-carrera
                  </h2>
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto p-6 pt-0">
              <table className="w-full min-w-[600px] border-collapse text-left text-sm">
                <thead>
                  <tr>
                    <th className="border-b border-slate-200 py-4 pr-4 font-semibold text-slate-500">CÓDIGO</th>
                    <th className="border-b border-slate-200 py-4 pr-4 font-semibold text-slate-500">ASIGNATURA</th>
                    <th className="border-b border-slate-200 py-4 pr-4 font-semibold text-slate-500">CARRERAS AFECTADAS</th>
                    <th className="border-b border-slate-200 py-4 text-right font-semibold text-slate-500">TASA REPROBACIÓN PROMEDIO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {keyMetrics.map((metric, idx) => (
                    <tr key={idx} className="transition-colors hover:bg-slate-50/50">
                      <td className="py-4 pr-4 font-medium text-emerald-600">{metric.label}</td>
                      <td className="py-4 pr-4 font-bold text-slate-800">{metric.value}</td>
                      <td className="py-4 pr-4 text-slate-600">Carreras</td>
                      <td className="py-4 text-right">
                        <span className="inline-flex rounded-md bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700">
                          20%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      );
    }
  };

  const [section, setSection] = useState<Section>('Home');
  const [sidebarOpen, setSidebarOpen] = useState(true);

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
}