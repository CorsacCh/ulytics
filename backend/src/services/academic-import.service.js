import * as xlsx from 'xlsx';

export const ESTADOS_DATO = Object.freeze({
  INFORMADO: 'INFORMADO',
  VACIO_ORIGEN: 'VACIO_ORIGEN',
  GUION_ORIGEN: 'GUION_ORIGEN',
});

const DASH_MARKERS = new Set(['-', '–', '—']);

export class AcademicWorkbookValidationError extends Error {
  constructor(message, context = {}) {
    const location = [
      context.sheet ? `hoja "${context.sheet}"` : null,
      context.row ? `fila ${context.row}` : null,
      context.header ? `columna "${context.header}"` : null,
    ].filter(Boolean).join(', ');

    super(location ? `${message} (${location}).` : message);
    this.name = 'AcademicWorkbookValidationError';
    this.context = context;
    this.details = { message, ...context };
  }
}

const validationError = (message, context) => {
  throw new AcademicWorkbookValidationError(message, context);
};

const isBlank = (value) =>
  value === undefined || value === null || (typeof value === 'string' && value.trim() === '');

const isDash = (value) => typeof value === 'string' && DASH_MARKERS.has(value.trim());

const markerResult = (value) => {
  if (isBlank(value)) {
    return { value: null, estado: ESTADOS_DATO.VACIO_ORIGEN };
  }

  if (isDash(value)) {
    return { value: null, estado: ESTADOS_DATO.GUION_ORIGEN };
  }

  return null;
};

const parseNumericValue = (value, context) => {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) validationError('El valor numérico no es válido', context);
    return value;
  }

  if (typeof value !== 'string') validationError('Se esperaba un valor numérico', context);

  const cleaned = value.trim().replace('%', '').replace(',', '.');
  if (cleaned === '') validationError('Se esperaba un valor numérico', context);

  const parsed = Number(cleaned);
  if (!Number.isFinite(parsed)) validationError('El valor no se puede interpretar como número', context);
  return parsed;
};

export const parseCountCell = (value, context = {}) => {
  const marker = markerResult(value);
  if (marker) return marker;

  const parsed = parseNumericValue(value, context);
  if (!Number.isInteger(parsed) || parsed < 0) {
    validationError('El conteo debe ser un entero mayor o igual a cero', context);
  }

  return { value: parsed, estado: ESTADOS_DATO.INFORMADO };
};

export const parseNonNegativeDecimalCell = (value, context = {}) => {
  const marker = markerResult(value);
  if (marker) return marker;

  const parsed = parseNumericValue(value, context);
  if (parsed < 0) validationError('El valor debe ser mayor o igual a cero', context);

  return { value: parsed, estado: ESTADOS_DATO.INFORMADO };
};

export const parsePercentagePointsCell = (
  value,
  context = {},
  { allowAbove100 = false } = {},
) => {
  const marker = markerResult(value);
  if (marker) return marker;

  const parsed = parseNumericValue(value, context);
  if (parsed < 0 || (!allowAbove100 && parsed > 100)) {
    validationError(
      allowAbove100
        ? 'El porcentaje no puede ser negativo'
        : 'El porcentaje debe estar entre 0 y 100',
      context,
    );
  }

  return { value: parsed, estado: ESTADOS_DATO.INFORMADO };
};

// AsigCriticas entrega números crudos como fracciones de Excel: 0.3 equivale
// a 30 % y 1 equivale a 100 %. Un texto que trae el signo % ya está expresado
// en puntos porcentuales y no se multiplica nuevamente.
export const parseFractionPercentageCell = (value, context = {}) => {
  const marker = markerResult(value);
  if (marker) return marker;

  const hasPercentSign = typeof value === 'string' && value.includes('%');
  const parsed = parseNumericValue(value, context);
  const percentagePoints = hasPercentSign ? parsed : parsed * 100;

  if (parsed < 0 || (!hasPercentSign && parsed > 1) || percentagePoints > 100) {
    validationError('La fracción porcentual debe estar entre 0 y 1', context);
  }

  return { value: percentagePoints, estado: ESTADOS_DATO.INFORMADO };
};

