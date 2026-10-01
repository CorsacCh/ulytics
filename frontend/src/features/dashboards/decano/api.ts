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

export interface FilaMatricula {
  anio: number;
  ingresos_sua: number | null;
  ingresos_pace: number | null;
  ingresos_rae: number | null;
  ingresos_totales: number | null;
  matricula_total: number | null;
  matricula_mujeres: number | null;
}

export interface FilaProgresion {
  cohorte: number;
  retencion_a1: number | null;
  retencion_a2: number | null;
  retencion_a3: number | null;
  retencion_a4: number | null;
  retencion_total: number | null;
  tasa_titulacion_temprana: number | null;
  tasa_titulacion_oportuna: number | null;
  tasa_titulacion_efectiva: number | null;
  duracion_real_semestres: number | null;
}

export interface FilaEficienciaCurricular {
  anio: number;
  total_alumnos_regulares: number | null;
  nivel_baja: number | null;
  nivel_media: number | null;
  nivel_alta: number | null;
  nivel_eficiente: number | null;
}

export interface FilaAvanceCurricular {
  anio: number;
  bachilleratos: number | null;
  licenciaturas_asig_pendientes: number | null;
  licenciaturas: number | null;
  titulados: number | null;
}

export interface FilaAsignaturaInformada {
  asig_codigo: string;
  semestre: number | null;
  anio: number;
  tasa_reprobacion: number | null;
}

interface RespuestaMatricula {
  carrera: string;
  datos: FilaMatricula[];
}

interface RespuestaProgresion {
  carrera: string;
  datos: FilaProgresion[];
}

export interface RespuestaCurricular {
  carrera: string;
  eficiencia: FilaEficienciaCurricular[];
  titulacion: FilaAvanceCurricular[];
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
