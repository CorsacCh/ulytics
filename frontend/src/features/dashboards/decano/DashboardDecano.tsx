import { AlertTriangle, ArrowDownRight, BookOpen, FileWarning, GraduationCap, Users } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useState } from 'react'
import { DashboardLayout } from '../../../shared/layout/DashboardLayout'
import type { Section } from '../../../shared/components/Sidebar'

const careerData = [
  { name: 'Ing. Civil Industrial', value: 92, fill: '#00693e' },
  { name: 'Ing. Civil Informática', value: 89, fill: '#00693e' },
  { name: 'Ing. Civil Mecánica', value: 81, fill: '#c20430' },
]
const distributionData = [
  { name: 'En trayectoria', value: 62, color: '#00693e' },
  { name: 'Con alerta', value: 23, color: '#FFB800' },
  { name: 'Riesgo crítico', value: 15, color: '#c20430' },
]
const criticalSubjects = [
  { code: 'BAIN075', name: 'Cálculo en una Variable', careers: 'Afecta a 6 carreras', failure: '42.0%' },
  { code: 'INFO101', name: 'Fundamentos de Programación', careers: 'Afecta a 4 carreras', failure: '36.7%' },
  { code: 'MECN120', name: 'Mecánica Aplicada', careers: 'Afecta a 2 carreras', failure: '31.4%' },
]
const metrics = [
  { label: 'Matrícula Total Facultad', value: '1,850', note: 'En 7 carreras', positive: true, icon: Users },
  { label: 'Retención Promedio (1er año)', value: '88%', note: '-1% vs año anterior', positive: false, icon: ArrowDownRight },
  { label: 'Titulación Oportuna Global', value: '41%', note: 'Cohortes con seguimiento N+1', positive: true, icon: GraduationCap },
  { label: 'Carreras en Riesgo', value: '2', note: 'Retención < 85%', positive: false, icon: AlertTriangle },
]

function MetricCard({ label, value, note, positive, icon: Icon }: any) {
  return <article className="rounded-xl border border-[#E2E8F0] bg-[#ffffff] p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><p className="text-sm font-semibold text-[#878787]">{label}</p><Icon className={`size-5 ${positive ? 'text-[#00693e]' : 'text-[#EF4444]'}`} /></div><p className="mt-5 text-3xl font-bold tracking-tight text-[#1E293B]">{value}</p><p className={`mt-2 flex items-center gap-1 text-xs font-semibold ${positive ? 'text-[#878787]' : 'text-[#EF4444]'}`}>{positive ? note : <><ArrowDownRight className="size-3.5" />{note}</>}</p></article>
}

export default function DashboardDecano() {
  const [section, setSection] = useState<Section>('Dashboard')
  const [open, setOpen] = useState(true)
  const [selectedSubject, setSelectedSubject] = useState<any>(null)
  const go = (label: Section) => { setSection(label) }

  return <DashboardLayout section={section} open={open} onToggle={() => setOpen(!open)} onNavigate={go}>
    <div className="mx-auto max-w-[1440px] space-y-8 p-5 sm:p-8 lg:p-10">
      <section><p className="text-sm font-semibold text-[#2D7C5E]">Período académico 2026 - Semestre 1</p><h2 className="mt-1 text-3xl font-bold tracking-tight text-[#003366]">Métricas Globales de la Facultad</h2><p className="mt-2 max-w-2xl text-sm text-[#878787]">Indicadores consolidados para apoyar la toma de decisiones académicas de la Universidad Austral de Chile.</p></section>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{metrics.map((metric) => <MetricCard key={metric.label} {...metric} />)}</section>
      <section className="grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
        <article className="rounded-xl border border-[#E2E8F0] bg-[#ffffff] p-5 shadow-sm sm:p-6"><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#878787]">Ranking y comparativa de carreras</p><h3 className="mt-1 text-xl font-bold text-[#1E293B]">Desempeño por Escuelas (Tasa de Retención)</h3></div><BookOpen className="size-5 text-[#22C55E]" /></div><div className="mt-6 h-[280px] w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={careerData} layout="vertical" margin={{ top: 5, right: 45, left: 12, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" /><XAxis type="number" domain={[0, 100]} unit="%" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} /><YAxis type="category" dataKey="name" width={145} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} /><Tooltip cursor={{ fill: '#F8FAFC' }} formatter={(value) => [`${value}%`, 'Tasa de retención']} /><Bar dataKey="value" radius={[0, 5, 5, 0]}><LabelList dataKey="value" position="right" formatter={(value) => `${value}%`} />{careerData.map((entry) => <Cell key={entry.name} fill={entry.fill} />)}</Bar></BarChart></ResponsiveContainer></div></article>
        <article className="rounded-xl border border-[#E2E8F0] bg-[#ffffff] p-5 shadow-sm sm:p-6"><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#878787]">Distribución de trayectoria</p><h3 className="mt-1 text-xl font-bold text-[#1E293B]">Estado de estudiantes</h3><div className="relative mt-2 h-[190px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={distributionData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={78} paddingAngle={3}>{distributionData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}</Pie><Tooltip formatter={(value) => [`${value}%`, 'Estudiantes']} /></PieChart></ResponsiveContainer><div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><span className="text-2xl font-bold text-[#1E293B]">85%</span><span className="text-xs text-[#878787]">sin alerta</span></div></div><div className="space-y-3">{distributionData.map((entry) => <div key={entry.name} className="flex items-center justify-between text-sm"><span className="flex items-center gap-2 text-[#1E293B]"><span className="size-2.5 rounded-full" style={{ backgroundColor: entry.color }} />{entry.name}</span><strong>{entry.value}%</strong></div>)}</div></article>
      </section>
      <section className="rounded-xl border border-[#E2E8F0] bg-[#ffffff] p-5 shadow-sm sm:p-6"><div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#EF4444]">Seguimiento prioritario</p><h3 className="mt-1 text-xl font-bold text-[#1E293B]">Ramos críticos trans-carrera</h3></div><FileWarning className="size-5 text-[#EF4444]" /></div><div className="mt-5 overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead><tr className="border-b border-[#E2E8F0] text-xs uppercase tracking-wider text-[#878787]"><th className="pb-3">Código</th><th className="pb-3">Asignatura</th><th className="pb-3">Carreras afectadas</th><th className="pb-3 text-right">Tasa reprobación promedio</th></tr></thead><tbody>{criticalSubjects.map((subject) => <tr key={subject.code} onClick={() => setSelectedSubject(subject)} className="cursor-pointer border-b border-[#E2E8F0] transition-colors hover:bg-[#F8FAFC]"><td className="py-4 font-semibold text-[#22C55E]">{subject.code}</td><td className="py-4 font-semibold text-[#1E293B]">{subject.name}</td><td className="py-4 text-[#878787]">{subject.careers}</td><td className="py-4 text-right"><span className="rounded-full bg-[#EF4444]/10 px-2.5 py-1 text-xs font-bold text-[#EF4444]">{subject.failure}</span></td></tr>)}</tbody></table></div>{selectedSubject && <p className="mt-4 text-xs text-[#878787]" role="status">Asignatura seleccionada: <strong className="text-[#1E293B]">{selectedSubject.name}</strong></p>}</section>
    </div>
  </DashboardLayout>
}
