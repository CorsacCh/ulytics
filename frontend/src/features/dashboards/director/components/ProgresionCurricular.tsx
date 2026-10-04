import { useEffect, useState } from 'react';
import { ApiError, apiRequest } from '../../../auth/api';
import { useAuth } from '../../../auth/AuthContext';
import {
  COLUMNAS_AVANCE,
  INDICADORES_EFICIENCIA,
  agruparAsignaturasCriticas,
  obtenerAnios,
  type FilaCritica,
  type FilaEficiencia,
  type FilaTitulacion,
} from '../data/curricular';
import type { FilaPeriodo } from '../data/indicadoresProgresion';
import {
  TablaAvance,
  TablaAsignaturasCriticas,
  TablaIndicadores,
} from './TablasCurriculares';

// Respuesta de GET /api/reporteria/:car_codigo/curricular
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
  return 'No fue posible cargar los indicadores de progresión curricular.';
}

export function ProgresionCurricular() {
  const { user } = useAuth();

  // El director solo puede ver la carrera de su ámbito (tipo PROGRAMA),
  // cuyo código es el mismo car_codigo de la tabla Carrera.
  const carCodigo = user?.ambito?.tipo === 'PROGRAMA' ? user.ambito.codigo : null;

  const [eficiencia, setEficiencia] = useState<FilaEficiencia[]>([]);
  const [titulacion, setTitulacion] = useState<FilaTitulacion[]>([]);
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

    const obtenerDatosDeReporteria = async () => {
      try {
        setLoading(true);
        setError(null);

        // apiRequest resuelve la URL base (VITE_BACKEND_URL) y envía la cookie de sesión;
        // las tres series comparten endpoint porque comparten la dimensión año.
        const respuesta = await apiRequest<RespuestaCurricular>(
          `/api/reporteria/${encodeURIComponent(carCodigo)}/curricular`
        );

        if (!activo) return;

        setEficiencia(respuesta.eficiencia ?? []);
        setTitulacion(respuesta.titulacion ?? []);
        setCriticas(respuesta.criticas ?? []);
        setCarrera(respuesta.carrera ?? '');
      } catch (err) {
        if (!activo) return;

        setEficiencia([]);
        setTitulacion([]);
        setCriticas([]);
        setError(describirError(err));
      } finally {
        if (activo) setLoading(false);
      }
    };

    obtenerDatosDeReporteria();

    return () => {
      activo = false;
    };
  }, [carCodigo]);

  // Despivotamos la eficiencia curricular: el año de la medición es el periodo.
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

  // Despivotamos la titulación por año hacia las columnas fijas de la tabla.
  const filasAvance: FilaPeriodo[] = titulacion.map((fila) => ({
    periodo: fila.anio,
    valores: {
      bachilleratos: fila.bachilleratos,
      licenciaturas_asig_pendientes: fila.licenciaturas_asig_pendientes,
      licenciaturas: fila.licenciaturas,
      titulados: fila.titulados,
    },
  }));

  // Las asignaturas críticas llegan una fila por año y se agrupan por asignatura-semestre.
  const filasCriticas = agruparAsignaturasCriticas(criticas);
  const aniosCriticas = obtenerAnios(criticas.map((critica) => critica.anio));


  return (
    <div className="mx-auto max-w-[1440px] space-y-10 p-5 sm:p-8 lg:p-10 bg-[#F8FAFC] min-h-screen">
      {/* HEADER INSTITUCIONAL */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold tracking-widest text-slate-500 uppercase mb-2">
            {carrera || 'PROGRESIÓN CURRICULAR'}
          </p>
          <h1 className="text-3xl font-bold text-[#0A192F]">Datos de Progresión Curricular</h1>
          <p className="mt-1 text-sm text-slate-500 max-w-2xl">
            Distribución de los tipos de estado de avance de estudiantes con condición académica de
            Alumno Regular, grados otorgados y asignaturas críticas, según los datos cargados para
            la carrera.
          </p>
        </div>
      </div>

      {loading && (
        <div
          className="flex min-h-[200px] items-center justify-center rounded-xl border border-slate-200/80 bg-white shadow-sm"
          role="status"
          aria-live="polite"
        >
          <span className="text-sm font-medium text-slate-500 animate-pulse">
            Cargando indicadores curriculares...
          </span>
        </div>
      )}

      {!loading && error && (
        <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-slate-200/80 bg-white shadow-sm">
          <span className="text-sm font-medium text-red-600">{error}</span>
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-10">
          {/* TABLA 1: Tasa de eficiencia curricular por cohorte */}
          <div id="progresion-curricular-eficiencia">
            <TablaIndicadores
              titulo="Tasa de eficiencia curricular por cohorte"
              descripcion="Número de estudiantes registrados cada año según su estado de avance curricular."
              cabeceraIndicador="Indicador / Año"
              indicadores={INDICADORES_EFICIENCIA}
              filas={filasEficiencia}
            />
          </div>

          {/* TABLA 2: Estado de avance por ciclo formativo */}
          <div id="progresion-curricular-avance">
            <TablaAvance
              titulo="Estado de avance por ciclo formativo"
              descripcion="Número de estudiantes por año según el ciclo formativo en que se encuentran."
              columnas={COLUMNAS_AVANCE}
              filas={filasAvance}
            />
          </div>

          {/* TABLA 3: Asignaturas críticas */}
          <div id="progresion-curricular-criticas">
            <TablaAsignaturasCriticas
              titulo="Asignaturas críticas"
              descripcion="Se consideran críticas las asignaturas con reprobación mayor o igual a 30% en al menos 3 de los últimos 5 años, afectando la permanencia, titulación y tiempos de titulación."
              filas={filasCriticas}
              anios={aniosCriticas}
              mensajeVacio="Todavía no hay asignaturas críticas cargadas para esta carrera."
            />
          </div>
        </div>
      )}
    </div>
  );
}
