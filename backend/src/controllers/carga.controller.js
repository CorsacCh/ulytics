import * as xlsx from 'xlsx';
import { sequelize } from '../persistence/database/database.js';
import { Macrounidad } from '../persistence/models/Macrounidad.js';
import { Carrera } from '../persistence/models/Carrera.js';
import { CargaDatos } from '../persistence/models/CargaDatos.js';
import { FactAdmision } from '../persistence/models/FactAdmision.js';

// Función para limpiar celdas de Excel y asegurar que siempre devuelva un número
const parseNumber = (value) => {
  if (value === undefined || value === null || value === '-' || String(value).trim() === '') {
    return 0;
  }
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? 0 : parsed;
};

export const procesarCargaExcel = async (req, res, next) => {
  // Iniciar una transacción SQL
  const t = await sequelize.transaction();

  try {
    if (!req.file) return res.status(400).json({ error: 'No se adjuntó archivo.' });
    
    const idAdmin = req.auth?.user?.id_usuario || 1; // Obtenido del token JWT
    const nombreArchivo = req.file.originalname;

    // 1. Registrar el intento de carga en la tabla de trazabilidad
    const nuevaCarga = await CargaDatos.create({
      id_admin: idAdmin,
      nombre_archivo: nombreArchivo,
      estado: 'PROCESANDO'
    }, { transaction: t });

    // 2. Leer Excel
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    if (!workbook.SheetNames.includes('Reporteria')) {
      throw new Error('Falta la hoja "Reporteria" en el Excel.');
    }
    const worksheet = workbook.Sheets['Reporteria'];
    const datosJSON = xlsx.utils.sheet_to_json(worksheet, { defval: null });

    // 3. Procesar fila por fila (Despivotar)
    const aniosAdmision = [2022, 2023, 2024, 2025, 2026];

    for (const row of datosJSON) {
      if (!row.CarCodigo) continue; // Saltar filas vacías

      // Upsert de Dimensión: Macrounidad
      await Macrounidad.upsert({
        id_macrounidad: row.Macrounidad,
        nombre: row.Macrounidad
      }, { transaction: t });

      // Upsert de Dimensión: Carrera
      await Carrera.upsert({
        car_codigo: row.CarCodigo.toString(),
        nombre: row.Carreras,
        sede: row.Sede,
        id_macrounidad: row.Macrounidad
      }, { transaction: t });

      // Transformar e Insertar Hechos: Admisión por cada año
      for (const anio of aniosAdmision) {
        // Solo procesamos si existe la columna de ingresos totales para ese año (aunque sea 0 o "-")
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
      }
    }

    // 4. Finalizar con éxito
    await nuevaCarga.update({ estado: 'COMPLETADO' }, { transaction: t });
    await t.commit(); // Confirmar cambios en la BD

    res.status(200).json({
      estado: 'exito',
      mensaje: 'Archivo cargado, transformado y guardado en la base de datos.',
      filas_procesadas: datosJSON.length
    });

  } catch (error) {
    // Si algo falla, revertir absolutamente todos los cambios en la BD
    await t.rollback();
    res.status(500).json({ error: 'Error procesando archivo: ' + error.message });
  }
};
