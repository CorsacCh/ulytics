import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../auth/api';

// Definimos la estructura de los datos que envía el backend
interface DatosMatricula {
  anio: number;
  ingresos_sua: number;
  ingresos_pace: number;
  ingresos_rae: number;
  ingresos_totales: number;
  matricula_total: number;
  matricula_mujeres: number;
}

interface RespuestaMatricula {
  carrera: string;
  datos: DatosMatricula[];
}

interface TablaMatriculaProps {
  carCodigo: string;
}

export const TablaMatricula: React.FC<TablaMatriculaProps> = ({ carCodigo }) => {
  const [datos, setDatos] = useState<DatosMatricula[]>([]);
  const [carreraNombre, setCarreraNombre] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDatos = async () => {
      try {
        setLoading(true);
        setError(null);
        // Llamada a la API real (apiRequest resuelve la URL base y envía la cookie de sesión)
        const data = await apiRequest<RespuestaMatricula>(
          `/api/reporteria/${encodeURIComponent(carCodigo)}/matricula`
        );

        setDatos(data.datos ?? []);
        setCarreraNombre(data.carrera);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Error desconocido');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDatos();
  }, [carCodigo]);

  if (loading) return <div className="p-4 text-gray-500">Cargando métricas de matrícula...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;
  if (!datos || datos.length === 0) return <div className="p-4 text-gray-500">No hay datos para esta carrera.</div>;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <h3 className="text-lg font-semibold text-[#002B49] mb-4">
        Datos de Progresión Académica - {carreraNombre}
      </h3>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-600">
          <thead className="text-xs text-white bg-[#002B49] uppercase">
            <tr>
              <th className="px-4 py-3 rounded-tl-lg">Cohortes</th>
              {datos.map((d) => (
                <th key={d.anio} className="px-4 py-3 text-center">{d.anio}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="px-4 py-3 font-medium text-gray-900">Matrícula nueva según cohorte</td>
              {datos.map((d) => (
                <td key={d.anio} className="px-4 py-3 text-center">{d.ingresos_totales}</td>
              ))}
            </tr>
            <tr className="border-b bg-gray-50">
              <td className="px-4 py-3 font-medium text-gray-900">Matrícula admisión regular (prueba)</td>
              {datos.map((d) => (
                <td key={d.anio} className="px-4 py-3 text-center">{d.ingresos_sua}</td>
              ))}
            </tr>
            <tr className="border-b">
              <td className="px-4 py-3 font-medium text-gray-900">Matrícula admisión especial PACE</td>
              {datos.map((d) => (
                <td key={d.anio} className="px-4 py-3 text-center">{d.ingresos_pace}</td>
              ))}
            </tr>
            <tr className="border-b bg-gray-50">
              <td className="px-4 py-3 font-medium text-gray-900">Matrícula Ingreso Especial RAE</td>
              {datos.map((d) => (
                <td key={d.anio} className="px-4 py-3 text-center">{d.ingresos_rae}</td>
              ))}
            </tr>
            <tr className="border-b">
              <td className="px-4 py-3 font-medium text-gray-900">Matrícula Total</td>
              {datos.map((d) => (
                <td key={d.anio} className="px-4 py-3 text-center font-semibold">{d.matricula_total}</td>
              ))}
            </tr>
            <tr className="bg-gray-50">
              <td className="px-4 py-3 font-medium text-gray-900">% Mujeres (Total)</td>
              {datos.map((d) => {
                const porcentaje = d.matricula_total > 0 
                  ? Math.round((d.matricula_mujeres / d.matricula_total) * 100) 
                  : 0;
                return (
                  <td key={d.anio} className="px-4 py-3 text-center">{porcentaje}%</td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
