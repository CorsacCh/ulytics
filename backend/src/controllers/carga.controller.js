import * as xlsx from 'xlsx';
import { sequelize } from '../persistence/database/database.js';
import { 
  Macrounidad, Carrera, CargaDatos, FactAdmision, 
  FactProgresion, FactEficiencia, FactTitulacion, FactAsignaturaCritica 
} from '../persistence/models/index.js';

const parseNumber = (value) => {
  if (value === undefined || value === null || value === '-' || String(value).trim() === '') return 0;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? 0 : parsed;
};

const parseDecimal = (value) => {
  if (value === undefined || value === null || value === '-' || String(value).trim() === '') return 0;
  if (typeof value === 'string') {
    const cleaned = value.replace(',', '.').replace('%', '').trim();
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
};

export const procesarCargaExcel = async (req, res, next) => {
  const t = await sequelize.transaction();

  try {
    if (!req.file) return res.status(400).json({ error: 'No se adjuntó archivo.' });
    
    const idAdmin = req.auth?.user?.id_usuario || 1;
    const nombreArchivo = req.file.originalname;

    const nuevaCarga = await CargaDatos.create({
      id_admin: idAdmin,
      nombre_archivo: nombreArchivo,
      estado: 'PROCESANDO'
    }, { transaction: t });

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    if (!workbook.SheetNames.includes('Reporteria')) {
      throw new Error('Falta la hoja "Reporteria" en el Excel.');
    }
    
    // --- 1. PROCESAMIENTO HOJA "Reporteria" ---
    const worksheetReporteria = workbook.Sheets['Reporteria'];
    const datosReporteria = xlsx.utils.sheet_to_json(worksheetReporteria, { defval: null });
    const aniosAnalisis = [2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026];

    for (const row of datosReporteria) {
      if (!row.CarCodigo) continue;

      await Macrounidad.upsert({
        id_macrounidad: row.Macrounidad,
        nombre: row.Macrounidad
      }, { transaction: t });

      await Carrera.upsert({
        car_codigo: row.CarCodigo.toString(),
        nombre: row.Carreras,
        sede: row.Sede,
        id_macrounidad: row.Macrounidad
      }, { transaction: t });

      for (const anio of aniosAnalisis) {
        if (row[`ING_${anio}`] !== undefined) {
          await FactAdmision.upsert({
            car_codigo: row.CarCodigo.toString(),
            anio: anio,
            ingresos_sua: parseNumber(row[`SUA_${anio}`]),
            ingresos_pace: parseNumber(row[`I_PACE_${anio}`]),
            ingresos_rae: parseNumber(row[`I_ESPECIAL_${anio}`]),
            ingresos_totales: parseNumber(row[`ING_${anio}`]),
            matricula_total: parseNumber(row[`MT_${anio}`]),
            matricula_mujeres: parseNumber(row[`MT_Muj_${anio}`]),
            id_carga: nuevaCarga.id_carga
          }, { transaction: t });
        }

        if (row[` TRTotal_${anio}`] !== undefined || row[`Dur_Sem_${anio}`] !== undefined) {
          await FactProgresion.upsert({
            car_codigo: row.CarCodigo.toString(),
            cohorte: anio,
            retencion_a1: parseDecimal(row[` TR1_${anio}`]),
            retencion_a2: parseDecimal(row[` TR2_${anio}`]),
            retencion_a3: parseDecimal(row[` TR3_${anio}`]),
            retencion_a4: parseDecimal(row[` TR4_${anio}`]),
            retencion_total: parseDecimal(row[` TRTotal_${anio}`]),
            tasa_titulacion_temprana: parseDecimal(row[` TTT_${anio}`]),
            tasa_titulacion_oportuna: parseDecimal(row[` TTO_${anio}`]),
            tasa_titulacion_efectiva: parseDecimal(row[` TTE_${anio}`]),
            duracion_real_semestres: parseDecimal(row[`Dur_Sem_${anio}`]),
            id_carga: nuevaCarga.id_carga
          }, { transaction: t });
        }

        if (row[`N Alum Reg ${anio}`] !== undefined) {
          await FactEficiencia.upsert({
            car_codigo: row.CarCodigo.toString(),
            anio: anio,
            nivel_baja: parseNumber(row[`BAJA_${anio}`]),
            nivel_media: parseNumber(row[`MEDIA_${anio}`]),
            nivel_alta: parseNumber(row[`ALTA_${anio}`]),
            nivel_eficiente: parseNumber(row[`EFICIENTE_${anio}`]),
            total_alumnos_regulares: parseNumber(row[`N Alum Reg ${anio}`]),
            id_carga: nuevaCarga.id_carga
          }, { transaction: t });
        }

        if (row[`Título_${anio}`] !== undefined || row[`Bachillerato_${anio}`] !== undefined) {
          await FactTitulacion.upsert({
            car_codigo: row.CarCodigo.toString(),
            anio: anio,
            titulados: parseNumber(row[`Título_${anio}`]),
            licenciaturas: parseNumber(row[`Licenciatura_${anio}`]),
            bachilleratos: parseNumber(row[`Bachillerato_${anio}`]),
            licenciaturas_asig_pendientes: parseNumber(row[`Lic_Asig_Pen_Bachi_${anio}`]),
            id_carga: nuevaCarga.id_carga
          }, { transaction: t });
        }
      }
    }

    // --- 2. PROCESAMIENTO HOJA "AsigCriticas" ---
    if (workbook.SheetNames.includes('AsigCriticas')) {
      const worksheetAsig = workbook.Sheets['AsigCriticas'];
      // range: 2 omite las dos primeras filas de título del Excel
      const datosAsig = xlsx.utils.sheet_to_json(worksheetAsig, { defval: null, range: 2 });
      
      const aniosCriticos = [2021, 2022, 2023, 2024, 2025, 2026];

      for (const row of datosAsig) {
        if (!row.CarCodigo) continue;
        
        const carCodigo = row.CarCodigo.toString();
        const asigCodigo = row['Códigos asignaturas críticas'];
        const semestre = parseNumber(row['Semestre']);
        
        for (const anio of aniosCriticos) {
          const valorTasa = row[anio.toString()];
          if (valorTasa !== undefined && valorTasa !== null) {
            await FactAsignaturaCritica.upsert({
              car_codigo: carCodigo,
              asig_codigo: asigCodigo,
              semestre: semestre,
              anio: anio,
              tasa_reprobacion: parseDecimal(valorTasa),
              id_carga: nuevaCarga.id_carga
            }, { transaction: t });
          }
        }
      }
    }

    await nuevaCarga.update({ estado: 'COMPLETADO' }, { transaction: t });
    await t.commit();

    res.status(200).json({
      estado: 'exito',
      mensaje: 'Archivo Excel completamente procesado. Ambas hojas fueron despivotadas.',
      filas_reporteria: datosReporteria.length
    });

  } catch (error) {
    await t.rollback();
    res.status(500).json({ error: 'Error procesando archivo: ' + error.message });
  }
};
