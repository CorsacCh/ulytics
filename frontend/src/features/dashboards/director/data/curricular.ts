// Definiciones compartidas de progresión curricular.
//
// Separado del componente porque React Fast Refresh no admite archivos que
// exporten componentes y constantes a la vez, y tanto la vista de progresión
// curricular como la de reportería consumen estos símbolos.
import type { Indicador } from './indicadoresProgresion';

export type { Indicador };

// Una fila del endpoint /api/reporteria/:car_codigo/curricular
export interface FilaEficiencia {
  anio: number;
  total_alumnos_regulares: number | null;
  nivel_baja: number | null;
  nivel_media: number | null;
  nivel_alta: number | null;
  nivel_eficiente: number | null;
}

export interface FilaTitulacion {
  anio: number;
  bachilleratos: number | null;
  licenciaturas_asig_pendientes: number | null;
  licenciaturas: number | null;
  titulados: number | null;
}

export interface FilaCritica {
  asig_codigo: string;
  semestre: number | null;
  anio: number;
  tasa_reprobacion: number | null;
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
  { titulo: 'Bachillerato', llave: 'bachilleratos' },
  {
    titulo: 'Licenciatura con asignaturas pendientes de Bachillerato',
    llave: 'licenciaturas_asig_pendientes',
  },
  { titulo: 'Licenciatura', llave: 'licenciaturas' },
  { titulo: 'Título', llave: 'titulados' },
];

export const SIN_DATOS = 'Todavía no hay datos cargados para esta carrera.';

// Los años se derivan del propio dataset: si la carga no trae un año, no aparece la columna.
export function obtenerAnios(anios: number[]): number[] {
  return [...new Set(anios)].sort((a, b) => a - b);
}

// El endpoint devuelve una fila por asignatura y año; la tabla necesita una fila
// por asignatura-semestre, así que agrupamos conservando el orden de la consulta.
export function agruparAsignaturasCriticas(criticas: FilaCritica[]): FilaAsignaturaCritica[] {
  const agrupadas = new Map<string, FilaAsignaturaCritica>();

  criticas.forEach((critica) => {
    const clave = `${critica.asig_codigo}-${critica.semestre ?? 'sin-semestre'}`;
    const fila = agrupadas.get(clave) ?? {
      codigo: critica.asig_codigo,
      semestre: critica.semestre,
      valores: {},
    };

    fila.valores[critica.anio] = critica.tasa_reprobacion;
    agrupadas.set(clave, fila);
  });

  return [...agrupadas.values()];
}