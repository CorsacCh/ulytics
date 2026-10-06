import { useEffect, useState } from 'react';
import { FileText, ChevronDown, Download, Landmark } from 'lucide-react';
import { facultadesOptions, carrerasOptions, aplicarCodigosCarreras } from '../data/institucionData';
import { obtenerCatalogoCarreras, type CatalogoCarrera } from '../api';
import { AutoridadSelectors } from './AutoridadSelectors';
import { DataCardView } from '../../components/DataCardView';
import { formatearValorCurricular, pivotarAsignaturasPorAnio } from '../../../../shared/utils/formatters';
import { AvanceCicloFormativo } from '../../components/AvanceCicloFormativo';
import { EficienciaCurricular } from '../../components/EficienciaCurricular';
import type { FilaAvanceCurricular, FilaEficiencia } from '../../director/data/curricular';

// Datos estáticos de demostración con la misma forma que entrega la API:
// una fila por asignatura, semestre y año de medición (null = vacío/guion).
const ASIGNATIVAS_CRITICAS_AUTORIDAD = [
  { asig_codigo: 'AAAA111-21', asig_codigo_base: 'AAAA111', semestre: 1, anio_medicion: 2021, tasa_reprobacion: null },
  { asig_codigo: 'AAAA111-21', asig_codigo_base: 'AAAA111', semestre: 1, anio_medicion: 2022, tasa_reprobacion: 62.8 },
  { asig_codigo: 'AAAA111-21', asig_codigo_base: 'AAAA111', semestre: 1, anio_medicion: 2023, tasa_reprobacion: 55 },
  { asig_codigo: 'AAAA111-21', asig_codigo_base: 'AAAA111', semestre: 1, anio_medicion: 2024, tasa_reprobacion: null },
  { asig_codigo: 'AAAA111-21', asig_codigo_base: 'AAAA111', semestre: 1, anio_medicion: 2025, tasa_reprobacion: 35 },
];

// Espejo de la TABLA 1: la demo estática solo informa los tramos Baja y Alta;
// Media y Eficiente quedan en null (sin dato) y nunca se inventan como 0.
const DATOS_EFICIENCIA: FilaEficiencia[] = [
  { cohorte: 2021, total_alumnos_regulares: 30, nivel_baja: 0, nivel_media: null, nivel_alta: 26, nivel_eficiente: null },
  { cohorte: 2022, total_alumnos_regulares: 48, nivel_baja: 1, nivel_media: null, nivel_alta: 21, nivel_eficiente: null },
  { cohorte: 2023, total_alumnos_regulares: 40, nivel_baja: 1, nivel_media: null, nivel_alta: 8, nivel_eficiente: null },
  { cohorte: 2024, total_alumnos_regulares: 54, nivel_baja: 2, nivel_media: null, nivel_alta: 15, nivel_eficiente: null },
  { cohorte: 2025, total_alumnos_regulares: 59, nivel_baja: 2, nivel_media: null, nivel_alta: 17, nivel_eficiente: null },
];

// Espejo de la TABLA 2: las cinco categorías del commit, que suman 100 por cohorte.
const DATOS_AVANCE: FilaAvanceCurricular[] = [
  {
    cohorte: 2021,
    porcentaje_bachillerato: 0,
    porcentaje_licenciatura_con_bachillerato_pendiente: 13,
    porcentaje_licenciatura: 67,
    porcentaje_titulo_con_bachillerato_licenciatura_pendiente: 0,
    porcentaje_titulo: 20,
  },
  {
    cohorte: 2022,
    porcentaje_bachillerato: 0,
    porcentaje_licenciatura_con_bachillerato_pendiente: 10,
    porcentaje_licenciatura: 90,
    porcentaje_titulo_con_bachillerato_licenciatura_pendiente: 0,
    porcentaje_titulo: 0,
  },
];

