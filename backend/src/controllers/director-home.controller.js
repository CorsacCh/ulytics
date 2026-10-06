import { AppError } from '../utils/app-error.js';
import {
  FactIngreso,
  FactMatricula,
  FactProgresion,
  FactAsignaturaCritica
} from '../persistence/models/index.js';

const toNumberOrNull = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

function parsePeriod(value, name) {
  if (value === undefined) return null;
  if (typeof value !== 'string' || !/^[1-9]\d{3}$/.test(value)) {
    throw new AppError(`${name} debe ser un año de cuatro dígitos.`, 400, 'VALIDATION_ERROR');
  }
  return Number(value);
}

const periods = (values) => [...new Set(values.map(toNumberOrNull).filter((value) => value !== null))]
  .sort((a, b) => a - b);

// Umbral de reprobación crítico en puntos porcentuales (0-100, DECIMAL(5,2)).
// Criterio de dominio: "reprobación mayor o igual a 30 %" cuenta como alerta.
// Las tasas se normalizan a esta escala antes de comparar por si una carga
// histórica guardó el valor como fracción 0-1 (0.30 = 30 %).
const UMBRAL_REPROBACION_CRITICO = 30;

const tasaEnPuntosPorcentuales = (valor) => {
  const tasa = toNumberOrNull(valor);
  if (tasa === null) return null;
  // <= 1 se interpreta como fracción histórica (0.35 = 35 %); por encima
  // de 1 el valor ya está en puntos porcentuales (35 = 35 %).
  return tasa > 1 ? tasa : tasa * 100;
};

export const getHomeDashboard = async (req, res, next) => {
  try {
    const requestedCohort = parsePeriod(req.query.cohorte, 'cohorte');
    const requestedYear = parsePeriod(req.query.anio_medicion, 'anio_medicion');
    // Únicamente la carrera verificada por authorizeDirectorCareer.
    const career = req.academicCareer;
    if (!career) throw new AppError('Ámbito no autorizado.', 403, 'ACADEMIC_SCOPE_FORBIDDEN');
    const where = { car_codigo: career.car_codigo };

    const [ingresos, matriculas, progresion, asignaturas] = await Promise.all([
      FactIngreso.findAll({ where, attributes: ['cohorte', 'ingresos_totales'], raw: true }),
      FactMatricula.findAll({ where, attributes: ['anio_medicion', 'matricula_total'], raw: true }),
      FactProgresion.findAll({
        where,
        attributes: ['cohorte', 'retencion_a1', 'tasa_titulacion_oportuna', 'duracion_real_semestres'],
        raw: true
      }),
      FactAsignaturaCritica.findAll({
        where,
        attributes: ['anio_medicion', 'tasa_reprobacion', 'estado_dato'],
        raw: true
      })
    ]);

    const cohortes = periods([...ingresos, ...progresion].map((fila) => fila.cohorte));
    const anios = periods([...matriculas, ...asignaturas].map((fila) => fila.anio_medicion));
    const cohorte = requestedCohort ?? cohortes.at(-1) ?? null;
    const anio = requestedYear ?? anios.at(-1) ?? null;
    const ingreso = ingresos.find((fila) => Number(fila.cohorte) === cohorte);
    const matricula = matriculas.find((fila) => Number(fila.anio_medicion) === anio);
    const progreso = progresion.find((fila) => Number(fila.cohorte) === cohorte);
    const registros = asignaturas.filter((fila) => Number(fila.anio_medicion) === anio);

    // Ranking institucional de retención: en lugar de enviar el ranking
    // completo de carreras, se calcula en qué porcentaje superior queda esta
    // carrera respecto de sus pares con retención informada en la cohorte.
    // Es la única consulta que cruza carreras y permanece limitada a la cohorte.
    const retencionPropia = toNumberOrNull(progreso?.retencion_a1);
    let topPercentilRetencion = null;
    if (cohorte !== null && retencionPropia !== null) {
      const ranking = await FactProgresion.findAll({
        where: { cohorte },
        attributes: ['car_codigo', 'cohorte', 'retencion_a1'],
        raw: true
      });
      const paresOrdenados = ranking
        .filter((fila) => toNumberOrNull(fila.cohorte) === cohorte
          && toNumberOrNull(fila.retencion_a1) !== null)
        .sort((a, b) => Number(b.retencion_a1) - Number(a.retencion_a1));
      const posicionPropia = paresOrdenados.findIndex(
        (fila) => fila.car_codigo === career.car_codigo
      );
      // Si es el índice 0 de 10 carreras, está en el Top 10 %.
      topPercentilRetencion = paresOrdenados.length > 0 && posicionPropia !== -1
        ? Math.round(((posicionPropia + 1) / paresOrdenados.length) * 100)
        : null;
    }

    // Alertas curriculares: registros con reprobación igual o superior al
    // umbral crítico, medidos solo sobre el año de medición seleccionado (la
    // cohorte no interviene). Sin filas para el año el conteo queda en null.
    const totalAsignaturasCriticas = registros.length === 0
      ? null
      : registros.filter((fila) => {
        const puntos = tasaEnPuntosPorcentuales(fila.tasa_reprobacion);
        return puntos !== null && puntos >= UMBRAL_REPROBACION_CRITICO;
      }).length;

    return res.json({
      carrera: { codigo: career.car_codigo, nombre: career.nombre },
      periodos: { cohortes, anios_medicion: anios },
      seleccion: { cohorte, anio_medicion: anio },
      kpis: {
        ingresos_totales: toNumberOrNull(ingreso?.ingresos_totales),
        matricula_total: toNumberOrNull(matricula?.matricula_total),
        retencion_1er_ano: toNumberOrNull(progreso?.retencion_a1),
        titulacion_oportuna: toNumberOrNull(progreso?.tasa_titulacion_oportuna),
        tiempo_promedio: toNumberOrNull(progreso?.duracion_real_semestres)
      },
      resumen: {
        top_percentil_retencion: topPercentilRetencion,
        // Cuenta registros por asignatura/semestre, no asignaturas únicas.
        // Las tasas ya están en puntos porcentuales.
        registros_asignaturas_informadas: registros.length === 0 ? null : registros.filter(
          (fila) => fila.estado_dato === 'INFORMADO' && toNumberOrNull(fila.tasa_reprobacion) !== null
        ).length,
        total_asignaturas_criticas: totalAsignaturasCriticas
      }
    });
  } catch (error) {
    next(error);
  }
};
