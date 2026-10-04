import { useEffect, useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { apiRequest } from '../../../auth/api';
import { useAuth } from '../../../auth/AuthContext';
import type { CohorteRetencion } from '../data/retentionData';

// Respuesta de GET /api/reporteria/:car_codigo/progresion
interface FilaProgresion {
  cohorte: number;
  retencion_a1: number | null;
  retencion_a2: number | null;
  retencion_a3: number | null;
  retencion_a4: number | null;
  retencion_total: number | null;
}

interface RespuestaProgresion {
  carrera: string;
  datos: FilaProgresion[];
}

interface Props {
  // Cuando es true el gráfico se renderiza dentro de la zona oculta de
  // Reportería, para ser fotografiado por html2canvas. En ese caso se apaga
  // la animación: no hay nadie mirándola y retrasa la captura.
  isExportMode?: boolean;
}

export function EvolucionRetencion({ isExportMode = false }: Props = {}) {
  const { user } = useAuth();

  // El director solo puede ver la carrera de su ámbito (tipo PROGRAMA),
  // cuyo código es el mismo car_codigo de la tabla Carrera.
  const carCodigo = user?.ambito?.tipo === 'PROGRAMA' ? user.ambito.codigo : null;

  const [data, setData] = useState<CohorteRetencion[]>([]);
  const [carrera, setCarrera] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!carCodigo) {
      setLoading(false);
      setError('No se pudo identificar la carrera de la sesión activa.');
      return;
    }

    let activo = true;

    const obtenerDatosDeRetencion = async () => {
      try {
        setLoading(true);
        setError(null);

        // apiRequest resuelve la URL base (VITE_BACKEND_URL) y envía la cookie de sesión
        const respuesta = await apiRequest<RespuestaProgresion>(
          `/api/reporteria/${encodeURIComponent(carCodigo)}/progresion`
        );

        if (!activo) return;

        // Mapeamos las columnas de Fact_Progresion_Academica al formato del gráfico
        setData(
          (respuesta.datos ?? []).map((fila) => ({
            cohorte: String(fila.cohorte),
            retencion1erAno: fila.retencion_a1,
            retencion2doAno: fila.retencion_a2,
            retencion3erAno: fila.retencion_a3,
          }))
        );
        setCarrera(respuesta.carrera ?? '');
      } catch (err) {
        if (!activo) return;
        setData([]);
        setError(
          err instanceof Error
            ? err.message
            : 'No fue posible cargar la evolución de retención.'
        );
      } finally {
        if (activo) setLoading(false);
      }
    };

    obtenerDatosDeRetencion();

    return () => {
      activo = false;
    };
  }, [carCodigo]);

  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm">
      <div className="mb-4">
        <h3 className="font-bold text-slate-800 text-lg">Evolución Longitudinal de Retención</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Porcentaje de retención por cohorte a lo largo de los años
          {carrera ? ` · ${carrera}` : ''}
        </p>
      </div>

      {loading && (
        <div className="flex min-h-[300px] flex-1 items-center justify-center" role="status" aria-live="polite">
          <span className="text-sm font-medium text-slate-500 animate-pulse">
            Cargando datos históricos...
          </span>
        </div>
      )}

      {!loading && error && (
        <div className="flex min-h-[300px] flex-1 items-center justify-center">
          <span className="text-sm font-medium text-red-600">{error}</span>
        </div>
      )}

      {!loading && !error && data.length === 0 && (
        <div className="flex min-h-[300px] flex-1 items-center justify-center text-center">
          <span className="text-sm font-medium text-slate-500">
            Todavía no hay datos de progresión cargados para esta carrera.
          </span>
        </div>
      )}

      {!loading && !error && data.length > 0 && (
        // En exportación el alto es fijo: el ResponsiveContainer mide su
        // contenedor padre y, si sólo depende de flex, colapsaría a 0 px.
        <div style={{ height: isExportMode ? 400 : undefined }} className="min-h-[300px] flex-1">
          <ResponsiveContainer width="100%" height={isExportMode ? 400 : '100%'}>
            <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
                formatter={(value) => [`${value}%`, 'Retención']}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />

              <Line
                type="monotone"
                name="1er Año"
                dataKey="retencion1erAno"
                stroke="#2563EB" /* blue-600 */
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 8 }}
                connectNulls
                isAnimationActive={!isExportMode}
              />
              <Line
                type="monotone"
                name="2do Año"
                dataKey="retencion2doAno"
                stroke="#10B981" /* emerald-500 */
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 8 }}
                connectNulls
                isAnimationActive={!isExportMode}
              />
              <Line
                type="monotone"
                name="3er Año"
                dataKey="retencion3erAno"
                stroke="#8B5CF6" /* violet-500 */
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 8 }}
                connectNulls
                isAnimationActive={!isExportMode}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
