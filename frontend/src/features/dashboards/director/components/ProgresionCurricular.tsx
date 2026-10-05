import { useEffect, useState } from 'react';
import { ApiError, apiRequest } from '../../../auth/api';
import { useAuth } from '../../../auth/AuthContext';
import {
  COLUMNAS_AVANCE,
  INDICADORES_EFICIENCIA,
  agruparAsignaturasCriticas,
  obtenerAnios,
  type FilaAvanceCurricular,
  type FilaCritica,
  type FilaEficiencia,
} from '../data/curricular';
import type { FilaPeriodo } from '../data/indicadoresProgresion';
import { DataCardView } from '../../components/DataCardView';
import { AvanceCicloFormativo } from './AvanceCicloFormativo';
import { EficienciaCurricular } from './EficienciaCurricular';
import {
  TablaAvance,
  TablaAsignaturasCriticas,
  TablaIndicadores,
} from './TablasCurriculares';

// Respuesta de GET /api/reporteria/:car_codigo/curricular
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
  return 'No fue posible cargar los indicadores de progresión curricular.';
}

export function ProgresionCurricular() {
  const { user } = useAuth();

  // El director solo puede ver la carrera de su ámbito (tipo PROGRAMA),
  // cuyo código es el mismo car_codigo de la tabla Carrera.
  const carCodigo = user?.ambito?.tipo === 'PROGRAMA' ? user.ambito.codigo : null;

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

    const obtenerDatosDeReporteria = async () => {
      try {
        setLoading(true);
        setError(null);

        // apiRequest resuelve la URL base (VITE_BACKEND_URL) y envía la cookie de sesión;
        // Las tres series se consultan juntas, aunque cohortes y años de medición
        // se mantienen como dimensiones diferentes en la respuesta.
        const respuesta = await apiRequest<RespuestaCurricular>(
          `/api/reporteria/${encodeURIComponent(carCodigo)}/curricular`
        );

        if (!activo) return;

        setEficiencia(respuesta.eficiencia ?? []);
        setAvance(respuesta.avance_curricular ?? []);
        setCriticas(respuesta.criticas ?? []);
        setCarrera(respuesta.carrera ?? '');
      } catch (err) {
        if (!activo) return;

        setEficiencia([]);
        setAvance([]);
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

  // La eficiencia curricular se entrega por cohorte.
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

  // Las cinco categorías de avance son porcentajes excluyentes por cohorte.
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

  // Las asignaturas críticas llegan una fila por año y se agrupan por asignatura-semestre.
  const filasCriticas = agruparAsignaturasCriticas(criticas);
  const aniosCriticas = obtenerAnios(criticas.map((critica) => critica.anio_medicion));


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
            Alumno Regular, ciclos formativos y asignaturas informadas, según los datos cargados para
            la carrera.
          </p>
        </div>
      </div>

      {loading && (
        <div
          className="flex flex-col gap-6 animate-pulse p-2"
          role="status"
          aria-live="polite"
        >
          <div className="h-7 bg-gray-200 rounded w-1/3" />
          <div className="h-64 bg-gray-200 rounded-lg" />
          <div className="h-64 bg-gray-200 rounded-lg" />
          <div className="h-48 bg-gray-200 rounded-lg" />
        </div>
      )}

      {!loading && error && (
        <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-slate-200/80 bg-white shadow-sm">
          <span className="text-sm font-medium text-red-600">{error}</span>
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-10">
          {/* TOGGLE GRÁFICO/TABLA: Tasa de eficiencia curricular por cohorte */}
          <div id="progresion-curricular-eficiencia">
            <DataCardView
              title="Cantidad de estudiantes por tramo de eficiencia"
              description="Distribución de estudiantes de cada cohorte según su tramo de eficiencia."
              chartComponent={<EficienciaCurricular data={eficiencia} mostrarCabecera={false} />}
              tableComponent={
                <TablaIndicadores
                  titulo="Cantidad de estudiantes por tramo de eficiencia"
                  descripcion="Número de estudiantes de cada cohorte según su tramo de eficiencia curricular."
                  cabeceraIndicador="Indicador / Cohorte"
                  indicadores={INDICADORES_EFICIENCIA}
                  filas={filasEficiencia}
                  mostrarCabecera={false}
                />
              }
            />
          </div>

          {/* TOGGLE GRÁFICO/TABLA: Estado de avance por ciclo formativo */}
          <div id="progresion-curricular-avance">
            <DataCardView
              title="Estado de avance por ciclo formativo"
              description="Porcentaje de alumnos regulares y su cumplimiento esperado por ciclo."
              chartComponent={<AvanceCicloFormativo data={avance} mostrarCabecera={false} />}
              tableComponent={
                <TablaAvance
                  titulo="Estado de avance por ciclo formativo"
                  descripcion="Porcentaje de alumnos regulares de cada cohorte en las cinco categorías de avance curricular."
                  columnas={COLUMNAS_AVANCE}
                  filas={filasAvance}
                  mostrarCabecera={false}
                />
              }
            />
          </div>

          {/* TABLA 3: Asignaturas críticas */}
          <div id="progresion-curricular-criticas">
            <TablaAsignaturasCriticas
              titulo="Asignaturas informadas en la carga"
              descripcion="Códigos, semestres y tasas informados en el archivo de origen, sin aplicar una clasificación adicional."
              filas={filasCriticas}
              anios={aniosCriticas}
              mensajeVacio="Todavía no hay asignaturas informadas para esta carrera."
            />
          </div>
        </div>
      )}
    </div>
  );
}
