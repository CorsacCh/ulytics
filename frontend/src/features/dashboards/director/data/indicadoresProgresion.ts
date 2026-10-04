// Catálogo de indicadores de progresión analítica.
//
// Vive aparte de los componentes porque React Fast Refresh no admite archivos
// que exporten componentes y constantes a la vez, y tanto las vistas de
// progresión como la de reportería consumen estas definiciones.

// Un indicador es una fila de la tabla: el título visible y la columna del
// endpoint que se lee para cada periodo (año o cohorte).
export interface Indicador {
  titulo: string;
  llave: string;
  tipo?: 'numero' | 'porcentaje';
}

// Dataset ya despivotado: un valor por indicador para cada periodo.
export interface FilaPeriodo {
  periodo: number;
  valores: Record<string, number | null>;
}

export const INDICADORES_MATRICULA: Indicador[] = [
  { titulo: 'Matrícula nueva según cohorte', llave: 'ingresos_totales'},
  { titulo: 'Matrícula admisión regular (SUA/PAES)', llave: 'ingresos_sua' },
  { titulo: 'Matrícula admisión especial PACE', llave: 'ingresos_pace'},
  { titulo: 'Matrícula ingreso Especial RAE', llave: 'ingresos_rae' },
  { titulo: 'Matrícula Total', llave: 'matricula_total' },
  { titulo: '% Mujeres (matrícula total)', llave: 'pct_mujeres', tipo:'porcentaje' },
];

export const INDICADORES_RETENCION: Indicador[] = [
  { titulo: '1er año por cohorte', llave: 'retencion_a1', tipo: 'porcentaje' },
  { titulo: '2do año por cohorte', llave: 'retencion_a2', tipo: 'porcentaje' },
  { titulo: '3er año por cohorte', llave: 'retencion_a3', tipo: 'porcentaje' },
  { titulo: '4to año por cohorte', llave: 'retencion_a4', tipo: 'porcentaje' },
  { titulo: 'Retención total', llave: 'retencion_total', tipo: 'porcentaje' },
];

export const INDICADORES_TITULACION: Indicador[] = [
  {
    titulo: 'Tasa de titulación temprana (TTT)',
    llave: 'tasa_titulacion_temprana',
    tipo: 'porcentaje',
  },
  {
    titulo: 'Tasa de titulación oportuna (TTO)',
    llave: 'tasa_titulacion_oportuna',
    tipo: 'porcentaje',
  },
  {
    titulo: 'Tasa de titulación efectiva (TTE)',
    llave: 'tasa_titulacion_efectiva',
    tipo: 'porcentaje',
  },
  { titulo: 'Tiempo promedio (semestres)', llave: 'duracion_real_semestres' },
];