export const normalizeAcademicHeader = (key) => {
  const trimmed = String(key ?? '').trim();
  const comparable = trimmed
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

  if (/^c.digos asignaturas cr.ticas$/u.test(comparable)) {
    return 'Códigos asignaturas críticas';
  }

  const titulo = comparable.match(/^t.tulo_(\d{4})$/u);
  if (titulo) return `Título_${titulo[1]}`;

  if (/^cr.tica \(3 o m.s veces\)$/u.test(comparable)) {
    return 'Crítica (3 o más veces)';
  }

  return trimmed;
};

export const normalizeAcademicRow = (row) => {
  const normalized = {};
  for (const [key, value] of Object.entries(row)) {
    normalized[normalizeAcademicHeader(key)] = value;
  }
  return normalized;
};

// Compatibilidad pública: todos los consumidores usan estas mismas reglas.
export const normalizeKeys = normalizeAcademicRow;
export const parseReportPercentage = (value, context = {}) =>
  parsePercentagePointsCell(value, context).value;
export const parseCriticalPercentage = (value, context = {}) =>
  parseFractionPercentageCell(value, context).value;

const parseRequiredText = (value, context) => {
  if (isBlank(value) || isDash(value)) validationError('El campo es obligatorio', context);
  return String(value).trim();
};

const assertRequiredHeaders = (headers, required, sheet) => {
  const available = new Set(headers);
  const missing = required.filter((header) => !available.has(header));
  if (missing.length > 0) {
    validationError(`Faltan columnas requeridas: ${missing.join(', ')}`, { sheet });
  }
};

const extractYears = (headers, patterns) => {
  const years = new Set();
  for (const header of headers) {
    for (const pattern of patterns) {
      const match = header.match(pattern);
      if (match) years.add(Number(match[1]));
    }
  }
  return [...years].sort((a, b) => a - b);
};

const readOptionalCell = (row, headers, header, parser, context) => {
  if (!headers.has(header)) return { value: null, estado: null, present: false };
  return { ...parser(row[header], { ...context, header }), present: true };
};

const setParsedField = (record, states, field, parsed) => {
  record[field] = parsed.value;
  if (parsed.present) states[field] = parsed.estado;
};

const missingStateFor = (...parsedCells) => {
  const present = parsedCells.filter((cell) => cell.present);
  if (present.some((cell) => cell.estado === ESTADOS_DATO.GUION_ORIGEN)) {
    return ESTADOS_DATO.GUION_ORIGEN;
  }
  return ESTADOS_DATO.VACIO_ORIGEN;
};

const parseReporteriaRows = (worksheet) =>
  xlsx.utils.sheet_to_json(worksheet, { defval: null, raw: true }).map(normalizeAcademicRow);

const parseAsignaturasRows = (worksheet) =>
  xlsx.utils.sheet_to_json(worksheet, { defval: null, raw: true, range: 3 }).map(normalizeAcademicRow);

const getHeaders = (worksheet, headerRow) => {
  const rows = xlsx.utils.sheet_to_json(worksheet, {
    header: 1,
    range: headerRow - 1,
    blankrows: false,
    raw: true,
  });
  return (rows[0] ?? []).map(normalizeAcademicHeader).filter(Boolean);
};

export const parseAsignaturasWorksheet = (worksheet) => {
  const headers = getHeaders(worksheet, 4);
  assertRequiredHeaders(headers, [
    'CarCodigo',
    'CarNombre',
    'Extraecod',
    'Códigos asignaturas críticas',
    'Semestre',
  ], 'AsigCriticas');
  return parseAsignaturasRows(worksheet);
};

const hasAnyValue = (row) => Object.values(row).some((value) => !isBlank(value));

