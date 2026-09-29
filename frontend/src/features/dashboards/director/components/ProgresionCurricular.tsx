import { useEffect, useState } from 'react';
import { ApiError, apiRequest } from '../../../auth/api';
import { useAuth } from '../../../auth/AuthContext';

// Respuesta de GET /api/reporteria/:car_codigo/curricular
interface FilaEficiencia {
  anio: number;
  total_alumnos_regulares: number | null;
  nivel_baja: number | null;
  nivel_media: number | null;
  nivel_alta: number | null;
  nivel_eficiente: number | null;
}

interface FilaTitulacion {
  anio: number;
  bachilleratos: number | null;
  licenciaturas_asig_pendientes: number | null;
  licenciaturas: number | null;
  titulados: number | null;
}

interface FilaCritica {
  asig_codigo: string;
  semestre: number | null;
  anio: number;
  tasa_reprobacion: number | null;
}

interface RespuestaCurricular {
  carrera: string;
  eficiencia: FilaEficiencia[];
  titulacion: FilaTitulacion[];
  criticas: FilaCritica[];
}

// Un indicador asocia el título visible de la fila/columna con la columna del
// endpoint que se debe leer.
interface Indicador {
  titulo: string;
  llave: string;
}

// Dataset ya despivotado: un valor por indicador para cada periodo (año).
interface FilaPeriodo {
  periodo: number;
  valores: Record<string, number | null>;
}

// Una asignatura-semestre con su tasa de reprobación por año.
interface FilaAsignaturaCritica {
  codigo: string;
  semestre: number | null;
  valores: Record<number, number | null>;
}

interface TablaIndicadoresProps {
  titulo: string;
  descripcion: string;
  cabeceraIndicador: string;
  indicadores: Indicador[];
  filas: FilaPeriodo[];
}

interface TablaAvanceProps {
  titulo: string;
  descripcion: string;
  columnas: Indicador[];
  filas: FilaPeriodo[];
}

interface TablaCriticasProps {
  titulo: string;
  descripcion: string;
  filas: FilaAsignaturaCritica[];
  anios: number[];
  mensajeVacio?: string;
}

// Las columnas nivel_* son conteos de estudiantes, no porcentajes: se muestran tal cual.
const INDICADORES_EFICIENCIA: Indicador[] = [
  { titulo: 'Nº Alumnos regulares', llave: 'total_alumnos_regulares' },
  { titulo: 'Baja (entre 0<60%)', llave: 'nivel_baja' },
  { titulo: 'Media (entre 61 y <80%)', llave: 'nivel_media' },
  { titulo: 'Alta (entre 80 <100%)', llave: 'nivel_alta' },
  { titulo: 'Eficiente =100%', llave: 'nivel_eficiente' },
];

const COLUMNAS_AVANCE: Indicador[] = [
  { titulo: 'Bachillerato', llave: 'bachilleratos' },
  {
    titulo: 'Licenciatura con asignaturas pendientes de Bachillerato',
    llave: 'licenciaturas_asig_pendientes',
  },
  { titulo: 'Licenciatura', llave: 'licenciaturas' },
  { titulo: 'Título', llave: 'titulados' },
];

const SIN_DATOS = 'Todavía no hay datos cargados para esta carrera.';

function describirError(error: unknown): string {
  if (error instanceof ApiError && error.status === 404) {
    return 'La carrera de la sesión activa no tiene datos cargados en el sistema.';
  }
  if (error instanceof Error) return error.message;
  return 'No fue posible cargar los indicadores de progresión curricular.';
}

// Los años se derivan del propio dataset: si la carga no trae un año, no aparece la columna.
function obtenerAnios(anios: number[]): number[] {
  return [...new Set(anios)].sort((a, b) => a - b);
}

// El endpoint devuelve una fila por asignatura y año; la tabla necesita una fila
// por asignatura-semestre, así que agrupamos conservando el orden de la consulta.
function agruparAsignaturasCriticas(criticas: FilaCritica[]): FilaAsignaturaCritica[] {
  const agrupadas = new Map<string, FilaAsignaturaCritica>();

  criticas.forEach((critica) => {
    const clave = `${critica.asig_codigo}-${critica.semestre ?? 'sin-semestre'}`;
    const fila = agrupadas.get(clave) ?? {
      codigo: critica.asig_codigo,
      semestre: critica.semestre,
      valores: {},
    };

    fila.valores[critica.anio] = critica.tasa_reprobacion;
    agrupadas.set(clave, fila);
  });

  return [...agrupadas.values()];
}

