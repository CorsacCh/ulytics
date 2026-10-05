import { sequelize } from '../persistence/database/database.js';
import {
  Macrounidad,
  Carrera,
  CargaDatos,
  FactIngreso,
  FactMatricula,
  FactProgresion,
  FactEficiencia,
  FactAvanceCurricular,
  FactAsignaturaCritica
} from '../persistence/models/index.js';
import {
  AcademicWorkbookValidationError,
  parseAcademicWorkbook
} from '../services/academic-import.service.js';
import { AppError } from '../utils/app-error.js';

const bulkUpsert = async (Model, rows, updateOnDuplicate, transaction) => {
  if (rows.length === 0) return;

  await Model.bulkCreate(rows, {
    transaction,
    updateOnDuplicate
  });
};

export const procesarCargaExcel = async (request, response, next) => {
  if (!request.file) {
    return next(new AppError('No se adjuntó archivo.', 400, 'UPLOAD_FILE_REQUIRED'));
  }

  const idAdmin = request.auth?.user?.id_usuario;
  if (!idAdmin) {
    return next(new AppError(
      'No fue posible identificar al administrador.',
      401,
      'UNAUTHENTICATED'
    ));
  }

  let datos;
  try {
    // El archivo completo se valida antes de abrir una transacción de escritura.
    datos = parseAcademicWorkbook(request.file.buffer);
  } catch (error) {
    if (error instanceof AcademicWorkbookValidationError) {
      return next(new AppError(
        'El archivo contiene datos académicos inválidos.',
        422,
        'ACADEMIC_WORKBOOK_INVALID',
        error.details
      ));
    }
    return next(error);
  }

  let transaction;

  try {
    transaction = await sequelize.transaction();

    const nuevaCarga = await CargaDatos.create({
      id_admin: idAdmin,
      nombre_archivo: request.file.originalname,
      estado: 'PROCESANDO'
    }, { transaction });

    for (const macrounidad of datos.macrounidades) {
      await Macrounidad.upsert(macrounidad, { transaction });
    }

    for (const carrera of datos.carreras) {
      await Carrera.upsert(carrera, { transaction });
    }

    const conCarga = (rows) => rows.map((row) => ({
      ...row,
      id_carga: nuevaCarga.id_carga
    }));

    await bulkUpsert(
      FactIngreso,
      conCarga(datos.ingresos),
      [
        'ingresos_sua',
        'ingresos_pace',
        'ingresos_especiales',
        'ingresos_totales',
        'porcentaje_mujeres',
        'cobertura_sua',
        'cobertura_pace',
        'cobertura_rae',
        'estados_datos',
        'id_carga'
      ],
      transaction
    );

    await bulkUpsert(
      FactMatricula,
      conCarga(datos.matriculas),
      ['matricula_total', 'matricula_mujeres', 'porcentaje_mujeres', 'estados_datos', 'id_carga'],
      transaction
    );

    await bulkUpsert(
      FactProgresion,
      conCarga(datos.progresiones),
      [
        'retencion_a1',
        'retencion_a2',
        'retencion_a3',
        'retencion_a4',
        'retencion_total',
        'tasa_titulacion_total',
        'tasa_titulacion_oportuna',
        'tasa_titulacion_efectiva',
        'duracion_real_semestres',
        'estados_datos',
        'id_carga'
      ],
      transaction
    );

    await bulkUpsert(
      FactEficiencia,
      conCarga(datos.eficiencias),
      [
        'nivel_baja',
        'nivel_media',
        'nivel_alta',
        'nivel_eficiente',
        'total_alumnos_regulares',
        'estados_datos',
        'id_carga'
      ],
      transaction
    );

    await bulkUpsert(
      FactAvanceCurricular,
      conCarga(datos.avancesCurriculares),
      [
        'porcentaje_bachillerato',
        'porcentaje_licenciatura_con_bachillerato_pendiente',
        'porcentaje_licenciatura',
        'porcentaje_titulo_con_bachillerato_licenciatura_pendiente',
        'porcentaje_titulo',
        'estados_datos',
        'id_carga'
      ],
      transaction
    );

    await bulkUpsert(
      FactAsignaturaCritica,
      conCarga(datos.asignaturasCriticas),
      ['asig_codigo_base', 'tasa_reprobacion', 'estado_dato', 'id_carga'],
      transaction
    );

    await nuevaCarga.update({ estado: 'COMPLETADO' }, { transaction });
    await transaction.commit();

    return response.status(200).json({
      estado: 'exito',
      mensaje: 'Archivo académico validado y procesado correctamente.',
      resumen: {
        filas_reporteria: datos.filasReporteria,
        carreras: datos.carreras.length,
        ingresos_cohorte: datos.ingresos.length,
        matriculas_anuales: datos.matriculas.length,
        progresiones_cohorte: datos.progresiones.length,
        eficiencias: datos.eficiencias.length,
        avances_curriculares: datos.avancesCurriculares.length,
        registros_asignaturas: datos.asignaturasCriticas.length
      }
    });
  } catch (error) {
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }
    return next(error);
  }
};
