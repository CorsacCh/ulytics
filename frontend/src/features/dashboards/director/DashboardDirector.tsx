import { useState } from 'react'
import { TablaMatricula } from '../components/TablaMatricula'
import { DashboardLayout } from '../../../shared/layout/DashboardLayout'
import type { Section } from '../../../shared/components/Sidebar'
import { useAuth } from '../../auth/AuthContext'
import { KpiCard } from '../../../shared/components/dashboard/KpiCard'

function CourseCard({ course }: any) {
  const passingRate = ((course.passing / course.enrollment) * 100).toFixed(1)
  return (
    <div className="rounded-lg border border-[#E2E8F0] bg-[#ffffff] p-4 transition-colors hover:border-[#FFB800]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h4 className="font-semibold text-[#1E293B]">{course.name}</h4>
          <p className="mt-1 text-sm text-[#878787]">{course.enrollment} estudiantes inscritos</p>
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
          <p className="mt-1 text-xl font-bold text-[#1E293B]">{passingRate}%</p>
        </div>
        <div>
          <p className="text-xs text-[#878787]">Promedio</p>
          <p className="mt-1 text-xl font-bold text-[#1E293B]">{course.avgGrade.toFixed(1)}</p>
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
        <DashboardHeader title="Dashboard del Director" subtitle="Ingeniería Civil Informática" />

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
                <p className="text-xs font-semibold uppercase tracking-widest text-[#878787]">Análisis Histórico</p>
                <h3 className="mt-1 text-lg font-bold text-[#1E293B]">Tasa de Retención (5 años)</h3>
              </div>
              <TrendingUp className="size-5 text-[#22C55E]" />
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={retentionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                <YAxis domain={[80, 95]} tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #E2E8F0', borderRadius: '8px' }}
                  formatter={(value) => `${value}%`}
                />
                <Line 
                  type="monotone" 
                  dataKey="rate" 
                  stroke="#FFB800" 
                  strokeWidth={3}
                  dot={{ fill: '#FFB800', r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </article>

          <article className="rounded-lg border border-[#E2E8F0] bg-[#ffffff] p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[#878787]">Desempeño Académico</p>
                <h3 className="mt-1 text-lg font-bold text-[#1E293B]">Distribución por Año</h3>
              </div>
              <BarChart3 className="size-5 text-[#FFB800]" />
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceByYear}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #E2E8F0', borderRadius: '8px' }} />
                <Legend />
                <Bar dataKey="excellent" fill="#22C55E" name="Excelente (≥6.5)" />
                <Bar dataKey="good" fill="#FFB800" name="Bueno (5.5-6.4)" />
                <Bar dataKey="acceptable" fill="#94A3B8" name="Aceptable (4.5-5.4)" />
                <Bar dataKey="failing" fill="#EF4444" name="Insuficiente (<4.5)" />
              </BarChart>
            </ResponsiveContainer>
          </article>
        </section>

        <section>
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#878787]">Seguimiento Académico</p>
              <h3 className="mt-1 text-xl font-bold text-[#1E293B]">Estado de Asignaturas Críticas</h3>
            </div>
            <AlertCircle className="size-5 text-[#EF4444]" />
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
