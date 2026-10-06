import type { IndicadorSerie } from '../components/series';

// Usa las mismas columnas/filas que la tabla PDF. No recalcula indicadores.
export function seriesDesdeTabla(filas: Record<string, unknown>[], columnas: string[], indicadores: IndicadorSerie[]) {
  if (columnas.length !== indicadores.length + 1) throw new Error('Las columnas del gráfico no coinciden con la tabla.');
  return filas.map((fila) => ({
    periodo: Number(fila[columnas[0]]),
    valores: Object.fromEntries(indicadores.map((indicador, indice) => [
      indicador.llave, typeof fila[columnas[indice + 1]] === 'number' ? fila[columnas[indice + 1]] as number : null,
    ])),
  }));
}

export const INDICADORES_MATRICULA: IndicadorSerie[] = [
  { titulo: 'Matrícula total', llave: 'matricula_total' },
  { titulo: 'Matrícula de mujeres', llave: 'matricula_mujeres' },
  { titulo: '% Mujeres sobre matrícula total', llave: 'porcentaje_mujeres', tipo: 'porcentaje' },
];

export const INDICADORES_INGRESOS: IndicadorSerie[] = [
  { titulo: 'Ingresos SUA', llave: 'ingresos_sua' },
  { titulo: 'Ingresos PACE', llave: 'ingresos_pace' },
  { titulo: 'Ingresos especiales (RAE)', llave: 'ingresos_especiales' },
  { titulo: 'Ingresos totales', llave: 'ingresos_totales' },
];

export const INDICADORES_RETENCION: IndicadorSerie[] = [
  { titulo: 'Retención de 1er año', llave: 'retencion_a1', tipo: 'porcentaje' },
  { titulo: 'Retención de 2do año', llave: 'retencion_a2', tipo: 'porcentaje' },
  { titulo: 'Retención de 3er año', llave: 'retencion_a3', tipo: 'porcentaje' },
  { titulo: 'Retención de 4to año', llave: 'retencion_a4', tipo: 'porcentaje' },
  { titulo: 'Retención total', llave: 'retencion_total', tipo: 'porcentaje' },
];

export const INDICADORES_TITULACION: IndicadorSerie[] = [
  { titulo: 'Tasa de titulación total (TTT)', llave: 'tasa_titulacion_total', tipo: 'porcentaje' },
  { titulo: 'Tasa de titulación oportuna (TTO)', llave: 'tasa_titulacion_oportuna', tipo: 'porcentaje' },
  { titulo: 'Tasa de titulación efectiva (TTE)', llave: 'tasa_titulacion_efectiva', tipo: 'porcentaje' },
  { titulo: 'Duración real (semestres)', llave: 'duracion_real_semestres', tipo: 'decimal' },
];

export const INDICADORES_EFICIENCIA: IndicadorSerie[] = [
  { titulo: 'Nº de alumnos regulares', llave: 'total_alumnos_regulares' },
  { titulo: 'Baja (entre 0<60%)', llave: 'nivel_baja' },
  { titulo: 'Media (entre 61 y <80%)', llave: 'nivel_media' },
  { titulo: 'Alta (entre 80 <100%)', llave: 'nivel_alta' },
  { titulo: 'Eficiente =100%', llave: 'nivel_eficiente' },
];

export const COLUMNAS_AVANCE: IndicadorSerie[] = [
  { titulo: 'Bachillerato', llave: 'porcentaje_bachillerato', tipo: 'porcentaje' },
  {
    titulo: 'Licenciatura con asignaturas pendientes de Bachillerato',
    llave: 'porcentaje_licenciatura_con_bachillerato_pendiente',
    tipo: 'porcentaje',
  },
  { titulo: 'Licenciatura', llave: 'porcentaje_licenciatura', tipo: 'porcentaje' },
  {
    titulo: 'Título con pendientes de Bachillerato o Licenciatura',
    llave: 'porcentaje_titulo_con_bachillerato_licenciatura_pendiente',
    tipo: 'porcentaje',
  },
  { titulo: 'Título', llave: 'porcentaje_titulo', tipo: 'porcentaje' },
];