const parseCareerRows = (rows) => {
  const carreras = [];
  const seenCodes = new Map();

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    if (!hasAnyValue(row)) return;

    const carCodigo = parseRequiredText(row.CarCodigo, {
      sheet: 'Reporteria', row: rowNumber, header: 'CarCodigo',
    });
    const nombre = parseRequiredText(row.Carreras, {
      sheet: 'Reporteria', row: rowNumber, header: 'Carreras',
    });
    const sede = parseRequiredText(row.Sede, {
      sheet: 'Reporteria', row: rowNumber, header: 'Sede',
    });
    const idMacrounidad = parseRequiredText(row.Macrounidad, {
      sheet: 'Reporteria', row: rowNumber, header: 'Macrounidad',
    });

    if (seenCodes.has(carCodigo)) {
      const previous = seenCodes.get(carCodigo);
      const detail = previous.sede === sede
        ? 'El CarCodigo está repetido'
        : `El CarCodigo está asociado a sedes distintas (${previous.sede} y ${sede})`;
      validationError(detail, { sheet: 'Reporteria', row: rowNumber, header: 'CarCodigo' });
    }

    seenCodes.set(carCodigo, { row: rowNumber, sede });
    carreras.push({
      car_codigo: carCodigo,
      nombre,
      sede,
      id_macrounidad: idMacrounidad,
    });
  });

  return carreras;
};

const buildIngresos = (rows, headers) => {
  const years = extractYears([...headers], [
    /^ING_(\d{4})$/,
    /^N Ing_(\d{4})$/,
    /^SUA_(\d{4})$/,
    /^I_PACE_(\d{4})$/,
    /^I_ESPECIAL_(\d{4})$/,
    /^P_Mujer_(\d{4})$/,
    /^%VacCub(?:SUA|PACE|RAE)_(\d{4})$/,
  ]);
  const records = [];

  rows.forEach((row, rowIndex) => {
    if (!row.CarCodigo) return;
    const carCodigo = String(row.CarCodigo).trim();

    for (const cohorte of years) {
      const context = { sheet: 'Reporteria', row: rowIndex + 2 };
      const ing = readOptionalCell(row, headers, `ING_${cohorte}`, parseCountCell, context);
      const nIng = readOptionalCell(row, headers, `N Ing_${cohorte}`, parseCountCell, context);

      if (
        ing.estado === ESTADOS_DATO.INFORMADO
        && nIng.estado === ESTADOS_DATO.INFORMADO
        && ing.value !== nIng.value
      ) {
        validationError('ING y N Ing deben coincidir cuando ambos están informados', {
          ...context, header: `ING_${cohorte} / N Ing_${cohorte}`,
        });
      }

      let ingresosTotales = null;
      let estadoIngresosTotales = missingStateFor(ing, nIng);
      if (ing.estado === ESTADOS_DATO.INFORMADO) {
        ingresosTotales = ing.value;
        estadoIngresosTotales = ing.estado;
      } else if (nIng.estado === ESTADOS_DATO.INFORMADO) {
        ingresosTotales = nIng.value;
        estadoIngresosTotales = nIng.estado;
      }

      const estadosDatos = { ingresos_totales: estadoIngresosTotales };
      const record = {
        car_codigo: carCodigo,
        cohorte,
        ingresos_sua: null,
        ingresos_pace: null,
        ingresos_especiales: null,
        ingresos_totales: ingresosTotales,
        porcentaje_mujeres: null,
        cobertura_sua: null,
        cobertura_pace: null,
        cobertura_rae: null,
        estados_datos: estadosDatos,
      };

      setParsedField(record, estadosDatos, 'ingresos_sua', readOptionalCell(
        row, headers, `SUA_${cohorte}`, parseCountCell, context,
      ));
      setParsedField(record, estadosDatos, 'ingresos_pace', readOptionalCell(
        row, headers, `I_PACE_${cohorte}`, parseCountCell, context,
      ));
      setParsedField(record, estadosDatos, 'ingresos_especiales', readOptionalCell(
        row, headers, `I_ESPECIAL_${cohorte}`, parseCountCell, context,
      ));
      setParsedField(record, estadosDatos, 'porcentaje_mujeres', readOptionalCell(
        row, headers, `P_Mujer_${cohorte}`, parsePercentagePointsCell, context,
      ));

      const coverageParser = (value, cellContext) =>
        parsePercentagePointsCell(value, cellContext, { allowAbove100: true });
      setParsedField(record, estadosDatos, 'cobertura_sua', readOptionalCell(
        row, headers, `%VacCubSUA_${cohorte}`, coverageParser, context,
      ));
      setParsedField(record, estadosDatos, 'cobertura_pace', readOptionalCell(
        row, headers, `%VacCubPACE_${cohorte}`, coverageParser, context,
      ));
      setParsedField(record, estadosDatos, 'cobertura_rae', readOptionalCell(
        row, headers, `%VacCubRAE_${cohorte}`, coverageParser, context,
      ));

      records.push(record);
    }
  });

  return records;
};

