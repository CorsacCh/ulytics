
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
      <div className="mx-auto max-w-[1440px] space-y-8 p-5 sm:p-8 lg:p-10">
        <DashboardHeader title="DIRECCIÓN DE CARRERA" subtitle="Ingeniería Civil Informática - Lectura institucional de la progresión académica y curricular" />
        <div className="flex items-center justify-between mb-4">
          <div />
          <div className="flex gap-3">
            <select className="rounded-lg border border-[#E2E8F0] bg-[#ffffff] p-2 text-sm text-[#1E293B]">
              <option value="2026">2026</option>
            </select>
            <button className="rounded-lg bg-[#FFB800] py-2 px-4 text-sm text-[#ffffff]">Exportar a PDF</button>
            <button className="rounded-lg bg-[#FFB800] py-2 px-4 text-sm text-[#ffffff]">Descargar Excel</button>
          </div>
        </div>

        {/* En lugar de "0001" estático, pasamos el código real del usuario logueado */}
        {carCodigoActivo ? (
          <TablaMatricula carCodigo={carCodigoActivo} />
        ) : (
          <div className="border-l-4 border-yellow-400 bg-yellow-50 p-4">
            <p className="text-yellow-700">Tu cuenta de Director no tiene un código de carrera asociado. Contacta al Administrador.</p>
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {keyMetrics.map((metric) => (
            <KpiCard key={metric.label} description={metric.trend} {...metric} />
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-2 relative">
          <article className="rounded-lg border border-[#E2E8F0] bg-[#ffffff] p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[#878787]">Progresión analítica</p>
                <h3 className="mt-1 text-lg font-bold text-[#1E293B]">Indicadores de avance, retención y eficiencia de la cohorte seleccionada.</h3>
              </div>
            </div>
            <div className="grid gap-6 xl:grid-cols-2">
              <div className="rounded-lg border border-[#E2E8F0] bg-[#ffffff] p-5 shadow-sm sm:p-6 relative">
                <span className="absolute top-2 right-2 rounded-full bg-[#FFB800]/10 px-2 py-1 text-xs font-bold text-[#FFB800]">COHORTE 2026 - 100 alumnos</span>
                <p className="text-xs font-semibold uppercase tracking-widest text-[#878787]">Tasa de eficiencia curricular</p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={efficiencyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #E2E8F0', borderRadius: '8px' }} />
                    <Bar dataKey="value" fill="#94A3B8" />
                    <Bar dataKey="value" fill="#22C55E" />
                    <Bar dataKey="value" fill="#EF4444" />
                    <Bar dataKey="value" fill="#003366" />
                  </BarChart>
                </ResponsiveContainer>
                <ul className="space-y-3">
                  {efficiencyData.map((data) => (
                    <li key={data.name} className="flex items-start gap-3 text-sm">
                      <span className="mt-1 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-[#94A3B8]/10 text-[#94A3B8]">●</span>
                      <span className="text-[#1E293B]">{data.name} - {data.value} alumnos ({(data.value / 100) * 100}%)</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg border border-[#E2E8F0] bg-[#ffffff] p-5 shadow-sm sm:p-6">
                <p className="text-xs font-semibold uppercase tracking-widest text-[#878787]">Comparativa institucional / Posicionamiento de tu carrera</p>
                <ul className="space-y-3">
                  {retentionData.map((data) => (
                    <li key={data.name} className="flex items-start gap-3 text-sm">
                      <span className="mt-1 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-[#FFB800]/10 text-[#FFB800]">●</span>
                      <span className="text-[#1E293B]">{data.name} - {data.value}%</span>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-[#878787]">Las identidades de otras carreras se mantienen anónimas por política institucional.</p>
              </div>
            </div>
          </article>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <article className="rounded-lg border border-[#E2E8F0] bg-[#ffffff] p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[#878787]">Progresión curricular</p>
                <h3 className="mt-1 text-lg font-bold text-[#1E293B]">Lectura de la malla, hitos de avance y asignaturas que requieren atención.</h3>
              </div>
              <BookOpen className="size-5 text-[#22C55E]" />
            </div>
            <div className="grid gap-6 xl:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[#878787]">Avance por ciclo formativo</p>
                <ul className="space-y-3">
                  {courseProgress.map((course) => (
                    <li key={course.name} className="flex items-start gap-3 text-sm">
                      <progress className="progress progress-primary w-full" value={course.value} max="100" />
                      <span className="text-[#1E293B]">{course.name} - {course.value}% - {course.value === 84? 12 : course.value === 68? 18 : course.value === 51? 16 : 4} {course.value === 37? 'hitos' : 'asignaturas'}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[#878787]">Alertas académicas / Asignaturas críticas</p>
                <table className="table table-compact w-full">
                  <thead>
                    <tr>
                      <th>CÓDIGO</th>
                      <th>ASIGNATURA</th>
                      <th>SEMESTRE</th>
                      <th>REPROBACIÓN</th>
                    </tr>
                  </thead>
                  <tbody>
                    {criticalCourses.map((course) => (
                      <tr key={course.name}>
                        <td>{course.code}</td>
                        <td>{course.name}</td>
                        <td>{course.semester}</td>
                        <td>
                          {course.passingRate}% 
                          {course.critical? <span className="badge badge-error gap-2">Crítica</span> : <span className="badge badge-warning gap-2">Atención</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </article>
        </section>
<<<<<<< HEAD

        <section>
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#878787]">Seguimiento Académico</p>
              <h3 className="mt-1 text-xl font-bold text-[#1E293B]">Estado de Asignaturas Críticas</h3>
            </div>
            <AlertCircle className="size-5 text-[#EF4444]" />
          </div>
        )}
=======
>>>>>>> 9796ae6 (refactor: update DashboardDirector component to match new design requirements)
      </div>
    </DashboardLayout>
  )
}
