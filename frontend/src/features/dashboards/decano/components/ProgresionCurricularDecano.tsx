import { useEffect, useMemo, useState } from 'react';
import { Building2 } from 'lucide-react';

import { ApiError } from '../../../auth/api';
import { useAuth } from '../../../auth/AuthContext';
import {
  obtenerCarrerasDecanatura,
  obtenerCurricularCarrera,
  type CarreraDecanatura,
  type FilaAsignaturaInformada,
  type FilaAvanceCurricular,
  type FilaEficienciaCurricular,
} from '../api';

type LimitePeriodo = 'todos' | number;

interface Indicador {
  titulo: string;
  llave: string;
  tipo?: 'cantidad' | 'porcentaje';
}

interface FilaPeriodo {
  periodo: number;
  valores: Record<string, number | null>;
}

interface FilaAsignaturaAgrupada {
  codigo: string;
  semestre: number | null;
  valores: Record<number, number | null>;
}

interface TablaIndicadoresProps {
  titulo: string;
  descripcion: string;
  indicadores: Indicador[];
  filas: FilaPeriodo[];
  mensajeVacio: string;
}

interface TablaAvanceProps {
  titulo: string;
  descripcion: string;
  columnas: Indicador[];
  filas: FilaPeriodo[];
  mensajeVacio: string;
}

interface TablaAsignaturasProps {
  filas: FilaAsignaturaAgrupada[];
  anios: number[];
  mensajeVacio: string;
}

// Estos campos ya vienen como cantidades en el Excel y se muestran sin
// convertirlos en porcentajes ni volver a calcular sus tramos.
const INDICADORES_EFICIENCIA: Indicador[] = [
  { titulo: 'Nº de alumnos regulares', llave: 'total_alumnos_regulares' },
  { titulo: 'Baja (entre 0<60%)', llave: 'nivel_baja' },
  { titulo: 'Media (entre 61 y <80%)', llave: 'nivel_media' },
  { titulo: 'Alta (entre 80 <100%)', llave: 'nivel_alta' },
  { titulo: 'Eficiente =100%', llave: 'nivel_eficiente' },
];

// Las cinco categorías vienen como porcentajes excluyentes informados en el Excel.
const COLUMNAS_AVANCE: Indicador[] = [
  { titulo: 'Bachillerato', llave: 'porcentaje_bachillerato', tipo: 'porcentaje' },
  {
    titulo: 'Licenciatura con asignaturas pendientes de Bachillerato',
    llave: 'porcentaje_licenciatura_con_bachillerato_pendiente',
    tipo: 'porcentaje',
  },
  { titulo: 'Licenciatura', llave: 'porcentaje_licenciatura', tipo: 'porcentaje' },
  {
    titulo: 'Título con pendientes de Bachillerato o Licenciatura',
    llave: 'porcentaje_titulo_con_bachillerato_licenciatura_pendiente',
    tipo: 'porcentaje',
  },
  { titulo: 'Título', llave: 'porcentaje_titulo', tipo: 'porcentaje' },
];

const formateadorCantidad = new Intl.NumberFormat('es-CL', {
  maximumFractionDigits: 0,
});

const formateadorPorcentaje = new Intl.NumberFormat('es-CL', {
  maximumFractionDigits: 0,
});

function obtenerAnios(anios: number[]) {
  return [...new Set(anios)].sort((a, b) => a - b);
}

function formatearCantidad(valor: number | null) {
  if (valor === null || valor === undefined) {
    return <span className="text-slate-400">-</span>;
  }

  return formateadorCantidad.format(valor);
}

function formatearTasaInformada(valor: number | null) {
  if (valor === null || valor === undefined) {
    return <span className="text-slate-400">-</span>;
  }

  return `${formateadorPorcentaje.format(valor)}%`;
}

function formatearIndicador(valor: number | null, tipo: Indicador['tipo'] = 'cantidad') {
  return tipo === 'porcentaje' ? formatearTasaInformada(valor) : formatearCantidad(valor);
}

function agruparAsignaturas(filas: FilaAsignaturaInformada[]) {
  const agrupadas = new Map<string, FilaAsignaturaAgrupada>();

  filas.forEach((filaOrigen) => {
    const clave = `${filaOrigen.asig_codigo_base}-${filaOrigen.semestre ?? 'sin-semestre'}`;
    const fila = agrupadas.get(clave) ?? {
      codigo: filaOrigen.asig_codigo_base,
      semestre: filaOrigen.semestre,
      valores: {},
    };

    fila.valores[filaOrigen.anio_medicion] = filaOrigen.tasa_reprobacion;
    agrupadas.set(clave, fila);
  });

  return [...agrupadas.values()];
}

