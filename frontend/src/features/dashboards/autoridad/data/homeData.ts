import { facultyRetention, enrollmentTrend, facultyDistribution } from './chartData';
import { careerPerformance } from './careerData';

export interface AutoridadHomeData {
  kpis: {
    matricula_total: number;
    crecimiento_matricula: number | null;
    retencion_institucional: number | null;
    crecimiento_retencion: number | null;
    tasa_titulacion_total: number | null;
    cohorte_titulacion: number | null;
    carreras_monitoreadas: number;
  };
  alertas: {
    mensaje: string;
    tipo: 'critica' | 'positiva' | 'informativa';
  }[];
  // Series estáticas por ahora; se migrarán a datos de API en una fase posterior.
  graficos: {
    evolucionMatricula: typeof enrollmentTrend;
    distribucionFacultad: typeof facultyDistribution;
    retencionPorFacultad: typeof facultyRetention;
    topCarreras: typeof careerPerformance;
  };
}

export const autoridadHomeData: AutoridadHomeData = {
  kpis: {
    matricula_total: 4820,
    crecimiento_matricula: 2.9,
    retencion_institucional: 86,
    crecimiento_retencion: 1.2,
    tasa_titulacion_total: 78,
    cohorte_titulacion: null,
    carreras_monitoreadas: 24,
  },
  alertas: [
    {
      mensaje: 'Titulación total en Pedagogía está en 78%, requiere seguimiento activo.',
      tipo: 'critica',
    },
    {
      mensaje: 'Matrícula en crecimiento constante: +2.9% vs año anterior.',
      tipo: 'positiva',
    },
    {
      mensaje: 'Humanidades presenta la menor retención (79%), considerar programa de intervención.',
      tipo: 'informativa',
    },
  ],
  graficos: {
    evolucionMatricula: enrollmentTrend,
    distribucionFacultad: facultyDistribution,
    retencionPorFacultad: facultyRetention,
    topCarreras: careerPerformance,
  },
};