const buildMatriculas = (rows, headers) => {
  const years = extractYears([...headers], [
    /^MT_(\d{4})$/,
    /^MT_Muj_(\d{4})$/,
    /^%MTMuj_(\d{4})$/,
  ]);
  const records = [];

  rows.forEach((row, rowIndex) => {
    if (!row.CarCodigo) return;
    for (const anioMedicion of years) {
      const context = { sheet: 'Reporteria', row: rowIndex + 2 };
      const estadosDatos = {};
      const record = {
        car_codigo: String(row.CarCodigo).trim(),
        anio_medicion: anioMedicion,
        matricula_total: null,
        matricula_mujeres: null,
        porcentaje_mujeres: null,
        estados_datos: estadosDatos,
      };
      setParsedField(record, estadosDatos, 'matricula_total', readOptionalCell(
        row, headers, `MT_${anioMedicion}`, parseCountCell, context,
      ));
      setParsedField(record, estadosDatos, 'matricula_mujeres', readOptionalCell(
        row, headers, `MT_Muj_${anioMedicion}`, parseCountCell, context,
      ));
      setParsedField(record, estadosDatos, 'porcentaje_mujeres', readOptionalCell(
        row, headers, `%MTMuj_${anioMedicion}`, parsePercentagePointsCell, context,
      ));
      records.push(record);
    }
  });

  return records;
};

const buildProgresiones = (rows, headers) => {
  const years = extractYears([...headers], [
    /^TR(?:[1-4]|Total)_(\d{4})$/,
    /^TT[TOE]_(\d{4})$/,
    /^Dur_Sem_(\d{4})$/,
  ]);
  const records = [];
  const mappings = [
    ['retencion_a1', 'TR1_', parsePercentagePointsCell],
    ['retencion_a2', 'TR2_', parsePercentagePointsCell],
    ['retencion_a3', 'TR3_', parsePercentagePointsCell],
    ['retencion_a4', 'TR4_', parsePercentagePointsCell],
    ['retencion_total', 'TRTotal_', parsePercentagePointsCell],
    ['tasa_titulacion_total', 'TTT_', parsePercentagePointsCell],
    ['tasa_titulacion_oportuna', 'TTO_', parsePercentagePointsCell],
    ['tasa_titulacion_efectiva', 'TTE_', parsePercentagePointsCell],
    ['duracion_real_semestres', 'Dur_Sem_', parseNonNegativeDecimalCell],
  ];

  rows.forEach((row, rowIndex) => {
    if (!row.CarCodigo) return;
    for (const cohorte of years) {
      const context = { sheet: 'Reporteria', row: rowIndex + 2 };
      const estadosDatos = {};
      const record = {
        car_codigo: String(row.CarCodigo).trim(),
        cohorte,
        estados_datos: estadosDatos,
      };
      for (const [field, prefix, parser] of mappings) {
        setParsedField(record, estadosDatos, field, readOptionalCell(
          row, headers, `${prefix}${cohorte}`, parser, context,
        ));
      }
      records.push(record);
    }
  });

  return records;
};

