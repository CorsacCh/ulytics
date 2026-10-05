import { AppError } from '../utils/app-error.js';
import { Op } from 'sequelize';
import {
  FactMatricula,
  FactProgresion,
  FactAsignaturaCritica
} from '../persistence/models/index.js';

// Umbral de reprobación crítico en puntos porcentuales (0-100, DECIMAL(5,2)).
// Criterio de dominio: "reprobación mayor o igual a 30 %" cuenta como alerta.
// Las tasas se normalizan a esta escala antes de comparar por si una carga
// histórica guardó el valor como fracción 0-1 (0.30 = 30 %).
const UMBRAL_REPROBACION_CRITICO = 30;

/**
 * Normaliza valores DECIMAL de PostgreSQL a número, respetando null.
 */
const toNumberOrNull = (value) => {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

export const getHomeDashboard = async (req, res, next) => {
  try {
    const { cohorte, car_codigo } = req.query;
    if (!cohorte || !car_codigo) {
      throw new AppError(
        'Faltan parámetros obligatorios: cohorte y car_codigo',
        400,
        'VALIDATION_ERROR'
      );
    }

    const cohorteNum = Number(cohorte);
    const carCodigo = String(car_codigo).trim();

    // 1. KPIs principales: matrícula y progresión para la cohorte seleccionada.
    //    Matrícula y progresión usan dimensiones temporales distintas
    //    (Fact_Matricula_Anual.anio_medicion vs Fact_Progresion_Academica.cohorte).
    const datosMatricula = await FactMatricula.findOne({
      where: { car_codigo: carCodigo, anio_medicion: cohorteNum },
      raw: true
    });

    const datosProgresion = await FactProgresion.findOne({
      where: { car_codigo: carCodigo, cohorte: cohorteNum },
      raw: true
    });

    // El detalle (eficiencia, avance curricular) vive en las pestañas de
    // Progresión analítica/curricular; el Home solo envía resúmenes.

    // 2. Posicionamiento (percentil): en lugar de enviar el ranking completo
    //    de carreras, se calcula en qué porcentaje superior queda esta
    //    carrera respecto de sus pares con retención informada.
    const ranking = await FactProgresion.findAll({
      where: { cohorte: cohorteNum },
      attributes: ['car_codigo', 'retencion_a1'],
      raw: true
    });

    const carrerasOrdenadas = ranking
      .filter((item) => toNumberOrNull(item.retencion_a1) !== null)
      .sort((a, b) => Number(b.retencion_a1) - Number(a.retencion_a1));

    const posicionPropia = carrerasOrdenadas.findIndex(
      (item) => item.car_codigo === carCodigo
    );

    // Si es el índice 0 de 10 carreras, está en el Top 10%.
    const topPercentile =
      carrerasOrdenadas.length > 0 && posicionPropia !== -1
        ? Math.round(
            ((posicionPropia + 1) / carrerasOrdenadas.length) * 100
          )
        : null;

    // 3. Conteo de alertas: asignaturas con tasa de reprobación igual o
    //    superior al umbral crítico (>= 30 %) en el año de medición de la
    //    cohorte seleccionada (el detalle vive en Progresión Curricular).
    //
    //    La ingesta normaliza a puntos porcentuales 0-100
    //    (parseFractionPercentageCell), pero se toleran cargas históricas
    //    guardadas como fracción 0-1 (0.35 = 35 %): cada valor se normaliza
    //    a puntos porcentuales antes de comparar con el umbral, y se aplica
    //    el criterio de dominio "mayor o igual a 30 %" (>=, no >).
    const criticasDelAnio = await FactAsignaturaCritica.findAll({
      where: {
        car_codigo: carCodigo,
        anio_medicion: cohorteNum,
        tasa_reprobacion: { [Op.ne]: null }
      },
      attributes: ['tasa_reprobacion'],
      raw: true
    });

    const totalAlertas = criticasDelAnio.filter((fila) => {
      const tasa = Number(fila.tasa_reprobacion);
      if (Number.isNaN(tasa)) return false;
      // <= 1 se interpreta como fracción histórica (0.35 = 35 %); por encima
      // de 1 el valor ya está en puntos porcentuales (35 = 35 %).
      const puntos = tasa > 1 ? tasa : tasa * 100;
      return puntos >= UMBRAL_REPROBACION_CRITICO;
    }).length;

    res.json({
      kpis: {
        // Matrícula siempre trae valor (0 cuando no hay datos cargados).
        matricula_nueva: toNumberOrNull(datosMatricula?.matricula_total) ?? 0,
        // Indicadores de cohorte: null explícito cuando el evento aún no ha
        // ocurrido (cohorte vigente) o no existen datos en la tabla.
        retencion_1er_ano: toNumberOrNull(datosProgresion?.retencion_a1) ?? null,
        titulacion_oportuna:
          toNumberOrNull(datosProgresion?.tasa_titulacion_oportuna) ?? null,
        tiempo_promedio:
          toNumberOrNull(datosProgresion?.duracion_real_semestres) ?? null
      },
      resumen: {
        top_percentil_retencion: topPercentile,
        total_asignaturas_criticas: totalAlertas
      }
    });
  } catch (error) {
    next(error);
  }
};