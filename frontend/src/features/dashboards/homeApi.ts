import { apiRequest } from '../auth/api'

export interface HomeDashboardData {
  kpis: {
    matricula_nueva: number
    retencion_1er_ano: number | null
    titulacion_oportuna: number | null
    tiempo_promedio: number | null
  }
  resumen: {
    top_percentil_retencion: number | null
    total_asignaturas_criticas: number
  }
}

export const fetchHomeDashboard = async (
  cohorte: string,
  carCodigo: string,
): Promise<HomeDashboardData> => {
  return apiRequest<HomeDashboardData>(
    `/api/director/home?cohorte=${encodeURIComponent(cohorte)}&car_codigo=${encodeURIComponent(carCodigo)}`,
  )
}