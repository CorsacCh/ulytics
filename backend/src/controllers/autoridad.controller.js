import { Carrera, Macrounidad, FactMatricula, FactProgresion } from '../persistence/models/index.js';

// PostgreSQL devuelve los DECIMAL como string (por ejemplo, "85.00").
// Se normalizan a número y se conserva null cuando el dato no está informado.
const toNumberOrNull = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

// Las tasas se expresan en puntos porcentuales (0-100). Algunas cargas
// históricas guardaron fracciones 0-1 (0.35 = 35 %); se normalizan con el
// mismo criterio que director-home.controller.js antes de promediar o comparar.
const tasaEnPuntosPorcentuales = (valor) => {
  const tasa = toNumberOrNull(valor);
  if (tasa === null) return null;
  return tasa > 1 ? tasa : tasa * 100;
};

const redondear1 = (valor) => (valor === null ? null : Math.round(valor * 10) / 10);

// Promedio simple de los valores informados; null cuando ninguno está informado.
const promedio = (valores) => {
  const validos = valores.filter((valor) => valor !== null);
  if (validos.length === 0) return null;
  return redondear1(validos.reduce((suma, valor) => suma + valor, 0) / validos.length);
};

// Criterio de dominio: retención institucional por debajo de 80 % genera alerta.
const UMBRAL_RETENCION_INSTITUCIONAL = 80;

/**
 * Resumen institucional del Home de la Autoridad Central.
 * Agrega matrícula, retención y titulación a nivel de todas las carreras
 * (sin filtro de ámbito) y construye las series de los gráficos.
 */
