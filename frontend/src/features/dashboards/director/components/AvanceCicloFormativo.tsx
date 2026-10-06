// Gráfico de avance por ciclo formativo (barras apiladas al 100% por cohorte).
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
import { SIN_DATOS, type FilaAvanceCurricular } from '../data/curricular';
import { formatearValorCurricular } from '../../../../shared/utils/formatters';

interface Props {
  data: FilaAvanceCurricular[];
  // En exportación (Reportería) el alto es fijo y la animación se apaga: html2canvas
  // necesita dimensiones reales y nadie está mirando la transición.
  isExportMode?: boolean;
  // Cuando la tarjeta contenedora (DataCardView) ya muestra título y descripción,
  // el gráfico no repite su propia cabecera.
  mostrarCabecera?: boolean;
}

// Paleta secuencial accesible (Sky -> Blue -> Indigo): sustituye el gris del
// Bachillerato (sugería "sin datos" y no cumplía el contraste ADA) por un azul
// brillante; el peso visual crece hacia la meta final (título). El avance es un
// camino continuo hacia la titulación, no "bueno o malo".
const CATEGORIAS = [
  { llave: 'porcentaje_bachillerato', nombre: 'Bachillerato', color: '#38bdf8' },
  {
    llave: 'porcentaje_licenciatura_con_bachillerato_pendiente',
    nombre: 'Lic. c/ pend. de Bach.',
    color: '#0284c7',
  },
  { llave: 'porcentaje_licenciatura', nombre: 'Licenciatura', color: '#2563eb' },
  {
    llave: 'porcentaje_titulo_con_bachillerato_licenciatura_pendiente',
    nombre: 'Título c/ pend. previos',
    color: '#4338ca',
  },
  { llave: 'porcentaje_titulo', nombre: 'Título', color: '#1e3a8a' },
] as const;

export function AvanceCicloFormativo({
  data,
  isExportMode = false,
  mostrarCabecera = true,
}: Props) {
  // Se preservan los null del endpoint: una categoría sin dato no se inventa como 0.
  const filas = data.map((fila) => ({
    cohorte: String(fila.cohorte),
    porcentaje_bachillerato: fila.porcentaje_bachillerato,
    porcentaje_licenciatura_con_bachillerato_pendiente:
      fila.porcentaje_licenciatura_con_bachillerato_pendiente,
    porcentaje_licenciatura: fila.porcentaje_licenciatura,
    porcentaje_titulo_con_bachillerato_licenciatura_pendiente:
      fila.porcentaje_titulo_con_bachillerato_licenciatura_pendiente,
    porcentaje_titulo: fila.porcentaje_titulo,
  }));

  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm">
      {mostrarCabecera && (
        <div className="mb-4">
          <h3 className="font-bold text-slate-800 text-lg">Estado de avance por ciclo formativo</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Porcentaje de alumnos regulares y su cumplimiento esperado por ciclo.
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
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                // Las etapas llegan como puntos porcentuales decimales (35.5 = 35,5 %)
                // y null cuando la celda de origen estaba vacía o contenía un guion.
                formatter={(value, name) => [
                  formatearValorCurricular(value == null ? null : Number(value), true),
                  name,
                ]}
              />
              <Legend wrapperStyle={{ paddingTop: '12px' }} />
              {CATEGORIAS.map((categoria) => (
                <Bar
                  key={categoria.llave}
                  dataKey={categoria.llave}
                  name={categoria.nombre}
                  stackId="avance"
                  fill={categoria.color}
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