import { useEffect, useMemo, useState, type ComponentType } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Building2, GraduationCap, LogIn, UserRound, UsersRound } from 'lucide-react';

import { ApiError } from '../../../auth/api';
import {
  obtenerDatosFacultadDecanatura,
  type DatosCarreraDecanatura,
} from '../facultyData';

type IconoResumen = ComponentType<{ className?: string }>;

interface ResumenCardProps {
  etiqueta: string;
  valor: number | null;
  descripcion: string;
  icono: IconoResumen;
}

function obtenerPeriodos(periodos: number[]): number[] {
  return [...new Set(periodos)].sort((a, b) => a - b);
}

function sumarInformados(valores: Array<number | null>): number | null {
  const informados = valores.filter((valor): valor is number => valor !== null);
  return informados.length > 0
    ? informados.reduce((acumulado, valor) => acumulado + valor, 0)
    : null;
}

function formatearCantidad(valor: number | null): string {
  return valor === null ? '—' : valor.toLocaleString('es-CL', { maximumFractionDigits: 2 });
}

function formatearPorcentaje(valor: number | null): string {
  return valor === null
    ? '—'
    : `${valor.toLocaleString('es-CL', { maximumFractionDigits: 2 })}%`;
}

function describirError(error: unknown): string {
  if (error instanceof ApiError && error.status === 401) {
    return 'Tu sesión expiró. Vuelve a iniciar sesión para consultar el dashboard.';
  }
  if (error instanceof ApiError && error.status === 403) {
    return 'La cuenta no tiene un ámbito de facultad válido para consultar estos datos.';
  }
  if (error instanceof Error) return error.message;
  return 'No fue posible cargar los indicadores de la facultad.';
}

function ResumenCard({ etiqueta, valor, descripcion, icono: Icono }: ResumenCardProps) {
  return (
    <article className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{etiqueta}</p>
          <p className="mt-3 text-3xl font-bold text-[#0A192F]">{formatearCantidad(valor)}</p>
        </div>
        <span className="rounded-lg bg-[#FFF9E6] p-2.5 text-[#9A6F00]">
          <Icono className="size-5" />
        </span>
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-500">{descripcion}</p>
    </article>
  );
}