export function ProgresionCurricularAutoridad() {
  const [selectedFacultad, setSelectedFacultad] = useState<string | null>(null);
  const [selectedCarrera, setSelectedCarrera] = useState<string | null>(null);

  // Códigos oficiales desde el catálogo institucional; sin conexión los
  // selectores siguen funcionando y muestran solo el nombre de la carrera.
  const [catalogoCarreras, setCatalogoCarreras] = useState<CatalogoCarrera[]>([]);

  useEffect(() => {
    let activo = true;
    obtenerCatalogoCarreras()
      .then((carreras) => {
        if (activo) setCatalogoCarreras(carreras);
      })
      .catch(() => {
        // Sin catálogo disponible la UI degrada sin códigos, nunca se rompe.
      });
    return () => {
      activo = false;
    };
  }, []);

  const carrerasConCodigo = aplicarCodigosCarreras(carrerasOptions, catalogoCarreras);

  // La carrera se resetea al cambiar la facultad hasta que el usuario elija
  // una carrera de la lista filtrada.
  const handleFacultadChange = (id: string) => {
    setSelectedFacultad(id);
    setSelectedCarrera(null);
  };

  const handleCarreraChange = (id: string) => setSelectedCarrera(id);

  const facultadSeleccionada = facultadesOptions.find((f) => f.id === selectedFacultad)?.nombre ?? null;
  const carreraSeleccionada = carrerasOptions.find((c) => c.id === selectedCarrera)?.nombre ?? null;
  const contextoSeleccion = facultadSeleccionada
    ? carreraSeleccionada
      ? `${facultadSeleccionada} · ${carreraSeleccionada}`
      : `${facultadSeleccionada} · Seleccione una carrera`
    : 'Seleccione una facultad y una carrera para filtrar';

  // Estructura pivotada: una fila por asignatura/semestre y años como columnas.
  const { anios: aniosCriticas, filas: asignaturasAgrupadas } =
    pivotarAsignaturasPorAnio(ASIGNATIVAS_CRITICAS_AUTORIDAD);

  return (
    <div className="mx-auto max-w-[1440px] space-y-10 p-5 sm:p-8 lg:p-10 bg-[#F8FAFC] min-h-screen">
      
      {/* PANEL DE CONTROL DE AUTORIDAD (DOBLE FILTRO) */}
      <div className="flex flex-col gap-6 rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm xl:flex-row xl:items-end xl:justify-between">
        
        <div className="flex flex-col gap-2 flex-1">
          <p className="flex items-center gap-2 text-xs font-bold tracking-widest text-slate-500 uppercase">
            <Landmark className="size-4 text-[#FFB800]" />
            Nivel Central · Autoridad Institucional
          </p>
          <h2 className="text-2xl font-bold text-[#0A192F]">Progresión curricular</h2>
          
        </div>

        <button
          disabled
          title="Próximamente"
          className="flex w-fit items-center gap-2 rounded-lg bg-[#0A192F] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors opacity-50 cursor-not-allowed"
        >
          <FileText className="size-4" />
          Exportar reporte a PDF
        </button>
      </div>

      {/* SELECTORES JERÁRQUICOS EN CASCADA: FACULTAD -> CARRERA */}
      <AutoridadSelectors
        facultades={facultadesOptions}
        carreras={carrerasConCodigo}
        selectedFacultad={selectedFacultad}
        selectedCarrera={selectedCarrera}
        onFacultadChange={handleFacultadChange}
        onCarreraChange={handleCarreraChange}
      />

      {/* CONTENEDOR DE DATOS DINÁMICOS */}
      <div className="space-y-6">
        
        {/* Encabezado Dinámico */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold tracking-widest text-slate-500 uppercase mb-2">
              {contextoSeleccion}
            </p>
            <h1 className="text-3xl font-bold text-[#0A192F]">Datos de Progresión Curricular</h1>
            <p className="mt-1 text-sm text-slate-500 max-w-2xl">
              Caracterización de la distribución de tipos de estado de avance de estudiantes matriculados en 2026.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
              Cohorte: <span className="text-slate-900">2026</span> <ChevronDown className="size-4 text-slate-400" />
            </button>
            <button
              disabled
              title="Próximamente"
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm opacity-50 cursor-not-allowed"
            >
              <Download className="size-4" /> Descargar Excel
            </button>
          </div>
        </div>

        {/* TABLA 1: Tasa de eficiencia curricular por cohorte */}
        <DataCardView
          title="Tasa de eficiencia curricular por cohorte"
          description="Distribución de estudiantes según cohorte de ingreso y estado de avance curricular."
          defaultView="table"
          chartComponent={
            <EficienciaCurricular data={DATOS_EFICIENCIA} mostrarCabecera={false} />
          }
          tableComponent={
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-[#FFF9E6]">
                    <th className="py-3 px-6 font-semibold text-slate-700 border-b border-slate-200">Cohortes / Tasa de Eficiencia</th>
                    <th className="py-3 px-6 font-semibold text-slate-700 border-b border-slate-200">2021</th>
                    <th className="py-3 px-6 font-semibold text-slate-700 border-b border-slate-200">2022</th>
                    <th className="py-3 px-6 font-semibold text-slate-700 border-b border-slate-200">2023</th>
                    <th className="py-3 px-6 font-semibold text-slate-700 border-b border-slate-200">2024</th>
                    <th className="py-3 px-6 font-semibold text-slate-700 border-b border-slate-200">2025</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  <tr className="bg-slate-50/50">
                    <td className="py-3.5 px-6 font-bold text-slate-900">Nº Alumnos regulares</td>
                    <td className="py-3.5 px-6 font-bold text-slate-900">30</td>
                    <td className="py-3.5 px-6 font-bold text-slate-900">48</td>
                    <td className="py-3.5 px-6 font-bold text-slate-900">40</td>
                    <td className="py-3.5 px-6 font-bold text-slate-900">54</td>
                    <td className="py-3.5 px-6 font-bold text-slate-900">59</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-6 font-medium text-slate-800">Baja (entre 0&lt;60%)</td>
                    <td className="py-3.5 px-6">0</td>
                    <td className="py-3.5 px-6">1</td>
                    <td className="py-3.5 px-6">1</td>
                    <td className="py-3.5 px-6">2</td>
                    <td className="py-3.5 px-6">2</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-6 font-medium text-slate-800">Alta (entre 80 &lt;100%)</td>
                    <td className="py-3.5 px-6">26</td>
                    <td className="py-3.5 px-6">21</td>
                    <td className="py-3.5 px-6">8</td>
                    <td className="py-3.5 px-6">15</td>
                    <td className="py-3.5 px-6">17</td>
                  </tr>
                </tbody>
              </table>
            </div>
          }
        />

        {/* TABLA 2: Estado de avance por ciclo formativo */}
        <DataCardView
          title="Estado de avance por ciclo formativo"
          description="Número de estudiantes con condición académica de Alumno Regular, matriculados en 2026, por estado de avance según ciclo formativo."
          defaultView="table"
          chartComponent={
            <AvanceCicloFormativo data={DATOS_AVANCE} mostrarCabecera={false} />
          }
          tableComponent={
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-[#FFF9E6]">
                    <th className="py-3 px-6 font-semibold text-slate-700 border-b border-slate-200">Cohorte</th>
                    <th className="py-3 px-6 font-semibold text-slate-700 border-b border-slate-200">Bachillerato</th>
                    <th className="py-3 px-6 font-semibold text-slate-700 border-b border-slate-200">Licenciatura con asignaturas pendientes de Bachillerato</th>
                    <th className="py-3 px-6 font-semibold text-slate-700 border-b border-slate-200">Licenciatura</th>
                    <th className="py-3 px-6 font-semibold text-slate-700 border-b border-slate-200">Título con pendientes de Bachillerato o Licenciatura</th>
                    <th className="py-3 px-6 font-semibold text-slate-700 border-b border-slate-200">Título</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  <tr>
                    <td className="py-3.5 px-6 font-bold text-slate-900">2021</td>
                    <td className="py-3.5 px-6">0%</td>
                    <td className="py-3.5 px-6">13%</td>
                    <td className="py-3.5 px-6">67%</td>
                    <td className="py-3.5 px-6">0%</td>
                    <td className="py-3.5 px-6">20%</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-6 font-bold text-slate-900">2022</td>
                    <td className="py-3.5 px-6">0%</td>
                    <td className="py-3.5 px-6">10%</td>
                    <td className="py-3.5 px-6">90%</td>
                    <td className="py-3.5 px-6">0%</td>
                    <td className="py-3.5 px-6">0%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          }
        />

        {/* TABLA 3: Asignaturas críticas */}
        <DataCardView
          title="Asignaturas críticas"
          description="Se consideran críticas las asignaturas con reprobación mayor o igual a 30% en al menos 3 de los últimos 5 años, afectando la permanencia, titulación y tiempos de titulación."
          defaultView="table"
          chartComponent={
            <div className="flex h-64 items-center justify-center rounded-lg bg-gray-50 text-gray-400">
              Gráfico en desarrollo...
            </div>
          }
          tableComponent={
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-[#FFF9E6]">
                    <th className="py-3 px-6 font-semibold text-slate-700 border-b border-slate-200">Código de asignatura</th>
                    <th className="py-3 px-6 text-center font-semibold text-slate-700 border-b border-slate-200">Semestre</th>
                    {aniosCriticas.map((anio) => (
                      <th key={anio} className="py-3 px-6 text-center font-semibold text-slate-700 border-b border-slate-200">{anio}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {asignaturasAgrupadas.map((fila) => (
                    <tr key={`${fila.codigo_base}-${fila.semestre ?? 'sin-semestre'}`} className="hover:bg-slate-50/60">
                      <td className="py-3.5 px-6 font-medium text-slate-900">{fila.codigo_base}</td>
                      <td className="py-3.5 px-6 text-center tabular-nums">
                        {fila.semestre ?? <span className="text-slate-400">-</span>}
                      </td>
                      {aniosCriticas.map((anio) => {
                        const tasa = fila.valoresPorAnio[anio]?.tasa_reprobacion;
                        return (
                          <td key={anio} className="py-3.5 px-6 text-center tabular-nums">
                            {tasa == null ? (
                              <span className="text-slate-400">-</span>
                            ) : (
                              formatearValorCurricular(tasa, true)
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          }
        />

      </div>
    </div>
  );
}