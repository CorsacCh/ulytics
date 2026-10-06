import { useEffect, useState } from 'react';
import { Landmark } from 'lucide-react';
import { facultadesOptions, carrerasOptions, type OpcionCarrera, type OpcionFacultad } from '../data/institucionData';
import { obtenerCatalogoInstitucional } from '../api';
import { AutoridadSelectors } from './AutoridadSelectors';
import { DataCardView } from '../../components/DataCardView';
import {
  obtenerMatriculaCarrera,
  obtenerProgresionCarrera,
  type FilaIngreso,
  type FilaMatricula,
  type FilaProgresion,
} from '../../decano/api';
import { EvolucionRetencion } from '../../director/components/EvolucionRetencion';
import { TablaPeriodos } from '../../director/components/ProgresionAnalitica';
import {
  INDICADORES_INGRESOS,
  INDICADORES_MATRICULA,
  INDICADORES_RETENCION,
  INDICADORES_TITULACION,
  type FilaPeriodo,
} from '../../director/data/indicadoresProgresion';
import type { CohorteRetencion } from '../../director/data/retentionData';

export function ProgresionAnaliticaAutoridad() {
  const [selectedFacultad, setSelectedFacultad] = useState<string | null>(null);
  const [selectedCarrera, setSelectedCarrera] = useState<string | null>(null);

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

  // La carrera se resetea al cambiar la facultad hasta que el usuario elija
  // una carrera de la lista filtrada.
  const handleFacultadChange = (id: string) => {
    setSelectedFacultad(id);
    setSelectedCarrera(null);
  };

  const handleCarreraChange = (id: string) => setSelectedCarrera(id);

  // Código oficial de la carrera elegida: habilita el drill-down con los
  // mismos endpoints que consume el Dashboard del Director.
  const carCodigo =
    carrerasEfectivas.find((carrera) => carrera.id === selectedCarrera)?.car_codigo ?? null;

  const [ingresos, setIngresos] = useState<FilaIngreso[]>([]);
  const [matriculasAnuales, setMatriculasAnuales] = useState<FilaMatricula[]>([]);
  const [progresion, setProgresion] = useState<FilaProgresion[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!carCodigo) {
      setIngresos([]);
      setMatriculasAnuales([]);
      setProgresion([]);
      setError(null);
      setCargando(false);
      return;
    }

    let activo = true;

    const cargarDrillDown = async () => {
      try {
        setCargando(true);
        setError(null);
        // Mismas rutas que usa el Director: GET /api/reporteria/:car_codigo/...
        const [matricula, progresionCarrera] = await Promise.all([
          obtenerMatriculaCarrera(carCodigo),
          obtenerProgresionCarrera(carCodigo),
        ]);
        if (!activo) return;
        setIngresos(matricula.ingresos_cohorte ?? []);
        setMatriculasAnuales(matricula.matricula_anual ?? []);
        setProgresion(progresionCarrera.datos ?? []);
      } catch (err) {
        if (!activo) return;
        setIngresos([]);
        setMatriculasAnuales([]);
        setProgresion([]);
        setError(
          err instanceof Error
            ? err.message
            : 'No fue posible cargar los datos de la carrera seleccionada.'
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

  // Mismo despivotado que aplica el Director antes de renderizar TablaPeriodos.
  const filasIngreso: FilaPeriodo[] = ingresos.map((fila) => ({
    periodo: fila.cohorte,
    valores: {
      ingresos_totales: fila.ingresos_totales,
      ingresos_sua: fila.ingresos_sua,
      ingresos_pace: fila.ingresos_pace,
      ingresos_especiales: fila.ingresos_especiales,
    },
  }));

  // La matrícula se organiza por año de medición y no por cohorte de ingreso.
  const filasMatricula: FilaPeriodo[] = matriculasAnuales.map((fila) => ({
    periodo: fila.anio_medicion,
    valores: {
      matricula_total: fila.matricula_total,
      matricula_mujeres: fila.matricula_mujeres,
      porcentaje_mujeres: fila.porcentaje_mujeres,
    },
  }));

  const filasProgresion: FilaPeriodo[] = progresion.map((fila) => ({
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

  // El gráfico recibe la serie ya formateada: al recibir `datos` el componente
  // no autoconsulta, evitando que use el ámbito de la sesión (INSTITUCION).
  const evolucionRetencion: CohorteRetencion[] = progresion.map((fila) => ({
    cohorte: String(fila.cohorte),
    retencion1erAno: fila.retencion_a1,
    retencion2doAno: fila.retencion_a2,
    retencion3erAno: fila.retencion_a3,
    retencion4toAno: fila.retencion_a4,
    retencionTotal: fila.retencion_total,
  }));

  const sinSeleccion = !selectedCarrera;

  return (
    <div className="mx-auto max-w-[1440px] space-y-10 p-5 sm:p-8 lg:p-10 bg-[#F8FAFC] min-h-screen">
      
      {/* PANEL DE CONTROL DE AUTORIDAD (DOBLE FILTRO) */}
      <div className="flex flex-col gap-6 rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm xl:flex-row xl:items-end xl:justify-between">
        
        <div className="flex flex-col gap-2 flex-1">
          <p className="flex items-center gap-2 text-xs font-bold tracking-widest text-slate-500 uppercase">
            <Landmark className="size-4 text-[#FFB800]" />
            Nivel Central · Autoridad Institucional
          </p>
          <h2 className="text-2xl font-bold text-[#0A192F]">Progresión analítica</h2>
          
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

      {/* CONTENEDOR DE DATOS DINÁMICOS */}
      <div className="space-y-6">
        
        <div>
          <p className="text-xs font-bold tracking-widest text-slate-500 uppercase mb-2">
            {contextoSeleccion}
          </p>
          <h1 className="text-3xl font-bold text-[#0A192F]">Datos de Progresión Analítica</h1>
          <p className="mt-1 text-sm text-slate-500 max-w-2xl">
            Visualización institucional de matrícula, admisión y retención.
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

        {!cargando && !error && carCodigo && (
          <div className="space-y-10">
            {/* TOGGLE GRÁFICO/TABLA: Evolución longitudinal de retención por cohorte */}
            <DataCardView
              title="Evolución Longitudinal de Retención"
              description="Porcentaje de retención por cohorte a lo largo de los años."
              chartComponent={<EvolucionRetencion datos={evolucionRetencion} mostrarCabecera={false} />}
              tableComponent={
                <TablaPeriodos
                  titulo="Cohortes / Tasas de retención"
                  descripcion="Porcentaje de estudiantes que permanecen en la carrera según año de ingreso."
                  indicadores={INDICADORES_RETENCION}
                  filas={filasProgresion}
                  mostrarCabecera={false}
                />
              }
            />

            <TablaPeriodos
              titulo="Ingresos por cohorte"
              descripcion="Cantidades informadas por vía de admisión para cada cohorte de ingreso."
              indicadores={INDICADORES_INGRESOS}
              filas={filasIngreso}
            />

            <TablaPeriodos
              titulo="Matrícula anual"
              descripcion="Matrícula total y participación de mujeres para cada año de medición."
              indicadores={INDICADORES_MATRICULA}
              filas={filasMatricula}
            />

            <TablaPeriodos
              titulo="Titulación y tiempo de egreso"
              descripcion="Tasas de titulación y duración real registradas para cada cohorte."
              indicadores={INDICADORES_TITULACION}
              filas={filasProgresion}
            />
          </div>
        )}

        {!cargando && !error && !carCodigo && (
          <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-slate-200/80 bg-white shadow-sm">
            <span className="text-sm font-medium text-slate-500">
              {sinSeleccion
                ? 'Seleccione una facultad y una carrera para ver el detalle del Director.'
                : 'La carrera seleccionada no tiene código en el catálogo institucional; no es posible cargar su detalle.'}
            </span>
          </div>
        )}

      </div>
    </div>
  );
}