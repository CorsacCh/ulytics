import {
  FactIngreso,
  FactMatricula,
  FactProgresion,
  FactEficiencia,
  FactAvanceCurricular,
  FactAsignaturaCritica
} from '../persistence/models/index.js';

// PostgreSQL devuelve las columnas DECIMAL como string (por ejemplo, "85.00").
// La API normaliza conteos y porcentajes, pero conserva null cuando el Excel no
// contiene un valor informado.
const toNumberOrNull = (value) => {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

export const getMatricula = async (req, res) => {
  try {
    const { car_codigo } = req.params;
    const carrera = req.academicCareer;

    // Ingreso y matrícula usan dimensiones temporales diferentes. Se consultan
    // y exponen por separado para no presentar el año de cohorte como si fuera
    // el año de medición de la matrícula.
    const [datosIngreso, datosMatricula] = await Promise.all([
      FactIngreso.findAll({
        where: { car_codigo },
        order: [['cohorte', 'ASC']],
        attributes: [
          'cohorte',
          'ingresos_sua',
          'ingresos_pace',
          'ingresos_especiales',
          'ingresos_totales',
          'porcentaje_mujeres',
          'cobertura_sua',
          'cobertura_pace',
          'cobertura_rae',
          'estados_datos'
        ],
        raw: true
      }),
      FactMatricula.findAll({
        where: { car_codigo },
        order: [['anio_medicion', 'ASC']],
        attributes: [
          'anio_medicion',
          'matricula_total',
          'matricula_mujeres',
          'porcentaje_mujeres',
          'estados_datos'
        ],
        raw: true
      })
    ]);

    return res.status(200).json({
      carrera: carrera.nombre,
      ingresos_cohorte: datosIngreso.map((fila) => ({
        cohorte: toNumberOrNull(fila.cohorte),
        ingresos_sua: toNumberOrNull(fila.ingresos_sua),
        ingresos_pace: toNumberOrNull(fila.ingresos_pace),
        ingresos_especiales: toNumberOrNull(fila.ingresos_especiales),
        ingresos_totales: toNumberOrNull(fila.ingresos_totales),
        porcentaje_mujeres: toNumberOrNull(fila.porcentaje_mujeres),
        cobertura_sua: toNumberOrNull(fila.cobertura_sua),
        cobertura_pace: toNumberOrNull(fila.cobertura_pace),
        cobertura_rae: toNumberOrNull(fila.cobertura_rae),
        estados_datos: fila.estados_datos ?? null
      })),
      matricula_anual: datosMatricula.map((fila) => ({
        anio_medicion: toNumberOrNull(fila.anio_medicion),
        matricula_total: toNumberOrNull(fila.matricula_total),
        matricula_mujeres: toNumberOrNull(fila.matricula_mujeres),
        porcentaje_mujeres: toNumberOrNull(fila.porcentaje_mujeres),
        estados_datos: fila.estados_datos ?? null
      }))
    });
  } catch (error) {
    console.error('Error al obtener datos de matrícula:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getProgresion = async (req, res) => {
  try {
    const { car_codigo } = req.params;
    const carrera = req.academicCareer;

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
        'tasa_titulacion_total',
        'tasa_titulacion_oportuna',
        'tasa_titulacion_efectiva',
        'duracion_real_semestres',
        'estados_datos'
      ],
      raw: true
    });

    return res.status(200).json({
      carrera: carrera.nombre,
      datos: datosProgresion.map((fila) => ({
        cohorte: toNumberOrNull(fila.cohorte),
        retencion_a1: toNumberOrNull(fila.retencion_a1),
        retencion_a2: toNumberOrNull(fila.retencion_a2),
        retencion_a3: toNumberOrNull(fila.retencion_a3),
        retencion_a4: toNumberOrNull(fila.retencion_a4),
        retencion_total: toNumberOrNull(fila.retencion_total),
        tasa_titulacion_total: toNumberOrNull(fila.tasa_titulacion_total),
        tasa_titulacion_oportuna: toNumberOrNull(fila.tasa_titulacion_oportuna),
        tasa_titulacion_efectiva: toNumberOrNull(fila.tasa_titulacion_efectiva),
        duracion_real_semestres: toNumberOrNull(fila.duracion_real_semestres),
        estados_datos: fila.estados_datos ?? null
      }))
    });
  } catch (error) {
    console.error('Error al obtener datos de progresión:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getCurricular = async (req, res) => {
  try {
    const { car_codigo } = req.params;
    const carrera = req.academicCareer;

    const [datosEficiencia, datosAvanceCurricular, datosCriticas] = await Promise.all([
      FactEficiencia.findAll({
        where: { car_codigo },
        order: [['cohorte', 'ASC']],
        attributes: [
          'cohorte',
          'total_alumnos_regulares',
          'nivel_baja',
          'nivel_media',
          'nivel_alta',
          'nivel_eficiente',
          'estados_datos'
        ],
        raw: true
      }),
      FactAvanceCurricular.findAll({
        where: { car_codigo },
        order: [['cohorte', 'ASC']],
        attributes: [
          'cohorte',
          'porcentaje_bachillerato',
          'porcentaje_licenciatura_con_bachillerato_pendiente',
          'porcentaje_licenciatura',
          'porcentaje_titulo_con_bachillerato_licenciatura_pendiente',
          'porcentaje_titulo',
          'estados_datos'
        ],
        raw: true
      }),
      FactAsignaturaCritica.findAll({
        where: { car_codigo },
        order: [
          ['asig_codigo_base', 'ASC'],
          ['asig_codigo', 'ASC'],
          ['semestre', 'ASC'],
          ['anio_medicion', 'ASC']
        ],
        attributes: [
          'asig_codigo_base',
          'asig_codigo',
          'semestre',
          'anio_medicion',
          'tasa_reprobacion',
          'estado_dato'
        ],
        raw: true
      })
    ]);

    return res.status(200).json({
      carrera: carrera.nombre,
      eficiencia: datosEficiencia.map((fila) => ({
        cohorte: toNumberOrNull(fila.cohorte),
        total_alumnos_regulares: toNumberOrNull(fila.total_alumnos_regulares),
        nivel_baja: toNumberOrNull(fila.nivel_baja),
        nivel_media: toNumberOrNull(fila.nivel_media),
        nivel_alta: toNumberOrNull(fila.nivel_alta),
        nivel_eficiente: toNumberOrNull(fila.nivel_eficiente),
        estados_datos: fila.estados_datos ?? null
      })),
      avance_curricular: datosAvanceCurricular.map((fila) => ({
        cohorte: toNumberOrNull(fila.cohorte),
        porcentaje_bachillerato: toNumberOrNull(fila.porcentaje_bachillerato),
        porcentaje_licenciatura_con_bachillerato_pendiente: toNumberOrNull(
          fila.porcentaje_licenciatura_con_bachillerato_pendiente
        ),
        porcentaje_licenciatura: toNumberOrNull(fila.porcentaje_licenciatura),
        porcentaje_titulo_con_bachillerato_licenciatura_pendiente: toNumberOrNull(
          fila.porcentaje_titulo_con_bachillerato_licenciatura_pendiente
        ),
        porcentaje_titulo: toNumberOrNull(fila.porcentaje_titulo),
        estados_datos: fila.estados_datos ?? null
      })),
      criticas: datosCriticas.map((fila) => ({
        asig_codigo_base: fila.asig_codigo_base,
        asig_codigo: fila.asig_codigo,
        semestre: toNumberOrNull(fila.semestre),
        anio_medicion: toNumberOrNull(fila.anio_medicion),
        tasa_reprobacion: toNumberOrNull(fila.tasa_reprobacion),
        estado_dato: fila.estado_dato ?? null
      }))
    });
  } catch (error) {
    console.error('Error en getCurricular:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};
