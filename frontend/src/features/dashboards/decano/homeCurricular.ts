import type { FilaAvanceCurricular, FilaEficienciaCurricular } from './api';
import type { DatosCarreraDecanatura } from './facultyData';

// Solo selección y presentación de los valores entregados por la API.
// No sumar tramos, normalizar porcentajes ni clasificar asignaturas aquí.
export const COLUMNAS_EFICIENCIA: ReadonlyArray<{
  llave: Exclude<keyof FilaEficienciaCurricular, 'cohorte'>;
  titulo: string;
}> = [
  { llave: 'total_alumnos_regulares', titulo: 'Alumnos regulares' },
  { llave: 'nivel_baja', titulo: 'Baja' },
  { llave: 'nivel_media', titulo: 'Media' },
  { llave: 'nivel_alta', titulo: 'Alta' },
  { llave: 'nivel_eficiente', titulo: 'Eficiente' },
];

export const COLUMNAS_AVANCE: ReadonlyArray<{
  llave: Exclude<keyof FilaAvanceCurricular, 'cohorte'>;
  titulo: string;
}> = [
  { llave: 'porcentaje_bachillerato', titulo: 'Bachillerato' },
  {
    llave: 'porcentaje_licenciatura_con_bachillerato_pendiente',
    titulo: 'Licenciatura con asignaturas pendientes de Bachillerato',
  },
  { llave: 'porcentaje_licenciatura', titulo: 'Licenciatura' },
  {
    llave: 'porcentaje_titulo_con_bachillerato_licenciatura_pendiente',
    titulo: 'Título con pendientes de Bachillerato o Licenciatura',
  },
  { llave: 'porcentaje_titulo', titulo: 'Título' },
];

export function obtenerAniosMedicionHome(datos: DatosCarreraDecanatura[]): number[] {
  return [...new Set(datos.flatMap((item) => [
    ...item.matriculas.map((fila) => fila.anio_medicion),
    ...item.asignaturas.map((fila) => fila.anio_medicion),
  ]))].sort((a, b) => a - b);
}

export function seleccionarCurricularHome(datos: DatosCarreraDecanatura[], cohorte: number | null) {
  return datos.map((item) => ({
    carrera: item.carrera,
    eficiencia: item.eficiencia.find((fila) => fila.cohorte === cohorte) ?? null,
    avance: item.avance.find((fila) => fila.cohorte === cohorte) ?? null,
  })).sort((a, b) => a.carrera.nombre.localeCompare(b.carrera.nombre, 'es')
    || a.carrera.car_codigo.localeCompare(b.carrera.car_codigo, 'es'));
}

export function seleccionarAsignaturasHome(
  datos: DatosCarreraDecanatura[],
  anio: number | null,
  codigoCarrera = '',
) {
  return datos
    .filter((item) => !codigoCarrera || item.carrera.car_codigo === codigoCarrera)
    .flatMap((item) => item.asignaturas
      .filter((fila) => fila.anio_medicion === anio)
      .map((asignatura) => ({ carrera: item.carrera, asignatura })))
    .sort((a, b) => a.carrera.nombre.localeCompare(b.carrera.nombre, 'es')
      || a.carrera.car_codigo.localeCompare(b.carrera.car_codigo, 'es')
      || a.asignatura.asig_codigo.localeCompare(b.asignatura.asig_codigo, 'es', { numeric: true })
      || (a.asignatura.semestre ?? 0) - (b.asignatura.semestre ?? 0));
}

// Única fuente de formateo curricular: Decano, Director y Autoridad importan
// de shared/utils/formatters; aquí solo se reexporta para no romper los
// consumidores de este módulo.
export {
  describirEstadoAsignatura,
  formatearValorCurricular,
} from '../../../shared/utils/formatters';
