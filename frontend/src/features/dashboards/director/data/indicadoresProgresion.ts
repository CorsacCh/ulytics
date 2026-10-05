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

export const INDICADORES_INGRESOS: Indicador[] = [
  { titulo: 'Ingresos SUA/PAES', llave: 'ingresos_sua' },
  { titulo: 'Ingresos PACE', llave: 'ingresos_pace' },
  { titulo: 'Ingresos especiales (RAE)', llave: 'ingresos_especiales' },
  { titulo: 'Ingresos totales', llave: 'ingresos_totales' },
];

export const INDICADORES_MATRICULA: Indicador[] = [
  { titulo: 'Matrícula total', llave: 'matricula_total' },
  { titulo: 'Matrícula de mujeres', llave: 'matricula_mujeres' },
  { titulo: '% Mujeres sobre matrícula total', llave: 'porcentaje_mujeres', tipo: 'porcentaje' },
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
    titulo: 'Tasa de titulación total (TTT)',
    llave: 'tasa_titulacion_total',
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
