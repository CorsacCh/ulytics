import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../auth/api';

interface FilaIngreso {
  cohorte: number;
  ingresos_sua: number | null;
  ingresos_pace: number | null;
  ingresos_especiales: number | null;
  ingresos_totales: number | null;
}

interface FilaMatricula {
  anio_medicion: number;
  matricula_total: number | null;
  matricula_mujeres: number | null;
  porcentaje_mujeres: number | null;
}

interface RespuestaMatricula {
  carrera: string;
  ingresos_cohorte: FilaIngreso[];
  matricula_anual: FilaMatricula[];
}

interface TablaMatriculaProps {
  carCodigo: string;
}

const mostrarValor = (valor: number | null, sufijo = '') =>
  valor === null
    ? '-'
    : `${new Intl.NumberFormat('es-CL', {
        maximumFractionDigits: sufijo === '%' ? 0 : 2,
      }).format(valor)}${sufijo}`;

export const TablaMatricula: React.FC<TablaMatriculaProps> = ({ carCodigo }) => {
  const [ingresos, setIngresos] = useState<FilaIngreso[]>([]);
  const [matriculas, setMatriculas] = useState<FilaMatricula[]>([]);
  const [carreraNombre, setCarreraNombre] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDatos = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiRequest<RespuestaMatricula>(
          `/api/reporteria/${encodeURIComponent(carCodigo)}/matricula`,
        );

        setIngresos(data.ingresos_cohorte ?? []);
        setMatriculas(data.matricula_anual ?? []);
        setCarreraNombre(data.carrera);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    void fetchDatos();
  }, [carCodigo]);

  if (loading) return <div className="p-4 text-gray-500">Cargando métricas académicas...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;
  if (ingresos.length === 0 && matriculas.length === 0) {
    return <div className="p-4 text-gray-500">No hay datos para esta carrera.</div>;
  }

  return (
    <div className="mb-6 space-y-6">
      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-[#002B49]">
          Ingresos por cohorte - {carreraNombre}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-[#002B49] text-xs uppercase text-white">
              <tr>
                <th className="px-4 py-3">Cohorte</th>
                <th className="px-4 py-3 text-center">SUA/PAES</th>
                <th className="px-4 py-3 text-center">PACE</th>
                <th className="px-4 py-3 text-center">Especiales RAE</th>
                <th className="px-4 py-3 text-center">Total</th>
              </tr>
            </thead>
            <tbody>
              {ingresos.map((fila) => (
                <tr key={fila.cohorte} className="border-b">
                  <td className="px-4 py-3 font-medium text-gray-900">{fila.cohorte}</td>
                  <td className="px-4 py-3 text-center">{mostrarValor(fila.ingresos_sua)}</td>
                  <td className="px-4 py-3 text-center">{mostrarValor(fila.ingresos_pace)}</td>
                  <td className="px-4 py-3 text-center">
                    {mostrarValor(fila.ingresos_especiales)}
                  </td>
                  <td className="px-4 py-3 text-center font-semibold">
                    {mostrarValor(fila.ingresos_totales)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-[#002B49]">
          Matrícula anual - {carreraNombre}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-[#002B49] text-xs uppercase text-white">
              <tr>
                <th className="px-4 py-3">Año</th>
                <th className="px-4 py-3 text-center">Matrícula total</th>
                <th className="px-4 py-3 text-center">Mujeres</th>
                <th className="px-4 py-3 text-center">% mujeres</th>
              </tr>
            </thead>
            <tbody>
              {matriculas.map((fila) => (
                <tr key={fila.anio_medicion} className="border-b">
                  <td className="px-4 py-3 font-medium text-gray-900">{fila.anio_medicion}</td>
                  <td className="px-4 py-3 text-center">{mostrarValor(fila.matricula_total)}</td>
                  <td className="px-4 py-3 text-center">{mostrarValor(fila.matricula_mujeres)}</td>
                  <td className="px-4 py-3 text-center">
                    {mostrarValor(fila.porcentaje_mujeres, '%')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
