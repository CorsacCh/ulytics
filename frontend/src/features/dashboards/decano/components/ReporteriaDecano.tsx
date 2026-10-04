import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { ReporteriaView, type ModuloReporteria } from '../../components/ReporteriaView';
import { careerData } from '../data/careerData';
import { distributionData } from '../data/distributionData';
import { criticalSubjects } from '../data/criticalSubjects';
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
                  className={`px-4 py-3 font-semibold text-slate-700 ${
                    indice === 0 ? '' : 'text-center'
                  }`}
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
                    className={`px-4 py-3 ${
                      indice === 0 ? 'text-slate-700' : 'text-center font-semibold text-slate-800'
                    }`}
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

export function ReporteriaDecano() {
  const datosRetencion: FilaExportable[] = careerData.map((carrera) => ({
    Carrera: carrera.name,
    'Retención (%)': carrera.value,
  }));

  const datosEstado: FilaExportable[] = distributionData.map((estado) => ({
    Estado: estado.name,
    'Porcentaje (%)': estado.value,
  }));

  const datosCriticas: FilaExportable[] = criticalSubjects.map((asignatura) => ({
    Asignatura: asignatura.name,
    Código: asignatura.code,
    Carreras: asignatura.careers,
    'Tasa de reprobación': asignatura.failure,
  }));

  const modulos: ModuloReporteria[] = [
    {
      categoria: 'Progresión Analítica',
      id: 'reporteria-decano-retencion',
      label: 'Retención por carrera de la facultad',
      data: datosRetencion,
      formats: ['pdf', 'excel'],
      render: () => (
          <article className="rounded-xl border border-slate-200/80 bg-white p-6">
            <h3 className="text-lg font-bold text-slate-800">Retención por carrera</h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Porcentaje de retención de estudiantes de la facultad por carrera.
            </p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={careerData} layout="vertical" margin={{ left: 140, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  unit="%"
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={130}
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip formatter={(valor) => `${valor}%`} />
                <Bar
                dataKey="value"
                fill="#00693e"
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
      categoria: 'Progresión Analítica',
      id: 'reporteria-decano-estado',
      label: 'Estado de avance de la facultad',
      data: datosEstado,
      formats: ['pdf', 'excel'],
      render: () => (
          <TablaSimple
            titulo="Estado de avance"
            descripcion="Distribución de estudiantes de la facultad según su situación de avance."
            columnas={['Estado', 'Porcentaje']}
            filas={distributionData.map((estado) => [`${estado.name}`, `${estado.value}%`])}
          />
      ),
    },
    {
      categoria: 'Progresión Curricular',
      id: 'reporteria-decano-criticas',
      label: 'Asignaturas críticas de la facultad',
      data: datosCriticas,
      formats: ['pdf', 'excel'],
      render: () => (
          <TablaSimple
            titulo="Asignaturas críticas"
            descripcion="Asignaturas con mayor tasa de reprobación en la facultad."
            columnas={['Asignatura', 'Código', 'Reprobación']}
            filas={criticalSubjects.map((asignatura) => [
              asignatura.name,
              asignatura.code,
              asignatura.failure,
            ])}
          />
      ),
    },
  ];

  return (
    <ReporteriaView
      reportTitle="Reportería"
      activeFilters="Facultad completa"
      etiqueta="DECANATO"
      subtitulo="Configura y genera reportes consolidados de la facultad a partir de los indicadores cargados."
      modulos={modulos}
      descripcionHistorial="Consulta y vuelve a descargar reportes institucionales generados anteriormente."
    />
  );
}

