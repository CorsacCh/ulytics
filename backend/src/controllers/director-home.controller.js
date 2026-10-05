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
        // Cuenta registros por asignatura/semestre, no asignaturas únicas ni
        // alertas inferidas. Las tasas ya están en puntos porcentuales.
        registros_asignaturas_informadas: registros.length === 0 ? null : registros.filter(
          (fila) => fila.estado_dato === 'INFORMADO' && toNumberOrNull(fila.tasa_reprobacion) !== null
        ).length
      }
    });
  } catch (error) {
    next(error);
  }
};
