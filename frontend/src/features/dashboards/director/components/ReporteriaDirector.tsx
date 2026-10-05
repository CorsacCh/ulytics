import { useEffect, useState } from 'react';
import { ApiError, apiRequest } from '../../../auth/api';
import { useAuth } from '../../../auth/AuthContext';
import { ReporteriaView, type ModuloReporteria } from '../../components/ReporteriaView';
import { EvolucionRetencion } from './EvolucionRetencion';
import { TablaPeriodos } from './ProgresionAnalitica';
import {
  TablaAvance,
  TablaAsignaturasCriticas,
  TablaIndicadores,
} from './TablasCurriculares';
import {
  COLUMNAS_AVANCE,
  INDICADORES_EFICIENCIA,
  agruparAsignaturasCriticas,
  obtenerAnios,
  type FilaAvanceCurricular,
  type FilaCritica,
  type FilaEficiencia,
} from '../data/curricular';
import {
  INDICADORES_INGRESOS,
  INDICADORES_MATRICULA,
  INDICADORES_RETENCION,
  INDICADORES_TITULACION,
  type FilaPeriodo,
} from '../data/indicadoresProgresion';
import type { FilaExportable } from '../../../../utils/exportUtils';

// Respuestas de /api/reporteria/:car_codigo/{matricula,progresion}
interface FilaIngreso {
  cohorte: number;
  ingresos_sua: number | null;
  ingresos_pace: number | null;
  ingresos_especiales: number | null;
  ingresos_totales: number | null;
}

interface FilaMatricula {
  anio_medicion: number;
  matricula_total: number | null;
  matricula_mujeres: number | null;
  porcentaje_mujeres: number | null;
}

interface FilaProgresion {
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

interface RespuestaMatricula {
  carrera: string;
  ingresos_cohorte: FilaIngreso[];
  matricula_anual: FilaMatricula[];
}

interface RespuestaProgresion {
  carrera: string;
  datos: FilaProgresion[];
}

interface RespuestaCurricular {
  carrera: string;
  eficiencia: FilaEficiencia[];
  avance_curricular: FilaAvanceCurricular[];
  criticas: FilaCritica[];
}

function describirError(error: unknown): string {
  if (error instanceof ApiError && error.status === 404) {
    return 'La carrera de la sesión activa no tiene datos cargados en el sistema.';
  }
  if (error instanceof Error) return error.message;
  return 'No fue posible cargar los indicadores para el reporte.';
}

const CATEGORIA_ANALITICA = 'Progresión Analítica';
const CATEGORIA_CURRICULAR = 'Progresión Curricular';

// Indicador con su dataset tabular (Excel) y su render en el DOM (PDF).
function crearModulo(
  id: string,
  label: string,
  data: FilaExportable[],
  render: () => React.ReactNode,
  categoria: string = CATEGORIA_ANALITICA,
): ModuloReporteria {
  return {
    categoria,
    id,
    label,
    data,
    formats: ['pdf', 'excel'],
    render,
  };
}

export function ReporteriaDirector() {
  const { user } = useAuth();
  const carCodigo = user?.ambito?.tipo === 'PROGRAMA' ? user.ambito.codigo : null;

  const [ingresoData, setIngresoData] = useState<FilaIngreso[]>([]);
  const [matriculaData, setMatriculaData] = useState<FilaMatricula[]>([]);
  const [progresionData, setProgresionData] = useState<FilaProgresion[]>([]);
  const [eficiencia, setEficiencia] = useState<FilaEficiencia[]>([]);
  const [avance, setAvance] = useState<FilaAvanceCurricular[]>([]);
  const [criticas, setCriticas] = useState<FilaCritica[]>([]);
  const [carrera, setCarrera] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!carCodigo) {
      setLoading(false);
      setError('No se pudo identificar la carrera de la sesión activa.');
      return;
    }

    let activo = true;

    const cargar = async () => {
      try {
        setLoading(true);
        setError(null);

        const [matricula, progresion, curricular] = await Promise.all([
          apiRequest<RespuestaMatricula>(
            `/api/reporteria/${encodeURIComponent(carCodigo)}/matricula`,
          ),
          apiRequest<RespuestaProgresion>(
            `/api/reporteria/${encodeURIComponent(carCodigo)}/progresion`,
          ),
          apiRequest<RespuestaCurricular>(
            `/api/reporteria/${encodeURIComponent(carCodigo)}/curricular`,
          ),
        ]);

        if (!activo) return;
        setIngresoData(matricula.ingresos_cohorte ?? []);
        setMatriculaData(matricula.matricula_anual ?? []);
        setProgresionData(progresion.datos ?? []);
        setEficiencia(curricular.eficiencia ?? []);
        setAvance(curricular.avance_curricular ?? []);
        setCriticas(curricular.criticas ?? []);
        setCarrera(matricula.carrera || progresion.carrera || curricular.carrera || '');
      } catch (err) {
        if (activo) setError(describirError(err));
      } finally {
        if (activo) setLoading(false);
      }
    };

