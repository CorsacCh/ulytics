import { Carrera, Macrounidad } from '../persistence/models/index.js';

export const getAmbitos = async (req, res) => {
  try {
    // Obtenemos todas las carreras ordenadas alfabéticamente.
    // Se incluye id_macrounidad para vincular cada carrera con su facultad
    // en los selectores jerárquicos de la Autoridad (campo aditivo: no rompe
    // a los consumidores que solo usan car_codigo y nombre).
    const carreras = await Carrera.findAll({
      attributes: ['car_codigo', 'nombre', 'id_macrounidad'],
      order: [['nombre', 'ASC']]
    });

    // Obtenemos todas las facultades/macrounidades
    const facultades = await Macrounidad.findAll({
      attributes: ['id_macrounidad', 'nombre'],
      order: [['nombre', 'ASC']]
    });

    res.status(200).json({
      carreras,
      facultades
    });
  } catch (error) {
    console.error('Error al obtener ámbitos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
