
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

        <section className="grid gap-6 xl:grid-cols-2">
          <article className="rounded-lg border border-[#E2E8F0] bg-[#ffffff] p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[#878787]">Progresión analítica</p>
                <h3 className="mt-1 text-lg font-bold text-[#1E293B]">Indicadores de avance, retención y eficiencia de la cohorte seleccionada.</h3>
              </div>
            </div>
            <div className="grid gap-6 xl:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[#878787]">Tasa de eficiencia curricular</p>
                <p className="mt-1 text-sm text-[#1E293B]">COHORTE 2026 - 100 alumnos</p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={efficiencyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #E2E8F0', borderRadius: '8px' }} />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[#878787]">Comparativa institucional / Posicionamiento de tu carrera</p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={retentionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #E2E8F0', borderRadius: '8px' }} />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
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
            </div>
            <div className="grid gap-6 xl:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[#878787]">Avance por ciclo formativo</p>
                <ul className="space-y-3">
                  {courseProgress.map((course) => (
                    <li key={course.name} className="flex items-start gap-3 text-sm">
                      <span className="mt-1 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-[#22C55E]/10 text-[#22C55E]">✓</span>
                      <span className="text-[#1E293B]">{course.name} - {course.value}%</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[#878787]">Alertas académicas / Asignaturas críticas</p>
                <ul className="space-y-3">
                  {criticalCourses.map((course) => (
                    <li key={course.name} className="flex items-start gap-3 text-sm">
                      <span className="mt-1 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-[#EF4444]/10 text-[#EF4444]">!</span>
                      <span className="text-[#1E293B]">{course.name} ({course.code}) - {course.semester} semestre - {course.passingRate}%</span>
                    </li>
                  ))}
                </ul>
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
