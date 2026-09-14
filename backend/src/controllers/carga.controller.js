const xlsx = require('xlsx');
// Ajusta la ruta a tu archivo de configuración de Sequelize y tus modelos
const sequelize = require('../persintence/database/database'); 
const { 
  Carga_Datos, 
  Macrounidad, 
  Carrera, 
  Fact_Admision_Matricula, 
  Fact_Eficiencia_Curricular, 
  Fact_Titulacion_Grados,
  Asignatura, 
  Historial_Reprobacion 
} = require('../persistence/models'); // Ajusta esto según cómo exportes tus modelos

const procesarCargaExcel = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ estado: 'error', mensaje: 'No se ha adjuntado ningún archivo.' });
  }

  // Iniciamos la transacción para asegurar que todo se guarde o nada se guarde
  const t = await sequelize.transaction();

  try {
    // 1. Leer el archivo Excel desde la memoria RAM
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    
    const sheetReporteria = workbook.Sheets['Reporteria'];
    const sheetAsigCriticas = workbook.Sheets['AsigCriticas'];

    if (!sheetReporteria) {
      throw new Error('El archivo no contiene la hoja obligatoria "Reporteria".');
    }

    // Convertir las hojas a formato JSON
    const dataReporteria = xlsx.utils.sheet_to_json(sheetReporteria);
    const dataAsigCriticas = sheetAsigCriticas ? xlsx.utils.sheet_to_json(sheetAsigCriticas) : [];

    // 2. Registrar el inicio de la carga en Carga_Datos
    const id_admin = req.user ? req.user.id_usuario : 1; // Reemplazar con ID real del token JWT
    
    const registroCarga = await Carga_Datos.create({
      id_admin,
      nombre_archivo: req.file.originalname,
      estado: 'EN PROCESO'
    }, { transaction: t });

    const id_carga = registroCarga.id_carga;

    // 3. Procesar la hoja de "Reporteria"
    const aniosAnalisis = [2022, 2023, 2024, 2025, 2026];

    for (const row of dataReporteria) {
      if (!row.CarCodigo || !row.Macrounidad) {
        throw new Error('Faltan columnas obligatorias (CarCodigo o Macrounidad).');
      }

      const carCodigo = row.CarCodigo.toString().trim();
      const idMacrounidad = row.Macrounidad.toString().trim();

      // Upsert de Macrounidad y Carrera
      await Macrounidad.findOrCreate({
        where: { id_macrounidad: idMacrounidad },
        defaults: { nombre: `Facultad ${idMacrounidad}` },
        transaction: t
      });

      await Carrera.findOrCreate({
        where: { car_codigo: carCodigo },
        defaults: {
          nombre: row.Carreras || 'Sin nombre',
          sede: row.Sede || 'Sede Principal',
          id_macrounidad: idMacrounidad
        },
        transaction: t
      });

      // Procesar métricas por cada año
      for (const anio of aniosAnalisis) {
        // Admisión y Matrícula
        if (row[`SUA_${anio}`] !== undefined) {
          await Fact_Admision_Matricula.upsert({
            car_codigo: carCodigo,
            anio: anio,
            ingresos_sua: row[`SUA_${anio}`] || 0,
            ingresos_pace: row[`I_PACE_${anio}`] || 0,
            ingresos_rae: row[`I_ESPECIAL_${anio}`] || 0,
            ingresos_totales: row[`ING_${anio}`] || 0,
            matricula_total: row[`MT_${anio}`] || 0,
            matricula_mujeres: row[`MT_Muj_${anio}`] || 0,
            id_carga: id_carga
          }, { transaction: t });
        }

        // Eficiencia Curricular
        if (row[`BAJA_${anio}`] !== undefined) {
          await Fact_Eficiencia_Curricular.upsert({
            car_codigo: carCodigo,
            anio: anio,
            nivel_baja: row[`BAJA_${anio}`] || 0,
            nivel_media: row[`MEDIA_${anio}`] || 0,
            nivel_alta: row[`ALTA_${anio}`] || 0,
            nivel_eficiente: row[`EFICIENTE_${anio}`] || 0,
            total_alumnos_regulares: row[`N Alum Reg ${anio}`] || 0,
            id_carga: id_carga
          }, { transaction: t });
        }

        // Titulación y Grados
        if (row[`Título_${anio}`] !== undefined) {
          await Fact_Titulacion_Grados.upsert({
            car_codigo: carCodigo,
            anio: anio,
            titulados: row[`Título_${anio}`] || 0,
            licenciaturas: row[`Licenciatura_${anio}`] || 0,
            bachilleratos: row[`Bachillerato_${anio}`] || 0,
            licenciaturas_asig_pendientes: row[`Lic_Asig_Pen_Bachi_${anio}`] || 0,
            id_carga: id_carga
          }, { transaction: t });
        }
      }
    }

    // 4. Procesar la hoja de "AsigCriticas" (Si existe)
    if (dataAsigCriticas.length > 0) {
      const aniosAsig = [2021, 2022, 2023, 2024, 2025];
      
      for (const row of dataAsigCriticas) {
        if (!row.CodigoAsignatura || !row.CarCodigo) continue;
        
        const codAsignatura = row.CodigoAsignatura.toString().trim();
        const carCodigo = row.CarCodigo.toString().trim();

        await Asignatura.findOrCreate({
          where: { codigo_asignatura: codAsignatura },
          defaults: {
            car_codigo: carCodigo,
            semestre_malla: row.Semestre || 1,
            nombre: row.NombreAsignatura || 'Desconocida'
          },
          transaction: t
        });

        for (const anio of aniosAsig) {
          const tasaRepro = row[`Reprobacion_${anio}`];
          if (tasaRepro !== undefined) {
            const tasa = parseFloat(tasaRepro);
            await Historial_Reprobacion.upsert({
              codigo_asignatura: codAsignatura,
              anio: anio,
              tasa_reprobacion: tasa,
              es_critica: tasa >= 0.30, // Regla de > 30% es crítica
              id_carga: id_carga
            }, { transaction: t });
          }
        }
      }
    }

    // 5. Confirmar transacción
    await registroCarga.update({ estado: 'COMPLETADO' }, { transaction: t });
    await t.commit();

    return res.status(200).json({
      estado: 'exito',
      mensaje: 'El archivo Excel ha sido procesado y cargado correctamente.',
      filas_procesadas: dataReporteria.length,
      id_carga
    });

  } catch (error) {
    // Si hay error, deshacemos todo en la BD
    await t.rollback();
    console.error('Error procesando el archivo Excel:', error);
    
    return res.status(500).json({
      estado: 'error',
      mensaje: 'Ocurrió un error al procesar el archivo. No se guardaron los datos.',
      detalle: error.message
    });
  }
};

module.exports = {
  procesarCargaExcel
};