export function HomeDecano() {
  const [facultad, setFacultad] = useState('Facultad');
  const [datos, setDatos] = useState<DatosCarreraDecanatura[]>([]);
  const [cohorteSeleccionada, setCohorteSeleccionada] = useState<number | null>(null);
  const [anioSeleccionado, setAnioSeleccionado] = useState<number | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;

    const cargarDatos = async () => {
      try {
        setCargando(true);
        setError(null);
        const carga = await obtenerDatosFacultadDecanatura();
        if (!activo) return;

        const cohortes = obtenerPeriodos(
          carga.datos.flatMap((item) => [
            ...item.ingresos.map((fila) => fila.cohorte),
            ...item.progresion.map((fila) => fila.cohorte),
            ...item.eficiencia.map((fila) => fila.cohorte),
            ...item.avance.map((fila) => fila.cohorte),
          ]),
        );
        const anios = obtenerPeriodos(
          carga.datos.flatMap((item) => item.matriculas.map((fila) => fila.anio_medicion)),
        );

        setFacultad(carga.facultad.nombre || carga.facultad.codigo);
        setDatos(carga.datos);
        setCohorteSeleccionada(cohortes[cohortes.length - 1] ?? null);
        setAnioSeleccionado(anios[anios.length - 1] ?? null);
      } catch (err) {
        if (activo) setError(describirError(err));
      } finally {
        if (activo) setCargando(false);
      }
    };

    void cargarDatos();
    return () => {
      activo = false;
    };
  }, []);

  const cohortesDisponibles = useMemo(
    () =>
      obtenerPeriodos(
        datos.flatMap((item) => [
          ...item.ingresos.map((fila) => fila.cohorte),
          ...item.progresion.map((fila) => fila.cohorte),
          ...item.eficiencia.map((fila) => fila.cohorte),
          ...item.avance.map((fila) => fila.cohorte),
        ]),
      ),
    [datos],
  );

  const aniosDisponibles = useMemo(
    () =>
      obtenerPeriodos(
        datos.flatMap((item) => item.matriculas.map((fila) => fila.anio_medicion)),
      ),
    [datos],
  );

  const resumen = useMemo(() => {
    const filasMatricula = datos.flatMap((item) =>
      item.matriculas.filter((fila) => fila.anio_medicion === anioSeleccionado),
    );
    const filasIngreso = datos.flatMap((item) =>
      item.ingresos.filter((fila) => fila.cohorte === cohorteSeleccionada),
    );
    const filasEficiencia = datos.flatMap((item) =>
      item.eficiencia.filter((fila) => fila.cohorte === cohorteSeleccionada),
    );

    return {
      matriculaTotal: sumarInformados(filasMatricula.map((fila) => fila.matricula_total)),
      matriculaMujeres: sumarInformados(filasMatricula.map((fila) => fila.matricula_mujeres)),
      ingresosTotales: sumarInformados(filasIngreso.map((fila) => fila.ingresos_totales)),
      alumnosRegulares: sumarInformados(
        filasEficiencia.map((fila) => fila.total_alumnos_regulares),
      ),
    };
  }, [anioSeleccionado, cohorteSeleccionada, datos]);

  const evolucionMatricula = useMemo(
    () =>
      aniosDisponibles.map((anio) => {
        const filas = datos.flatMap((item) =>
          item.matriculas.filter((fila) => fila.anio_medicion === anio),
        );
        return {
          anio,
          matricula_total: sumarInformados(filas.map((fila) => fila.matricula_total)),
          matricula_mujeres: sumarInformados(filas.map((fila) => fila.matricula_mujeres)),
        };
      }),
    [aniosDisponibles, datos],
  );

  const evolucionIngresos = useMemo(
    () =>
      cohortesDisponibles.map((cohorte) => {
        const filas = datos.flatMap((item) =>
          item.ingresos.filter((fila) => fila.cohorte === cohorte),
        );
        return {
          cohorte,
          ingresos_sua: sumarInformados(filas.map((fila) => fila.ingresos_sua)),
          ingresos_pace: sumarInformados(filas.map((fila) => fila.ingresos_pace)),
          ingresos_especiales: sumarInformados(filas.map((fila) => fila.ingresos_especiales)),
          ingresos_totales: sumarInformados(filas.map((fila) => fila.ingresos_totales)),
        };
      }),
    [cohortesDisponibles, datos],
  );

  const comparacionCarreras = useMemo(
    () =>
      datos
        .map((item) => ({
          carrera: item.carrera,
          indicadores:
            item.progresion.find((fila) => fila.cohorte === cohorteSeleccionada) ?? null,
        }))
        .sort((a, b) => a.carrera.nombre.localeCompare(b.carrera.nombre, 'es')),
    [cohorteSeleccionada, datos],
  );

  const hayMatricula = evolucionMatricula.some(
    (fila) => fila.matricula_total !== null || fila.matricula_mujeres !== null,
  );
  const hayIngresos = evolucionIngresos.some(
    (fila) =>
      fila.ingresos_sua !== null ||
      fila.ingresos_pace !== null ||
      fila.ingresos_especiales !== null ||
      fila.ingresos_totales !== null,
  );

  return (
    <div className="mx-auto min-h-screen max-w-[1440px] space-y-8 bg-[#F8FAFC] p-5 sm:p-8 lg:p-10">
      <header className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500">
          <Building2 className="size-4 text-[#FFB800]" />
          {facultad}
        </p>
        <h1 className="mt-2 text-3xl font-bold text-[#0A192F]">Dashboard del Decano</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
          Resumen de las carreras pertenecientes al ámbito académico autorizado de la cuenta.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <label className="text-sm font-semibold text-slate-700">
            Cohorte seleccionada
            <select
              value={cohorteSeleccionada ?? ''}
              onChange={(evento) => setCohorteSeleccionada(Number(evento.target.value))}
              disabled={cargando || cohortesDisponibles.length === 0}
              className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm font-semibold text-[#0A192F] outline-none focus:border-[#FFB800] focus:ring-2 focus:ring-[#FFB800]/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {cohortesDisponibles.length === 0 && <option value="">Sin cohortes</option>}
              {cohortesDisponibles.map((cohorte) => (
                <option key={cohorte} value={cohorte}>{cohorte}</option>
              ))}
            </select>
          </label>

          <label className="text-sm font-semibold text-slate-700">
            Año de medición
            <select
              value={anioSeleccionado ?? ''}
              onChange={(evento) => setAnioSeleccionado(Number(evento.target.value))}
              disabled={cargando || aniosDisponibles.length === 0}
              className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm font-semibold text-[#0A192F] outline-none focus:border-[#FFB800] focus:ring-2 focus:ring-[#FFB800]/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {aniosDisponibles.length === 0 && <option value="">Sin años</option>}
              {aniosDisponibles.map((anio) => (
                <option key={anio} value={anio}>{anio}</option>
              ))}
            </select>
          </label>

          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Carreras autorizadas
            </p>
            <p className="mt-1 text-2xl font-bold text-[#0A192F]">{datos.length}</p>
            <p className="mt-1 text-xs text-slate-500">Según la facultad asociada al usuario.</p>
          </div>
        </div>
      </header>

      {cargando && (
        <div
          role="status"
          aria-live="polite"
          className="flex min-h-[260px] items-center justify-center rounded-xl border border-slate-200/80 bg-white shadow-sm"
        >
          <span className="animate-pulse text-sm font-medium text-slate-500">
            Cargando indicadores de la facultad…
          </span>
        </div>
      )}

      {!cargando && error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {!cargando && !error && datos.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500">
          La facultad todavía no tiene carreras cargadas en el sistema.
        </div>
      )}

      {!cargando && !error && datos.length > 0 && (
        <>
          <section>
            <div className="mb-4">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Resumen de facultad
              </p>
              <h2 className="mt-1 text-2xl font-bold text-[#0A192F]">Indicadores seleccionados</h2>
              <p className="mt-1 text-sm text-slate-500">
                Cantidades agregadas desde las carreras, sin promediar tasas institucionales.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <ResumenCard
                etiqueta="Carreras"
                valor={datos.length}
                descripcion="Carreras del ámbito autorizado."
                icono={GraduationCap}
              />
              <ResumenCard
                etiqueta="Matrícula total"
                valor={resumen.matriculaTotal}
                descripcion={`Año de medición ${anioSeleccionado ?? 'sin seleccionar'}.`}
                icono={UsersRound}
              />
              <ResumenCard
                etiqueta="Matrícula mujeres"
                valor={resumen.matriculaMujeres}
                descripcion={`Año de medición ${anioSeleccionado ?? 'sin seleccionar'}.`}
                icono={UserRound}
              />
              <ResumenCard
                etiqueta="Ingresos totales"
                valor={resumen.ingresosTotales}
                descripcion={`Cohorte ${cohorteSeleccionada ?? 'sin seleccionar'}.`}
                icono={LogIn}
              />
              <ResumenCard
                etiqueta="Alumnos regulares"
                valor={resumen.alumnosRegulares}
                descripcion={`Cantidad informada para la cohorte ${cohorteSeleccionada ?? '—'}.`}
                icono={Building2}
              />
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <article className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Evolución por año de medición
              </p>
              <h2 className="mt-1 text-lg font-bold text-slate-800">Matrícula de la facultad</h2>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Suma de las cantidades informadas por carrera. La línea marca el año seleccionado.
              </p>
              {hayMatricula ? (
                <div className="mt-6 h-[320px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={evolucionMatricula} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="anio" tick={{ fill: '#64748B', fontSize: 12 }} />
                      <YAxis allowDecimals={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      {anioSeleccionado !== null && (
                        <ReferenceLine x={anioSeleccionado} stroke="#C28A00" strokeDasharray="4 4" />
                      )}
                      <Bar dataKey="matricula_total" name="Matrícula total" fill="#004D99" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="matricula_mujeres" name="Matrícula mujeres" fill="#D9B52B" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="mt-6 rounded-lg bg-slate-50 px-4 py-12 text-center text-sm text-slate-500">
                  No hay datos de matrícula informados.
                </p>
              )}
            </article>

            <article className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Evolución por cohorte
              </p>
              <h2 className="mt-1 text-lg font-bold text-slate-800">Ingresos de la facultad</h2>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Cantidades informadas para SUA, PACE, ingresos especiales y total. La línea marca la cohorte seleccionada.
              </p>
              {hayIngresos ? (
                <div className="mt-6 h-[320px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={evolucionIngresos} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="cohorte" tick={{ fill: '#64748B', fontSize: 12 }} />
                      <YAxis allowDecimals={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      {cohorteSeleccionada !== null && (
                        <ReferenceLine x={cohorteSeleccionada} stroke="#C28A00" strokeDasharray="4 4" />
                      )}
                      <Bar dataKey="ingresos_sua" name="SUA" fill="#004D99" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="ingresos_pace" name="PACE" fill="#D9B52B" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="ingresos_especiales" name="Especiales" fill="#7C8A9A" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="ingresos_totales" name="Total informado" fill="#2D7C5E" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="mt-6 rounded-lg bg-slate-50 px-4 py-12 text-center text-sm text-slate-500">
                  No hay cantidades de ingreso informadas.
                </p>
              )}
            </article>
          </section>

          <section className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Comparación de indicadores por carrera
              </p>
              <h2 className="mt-1 text-lg font-bold text-slate-800">
                Progresión académica · Cohorte {cohorteSeleccionada ?? '—'}
              </h2>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Valores entregados para cada carrera; no se calcula un promedio ni se asigna un ranking.
              </p>
            </div>

            <div className="max-h-[520px] overflow-auto">
              <table className="w-full min-w-[980px] border-collapse text-left text-sm">
                <thead className="sticky top-0 z-10 bg-[#FFF9E6]">
                  <tr>
                    <th className="border-b border-slate-200 px-6 py-3 font-semibold text-slate-700">Carrera</th>
                    <th className="border-b border-slate-200 px-4 py-3 text-center font-semibold text-slate-700">Retención total</th>
                    <th className="border-b border-slate-200 px-4 py-3 text-center font-semibold text-slate-700">TTT</th>
                    <th className="border-b border-slate-200 px-4 py-3 text-center font-semibold text-slate-700">TTO</th>
                    <th className="border-b border-slate-200 px-4 py-3 text-center font-semibold text-slate-700">TTE</th>
                    <th className="border-b border-slate-200 px-4 py-3 text-center font-semibold text-slate-700">Duración real</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {comparacionCarreras.map(({ carrera, indicadores }) => (
                    <tr key={carrera.car_codigo} className="hover:bg-slate-50/60">
                      <td className="px-6 py-3.5">
                        <p className="font-semibold text-slate-900">{carrera.nombre}</p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {carrera.car_codigo}{carrera.sede ? ` · ${carrera.sede}` : ''}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 text-center tabular-nums">{formatearPorcentaje(indicadores?.retencion_total ?? null)}</td>
                      <td className="px-4 py-3.5 text-center tabular-nums">{formatearPorcentaje(indicadores?.tasa_titulacion_total ?? null)}</td>
                      <td className="px-4 py-3.5 text-center tabular-nums">{formatearPorcentaje(indicadores?.tasa_titulacion_oportuna ?? null)}</td>
                      <td className="px-4 py-3.5 text-center tabular-nums">{formatearPorcentaje(indicadores?.tasa_titulacion_efectiva ?? null)}</td>
                      <td className="px-4 py-3.5 text-center tabular-nums">
                        {indicadores?.duracion_real_semestres === null || indicadores?.duracion_real_semestres === undefined
                          ? '—'
                          : `${formatearCantidad(indicadores.duracion_real_semestres)} sem.`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
