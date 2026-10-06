import { useEffect, useState } from 'react';
import { Landmark } from 'lucide-react';
import { facultadesOptions, carrerasOptions, type OpcionCarrera, type OpcionFacultad } from '../data/institucionData';
import { AutoridadSelectors } from './AutoridadSelectors';
import { DataCardView } from '../../components/DataCardView';
import { RangoPeriodos } from '../../components/RangoPeriodos';
import { enRango, type RangoPeriodo } from '../../components/series';
import { obtenerCatalogoInstitucional } from '../api';
import { obtenerCurricularCarrera, type RespuestaCurricular } from '../../decano/api';
import { AvanceCicloFormativo } from '../../components/AvanceCicloFormativo';
import { EficienciaCurricular } from '../../components/EficienciaCurricular';
import {
  TablaAsignaturasCriticas,
  TablaAvance,
  TablaIndicadores,
} from '../../director/components/TablasCurriculares';
import { COLUMNAS_AVANCE, INDICADORES_EFICIENCIA } from '../../director/data/curricular';
import type { FilaPeriodo } from '../../director/data/indicadoresProgresion';

// El drill-down consume GET /api/reporteria/:car_codigo/curricular; no se
// mantiene ninguna colección estática de demostración en este componente.

export function ProgresionCurricularAutoridad() {
  const [selectedFacultad, setSelectedFacultad] = useState<string | null>(null);
  const [selectedCarrera, setSelectedCarrera] = useState<string | null>(null);

  // La carrera se resetea al cambiar la facultad hasta que el usuario elija
  // una carrera de la lista filtrada.
  const handleFacultadChange = (id: string) => {
    setSelectedFacultad(id);
    setSelectedCarrera(null);
  };

  const handleCarreraChange = (id: string) => {
    setSelectedCarrera(id);
    setRangoCohorte(['todos', 'todos']);
    setRangoAnio(['todos', 'todos']);
  };

  // Catálogo real del backend (GET /api/ambitos). Mientras carga o si la API
  // falla, los selectores degradan a los mocks estáticos de institucionData.
  const [facultadesReales, setFacultadesReales] = useState<OpcionFacultad[]>([]);
  const [carrerasReales, setCarrerasReales] = useState<OpcionCarrera[]>([]);

  useEffect(() => {
    let activo = true;
    obtenerCatalogoInstitucional()
      .then((catalogo) => {
        if (!activo) return;
        const tieneFacultades = catalogo.facultades.length > 0;
        // Sin id_macrounidad no se puede filtrar por facultad: se conserva el
        // fallback estático en lugar de mostrar un selector vacío.
        const tieneVinculo = catalogo.carreras.length > 0
          && catalogo.carreras.every((carrera) => Boolean(carrera.id_macrounidad));
        if (tieneFacultades) {
          setFacultadesReales(
            catalogo.facultades.map((facultad) => ({
              id: facultad.id_macrounidad,
              nombre: facultad.nombre,
            })),
          );
        }
        if (tieneVinculo) {
          setCarrerasReales(
            catalogo.carreras.map((carrera) => ({
              // El código oficial es el identificador: es único y es lo que
              // consume el drill-down del Director.
              id: carrera.car_codigo,
              nombre: carrera.nombre,
              facultadId: carrera.id_macrounidad ?? '',
              car_codigo: carrera.car_codigo,
            })),
          );
        }
        if (tieneFacultades || tieneVinculo) {
          // Los IDs reales (id_macrounidad/car_codigo) no coinciden con los
          // estáticos: se limpia la selección para evitar IDs huérfanos.
          setSelectedFacultad(null);
          setSelectedCarrera(null);
        }
      })
      .catch((error) => {
        console.error('Error al cargar el catálogo:', error);
        // Sin catálogo disponible la UI degrada a los mocks, nunca se rompe.
      });
    return () => {
      activo = false;
    };
  }, []);

  // Opciones efectivas: reales cuando llegaron, estáticas como fallback.
  const facultadesEfectivas = facultadesReales.length > 0 ? facultadesReales : facultadesOptions;
  const carrerasEfectivas = carrerasReales.length > 0 ? carrerasReales : carrerasOptions;
  const carCodigo =
    carrerasEfectivas.find((carrera) => carrera.id === selectedCarrera)?.car_codigo ?? null;

  const [respuesta, setRespuesta] = useState<RespuestaCurricular | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rangoCohorte, setRangoCohorte] = useState<RangoPeriodo>(['todos', 'todos']);
  const [rangoAnio, setRangoAnio] = useState<RangoPeriodo>(['todos', 'todos']);

  useEffect(() => {
    if (!carCodigo) {
      setRespuesta(null);
      setError(null);
      setCargando(false);
      return;
    }

    let activo = true;

    const cargarDrillDown = async () => {
      try {
        setCargando(true);
        setError(null);
        const curricular = await obtenerCurricularCarrera(carCodigo);
        if (!activo) return;
        setRespuesta(curricular);
      } catch (err) {
        if (!activo) return;
        setRespuesta(null);
        setError(
          err instanceof Error
            ? err.message
            : 'No fue posible cargar los datos curriculares de la carrera seleccionada.'
        );
      } finally {
        if (activo) setCargando(false);
      }
    };

    cargarDrillDown();

    return () => {
      activo = false;
    };
  }, [carCodigo]);

  const facultadSeleccionada = facultadesEfectivas.find((f) => f.id === selectedFacultad)?.nombre ?? null;
  const carreraSeleccionada = carrerasEfectivas.find((c) => c.id === selectedCarrera)?.nombre ?? null;
  const contextoSeleccion = facultadSeleccionada
    ? carreraSeleccionada
      ? `${facultadSeleccionada} · ${carreraSeleccionada}`
      : `${facultadSeleccionada} · Seleccione una carrera`
    : 'Seleccione una facultad y una carrera para filtrar';

  // Adapta la respuesta del endpoint a la forma que consumen los helpers del
  // Respuesta curricular de la carrera seleccionada (GET .../curricular).
  const datosReales = respuesta && carCodigo ? respuesta : null;

  // Vista longitudinal: los gráficos reciben la serie histórica completa
  // (todas las cohortes y años), igual que el Dashboard del Director.
  const eficienciaHistorica = datosReales?.eficiencia ?? [];
  const avanceHistorico = datosReales?.avance_curricular ?? [];
  const criticasHistoricas = datosReales?.criticas ?? [];

  const filasEficiencia: FilaPeriodo[] = eficienciaHistorica.map((fila) => ({
    periodo: fila.cohorte,
    valores: {
      total_alumnos_regulares: fila.total_alumnos_regulares,
      nivel_baja: fila.nivel_baja,
      nivel_media: fila.nivel_media,
      nivel_alta: fila.nivel_alta,
      nivel_eficiente: fila.nivel_eficiente,
    },
  }));

  const filasAvance: FilaPeriodo[] = avanceHistorico.map((fila) => ({
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

  const cohortesDisponibles = [...new Set([...eficienciaHistorica.map((fila) => fila.cohorte),
    ...avanceHistorico.map((fila) => fila.cohorte)])].sort((a, b) => a - b);
  const aniosDisponibles = [...new Set(criticasHistoricas.map((fila) => fila.anio_medicion))].sort((a, b) => a - b);
  const filasEficienciaFiltradas = filasEficiencia.filter((fila) => enRango(fila.periodo, rangoCohorte));
  const filasAvanceFiltradas = filasAvance.filter((fila) => enRango(fila.periodo, rangoCohorte));
  const eficienciaFiltrada = eficienciaHistorica.filter((fila) => enRango(fila.cohorte, rangoCohorte));
  const avanceFiltrado = avanceHistorico.filter((fila) => enRango(fila.cohorte, rangoCohorte));
  const criticasFiltradas = criticasHistoricas.filter((fila) => enRango(fila.anio_medicion, rangoAnio));

  return (
    <div className="mx-auto max-w-[1440px] space-y-10 p-5 sm:p-8 lg:p-10 bg-[#F8FAFC] min-h-screen">
      
      {/* PANEL DE CONTROL DE AUTORIDAD (DOBLE FILTRO) */}
      <div className="flex flex-col gap-6 rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm xl:flex-row xl:items-end xl:justify-between">
        
        <div className="flex flex-col gap-2 flex-1">
          <p className="flex items-center gap-2 text-xs font-bold tracking-widest text-slate-500 uppercase">
            <Landmark className="size-4 text-[#FFB800]" />
            Nivel Central · Autoridad Institucional
          </p>
          <h2 className="text-2xl font-bold text-[#0A192F]">Progresión curricular</h2>
          
        </div>
      </div>

      {/* SELECTORES JERÁRQUICOS EN CASCADA: FACULTAD -> CARRERA */}
      <AutoridadSelectors
        facultades={facultadesEfectivas}
        carreras={carrerasEfectivas}
        selectedFacultad={selectedFacultad}
        selectedCarrera={selectedCarrera}
        onFacultadChange={handleFacultadChange}
        onCarreraChange={handleCarreraChange}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <RangoPeriodos etiqueta="Cohorte" opciones={cohortesDisponibles} valor={rangoCohorte} onChange={setRangoCohorte} disabled={cargando} />
        <RangoPeriodos etiqueta="Año de medición" opciones={aniosDisponibles} valor={rangoAnio} onChange={setRangoAnio} disabled={cargando} />
      </div>
      <p className="text-xs text-slate-500">Cohorte filtra eficiencia y avance; año de medición filtra asignaturas. Son independientes.</p>

      {/* CONTENEDOR DE DATOS DINÁMICOS */}
      <div className="space-y-6">
        
        {/* Encabezado Dinámico */}
        <div>
          <p className="text-xs font-bold tracking-widest text-slate-500 uppercase mb-2">
            {contextoSeleccion}
          </p>
          <h1 className="text-3xl font-bold text-[#0A192F]">Datos de Progresión Curricular</h1>
          <p className="mt-1 text-sm text-slate-500 max-w-2xl">
            Distribución de los tipos de estado de avance de estudiantes con condición académica de
            Alumno Regular, ciclos formativos y asignaturas informadas, según los datos cargados para
            la carrera.
          </p>
        </div>

        {/* DRILL-DOWN: mismos widgets que el Dashboard del Director */}
        {cargando && (
          <div className="flex flex-col gap-6 animate-pulse p-2" role="status" aria-live="polite">
            <div className="h-7 bg-gray-200 rounded w-1/3" />
            <div className="h-64 bg-gray-200 rounded-lg" />
            <div className="h-48 bg-gray-200 rounded-lg" />
          </div>
        )}

        {!cargando && error && (
          <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-slate-200/80 bg-white shadow-sm">
            <span className="text-sm font-medium text-red-600">{error}</span>
          </div>
        )}

        {!cargando && !error && carCodigo && datosReales && (
          <div className="space-y-6">
            <DataCardView
              title="Cantidad de estudiantes por tramo de eficiencia"
              description="Distribución de estudiantes de cada cohorte según su tramo de eficiencia."
              chartComponent={<EficienciaCurricular data={eficienciaFiltrada} mostrarCabecera={false} />}
              tableComponent={
                <TablaIndicadores
                  titulo="Cantidad de estudiantes por tramo de eficiencia"
                  descripcion="Número de estudiantes de cada cohorte según su tramo de eficiencia curricular."
                  cabeceraIndicador="Indicador / Cohorte"
                  indicadores={INDICADORES_EFICIENCIA}
                  filas={filasEficienciaFiltradas}
                  mostrarCabecera={false}
                />
              }
            />

            <DataCardView
              title="Estado de avance por ciclo formativo"
              description="Porcentaje de alumnos regulares y su cumplimiento esperado por ciclo."
              chartComponent={<AvanceCicloFormativo data={avanceFiltrado} mostrarCabecera={false} />}
              tableComponent={
                <TablaAvance
                  titulo="Estado de avance por ciclo formativo"
                  descripcion="Porcentaje de alumnos regulares de cada cohorte en las cinco categorías de avance curricular."
                  columnas={COLUMNAS_AVANCE}
                  filas={filasAvanceFiltradas}
                  mostrarCabecera={false}
                />
              }
            />

            <TablaAsignaturasCriticas
              titulo="Asignaturas informadas en la carga"
              descripcion="Códigos, semestres y tasas informados en el archivo de origen, sin aplicar una clasificación adicional."
              filas={criticasFiltradas}
              mensajeVacio="Todavía no hay asignaturas informadas para esta carrera."
            />
          </div>
        )}

        {!cargando && !error && !carCodigo && (
          <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-slate-200/80 bg-white shadow-sm">
            <span className="text-sm font-medium text-slate-500">
              {!selectedCarrera
                ? 'Seleccione una facultad y una carrera para ver el detalle del Director.'
                : 'La carrera seleccionada no tiene código en el catálogo institucional; no es posible cargar su detalle.'}
            </span>
          </div>
        )}

      </div>
    </div>
  );
}