import { useState } from 'react'
import { BarChart3, TrendingUp, Building2, Users, AlertCircle, GraduationCap } from 'lucide-react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { DashboardLayout } from '../../../shared/layout/DashboardLayout'
import type { Section } from '../../../shared/components/Sidebar'

const facultyRetention = [
  { faculty: 'Ingeniería', rate: 88 },
  { faculty: 'Ciencias', rate: 85 },
  { faculty: 'Humanidades', rate: 79 },
  { faculty: 'Administración', rate: 91 },
]

const enrollmentTrend = [
  { year: '2022', total: 4200 },
  { year: '2023', total: 4350 },
  { year: '2024', total: 4500 },
  { year: '2025', total: 4680 },
  { year: '2026', total: 4820 },
]

const careerPerformance = [
  { name: 'Ing. Civil Informática', enrollment: 342, retention: 90, graduation: 82 },
  { name: 'Ing. Comercial', enrollment: 298, retention: 88, graduation: 85 },
  { name: 'Pedagogía en Educación', enrollment: 215, retention: 82, graduation: 78 },
  { name: 'Psicología', enrollment: 186, retention: 85, graduation: 81 },
]

const institutionalMetrics = [
  { label: 'Matrícula Total', value: '4,820', trend: '+2.9% vs 2025', positive: true, icon: Users },
  { label: 'Retención Institucional', value: '86%', trend: '+1.2% vs 2025', positive: true, icon: TrendingUp },
  { label: 'Titulación Oportuna', value: '78%', trend: '-2.1% vs 2025', positive: false, icon: GraduationCap },
  { label: 'Carreras Monitoreadas', value: '24', trend: 'Sistema activo', positive: true, icon: BarChart3 },
]

const facultyDistribution = [
  { name: 'Ingeniería', value: 35, fill: '#FFB800' },
  { name: 'Ciencias', value: 28, fill: '#22C55E' },
  { name: 'Humanidades', value: 22, fill: '#3B82F6' },
  { name: 'Administración', value: 15, fill: '#8B5CF6' },
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

function CareerRow({ career }: any) {
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
  )
}

export default function DashboardAutoridad() {
  const [section, setSection] = useState<Section>('Dashboard')
  const [open, setOpen] = useState(true)
  const go = (label: Section) => { setSection(label) }

  return (
    <DashboardLayout section={section} open={open} onToggle={() => setOpen(!open)} onNavigate={go}>
      <div className="mx-auto max-w-[1440px] space-y-8 p-5 sm:p-8 lg:p-10">
        <header className="border-b border-[#D9E5F0] pb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#556B7B]">Autoridad Central</p>
          <h1 className="mt-1 text-3xl font-bold text-[#003366]">Reporte Institucional</h1>
          <p className="mt-2 text-sm text-[#556B7B]">Indicadores de gestión académica UACh - Período 2026 - Semestre 1</p>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {institutionalMetrics.map((metric) => (
            <MetricBox key={metric.label} {...metric} />
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <article className="rounded-lg border border-[#E2E8F0] bg-[#ffffff] p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[#878787]">Evolución Institucional</p>
                <h3 className="mt-1 text-lg font-bold text-[#1E293B]">Matrícula Total (5 años)</h3>
              </div>
              <TrendingUp className="size-5 text-[#22C55E]" />
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={enrollmentTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #E2E8F0', borderRadius: '8px' }}
                  formatter={(value) => value}
                />
                <Line 
                  type="monotone" 
                  dataKey="total" 
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
                <p className="text-xs font-semibold uppercase tracking-widest text-[#878787]">Distribución de Matrícula</p>
                <h3 className="mt-1 text-lg font-bold text-[#1E293B]">Por Facultad</h3>
              </div>
              <Building2 className="size-5 text-[#FFB800]" />
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={facultyDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name} ${value}%`}
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {facultyDistribution.map((entry) => (
                    <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
              </PieChart>
            </ResponsiveContainer>
          </article>
        </section>

        <article className="rounded-lg border border-[#E2E8F0] bg-[#ffffff] p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#878787]">Desempeño de Carreras</p>
              <h3 className="mt-1 text-lg font-bold text-[#1E293B]">Indicadores Seleccionados (Top 4 en Matrícula)</h3>
            </div>
            <BarChart3 className="size-5 text-[#FFB800]" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#E2E8F0]">
                  <th className="py-3 px-4 font-semibold uppercase text-xs tracking-widest text-[#878787]">Carrera</th>
                  <th className="py-3 px-4 font-semibold uppercase text-xs tracking-widest text-[#878787]">Matrícula</th>
                  <th className="py-3 px-4 font-semibold uppercase text-xs tracking-widest text-[#878787]">Retención</th>
                  <th className="py-3 px-4 font-semibold uppercase text-xs tracking-widest text-[#878787]">Titulación</th>
                </tr>
              </thead>
              <tbody>
                {careerPerformance.map((career) => (
                  <CareerRow key={career.name} career={career} />
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="rounded-lg border border-[#E2E8F0] bg-[#ffffff] p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#878787]">Análisis Comparativo</p>
              <h3 className="mt-1 text-lg font-bold text-[#1E293B]">Tasa de Retención por Facultad</h3>
            </div>
            <AlertCircle className="size-5 text-[#FFB800]" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={facultyRetention} layout="vertical" margin={{ left: 150, right: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis type="number" domain={[0, 100]} unit="%" tick={{ fontSize: 12 }} />
              <YAxis dataKey="faculty" type="category" width={140} tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #E2E8F0', borderRadius: '8px' }}
                formatter={(value) => `${value}%`}
              />
              <Bar dataKey="rate" fill="#FFB800" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </article>

        <article className="rounded-lg border border-[#E2E8F0] bg-[#ffffff] p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#878787]">Información Ejecutiva</p>
              <h3 className="mt-1 text-lg font-bold text-[#1E293B]">Puntos de Atención</h3>
            </div>
          </div>
          <ul className="space-y-3">
            <li className="flex items-start gap-3 text-sm">
              <span className="mt-1 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-[#FFB800]/10 text-[#FFB800]">!</span>
              <span className="text-[#1E293B]">Titulación oportuna en <strong>Pedagogía</strong> está en 78%, requiere seguimiento</span>
            </li>
            <li className="flex items-start gap-3 text-sm">
              <span className="mt-1 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-[#22C55E]/10 text-[#22C55E]">✓</span>
              <span className="text-[#1E293B]">Matrícula en crecimiento: +2.9% vs año anterior, tendencia positiva</span>
            </li>
            <li className="flex items-start gap-3 text-sm">
              <span className="mt-1 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-[#3B82F6]/10 text-[#3B82F6]">i</span>
              <span className="text-[#1E293B]">Humanidades presenta la menor retención (79%), considerar programa de apoyo</span>
            </li>
          </ul>
        </article>
      </div>
    </DashboardLayout>
  )
}
