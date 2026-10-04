import { Op } from 'sequelize';
import { HistorialDescarga } from '../persistence/models/index.js';
import { AppError } from '../utils/app-error.js';

// Ventana usada para la tarjeta "Archivos descargados".
const DIAS_RESUMEN = 90;

const restarDias = (base, dias) => {
  const fecha = new Date(base);
  fecha.setDate(fecha.getDate() - dias);
  return fecha;
};

// Devuelve el historial completo (tabla "Auditoría de reportes") junto con los
// KPIs que alimentan las tarjetas superiores: descargas recientes, última
// descarga y formatos utilizados.
export async function getHistorialDescargas(_request, response, next) {
  try {
    const hace90Dias = restarDias(new Date(), DIAS_RESUMEN);

    const [registros, totalUltimos90Dias, formatos] = await Promise.all([
      // Orden descendente para que la última descarga sea la primera fila.
      HistorialDescarga.findAll({
        order: [['fecha_descarga', 'DESC']],
        raw: true
      }),
      HistorialDescarga.count({
        where: { fecha_descarga: { [Op.gte]: hace90Dias } }
      }),
      HistorialDescarga.findAll({
        attributes: ['formato'],
        group: ['formato'],
        raw: true
      })
    ]);

    const formatosUsados = formatos.map((fila) => fila.formato).filter(Boolean);
    const ultimaDescarga = registros[0] || null;

    return response.json({
      resumen: {
        totalUltimos90Dias,
        ultimaDescargaFecha: ultimaDescarga ? ultimaDescarga.fecha_descarga : null,
        ultimaDescargaNombre: ultimaDescarga ? ultimaDescarga.nombre_archivo : null,
        formatosCantidad: formatosUsados.length,
        formatosUsados
      },
      registros
    });
  } catch (error) {
    return next(error);
  }
}

// Registra en el historial una descarga generada en el cliente (PDF/Excel).
export async function registrarDescarga(request, response, next) {
  try {
    const { nombre_archivo, formato, periodo, tamano_kb, url_archivo } = request.body ?? {};

    if (!nombre_archivo || !formato || !periodo) {
      throw new AppError(
        'Faltan datos obligatorios para registrar la descarga.',
        400,
        'DOWNLOAD_PAYLOAD_INVALID'
      );
    }

    const tamano = Number.parseInt(tamano_kb, 10);

    const nuevoRegistro = await HistorialDescarga.create({
      nombre_archivo,
      formato,
      periodo,
      tamano_kb: Number.isNaN(tamano) ? 0 : tamano,
      url_archivo: url_archivo || '#'
    });

    return response.status(201).json({
      message: 'Descarga registrada en el historial.',
      registro: nuevoRegistro
    });
  } catch (error) {
    return next(error);
  }
}