const buildEficiencias = (rows, headers) => {
  const years = extractYears([...headers], [
    /^(?:BAJA|MEDIA|ALTA|EFICIENTE)_(\d{4})$/,
    /^N Alum Reg (\d{4})$/,
  ]);
  const records = [];
  const mappings = [
    ['nivel_baja', 'BAJA_'],
    ['nivel_media', 'MEDIA_'],
    ['nivel_alta', 'ALTA_'],
    ['nivel_eficiente', 'EFICIENTE_'],
    ['total_alumnos_regulares', 'N Alum Reg '],
  ];

  rows.forEach((row, rowIndex) => {
    if (!row.CarCodigo) return;
    for (const cohorte of years) {
      const context = { sheet: 'Reporteria', row: rowIndex + 2 };
      const estadosDatos = {};
      const record = {
        car_codigo: String(row.CarCodigo).trim(),
        cohorte,
        estados_datos: estadosDatos,
      };
      const parsedFields = [];

      for (const [field, prefix] of mappings) {
        const parsed = readOptionalCell(
          row, headers, `${prefix}${cohorte}`, parseCountCell, context,
        );
        parsedFields.push(parsed);
        setParsedField(record, estadosDatos, field, parsed);
      }

      const informed = parsedFields.filter((cell) => cell.estado === ESTADOS_DATO.INFORMADO);
      if (informed.length > 0 && informed.length < parsedFields.filter((cell) => cell.present).length) {
        validationError('La distribución de eficiencia está parcialmente informada', {
          ...context, header: `eficiencia ${cohorte}`,
        });
      }
      if (informed.length === 5) {
        const levels = record.nivel_baja + record.nivel_media
          + record.nivel_alta + record.nivel_eficiente;
        if (levels !== record.total_alumnos_regulares) {
          validationError('BAJA + MEDIA + ALTA + EFICIENTE debe ser igual a N Alum Reg', {
            ...context, header: `eficiencia ${cohorte}`,
          });
        }
      }

      records.push(record);
    }
  });

  return records;
};

const buildAvancesCurriculares = (rows, headers) => {
  const years = extractYears([...headers], [
    /^Bachillerato_(\d{4})$/,
    /^Lic_Asig_Pen_Bachi_(\d{4})$/,
    /^Licenciatura_(\d{4})$/,
    /^T_Asign_Pen_BachLic_(\d{4})$/,
    /^Título_(\d{4})$/,
  ]);
  const records = [];
  const mappings = [
    ['porcentaje_bachillerato', 'Bachillerato_'],
    ['porcentaje_licenciatura_con_bachillerato_pendiente', 'Lic_Asig_Pen_Bachi_'],
    ['porcentaje_licenciatura', 'Licenciatura_'],
    ['porcentaje_titulo_con_bachillerato_licenciatura_pendiente', 'T_Asign_Pen_BachLic_'],
    ['porcentaje_titulo', 'Título_'],
  ];

  rows.forEach((row, rowIndex) => {
    if (!row.CarCodigo) return;
    for (const cohorte of years) {
      const context = { sheet: 'Reporteria', row: rowIndex + 2 };
      const estadosDatos = {};
      const record = {
        car_codigo: String(row.CarCodigo).trim(),
        cohorte,
        estados_datos: estadosDatos,
      };
      const parsedFields = [];

      for (const [field, prefix] of mappings) {
        const parsed = readOptionalCell(
          row, headers, `${prefix}${cohorte}`, parsePercentagePointsCell, context,
        );
        parsedFields.push(parsed);
        setParsedField(record, estadosDatos, field, parsed);
      }

      if (parsedFields.every((cell) => cell.estado === ESTADOS_DATO.INFORMADO)) {
        const total = parsedFields.reduce((sum, cell) => sum + cell.value, 0);
        if (Math.abs(total - 100) > 1) {
          validationError('Las cinco categorías de avance curricular deben sumar 100 ± 1', {
            ...context, header: `avance curricular ${cohorte}`,
          });
        }
      }

      records.push(record);
    }
  });

  return records;
};