    void cargar();
    return () => {
      activo = false;
    };
  }, [carCodigo]);

  // La cohorte es el periodo natural de los indicadores de progresión.
  const filasProgresion: FilaPeriodo[] = progresionData.map((fila) => ({
    periodo: fila.cohorte,
    valores: {
      retencion_a1: fila.retencion_a1,
      retencion_a2: fila.retencion_a2,
      retencion_a3: fila.retencion_a3,
      retencion_a4: fila.retencion_a4,
      retencion_total: fila.retencion_total,
      tasa_titulacion_total: fila.tasa_titulacion_total,
      tasa_titulacion_oportuna: fila.tasa_titulacion_oportuna,
      tasa_titulacion_efectiva: fila.tasa_titulacion_efectiva,
      duracion_real_semestres: fila.duracion_real_semestres,
    },
  }));

  const filasIngreso: FilaPeriodo[] = ingresoData.map((fila) => ({
    periodo: fila.cohorte,
    valores: {
      ingresos_sua: fila.ingresos_sua,
      ingresos_pace: fila.ingresos_pace,
      ingresos_especiales: fila.ingresos_especiales,
      ingresos_totales: fila.ingresos_totales,
    },
  }));

  const filasMatricula: FilaPeriodo[] = matriculaData.map((fila) => ({
    periodo: fila.anio_medicion,
    valores: {
      matricula_total: fila.matricula_total,
      matricula_mujeres: fila.matricula_mujeres,
      porcentaje_mujeres: fila.porcentaje_mujeres,
    },
  }));

  const datosEvolucion: FilaExportable[] = progresionData.map((fila) => ({
    Cohorte: fila.cohorte,
    'Retención 1er Año (%)': fila.retencion_a1,
    'Retención 2do Año (%)': fila.retencion_a2,
    'Retención 3er Año (%)': fila.retencion_a3,
  }));

  const datosRetencion: FilaExportable[] = progresionData.map((fila) => ({
    Cohorte: fila.cohorte,
    'Retención 1er año': fila.retencion_a1,
    'Retención 2do año': fila.retencion_a2,
    'Retención 3er año': fila.retencion_a3,
    'Retención 4to año': fila.retencion_a4,
    'Retención total': fila.retencion_total,
  }));

  const datosIngreso: FilaExportable[] = ingresoData.map((fila) => ({
    Cohorte: fila.cohorte,
    'Ingresos SUA/PAES': fila.ingresos_sua,
    'Ingresos PACE': fila.ingresos_pace,
    'Ingresos especiales (RAE)': fila.ingresos_especiales,
    'Ingresos totales': fila.ingresos_totales,
  }));

  const datosMatricula: FilaExportable[] = matriculaData.map((fila) => ({
    Año: fila.anio_medicion,
    'Matrícula total': fila.matricula_total,
    'Matrícula mujeres': fila.matricula_mujeres,
    'Mujeres sobre matrícula total (%)': fila.porcentaje_mujeres,
  }));

  const datosTitulacion: FilaExportable[] = progresionData.map((fila) => ({
    Cohorte: fila.cohorte,
    'Titulación total (TTT)': fila.tasa_titulacion_total,
    'Titulación oportuna (TTO)': fila.tasa_titulacion_oportuna,
    'Titulación efectiva (TTE)': fila.tasa_titulacion_efectiva,
    'Duración real (semestres)': fila.duracion_real_semestres,
  }));

  const filasEficiencia: FilaPeriodo[] = eficiencia.map((fila) => ({
    periodo: fila.cohorte,
    valores: {
      total_alumnos_regulares: fila.total_alumnos_regulares,
      nivel_baja: fila.nivel_baja,
      nivel_media: fila.nivel_media,
      nivel_alta: fila.nivel_alta,
      nivel_eficiente: fila.nivel_eficiente,
    },
  }));

  const filasAvance: FilaPeriodo[] = avance.map((fila) => ({
    periodo: fila.cohorte,
    valores: {
      porcentaje_bachillerato: fila.porcentaje_bachillerato,
      porcentaje_licenciatura_con_bachillerato_pendiente:
        fila.porcentaje_licenciatura_con_bachillerato_pendiente,
      porcentaje_licenciatura: fila.porcentaje_licenciatura,
      porcentaje_titulo_con_bachillerato_licenciatura_pendiente:
        fila.porcentaje_titulo_con_bachillerato_licenciatura_pendiente,
      porcentaje_titulo: fila.porcentaje_titulo,
    },
  }));

  const filasCriticas = agruparAsignaturasCriticas(criticas);
  const aniosCriticas = obtenerAnios(criticas.map((critica) => critica.anio_medicion));

  const datosEficiencia: FilaExportable[] = eficiencia.map((fila) => ({
    Cohorte: fila.cohorte,
    'Nº Alumnos regulares': fila.total_alumnos_regulares,
    'Nivel baja (0<60%)': fila.nivel_baja,
    'Nivel media (61-<80%)': fila.nivel_media,
    'Nivel alta (80-<100%)': fila.nivel_alta,
    'Nivel eficiente (=100%)': fila.nivel_eficiente,
  }));

  const datosAvance: FilaExportable[] = avance.map((fila) => ({
    Cohorte: fila.cohorte,
    'Bachillerato (%)': fila.porcentaje_bachillerato,
    'Lic. con Bachillerato pendiente (%)':
      fila.porcentaje_licenciatura_con_bachillerato_pendiente,
    'Licenciatura (%)': fila.porcentaje_licenciatura,
    'Título con ciclos anteriores pendientes (%)':
      fila.porcentaje_titulo_con_bachillerato_licenciatura_pendiente,
    'Título (%)': fila.porcentaje_titulo,
  }));

  const datosCriticas: FilaExportable[] = criticas.map((fila) => ({
    'Código base': fila.asig_codigo_base,
    'Código completo': fila.asig_codigo,
    Semestre: fila.semestre,
    Año: fila.anio_medicion,
    'Tasa de reprobación (%)': fila.tasa_reprobacion,
  }));

  const modulos: ModuloReporteria[] = [
    crearModulo(
      'reporteria-evolucion',
      'Evolución longitudinal de retención',
      datosEvolucion,
      () => <EvolucionRetencion isExportMode />,
    ),
    crearModulo(
      'reporteria-ingresos',
      'Ingresos por cohorte',
      datosIngreso,
      () => (
        <TablaPeriodos
          titulo="Ingresos por cohorte"
          descripcion="Cantidades informadas por vía de admisión para cada cohorte de ingreso."
          indicadores={INDICADORES_INGRESOS}
          filas={filasIngreso}
        />
      ),
    ),
    crearModulo(
      'reporteria-matricula',
      'Matrícula anual',
      datosMatricula,
      () => (
          <TablaPeriodos
            titulo="Matrícula anual"
            descripcion="Matrícula total y participación de mujeres para cada año de medición."
            indicadores={INDICADORES_MATRICULA}
            filas={filasMatricula}
          />
      ),
    ),
    crearModulo(
      'reporteria-retencion',
      'Cohortes / Tasas de retención',
      datosRetencion,
      () => (
          <TablaPeriodos
            titulo="Cohortes / Tasas de retención"
            descripcion="Porcentaje de estudiantes que permanecen en la carrera según año de ingreso."
            indicadores={INDICADORES_RETENCION}
            filas={filasProgresion}
          />
      ),
    ),
    crearModulo(
      'reporteria-titulacion',
      'Titulación y tiempo de egreso',
      datosTitulacion,
      () => (
          <TablaPeriodos
            titulo="Titulación y tiempo de egreso"
            descripcion="Tasas de titulación y duración real registradas para cada cohorte."
            indicadores={INDICADORES_TITULACION}
            filas={filasProgresion}
          />
      ),
    ),
    crearModulo(
      'reporteria-eficiencia',
      'Tasa de eficiencia curricular por cohorte',
      datosEficiencia,
      () => (
        <TablaIndicadores
          titulo="Tasa de eficiencia curricular por cohorte"
          descripcion="Número de estudiantes de cada cohorte según su tramo de eficiencia curricular."
          cabeceraIndicador="Indicador / Cohorte"
          indicadores={INDICADORES_EFICIENCIA}
          filas={filasEficiencia}
        />
      ),
      CATEGORIA_CURRICULAR,
    ),
    crearModulo(
      'reporteria-avance',
      'Estado de avance por ciclo formativo',
      datosAvance,
      () => (
        <TablaAvance
          titulo="Estado de avance por ciclo formativo"
          descripcion="Porcentaje de alumnos regulares de cada cohorte en las cinco categorías de avance curricular."
          columnas={COLUMNAS_AVANCE}
          filas={filasAvance}
        />
      ),
      CATEGORIA_CURRICULAR,
    ),
    crearModulo(
      'reporteria-criticas',
      'Asignaturas críticas',
      datosCriticas,
      () => (
        <TablaAsignaturasCriticas
          titulo="Asignaturas críticas"
          descripcion="Asignaturas con reprobación mayor o igual a 30% en al menos 3 de los últimos 5 años."
          filas={filasCriticas}
          anios={aniosCriticas}
        />
      ),
      CATEGORIA_CURRICULAR,
    ),
  ];

  return (
    <ReporteriaView
      reportTitle="Reportería"
      activeFilters={carrera || carCodigo || 'Sin filtros'}
      etiqueta="DIRECCIÓN DE CARRERA"
      subtitulo="Configura y genera reportes consolidados seleccionando los indicadores que necesitas."
      modulos={modulos}
      descripcionHistorial="Consulta y vuelve a descargar reportes institucionales generados anteriormente."
      loading={loading}
      error={error}
    />
  );
}
