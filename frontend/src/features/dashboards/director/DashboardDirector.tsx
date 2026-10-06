import { useEffect, useState } from 'react'
import { DashboardLayout } from '../../../shared/layout/DashboardLayout'
import type { Section } from '../../../shared/components/Sidebar'
import { KpiCard } from '../../../shared/components/dashboard/KpiCard'
import { BarChart2, BookOpen } from 'lucide-react'
import { useAuth } from '../../../features/auth/AuthContext'
import { fetchHomeDashboard, type HomeDashboardData, type FiltrosHomeDirector } from '../homeApi'

import { ProgresionAnalitica } from './components/ProgresionAnalitica'
import { ProgresionCurricular } from './components/ProgresionCurricular'
import { ReporteriaDirector } from './components/ReporteriaDirector'

function describirError(error: unknown): string {
  if (error instanceof Error) return error.message
  return 'No fue posible cargar los datos del panel institucional.'
}

function mostrarValor(value: number | null, unidad = ''): string {
  return value === null ? 'Sin datos' : `${value.toLocaleString('es-CL', { maximumFractionDigits: 2 })}${unidad}`
}

export default function DashboardDirector() {
  const { user } = useAuth()

  // El director solo puede ver la carrera de su ámbito (tipo PROGRAMA).
  const carCodigo =
    user?.ambito?.tipo === 'PROGRAMA' ? user.ambito.codigo : null

  const [section, setSection] = useState<Section>('Home')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Estado dinámico del Home
  const [filtros, setFiltros] = useState<FiltrosHomeDirector>({})
  const [data, setData] = useState<HomeDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let activo = true

    const loadData = async () => {
      if (!carCodigo) {
        setLoading(false)
        setError(
          'No se pudo identificar la carrera de la sesión activa.',
        )
        return
      }

      try {
        setLoading(true)
        setError(null)
        const result = await fetchHomeDashboard(filtros)
        if (!activo) return
        setData(result)
      } catch (err) {
        if (!activo) return
        setError(describirError(err))
      } finally {
        if (activo) setLoading(false)
      }
    }

    loadData()
    return () => {
      activo = false
    }
  }, [filtros, carCodigo])

  // El Home es un panel ejecutivo: solo KPIs y resumen. El detalle
  // (eficiencia, comparativa, avance) vive en las pestañas de
  // Progresión analítica y Progresión curricular.

  const renderContent = () => {
    switch (section) {
      case 'Progresión analítica':
        return <ProgresionAnalitica />
      case 'Progresión curricular':
        return <ProgresionCurricular />
      case 'Reportería':
        return <ReporteriaDirector />
      case 'Home':
      default:
        return (
          <div className="mx-auto max-w-[1440px] space-y-10 p-5 sm:p-8 lg:p-10 bg-[#F8FAFC] min-h-screen">
            {/* 1. HEADER PERSONALIZADO */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-slate-500 uppercase mb-2">
                  <span className="text-[#FFB800]">🎓</span> DIRECCIÓN DE CARRERA
                </div>
                <h1 className="text-3xl font-bold text-[#0A192F]">
                  {data?.carrera.nombre ?? user?.ambito?.nombre ?? 'Dirección de carrera'}
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Lectura institucional de la progresión académica y curricular
                </p>
              </div>
              <div className="flex flex-wrap items-end gap-4">
                <label className="text-sm font-medium text-gray-700">
                  Cohorte
                  <select
                    value={filtros.cohorte ?? data?.seleccion.cohorte ?? ''}
                    onChange={(e) => setFiltros({ ...data?.seleccion, cohorte: Number(e.target.value) })}
                    disabled={loading || !data?.periodos.cohortes.length}
                    className="mt-1 block w-full border border-gray-300 rounded p-2 shadow-sm focus:ring-2 focus:ring-[#FFB800] disabled:opacity-60"
                  >
                    {!data?.periodos.cohortes.length && <option value="">Sin cohortes</option>}
                    {data?.periodos.cohortes.map((periodo) => <option key={periodo} value={periodo}>{periodo}</option>)}
                  </select>
                </label>
                <label className="text-sm font-medium text-gray-700">
                  Año de medición
                  <select
                    value={filtros.anio_medicion ?? data?.seleccion.anio_medicion ?? ''}
                    onChange={(e) => setFiltros({ ...data?.seleccion, anio_medicion: Number(e.target.value) })}
                    disabled={loading || !data?.periodos.anios_medicion.length}
                    className="mt-1 block w-full border border-gray-300 rounded p-2 shadow-sm focus:ring-2 focus:ring-[#FFB800] disabled:opacity-60"
                  >
                    {!data?.periodos.anios_medicion.length && <option value="">Sin años</option>}
                    {data?.periodos.anios_medicion.map((periodo) => <option key={periodo} value={periodo}>{periodo}</option>)}
                  </select>
                </label>
              </div>
            </div>

            {/* Loading: esqueleto sutil (fade/pulse) que refleja la estructura real */}
            {loading && (
              <div
                className="flex flex-col gap-6 animate-pulse p-2"
                role="status"
                aria-live="polite"
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
                  <div className="h-24 bg-gray-200 rounded-lg" />
                  <div className="h-24 bg-gray-200 rounded-lg" />
                  <div className="h-24 bg-gray-200 rounded-lg" />
                  <div className="h-24 bg-gray-200 rounded-lg" />
                  <div className="h-24 bg-gray-200 rounded-lg" />
                </div>
                <div className="h-6 bg-gray-200 rounded w-1/3" />
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-32 bg-gray-200 rounded-lg" />
                  <div className="h-32 bg-gray-200 rounded-lg" />
                </div>
              </div>
            )}

            {/* Error */}
            {!loading && error && (
              <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-slate-200/80 bg-white shadow-sm">
                <span className="text-sm font-medium text-red-600">{error}</span>
              </div>
            )}

            {/* Contenido dinámico */}
            {!loading && !error && data && (
              <>
                {/* 2. TARJETAS KPI */}
                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                  <KpiCard
                    label="Ingresos totales"
                    value={mostrarValor(data.kpis.ingresos_totales)}
                    description={`Total informado · Cohorte ${data.seleccion.cohorte ?? '—'}`}
                    positive
                    icon={BookOpen}
                    variant="spacious"
                  />
                  <KpiCard
                    label="Matrícula total"
                    value={mostrarValor(data.kpis.matricula_total)}
                    description={`Año de medición ${data.seleccion.anio_medicion ?? '—'}`}
                    positive
                    icon={BookOpen}
                    variant="spacious"
                  />
                  <KpiCard
                    label="Retención de 1er año"
                    value={mostrarValor(data.kpis.retencion_1er_ano, '%')}
                    description={`Cohorte ${data.seleccion.cohorte ?? '—'}`}
                    positive
                    icon={BarChart2}
                    variant="spacious"
                  />
                  <KpiCard
                    label="Titulación total"
                    value={mostrarValor(data.kpis.titulacion_oportuna, '%')}
                    description={`Cohorte ${data.seleccion.cohorte ?? '—'}`}
                    positive
                    icon={BookOpen}
                    variant="spacious"
                  />
                  <KpiCard
                    label="Duración real"
                    value={mostrarValor(data.kpis.tiempo_promedio, ' sem.')}
                    description={`Cohorte ${data.seleccion.cohorte ?? '—'}`}
                    positive
                    icon={BookOpen}
                    variant="spacious"
                  />
                </section>

                {/* SECCIÓN DE RESUMEN EJECUTIVO */}
                <section className="grid gap-6 mt-8 md:grid-cols-2">
                  {/* Widget de Posicionamiento */}
                  <div className="bg-white border rounded-lg shadow-sm p-6 flex flex-col justify-center items-start">
                    <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">
                      Comparativa Institucional
                    </h2>
                    {data.resumen.top_percentil_retencion !== null ? (
                      <>
                        <p className="text-3xl font-extrabold text-blue-600 mb-2">
                          Top {data.resumen.top_percentil_retencion}%
                        </p>
                        <p className="text-gray-600 text-sm">
                          Tu carrera se encuentra en el {data.resumen.top_percentil_retencion}%
                          superior de retención institucional para la cohorte{' '}
                          {data.seleccion.cohorte ?? '—'}.
                        </p>
                      </>
                    ) : (
                      <p className="text-gray-500 text-sm">
                        Datos insuficientes para calcular el ranking de esta cohorte.
                      </p>
                    )}
                  </div>

                  {/* Widget de Alertas Curriculares */}
                  <div className="bg-white border rounded-lg shadow-sm p-6 flex flex-col justify-between items-start">
                    <div>
                      <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">
                        Alertas Curriculares
                      </h2>
                      <p className="text-3xl font-extrabold text-orange-500 mb-2">
                        {data.resumen.total_asignaturas_criticas !== null
                          ? `${data.resumen.total_asignaturas_criticas} asignaturas`
                          : 'Sin datos'}
                      </p>
                      <p className="text-gray-600 text-sm">
                        registran tasas de reprobación en nivel crítico o de atención (≥ 30%)
                        en el año {data.seleccion.anio_medicion ?? '—'}.
                      </p>
                    </div>
                    <button
                      className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded hover:bg-gray-200 transition-colors"
                      onClick={() => setSection('Progresión curricular')}
                    >
                      Ver detalle en Progresión Curricular →
                    </button>
                  </div>
                </section>
              </>
            )}
          </div>
        )
    }
  }

  return (
    <DashboardLayout
      section={section}
      open={sidebarOpen}
      onToggle={() => setSidebarOpen((prev) => !prev)}
      onNavigate={(sec) => setSection(sec)}
    >
      {renderContent()}
    </DashboardLayout>
  )
}
