// Tablas de progresión curricular reutilizadas por la vista de progresión y por
// la vista de reportería. Solo exporta componentes para no romper Fast Refresh.
import { SIN_DATOS, obtenerAnios, type FilaAsignaturaCritica, type Indicador } from '../data/curricular';
import type { FilaPeriodo } from '../data/indicadoresProgresion';

interface TablaIndicadoresProps {
  titulo: string;
  descripcion: string;
  cabeceraIndicador: string;
  indicadores: Indicador[];
  filas: FilaPeriodo[];
  // Cuando la tarjeta contenedora (DataCardView) ya muestra título y descripción,
  // la tabla no repite su propia cabecera.
  mostrarCabecera?: boolean;
}

interface TablaAvanceProps {
  titulo: string;
  descripcion: string;
  columnas: Indicador[];
  filas: FilaPeriodo[];
  mostrarCabecera?: boolean;
}

interface TablaCriticasProps {
  titulo: string;
  descripcion: string;
  filas: FilaAsignaturaCritica[];
  anios: number[];
  mensajeVacio?: string;
}

function Celda({ valor, sufijo = '' }: { valor: number | null; sufijo?: string }) {
  if (valor === null || valor === undefined) {
    return <span className="text-slate-400">-</span>;
  }

  const formateado = new Intl.NumberFormat('es-CL', {
    maximumFractionDigits: sufijo === '%' ? 0 : 2,
  }).format(valor);

  return <>{`${formateado}${sufijo}`}</>;
}

// Indicadores por fila y años por columna (tabla de eficiencia curricular).
export function TablaIndicadores({
  titulo,
  descripcion,
  cabeceraIndicador,
  indicadores,
  filas,
  mostrarCabecera = true,
}: TablaIndicadoresProps) {
  const anios = obtenerAnios(filas.map((fila) => fila.periodo));

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
      {mostrarCabecera && (
        <div className="border-b border-slate-100 px-6 py-4">
          <h3 className="font-bold text-slate-800 text-lg">{titulo}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{descripcion}</p>
        </div>
      )}

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

// Cohortes por fila y categorías porcentuales de avance por columna.
export function TablaAvance({
  titulo,
  descripcion,
  columnas,
  filas,
  mostrarCabecera = true,
}: TablaAvanceProps) {
  const anios = obtenerAnios(filas.map((fila) => fila.periodo));

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
      {mostrarCabecera && (
        <div className="border-b border-slate-100 px-6 py-4">
          <h3 className="font-bold text-slate-800 text-lg">{titulo}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{descripcion}</p>
        </div>
      )}

      {anios.length === 0 ? (
        <div className="px-6 py-8 text-sm text-slate-500">{SIN_DATOS}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-[#FFF9E6]">
                <th className="py-3 px-6 font-semibold text-slate-700 border-b border-slate-200">
                  Cohorte
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
                        sufijo={columna.tipo === 'porcentaje' ? '%' : ''}
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
export function TablaAsignaturasCriticas({
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
                  Códigos de asignaturas
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
