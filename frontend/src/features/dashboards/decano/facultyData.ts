import {
  obtenerCarrerasDecanatura,
  obtenerCurricularCarrera,
  obtenerMatriculaCarrera,
  obtenerProgresionCarrera,
  type CarreraDecanatura,
  type FilaAsignaturaInformada,
  type FilaAvanceCurricular,
  type FilaEficienciaCurricular,
  type FilaIngreso,
  type FilaMatricula,
  type FilaProgresion,
  type RespuestaCarrerasDecanatura,
} from './api';

export interface DatosCarreraDecanatura {
  carrera: CarreraDecanatura;
  ingresos: FilaIngreso[];
  matriculas: FilaMatricula[];
  progresion: FilaProgresion[];
  eficiencia: FilaEficienciaCurricular[];
  avance: FilaAvanceCurricular[];
  asignaturas: FilaAsignaturaInformada[];
}

export interface DatosFacultadDecanatura {
  facultad: RespuestaCarrerasDecanatura['facultad'];
  carreras: CarreraDecanatura[];
  datos: DatosCarreraDecanatura[];
}

/**
 * Carga el catálogo autorizado del decano y reúne los indicadores existentes
 * de cada una de sus carreras. El backend sigue siendo quien valida el ámbito.
 */
export async function obtenerDatosFacultadDecanatura(): Promise<DatosFacultadDecanatura> {
  const catalogo = await obtenerCarrerasDecanatura();
  const datos = await Promise.all(
    catalogo.carreras.map(async (carrera) => {
      const [matricula, progresion, curricular] = await Promise.all([
        obtenerMatriculaCarrera(carrera.car_codigo),
        obtenerProgresionCarrera(carrera.car_codigo),
        obtenerCurricularCarrera(carrera.car_codigo),
      ]);

      return {
        carrera,
        ingresos: matricula.ingresos_cohorte ?? [],
        matriculas: matricula.matricula_anual ?? [],
        progresion: progresion.datos ?? [],
        eficiencia: curricular.eficiencia ?? [],
        avance: curricular.avance_curricular ?? [],
        asignaturas: curricular.criticas ?? [],
      } satisfies DatosCarreraDecanatura;
    }),
  );

  return {
    facultad: catalogo.facultad,
    carreras: catalogo.carreras,
    datos,
  };
}
