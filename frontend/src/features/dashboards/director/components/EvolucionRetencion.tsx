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
import { evolucionRetencionData } from '../data/retentionData';

export function EvolucionRetencion() {
  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm">
      <div className="mb-4">
        <h3 className="font-bold text-slate-800 text-lg">Evolución Longitudinal de Retención</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Porcentaje de retención por cohorte a lo largo de los años
        </p>
      </div>

      <div className="min-h-[300px] flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={evolucionRetencionData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
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
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
