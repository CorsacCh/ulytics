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

import { DataCardView } from '../../components/DataCardView';
import { RangoPeriodos } from '../../components/RangoPeriodos';
import { enRango, formatearDato, type RangoPeriodo } from '../../components/series';
import { GraficoIndicadoresDecano } from './GraficoIndicadoresDecano';
import { INDICADORES_EFICIENCIA, COLUMNAS_AVANCE } from '../indicadores';
import { agruparAsignaturas, serieAsignatura, INDICADORES_ASIGNATURA, type AsignaturaAgrupada } from '../asignaturas';

interface Indicador {
  titulo: string;
  llave: string;
  tipo?: 'cantidad' | 'porcentaje' | 'decimal';
}

interface FilaPeriodo {
  periodo: number;
  valores: Record<string, number | null>;
}

type FilaAsignaturaAgrupada = AsignaturaAgrupada;

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

// Las cinco categorías vienen como porcentajes excluyentes informados en el Excel.

function obtenerAnios(anios: number[]) { return [...new Set(anios)].sort((a, b) => a - b); }
const formatearCantidad = (valor: number | null) => formatearDato(valor);
const formatearTasaInformada = (valor: number | null) => formatearDato(valor, 'porcentaje');
const formatearIndicador = (valor: number | null, tipo: Indicador['tipo'] = 'cantidad') => formatearDato(valor, tipo);

function TablaIndicadores({
  titulo,
  descripcion,
  indicadores,
  filas,
  mensajeVacio,
}: TablaIndicadoresProps) {
  const anios = obtenerAnios(filas.map((fila) => fila.periodo));

  return <DataCardView title={titulo} description={descripcion}
    chartComponent={<GraficoIndicadoresDecano filas={filas} indicadores={indicadores} tipo="eficiencia" />}
    tableComponent={<>
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
    </>} />;
}

function TablaAvance({
  titulo,
  descripcion,
  columnas,
  filas,
  mensajeVacio,
}: TablaAvanceProps) {
  const anios = obtenerAnios(filas.map((fila) => fila.periodo));

  return <DataCardView title={titulo} description={descripcion}
    chartComponent={<GraficoIndicadoresDecano filas={filas} indicadores={columnas} tipo="avance" />}
    tableComponent={<>
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
    </>} />;
}

function TablaAsignaturas({ filas, anios, mensajeVacio }: TablaAsignaturasProps) {
  const [seleccion, setSeleccion] = useState('todas');
  const seleccionada = filas.find((fila) => fila.clave === seleccion);
  const visibles = seleccionada ? [seleccionada] : filas;
  return <section className="space-y-3">
    <label className="block text-sm font-semibold text-slate-700">Asignatura y semestre
      <select className="ml-3 max-w-full rounded border border-slate-300 p-2" value={seleccionada ? seleccion : 'todas'} onChange={(event) => setSeleccion(event.target.value)}>
        <option value="todas">Todas las asignaturas (tabla)</option>
        {filas.map((fila) => <option key={fila.clave} value={fila.clave}>{fila.codigo} · semestre {fila.semestre ?? 'sin datos'}</option>)}
      </select>
    </label>
    <DataCardView title="Asignaturas informadas en la carga" defaultView="table"
      description="Código completo, semestre y tasa del Excel. Selecciona una asignatura para ver su evolución; no se reclasifica como crítica."
      chartComponent={seleccionada ? <GraficoIndicadoresDecano filas={serieAsignatura(seleccionada, anios)} indicadores={INDICADORES_ASIGNATURA} eje="Año de medición" /> : <p className="py-8 text-sm text-slate-500">Selecciona una asignatura y semestre para visualizar el gráfico.</p>}
      tableComponent={<>
      {filas.length === 0 || anios.length === 0 ? (
        <div className="px-6 py-8 text-sm text-slate-500">{mensajeVacio}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="bg-[#FFF9E6]">
                <th className="border-b border-slate-200 px-6 py-3 font-semibold text-slate-700">
                  Código completo de asignatura
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
              {visibles.map((fila) => (
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
      </>} />
  </section>;
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
        setRangoCohorte(['todos', 'todos']);
        setRangoAnio(['todos', 'todos']);

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

  const cohortesDisponibles = obtenerAnios([...eficiencia.map((fila) => fila.cohorte), ...avance.map((fila) => fila.cohorte)]);
  const aniosDisponibles = obtenerAnios(asignaturas.map((fila) => fila.anio_medicion));
  const eficienciaFiltrada = filasEficiencia.filter((fila) => enRango(fila.periodo, rangoCohorte));
  const avanceFiltrado = filasAvance.filter((fila) => enRango(fila.periodo, rangoCohorte));
  const asignaturasFiltradas = asignaturas.filter((fila) => enRango(fila.anio_medicion, rangoAnio));
  const filasAsignaturas = agruparAsignaturas(asignaturasFiltradas);
  const aniosAsignaturas = obtenerAnios(asignaturasFiltradas.map((fila) => fila.anio_medicion));

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
        <p className="mt-3 text-xs text-slate-500">Cohorte filtra eficiencia y avance. Año de medición filtra asignaturas; son independientes.</p>
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
                key={codigoCarrera}
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
