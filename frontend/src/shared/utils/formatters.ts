// Formateo compartido de valores curriculares para Decano, Director y Autoridad.
//
// Reglas de negocio del backend (importación académica):
// - Las fracciones del Excel se normalizan a puntos porcentuales al cargar
//   (parseFractionPercentageCell convierte 0.35 en 35) y las cinco categorías de
//   avance deben sumar 100 ± 1, así que la API entrega valores 0–100. Por eso
//   aquí NO se vuelve a multiplicar por 100: haría que 0,5% se mostrara como 50%.
// - 0 es un valor real; vacíos y guiones llegan como null (estado_dato).
export function formatearValorCurricular(valor: number | null | undefined, porcentaje = false): string {
  if (valor == null) return 'Sin datos';
  return `${valor.toLocaleString('es-CL', { maximumFractionDigits: 1 })}${porcentaje ? '%' : ''}`;
}

export function describirEstadoAsignatura(estado: string | null): string {
  switch (estado) {
    case 'INFORMADO': return 'Informado';
    case 'GUION_ORIGEN': return 'Guion en el Excel';
    case 'VACIO_ORIGEN': return 'Celda vacía en el Excel';
    default: return 'Estado no disponible';
  }
}

// Fila plana de asignaturas (una fila por asignatura, semestre y año): el
// mínimo estructural que necesita el pivot.
export interface FilaAsignaturaAnio {
  asig_codigo: string;
  asig_codigo_base?: string | null;
  semestre?: number | null;
  anio_medicion: number;
  tasa_reprobacion: number | null;
  estado_dato?: string | null;
}

export interface AsignaturaAgrupada<T> {
  codigo_completo: string;
  codigo_base: string;
  semestre: number | null;
  valoresPorAnio: Record<number, T>;
}

// Convierte el list plano en la estructura pivotada que exige la UX: una fila
// única por Código Base + Semestre y los años de medición como columnas. La
// ausencia de registro en un año no se inventa: la tabla lo renderiza como "-".
export function pivotarAsignaturasPorAnio<T extends FilaAsignaturaAnio>(
  asignaturas: T[],
): { anios: number[]; filas: AsignaturaAgrupada<T>[] } {
  // 1. Años únicos ordenados de forma numérica (no lexicográfica).
  const anios = [...new Set(asignaturas.map((asignatura) => asignatura.anio_medicion))]
    .sort((a, b) => a - b);

  // 2. Agrupar por Código Base + Semestre (fallback al código completo).
  const agrupado = asignaturas.reduce<Record<string, AsignaturaAgrupada<T>>>((acc, curr) => {
    const codigo = curr.asig_codigo_base || curr.asig_codigo;
    const key = `${codigo}-${curr.semestre ?? 'sin-semestre'}`;

    if (!acc[key]) {
      acc[key] = {
        codigo_completo: curr.asig_codigo,
        codigo_base: codigo,
        semestre: curr.semestre ?? null,
        valoresPorAnio: {},
      };
    }

    // Se guarda la fila completa del año para conservar tasa y estado_dato.
    acc[key].valoresPorAnio[curr.anio_medicion] = curr;
    return acc;
  }, {});

  return {
    anios,
    filas: Object.values(agrupado).sort(
      (a, b) =>
        a.codigo_base.localeCompare(b.codigo_base, 'es', { numeric: true }) ||
        (a.semestre ?? 0) - (b.semestre ?? 0),
    ),
  };
}