function TablaIndicadores({
  titulo,
  descripcion,
  indicadores,
  filas,
  mensajeVacio,
}: TablaIndicadoresProps) {
  const anios = obtenerAnios(filas.map((fila) => fila.periodo));

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 py-4">
        <h3 className="text-lg font-bold text-slate-800">{titulo}</h3>
        <p className="mt-0.5 text-xs text-slate-500">{descripcion}</p>
      </div>

      {anios.length === 0 ? (
        <div className="px-6 py-8 text-sm text-slate-500">{mensajeVacio}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="bg-[#FFF9E6]">
                <th className="border-b border-slate-200 px-6 py-3 font-semibold text-slate-700">
                  Indicador / Cohorte
                </th>
                {anios.map((anio) => (
                  <th
                    key={anio}
                    className="border-b border-slate-200 px-6 py-3 text-center font-semibold text-slate-700"
                  >
                    {anio}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {indicadores.map((indicador) => (
                <tr key={indicador.llave} className="hover:bg-slate-50/60">
                  <td className="px-6 py-3.5 font-medium text-slate-800">{indicador.titulo}</td>
                  {anios.map((anio) => (
                    <td key={anio} className="px-6 py-3.5 text-center tabular-nums">
                      {formatearCantidad(
                        filas.find((fila) => fila.periodo === anio)?.valores[indicador.llave]
                          ?? null,
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function TablaAvance({
  titulo,
  descripcion,
  columnas,
  filas,
  mensajeVacio,
}: TablaAvanceProps) {
  const anios = obtenerAnios(filas.map((fila) => fila.periodo));

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 py-4">
        <h3 className="text-lg font-bold text-slate-800">{titulo}</h3>
        <p className="mt-0.5 text-xs text-slate-500">{descripcion}</p>
      </div>

      {anios.length === 0 ? (
        <div className="px-6 py-8 text-sm text-slate-500">{mensajeVacio}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="bg-[#FFF9E6]">
                <th className="border-b border-slate-200 px-6 py-3 font-semibold text-slate-700">
                  Cohorte
                </th>
                {columnas.map((columna) => (
                  <th
                    key={columna.llave}
                    className="border-b border-slate-200 px-6 py-3 text-center font-semibold text-slate-700"
                  >
                    {columna.titulo}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {anios.map((anio) => (
                <tr key={anio} className="hover:bg-slate-50/60">
                  <td className="px-6 py-3.5 font-bold text-slate-900">{anio}</td>
                  {columnas.map((columna) => (
                    <td key={columna.llave} className="px-6 py-3.5 text-center tabular-nums">
                      {formatearIndicador(
                        filas.find((fila) => fila.periodo === anio)?.valores[columna.llave]
                          ?? null,
                        columna.tipo,
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function TablaAsignaturas({ filas, anios, mensajeVacio }: TablaAsignaturasProps) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 py-4">
        <h3 className="text-lg font-bold text-slate-800">Asignaturas informadas en la carga</h3>
        <p className="mt-0.5 text-xs text-slate-500">
          Código, semestre y tasa de reprobación consignados en el Excel, sin aplicar una
          clasificación adicional.
        </p>
      </div>

      {filas.length === 0 || anios.length === 0 ? (
        <div className="px-6 py-8 text-sm text-slate-500">{mensajeVacio}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="bg-[#FFF9E6]">
                <th className="border-b border-slate-200 px-6 py-3 font-semibold text-slate-700">
                  Código de asignatura
                </th>
                <th className="border-b border-slate-200 px-6 py-3 text-center font-semibold text-slate-700">
                  Semestre
                </th>
                {anios.map((anio) => (
                  <th
                    key={anio}
                    className="border-b border-slate-200 px-6 py-3 text-center font-semibold text-slate-700"
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
                  <td className="px-6 py-3.5 font-bold text-slate-900">{fila.codigo}</td>
                  <td className="px-6 py-3.5 text-center tabular-nums">
                    {formatearCantidad(fila.semestre)}
                  </td>
                  {anios.map((anio) => (
                    <td key={anio} className="px-6 py-3.5 text-center tabular-nums">
                      {formatearTasaInformada(fila.valores[anio] ?? null)}
                    </td>
                  ))}
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
    : 'No fue posible cargar los datos de progresión curricular.';
}

export function ProgresionCurricularDecano() {
  const { user } = useAuth();
  const [facultad, setFacultad] = useState(user?.ambito?.nombre ?? 'Facultad');
  const [carreras, setCarreras] = useState<CarreraDecanatura[]>([]);
  const [codigoCarrera, setCodigoCarrera] = useState('');
  const [eficiencia, setEficiencia] = useState<FilaEficienciaCurricular[]>([]);
  const [avance, setAvance] = useState<FilaAvanceCurricular[]>([]);
  const [asignaturas, setAsignaturas] = useState<FilaAsignaturaInformada[]>([]);
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
      setEficiencia([]);
      setAvance([]);
      setAsignaturas([]);
      setCargandoDatos(false);
      return;
    }

    let activo = true;

    const cargarDatos = async () => {
      try {
        setCargandoDatos(true);
        setErrorDatos(null);
        setPeriodoDesde('todos');
        setPeriodoHasta('todos');

        const respuesta = await obtenerCurricularCarrera(codigoCarrera);
        if (!activo) return;

        setEficiencia(respuesta.eficiencia ?? []);
        setAvance(respuesta.avance_curricular ?? []);
        setAsignaturas(respuesta.criticas ?? []);
      } catch (error) {
        if (!activo) return;
        setEficiencia([]);
        setAvance([]);
        setAsignaturas([]);
        setErrorDatos(describirError(error, 'datos'));
      } finally {
        if (activo) setCargandoDatos(false);
      }
    };

    void cargarDatos();
    return () => { activo = false; };
  }, [codigoCarrera]);

  const filasEficiencia = useMemo<FilaPeriodo[]>(() => eficiencia.map((fila) => ({
    periodo: fila.cohorte,
    valores: {
      total_alumnos_regulares: fila.total_alumnos_regulares,
      nivel_baja: fila.nivel_baja,
      nivel_media: fila.nivel_media,
      nivel_alta: fila.nivel_alta,
      nivel_eficiente: fila.nivel_eficiente,
    },
  })), [eficiencia]);

  const filasAvance = useMemo<FilaPeriodo[]>(() => avance.map((fila) => ({
    periodo: fila.cohorte,
    valores: {
      porcentaje_bachillerato: fila.porcentaje_bachillerato,
      porcentaje_licenciatura_con_bachillerato_pendiente:
        fila.porcentaje_licenciatura_con_bachillerato_pendiente,
      porcentaje_licenciatura: fila.porcentaje_licenciatura,
      porcentaje_titulo_con_bachillerato_licenciatura_pendiente:
        fila.porcentaje_titulo_con_bachillerato_licenciatura_pendiente,
      porcentaje_titulo: fila.porcentaje_titulo,
    },
  })), [avance]);

  const periodosDisponibles = useMemo(() => obtenerAnios([
    ...eficiencia.map((fila) => fila.cohorte),
    ...avance.map((fila) => fila.cohorte),
    ...asignaturas.map((fila) => fila.anio_medicion),
  ]), [eficiencia, avance, asignaturas]);

  const estaEnRango = (periodo: number) => (
    (periodoDesde === 'todos' || periodo >= periodoDesde)
    && (periodoHasta === 'todos' || periodo <= periodoHasta)
  );

  const eficienciaFiltrada = filasEficiencia.filter((fila) => estaEnRango(fila.periodo));
  const avanceFiltrado = filasAvance.filter((fila) => estaEnRango(fila.periodo));
  const asignaturasFiltradas = asignaturas.filter((fila) => estaEnRango(fila.anio_medicion));
  const filasAsignaturas = agruparAsignaturas(asignaturasFiltradas);
  const aniosAsignaturas = obtenerAnios(
    asignaturasFiltradas.map((fila) => fila.anio_medicion),
  );

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

  const carreraSeleccionada = carreras.find((carrera) => carrera.car_codigo === codigoCarrera);
  const sinCarreras = !cargandoCatalogo && !errorCatalogo && carreras.length === 0;

  return (
    <div className="mx-auto min-h-screen max-w-[1440px] space-y-8 bg-[#F8FAFC] p-5 sm:p-8 lg:p-10">
      <header className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500">
          <Building2 className="size-4 text-[#FFB800]" />
          {facultad}
        </p>
        <h1 className="mt-2 text-3xl font-bold text-[#0A192F]">Progresión curricular</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
          Eficiencia, avance curricular y datos de asignaturas informados para las carreras de
          la facultad.
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
            <h2 className="mt-1 text-2xl font-bold text-[#0A192F]">Datos curriculares históricos</h2>
          </div>

          {cargandoDatos && (
            <div
              role="status"
              aria-live="polite"
              className="flex min-h-[220px] items-center justify-center rounded-xl border border-slate-200/80 bg-white shadow-sm"
            >
              <span className="animate-pulse text-sm font-medium text-slate-500">
                Cargando datos curriculares de la carrera…
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
              <TablaIndicadores
                titulo="Cantidad de estudiantes por tramo de eficiencia curricular"
                descripcion="Cantidades registradas en el Excel por cohorte y tramo; no se recalculan como porcentajes."
                indicadores={INDICADORES_EFICIENCIA}
                filas={eficienciaFiltrada}
                mensajeVacio="No hay cantidades de eficiencia curricular para el período seleccionado."
              />

              <TablaAvance
                titulo="Estado de avance por ciclo formativo"
                descripcion="Porcentaje de alumnos regulares por cohorte en cada categoría excluyente de avance curricular."
                columnas={COLUMNAS_AVANCE}
                filas={avanceFiltrado}
                mensajeVacio="No hay porcentajes de avance curricular para el período seleccionado."
              />

              <TablaAsignaturas
                filas={filasAsignaturas}
                anios={aniosAsignaturas}
                mensajeVacio="No hay asignaturas informadas para el período seleccionado."
              />
            </>
          )}
        </section>
      )}
    </div>
  );
}
