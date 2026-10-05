import { apiRequest } from '../auth/api';

export interface HomeDashboardData {
  carrera: { codigo: string; nombre: string };
  periodos: { cohortes: number[]; anios_medicion: number[] };
  seleccion: { cohorte: number | null; anio_medicion: number | null };
  kpis: {
    ingresos_totales: number | null;
    matricula_total: number | null;
    retencion_1er_ano: number | null;
    titulacion_oportuna: number | null;
    tiempo_promedio: number | null;
  };
  resumen: { registros_asignaturas_informadas: number | null };
}

export interface FiltrosHomeDirector {
  cohorte?: number | null;
  anio_medicion?: number | null;
}

export const fetchHomeDashboard = async (
  filtros: FiltrosHomeDirector = {},
): Promise<HomeDashboardData> => {
  const query = new URLSearchParams();
  if (filtros.cohorte != null) query.set('cohorte', String(filtros.cohorte));
  if (filtros.anio_medicion != null) query.set('anio_medicion', String(filtros.anio_medicion));
  return apiRequest<HomeDashboardData>(`/api/director/home?${query}`);
};
