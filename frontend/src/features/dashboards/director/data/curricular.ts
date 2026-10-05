// Definiciones compartidas de progresión curricular.
//
// Separado del componente porque React Fast Refresh no admite archivos que
// exporten componentes y constantes a la vez, y tanto la vista de progresión
// curricular como la de reportería consumen estos símbolos.
import type { Indicador } from './indicadoresProgresion';

export type { Indicador };

// Una fila del endpoint /api/reporteria/:car_codigo/curricular
export interface FilaEficiencia {
  cohorte: number;
  total_alumnos_regulares: number | null;
  nivel_baja: number | null;
  nivel_media: number | null;
  nivel_alta: number | null;
  nivel_eficiente: number | null;
}

export interface FilaAvanceCurricular {
  cohorte: number;
  porcentaje_bachillerato: number | null;
  porcentaje_licenciatura_con_bachillerato_pendiente: number | null;
  porcentaje_licenciatura: number | null;
  porcentaje_titulo_con_bachillerato_licenciatura_pendiente: number | null;
  porcentaje_titulo: number | null;
}

export interface FilaCritica {
  asig_codigo_base: string;
  asig_codigo: string;
  semestre: number | null;
  anio_medicion: number;
  tasa_reprobacion: number | null;
  estado_dato: string | null;
}

// Una asignatura-semestre con su tasa de reprobación por año.
export interface FilaAsignaturaCritica {
  codigo: string;
  semestre: number | null;
  valores: Record<number, number | null>;
}

// Las columnas nivel_* son conteos de estudiantes, no porcentajes: se muestran tal cual.
export const INDICADORES_EFICIENCIA: Indicador[] = [
  { titulo: 'Nº Alumnos regulares', llave: 'total_alumnos_regulares' },
  { titulo: 'Baja (entre 0<60%)', llave: 'nivel_baja' },
  { titulo: 'Media (entre 61 y <80%)', llave: 'nivel_media' },
  { titulo: 'Alta (entre 80 <100%)', llave: 'nivel_alta' },
  { titulo: 'Eficiente =100%', llave: 'nivel_eficiente' },
];

export const COLUMNAS_AVANCE: Indicador[] = [
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

export const SIN_DATOS = 'Todavía no hay datos cargados para esta carrera.';

// Los períodos se derivan del propio dataset: si la carga no trae uno, no aparece la columna.
export function obtenerAnios(anios: number[]): number[] {
  return [...new Set(anios)].sort((a, b) => a - b);
}

// El endpoint devuelve una fila por asignatura y año de medición; la tabla necesita una fila
// por código base y semestre, así que agrupamos las versiones del mismo código institucional.
export function agruparAsignaturasCriticas(criticas: FilaCritica[]): FilaAsignaturaCritica[] {
  const agrupadas = new Map<string, FilaAsignaturaCritica>();

  criticas.forEach((critica) => {
    const clave = `${critica.asig_codigo_base}-${critica.semestre ?? 'sin-semestre'}`;
    const fila = agrupadas.get(clave) ?? {
      codigo: critica.asig_codigo_base,
      semestre: critica.semestre,
      valores: {},
    };

    fila.valores[critica.anio_medicion] = critica.tasa_reprobacion;
    agrupadas.set(clave, fila);
  });

  return [...agrupadas.values()];
}
