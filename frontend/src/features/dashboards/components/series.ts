export type TipoValor = 'cantidad' | 'porcentaje' | 'decimal';

export interface IndicadorSerie {
  titulo: string;
  llave: string;
  tipo?: TipoValor;
}

export interface FilaSerie {
  periodo: number;
  valores: Record<string, number | null>;
}

export type RangoPeriodo = readonly [number | 'todos', number | 'todos'];

export function enRango(periodo: number, [desde, hasta]: RangoPeriodo): boolean {
  return (desde === 'todos' || periodo >= desde) && (hasta === 'todos' || periodo <= hasta);
}

export function periodosUnicos(periodos: number[]): number[] {
  return [...new Set(periodos)].sort((a, b) => a - b);
}

export function formatearDato(valor: number | null | undefined, tipo: TipoValor = 'cantidad'): string {
  if (valor == null || !Number.isFinite(valor)) return 'Sin datos';
  const texto = valor.toLocaleString('es-CL', { maximumFractionDigits: tipo === 'cantidad' ? 0 : 2 });
  return tipo === 'porcentaje' ? `${texto}%` : texto;
}

// Inserta huecos explícitos, no valores calculados: no unir años ausentes con una línea.
export function prepararSeries(filas: FilaSerie[], indicadores: IndicadorSerie[]): Array<Record<string, number | null> & { periodo: number }> {
  const periodos = periodosUnicos(filas.map((fila) => fila.periodo));
  if (!periodos.length) return [];
  const porPeriodo = new Map(filas.map((fila) => [fila.periodo, fila.valores]));
  return Array.from({ length: periodos[periodos.length - 1] - periodos[0] + 1 }, (_, indice) => {
    const periodo = periodos[0] + indice;
    return {
      periodo,
      ...Object.fromEntries(indicadores.map(({ llave }) => [llave, porPeriodo.get(periodo)?.[llave] ?? null])),
    };
  });
}