function Celda({ valor, sufijo = '' }: { valor: number | null; sufijo?: string }) {
  if (valor === null || valor === undefined) {
    return <span className="text-slate-400">-</span>;
  }

  return <>{`${valor}${sufijo}`}</>;
}

// Indicadores por fila y años por columna (tabla de eficiencia curricular).
function TablaIndicadores({
  titulo,
  descripcion,
  cabeceraIndicador,
  indicadores,
  filas,
}: TablaIndicadoresProps) {
  const anios = obtenerAnios(filas.map((fila) => fila.periodo));

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-slate-100 px-6 py-4">
        <h3 className="font-bold text-slate-800 text-lg">{titulo}</h3>
        <p className="text-xs text-slate-500 mt-0.5">{descripcion}</p>
      </div>

      {anios.length === 0 ? (
        <div className="px-6 py-8 text-sm text-slate-500">{SIN_DATOS}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-[#FFF9E6]">
                <th className="py-3 px-6 font-semibold text-slate-700 border-b border-slate-200">
                  {cabeceraIndicador}
                </th>
                {anios.map((anio) => (
                  <th
                    key={anio}
                    className="py-3 px-6 text-center font-semibold text-slate-700 border-b border-slate-200"
                  >
                    {anio}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {indicadores.map((indicador) => (
                <tr key={indicador.llave} className="hover:bg-slate-50/60">
                  <td className="py-3.5 px-6 font-medium text-slate-800">{indicador.titulo}</td>
                  {anios.map((anio) => (
                    <td key={anio} className="py-3.5 px-6 text-center">
                      <Celda
                        valor={
                          filas.find((fila) => fila.periodo === anio)?.valores[indicador.llave] ??
                          null
                        }
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Años por fila y estados de avance por columna (tabla de titulación por año).
function TablaAvance({ titulo, descripcion, columnas, filas }: TablaAvanceProps) {
  const anios = obtenerAnios(filas.map((fila) => fila.periodo));

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-slate-100 px-6 py-4">
        <h3 className="font-bold text-slate-800 text-lg">{titulo}</h3>
        <p className="text-xs text-slate-500 mt-0.5">{descripcion}</p>
      </div>

      {anios.length === 0 ? (
        <div className="px-6 py-8 text-sm text-slate-500">{SIN_DATOS}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-[#FFF9E6]">
                <th className="py-3 px-6 font-semibold text-slate-700 border-b border-slate-200">
                  Año
                </th>
                {columnas.map((columna) => (
                  <th
                    key={columna.llave}
                    className="py-3 px-6 text-center font-semibold text-slate-700 border-b border-slate-200"
                  >
                    {columna.titulo}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {anios.map((anio) => (
                <tr key={anio} className="hover:bg-slate-50/60">
                  <td className="py-3.5 px-6 font-bold text-slate-900">{anio}</td>
                  {columnas.map((columna) => (
                    <td key={columna.llave} className="py-3.5 px-6 text-center">
                      <Celda
                        valor={
                          filas.find((fila) => fila.periodo === anio)?.valores[columna.llave] ?? null
                        }
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Una fila por asignatura-semestre con la tasa de reprobación de cada año.
function TablaAsignaturasCriticas({
  titulo,
  descripcion,
  filas,
  anios,
  mensajeVacio = SIN_DATOS,
}: TablaCriticasProps) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-slate-100 px-6 py-4">
        <h3 className="font-bold text-slate-800 text-lg">{titulo}</h3>
        <p className="text-xs text-slate-500 mt-0.5">{descripcion}</p>
      </div>

      {filas.length === 0 || anios.length === 0 ? (
        <div className="px-6 py-8 text-sm text-slate-500">{mensajeVacio}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-[#FFF9E6]">
                <th className="py-3 px-6 font-semibold text-slate-700 border-b border-slate-200">
                  Códigos asignaturas críticas
                </th>
                <th className="py-3 px-6 text-center font-semibold text-slate-700 border-b border-slate-200">
                  Semestre
                </th>
                {anios.map((anio) => (
                  <th
                    key={anio}
                    className="py-3 px-6 text-center font-semibold text-slate-700 border-b border-slate-200"
                  >
                    {anio}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {filas.map((fila) => (
                <tr
                  key={`${fila.codigo}-${fila.semestre ?? 'sin-semestre'}`}
                  className="hover:bg-slate-50/60"
                >
                  <td className="py-3.5 px-6 font-bold text-slate-900">{fila.codigo}</td>
                  <td className="py-3.5 px-6 text-center">
                    <Celda valor={fila.semestre} />
                  </td>
                  {anios.map((anio) => (
                    <td key={anio} className="py-3.5 px-6 text-center">
                      <Celda valor={fila.valores[anio] ?? null} sufijo="%" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function ProgresionCurricular() {
  const { user } = useAuth();

  // El director solo puede ver la carrera de su ámbito (tipo PROGRAMA),
  // cuyo código es el mismo car_codigo de la tabla Carrera.
  const carCodigo = user?.ambito?.tipo === 'PROGRAMA' ? user.ambito.codigo : null;

  const [eficiencia, setEficiencia] = useState<FilaEficiencia[]>([]);
  const [titulacion, setTitulacion] = useState<FilaTitulacion[]>([]);
  const [criticas, setCriticas] = useState<FilaCritica[]>([]);
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

        // apiRequest resuelve la URL base (VITE_BACKEND_URL) y envía la cookie de sesión;
        // las tres series comparten endpoint porque comparten la dimensión año.
        const respuesta = await apiRequest<RespuestaCurricular>(
          `/api/reporteria/${encodeURIComponent(carCodigo)}/curricular`
        );

        if (!activo) return;

        setEficiencia(respuesta.eficiencia ?? []);
        setTitulacion(respuesta.titulacion ?? []);
        setCriticas(respuesta.criticas ?? []);
        setCarrera(respuesta.carrera ?? '');
      } catch (err) {
        if (!activo) return;

        setEficiencia([]);
        setTitulacion([]);
        setCriticas([]);
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

  // Despivotamos la eficiencia curricular: el año de la medición es el periodo.
  const filasEficiencia: FilaPeriodo[] = eficiencia.map((fila) => ({
    periodo: fila.anio,
    valores: {
      total_alumnos_regulares: fila.total_alumnos_regulares,
      nivel_baja: fila.nivel_baja,
      nivel_media: fila.nivel_media,
      nivel_alta: fila.nivel_alta,
      nivel_eficiente: fila.nivel_eficiente,
    },
  }));

  // Despivotamos la titulación por año hacia las columnas fijas de la tabla.
  const filasAvance: FilaPeriodo[] = titulacion.map((fila) => ({
    periodo: fila.anio,
    valores: {
      bachilleratos: fila.bachilleratos,
      licenciaturas_asig_pendientes: fila.licenciaturas_asig_pendientes,
      licenciaturas: fila.licenciaturas,
      titulados: fila.titulados,
    },
  }));

  // Las asignaturas críticas llegan una fila por año y se agrupan por asignatura-semestre.
  const filasCriticas = agruparAsignaturasCriticas(criticas);
  const aniosCriticas = obtenerAnios(criticas.map((critica) => critica.anio));

  return (
    <div className="mx-auto max-w-[1440px] space-y-10 p-5 sm:p-8 lg:p-10 bg-[#F8FAFC] min-h-screen">
      {/* HEADER INSTITUCIONAL */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold tracking-widest text-slate-500 uppercase mb-2">
            {carrera || 'PROGRESIÓN CURRICULAR'}
          </p>
          <h1 className="text-3xl font-bold text-[#0A192F]">Datos de Progresión Curricular</h1>
          <p className="mt-1 text-sm text-slate-500 max-w-2xl">
            Distribución de los tipos de estado de avance de estudiantes con condición académica de
            Alumno Regular, grados otorgados y asignaturas críticas, según los datos cargados para
            la carrera.
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
            Cargando indicadores curriculares...
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
          {/* TABLA 1: Tasa de eficiencia curricular por cohorte */}
          <TablaIndicadores
            titulo="Tasa de eficiencia curricular por cohorte"
            descripcion="Número de estudiantes registrados cada año según su estado de avance curricular."
            cabeceraIndicador="Indicador / Año"
            indicadores={INDICADORES_EFICIENCIA}
            filas={filasEficiencia}
          />

          {/* TABLA 2: Estado de avance por ciclo formativo */}
          <TablaAvance
            titulo="Estado de avance por ciclo formativo"
            descripcion="Número de estudiantes por año según el ciclo formativo en que se encuentran."
            columnas={COLUMNAS_AVANCE}
            filas={filasAvance}
          />

          {/* TABLA 3: Asignaturas críticas */}
          <TablaAsignaturasCriticas
            titulo="Asignaturas críticas"
            descripcion="Se consideran críticas las asignaturas con reprobación mayor o igual a 30% en al menos 3 de los últimos 5 años, afectando la permanencia, titulación y tiempos de titulación."
            filas={filasCriticas}
            anios={aniosCriticas}
            mensajeVacio="Todavía no hay asignaturas críticas cargadas para esta carrera."
          />
        </>
      )}
    </div>
  );
}
