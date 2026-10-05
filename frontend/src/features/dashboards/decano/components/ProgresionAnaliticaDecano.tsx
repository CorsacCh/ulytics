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

type LimitePeriodo = 'todos' | number;
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
}

const INDICADORES_MATRICULA: Indicador[] = [
  { titulo: 'Matrícula total', llave: 'matricula_total' },
  { titulo: 'Matrícula de mujeres', llave: 'matricula_mujeres' },
  { titulo: '% Mujeres sobre matrícula total', llave: 'porcentaje_mujeres', tipo: 'porcentaje' },
];

// Son cantidades entregadas por el Excel. No se interpretan como tasas ni se
// dividen por vacantes, porque ese denominador no está disponible actualmente.
const INDICADORES_INGRESOS: Indicador[] = [
  { titulo: 'Ingresos SUA', llave: 'ingresos_sua' },
  { titulo: 'Ingresos PACE', llave: 'ingresos_pace' },
  { titulo: 'Ingresos especiales (RAE)', llave: 'ingresos_especiales' },
  { titulo: 'Ingresos totales', llave: 'ingresos_totales' },
];

const INDICADORES_RETENCION: Indicador[] = [
  { titulo: 'Retención de 1er año', llave: 'retencion_a1', tipo: 'porcentaje' },
  { titulo: 'Retención de 2do año', llave: 'retencion_a2', tipo: 'porcentaje' },
  { titulo: 'Retención de 3er año', llave: 'retencion_a3', tipo: 'porcentaje' },
  { titulo: 'Retención de 4to año', llave: 'retencion_a4', tipo: 'porcentaje' },
  { titulo: 'Retención total', llave: 'retencion_total', tipo: 'porcentaje' },
];

const INDICADORES_TITULACION: Indicador[] = [
  { titulo: 'Tasa de titulación total (TTT)', llave: 'tasa_titulacion_total', tipo: 'porcentaje' },
  { titulo: 'Tasa de titulación oportuna (TTO)', llave: 'tasa_titulacion_oportuna', tipo: 'porcentaje' },
  { titulo: 'Tasa de titulación efectiva (TTE)', llave: 'tasa_titulacion_efectiva', tipo: 'porcentaje' },
  { titulo: 'Duración real (semestres)', llave: 'duracion_real_semestres', tipo: 'decimal' },
];

const formateadorCantidad = new Intl.NumberFormat('es-CL', {
  maximumFractionDigits: 0,
});
const formateadorPorcentaje = new Intl.NumberFormat('es-CL', {
  maximumFractionDigits: 0,
});
const formateadorDuracion = new Intl.NumberFormat('es-CL', {
  maximumFractionDigits: 1,
});

function formatearValor(valor: number | null, tipo: TipoValor = 'cantidad') {
  if (valor === null || valor === undefined) {
    return <span className="text-slate-400">-</span>;
  }

  if (tipo === 'porcentaje') return `${formateadorPorcentaje.format(valor)}%`;
  if (tipo === 'decimal') return formateadorDuracion.format(valor);
  return formateadorCantidad.format(valor);
}

function obtenerPeriodos(filas: FilaPeriodo[]) {
  return [...new Set(filas.map((fila) => fila.periodo))].sort((a, b) => a - b);
}

