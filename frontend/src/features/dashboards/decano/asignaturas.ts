import type { FilaAsignaturaInformada } from './api';
import type { FilaSerie } from '../components/series';

export interface AsignaturaAgrupada {
  clave: string;
  codigo: string;
  semestre: number | null;
  valores: Record<number, number | null>;
}

// No fusionar versiones distintas del código ni distintos semestres.
export function agruparAsignaturas(filas: FilaAsignaturaInformada[]): AsignaturaAgrupada[] {
  const grupos = new Map<string, AsignaturaAgrupada>();
  for (const origen of filas) {
    const clave = JSON.stringify([origen.asig_codigo, origen.semestre]);
    const fila = grupos.get(clave) ?? { clave, codigo: origen.asig_codigo, semestre: origen.semestre, valores: {} };
    fila.valores[origen.anio_medicion] = origen.tasa_reprobacion;
    grupos.set(clave, fila);
  }
  return [...grupos.values()].sort((a, b) => a.codigo.localeCompare(b.codigo) || (a.semestre ?? 0) - (b.semestre ?? 0));
}

export function serieAsignatura(fila: AsignaturaAgrupada, anios: number[]): FilaSerie[] {
  return anios.map((periodo) => ({ periodo, valores: { tasa_reprobacion: fila.valores[periodo] ?? null } }));
}

export const INDICADORES_ASIGNATURA = [{ titulo: 'Tasa de reprobación informada', llave: 'tasa_reprobacion', tipo: 'porcentaje' as const }];
