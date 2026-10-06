// Gráfico de eficiencia curricular por cohorte (barras apiladas de conteos).
// Reutilizado por Progresión Curricular (vista) y Reportería (exportación PDF).
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { SIN_DATOS, type FilaEficiencia } from '../data/curricular';

interface Props {
  data: FilaEficiencia[];
  // En exportación (Reportería) el alto es fijo y la animación se apaga: html2canvas
  // necesita dimensiones reales y nadie está mirando la transición.
  isExportMode?: boolean;
  // Cuando la tarjeta contenedora (DataCardView) ya muestra título y descripción,
  // el gráfico no repite su propia cabecera.
  mostrarCabecera?: boolean;
}

// Colores semánticos tipo semáforo: el usuario interpreta el rendimiento de un
// vistazo sin tener que leer la leyenda (Peligro = Baja, Excelente = Eficiente).
const TRAMOS = [
  { llave: 'nivel_baja', nombre: 'Baja (0<60%)', color: '#ef4444' },
  { llave: 'nivel_media', nombre: 'Media (61-79%)', color: '#f59e0b' },
  { llave: 'nivel_alta', nombre: 'Alta (80-99%)', color: '#84cc16' },
  { llave: 'nivel_eficiente', nombre: 'Eficiente (100%)', color: '#22c55e' },
] as const;

export function EficienciaCurricular({
  data,
  isExportMode = false,
  mostrarCabecera = true,
}: Props) {
  // Se preservan los null del endpoint: un tramo sin dato no se inventa como 0.
  const filas = data.map((fila) => ({
    cohorte: String(fila.cohorte),
    nivel_baja: fila.nivel_baja,
    nivel_media: fila.nivel_media,
    nivel_alta: fila.nivel_alta,
    nivel_eficiente: fila.nivel_eficiente,
  }));

  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm">
      {mostrarCabecera && (
        <div className="mb-4">
          <h3 className="font-bold text-slate-800 text-lg">
            Cantidad de estudiantes por tramo de eficiencia
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Distribución de estudiantes de cada cohorte según su tramo de eficiencia.
          </p>
        </div>
      )}

      {filas.length === 0 && (
        <div className="flex min-h-[300px] flex-1 items-center justify-center text-center">
          <span className="text-sm font-medium text-slate-500">{SIN_DATOS}</span>
        </div>
      )}

      {filas.length > 0 && (
        // Alto fijo: ResponsiveContainer mide su contenedor y, si solo depende
        // de flex, colapsaría a 0 px durante el fade-in de DataCardView.
        <div style={{ height: 400 }} className="min-h-[400px]">
          <ResponsiveContainer width="100%" height={isExportMode ? 400 : '100%'}>
            <BarChart data={filas} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis
                dataKey="cohorte"
                tick={{ fill: '#64748B', fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: '#E2E8F0' }}
              />
              <YAxis
                tick={{ fill: '#64748B', fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                formatter={(value, name) => [value == null ? 'Sin datos' : `${value} alumnos`, name]}
              />
              <Legend wrapperStyle={{ paddingTop: '12px' }} />
              {TRAMOS.map((tramo) => (
                <Bar
                  key={tramo.llave}
                  dataKey={tramo.llave}
                  name={tramo.nombre}
                  stackId="eficiencia"
                  fill={tramo.color}
                  isAnimationActive={!isExportMode}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
