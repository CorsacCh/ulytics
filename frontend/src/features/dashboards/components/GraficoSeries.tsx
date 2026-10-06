import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatearDato, prepararSeries, type FilaSerie, type IndicadorSerie } from './series';

const COLORES = ['#2563eb', '#0f766e', '#b45309', '#7c3aed', '#be185d'];

export function GraficoSeries({ filas, indicadores, eje = 'Cohorte', exportacion = false }: {
  filas: FilaSerie[];
  indicadores: IndicadorSerie[];
  eje?: string;
  exportacion?: boolean;
}) {
  // Cada unidad tiene su propio gráfico: nunca mezclar alumnos, porcentajes y semestres.
  const tipos = [...new Set(indicadores.map((indicador) => indicador.tipo ?? 'cantidad'))];
  return (
    <div className="space-y-6">
      {tipos.map((tipo) => {
        const series = indicadores.filter((indicador) => (indicador.tipo ?? 'cantidad') === tipo);
        const datos = prepararSeries(filas, series);
        const disponibles = datos.some((fila) => series.some(({ llave }) => fila[llave] != null));
        const unidad = tipo === 'porcentaje' ? 'Porcentaje (%)' : tipo === 'decimal' ? 'Semestres' : 'Cantidad de estudiantes';
        return (
          <section key={tipo} data-pdf-block="true" aria-label={`${unidad} por ${eje.toLowerCase()}`}>
            <p className="mb-3 text-sm font-semibold text-slate-600">{unidad} · {eje}</p>
            {!disponibles ? <p className="py-8 text-sm text-slate-500">Sin datos para la selección actual.</p> : (
              <div style={{ height: 350, width: '100%' }}>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={datos} margin={{ top: 10, right: 24, left: 10, bottom: 20 }} accessibilityLayer>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="periodo" tick={{ fontSize: 12 }} minTickGap={12} />
                    <YAxis width={65} allowDecimals={tipo !== 'cantidad'} domain={tipo === 'porcentaje' ? [0, 100] : [0, 'auto']}
                      tickFormatter={(valor: number) => formatearDato(valor, tipo)} tick={{ fontSize: 12 }} />
                    <Tooltip filterNull={false} formatter={(valor, nombre) => [formatearDato(typeof valor === 'number' ? valor : null, tipo), nombre]} />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
                    {series.map((serie, indice) => (
                      <Line key={serie.llave} dataKey={serie.llave} name={serie.titulo} type="linear"
                        stroke={COLORES[indice % COLORES.length]} strokeWidth={2} dot={{ r: 3 }}
                        connectNulls={false} isAnimationActive={!exportacion} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>
        );
      })}
      <p className="text-xs text-slate-500">Valores informados en la carga. Los datos ausentes no equivalen a cero.</p>
    </div>
  );
}
