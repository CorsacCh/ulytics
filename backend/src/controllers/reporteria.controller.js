import { FactAdmision, Carrera } from '../persistence/models/index.js';

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
