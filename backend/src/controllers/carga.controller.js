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

// Para las columnas porcentuales de progresión una celda vacía significa
// "todavía no medible" (por ejemplo, la retención de 2do año de la cohorte más
// reciente). Se escribe NULL en vez de 0 para que el gráfico muestre un hueco y
// no una caída falsa a 0%. Un 0 explícito en el Excel sí se conserva.
const parseDecimalOrNull = (value) => {
  if (value === undefined || value === null || value === '-' || String(value).trim() === '') return null;
  if (typeof value === 'string') {
    const cleaned = value.replace(',', '.').replace('%', '').trim();
    if (cleaned === '') return null;
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? null : parsed;
  }
  const parsed = parseFloat(value);
  return isNaN(parsed) ? null : parsed;
};

// La hoja AsigCriticas guarda las tasas como fracciones numéricas con formato
// de porcentaje (por ejemplo, 0.628 se visualiza como 62,8%). Se normaliza la
// unidad antes de persistirla para conservar el valor mostrado por Excel.
export const parseExcelPercentageOrNull = (value) => {
  if (value === undefined || value === null || value === '-' || String(value).trim() === '') {
    return null;
  }

  if (typeof value === 'number') {
    return Number.isNaN(value) ? null : value * 100;
  }

  const cleaned = value.replace(',', '.').replace('%', '').trim();
  if (cleaned === '') return null;
  const parsed = parseFloat(cleaned);
  return Number.isNaN(parsed) ? null : parsed;
};

const normalizeHeader = (key) => {
  const trimmed = String(key).trim();
  const comparable = trimmed
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

  // El archivo vigente contiene caracteres de reemplazo en estas cabeceras.
  // Los alias permiten aceptar tanto la escritura correcta como la dañada.
  if (/^c.digos asignaturas cr.ticas$/u.test(comparable)) {
    return 'Códigos asignaturas críticas';
  }

  const titulo = comparable.match(/^t.tulo_(\d{4})$/u);
  if (titulo) return `Título_${titulo[1]}`;

  return trimmed;
};

// espacios sobrantes al inicio o al final (por ejemplo " TR1_2014"). Se
// normalizan las claves de cada fila para que la búsqueda de columnas no
// dependa de esos espacios y no se escriban ceros silenciosamente.
export const normalizeKeys = (row) => {
  const normalized = {};
  for (const [key, value] of Object.entries(row)) {
    normalized[normalizeHeader(key)] = value;
  }
  return normalized;
};

export const parseAsignaturasWorksheet = (worksheet) => {
  // La fila 4 del Excel contiene las cabeceras; range usa índice base cero.
  const rows = xlsx.utils
    .sheet_to_json(worksheet, { defval: null, range: 3 })
    .map(normalizeKeys);

  if (rows.length === 0) return [];

  const requiredHeaders = ['CarCodigo', 'Códigos asignaturas críticas', 'Semestre'];
  const availableHeaders = new Set(Object.keys(rows[0]));
  const missingHeaders = requiredHeaders.filter((header) => !availableHeaders.has(header));

  if (missingHeaders.length > 0) {
    throw new Error(`Faltan columnas requeridas en "AsigCriticas": ${missingHeaders.join(', ')}.`);
  }

  return rows;
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
    const datosReporteria = xlsx.utils
      .sheet_to_json(worksheetReporteria, { defval: null })
      .map(normalizeKeys);
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

        if (row[`TRTotal_${anio}`] !== undefined || row[`Dur_Sem_${anio}`] !== undefined) {
          await FactProgresion.upsert({
            car_codigo: row.CarCodigo.toString(),
            cohorte: anio,
            retencion_a1: parseDecimalOrNull(row[`TR1_${anio}`]),
            retencion_a2: parseDecimalOrNull(row[`TR2_${anio}`]),
            retencion_a3: parseDecimalOrNull(row[`TR3_${anio}`]),
            retencion_a4: parseDecimalOrNull(row[`TR4_${anio}`]),
            retencion_total: parseDecimalOrNull(row[`TRTotal_${anio}`]),
            tasa_titulacion_temprana: parseDecimalOrNull(row[`TTT_${anio}`]),
            tasa_titulacion_oportuna: parseDecimalOrNull(row[`TTO_${anio}`]),
            tasa_titulacion_efectiva: parseDecimalOrNull(row[`TTE_${anio}`]),
            duracion_real_semestres: parseDecimalOrNull(row[`Dur_Sem_${anio}`]),
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
      const datosAsig = parseAsignaturasWorksheet(worksheetAsig);
      
      const aniosCriticos = [2021, 2022, 2023, 2024, 2025, 2026];

      for (const row of datosAsig) {
        if (!row.CarCodigo) continue;
        
        const carCodigo = row.CarCodigo.toString();
        const asigCodigo = row['Códigos asignaturas críticas'];
        const semestre = parseNumber(row['Semestre']);
        if (!asigCodigo) continue;
        
        for (const anio of aniosCriticos) {
          const valorTasa = row[anio.toString()];
          if (valorTasa !== undefined && valorTasa !== null) {
            const tasaReprobacion = parseExcelPercentageOrNull(valorTasa);
            if (tasaReprobacion === null) continue;

            await FactAsignaturaCritica.upsert({
              car_codigo: carCodigo,
              asig_codigo: asigCodigo.toString(),
              semestre: semestre,
              anio: anio,
              tasa_reprobacion: tasaReprobacion,
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
