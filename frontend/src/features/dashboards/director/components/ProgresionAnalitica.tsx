import { useEffect, useState } from 'react';
import { ApiError, apiRequest } from '../../../auth/api';
import { useAuth } from '../../../auth/AuthContext';
import { EvolucionRetencion } from './EvolucionRetencion';

// Respuesta de GET /api/reporteria/:car_codigo/matricula
interface FilaMatricula {
  anio: number;
  ingresos_sua: number | null;
  ingresos_pace: number | null;
  ingresos_rae: number | null;
  ingresos_totales: number | null;
  matricula_total: number | null;
  matricula_mujeres: number | null;
}

// Respuesta de GET /api/reporteria/:car_codigo/progresion
interface FilaProgresion {
  cohorte: number;
  retencion_a1: number | null;
  retencion_a2: number | null;
  retencion_a3: number | null;
  retencion_a4: number | null;
  retencion_total: number | null;
  tasa_titulacion_temprana: number | null;
  tasa_titulacion_oportuna: number | null;
  tasa_titulacion_efectiva: number | null;
  duracion_real_semestres: number | null;
}

interface RespuestaMatricula {
  carrera: string;
  datos: FilaMatricula[];
}

interface RespuestaProgresion {
  carrera: string;
  datos: FilaProgresion[];
}

// Un indicador es una fila de la tabla: el título visible y la columna del
// endpoint que se lee para cada periodo (año o cohorte).
interface Indicador {
  titulo: string;
  llave: string;
  tipo?: 'numero' | 'porcentaje';
}

// Dataset ya despivotado: un valor por indicador para cada periodo.
interface FilaPeriodo {
  periodo: number;
  valores: Record<string, number | null>;
}

interface TablaPeriodosProps {
  titulo: string;
  descripcion: string;
  indicadores: Indicador[];
  filas: FilaPeriodo[];
}

const INDICADORES_MATRICULA: Indicador[] = [
  { titulo: 'Matrícula nueva según cohorte', llave: 'ingresos_totales' },
  { titulo: 'Matrícula admisión regular (SUA/PAES)', llave: 'ingresos_sua' },
  { titulo: 'Matrícula admisión especial PACE', llave: 'ingresos_pace' },
  { titulo: 'Matrícula ingreso Especial RAE', llave: 'ingresos_rae' },
  { titulo: 'Matrícula Total', llave: 'matricula_total' },
  { titulo: '% Mujeres (matrícula total)', llave: 'pct_mujeres', tipo: 'porcentaje' },
];

const INDICADORES_RETENCION: Indicador[] = [
  { titulo: '1er año por cohorte', llave: 'retencion_a1', tipo: 'porcentaje' },
  { titulo: '2do año por cohorte', llave: 'retencion_a2', tipo: 'porcentaje' },
  { titulo: '3er año por cohorte', llave: 'retencion_a3', tipo: 'porcentaje' },
  { titulo: '4to año por cohorte', llave: 'retencion_a4', tipo: 'porcentaje' },
  { titulo: 'Retención total', llave: 'retencion_total', tipo: 'porcentaje' },
];

const INDICADORES_TITULACION: Indicador[] = [
  {
    titulo: 'Tasa de titulación temprana (TTT)',
    llave: 'tasa_titulacion_temprana',
    tipo: 'porcentaje',
  },
  {
    titulo: 'Tasa de titulación oportuna (TTO)',
    llave: 'tasa_titulacion_oportuna',
    tipo: 'porcentaje',
  },
  {
    titulo: 'Tasa de titulación efectiva (TTE)',
    llave: 'tasa_titulacion_efectiva',
    tipo: 'porcentaje',
  },
  { titulo: 'Tiempo promedio (semestres)', llave: 'duracion_real_semestres' },
];

function describirError(error: unknown): string {
  if (error instanceof ApiError && error.status === 404) {
    return 'La carrera de la sesión activa no tiene datos cargados en el sistema.';
  }
  if (error instanceof Error) return error.message;
  return 'No fue posible cargar los indicadores de progresión analítica.';
}

// Los periodos se derivan del propio dataset: si el Excel no trae un año o una
// cohorte, simplemente no aparece la columna.
function obtenerPeriodos(filas: FilaPeriodo[]): number[] {
  return [...new Set(filas.map((fila) => fila.periodo))].sort((a, b) => a - b);
}

