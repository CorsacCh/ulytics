import { useEffect, useMemo, useState } from 'react';
import { ApiError } from '../../../auth/api';
import { ReporteriaView, type ModuloReporteria } from '../../components/ReporteriaView';
import { GraficoIndicadoresDecano } from './GraficoIndicadoresDecano';
import { INDICADORES_INGRESOS, INDICADORES_MATRICULA, INDICADORES_RETENCION, INDICADORES_TITULACION, INDICADORES_EFICIENCIA, COLUMNAS_AVANCE, seriesDesdeTabla } from '../indicadores';
import { agruparAsignaturas, serieAsignatura, INDICADORES_ASIGNATURA } from '../asignaturas';
import type { IndicadorSerie } from '../../components/series';
import type { FilaExportable } from '../../../../utils/exportUtils';
import type { CarreraDecanatura } from '../api';
import {
  obtenerDatosFacultadDecanatura,
  type DatosCarreraDecanatura,
} from '../facultyData';

type AlcanceReporte = 'FACULTAD' | 'SELECCION';

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

function crearModuloTabla(
  id: string, label: string, categoria: string, descripcion: string,
  columnas: ColumnaTabla[], data: FilaExportable[], indicadores: IndicadorSerie[],
  tipo: 'lineas' | 'eficiencia' | 'avance' | 'asignaturas' = 'lineas',
): ModuloReporteria {
  const grupos = [...new Set(data.map((fila) => String(fila['Código carrera'])))];
  return {
    id, label, categoria, data, formats: ['pdf'],
    render: () => <TablaReporte titulo={label} descripcion={descripcion} columnas={columnas} filas={data} />,
    seccionesPdf: grupos.length === 0 ? [{
      id: `${id}-sin-datos`, label: 'Sin datos',
      tabla: () => <TablaReporte titulo={label} descripcion={descripcion} columnas={columnas} filas={[]} />,
      grafico: () => <p className="p-6">No existen datos para el alcance y tramo seleccionados.</p>,
    }] : grupos.map((codigo) => {
      const filas = data.filter((fila) => fila['Código carrera'] === codigo);
      const carrera = `${filas[0].Carrera} · ${codigo} · ${filas[0].Sede}`;
      const periodo = columnas[3].llave;
      const series = tipo === 'asignaturas' ? [] : seriesDesdeTabla(filas, columnas.slice(3).map(({ llave }) => llave), indicadores);
      return {
        id: `${id}-${encodeURIComponent(codigo)}`, label: carrera,
        tabla: () => <div>{Array.from({ length: Math.ceil(filas.length / 12) }, (_, indice) => (
          <div key={indice} data-pdf-block="true">
            <TablaReporte titulo={`${label} · ${carrera}`} descripcion={descripcion} columnas={columnas} filas={filas.slice(indice * 12, (indice + 1) * 12)} />
          </div>
        ))}</div>,
        grafico: () => tipo === 'asignaturas' ? <div>{
          agruparAsignaturas(filas.map((fila) => ({
            asig_codigo: String(fila['Código completo']), asig_codigo_base: String(fila['Código base']),
            semestre: fila.Semestre as number | null, anio_medicion: Number(fila['Año de medición']),
            tasa_reprobacion: fila['Tasa de reprobación (%)'] as number | null, estado_dato: null,
          }))).map((asignatura) => (
            <div key={asignatura.clave} className="mb-6" data-pdf-block="true">
              <h3 className="mb-3 font-semibold">{asignatura.codigo} · semestre {asignatura.semestre ?? 'sin datos'}</h3>
              <GraficoIndicadoresDecano filas={serieAsignatura(asignatura, obtenerPeriodos(filas.map((fila) => Number(fila['Año de medición']))))}
                indicadores={INDICADORES_ASIGNATURA} eje="Año de medición" exportacion />
            </div>
          ))
        }</div> : <GraficoIndicadoresDecano filas={series} indicadores={indicadores} tipo={tipo}
          eje={periodo} exportacion />,
      };
    }),
  };
}

function describirError(error: unknown): string {
  if (error instanceof ApiError && error.status === 401) {
    return 'Tu sesión expiró. Vuelve a iniciar sesión para generar el reporte.';
  }
  if (error instanceof ApiError && error.status === 403) {
    return 'La cuenta no tiene autorización para consultar una de las carreras solicitadas.';
  }
  if (error instanceof Error) return error.message;
  return 'No fue posible cargar los datos necesarios para generar el reporte.';
}

