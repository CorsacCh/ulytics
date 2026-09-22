import { useState } from 'react'
import { TablaMatricula } from '../components/TablaMatricula'
import { DashboardLayout } from '../../../shared/layout/DashboardLayout'
import type { Section } from '../../../shared/components/Sidebar'
import { useAuth } from '../../auth/AuthContext'

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
      <div className="mx-auto w-full max-w-7xl p-5 sm:p-8 lg:p-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#002B49]">Mi Carrera</h1>
          <p className="mt-2 text-gray-500">
            Análisis de Progresión Académica y Curricular
          </p>
        </div>

        {/* En lugar de "0001" estático, pasamos el código real del usuario logueado */}
        {carCodigoActivo ? (
          <TablaMatricula carCodigo={carCodigoActivo} />
        ) : (
          <div className="border-l-4 border-yellow-400 bg-yellow-50 p-4">
            <p className="text-yellow-700">Tu cuenta de Director no tiene un código de carrera asociado. Contacta al Administrador.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
