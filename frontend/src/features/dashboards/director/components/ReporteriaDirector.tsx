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
  type FilaCritica,
  type FilaEficiencia,
  type FilaTitulacion,
} from '../data/curricular';
import {
  INDICADORES_MATRICULA,
  INDICADORES_RETENCION,
  INDICADORES_TITULACION,
  type FilaPeriodo,
} from '../data/indicadoresProgresion';
import type { FilaExportable } from '../../../../utils/exportUtils';

// Respuestas de /api/reporteria/:car_codigo/{matricula,progresion}
interface FilaMatricula {
  anio: number;
  ingresos_sua: number | null;
  ingresos_pace: number | null;
  ingresos_rae: number | null;
  ingresos_totales: number | null;
  matricula_total: number | null;
  matricula_mujeres: number | null;
}

interface FilaProgresion {
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

interface RespuestaMatricula {
  carrera: string;
  datos: FilaMatricula[];
}

interface RespuestaProgresion {
  carrera: string;
  datos: FilaProgresion[];
}

interface RespuestaCurricular {
  carrera: string;
  eficiencia: FilaEficiencia[];
  titulacion: FilaTitulacion[];
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

  const [matriculaData, setMatriculaData] = useState<FilaMatricula[]>([]);
  const [progresionData, setProgresionData] = useState<FilaProgresion[]>([]);
  const [eficiencia, setEficiencia] = useState<FilaEficiencia[]>([]);
  const [avance, setAvance] = useState<FilaTitulacion[]>([]);
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
        setMatriculaData(matricula.datos ?? []);
        setProgresionData(progresion.datos ?? []);
        setEficiencia(curricular.eficiencia ?? []);
        setAvance(curricular.titulacion ?? []);
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
      tasa_titulacion_temprana: fila.tasa_titulacion_temprana,
      tasa_titulacion_oportuna: fila.tasa_titulacion_oportuna,
      tasa_titulacion_efectiva: fila.tasa_titulacion_efectiva,
      duracion_real_semestres: fila.duracion_real_semestres,
    },
  }));

  const filasMatricula: FilaPeriodo[] = matriculaData.map((fila) => ({
    periodo: fila.anio,
    valores: {
      ingresos_sua: fila.ingresos_sua,
      ingresos_pace: fila.ingresos_pace,
      ingresos_rae: fila.ingresos_rae,
      ingresos_totales: fila.ingresos_totales,
      matricula_total: fila.matricula_total,
      pct_mujeres:
        fila.matricula_total && fila.matricula_mujeres !== null
          ? Number(((fila.matricula_mujeres / fila.matricula_total) * 100).toFixed(1))
          : null,
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

  const datosMatricula: FilaExportable[] = matriculaData.map((fila) => ({
    Año: fila.anio,
    'Ingresos SUA/PAES': fila.ingresos_sua,
    'Ingresos PACE': fila.ingresos_pace,
    'Ingresos RAE': fila.ingresos_rae,
    'Ingresos totales': fila.ingresos_totales,
    'Matrícula total': fila.matricula_total,
    'Matrícula mujeres': fila.matricula_mujeres,
  }));

  const datosTitulacion: FilaExportable[] = progresionData.map((fila) => ({
    Cohorte: fila.cohorte,
    'Titulación temprana (TTT)': fila.tasa_titulacion_temprana,
    'Titulación oportuna (TTO)': fila.tasa_titulacion_oportuna,
    'Titulación efectiva (TTE)': fila.tasa_titulacion_efectiva,
    'Duración real (semestres)': fila.duracion_real_semestres,
  }));

  const filasEficiencia: FilaPeriodo[] = eficiencia.map((fila) => ({
    periodo: fila.anio,
    valores: {
      total_alumnos_regulares: fila.total_alumnos_regulares,
      nivel_baja: fila.nivel_baja,
      nivel_media: fila.nivel_media,
      nivel_alta: fila.nivel_alta,
      nivel_eficiente: fila.nivel_eficiente,
    },
  }));

  const filasAvance: FilaPeriodo[] = avance.map((fila) => ({
    periodo: fila.anio,
    valores: {
      bachilleratos: fila.bachilleratos,
      licenciaturas_asig_pendientes: fila.licenciaturas_asig_pendientes,
      licenciaturas: fila.licenciaturas,
      titulados: fila.titulados,
    },
  }));

  const filasCriticas = agruparAsignaturasCriticas(criticas);
  const aniosCriticas = obtenerAnios(criticas.map((critica) => critica.anio));

  const datosEficiencia: FilaExportable[] = eficiencia.map((fila) => ({
    Año: fila.anio,
    'Nº Alumnos regulares': fila.total_alumnos_regulares,
    'Nivel baja (0<60%)': fila.nivel_baja,
    'Nivel media (61-<80%)': fila.nivel_media,
    'Nivel alta (80-<100%)': fila.nivel_alta,
    'Nivel eficiente (=100%)': fila.nivel_eficiente,
  }));

  const datosAvance: FilaExportable[] = avance.map((fila) => ({
    Año: fila.anio,
    Bachillerato: fila.bachilleratos,
    'Lic. con asignaturas pendientes': fila.licenciaturas_asig_pendientes,
    Licenciatura: fila.licenciaturas,
    Título: fila.titulados,
  }));

  const datosCriticas: FilaExportable[] = criticas.map((fila) => ({
    Asignatura: fila.asig_codigo,
    Semestre: fila.semestre,
    Año: fila.anio,
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
      'reporteria-matricula',
      'Matrícula y admisión por cohorte',
      datosMatricula,
      () => (
          <TablaPeriodos
            titulo="Matrícula y admisión por cohorte"
            descripcion="Ingresos por vía de admisión y matrícula total registrada en cada año."
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
          descripcion="Número de estudiantes registrados cada año según su estado de avance curricular."
          cabeceraIndicador="Indicador / Año"
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
          descripcion="Número de estudiantes por año según el ciclo formativo en que se encuentran."
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