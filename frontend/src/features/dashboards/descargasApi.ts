import { apiRequest } from '../auth/api';

// Registro individual que alimenta la tabla "Auditoría de reportes".
export interface RegistroDescarga {
  id_descarga: number;
  nombre_archivo: string;
  formato: string;
  periodo: string;
  fecha_descarga: string;
  tamano_kb: number;
  url_archivo: string;
}

// KPIs que resumen la actividad de descargas.
export interface ResumenDescargas {
  totalUltimos90Dias: number;
  ultimaDescargaFecha: string | null;
  ultimaDescargaNombre: string | null;
  formatosCantidad: number;
  formatosUsados: string[];
}

export interface RespuestaHistorialDescargas {
  resumen: ResumenDescargas;
  registros: RegistroDescarga[];
}

// Evento que se dispara tras registrar una descarga, para que el historial
// se refresque sin tener que recargar la página.
export const EVENTO_DESCARGA = 'download-registered';

// apiRequest resuelve la URL base (VITE_BACKEND_URL) y envía la cookie de sesión.
export function obtenerHistorialDescargas() {
  return apiRequest<RespuestaHistorialDescargas>('/api/descargas');
}
