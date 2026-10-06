import { useEffect, useMemo, useState } from 'react';
import { Building2 } from 'lucide-react';

import { ApiError } from '../../../auth/api';
import { useAuth } from '../../../auth/AuthContext';
import {
  obtenerCarrerasDecanatura,
  obtenerMatriculaCarrera,
  obtenerProgresionCarrera,
  type CarreraDecanatura,
  type FilaIngreso,
  type FilaMatricula,
  type FilaProgresion,
} from '../api';

import { DataCardView } from '../../components/DataCardView';
import { RangoPeriodos } from '../../components/RangoPeriodos';
import { enRango, formatearDato, type RangoPeriodo } from '../../components/series';
import { GraficoIndicadoresDecano } from './GraficoIndicadoresDecano';
import { INDICADORES_MATRICULA, INDICADORES_INGRESOS, INDICADORES_RETENCION, INDICADORES_TITULACION } from '../indicadores';
type TipoValor = 'cantidad' | 'porcentaje' | 'decimal';

interface Indicador {
  titulo: string;
  llave: string;
  tipo?: TipoValor;
}

interface FilaPeriodo {
  periodo: number;
  valores: Record<string, number | null>;
}

interface TablaPeriodosProps {
  titulo: string;
  descripcion: string;
  indicadores: Indicador[];
  filas: FilaPeriodo[];
  mensajeVacio: string;
  eje?: string;
}


// Son cantidades entregadas por el Excel. No se interpretan como tasas ni se
// dividen por vacantes, porque ese denominador no está disponible actualmente.



const formatearValor = formatearDato;

function obtenerPeriodos(filas: FilaPeriodo[]) {
  return [...new Set(filas.map((fila) => fila.periodo))].sort((a, b) => a - b);
}

