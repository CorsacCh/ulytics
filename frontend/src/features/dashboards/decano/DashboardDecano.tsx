import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { BookOpen, AlertTriangle } from 'lucide-react';

import { DashboardLayout } from '../../../shared/layout/DashboardLayout';
import type { Section } from '../../../shared/components/Sidebar';
import DashboardHeader from '../../../shared/components/dashboard/DashboardHeader';
import {KpiCard} from '../../../shared/components/dashboard/KpiCard';

import { metrics } from './data/metrics';
import { careerData } from './data/careerData';
import { distributionData } from './data/distributionData';
import { criticalSubjects } from './data/criticalSubjects';

import { ProgresionAnaliticaDecano } from './components/ProgresionAnaliticaDecano';
import { ProgresionCurricularDecano } from './components/ProgresionCurricularDecano';
import { HistorialDescargasDecano } from './components/HistorialDescargasDecano';

export default function Dashboard() {
  const [section, setSection] = useState<Section>('Home');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const renderContent = () => {
    switch (section) {
      case 'Progresión analítica':
        return <ProgresionAnaliticaDecano />;
      case 'Progresión curricular':
        return <ProgresionCurricularDecano />;
      case 'Historial de descargas':
        return <HistorialDescargasDecano />;
      case 'Home':
      default:
        return (
          <div className="mx-auto max-w-[1440px] space-y-8 p-5 sm:p-8 lg:p-10">
            <DashboardHeader title="Dashboard del Decano" subtitle="FACULTAD DE INGENIERÍA" />

            {/* Tarjetas KPI */}
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {metrics.map((metric, index) => (
                <KpiCard key={index} {...metric} />
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
                  <BookOpen className="size-5 text-emerald-600" />
                </div>
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={careerData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                      <XAxis type="number" domain={[0, 100]} hide />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                      <Tooltip 
                        cursor={{ fill: '#F8FAFC' }}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={40}>
                        {careerData.map((entry, index) => (
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
                        data={distributionData}
                        innerRadius={65}
                        outerRadius={85}
                        paddingAngle={2}
                        dataKey="value"
                        stroke="none"
                      >
                        {distributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
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
                  {distributionData.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="size-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-slate-600">{item.name}</span>
                      </div>
                      <span className="font-bold text-slate-800">{item.value}%</span>
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
                  <AlertTriangle className="size-5 text-red-500" />
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
                    {criticalSubjects.map((subject, idx) => (
                      <tr key={idx} className="transition-colors hover:bg-slate-50/50">
                        <td className="py-4 pr-4 font-medium text-emerald-600">{subject.code}</td>
                        <td className="py-4 pr-4 font-bold text-slate-800">{subject.name}</td>
                        <td className="py-4 pr-4 text-slate-600">{subject.careers}</td>
                        <td className="py-4 text-right">
                          <span className="inline-flex rounded-md bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700">
                            {subject.failure}
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
