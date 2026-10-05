import { useEffect, useState } from 'react';
import { ApiError, apiRequest } from '../../../auth/api';
import { useAuth } from '../../../auth/AuthContext';
import { EvolucionRetencion } from './EvolucionRetencion';
import {
  INDICADORES_INGRESOS,
  INDICADORES_MATRICULA,
  INDICADORES_RETENCION,
  INDICADORES_TITULACION,
  type FilaPeriodo,
  type Indicador,
} from '../data/indicadoresProgresion';

export interface TablaPeriodosProps {
  titulo: string;
  descripcion: string;
  indicadores: Indicador[];
  filas: FilaPeriodo[];
}

// Respuesta de GET /api/reporteria/:car_codigo/matricula
interface FilaIngreso {
  cohorte: number;
  ingresos_sua: number | null;
  ingresos_pace: number | null;
  ingresos_especiales: number | null;
  ingresos_totales: number | null;
}

interface FilaMatricula {
  anio_medicion: number;
  matricula_total: number | null;
  matricula_mujeres: number | null;
  porcentaje_mujeres: number | null;
}

// Respuesta de GET /api/reporteria/:car_codigo/progresion
interface FilaProgresion {
  cohorte: number;
  retencion_a1: number | null;
  retencion_a2: number | null;
  retencion_a3: number | null;
  retencion_a4: number | null;
  retencion_total: number | null;
  tasa_titulacion_total: number | null;
  tasa_titulacion_oportuna: number | null;
  tasa_titulacion_efectiva: number | null;
  duracion_real_semestres: number | null;
}

interface RespuestaMatricula {
  carrera: string;
  ingresos_cohorte: FilaIngreso[];
  matricula_anual: FilaMatricula[];
}

interface RespuestaProgresion {
  carrera: string;
  datos: FilaProgresion[];
}


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

const formateadorPorcentaje = new Intl.NumberFormat('es-CL', {
  maximumFractionDigits: 0,
});

export function TablaPeriodos({ titulo, descripcion, indicadores, filas }: TablaPeriodosProps) {
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
                          indicador.tipo === 'porcentaje'
                            ? `${formateadorPorcentaje.format(valor)}%`
                            : valor
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

  const [ingresoData, setIngresoData] = useState<FilaIngreso[]>([]);
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

        setIngresoData(respuestaMatricula.ingresos_cohorte ?? []);
        setMatriculaData(respuestaMatricula.matricula_anual ?? []);
        setProgresionData(respuestaProgresion.datos ?? []);
        setCarrera(respuestaMatricula.carrera || respuestaProgresion.carrera || '');
      } catch (err) {
        if (!activo) return;
        setIngresoData([]);
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

  const filasIngreso: FilaPeriodo[] = ingresoData.map((fila) => ({
    periodo: fila.cohorte,
    valores: {
      ingresos_totales: fila.ingresos_totales,
      ingresos_sua: fila.ingresos_sua,
      ingresos_pace: fila.ingresos_pace,
      ingresos_especiales: fila.ingresos_especiales,
    },
  }));

  // La matrícula se organiza por año de medición y no por cohorte de ingreso.
  const filasMatricula: FilaPeriodo[] = matriculaData.map((fila) => ({
    periodo: fila.anio_medicion,
    valores: {
      matricula_total: fila.matricula_total,
      matricula_mujeres: fila.matricula_mujeres,
      porcentaje_mujeres: fila.porcentaje_mujeres,
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
      tasa_titulacion_total: fila.tasa_titulacion_total,
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
        <div className="space-y-10">
          {/* GRÁFICO: Evolución longitudinal de retención por cohorte */}
          <section id="progresion-analitica-evolucion" className="grid grid-cols-1 gap-6">
            <EvolucionRetencion />
          </section>

          {/* TABLAS: ingresos por cohorte y matrícula por año de medición */}
          <div id="progresion-analitica-matricula">
            <TablaPeriodos
              titulo="Ingresos por cohorte"
              descripcion="Cantidades informadas por vía de admisión para cada cohorte de ingreso."
              indicadores={INDICADORES_INGRESOS}
              filas={filasIngreso}
            />
          </div>

          <div id="progresion-analitica-matricula-anual">
            <TablaPeriodos
              titulo="Matrícula anual"
              descripcion="Matrícula total y participación de mujeres para cada año de medición."
              indicadores={INDICADORES_MATRICULA}
              filas={filasMatricula}
            />
          </div>

          {/* TABLA: Cohortes / Tasas de retención */}
          <div id="progresion-analitica-retencion">
            <TablaPeriodos
              titulo="Cohortes / Tasas de retención"
              descripcion="Porcentaje de estudiantes que permanecen en la carrera según año de ingreso."
              indicadores={INDICADORES_RETENCION}
              filas={filasProgresion}
            />
          </div>

          {/* TABLA: Titulación y tiempo de egreso */}
          <div id="progresion-analitica-titulacion">
            <TablaPeriodos
              titulo="Titulación y tiempo de egreso"
              descripcion="Tasas de titulación y duración real registradas para cada cohorte."
              indicadores={INDICADORES_TITULACION}
              filas={filasProgresion}
            />
          </div>
        </div>
      )}
    </div>
  );
}