function TablaPeriodos({
  titulo,
  descripcion,
  indicadores,
  filas,
  mensajeVacio,
  eje = 'Cohorte',
}: TablaPeriodosProps) {
  const periodos = obtenerPeriodos(filas);

  return <DataCardView title={titulo} description={`${descripcion} · ${eje}`}
    chartComponent={<GraficoIndicadoresDecano filas={filas} indicadores={indicadores} eje={eje} />}
    tableComponent={<>
      {periodos.length === 0 ? (
        <div className="px-6 py-8 text-sm text-slate-500">{mensajeVacio}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="bg-[#FFF9E6]">
                <th className="border-b border-slate-200 px-6 py-3 font-semibold text-slate-700">
                  Indicador
                </th>
                {periodos.map((periodo) => (
                  <th
                    key={periodo}
                    className="border-b border-slate-200 px-6 py-3 text-center font-semibold text-slate-700"
                  >
                    {periodo}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {indicadores.map((indicador) => (
                <tr key={indicador.llave} className="hover:bg-slate-50/60">
                  <td className="px-6 py-3.5 font-medium text-slate-800">{indicador.titulo}</td>
                  {periodos.map((periodo) => {
                    const valor = filas.find((fila) => fila.periodo === periodo)
                      ?.valores[indicador.llave] ?? null;

                    return (
                      <td key={periodo} className="px-6 py-3.5 text-center tabular-nums">
                        {formatearValor(valor, indicador.tipo)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>} />;
}

function describirError(error: unknown, contexto: 'catalogo' | 'datos') {
  if (error instanceof ApiError) {
    if (error.status === 403) {
      return contexto === 'catalogo'
        ? 'La cuenta no tiene un ámbito de facultad válido para consultar carreras.'
        : 'La carrera seleccionada no pertenece al ámbito autorizado de esta cuenta.';
    }
    if (error.status === 404) return 'La carrera seleccionada no está disponible.';
    return error.message;
  }

  if (error instanceof Error) return error.message;
  return contexto === 'catalogo'
    ? 'No fue posible cargar las carreras de la facultad.'
    : 'No fue posible cargar los indicadores de la carrera.';
}

export function ProgresionAnaliticaDecano() {
  const { user } = useAuth();
  const [facultad, setFacultad] = useState(user?.ambito?.nombre ?? 'Facultad');
  const [carreras, setCarreras] = useState<CarreraDecanatura[]>([]);
  const [codigoCarrera, setCodigoCarrera] = useState('');
  const [ingresos, setIngresos] = useState<FilaIngreso[]>([]);
  const [matricula, setMatricula] = useState<FilaMatricula[]>([]);
  const [progresion, setProgresion] = useState<FilaProgresion[]>([]);
  const [rangoCohorte, setRangoCohorte] = useState<RangoPeriodo>(['todos', 'todos']);
  const [rangoAnio, setRangoAnio] = useState<RangoPeriodo>(['todos', 'todos']);
  const [cargandoCatalogo, setCargandoCatalogo] = useState(true);
  const [cargandoDatos, setCargandoDatos] = useState(false);
  const [errorCatalogo, setErrorCatalogo] = useState<string | null>(null);
  const [errorDatos, setErrorDatos] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;

    const cargarCarreras = async () => {
      try {
        setCargandoCatalogo(true);
        setErrorCatalogo(null);
        const respuesta = await obtenerCarrerasDecanatura();
        if (!activo) return;

        const opciones = respuesta.carreras ?? [];
        setFacultad(respuesta.facultad?.nombre || user?.ambito?.nombre || 'Facultad');
        setCarreras(opciones);
        setCodigoCarrera((actual) => {
          if (opciones.some((carrera) => carrera.car_codigo === actual)) return actual;
          return opciones[0]?.car_codigo ?? '';
        });
      } catch (error) {
        if (!activo) return;
        setCarreras([]);
        setCodigoCarrera('');
        setErrorCatalogo(describirError(error, 'catalogo'));
      } finally {
        if (activo) setCargandoCatalogo(false);
      }
    };

    void cargarCarreras();
    return () => { activo = false; };
  }, [user?.ambito?.nombre]);

  useEffect(() => {
    if (!codigoCarrera) {
      setIngresos([]);
      setMatricula([]);
      setProgresion([]);
      setCargandoDatos(false);
      return;
    }

    let activo = true;

    const cargarIndicadores = async () => {
      try {
        setCargandoDatos(true);
        setErrorDatos(null);
        setRangoCohorte(['todos', 'todos']);
        setRangoAnio(['todos', 'todos']);

        const [respuestaMatricula, respuestaProgresion] = await Promise.all([
          obtenerMatriculaCarrera(codigoCarrera),
          obtenerProgresionCarrera(codigoCarrera),
        ]);
        if (!activo) return;

        setIngresos(respuestaMatricula.ingresos_cohorte ?? []);
        setMatricula(respuestaMatricula.matricula_anual ?? []);
        setProgresion(respuestaProgresion.datos ?? []);
      } catch (error) {
        if (!activo) return;
        setIngresos([]);
        setMatricula([]);
        setProgresion([]);
        setErrorDatos(describirError(error, 'datos'));
      } finally {
        if (activo) setCargandoDatos(false);
      }
    };

    void cargarIndicadores();
    return () => { activo = false; };
  }, [codigoCarrera]);

  const carreraSeleccionada = carreras.find((carrera) => carrera.car_codigo === codigoCarrera);

  const filasIngreso = useMemo<FilaPeriodo[]>(() => ingresos.map((fila) => ({
    periodo: fila.cohorte,
    valores: {
      ingresos_sua: fila.ingresos_sua,
      ingresos_pace: fila.ingresos_pace,
      ingresos_especiales: fila.ingresos_especiales,
      ingresos_totales: fila.ingresos_totales,
    },
  })), [ingresos]);

  const filasMatricula = useMemo<FilaPeriodo[]>(() => matricula.map((fila) => ({
    periodo: fila.anio_medicion,
    valores: {
      matricula_total: fila.matricula_total,
      matricula_mujeres: fila.matricula_mujeres,
      porcentaje_mujeres: fila.porcentaje_mujeres,
    },
  })), [matricula]);

  const filasProgresion = useMemo<FilaPeriodo[]>(() => progresion.map((fila) => ({
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
  })), [progresion]);

  const cohortesDisponibles = obtenerPeriodos([...filasIngreso, ...filasProgresion]);
  const aniosDisponibles = obtenerPeriodos(filasMatricula);
  const filtrarCohorte = (filas: FilaPeriodo[]) => filas.filter((fila) => enRango(fila.periodo, rangoCohorte));

  const sinCarreras = !cargandoCatalogo && !errorCatalogo && carreras.length === 0;

  return (
    <div className="mx-auto min-h-screen max-w-[1440px] space-y-8 bg-[#F8FAFC] p-5 sm:p-8 lg:p-10">
      <header className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500">
          <Building2 className="size-4 text-[#FFB800]" />
          {facultad}
        </p>
        <h1 className="mt-2 text-3xl font-bold text-[#0A192F]">Progresión analítica</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
          Matrícula, vías de ingreso, retención y titulación de las carreras pertenecientes a la facultad.
        </p>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <label className="text-sm font-semibold text-slate-700">
            Carrera
            <select
              value={codigoCarrera}
              onChange={(event) => setCodigoCarrera(event.target.value)}
              disabled={cargandoCatalogo || carreras.length === 0}
              className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm font-semibold text-[#0A192F] outline-none focus:border-[#FFB800] focus:ring-2 focus:ring-[#FFB800]/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {cargandoCatalogo && <option value="">Cargando carreras…</option>}
              {!cargandoCatalogo && carreras.length === 0 && <option value="">Sin carreras disponibles</option>}
              {carreras.map((carrera) => (
                <option key={carrera.car_codigo} value={carrera.car_codigo}>
                  {carrera.nombre}{carrera.sede ? ` · ${carrera.sede}` : ''}
                </option>
              ))}
            </select>
          </label>

          <RangoPeriodos etiqueta="Cohorte" opciones={cohortesDisponibles} valor={rangoCohorte} onChange={setRangoCohorte} disabled={cargandoDatos} />
          <RangoPeriodos etiqueta="Año de medición" opciones={aniosDisponibles} valor={rangoAnio} onChange={setRangoAnio} disabled={cargandoDatos} />
        </div>
        <p className="mt-3 text-xs text-slate-500">Cohorte filtra ingresos, retención y titulación. Año de medición filtra matrícula; son independientes.</p>
      </header>

      {errorCatalogo && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
          {errorCatalogo}
        </div>
      )}

      {sinCarreras && (
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500">
          La facultad todavía no tiene carreras cargadas en el sistema.
        </div>
      )}

      {codigoCarrera && (
        <section className="space-y-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
              {carreraSeleccionada?.nombre ?? 'Carrera seleccionada'}
            </p>
            <h2 className="mt-1 text-2xl font-bold text-[#0A192F]">Indicadores históricos</h2>
          </div>

          {cargandoDatos && (
            <div
              role="status"
              aria-live="polite"
              className="flex min-h-[220px] items-center justify-center rounded-xl border border-slate-200/80 bg-white shadow-sm"
            >
              <span className="animate-pulse text-sm font-medium text-slate-500">
                Cargando indicadores de la carrera…
              </span>
            </div>
          )}

          {!cargandoDatos && errorDatos && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
              {errorDatos}
            </div>
          )}

          {!cargandoDatos && !errorDatos && (
            <>
              <TablaPeriodos
                titulo="Matrícula por período"
                descripcion="Cantidad total de estudiantes y participación de mujeres sobre la matrícula total."
                indicadores={INDICADORES_MATRICULA}
                eje="Año de medición"
                filas={filasMatricula.filter((fila) => enRango(fila.periodo, rangoAnio))}
                mensajeVacio="No hay datos de matrícula para el período seleccionado."
              />

              <TablaPeriodos
                titulo="Ingresos por vía de admisión"
                descripcion="Cantidades informadas por SUA, PACE, ingreso especial RAE e ingresos totales; no corresponden a tasas de ocupación."
                indicadores={INDICADORES_INGRESOS}
                filas={filtrarCohorte(filasIngreso)}
                mensajeVacio="No hay cantidades de ingreso para el período seleccionado."
              />

              <TablaPeriodos
                titulo="Retención por cohorte"
                descripcion="Tasas informadas para cada cohorte; los valores faltantes se muestran como Sin datos."
                indicadores={INDICADORES_RETENCION}
                filas={filtrarCohorte(filasProgresion)}
                mensajeVacio="No hay datos de retención para la cohorte seleccionada."
              />

              <TablaPeriodos
                titulo="Titulación y duración real"
                descripcion="Valores TTT, TTO, TTE y duración real proporcionados en la carga académica."
                indicadores={INDICADORES_TITULACION}
                filas={filtrarCohorte(filasProgresion)}
                mensajeVacio="No hay datos de titulación para la cohorte seleccionada."
              />
            </>
          )}
        </section>
      )}
    </div>
  );
}
