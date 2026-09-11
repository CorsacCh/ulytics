import { useState } from 'react'
import { BarChart3, TrendingUp, AlertCircle, Users, BookOpen, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { DashboardLayout } from '../../../shared/layout/DashboardLayout'
import type { Section } from '../../../shared/components/Sidebar'

const retentionData = [
  { year: '2022', rate: 85 },
  { year: '2023', rate: 87 },
  { year: '2024', rate: 89 },
  { year: '2025', rate: 88 },
  { year: '2026', rate: 90 },
]

const performanceByYear = [
  { year: '1er año', excellent: 25, good: 40, acceptable: 28, failing: 7 },
  { year: '2do año', excellent: 28, good: 38, acceptable: 26, failing: 8 },
  { year: '3er año', excellent: 32, good: 42, acceptable: 20, failing: 6 },
]

const courseMetrics = [
  { name: 'Matemáticas I', enrollment: 85, passing: 78, avgGrade: 5.8, critical: true },
  { name: 'Programación I', enrollment: 82, passing: 75, avgGrade: 5.6, critical: true },
  { name: 'Física I', enrollment: 88, passing: 84, avgGrade: 6.1, critical: false },
  { name: 'Termodinámica', enrollment: 81, passing: 72, avgGrade: 5.4, critical: true },
]

const keyMetrics = [
  { label: 'Estudiantes Activos', value: '342', trend: '+5%', positive: true, icon: Users },
  { label: 'Tasa de Retención', value: '90%', trend: '+2% vs 2025', positive: true, icon: TrendingUp },
  { label: 'Promedio Carrera', value: '6.2', trend: '+0.3 pts', positive: true, icon: BarChart3 },
  { label: 'Materias Críticas', value: '4', trend: '-1 vs 2025', positive: true, icon: AlertCircle },
]

function MetricBox({ label, value, trend, positive, icon: Icon }: any) {
  return (
    <article className="rounded-lg border border-[#E2E8F0] bg-[#ffffff] p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#878787]">{label}</p>
        <Icon className="size-5 text-[#FFB800]" />
      </div>
      <p className="mt-3 text-2xl font-bold text-[#1E293B]">{value}</p>
      <p className={`mt-1 text-xs font-medium ${positive ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>{trend}</p>
    </article>
  )
}

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
  const [section, setSection] = useState<Section>('Dashboard')
  const [open, setOpen] = useState(true)
  const go = (label: Section) => { setSection(label) }

  return (
    <DashboardLayout section={section} open={open} onToggle={() => setOpen(!open)} onNavigate={go}>
      <div className="mx-auto max-w-[1440px] space-y-8 p-5 sm:p-8 lg:p-10">
        <header className="border-b border-[#D9E5F0] pb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#556B7B]">Ingeniería Civil Informática</p>
          <h1 className="mt-1 text-3xl font-bold text-[#003366]">Dashboard del Director</h1>
          <p className="mt-2 text-sm text-[#556B7B]">Período 2026 - Semestre 1</p>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {keyMetrics.map((metric) => (
            <MetricBox key={metric.label} {...metric} />
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
          <div className="grid gap-4 md:grid-cols-2">
            {courseMetrics.map((course) => (
              <CourseCard key={course.name} course={course} />
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-[#E2E8F0] bg-[#ffffff] p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#878787]">Información General</p>
              <h3 className="mt-1 text-lg font-bold text-[#1E293B]">Acciones Recomendadas</h3>
            </div>
          </div>
          <ul className="space-y-3">
            <li className="flex items-start gap-3 text-sm">
              <span className="mt-1 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-[#EF4444]/10 text-[#EF4444]">!</span>
              <span className="text-[#1E293B]">Fortalecer apoyo en <strong>Cálculo en una Variable</strong> (42% de reprobación)</span>
            </li>
            <li className="flex items-start gap-3 text-sm">
              <span className="mt-1 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-[#FFB800]/10 text-[#FFB800]">!</span>
              <span className="text-[#1E293B]">Programar tutoría preventiva para <strong>Programación I</strong> antes del período de exámenes</span>
            </li>
            <li className="flex items-start gap-3 text-sm">
              <span className="mt-1 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-[#22C55E]/10 text-[#22C55E]">✓</span>
              <span className="text-[#1E293B]">Tasa de retención en aumento: mantener estrategias actuales</span>
            </li>
          </ul>
        </section>
      </div>
    </DashboardLayout>
  )
}