function TablaPeriodos({
  titulo,
  descripcion,
  indicadores,
  filas,
  mensajeVacio,
}: TablaPeriodosProps) {
  const periodos = obtenerPeriodos(filas);

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 py-4">
        <h3 className="text-lg font-bold text-slate-800">{titulo}</h3>
        <p className="mt-0.5 text-xs text-slate-500">{descripcion}</p>
      </div>

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
    </section>
  );
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
  const [periodoDesde, setPeriodoDesde] = useState<LimitePeriodo>('todos');
  const [periodoHasta, setPeriodoHasta] = useState<LimitePeriodo>('todos');
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
        setPeriodoDesde('todos');
        setPeriodoHasta('todos');

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

  const periodosDisponibles = useMemo(() => [
    ...new Set([
      ...filasMatricula.map((fila) => fila.periodo),
      ...filasIngreso.map((fila) => fila.periodo),
      ...filasProgresion.map((fila) => fila.periodo),
    ]),
  ].sort((a, b) => a - b), [filasIngreso, filasMatricula, filasProgresion]);

  const filtrarPeriodo = (filas: FilaPeriodo[]) => filas.filter((fila) => (
    (periodoDesde === 'todos' || fila.periodo >= periodoDesde)
    && (periodoHasta === 'todos' || fila.periodo <= periodoHasta)
  ));

  const cambiarPeriodoDesde = (valor: string) => {
    const nuevoDesde = valor === 'todos' ? 'todos' : Number(valor);
    setPeriodoDesde(nuevoDesde);

    if (
      nuevoDesde !== 'todos'
      && periodoHasta !== 'todos'
      && nuevoDesde > periodoHasta
    ) {
      setPeriodoHasta(nuevoDesde);
    }
  };

  const cambiarPeriodoHasta = (valor: string) => {
    const nuevoHasta = valor === 'todos' ? 'todos' : Number(valor);
    setPeriodoHasta(nuevoHasta);

    if (
      nuevoHasta !== 'todos'
      && periodoDesde !== 'todos'
      && nuevoHasta < periodoDesde
    ) {
      setPeriodoDesde(nuevoHasta);
    }
  };

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

        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-[minmax(280px,1fr)_180px_180px]">
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

          <label className="text-sm font-semibold text-slate-700">
            Desde
            <select
              value={periodoDesde}
              onChange={(event) => cambiarPeriodoDesde(event.target.value)}
              disabled={cargandoDatos || periodosDisponibles.length === 0}
              className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm font-semibold text-[#0A192F] outline-none focus:border-[#FFB800] focus:ring-2 focus:ring-[#FFB800]/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="todos">Primer período</option>
              {periodosDisponibles.map((anio) => (
                <option key={anio} value={anio}>{anio}</option>
              ))}
            </select>
          </label>

          <label className="text-sm font-semibold text-slate-700">
            Hasta
            <select
              value={periodoHasta}
              onChange={(event) => cambiarPeriodoHasta(event.target.value)}
              disabled={cargandoDatos || periodosDisponibles.length === 0}
              className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm font-semibold text-[#0A192F] outline-none focus:border-[#FFB800] focus:ring-2 focus:ring-[#FFB800]/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="todos">Último período</option>
              {periodosDisponibles.map((anio) => (
                <option key={anio} value={anio}>{anio}</option>
              ))}
            </select>
          </label>
        </div>
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
                filas={filtrarPeriodo(filasMatricula)}
                mensajeVacio="No hay datos de matrícula para el período seleccionado."
              />

              <TablaPeriodos
                titulo="Ingresos por vía de admisión"
                descripcion="Cantidades informadas por SUA, PACE, ingreso especial RAE e ingresos totales; no corresponden a tasas de ocupación."
                indicadores={INDICADORES_INGRESOS}
                filas={filtrarPeriodo(filasIngreso)}
                mensajeVacio="No hay cantidades de ingreso para el período seleccionado."
              />

              <TablaPeriodos
                titulo="Retención por cohorte"
                descripcion="Tasas informadas para cada cohorte; los valores faltantes se muestran con un guion."
                indicadores={INDICADORES_RETENCION}
                filas={filtrarPeriodo(filasProgresion)}
                mensajeVacio="No hay datos de retención para la cohorte seleccionada."
              />

              <TablaPeriodos
                titulo="Titulación y duración real"
                descripcion="Valores TTT, TTO, TTE y duración real proporcionados en la carga académica."
                indicadores={INDICADORES_TITULACION}
                filas={filtrarPeriodo(filasProgresion)}
                mensajeVacio="No hay datos de titulación para la cohorte seleccionada."
              />
            </>
          )}
        </section>
      )}
    </div>
  );
}
