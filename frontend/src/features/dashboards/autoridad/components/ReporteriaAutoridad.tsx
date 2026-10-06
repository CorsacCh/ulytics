import { useEffect, useMemo, useRef, useState } from 'react';
import { ApiError } from '../../../auth/api';
import { ReporteriaView, type ModuloReporteria } from '../../components/ReporteriaView';
import { GraficoIndicadoresDecano } from '../../decano/components/GraficoIndicadoresDecano';
import {
  INDICADORES_INGRESOS,
  INDICADORES_MATRICULA,
  INDICADORES_RETENCION,
  INDICADORES_TITULACION,
  INDICADORES_EFICIENCIA,
  COLUMNAS_AVANCE,
  seriesDesdeTabla,
} from '../../decano/indicadores';
import { agruparAsignaturas, serieAsignatura, INDICADORES_ASIGNATURA } from '../../decano/asignaturas';
import type { IndicadorSerie } from '../../components/series';
import type { FilaExportable } from '../../../../utils/exportUtils';
import {
  obtenerMatriculaCarrera,
  obtenerProgresionCarrera,
  obtenerCurricularCarrera,
} from '../../decano/api';
import { obtenerCatalogoInstitucional, type CatalogoCarrera } from '../api';
import type { DatosCarreraDecanatura } from '../../decano/facultyData';

interface ColumnaTabla {
  llave: string;
  etiqueta: string;
  porcentaje?: boolean;
}

const CATEGORIA_ANALITICA = 'Progresión Analítica';
const CATEGORIA_CURRICULAR = 'Progresión Curricular';

function obtenerPeriodos(periodos: number[]): number[] {
  return [...new Set(periodos)].sort((a, b) => a - b);
}

function formatearValor(valor: unknown, porcentaje = false): string {
  if (valor === null || valor === undefined || valor === '') return 'Sin datos';
  if (typeof valor !== 'number') return String(valor);

  const texto = valor.toLocaleString('es-CL', { maximumFractionDigits: 2 });
  return porcentaje ? `${texto}%` : texto;
}

