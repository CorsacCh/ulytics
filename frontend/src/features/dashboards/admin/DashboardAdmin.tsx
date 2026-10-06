import { useState } from 'react'
import { DashboardLayout } from '../../../shared/layout/DashboardLayout'
import type { Section } from '../../../shared/components/Sidebar'
import { UserManagementPanel } from '../../admin/UserManagementPanel'
import { CargaDatosPanel } from '../../admin/CargaDatosPanel'

export default function DashboardAdmin() {
  const [section, setSection] = useState<Section>('Usuarios y permisos')
  const [open, setOpen] = useState(true)
  const go = (label: Section) => { setSection(label) }

  return <DashboardLayout section={section} open={open} onToggle={() => setOpen(!open)} onNavigate={go}>
    <div className="mx-auto max-w-[1440px] p-5 sm:p-8 lg:p-10">
      <header className="mb-8 flex flex-col gap-5 border-b border-[#D9E5F0] pb-7 xl:flex-row xl:items-end xl:justify-between"><div><p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[#556B7B]">Consola de administración</p><h1 className="text-balance text-3xl font-bold tracking-tight text-[#003366] sm:text-4xl">{section}</h1><p className="mt-2 text-sm text-[#556B7B]">Plataforma para Generar Reporterías de Indicadores de Progresión Académica y Curricular</p></div></header>
      {section === 'Cargas de datos' && <CargaDatosPanel />}
      {section === 'Usuarios y permisos' && <UserManagementPanel />}
    </div>
  </DashboardLayout>
}

