import { FactAdmision, FactProgresion, Carrera } from '../persistence/models/index.js';

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