function TablaReporte({
  titulo,
  descripcion,
  columnas,
  filas,
}: {
  titulo: string;
  descripcion: string;
  columnas: ColumnaTabla[];
  filas: FilaExportable[];
}) {
  return (
    <article className="rounded-xl border border-slate-200/80 bg-white p-6">
      <h3 className="text-lg font-bold text-slate-800">{titulo}</h3>
      <p className="mt-1 text-xs leading-5 text-slate-500">{descripcion}</p>

      {filas.length === 0 ? (
        <p className="mt-5 rounded-lg bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
          No existen datos para el alcance y tramo seleccionados.
        </p>
      ) : (
        <div className="mt-4 overflow-visible rounded-lg border border-slate-200">
          <table className="w-full border-collapse text-left text-[11px]">
            <thead className="bg-[#FFF9E6]">
              <tr>
                {columnas.map((columna) => (
                  <th
                    key={columna.llave}
                    className="border-b border-slate-200 px-2 py-2 font-semibold text-slate-700"
                  >
                    {columna.etiqueta}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filas.map((fila, indice) => (
                <tr key={indice} className="break-inside-avoid">
                  {columnas.map((columna) => (
                    <td key={columna.llave} className="px-2 py-2 text-slate-700">
                      {columna.llave === 'Cohorte' || columna.llave === 'Año de medición'
                        ? String(fila[columna.llave])
                        : formatearValor(fila[columna.llave], columna.porcentaje)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </article>
  );
}

type AlcanceReporteAutoridad = 'INSTITUCION' | 'FACULTADES';

function describirError(error: unknown): string {
  if (error instanceof ApiError && error.status === 401) {
    return 'Tu sesión expiró. Vuelve a iniciar sesión para generar el reporte.';
  }
  if (error instanceof ApiError && error.status === 403) {
    return 'La cuenta no tiene autorización para consultar alguna de las carreras solicitadas.';
  }
  if (error instanceof Error) return error.message;
  return 'No fue posible cargar los datos necesarios para generar el reporte.';
}

// Misma fábrica que la del Decano, adaptada al nivel institucional: las
// secciones del PDF se agrupan por Facultad y cada sección lista todas las
// carreras de esa facultad (tabla) o una serie por carrera (gráfico).
function crearModuloTablaInstitucional(
  id: string,
  label: string,
  categoria: string,
  descripcion: string,
  columnas: ColumnaTabla[],
  data: FilaExportable[],
  indicadores: IndicadorSerie[],
  tipo: 'lineas' | 'eficiencia' | 'avance' | 'asignaturas' = 'lineas',
): ModuloReporteria {
  const grupos = [
    ...new Set(data.map((fila) => String(fila['Facultad'] ?? 'Institución'))),
  ];
  return {
    id,
    label,
    categoria,
    data,
    formats: ['pdf'],
    render: () => <TablaReporte titulo={label} descripcion={descripcion} columnas={columnas} filas={data} />,
    seccionesPdf: grupos.length === 0
      ? [
          {
            id: `${id}-sin-datos`,
            label: 'Sin datos',
            tabla: () => <TablaReporte titulo={label} descripcion={descripcion} columnas={columnas} filas={[]} />,
            grafico: () => <p className="p-6">No existen datos para el alcance y tramo seleccionados.</p>,
          },
        ]
      : grupos.map((grupo) => {
          const filas = data.filter((fila) => String(fila['Facultad'] ?? 'Institución') === grupo);
          const periodo = columnas[4].llave;
          return {
            id: `${id}-${encodeURIComponent(grupo)}`,
            label: grupo,
            tabla: () => (
              <div>
                {Array.from({ length: Math.ceil(filas.length / 12) }, (_, indice) => (
                  <div key={indice} data-pdf-block="true">
                    <TablaReporte
                      titulo={`${label} · ${grupo}`}
                      descripcion={descripcion}
                      columnas={columnas}
                      filas={filas.slice(indice * 12, (indice + 1) * 12)}
                    />
                  </div>
                ))}
              </div>
            ),
            grafico: () =>
              tipo === 'asignaturas' ? (
                <div>
                  {agruparAsignaturas(
                    filas.map((fila) => ({
                      asig_codigo: String(fila['Código completo']),
                      asig_codigo_base: String(fila['Código base']),
                      semestre: fila.Semestre as number | null,
                      anio_medicion: Number(fila['Año de medición']),
                      tasa_reprobacion: fila['Tasa de reprobación (%)'] as number | null,
                      estado_dato: null,
                    })),
                  ).map((asignatura) => (
                    <div key={asignatura.clave} className="mb-6" data-pdf-block="true">
                      <h3 className="mb-3 font-semibold">
                        {asignatura.codigo} · semestre {asignatura.semestre ?? 'sin datos'}
                      </h3>
                      <GraficoIndicadoresDecano
                        filas={serieAsignatura(
                          asignatura,
                          obtenerPeriodos(filas.map((fila) => Number(fila['Año de medición']))),
                        )}
                        indicadores={INDICADORES_ASIGNATURA}
                        eje="Año de medición"
                        exportacion
                      />
                    </div>
                  ))}
                </div>
              ) : (
                // Una serie por carrera dentro de la facultad: agrupar los
                // periodos de carreras distintas mezclaría cohortes distintas.
                <div>
                  {[...new Set(filas.map((fila) => String(fila.Carrera)))].map((carrera) => {
                    const filasCarrera = filas.filter((fila) => String(fila.Carrera) === carrera);
                    const serieCarrera = seriesDesdeTabla(
                      filasCarrera,
                      columnas.slice(4).map(({ llave }) => llave),
                      indicadores,
                    );
                    return (
                      <div key={carrera} className="mb-6" data-pdf-block="true">
                        <h3 className="mb-3 font-semibold">{carrera}</h3>
                        <GraficoIndicadoresDecano
                          filas={serieCarrera}
                          indicadores={indicadores}
                          tipo={tipo}
                          eje={periodo}
                          exportacion
                        />
                      </div>
                    );
                  })}
                </div>
              ),
          };
        }),
  };
}

// Selector de periodo con el mismo diseño que el de ReporteriaDecano.
function SelectorPeriodo({
  etiqueta,
  valor,
  opciones,
  onChange,
}: {
  etiqueta: string;
  valor: number | null;
  opciones: number[];
  onChange: (valor: number) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{etiqueta}</span>
      <select
        value={valor ?? ''}
        onChange={(evento) => onChange(Number(evento.target.value))}
        disabled={opciones.length === 0}
        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-[#0A192F] outline-none focus:border-[#FFB800] focus:ring-2 focus:ring-[#FFB800]/20 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {opciones.map((opcion) => (
          <option key={opcion} value={opcion}>
            {opcion}
          </option>
        ))}
      </select>
    </label>
  );
}

export function ReporteriaAutoridad() {
  // Mismo patrón que ReporteriaDecano: el alcance y los tramos temporales
  // gobiernan qué carreras y periodos entran en los módulos exportables.
  const [facultadesReales, setFacultadesReales] = useState<{ id: string; nombre: string }[]>([]);
  const [carrerasReales, setCarrerasReales] = useState<CatalogoCarrera[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [alcance, setAlcance] = useState<AlcanceReporteAutoridad>('INSTITUCION');
  const [facultadesSeleccionadas, setFacultadesSeleccionadas] = useState<string[]>([]);
  const [cohorteDesde, setCohorteDesde] = useState<number | null>(null);
  const [cohorteHasta, setCohorteHasta] = useState<number | null>(null);
  const [anioDesde, setAnioDesde] = useState<number | null>(null);
  const [anioHasta, setAnioHasta] = useState<number | null>(null);
  // Evita que la carga incremental de carreras reescriba los tramos elegidos.
  const inicializado = useRef(false);

  // Mantienen coherente el tramo: "desde" nunca supera a "hasta".
  const cambiarCohorteDesde = (valor: number) => {
    setCohorteDesde(valor);
    if (cohorteHasta !== null && valor > cohorteHasta) setCohorteHasta(valor);
  };
  const cambiarCohorteHasta = (valor: number) => {
    setCohorteHasta(valor);
    if (cohorteDesde !== null && valor < cohorteDesde) setCohorteDesde(valor);
  };
  const cambiarAnioDesde = (valor: number) => {
    setAnioDesde(valor);
    if (anioHasta !== null && valor > anioHasta) setAnioHasta(valor);
  };
  const cambiarAnioHasta = (valor: number) => {
    setAnioHasta(valor);
    if (anioDesde !== null && valor < anioDesde) setAnioDesde(valor);
  };
  const cambiarSeleccionFacultad = (id: string) => {
    setFacultadesSeleccionadas((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };
  const facultadesDisponibles = useMemo(
    () => facultadesReales.map((facultad) => facultad.nombre),
    [facultadesReales],
  );

  // Catálogo institucional real (GET /api/ambitos). Si falla, la vista
  // muestra el error en lugar de fabricar datos de demostración.
  useEffect(() => {
    let activo = true;
    obtenerCatalogoInstitucional()
      .then((catalogo) => {
        if (!activo) return;
        setFacultadesReales(
          catalogo.facultades.map((facultad) => ({
            id: facultad.id_macrounidad,
            nombre: facultad.nombre,
          })),
        );
        setCarrerasReales(catalogo.carreras);
        setFacultadesSeleccionadas(catalogo.facultades.map((facultad) => facultad.id_macrounidad));
      })
      .catch((err) => {
        if (activo) setError(describirError(err));
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, []);

  // Carreras incluidas según el alcance elegido.
  const codigosActivos = useMemo(() => {
    const todos = carrerasReales.map((carrera) => carrera.car_codigo);
    if (alcance === 'INSTITUCION') return todos;
    return carrerasReales
      .filter(
        (carrera) =>
          carrera.id_macrounidad !== undefined &&
          facultadesSeleccionadas.includes(carrera.id_macrounidad),
      )
      .map((carrera) => carrera.car_codigo);
  }, [alcance, carrerasReales, facultadesSeleccionadas]);

  // Carga de reportería de las carreras del alcance activo (una sola vez por
  // carrera). `codigosCargados` evita re disparar la petición de cada carrera.
  const [datosCargados, setDatosCargados] = useState<Record<string, DatosCarreraDecanatura>>({});
  const codigosCargados = useRef(new Set<string>());

  useEffect(() => {
    const faltantes = codigosActivos.filter((codigo) => !codigosCargados.current.has(codigo));
    if (faltantes.length === 0) return;

    let vivo = true;
    void (async () => {
      try {
        setCargando(true);
        setError(null);
        await Promise.all(
          faltantes.map(async (codigo) => {
            const [matricula, progresion, curricular] = await Promise.all([
              obtenerMatriculaCarrera(codigo),
              obtenerProgresionCarrera(codigo),
              obtenerCurricularCarrera(codigo),
            ]);
            codigosCargados.current.add(codigo);
            if (!vivo) return;
            const carreraInfo = carrerasReales.find((carrera) => carrera.car_codigo === codigo);
            setDatosCargados((prev) => ({
              ...prev,
              [codigo]: {
                carrera: {
                  car_codigo: codigo,
                  nombre: carreraInfo?.nombre ?? codigo,
                  sede: null,
                  id_macrounidad: carreraInfo?.id_macrounidad ?? '',
                },
                ingresos: matricula.ingresos_cohorte ?? [],
                matriculas: matricula.matricula_anual ?? [],
                progresion: progresion.datos ?? [],
                eficiencia: curricular.eficiencia ?? [],
                avance: curricular.avance_curricular ?? [],
                asignaturas: curricular.criticas ?? [],
              },
            }));
          }),
        );
      } catch (err) {
        if (vivo) setError(describirError(err));
      } finally {
        if (vivo) setCargando(false);
      }
    })();

    return () => {
      vivo = false;
    };
    // El arreglo se serializa para que el efecto dependa del contenido y no
    // de su identidad en cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codigosActivos.join(',')]);

  // Registros ya disponibles, restringidos a las carreras del alcance activo.
  const datosSeleccionados = useMemo(
    () =>
      codigosActivos
        .map((codigo) => datosCargados[codigo])
        .filter((dato): dato is DatosCarreraDecanatura => Boolean(dato)),
    [codigosActivos, datosCargados],
  );

  const aniosDisponibles = useMemo(
    () =>
      obtenerPeriodos(
        datosSeleccionados.flatMap((dato) => [
          ...dato.matriculas.map((fila) => fila.anio_medicion),
          ...dato.asignaturas.map((fila) => fila.anio_medicion),
        ]),
      ),
    [datosSeleccionados],
  );

  const cohortesDisponibles = useMemo(
    () =>
      obtenerPeriodos(
        datosSeleccionados.flatMap((dato) => [
          ...dato.ingresos.map((fila) => fila.cohorte),
          ...dato.progresion.map((fila) => fila.cohorte),
          ...dato.eficiencia.map((fila) => fila.cohorte),
          ...dato.avance.map((fila) => fila.cohorte),
        ]),
      ),
    [datosSeleccionados],
  );

  // Los tramos abarcan todo lo disponible la primera vez que hay datos.
  useEffect(() => {
    if (inicializado.current || datosSeleccionados.length === 0) return;
    inicializado.current = true;
    setCohorteDesde(cohortesDisponibles[0] ?? null);
    setCohorteHasta(cohortesDisponibles[cohortesDisponibles.length - 1] ?? null);
    setAnioDesde(aniosDisponibles[0] ?? null);
    setAnioHasta(aniosDisponibles[aniosDisponibles.length - 1] ?? null);
  }, [datosSeleccionados.length, cohortesDisponibles, aniosDisponibles]);

  const dentroDeCohorte = (cohorte: number) =>
    (cohorteDesde === null || cohorte >= cohorteDesde) &&
    (cohorteHasta === null || cohorte <= cohorteHasta);

  const dentroDeAnio = (anio: number) =>
    (anioDesde === null || anio >= anioDesde) && (anioHasta === null || anio <= anioHasta);

  const descripcionAlcance =
    alcance === 'INSTITUCION'
      ? 'Institución completa'
      : `${facultadesSeleccionadas.length} ${
          facultadesSeleccionadas.length === 1 ? 'facultad' : 'facultades'
        }`;

  const filtrosActivos = `${descripcionAlcance} · C ${cohorteDesde ?? '—'}-${cohorteHasta ?? '—'} · A ${
    anioDesde ?? '—'
  }-${anioHasta ?? '—'}`;

  // Cada fila documenta Facultad · Carrera · Código antes del periodo, que es
  // lo que usa crearModuloTablaInstitucional para armar las secciones del PDF.
  const filasIdentificacion = (codigo: string) => ({
    Facultad: facultadesReales.find((f) => f.id === carrerasReales.find((c) => c.car_codigo === codigo)?.id_macrounidad)?.nombre ?? 'Sin facultad',
    Carrera: carrerasReales.find((c) => c.car_codigo === codigo)?.nombre ?? codigo,
    'Código carrera': codigo,
  });

  const datosIngresos: FilaExportable[] = datosSeleccionados.flatMap((dato) =>
    dato.ingresos.filter((fila) => dentroDeCohorte(fila.cohorte)).map((fila) => ({
      ...filasIdentificacion(dato.carrera.car_codigo),
      Cohorte: fila.cohorte,
      'Ingresos SUA/PAES': fila.ingresos_sua,
      'Ingresos PACE': fila.ingresos_pace,
      'Ingresos especiales': fila.ingresos_especiales,
      'Ingresos totales': fila.ingresos_totales,
    })),
  );

  const datosMatricula: FilaExportable[] = datosSeleccionados.flatMap((dato) =>
    dato.matriculas.filter((fila) => dentroDeAnio(fila.anio_medicion)).map((fila) => ({
      ...filasIdentificacion(dato.carrera.car_codigo),
      'Año de medición': fila.anio_medicion,
      'Matrícula total': fila.matricula_total,
      'Matrícula mujeres': fila.matricula_mujeres,
      'Mujeres (%)': fila.porcentaje_mujeres,
    })),
  );

  const datosRetencion: FilaExportable[] = datosSeleccionados.flatMap((dato) =>
    dato.progresion.filter((fila) => dentroDeCohorte(fila.cohorte)).map((fila) => ({
      ...filasIdentificacion(dato.carrera.car_codigo),
      Cohorte: fila.cohorte,
      'Retención 1er año': fila.retencion_a1,
      'Retención 2do año': fila.retencion_a2,
      'Retención 3er año': fila.retencion_a3,
      'Retención 4to año': fila.retencion_a4,
      'Retención total': fila.retencion_total,
    })),
  );

  const datosTitulacion: FilaExportable[] = datosSeleccionados.flatMap((dato) =>
    dato.progresion.filter((fila) => dentroDeCohorte(fila.cohorte)).map((fila) => ({
      ...filasIdentificacion(dato.carrera.car_codigo),
      Cohorte: fila.cohorte,
      'Titulación total (TTT)': fila.tasa_titulacion_total,
      'Titulación oportuna (TTO)': fila.tasa_titulacion_oportuna,
      'Titulación efectiva (TTE)': fila.tasa_titulacion_efectiva,
      'Duración real (semestres)': fila.duracion_real_semestres,
    })),
  );

  const datosEficiencia: FilaExportable[] = datosSeleccionados.flatMap((dato) =>
    dato.eficiencia.filter((fila) => dentroDeCohorte(fila.cohorte)).map((fila) => ({
      ...filasIdentificacion(dato.carrera.car_codigo),
      Cohorte: fila.cohorte,
      'Alumnos regulares': fila.total_alumnos_regulares,
      Baja: fila.nivel_baja,
      Media: fila.nivel_media,
      Alta: fila.nivel_alta,
      Eficiente: fila.nivel_eficiente,
    })),
  );

  const datosAvance: FilaExportable[] = datosSeleccionados.flatMap((dato) =>
    dato.avance.filter((fila) => dentroDeCohorte(fila.cohorte)).map((fila) => ({
      ...filasIdentificacion(dato.carrera.car_codigo),
      Cohorte: fila.cohorte,
      'Bachillerato (%)': fila.porcentaje_bachillerato,
      'Lic. con Bach. pendiente (%)':
        fila.porcentaje_licenciatura_con_bachillerato_pendiente,
      'Licenciatura (%)': fila.porcentaje_licenciatura,
      'Título con pendientes (%)':
        fila.porcentaje_titulo_con_bachillerato_licenciatura_pendiente,
      'Título (%)': fila.porcentaje_titulo,
    })),
  );

  const datosAsignaturas: FilaExportable[] = datosSeleccionados.flatMap((dato) =>
    dato.asignaturas.filter((fila) => dentroDeAnio(fila.anio_medicion)).map((fila) => ({
      ...filasIdentificacion(dato.carrera.car_codigo),
      'Código base': fila.asig_codigo_base,
      'Código completo': fila.asig_codigo,
      Semestre: fila.semestre,
      'Año de medición': fila.anio_medicion,
      'Tasa de reprobación (%)': fila.tasa_reprobacion,
      'Estado del dato': fila.estado_dato ?? 'Sin datos',
    })),
  );

  const columnasInstitucionales: ColumnaTabla[] = [
    { llave: 'Facultad', etiqueta: 'Facultad' },
    { llave: 'Carrera', etiqueta: 'Carrera' },
    { llave: 'Código carrera', etiqueta: 'Código' },
  ];

  const modulos: ModuloReporteria[] = codigosActivos.length === 0
    ? []
    : [
    crearModuloTablaInstitucional(
      'reporteria-autoridad-ingresos',
      'Ingresos por cohorte',
      CATEGORIA_ANALITICA,
      'Cantidades informadas por vía de admisión para cada carrera y cohorte.',
      [
        ...columnasInstitucionales,
        { llave: 'Cohorte', etiqueta: 'Cohorte' },
        { llave: 'Ingresos SUA/PAES', etiqueta: 'SUA/PAES' },
        { llave: 'Ingresos PACE', etiqueta: 'PACE' },
        { llave: 'Ingresos especiales', etiqueta: 'Especiales' },
        { llave: 'Ingresos totales', etiqueta: 'Total' },
      ],
      datosIngresos,
      INDICADORES_INGRESOS,
    ),
    crearModuloTablaInstitucional(
      'reporteria-autoridad-matricula',
      'Matrícula anual',
      CATEGORIA_ANALITICA,
      'Matrícula total y de mujeres por carrera y año de medición.',
      [
        ...columnasInstitucionales,
        { llave: 'Año de medición', etiqueta: 'Año' },
        { llave: 'Matrícula total', etiqueta: 'Total' },
        { llave: 'Matrícula mujeres', etiqueta: 'Mujeres' },
        { llave: 'Mujeres (%)', etiqueta: 'Mujeres', porcentaje: true },
      ],
      datosMatricula,
      INDICADORES_MATRICULA,
    ),
    crearModuloTablaInstitucional(
      'reporteria-autoridad-retencion',
      'Tasas de retención',
      CATEGORIA_ANALITICA,
      'Tasas informadas para cada carrera y cohorte, sin recalcular promedios institucionales.',
      [
        ...columnasInstitucionales,
        { llave: 'Cohorte', etiqueta: 'Cohorte' },
        { llave: 'Retención 1er año', etiqueta: '1er año', porcentaje: true },
        { llave: 'Retención 2do año', etiqueta: '2do año', porcentaje: true },
        { llave: 'Retención 3er año', etiqueta: '3er año', porcentaje: true },
        { llave: 'Retención 4to año', etiqueta: '4to año', porcentaje: true },
        { llave: 'Retención total', etiqueta: 'Total', porcentaje: true },
      ],
      datosRetencion,
      INDICADORES_RETENCION,
    ),
    crearModuloTablaInstitucional(
      'reporteria-autoridad-titulacion',
      'Titulación y duración real',
      CATEGORIA_ANALITICA,
      'Indicadores TTT, TTO, TTE y duración real entregados para cada carrera y cohorte.',
      [
        ...columnasInstitucionales,
        { llave: 'Cohorte', etiqueta: 'Cohorte' },
        { llave: 'Titulación total (TTT)', etiqueta: 'TTT', porcentaje: true },
        { llave: 'Titulación oportuna (TTO)', etiqueta: 'TTO', porcentaje: true },
        { llave: 'Titulación efectiva (TTE)', etiqueta: 'TTE', porcentaje: true },
        { llave: 'Duración real (semestres)', etiqueta: 'Duración' },
      ],
      datosTitulacion,
      INDICADORES_TITULACION,
    ),
    crearModuloTablaInstitucional(
      'reporteria-autoridad-eficiencia',
      'Eficiencia curricular por cohorte',
      CATEGORIA_CURRICULAR,
      'Cantidades de estudiantes por tramo, mostradas tal como fueron informadas.',
      [
        ...columnasInstitucionales,
        { llave: 'Cohorte', etiqueta: 'Cohorte' },
        { llave: 'Alumnos regulares', etiqueta: 'Regulares' },
        { llave: 'Baja', etiqueta: 'Baja' },
        { llave: 'Media', etiqueta: 'Media' },
        { llave: 'Alta', etiqueta: 'Alta' },
        { llave: 'Eficiente', etiqueta: 'Eficiente' },
      ],
      datosEficiencia,
      INDICADORES_EFICIENCIA,
      'eficiencia',
    ),
    crearModuloTablaInstitucional(
      'reporteria-autoridad-avance',
      'Avance por ciclo formativo',
      CATEGORIA_CURRICULAR,
      'Porcentajes informados para las cinco categorías de avance curricular.',
      [
        ...columnasInstitucionales,
        { llave: 'Cohorte', etiqueta: 'Cohorte' },
        { llave: 'Bachillerato (%)', etiqueta: 'Bach.', porcentaje: true },
        { llave: 'Lic. con Bach. pendiente (%)', etiqueta: 'Lic. / Bach. pend.', porcentaje: true },
        { llave: 'Licenciatura (%)', etiqueta: 'Lic.', porcentaje: true },
        { llave: 'Título con pendientes (%)', etiqueta: 'Título / pend.', porcentaje: true },
        { llave: 'Título (%)', etiqueta: 'Título', porcentaje: true },
      ],
      datosAvance,
      COLUMNAS_AVANCE,
      'avance',
    ),
    crearModuloTablaInstitucional(
      'reporteria-autoridad-asignaturas',
      'Asignaturas informadas en la carga',
      CATEGORIA_CURRICULAR,
      'Códigos y tasas consignados en el Excel; no se clasifican nuevamente como críticas.',
      [
        ...columnasInstitucionales,
        { llave: 'Código base', etiqueta: 'Código base' },
        { llave: 'Código completo', etiqueta: 'Código completo' },
        { llave: 'Semestre', etiqueta: 'Sem.' },
        { llave: 'Año de medición', etiqueta: 'Año' },
        { llave: 'Tasa de reprobación (%)', etiqueta: 'Reprobación', porcentaje: true },
      ],
      datosAsignaturas,
      INDICADORES_ASIGNATURA,
      'asignaturas',
    ),
  ];

  const configuracion = (
    <div className="space-y-7">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
          1. Alcance académico
        </p>
        <h2 className="mt-1 text-lg font-bold text-slate-800">Define las facultades del reporte</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="flex cursor-pointer gap-3 rounded-lg border border-slate-200 p-4 hover:bg-slate-50">
            <input
              type="radio"
              name="alcance-reporte-autoridad"
              value="INSTITUCION"
              checked={alcance === 'INSTITUCION'}
              onChange={() => setAlcance('INSTITUCION')}
            />
            <span>
              <span className="block text-sm font-semibold text-slate-800">Institución completa</span>
              <span className="mt-1 block text-xs text-slate-500">
                Incluye las {facultadesDisponibles.length} facultades de la institución.
              </span>
            </span>
          </label>
          <label className="flex cursor-pointer gap-3 rounded-lg border border-slate-200 p-4 hover:bg-slate-50">
            <input
              type="radio"
              name="alcance-reporte-autoridad"
              value="FACULTADES"
              checked={alcance === 'FACULTADES'}
              onChange={() => setAlcance('FACULTADES')}
            />
            <span>
              <span className="block text-sm font-semibold text-slate-800">Facultades específicas</span>
              <span className="mt-1 block text-xs text-slate-500">
                Permite incluir una o varias facultades.
              </span>
            </span>
          </label>
        </div>

        {alcance === 'FACULTADES' && (
          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50/60 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-700">
                {facultadesSeleccionadas.length} de {facultadesDisponibles.length} facultades seleccionadas
              </p>
              <div className="flex gap-3 text-xs font-semibold text-[#004d99]">
                <button
                  type="button"
                  onClick={() => setFacultadesSeleccionadas(facultadesReales.map((f) => f.id))}
                >
                  Seleccionar todas
                </button>
                <button type="button" onClick={() => setFacultadesSeleccionadas([])}>
                  Limpiar
                </button>
              </div>
            </div>
            <div className="grid max-h-56 gap-2 overflow-y-auto pr-2 sm:grid-cols-2">
              {facultadesReales.map((facultad) => (
                <label
                  key={facultad.id}
                  className="flex cursor-pointer items-start gap-2 rounded-md bg-white px-3 py-2 text-sm text-slate-700"
                >
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={facultadesSeleccionadas.includes(facultad.id)}
                    onChange={() => cambiarSeleccionFacultad(facultad.id)}
                  />
                  <span className="font-semibold">{facultad.nombre}</span>
                </label>
              ))}
            </div>
            {facultadesSeleccionadas.length === 0 && (
              <p className="mt-3 text-sm font-medium text-red-600">
                Selecciona al menos una facultad para el reporte.
              </p>
            )}
          </div>
        )}
      </div>

      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
          2. Tramos temporales
        </p>
        <h2 className="mt-1 text-lg font-bold text-slate-800">Selecciona los períodos incluidos</h2>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          Las cohortes se aplican a progresión y avance; los años de medición se aplican a matrícula.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SelectorPeriodo
            etiqueta="Cohorte desde"
            valor={cohorteDesde}
            opciones={cohortesDisponibles}
            onChange={cambiarCohorteDesde}
          />
          <SelectorPeriodo
            etiqueta="Cohorte hasta"
            valor={cohorteHasta}
            opciones={cohortesDisponibles}
            onChange={cambiarCohorteHasta}
          />
          <SelectorPeriodo
            etiqueta="Año de medición desde"
            valor={anioDesde}
            opciones={aniosDisponibles}
            onChange={cambiarAnioDesde}
          />
          <SelectorPeriodo
            etiqueta="Año de medición hasta"
            valor={anioHasta}
            opciones={aniosDisponibles}
            onChange={cambiarAnioHasta}
          />
        </div>
      </div>

      <div className="rounded-lg bg-[#FFF9E6] px-4 py-3 text-sm text-slate-700">
        <span className="font-semibold">Configuración actual:</span> {descripcionAlcance} · cohortes{' '}
        {cohorteDesde ?? '—'}–{cohorteHasta ?? '—'} · años {anioDesde ?? '—'}–{anioHasta ?? '—'}.
      </div>
    </div>
  );

  return (
    <ReporteriaView
      reportTitle="Reportería"
      activeFilters={filtrosActivos}
      etiqueta="AUTORIDAD CENTRAL"
      subtitulo="Configura y genera reportes consolidados con los indicadores institucionales de la Universidad."
      modulos={modulos}
      configuracion={configuracion}
      formatosDisponibles={['pdf']}
      etiquetaBotonPdf="Descargar reporte PDF"
      loading={cargando}
      error={error}
      descripcionHistorial="Consulta y vuelve a descargar reportes institucionales generados anteriormente."
    />
  );
}

