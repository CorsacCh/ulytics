import { useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { ReporteriaView, type ModuloReporteria } from '../../components/ReporteriaView';
import { facultyRetention, enrollmentTrend, facultyDistribution } from '../data/chartData';
import { careerPerformance } from '../data/careerData';
import type { FilaExportable } from '../../../../utils/exportUtils';

// Tabla simple reutilizada por los módulos sin gráfico propio.
function TablaSimple({
  titulo,
  descripcion,
  columnas,
  filas,
}: {
  titulo: string;
  descripcion: string;
  columnas: string[];
  filas: (string | number)[][];
}) {
  return (
    <article className="rounded-xl border border-slate-200/80 bg-white p-6">
      <h3 className="text-lg font-bold text-slate-800">{titulo}</h3>
      <p className="mt-0.5 text-xs text-slate-500">{descripcion}</p>
      <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#FFF9E6]">
            <tr>
              {columnas.map((columna, indice) => (
                <th
                  key={columna}
                  className={`px-4 py-3 font-semibold text-slate-700 ${indice === 0 ? '' : 'text-center'}`}
                >
                  {columna}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filas.map((fila) => (
              <tr key={String(fila[0])}>
                {fila.map((celda, indice) => (
                  <td
                    key={indice}
                    className={`px-4 py-3 ${indice === 0 ? 'text-slate-700' : 'text-center font-semibold text-slate-800'}`}
                  >
                    {celda}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}

type AlcanceReporteAutoridad = 'INSTITUCION' | 'FACULTADES';

// Selector de periodo con el mismo diseño que el de ReporteriaDecano.
function SelectorPeriodo({
  etiqueta,
  valor,
  opciones,
  onChange,
}: {
  etiqueta: string;
  valor: number | null;
  opciones: number[];
  onChange: (valor: number) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{etiqueta}</span>
      <select
        value={valor ?? ''}
        onChange={(evento) => onChange(Number(evento.target.value))}
        disabled={opciones.length === 0}
        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-[#0A192F] outline-none focus:border-[#FFB800] focus:ring-2 focus:ring-[#FFB800]/20 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {opciones.map((opcion) => (
          <option key={opcion} value={opcion}>
            {opcion}
          </option>
        ))}
      </select>
    </label>
  );
}

export function ReporteriaAutoridad() {
  // FASE 1: alcance académico y tramos temporales (mismo patrón que ReporteriaDecano).
  // Los filtros gobiernan el resumen de configuración; la exportación final
  // contra datos reales queda para la siguiente iteración.
  const facultadesDisponibles = facultyRetention.map((facultad) => facultad.faculty);
  const aniosDisponibles = enrollmentTrend
    .map((anio) => Number(anio.year))
    .filter((anio) => Number.isFinite(anio))
    .sort((a, b) => a - b);
  // Los mocks institucionales no traen dimensión de cohorte: se reutilizan los
  // años de matrícula como tramo seleccionable hasta conectar datos reales.
  const cohortesDisponibles = aniosDisponibles;

  const [alcance, setAlcance] = useState<AlcanceReporteAutoridad>('INSTITUCION');
  const [facultadesSeleccionadas, setFacultadesSeleccionadas] = useState<string[]>(facultadesDisponibles);
  const [cohorteDesde, setCohorteDesde] = useState<number | null>(cohortesDisponibles[0] ?? null);
  const [cohorteHasta, setCohorteHasta] = useState<number | null>(
    cohortesDisponibles[cohortesDisponibles.length - 1] ?? null,
  );
  const [anioDesde, setAnioDesde] = useState<number | null>(aniosDisponibles[0] ?? null);
  const [anioHasta, setAnioHasta] = useState<number | null>(
    aniosDisponibles[aniosDisponibles.length - 1] ?? null,
  );

  // Mantienen coherente el tramo: "desde" nunca supera a "hasta".
  const cambiarCohorteDesde = (valor: number) => {
    setCohorteDesde(valor);
    if (cohorteHasta !== null && valor > cohorteHasta) setCohorteHasta(valor);
  };
  const cambiarCohorteHasta = (valor: number) => {
    setCohorteHasta(valor);
    if (cohorteDesde !== null && valor < cohorteDesde) setCohorteDesde(valor);
  };
  const cambiarAnioDesde = (valor: number) => {
    setAnioDesde(valor);
    if (anioHasta !== null && valor > anioHasta) setAnioHasta(valor);
  };
  const cambiarAnioHasta = (valor: number) => {
    setAnioHasta(valor);
    if (anioDesde !== null && valor < anioDesde) setAnioDesde(valor);
  };
  const cambiarSeleccionFacultad = (nombre: string) => {
    setFacultadesSeleccionadas((prev) =>
      prev.includes(nombre) ? prev.filter((item) => item !== nombre) : [...prev, nombre],
    );
  };

  const descripcionAlcance =
    alcance === 'INSTITUCION'
      ? 'Institución completa'
      : `${facultadesSeleccionadas.length} ${
          facultadesSeleccionadas.length === 1 ? 'facultad' : 'facultades'
        }`;

  const filtrosActivos = `${descripcionAlcance} · C ${cohorteDesde ?? '—'}-${cohorteHasta ?? '—'} · A ${
    anioDesde ?? '—'
  }-${anioHasta ?? '—'}`;

  const datosRetencion: FilaExportable[] = facultyRetention.map((facultad) => ({
    Facultad: facultad.faculty,
    'Retención (%)': facultad.rate,
  }));

  const datosMatricula: FilaExportable[] = enrollmentTrend.map((anio) => ({
    Año: anio.year,
    'Matrícula total': anio.total,
  }));

  const datosDistribucion: FilaExportable[] = facultyDistribution.map((facultad) => ({
    Facultad: facultad.name,
    'Participación (%)': facultad.value,
  }));

  const datosCarreras: FilaExportable[] = careerPerformance.map((carrera) => ({
    Carrera: carrera.name,
    Matrícula: carrera.enrollment,
    'Retención (%)': carrera.retention,
    'Titulación (%)': carrera.graduation,
  }));

  const ANALITICA = 'Progresión Analítica';
  const CURRICULAR = 'Progresión Curricular';

  const modulos: ModuloReporteria[] = [
    {
      categoria: ANALITICA,
      id: 'reporteria-autoridad-retencion',
      label: 'Retención por facultad',
      tipoVista: 'Gráfico',
      data: datosRetencion,
      formats: ['pdf', 'excel'],
      render: () => (
          <article className="rounded-xl border border-slate-200/80 bg-white p-6">
            <h3 className="text-lg font-bold text-slate-800">Retención por facultad</h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Porcentaje de retención institucional por facultad.
            </p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={facultyRetention} layout="vertical" margin={{ left: 120, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                <XAxis type="number" domain={[0, 100]} unit="%" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="faculty" width={110} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(valor) => `${valor}%`} />
                <Bar
                dataKey="rate"
                fill="#FFB800"
                radius={[0, 4, 4, 0]}
                barSize={20}
                isAnimationActive={false}
              />
              </BarChart>
            </ResponsiveContainer>
          </article>
      ),
    },
    {
      categoria: ANALITICA,
      id: 'reporteria-autoridad-matricula',
      label: 'Evolución de la matrícula institucional',
      tipoVista: 'Gráfico',
      data: datosMatricula,
      formats: ['pdf', 'excel'],
      render: () => (
          <article className="rounded-xl border border-slate-200/80 bg-white p-6">
            <h3 className="text-lg font-bold text-slate-800">Evolución de la matrícula</h3>
            <p className="mt-0.5 text-xs text-slate-500">Matrícula total institucional por año.</p>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={enrollmentTrend} margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#2563EB"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </article>
      ),
    },
    {
      categoria: ANALITICA,
      id: 'reporteria-autoridad-distribucion',
      label: 'Distribución de matrícula por facultad',
      tipoVista: 'Tabla',
      data: datosDistribucion,
      formats: ['pdf', 'excel'],
      render: () => (
          <TablaSimple
            titulo="Distribución por facultad"
            descripcion="Participación porcentual de cada facultad en la matrícula institucional."
            columnas={['Facultad', 'Participación']}
            filas={facultyDistribution.map((f) => [f.name, `${f.value}%`])}
          />
      ),
    },
    {
      categoria: CURRICULAR,
      id: 'reporteria-autoridad-carreras',
      label: 'Desempeño por carrera',
      tipoVista: 'Tabla',
      data: datosCarreras,
      formats: ['pdf', 'excel'],
      render: () => (
          <TablaSimple
            titulo="Desempeño por carrera"
            descripcion="Matrícula, retención y titulación de las carreras de la institución."
            columnas={['Carrera', 'Matrícula', 'Retención', 'Titulación']}
            filas={careerPerformance.map((c) => [
              c.name,
              c.enrollment,
              `${c.retention}%`,
              `${c.graduation}%`,
            ])}
          />
      ),
    },
  ];

  const configuracion = (
    <div className="space-y-7">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
          1. Alcance académico
        </p>
        <h2 className="mt-1 text-lg font-bold text-slate-800">Define las facultades del reporte</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="flex cursor-pointer gap-3 rounded-lg border border-slate-200 p-4 hover:bg-slate-50">
            <input
              type="radio"
              name="alcance-reporte-autoridad"
              value="INSTITUCION"
              checked={alcance === 'INSTITUCION'}
              onChange={() => setAlcance('INSTITUCION')}
            />
            <span>
              <span className="block text-sm font-semibold text-slate-800">Institución completa</span>
              <span className="mt-1 block text-xs text-slate-500">
                Incluye las {facultadesDisponibles.length} facultades de la institución.
              </span>
            </span>
          </label>
          <label className="flex cursor-pointer gap-3 rounded-lg border border-slate-200 p-4 hover:bg-slate-50">
            <input
              type="radio"
              name="alcance-reporte-autoridad"
              value="FACULTADES"
              checked={alcance === 'FACULTADES'}
              onChange={() => setAlcance('FACULTADES')}
            />
            <span>
              <span className="block text-sm font-semibold text-slate-800">Facultades específicas</span>
              <span className="mt-1 block text-xs text-slate-500">
                Permite incluir una o varias facultades.
              </span>
            </span>
          </label>
        </div>

        {alcance === 'FACULTADES' && (
          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50/60 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-700">
                {facultadesSeleccionadas.length} de {facultadesDisponibles.length} facultades seleccionadas
              </p>
              <div className="flex gap-3 text-xs font-semibold text-[#004d99]">
                <button type="button" onClick={() => setFacultadesSeleccionadas(facultadesDisponibles)}>
                  Seleccionar todas
                </button>
                <button type="button" onClick={() => setFacultadesSeleccionadas([])}>
                  Limpiar
                </button>
              </div>
            </div>
            <div className="grid max-h-56 gap-2 overflow-y-auto pr-2 sm:grid-cols-2">
              {facultadesDisponibles.map((nombre) => (
                <label
                  key={nombre}
                  className="flex cursor-pointer items-start gap-2 rounded-md bg-white px-3 py-2 text-sm text-slate-700"
                >
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={facultadesSeleccionadas.includes(nombre)}
                    onChange={() => cambiarSeleccionFacultad(nombre)}
                  />
                  <span className="font-semibold">{nombre}</span>
                </label>
              ))}
            </div>
            {facultadesSeleccionadas.length === 0 && (
              <p className="mt-3 text-sm font-medium text-red-600">
                Selecciona al menos una facultad para el reporte.
              </p>
            )}
          </div>
        )}
      </div>

      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
          2. Tramos temporales
        </p>
        <h2 className="mt-1 text-lg font-bold text-slate-800">Selecciona los períodos incluidos</h2>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          Las cohortes se aplican a progresión y avance; los años de medición se aplican a matrícula.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SelectorPeriodo
            etiqueta="Cohorte desde"
            valor={cohorteDesde}
            opciones={cohortesDisponibles}
            onChange={cambiarCohorteDesde}
          />
          <SelectorPeriodo
            etiqueta="Cohorte hasta"
            valor={cohorteHasta}
            opciones={cohortesDisponibles}
            onChange={cambiarCohorteHasta}
          />
          <SelectorPeriodo
            etiqueta="Año de medición desde"
            valor={anioDesde}
            opciones={aniosDisponibles}
            onChange={cambiarAnioDesde}
          />
          <SelectorPeriodo
            etiqueta="Año de medición hasta"
            valor={anioHasta}
            opciones={aniosDisponibles}
            onChange={cambiarAnioHasta}
          />
        </div>
      </div>

      <div className="rounded-lg bg-[#FFF9E6] px-4 py-3 text-sm text-slate-700">
        <span className="font-semibold">Configuración actual:</span> {descripcionAlcance} · cohortes{' '}
        {cohorteDesde ?? '—'}–{cohorteHasta ?? '—'} · años {anioDesde ?? '—'}–{anioHasta ?? '—'}.
      </div>
    </div>
  );

  return (
    <ReporteriaView
      reportTitle="Reportería"
      activeFilters={filtrosActivos}
      etiqueta="AUTORIDAD CENTRAL"
      subtitulo="Configura y genera reportes consolidados con los indicadores institucionales de la Universidad."
      modulos={modulos}
      configuracion={configuracion}
      descripcionHistorial="Consulta y vuelve a descargar reportes institucionales generados anteriormente."
    />
  );
}