export function ReporteriaDecano() {
  const [facultad, setFacultad] = useState('Facultad');
  const [carreras, setCarreras] = useState<CarreraDecanatura[]>([]);
  const [datos, setDatos] = useState<DatosCarreraDecanatura[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [alcance, setAlcance] = useState<AlcanceReporte>('FACULTAD');
  const [codigosSeleccionados, setCodigosSeleccionados] = useState<string[]>([]);
  const [cohorteDesde, setCohorteDesde] = useState<number | null>(null);
  const [cohorteHasta, setCohorteHasta] = useState<number | null>(null);
  const [anioDesde, setAnioDesde] = useState<number | null>(null);
  const [anioHasta, setAnioHasta] = useState<number | null>(null);

  useEffect(() => {
    let activo = true;

    const cargarDatos = async () => {
      try {
        setCargando(true);
        setError(null);

        const carga = await obtenerDatosFacultadDecanatura();
        const resultados = carga.datos;

        if (!activo) return;

        const cohortes = obtenerPeriodos(
          resultados.flatMap((item) => [
            ...item.ingresos.map((fila) => fila.cohorte),
            ...item.progresion.map((fila) => fila.cohorte),
            ...item.eficiencia.map((fila) => fila.cohorte),
            ...item.avance.map((fila) => fila.cohorte),
          ]),
        );
        const aniosMedicion = obtenerPeriodos(
          resultados.flatMap((item) => [
            ...item.matriculas.map((fila) => fila.anio_medicion),
            ...item.asignaturas.map((fila) => fila.anio_medicion),
          ]),
        );

        setFacultad(carga.facultad.nombre || carga.facultad.codigo);
        setCarreras(carga.carreras);
        setDatos(resultados);
        setCodigosSeleccionados(carga.carreras.map((carrera) => carrera.car_codigo));
        setCohorteDesde(cohortes[0] ?? null);
        setCohorteHasta(cohortes[cohortes.length - 1] ?? null);
        setAnioDesde(aniosMedicion[0] ?? null);
        setAnioHasta(aniosMedicion[aniosMedicion.length - 1] ?? null);
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
        datos.flatMap((item) => [
          ...item.matriculas.map((fila) => fila.anio_medicion),
          ...item.asignaturas.map((fila) => fila.anio_medicion),
        ]),
      ),
    [datos],
  );

  const codigosActivos = useMemo(
    () =>
      new Set(
        alcance === 'FACULTAD'
          ? carreras.map((carrera) => carrera.car_codigo)
          : codigosSeleccionados,
      ),
    [alcance, carreras, codigosSeleccionados],
  );

  const datosSeleccionados = useMemo(
    () => datos.filter((item) => codigosActivos.has(item.carrera.car_codigo)),
    [datos, codigosActivos],
  );

  const dentroDeCohorte = (cohorte: number) =>
    (cohorteDesde === null || cohorte >= cohorteDesde) &&
    (cohorteHasta === null || cohorte <= cohorteHasta);

  const dentroDeAnio = (anio: number) =>
    (anioDesde === null || anio >= anioDesde) &&
    (anioHasta === null || anio <= anioHasta);

  const identificarCarrera = (item: DatosCarreraDecanatura) => ({
    Carrera: item.carrera.nombre,
    'Código carrera': item.carrera.car_codigo,
    Sede: item.carrera.sede ?? '—',
  });

  const datosIngresos: FilaExportable[] = datosSeleccionados.flatMap((item) =>
    item.ingresos.filter((fila) => dentroDeCohorte(fila.cohorte)).map((fila) => ({
      ...identificarCarrera(item),
      Cohorte: fila.cohorte,
      'Ingresos SUA/PAES': fila.ingresos_sua,
      'Ingresos PACE': fila.ingresos_pace,
      'Ingresos especiales': fila.ingresos_especiales,
      'Ingresos totales': fila.ingresos_totales,
    })),
  );

  const datosMatricula: FilaExportable[] = datosSeleccionados.flatMap((item) =>
    item.matriculas.filter((fila) => dentroDeAnio(fila.anio_medicion)).map((fila) => ({
      ...identificarCarrera(item),
      'Año de medición': fila.anio_medicion,
      'Matrícula total': fila.matricula_total,
      'Matrícula mujeres': fila.matricula_mujeres,
      'Mujeres (%)': fila.porcentaje_mujeres,
    })),
  );

  const datosRetencion: FilaExportable[] = datosSeleccionados.flatMap((item) =>
    item.progresion.filter((fila) => dentroDeCohorte(fila.cohorte)).map((fila) => ({
      ...identificarCarrera(item),
      Cohorte: fila.cohorte,
      'Retención 1er año': fila.retencion_a1,
      'Retención 2do año': fila.retencion_a2,
      'Retención 3er año': fila.retencion_a3,
      'Retención 4to año': fila.retencion_a4,
      'Retención total': fila.retencion_total,
    })),
  );

  const datosTitulacion: FilaExportable[] = datosSeleccionados.flatMap((item) =>
    item.progresion.filter((fila) => dentroDeCohorte(fila.cohorte)).map((fila) => ({
      ...identificarCarrera(item),
      Cohorte: fila.cohorte,
      'Titulación total (TTT)': fila.tasa_titulacion_total,
      'Titulación oportuna (TTO)': fila.tasa_titulacion_oportuna,
      'Titulación efectiva (TTE)': fila.tasa_titulacion_efectiva,
      'Duración real (semestres)': fila.duracion_real_semestres,
    })),
  );

  const datosEficiencia: FilaExportable[] = datosSeleccionados.flatMap((item) =>
    item.eficiencia.filter((fila) => dentroDeCohorte(fila.cohorte)).map((fila) => ({
      ...identificarCarrera(item),
      Cohorte: fila.cohorte,
      'Alumnos regulares': fila.total_alumnos_regulares,
      Baja: fila.nivel_baja,
      Media: fila.nivel_media,
      Alta: fila.nivel_alta,
      Eficiente: fila.nivel_eficiente,
    })),
  );

  const datosAvance: FilaExportable[] = datosSeleccionados.flatMap((item) =>
    item.avance.filter((fila) => dentroDeCohorte(fila.cohorte)).map((fila) => ({
      ...identificarCarrera(item),
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

  const datosAsignaturas: FilaExportable[] = datosSeleccionados.flatMap((item) =>
    item.asignaturas
      .filter(
        (fila) =>
          dentroDeAnio(fila.anio_medicion),
      )
      .map((fila) => ({
        ...identificarCarrera(item),
        'Código base': fila.asig_codigo_base,
        'Código completo': fila.asig_codigo,
        Semestre: fila.semestre,
        'Año de medición': fila.anio_medicion,
        'Tasa de reprobación (%)': fila.tasa_reprobacion,
        'Estado del dato': fila.estado_dato ?? 'Sin datos',
      })),
  );

  const columnasCarrera: ColumnaTabla[] = [
    { llave: 'Carrera', etiqueta: 'Carrera' },
    { llave: 'Código carrera', etiqueta: 'Código' },
    { llave: 'Sede', etiqueta: 'Sede' },
  ];

  const modulos: ModuloReporteria[] = codigosActivos.size === 0
    ? []
    : [
        crearModuloTabla(
          'reporteria-decano-ingresos',
          'Ingresos por cohorte',
          CATEGORIA_ANALITICA,
          'Cantidades informadas por vía de admisión para cada carrera y cohorte.',
          [
            ...columnasCarrera,
            { llave: 'Cohorte', etiqueta: 'Cohorte' },
            { llave: 'Ingresos SUA/PAES', etiqueta: 'SUA/PAES' },
            { llave: 'Ingresos PACE', etiqueta: 'PACE' },
            { llave: 'Ingresos especiales', etiqueta: 'Especiales' },
            { llave: 'Ingresos totales', etiqueta: 'Total' },
          ],
          datosIngresos, INDICADORES_INGRESOS,
        ),
        crearModuloTabla(
          'reporteria-decano-matricula',
          'Matrícula anual',
          CATEGORIA_ANALITICA,
          'Matrícula total y de mujeres por carrera y año de medición.',
          [
            ...columnasCarrera,
            { llave: 'Año de medición', etiqueta: 'Año' },
            { llave: 'Matrícula total', etiqueta: 'Total' },
            { llave: 'Matrícula mujeres', etiqueta: 'Mujeres' },
            { llave: 'Mujeres (%)', etiqueta: 'Mujeres', porcentaje: true },
          ],
          datosMatricula, INDICADORES_MATRICULA,
        ),
        crearModuloTabla(
          'reporteria-decano-retencion',
          'Tasas de retención',
          CATEGORIA_ANALITICA,
          'Tasas informadas para cada carrera y cohorte, sin recalcular promedios de facultad.',
          [
            ...columnasCarrera,
            { llave: 'Cohorte', etiqueta: 'Cohorte' },
            { llave: 'Retención 1er año', etiqueta: '1er año', porcentaje: true },
            { llave: 'Retención 2do año', etiqueta: '2do año', porcentaje: true },
            { llave: 'Retención 3er año', etiqueta: '3er año', porcentaje: true },
            { llave: 'Retención 4to año', etiqueta: '4to año', porcentaje: true },
            { llave: 'Retención total', etiqueta: 'Total', porcentaje: true },
          ],
          datosRetencion, INDICADORES_RETENCION,
        ),
        crearModuloTabla(
          'reporteria-decano-titulacion',
          'Titulación y duración real',
          CATEGORIA_ANALITICA,
          'Indicadores TTT, TTO, TTE y duración real entregados para cada carrera y cohorte.',
          [
            ...columnasCarrera,
            { llave: 'Cohorte', etiqueta: 'Cohorte' },
            { llave: 'Titulación total (TTT)', etiqueta: 'TTT', porcentaje: true },
            { llave: 'Titulación oportuna (TTO)', etiqueta: 'TTO', porcentaje: true },
            { llave: 'Titulación efectiva (TTE)', etiqueta: 'TTE', porcentaje: true },
            { llave: 'Duración real (semestres)', etiqueta: 'Duración' },
          ],
          datosTitulacion, INDICADORES_TITULACION,
        ),
        crearModuloTabla(
          'reporteria-decano-eficiencia',
          'Eficiencia curricular por cohorte',
          CATEGORIA_CURRICULAR,
          'Cantidades de estudiantes por tramo, mostradas tal como fueron informadas.',
          [
            ...columnasCarrera,
            { llave: 'Cohorte', etiqueta: 'Cohorte' },
            { llave: 'Alumnos regulares', etiqueta: 'Regulares' },
            { llave: 'Baja', etiqueta: 'Baja' },
            { llave: 'Media', etiqueta: 'Media' },
            { llave: 'Alta', etiqueta: 'Alta' },
            { llave: 'Eficiente', etiqueta: 'Eficiente' },
          ],
          datosEficiencia, INDICADORES_EFICIENCIA, 'eficiencia',
        ),
        crearModuloTabla(
          'reporteria-decano-avance',
          'Avance por ciclo formativo',
          CATEGORIA_CURRICULAR,
          'Porcentajes informados para las cinco categorías de avance curricular.',
          [
            ...columnasCarrera,
            { llave: 'Cohorte', etiqueta: 'Cohorte' },
            { llave: 'Bachillerato (%)', etiqueta: 'Bach.', porcentaje: true },
            {
              llave: 'Lic. con Bach. pendiente (%)',
              etiqueta: 'Lic. / Bach. pend.',
              porcentaje: true,
            },
            { llave: 'Licenciatura (%)', etiqueta: 'Lic.', porcentaje: true },
            {
              llave: 'Título con pendientes (%)',
              etiqueta: 'Título / pend.',
              porcentaje: true,
            },
            { llave: 'Título (%)', etiqueta: 'Título', porcentaje: true },
          ],
          datosAvance, COLUMNAS_AVANCE, 'avance',
        ),
        crearModuloTabla(
          'reporteria-decano-asignaturas',
          'Asignaturas informadas en la carga',
          CATEGORIA_CURRICULAR,
          'Códigos y tasas consignados en el Excel; no se clasifican nuevamente como críticas.',
          [
            ...columnasCarrera,
            { llave: 'Código base', etiqueta: 'Código base' },
            { llave: 'Código completo', etiqueta: 'Código completo' },
            { llave: 'Semestre', etiqueta: 'Sem.' },
            { llave: 'Año de medición', etiqueta: 'Año' },
            {
              llave: 'Tasa de reprobación (%)',
              etiqueta: 'Reprobación',
              porcentaje: true,
            },
          ],
          datosAsignaturas, INDICADORES_ASIGNATURA, 'asignaturas',
        ),
      ];

  const cambiarSeleccionCarrera = (codigo: string) => {
    setCodigosSeleccionados((actuales) =>
      actuales.includes(codigo)
        ? actuales.filter((actual) => actual !== codigo)
        : [...actuales, codigo],
    );
  };

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

  const cantidadCarreras = codigosActivos.size;
  const filtrosActivos = `${facultad} · ${
    alcance === 'FACULTAD' ? 'Facultad' : `${cantidadCarreras} carreras`
  } · C ${cohorteDesde ?? '—'}-${cohorteHasta ?? '—'} · A ${anioDesde ?? '—'}-${
    anioHasta ?? '—'
  }`;

  const configuracion = (
    <div className="space-y-7">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
          1. Alcance académico
        </p>
        <h2 className="mt-1 text-lg font-bold text-slate-800">Define las carreras del reporte</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="flex cursor-pointer gap-3 rounded-lg border border-slate-200 p-4 hover:bg-slate-50">
            <input
              type="radio"
              name="alcance-reporte-decano"
              value="FACULTAD"
              checked={alcance === 'FACULTAD'}
              onChange={() => setAlcance('FACULTAD')}
              disabled={cargando}
            />
            <span>
              <span className="block text-sm font-semibold text-slate-800">Facultad completa</span>
              <span className="mt-1 block text-xs text-slate-500">
                Incluye las {carreras.length} carreras autorizadas para esta cuenta.
              </span>
            </span>
          </label>
          <label className="flex cursor-pointer gap-3 rounded-lg border border-slate-200 p-4 hover:bg-slate-50">
            <input
              type="radio"
              name="alcance-reporte-decano"
              value="SELECCION"
              checked={alcance === 'SELECCION'}
              onChange={() => setAlcance('SELECCION')}
              disabled={cargando}
            />
            <span>
              <span className="block text-sm font-semibold text-slate-800">Carreras específicas</span>
              <span className="mt-1 block text-xs text-slate-500">
                Permite incluir una o varias carreras de la facultad.
              </span>
            </span>
          </label>
        </div>

        {alcance === 'SELECCION' && (
          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50/60 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-700">
                {codigosSeleccionados.length} de {carreras.length} carreras seleccionadas
              </p>
              <div className="flex gap-3 text-xs font-semibold text-[#004d99]">
                <button
                  type="button"
                  onClick={() =>
                    setCodigosSeleccionados(carreras.map((carrera) => carrera.car_codigo))
                  }
                >
                  Seleccionar todas
                </button>
                <button type="button" onClick={() => setCodigosSeleccionados([])}>
                  Limpiar
                </button>
              </div>
            </div>
            <div className="grid max-h-56 gap-2 overflow-y-auto pr-2 sm:grid-cols-2">
              {carreras.map((carrera) => (
                <label
                  key={carrera.car_codigo}
                  className="flex cursor-pointer items-start gap-2 rounded-md bg-white px-3 py-2 text-sm text-slate-700"
                >
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={codigosSeleccionados.includes(carrera.car_codigo)}
                    onChange={() => cambiarSeleccionCarrera(carrera.car_codigo)}
                  />
                  <span>
                    <span className="block font-semibold">{carrera.nombre}</span>
                    <span className="text-xs text-slate-500">
                      {carrera.car_codigo}{carrera.sede ? ` · ${carrera.sede}` : ''}
                    </span>
                  </span>
                </label>
              ))}
            </div>
            {codigosSeleccionados.length === 0 && (
              <p className="mt-3 text-sm font-medium text-red-600">
                Selecciona al menos una carrera para habilitar la descarga.
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
          Las cohortes se aplican a progresión y avance; los años de medición se aplican a matrícula y asignaturas.
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
        <span className="font-semibold">Configuración actual:</span> {facultad} ·{' '}
        {cantidadCarreras} {cantidadCarreras === 1 ? 'carrera' : 'carreras'} · cohortes{' '}
        {cohorteDesde ?? '—'}–{cohorteHasta ?? '—'} · años {anioDesde ?? '—'}–{anioHasta ?? '—'}.
      </div>
    </div>
  );

  return (
    <ReporteriaView
      reportTitle="Reportería Decanato"
      activeFilters={filtrosActivos}
      etiqueta="DECANATO"
      subtitulo="Elige indicadores y su presentación: tabla, gráfico o ambos. Los gráficos se separan por carrera, sin promedios de facultad."
      modulos={modulos}
      configuracion={configuracion}
      formatosDisponibles={['pdf']}
      etiquetaBotonPdf="Descargar reporte PDF"
      descripcionHistorial="Consulta el registro de reportes generados anteriormente."
      loading={cargando}
      error={error}
    />
  );
}

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
    <label className="text-sm font-semibold text-slate-700">
      {etiqueta}
      <select
        value={valor ?? ''}
        onChange={(evento) => onChange(Number(evento.target.value))}
        disabled={opciones.length === 0}
        className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm font-semibold text-[#0A192F] outline-none focus:border-[#FFB800] focus:ring-2 focus:ring-[#FFB800]/20 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {opciones.length === 0 && <option value="">Sin períodos</option>}
        {opciones.map((opcion) => (
          <option key={opcion} value={opcion}>
            {opcion}
          </option>
        ))}
      </select>
    </label>
  );
}
