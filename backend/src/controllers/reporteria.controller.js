import {
  FactAdmision,
  FactProgresion,
  FactEficiencia,
  FactTitulacion,
  FactAsignaturaCritica,
  Carrera
} from '../persistence/models/index.js';

// PostgreSQL devuelve las columnas DECIMAL como string ("85.00"). El gráfico
// necesita números (o null para las cohortes que todavía no tienen el dato).
const toNumberOrNull = (value) => {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

export const getMatricula = async (req, res) => {
  try {
    const { car_codigo } = req.params;

    // Verificar si la carrera existe
    const carrera = await Carrera.findOne({ where: { car_codigo } });
    if (!carrera) {
      return res.status(404).json({ error: 'Carrera no encontrada' });
    }

    // Buscar todos los registros de admisión para esta carrera, ordenados por año
    const datosMatricula = await FactAdmision.findAll({
      where: { car_codigo },
      order: [['anio', 'ASC']],
      // Seleccionamos solo las columnas que el frontend necesita graficar
      attributes: [
        'anio', 
        'ingresos_sua', 
        'ingresos_pace', 
        'ingresos_rae', 
        'ingresos_totales', 
        'matricula_total', 
        'matricula_mujeres'
      ]
    });

    res.status(200).json({
      carrera: carrera.nombre,
      datos: datosMatricula
    });

  } catch (error) {
    console.error('Error al obtener datos de matrícula:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getProgresion = async (req, res) => {
  try {
    const { car_codigo } = req.params;

    // Verificar si la carrera existe
    const carrera = await Carrera.findOne({ where: { car_codigo } });
    if (!carrera) {
      return res.status(404).json({ error: 'Carrera no encontrada' });
    }

    // Serie histórica por cohorte (retención y titulación), ordenada de forma
    // ascendente para que el eje X del gráfico respete la secuencia temporal.
    const datosProgresion = await FactProgresion.findAll({
      where: { car_codigo },
      order: [['cohorte', 'ASC']],
      attributes: [
        'cohorte',
        'retencion_a1',
        'retencion_a2',
        'retencion_a3',
        'retencion_a4',
        'retencion_total',
        'tasa_titulacion_temprana',
        'tasa_titulacion_oportuna',
        'tasa_titulacion_efectiva',
        'duracion_real_semestres'
      ],
      raw: true
    });

    res.status(200).json({
      carrera: carrera.nombre,
      datos: datosProgresion.map((fila) => ({
        cohorte: fila.cohorte,
        retencion_a1: toNumberOrNull(fila.retencion_a1),
        retencion_a2: toNumberOrNull(fila.retencion_a2),
        retencion_a3: toNumberOrNull(fila.retencion_a3),
        retencion_a4: toNumberOrNull(fila.retencion_a4),
        retencion_total: toNumberOrNull(fila.retencion_total),
        tasa_titulacion_temprana: toNumberOrNull(fila.tasa_titulacion_temprana),
        tasa_titulacion_oportuna: toNumberOrNull(fila.tasa_titulacion_oportuna),
        tasa_titulacion_efectiva: toNumberOrNull(fila.tasa_titulacion_efectiva),
        duracion_real_semestres: toNumberOrNull(fila.duracion_real_semestres)
      }))
    });

  } catch (error) {
    console.error('Error al obtener datos de progresión:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getCurricular = async (req, res) => {
  try {
    const { car_codigo } = req.params;

    // Verificar si la carrera existe
    const carrera = await Carrera.findOne({ where: { car_codigo } });
    if (!carrera) {
      return res.status(404).json({ error: 'Carrera no encontrada' });
    }

    // Las tres series comparten la dimensión temporal (año) y se consultan en paralelo.
    const [datosEficiencia, datosTitulacion, datosCriticas] = await Promise.all([
      FactEficiencia.findAll({
        where: { car_codigo },
        order: [['anio', 'ASC']],
        attributes: [
          'anio',
          'total_alumnos_regulares',
          'nivel_baja',
          'nivel_media',
          'nivel_alta',
          'nivel_eficiente'
        ],
        raw: true
      }),
      FactTitulacion.findAll({
        where: { car_codigo },
        order: [['anio', 'ASC']],
        attributes: [
          'anio',
          'bachilleratos',
          'licenciaturas_asig_pendientes',
          'licenciaturas',
          'titulados'
        ],
        raw: true
      }),
      FactAsignaturaCritica.findAll({
        where: { car_codigo },
        order: [['asig_codigo', 'ASC'], ['semestre', 'ASC'], ['anio', 'ASC']],
        attributes: ['asig_codigo', 'semestre', 'anio', 'tasa_reprobacion'],
        raw: true
      })
    ]);

    res.status(200).json({
      carrera: carrera.nombre,
      eficiencia: datosEficiencia.map((fila) => ({
        anio: fila.anio,
        total_alumnos_regulares: toNumberOrNull(fila.total_alumnos_regulares),
        nivel_baja: toNumberOrNull(fila.nivel_baja),
        nivel_media: toNumberOrNull(fila.nivel_media),
        nivel_alta: toNumberOrNull(fila.nivel_alta),
        nivel_eficiente: toNumberOrNull(fila.nivel_eficiente)
      })),
      titulacion: datosTitulacion.map((fila) => ({
        anio: fila.anio,
        bachilleratos: toNumberOrNull(fila.bachilleratos),
        licenciaturas_asig_pendientes: toNumberOrNull(fila.licenciaturas_asig_pendientes),
        licenciaturas: toNumberOrNull(fila.licenciaturas),
        titulados: toNumberOrNull(fila.titulados)
      })),
      criticas: datosCriticas.map((fila) => ({
        asig_codigo: fila.asig_codigo,
        semestre: toNumberOrNull(fila.semestre),
        anio: fila.anio,
        tasa_reprobacion: toNumberOrNull(fila.tasa_reprobacion)
      }))
    });

  } catch (error) {
    console.error('Error en getCurricular:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