function TablaPeriodos({ titulo, descripcion, indicadores, filas }: TablaPeriodosProps) {
  const periodos = obtenerPeriodos(filas);

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-slate-100 px-6 py-4">
        <h3 className="font-bold text-slate-800 text-lg">{titulo}</h3>
        <p className="text-xs text-slate-500 mt-0.5">{descripcion}</p>
      </div>

      {periodos.length === 0 ? (
        <div className="px-6 py-8 text-sm text-slate-500">
          Todavía no hay datos cargados para esta carrera.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-[#FFF9E6]">
                <th className="py-3 px-6 font-semibold text-slate-700 border-b border-slate-200">
                  Indicador
                </th>
                {periodos.map((periodo) => (
                  <th
                    key={periodo}
                    className="py-3 px-6 text-center font-semibold text-slate-700 border-b border-slate-200"
                  >
                    {periodo}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {indicadores.map((indicador) => (
                <tr key={indicador.llave} className="hover:bg-slate-50/60">
                  <td className="py-3.5 px-6 font-medium text-slate-800">{indicador.titulo}</td>
                  {periodos.map((periodo) => {
                    const valor =
                      filas.find((fila) => fila.periodo === periodo)?.valores[indicador.llave] ?? null;

                    return (
                      <td key={periodo} className="py-3.5 px-6 text-center">
                        {valor === null ? (
                          <span className="text-slate-400">-</span>
                        ) : (
                          `${valor}${indicador.tipo === 'porcentaje' ? '%' : ''}`
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function ProgresionAnalitica() {
  const { user } = useAuth();

  // El director solo puede ver la carrera de su ámbito (tipo PROGRAMA),
  // cuyo código es el mismo car_codigo de la tabla Carrera.
  const carCodigo = user?.ambito?.tipo === 'PROGRAMA' ? user.ambito.codigo : null;

  const [matriculaData, setMatriculaData] = useState<FilaMatricula[]>([]);
  const [progresionData, setProgresionData] = useState<FilaProgresion[]>([]);
  const [carrera, setCarrera] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!carCodigo) {
      setLoading(false);
      setError('No se pudo identificar la carrera de la sesión activa.');
      return;
    }

    let activo = true;

    const obtenerDatosDeReporteria = async () => {
      try {
        setLoading(true);
        setError(null);

        // apiRequest resuelve la URL base (VITE_BACKEND_URL) y envía la cookie de sesión.
        // Ambas series vienen del mismo controlador, por eso se piden en paralelo.
        const [respuestaMatricula, respuestaProgresion] = await Promise.all([
          apiRequest<RespuestaMatricula>(
            `/api/reporteria/${encodeURIComponent(carCodigo)}/matricula`
          ),
          apiRequest<RespuestaProgresion>(
            `/api/reporteria/${encodeURIComponent(carCodigo)}/progresion`
          ),
        ]);

        if (!activo) return;

        setMatriculaData(respuestaMatricula.datos ?? []);
        setProgresionData(respuestaProgresion.datos ?? []);
        setCarrera(respuestaMatricula.carrera || respuestaProgresion.carrera || '');
      } catch (err) {
        if (!activo) return;
        setMatriculaData([]);
        setProgresionData([]);
        setError(describirError(err));
      } finally {
        if (activo) setLoading(false);
      }
    };

    obtenerDatosDeReporteria();

    return () => {
      activo = false;
    };
  }, [carCodigo]);

  // Despivotamos la respuesta de admisión/matrícula al formato de la tabla.
  const filasMatricula: FilaPeriodo[] = matriculaData.map((fila) => ({
    periodo: fila.anio,
    valores: {
      ingresos_totales: fila.ingresos_totales,
      ingresos_sua: fila.ingresos_sua,
      ingresos_pace: fila.ingresos_pace,
      ingresos_rae: fila.ingresos_rae,
      matricula_total: fila.matricula_total,
      pct_mujeres:
        fila.matricula_total && fila.matricula_total > 0
          ? Math.round(((fila.matricula_mujeres ?? 0) / fila.matricula_total) * 100)
          : null,
    },
  }));

  // Despivotamos la respuesta de retención/titulación: la cohorte es el periodo.
  const filasProgresion: FilaPeriodo[] = progresionData.map((fila) => ({
    periodo: fila.cohorte,
    valores: {
      retencion_a1: fila.retencion_a1,
      retencion_a2: fila.retencion_a2,
      retencion_a3: fila.retencion_a3,
      retencion_a4: fila.retencion_a4,
      retencion_total: fila.retencion_total,
      tasa_titulacion_temprana: fila.tasa_titulacion_temprana,
      tasa_titulacion_oportuna: fila.tasa_titulacion_oportuna,
      tasa_titulacion_efectiva: fila.tasa_titulacion_efectiva,
      duracion_real_semestres: fila.duracion_real_semestres,
    },
  }));

  return (
    <div className="mx-auto max-w-[1440px] space-y-10 p-5 sm:p-8 lg:p-10 bg-[#F8FAFC] min-h-screen">
      {/* HEADER INSTITUCIONAL */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold tracking-widest text-slate-500 uppercase mb-2">
            {carrera || 'PROGRESIÓN ANALÍTICA'}
          </p>
          <h1 className="text-3xl font-bold text-[#0A192F]">Datos de Progresión Analítica</h1>
          <p className="mt-1 text-sm text-slate-500 max-w-2xl">
            Matrícula, admisión y retención organizadas por año y cohorte, a partir de los datos
            cargados para la carrera.
          </p>
        </div>
      </div>

      {loading && (
        <div
          className="flex min-h-[200px] items-center justify-center rounded-xl border border-slate-200/80 bg-white shadow-sm"
          role="status"
          aria-live="polite"
        >
          <span className="text-sm font-medium text-slate-500 animate-pulse">
            Cargando indicadores históricos...
          </span>
        </div>
      )}

      {!loading && error && (
        <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-slate-200/80 bg-white shadow-sm">
          <span className="text-sm font-medium text-red-600">{error}</span>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* GRÁFICO: Evolución longitudinal de retención por cohorte */}
          <section className="grid grid-cols-1 gap-6">
            <EvolucionRetencion />
          </section>

          {/* TABLA: Matrícula y admisión */}
          <TablaPeriodos
            titulo="Matrícula y admisión por cohorte"
            descripcion="Ingresos por vía de admisión y matrícula total registrada en cada año."
            indicadores={INDICADORES_MATRICULA}
            filas={filasMatricula}
          />

          {/* TABLA: Cohortes / Tasas de retención */}
          <TablaPeriodos
            titulo="Cohortes / Tasas de retención"
            descripcion="Porcentaje de estudiantes que permanecen en la carrera según año de ingreso."
            indicadores={INDICADORES_RETENCION}
            filas={filasProgresion}
          />

          {/* TABLA: Titulación y tiempo de egreso */}
          <TablaPeriodos
            titulo="Titulación y tiempo de egreso"
            descripcion="Tasas de titulación y duración real registradas para cada cohorte."
            indicadores={INDICADORES_TITULACION}
            filas={filasProgresion}
          />
        </>
      )}
    </div>
  );
}

