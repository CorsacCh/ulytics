import type { ReactNode } from 'react';
import type { ExportModule } from '../../../utils/exportUtils';

export type VistaPDF = 'tabla' | 'grafico' | 'ambos';
export interface SeccionPDF {
  id: string;
  label: string;
  tabla: () => ReactNode;
  grafico: () => ReactNode;
}
export interface ModuloPresentable extends ExportModule {
  render: () => ReactNode;
  seccionesPdf?: SeccionPDF[];
}

// La elección pertenece al documento, no al selector de vista del dashboard.
// Se expande por carrera: gráfico y luego tabla, sin agregar tasas de facultad.
export function prepararModulosPDF(modulos: ModuloPresentable[], vistas: Record<string, VistaPDF>): ModuloPresentable[] {
  return modulos.flatMap((modulo) => {
    if (!modulo.seccionesPdf) return [modulo];
    const vista = vistas[modulo.id] ?? 'tabla';
    const tipos = vista === 'ambos' ? ['grafico', 'tabla'] as const : [vista];
    return modulo.seccionesPdf.flatMap((seccion) => tipos.map((tipo) => ({
      id: `${seccion.id}-${tipo}`, label: `${modulo.label} · ${seccion.label} · ${tipo === 'tabla' ? 'Tabla' : 'Gráfico'}`,
      data: modulo.data, formats: modulo.formats, render: seccion[tipo],
    })));
  });
}
