import { useMemo, useState } from 'react';
import type { CarreraDecanatura } from '../api';
import type { DatosCarreraDecanatura } from '../facultyData';
import {
  COLUMNAS_AVANCE,
  COLUMNAS_EFICIENCIA,
  describirEstadoAsignatura,
  formatearValorCurricular,
  seleccionarAsignaturasHome,
  seleccionarCurricularHome,
} from '../homeCurricular';

interface Props {
  datos: DatosCarreraDecanatura[];
  cohorte: number | null;
  anioMedicion: number | null;
}

function IdentidadCarrera({ carrera }: { carrera: CarreraDecanatura }) {
  return (
    <>
      <p className="font-semibold text-slate-900">{carrera.nombre}</p>
      <p className="mt-0.5 text-xs font-normal text-slate-500">
        {carrera.car_codigo}{carrera.sede ? ` · ${carrera.sede}` : ''}
      </p>
    </>
  );
}

interface TablaResumenProps {
  id: string;
  titulo: string;
  descripcion: string;
  cohorte: number | null;
  columnas: ReadonlyArray<{ llave: string; titulo: string }>;
  filas: Array<{ carrera: CarreraDecanatura; valores: Array<number | null | undefined> }>;
  porcentaje?: boolean;
}

function TablaResumenCarreras({ id, titulo, descripcion, cohorte, columnas, filas, porcentaje = false }: TablaResumenProps) {
  const hayDatos = filas.some((fila) => fila.valores.some((valor) => valor != null));

  return (
    <section aria-labelledby={id} className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
      <div className="border-b border-slate-100 p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
          Cohorte {cohorte ?? 'sin seleccionar'} · {porcentaje ? 'Porcentajes informados' : 'Cantidades informadas'}
        </p>
        <h2 id={id} className="mt-1 text-lg font-bold text-slate-800">{titulo}</h2>
        <p className="mt-1 text-xs leading-5 text-slate-500">{descripcion}</p>
      </div>
      {!hayDatos && (
        <p className="bg-slate-50 px-6 py-4 text-sm text-slate-500">
          No hay valores informados para la cohorte seleccionada.
        </p>
      )}
      {filas.length > 0 && (
        <div className="max-h-[460px] overflow-auto" role="region" aria-label={`Tabla: ${titulo}`} tabIndex={0}>
          <table className="w-full min-w-[1000px] border-collapse text-left text-sm">
            <caption className="sr-only">{titulo} · Cohorte {cohorte ?? 'sin seleccionar'}</caption>
            <thead className="sticky top-0 z-10 bg-[#FFF9E6]">
              <tr>
                <th scope="col" className="min-w-[250px] border-b border-slate-200 px-6 py-3 font-semibold text-slate-700">Carrera</th>
                {columnas.map((columna) => (
                  <th scope="col" key={columna.llave} className="min-w-[120px] border-b border-slate-200 px-4 py-3 text-center font-semibold text-slate-700">
                    {columna.titulo}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {filas.map(({ carrera, valores }) => (
                <tr key={carrera.car_codigo} className="hover:bg-slate-50/60">
                  <th scope="row" className="px-6 py-3.5"><IdentidadCarrera carrera={carrera} /></th>
                  {columnas.map((columna, indice) => (
                    <td key={columna.llave} className="px-4 py-3.5 text-center tabular-nums">
                      <span className={valores[indice] == null ? 'text-xs text-slate-500' : undefined}>
                        {formatearValorCurricular(valores[indice], porcentaje)}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="border-t border-slate-100 px-6 py-3 text-xs text-slate-500">
        “Sin datos” no equivale a cero. Las carreras sin información para esta cohorte permanecen visibles.
      </p>
    </section>
  );
}

export function HomeCurricularDecano({ datos, cohorte, anioMedicion }: Props) {
  const [codigoCarrera, setCodigoCarrera] = useState('');
  const curricular = useMemo(() => seleccionarCurricularHome(datos, cohorte), [datos, cohorte]);
  const codigoActivo = datos.some((item) => item.carrera.car_codigo === codigoCarrera) ? codigoCarrera : '';
  const asignaturas = useMemo(
    () => seleccionarAsignaturasHome(datos, anioMedicion, codigoActivo),
    [datos, anioMedicion, codigoActivo],
  );

  return (
    <>
      <TablaResumenCarreras
        id="home-decano-eficiencia"
        titulo="Resumen de eficiencia curricular"
        descripcion="Alumnos regulares y cantidades por tramo de cada carrera, tal como fueron informados. No se recalculan los tramos ni se convierten en porcentajes."
        cohorte={cohorte}
        columnas={COLUMNAS_EFICIENCIA}
        filas={curricular.map(({ carrera, eficiencia }) => ({
          carrera, valores: COLUMNAS_EFICIENCIA.map(({ llave }) => eficiencia?.[llave]),
        }))}
      />
      <TablaResumenCarreras
        id="home-decano-avance"
        titulo="Avance curricular por carrera"
        descripcion="Porcentajes de alumnos regulares por categoría de avance, informados para cada carrera. No se promedian entre carreras ni se ajustan para completar el 100%."
        cohorte={cohorte}
        columnas={COLUMNAS_AVANCE}
        filas={curricular.map(({ carrera, avance }) => ({
          carrera, valores: COLUMNAS_AVANCE.map(({ llave }) => avance?.[llave]),
        }))}
        porcentaje
      />
      <section aria-labelledby="home-decano-asignaturas" className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Año de medición {anioMedicion ?? 'sin seleccionar'}
          </p>
          <h2 id="home-decano-asignaturas" className="mt-1 text-lg font-bold text-slate-800">Asignaturas informadas</h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Registros del Excel por carrera, código y semestre. Se conserva la tasa de reprobación informada,
            sin aplicar umbrales ni clasificaciones adicionales. Los guiones y vacíos no se interpretan como 0%.
          </p>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
            <label className="w-full text-sm font-semibold text-slate-700 sm:max-w-md">
              Carrera de las asignaturas
              <select
                value={codigoActivo}
                onChange={(evento) => setCodigoCarrera(evento.target.value)}
                disabled={datos.length === 0}
                className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm text-[#0A192F] outline-none focus:border-[#FFB800] focus:ring-2 focus:ring-[#FFB800]/20 disabled:opacity-60"
              >
                <option value="">Todas las carreras de la facultad</option>
                {curricular.map(({ carrera }) => (
                  <option key={carrera.car_codigo} value={carrera.car_codigo}>
                    {carrera.nombre} · {carrera.car_codigo}{carrera.sede ? ` · ${carrera.sede}` : ''}
                  </option>
                ))}
              </select>
            </label>
            <p role="status" className="text-xs text-slate-500">
              {asignaturas.length} registros para la selección · no son asignaturas únicas
            </p>
          </div>
        </div>
        {asignaturas.length === 0 ? (
          <p className="px-6 py-8 text-sm text-slate-500">
            No hay registros de asignaturas para el año y la carrera seleccionados.
          </p>
        ) : (
          <div className="max-h-[460px] overflow-auto" role="region" aria-label="Tabla: Asignaturas informadas" tabIndex={0}>
            <table className="w-full min-w-[1000px] border-collapse text-left text-sm">
              <caption className="sr-only">Asignaturas informadas · Año de medición {anioMedicion}</caption>
              <thead className="sticky top-0 z-10 bg-[#FFF9E6]">
                <tr>
                  {['Carrera', 'Código completo', 'Código base', 'Semestre', 'Tasa de reprobación', 'Estado del dato'].map((titulo) => (
                    <th key={titulo} scope="col" className="border-b border-slate-200 px-5 py-3 font-semibold text-slate-700">{titulo}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {asignaturas.map(({ carrera, asignatura }) => (
                  <tr key={JSON.stringify([carrera.car_codigo, asignatura.asig_codigo, asignatura.semestre, asignatura.anio_medicion])} className="hover:bg-slate-50/60">
                    <th scope="row" className="px-5 py-3.5"><IdentidadCarrera carrera={carrera} /></th>
                    <td className="px-5 py-3.5 font-medium text-slate-900">{asignatura.asig_codigo}</td>
                    <td className="px-5 py-3.5">{asignatura.asig_codigo_base}</td>
                    <td className="px-5 py-3.5 tabular-nums">{formatearValorCurricular(asignatura.semestre)}</td>
                    <td className="px-5 py-3.5 tabular-nums">{formatearValorCurricular(asignatura.tasa_reprobacion, true)}</td>
                    <td className="px-5 py-3.5 text-xs">{describirEstadoAsignatura(asignatura.estado_dato)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
