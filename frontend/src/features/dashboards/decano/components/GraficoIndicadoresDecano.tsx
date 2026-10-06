import { EficienciaCurricular } from '../../components/EficienciaCurricular';
import { AvanceCicloFormativo } from '../../components/AvanceCicloFormativo';
import { GraficoSeries } from '../../components/GraficoSeries';
import type { FilaSerie, IndicadorSerie } from '../../components/series';

export function GraficoIndicadoresDecano({ filas, indicadores, tipo = 'lineas', eje = 'Cohorte', exportacion = false }: {
  filas: FilaSerie[];
  indicadores: IndicadorSerie[];
  tipo?: 'lineas' | 'eficiencia' | 'avance';
  eje?: string;
  exportacion?: boolean;
}) {
  if (tipo === 'lineas') return <GraficoSeries filas={filas} indicadores={indicadores} eje={eje} exportacion={exportacion} />;
  const tramos = indicadores.filter(({ llave }) => llave !== 'total_alumnos_regulares');
  const disponibles = filas.some(({ valores }) => tramos.some(({ llave }) => valores[llave] != null));
  const incompletos = filas.some(({ valores }) => tramos.some(({ llave }) => valores[llave] == null));
  return <div className="space-y-4">
    <div data-pdf-block="true">
      {!disponibles ? <p className="py-8 text-sm text-slate-500">Sin datos de tramos para la selección actual.</p> : tipo === 'eficiencia' ? (
        <EficienciaCurricular mostrarCabecera={false} isExportMode={exportacion} data={filas.map(({ periodo, valores }) => ({
          cohorte: periodo, nivel_baja: valores.nivel_baja, nivel_media: valores.nivel_media,
          nivel_alta: valores.nivel_alta, nivel_eficiente: valores.nivel_eficiente,
        }))} />
      ) : (
        <AvanceCicloFormativo mostrarCabecera={false} isExportMode={exportacion} data={filas.map(({ periodo, valores }) => ({
          cohorte: periodo, porcentaje_bachillerato: valores.porcentaje_bachillerato,
          porcentaje_licenciatura_con_bachillerato_pendiente: valores.porcentaje_licenciatura_con_bachillerato_pendiente,
          porcentaje_licenciatura: valores.porcentaje_licenciatura,
          porcentaje_titulo_con_bachillerato_licenciatura_pendiente: valores.porcentaje_titulo_con_bachillerato_licenciatura_pendiente,
          porcentaje_titulo: valores.porcentaje_titulo,
        }))} />
      )}
      <p className="mt-2 text-xs text-slate-500">{incompletos ? 'Hay categorías sin datos: las barras pueden ser parciales. Consulta la tabla. ' : ''}Valores informados, sin recalcular ni normalizar.</p>
    </div>
    {tipo === 'eficiencia' && <GraficoSeries filas={filas} indicadores={indicadores.filter(({ llave }) => llave === 'total_alumnos_regulares')} exportacion={exportacion} />}
  </div>;
}
