import { apiRequest } from '../../auth/api';

export interface CarreraDecanatura {
  car_codigo: string;
  nombre: string;
  sede: string | null;
  id_macrounidad: string;
}

export interface RespuestaCarrerasDecanatura {
  facultad: {
    codigo: string;
    nombre: string;
  };
  carreras: CarreraDecanatura[];
}

export interface FilaIngreso {
  cohorte: number;
  ingresos_sua: number | null;
  ingresos_pace: number | null;
  ingresos_especiales: number | null;
  ingresos_totales: number | null;
  porcentaje_mujeres: number | null;
  cobertura_sua: number | null;
  cobertura_pace: number | null;
  cobertura_rae: number | null;
  estados_datos: Record<string, string> | null;
}

export interface FilaMatricula {
  anio_medicion: number;
  matricula_total: number | null;
  matricula_mujeres: number | null;
  porcentaje_mujeres: number | null;
  estados_datos: Record<string, string> | null;
}

export interface FilaProgresion {
  cohorte: number;
  retencion_a1: number | null;
  retencion_a2: number | null;
  retencion_a3: number | null;
  retencion_a4: number | null;
  retencion_total: number | null;
  tasa_titulacion_total: number | null;
  tasa_titulacion_oportuna: number | null;
  tasa_titulacion_efectiva: number | null;
  duracion_real_semestres: number | null;
}

export interface FilaEficienciaCurricular {
  cohorte: number;
  total_alumnos_regulares: number | null;
  nivel_baja: number | null;
  nivel_media: number | null;
  nivel_alta: number | null;
  nivel_eficiente: number | null;
}

export interface FilaAvanceCurricular {
  cohorte: number;
  porcentaje_bachillerato: number | null;
  porcentaje_licenciatura_con_bachillerato_pendiente: number | null;
  porcentaje_licenciatura: number | null;
  porcentaje_titulo_con_bachillerato_licenciatura_pendiente: number | null;
  porcentaje_titulo: number | null;
}

export interface FilaAsignaturaInformada {
  asig_codigo_base: string;
  asig_codigo: string;
  semestre: number | null;
  anio_medicion: number;
  tasa_reprobacion: number | null;
  estado_dato: string | null;
}

interface RespuestaMatricula {
  carrera: string;
  ingresos_cohorte: FilaIngreso[];
  matricula_anual: FilaMatricula[];
}

interface RespuestaProgresion {
  carrera: string;
  datos: FilaProgresion[];
}

export interface RespuestaCurricular {
  carrera: string;
  eficiencia: FilaEficienciaCurricular[];
  avance_curricular: FilaAvanceCurricular[];
  criticas: FilaAsignaturaInformada[];
}

export function obtenerCarrerasDecanatura() {
  return apiRequest<RespuestaCarrerasDecanatura>('/api/decanatura/carreras');
}

export function obtenerMatriculaCarrera(codigoCarrera: string) {
  return apiRequest<RespuestaMatricula>(
    `/api/reporteria/${encodeURIComponent(codigoCarrera)}/matricula`,
  );
}

export function obtenerProgresionCarrera(codigoCarrera: string) {
  return apiRequest<RespuestaProgresion>(
    `/api/reporteria/${encodeURIComponent(codigoCarrera)}/progresion`,
  );
}

export function obtenerCurricularCarrera(codigoCarrera: string) {
  return apiRequest<RespuestaCurricular>(
    `/api/reporteria/${encodeURIComponent(codigoCarrera)}/curricular`,
  );
}