export const getResumen = async (_req, res, next) => {
  try {
    const [matriculas, progresion, carreras, facultades] = await Promise.all([
      FactMatricula.findAll({
        attributes: ['car_codigo', 'anio_medicion', 'matricula_total'],
        raw: true
      }),
      FactProgresion.findAll({
        attributes: ['car_codigo', 'cohorte', 'retencion_a1', 'tasa_titulacion_total'],
        raw: true
      }),
      Carrera.findAll({ attributes: ['car_codigo', 'nombre', 'id_macrounidad'], raw: true }),
      Macrounidad.findAll({ attributes: ['id_macrounidad', 'nombre'], raw: true })
    ]);

    // Últimos períodos disponibles a nivel institucional.
    const anios = [...new Set(matriculas
      .map((fila) => toNumberOrNull(fila.anio_medicion))
      .filter((valor) => valor !== null))].sort((a, b) => a - b);
    const cohortes = [...new Set(progresion
      .map((fila) => toNumberOrNull(fila.cohorte))
      .filter((valor) => valor !== null))].sort((a, b) => a - b);
    const ultimoAnio = anios.at(-1) ?? null;
    const anioAnterior = anios.length > 1 ? anios[anios.length - 2] : null;
    const ultimaCohorte = cohortes.at(-1) ?? null;

    const filasMatriculaDe = (anio) => matriculas.filter(
      (fila) => toNumberOrNull(fila.anio_medicion) === anio
    );
    // Suma global ignorando nulls; null si el período no tiene ningún valor informado.
    const sumaMatricula = (filas) => {
      const valores = filas
        .map((fila) => toNumberOrNull(fila.matricula_total))
        .filter((valor) => valor !== null);
      if (valores.length === 0) return null;
      return valores.reduce((suma, valor) => suma + valor, 0);
    };

    const matriculasUltimoAnio = ultimoAnio === null ? [] : filasMatriculaDe(ultimoAnio);
    const matriculaTotal = sumaMatricula(matriculasUltimoAnio);
    const matriculaPrevia = anioAnterior === null ? null : sumaMatricula(filasMatriculaDe(anioAnterior));
    // Crecimiento porcentual vs el año anterior; null si no hay datos previos.
    const crecimientoMatricula = matriculaTotal !== null
      && matriculaPrevia !== null
      && matriculaPrevia > 0
      ? redondear1(((matriculaTotal - matriculaPrevia) / matriculaPrevia) * 100)
      : null;

    // Retención global: promedio simple de las carreras con dato informado en
    // la última cohorte.
    const progresionUltimaCohorte = ultimaCohorte === null
      ? []
      : progresion.filter((fila) => toNumberOrNull(fila.cohorte) === ultimaCohorte);
    const retencionInstitucional = promedio(
      progresionUltimaCohorte.map((fila) => tasaEnPuntosPorcentuales(fila.retencion_a1))
    );
    // Titulación: la última cohorte suele ser de ingresos recientes con 0 %
    // titulados, por lo que se usa la cohorte más reciente que tenga al menos
    // un valor informado (> 0) en tasa_titulacion_total. El promedio incluye
    // todos los valores informados de esa cohorte (incluidos ceros informados).
    const titulacionPorCohorte = new Map();
    for (const fila of progresion) {
      const cohorte = toNumberOrNull(fila.cohorte);
      const titulacion = tasaEnPuntosPorcentuales(fila.tasa_titulacion_total);
      if (cohorte === null || titulacion === null) continue;
      const valores = titulacionPorCohorte.get(cohorte) ?? [];
      valores.push(titulacion);
      titulacionPorCohorte.set(cohorte, valores);
    }
    const cohorteTitulacion = [...titulacionPorCohorte.entries()]
      .filter(([, valores]) => valores.some((valor) => valor > 0))
      .map(([cohorte]) => cohorte)
      .sort((a, b) => a - b)
      .at(-1) ?? null;
    const titulacionTotal = cohorteTitulacion === null
      ? null
      : promedio(titulacionPorCohorte.get(cohorteTitulacion) ?? []);

    // Carreras monitoreadas: distintas carreras con matrícula informada en el
    // último año; sin datos de medición se recurre al catálogo completo.
    const carrerasMonitoreadas = ultimoAnio !== null
      ? new Set(matriculasUltimoAnio.map((fila) => fila.car_codigo)).size
      : carreras.length;

    const carreraPorCodigo = new Map(carreras.map((carrera) => [carrera.car_codigo, carrera]));
    const facultadPorId = new Map(facultades.map((facultad) => [facultad.id_macrounidad, facultad.nombre]));
    const nombreDeFacultad = (idMacrounidad) => {
      if (!idMacrounidad) return 'Sin facultad';
      return facultadPorId.get(idMacrounidad) ?? idMacrounidad;
    };
    // La facultad (macrounidad) se resuelve desde la carrera; sin catálogo se agrupa en "Sin facultad".
    const facultadDeCarrera = (carCodigo) => carreraPorCodigo.get(carCodigo)?.id_macrounidad ?? null;

    // Gráfico de líneas: matrícula global por año de medición (ascendente).
    const evolucionMatricula = anios.map((anio) => ({
      anio,
      matricula: sumaMatricula(filasMatriculaDe(anio))
    }));

    // Gráfico torta: participación (%) de cada facultad en la matrícula del último año.
    const matriculaPorFacultad = new Map();
    for (const fila of matriculasUltimoAnio) {
      const idFacultad = facultadDeCarrera(fila.car_codigo);
      const matricula = toNumberOrNull(fila.matricula_total) ?? 0;
      matriculaPorFacultad.set(idFacultad, (matriculaPorFacultad.get(idFacultad) ?? 0) + matricula);
    }
    const distribucionFacultad = matriculaTotal !== null && matriculaTotal > 0
      ? [...matriculaPorFacultad.entries()]
        .map(([idFacultad, matricula]) => ({
          name: nombreDeFacultad(idFacultad),
          value: redondear1((matricula / matriculaTotal) * 100)
        }))
        .sort((a, b) => b.value - a.value)
      : [];

    // Tabla Top 4: carreras con más matrícula en el último año, con retención y
    // titulación de la última cohorte.
    const progresionPorCarrera = new Map(
      progresionUltimaCohorte.map((fila) => [fila.car_codigo, fila])
    );
    const topCarreras = matriculasUltimoAnio
      .map((fila) => {
        const carrera = carreraPorCodigo.get(fila.car_codigo);
        const progreso = progresionPorCarrera.get(fila.car_codigo);
        return {
          carrera: carrera?.nombre ?? fila.car_codigo,
          matricula: toNumberOrNull(fila.matricula_total),
          retencion: tasaEnPuntosPorcentuales(progreso?.retencion_a1),
          titulacion: tasaEnPuntosPorcentuales(progreso?.tasa_titulacion_total)
        };
      })
      .filter((fila) => fila.matricula !== null)
      .sort((a, b) => b.matricula - a.matricula)
      .slice(0, 4);

    // Gráfico de barras: promedio de retención por facultad en la última cohorte.
    const retencionesPorFacultad = new Map();
    for (const fila of progresionUltimaCohorte) {
      const retencion = tasaEnPuntosPorcentuales(fila.retencion_a1);
      if (retencion === null) continue;
      const idFacultad = facultadDeCarrera(fila.car_codigo);
      const valores = retencionesPorFacultad.get(idFacultad) ?? [];
      valores.push(retencion);
      retencionesPorFacultad.set(idFacultad, valores);
    }
    const retencionFacultad = [...retencionesPorFacultad.entries()]
      .map(([idFacultad, valores]) => ({
        facultad: nombreDeFacultad(idFacultad),
        retencion: promedio(valores)
      }))
      .filter((fila) => fila.retencion !== null)
      .sort((a, b) => a.facultad.localeCompare(b.facultad, 'es'));

    // Alertas lógicas derivadas de los cálculos: solo métricas de negocio.
    const alertas = [];
    if (crecimientoMatricula === null) {
      alertas.push({
        tipo: 'informativa',
        mensaje: 'Sin datos previos para calcular el crecimiento de la matrícula.'
      });
    } else if (crecimientoMatricula > 0) {
      alertas.push({
        tipo: 'positiva',
        mensaje: `Matrícula en crecimiento: +${crecimientoMatricula}% vs el año ${anioAnterior}.`
      });
    } else if (crecimientoMatricula < 0) {
      alertas.push({
        tipo: 'critica',
        mensaje: `Matrícula en descenso: ${crecimientoMatricula}% vs el año ${anioAnterior}.`
      });
    } else {
      alertas.push({
        tipo: 'informativa',
        mensaje: 'Matrícula estable respecto del año anterior.'
      });
    }
    if (retencionInstitucional === null) {
      alertas.push({
        tipo: 'informativa',
        mensaje: 'Sin datos de retención para la última cohorte.'
      });
    } else if (retencionInstitucional >= UMBRAL_RETENCION_INSTITUCIONAL) {
      alertas.push({
        tipo: 'positiva',
        mensaje: `Retención institucional en ${retencionInstitucional}% para la cohorte ${ultimaCohorte}.`
      });
    } else {
      alertas.push({
        tipo: 'critica',
        mensaje: `Retención institucional en ${retencionInstitucional}% (cohorte ${ultimaCohorte}), por debajo del umbral del ${UMBRAL_RETENCION_INSTITUCIONAL}%.`
      });
    }

    return res.status(200).json({
      kpis: {
        matricula_total: matriculaTotal,
        crecimiento_matricula: crecimientoMatricula,
        retencion_institucional: retencionInstitucional,
        titulacion_total: titulacionTotal,
        cohorte_titulacion: cohorteTitulacion,
        carreras_monitoreadas: carrerasMonitoreadas
      },
      graficos: {
        evolucion_matricula: evolucionMatricula,
        distribucion_facultad: distribucionFacultad,
        top_carreras: topCarreras,
        retencion_facultad: retencionFacultad
      },
      alertas
    });
  } catch (error) {
    return next(error);
  }
};