const buildAsignaturasCriticas = (worksheet, careerCodes) => {
  const headersArray = getHeaders(worksheet, 4);
  const headers = new Set(headersArray);
  assertRequiredHeaders(headersArray, [
    'CarCodigo',
    'CarNombre',
    'Extraecod',
    'Códigos asignaturas críticas',
    'Semestre',
  ], 'AsigCriticas');

  const years = extractYears(headersArray, [/^(\d{4})$/]);
  if (years.length === 0) {
    validationError('No se encontraron columnas de años', { sheet: 'AsigCriticas' });
  }

  const rows = parseAsignaturasRows(worksheet);
  const records = [];
  const seenKeys = new Set();

  rows.forEach((row, rowIndex) => {
    if (!hasAnyValue(row)) return;
    const rowNumber = rowIndex + 5;
    const carCodigo = parseRequiredText(row.CarCodigo, {
      sheet: 'AsigCriticas', row: rowNumber, header: 'CarCodigo',
    });
    if (!careerCodes.has(carCodigo)) {
      validationError('El CarCodigo no existe en la hoja Reporteria', {
        sheet: 'AsigCriticas', row: rowNumber, header: 'CarCodigo',
      });
    }

    const asigCodigoBase = parseRequiredText(row.Extraecod, {
      sheet: 'AsigCriticas', row: rowNumber, header: 'Extraecod',
    });
    const asigCodigo = parseRequiredText(row['Códigos asignaturas críticas'], {
      sheet: 'AsigCriticas', row: rowNumber, header: 'Códigos asignaturas críticas',
    });
    if (asigCodigo !== asigCodigoBase && !asigCodigo.startsWith(`${asigCodigoBase}-`)) {
      validationError('El código completo no corresponde al Extraecod informado', {
        sheet: 'AsigCriticas', row: rowNumber, header: 'Códigos asignaturas críticas',
      });
    }
    const semestreResult = parseCountCell(row.Semestre, {
      sheet: 'AsigCriticas', row: rowNumber, header: 'Semestre',
    });
    if (![1, 2, 3].includes(semestreResult.value)) {
      validationError('Semestre debe ser 1, 2 o 3', {
        sheet: 'AsigCriticas', row: rowNumber, header: 'Semestre',
      });
    }

    for (const anioMedicion of years) {
      const key = `${carCodigo}\u0000${asigCodigo}\u0000${semestreResult.value}\u0000${anioMedicion}`;
      if (seenKeys.has(key)) {
        validationError('La asignatura y período están duplicados', {
          sheet: 'AsigCriticas', row: rowNumber, header: String(anioMedicion),
        });
      }
      seenKeys.add(key);

      const parsedRate = readOptionalCell(
        row,
        headers,
        String(anioMedicion),
        parseFractionPercentageCell,
        { sheet: 'AsigCriticas', row: rowNumber },
      );

      records.push({
        car_codigo: carCodigo,
        asig_codigo_base: asigCodigoBase,
        asig_codigo: asigCodigo,
        semestre: semestreResult.value,
        anio_medicion: anioMedicion,
        tasa_reprobacion: parsedRate.value,
        estado_dato: parsedRate.estado,
      });
    }
  });

  return records;
};

export const parseAcademicWorkbook = (buffer) => {
  if (!buffer) validationError('No se recibió el archivo Excel');

  let workbook;
  try {
    workbook = xlsx.read(buffer, { type: 'buffer', raw: true });
  } catch {
    validationError('El archivo no se pudo leer como un libro Excel válido');
  }

  for (const requiredSheet of ['Reporteria', 'AsigCriticas']) {
    if (!workbook.SheetNames.includes(requiredSheet)) {
      validationError(`Falta la hoja "${requiredSheet}"`, { sheet: requiredSheet });
    }
  }

  const reporteriaWorksheet = workbook.Sheets.Reporteria;
  const reporteriaHeadersArray = getHeaders(reporteriaWorksheet, 1);
  assertRequiredHeaders(reporteriaHeadersArray, [
    'CarCodigo', 'Carreras', 'Sede', 'Macrounidad',
  ], 'Reporteria');

  const reporteriaHeaders = new Set(reporteriaHeadersArray);
  const reporteriaRows = parseReporteriaRows(reporteriaWorksheet);
  const carreras = parseCareerRows(reporteriaRows);
  const careerCodes = new Set(carreras.map((career) => career.car_codigo));
  const macrounidades = [...new Map(carreras.map((career) => [
    career.id_macrounidad,
    {
      id_macrounidad: career.id_macrounidad,
      nombre: career.id_macrounidad,
    },
  ])).values()];

  return {
    macrounidades,
    carreras,
    ingresos: buildIngresos(reporteriaRows, reporteriaHeaders),
    matriculas: buildMatriculas(reporteriaRows, reporteriaHeaders),
    progresiones: buildProgresiones(reporteriaRows, reporteriaHeaders),
    eficiencias: buildEficiencias(reporteriaRows, reporteriaHeaders),
    avancesCurriculares: buildAvancesCurriculares(reporteriaRows, reporteriaHeaders),
    asignaturasCriticas: buildAsignaturasCriticas(workbook.Sheets.AsigCriticas, careerCodes),
    filasReporteria: carreras.length,
  };
};
