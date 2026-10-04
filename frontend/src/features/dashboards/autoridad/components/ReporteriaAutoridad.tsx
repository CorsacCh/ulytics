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

export function ReporteriaAutoridad() {
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

  return (
    <ReporteriaView
      reportTitle="Reportería"
      activeFilters="Institución completa"
      etiqueta="AUTORIDAD CENTRAL"
      subtitulo="Configura y genera reportes consolidados con los indicadores institucionales de la Universidad."
      modulos={modulos}
      descripcionHistorial="Consulta y vuelve a descargar reportes institucionales generados anteriormente."
    />
  );
}

