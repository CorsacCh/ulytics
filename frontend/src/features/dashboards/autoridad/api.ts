import { apiRequest } from '../../auth/api';
import type { AutoridadHomeData } from './data/homeData';

// Entrada mínima del catálogo institucional que usan los selectores.
export interface CatalogoCarrera {
  car_codigo: string;
  nombre: string;
  // Macrounidad (facultad) a la que pertenece la carrera; ausente en
  // catálogos antiguos que solo devuelven código y nombre.
  id_macrounidad?: string;
}

export interface CatalogoFacultad {
  id_macrounidad: string;
  nombre: string;
}

export interface CatalogoInstitucional {
  facultades: CatalogoFacultad[];
  carreras: CatalogoCarrera[];
}

interface RespuestaAmbitosCatalogo {
  carreras?: CatalogoCarrera[];
  facultades?: CatalogoFacultad[];
}

// Códigos oficiales de carrera desde el catálogo institucional (GET /api/ambitos).
// Helper histórico: las vistas de la Autoridad ahora usan
// obtenerCatalogoInstitucional; se conserva por compatibilidad.
export function obtenerCatalogoCarreras(): Promise<CatalogoCarrera[]> {
  return apiRequest<RespuestaAmbitosCatalogo>('/api/ambitos')
    .then((catalogo) => catalogo.carreras ?? []);
}

// Catálogo institucional completo (GET /api/ambitos) para los selectores
// jerárquicos de la Autoridad: facultades y carreras reales. Ante cualquier
// error los consumidores degradan a los mocks estáticos de institucionData.
export function obtenerCatalogoInstitucional(): Promise<CatalogoInstitucional> {
  return apiRequest<RespuestaAmbitosCatalogo>('/api/ambitos')
    .then((catalogo) => ({
      facultades: catalogo.facultades ?? [],
      carreras: catalogo.carreras ?? [],
    }));
}

// Paleta de colores para el gráfico de torta de facultades.
const COLORES_FACULTAD = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#14b8a6', '#f97316', '#6366f1'];

// Forma exacta del JSON que devuelve GET /api/autoridad/resumen
// (backend/src/controllers/autoridad.controller.js).
interface RespuestaResumenInstitucional {
  kpis: {
    matricula_total: number | null;
    crecimiento_matricula: number | null;
    retencion_institucional: number | null;
    titulacion_total: number | null;
    cohorte_titulacion: number | null;
    carreras_monitoreadas: number;
  };
  graficos: {
    evolucion_matricula: { anio: number; matricula: number | null }[];
    distribucion_facultad: { name: string; value: number }[];
    top_carreras: {
      carrera: string;
      matricula: number;
      retencion: number | null;
      titulacion: number | null;
    }[];
    retencion_facultad: { facultad: string; retencion: number }[];
  };
  alertas: AutoridadHomeData['alertas'];
}

// Resumen institucional del Home: trae los datos reales y los adapta del
// snake_case del backend al modelo camelCase que consumen los gráficos.
export async function obtenerResumenInstitucional(): Promise<AutoridadHomeData> {
  const respuesta = await apiRequest<RespuestaResumenInstitucional>('/api/autoridad/resumen');
  const { kpis, graficos, alertas } = respuesta;

  return {
    kpis: {
      matricula_total: kpis.matricula_total ?? 0,
      crecimiento_matricula: kpis.crecimiento_matricula,
      retencion_institucional: kpis.retencion_institucional,
      crecimiento_retencion: null, // El backend no envía este dato; se mantiene null
      tasa_titulacion_total: kpis.titulacion_total, // Mapeo crítico
      cohorte_titulacion: kpis.cohorte_titulacion,
      carreras_monitoreadas: kpis.carreras_monitoreadas
    },
    alertas: alertas ?? [],
    graficos: {
      evolucionMatricula: (graficos.evolucion_matricula ?? []).map((item) => ({
        year: String(item.anio),
        total: Number(item.matricula ?? 0)
      })),
      distribucionFacultad: (graficos.distribucion_facultad ?? []).map((item, index) => ({
        name: item.name,
        value: Number(item.value),
        fill: COLORES_FACULTAD[index % COLORES_FACULTAD.length] // Color dinámico por posición
      })),
      topCarreras: (graficos.top_carreras ?? []).map((item) => ({
        name: item.carrera,
        enrollment: Number(item.matricula),
        retention: Number(item.retencion ?? 0),
        graduation: Number(item.titulacion ?? 0)
      })),
      retencionPorFacultad: (graficos.retencion_facultad ?? [])
        .map((item) => ({
          faculty: item.facultad,
          rate: Number(item.retencion)
        }))
        .sort((a, b) => b.rate - a.rate) // Orden de mayor a menor
    }
  };
}