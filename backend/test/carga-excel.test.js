import test from 'node:test';
import assert from 'node:assert/strict';
import * as xlsx from 'xlsx';

import {
  AcademicWorkbookValidationError,
  ESTADOS_DATO,
  normalizeAcademicHeader,
  normalizeKeys,
  parseAcademicWorkbook,
  parseAsignaturasWorksheet,
  parseCountCell,
  parseCriticalPercentage,
  parseFractionPercentageCell,
  parsePercentagePointsCell,
} from '../src/services/academic-import.service.js';

const createAcademicWorkbook = ({
  reporteriaHeaders,
  reporteriaRows,
  asignaturasHeaders = [
    'CarCodigo',
    'CarNombre',
    'Extraecod',
    'C\uFFFDdigos asignaturas cr\uFFFDticas',
    'Semestre',
    2021,
    'Cr\uFFFDtica (3 o m\uFFFDs veces)',
  ],
  asignaturasRows = [],
}) => {
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(
    workbook,
    xlsx.utils.aoa_to_sheet([reporteriaHeaders, ...reporteriaRows]),
    'Reporteria',
  );
  xlsx.utils.book_append_sheet(
    workbook,
    xlsx.utils.aoa_to_sheet([
      ['ASIGNATURAS PARA REPORTERIA'],
      [],
      [],
      asignaturasHeaders,
      ...asignaturasRows,
    ]),
    'AsigCriticas',
  );
  return xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
};

const REQUIRED_REPORT_HEADERS = ['CarCodigo', 'Carreras', 'Sede', 'Macrounidad'];

const buildMinimalWorkbook = (reporteriaRows, extra = {}) => createAcademicWorkbook({
  reporteriaHeaders: REQUIRED_REPORT_HEADERS,
  reporteriaRows,
  ...extra,
});

test('normaliza los encabezados dañados presentes en el Excel vigente', () => {
  const fila = normalizeKeys({
    ' C�digos asignaturas cr�ticas ': 'ASIG-01',
    'T�tulo_2021': 12,
  });

  assert.equal(fila['Códigos asignaturas críticas'], 'ASIG-01');
  assert.equal(fila['Título_2021'], 12);
});

test('lee la cabecera de AsigCriticas desde la fila 4', () => {
  const worksheet = xlsx.utils.aoa_to_sheet([
    [null, 'ASIGNATURAS PARA REPORTERIA'],
    [],
    [],
    ['CarCodigo', 'CarNombre', 'Extraecod', 'C�digos asignaturas cr�ticas', 'Semestre', 2021],
    ['0001', 'Carrera de prueba', null, 'ASIG-01', 1, 0.25],
  ]);

  const filas = parseAsignaturasWorksheet(worksheet);

  assert.equal(filas.length, 1);
  assert.equal(filas[0].CarCodigo, '0001');
  assert.equal(filas[0]['Códigos asignaturas críticas'], 'ASIG-01');
  assert.equal(filas[0]['2021'], 0.25);
});

test('convierte la fracción porcentual de Excel a puntos porcentuales', () => {
  assert.equal(parseCriticalPercentage(0.628), 62.8);
  assert.equal(parseCriticalPercentage(1), 100);
  assert.equal(parseCriticalPercentage('35,5%'), 35.5);
  assert.equal(parseCriticalPercentage('-'), null);
});

test('rechaza una hoja AsigCriticas sin las columnas obligatorias', () => {
  const worksheet = xlsx.utils.aoa_to_sheet([
    ['Título'],
    [],
    [],
    ['CarCodigo', 'Semestre', 2021],
    ['0001', 1, 0.25],
  ]);

  assert.throws(
    () => parseAsignaturasWorksheet(worksheet),
    /Códigos asignaturas críticas/,
  );
});

test('distingue cero, vacío y guion, y respeta la unidad porcentual de cada hoja', () => {
  assert.deepEqual(parseCountCell(0), {
    value: 0,
    estado: ESTADOS_DATO.INFORMADO,
  });
  assert.deepEqual(parseCountCell(null), {
    value: null,
    estado: ESTADOS_DATO.VACIO_ORIGEN,
  });
  assert.deepEqual(parseCountCell('-'), {
    value: null,
    estado: ESTADOS_DATO.GUION_ORIGEN,
  });
  assert.equal(parsePercentagePointsCell(1).value, 1);
  assert.equal(parseFractionPercentageCell(1).value, 100);
  assert.equal(parseFractionPercentageCell('35,5%').value, 35.5);
});

test('rechaza texto inválido en vez de convertirlo silenciosamente en cero', () => {
  assert.throws(
    () => parseCountCell('sin dato'),
    /no se puede interpretar como número/,
  );
});

test('normaliza las cabeceras dañadas necesarias para la importación académica', () => {
  assert.equal(
    normalizeAcademicHeader(' C\uFFFDdigos asignaturas cr\uFFFDticas '),
    'Códigos asignaturas críticas',
  );
  assert.equal(normalizeAcademicHeader('T\uFFFDtulo_2025'), 'Título_2025');
  assert.equal(
    normalizeAcademicHeader('Cr\uFFFDtica (3 o m\uFFFDs veces)'),
    'Crítica (3 o más veces)',
  );
});

test('normaliza el libro académico separando cohortes y años de medición', () => {
  const reporteriaHeaders = [
    ...REQUIRED_REPORT_HEADERS,
    'SUA_2022', 'I_PACE_2022', 'I_ESPECIAL_2022', 'ING_2022',
    '%VacCubSUA_2022', '%VacCubPACE_2022', '%VacCubRAE_2022',
    'N Ing_2015', 'P_Mujer_2015', 'N Ing_2022', 'P_Mujer_2022',
    'MT_2022', 'MT_Muj_2022', '%MTMuj_2022',
    ' TR1_2022', ' TRTotal_2022', ' TTT_2022', ' TTO_2022', ' TTE_2022',
    'Dur_Sem_2022',
    'BAJA_2021', 'MEDIA_2021', 'ALTA_2021', 'EFICIENTE_2021', 'N Alum Reg 2021',
    'Bachillerato_2021', 'Lic_Asig_Pen_Bachi_2021', 'Licenciatura_2021',
    'T_Asign_Pen_BachLic_2021', 'T\uFFFDtulo_2021',
  ];
  const reporteriaRows = [[
    '0001', 'Carrera de prueba', 'Sede de prueba', 'Unidad de prueba',
    0, '-', null, 10,
    125, 0, null,
    8, 50, 10, 40,
    100, 45, 45,
    80, 75, 25, 20, 10,
    11.5,
    2, 3, 4, 1, 10,
    20, 10, 30, 15, 25,
  ]];
  const buffer = createAcademicWorkbook({
    reporteriaHeaders,
    reporteriaRows,
    asignaturasRows: [[
      '0001', 'Unidad de prueba', 'ASIG001', 'ASIG001-24', 1, 0.3, 3,
    ]],
  });

  const parsed = parseAcademicWorkbook(buffer);

  assert.equal(parsed.filasReporteria, 1);
  assert.equal(parsed.carreras[0].car_codigo, '0001');

  const ingresoHistorico = parsed.ingresos.find((item) => item.cohorte === 2015);
  assert.equal(ingresoHistorico.ingresos_totales, 8);

  const ingreso2022 = parsed.ingresos.find((item) => item.cohorte === 2022);
  assert.equal(ingreso2022.ingresos_totales, 10);
  assert.equal(ingreso2022.ingresos_sua, 0);
  assert.equal(ingreso2022.estados_datos.ingresos_sua, ESTADOS_DATO.INFORMADO);
  assert.equal(ingreso2022.estados_datos.ingresos_pace, ESTADOS_DATO.GUION_ORIGEN);
  assert.equal(
    ingreso2022.estados_datos.ingresos_especiales,
    ESTADOS_DATO.VACIO_ORIGEN,
  );
  assert.equal(ingreso2022.cobertura_sua, 125);

  assert.equal(parsed.matriculas[0].anio_medicion, 2022);
  assert.equal(parsed.progresiones[0].cohorte, 2022);
  assert.equal(parsed.progresiones[0].tasa_titulacion_total, 25);
  assert.equal('tasa_titulacion_temprana' in parsed.progresiones[0], false);

  assert.equal(parsed.eficiencias[0].cohorte, 2021);
  assert.equal(parsed.eficiencias[0].total_alumnos_regulares, 10);

  assert.equal(parsed.avancesCurriculares[0].cohorte, 2021);
  assert.equal(
    parsed.avancesCurriculares[0]
      .porcentaje_titulo_con_bachillerato_licenciatura_pendiente,
    15,
  );
  assert.equal(parsed.avancesCurriculares[0].porcentaje_titulo, 25);

  assert.equal(parsed.asignaturasCriticas[0].anio_medicion, 2021);
  assert.equal(parsed.asignaturasCriticas[0].asig_codigo_base, 'ASIG001');
  assert.equal(parsed.asignaturasCriticas[0].tasa_reprobacion, 30);
  assert.equal(parsed.asignaturasCriticas[0].estado_dato, ESTADOS_DATO.INFORMADO);
});

test('rechaza CarCodigo duplicado incluso cuando aparece en otra sede', () => {
  const buffer = buildMinimalWorkbook([
    ['0001', 'Carrera de prueba', 'Sede A', 'Unidad de prueba'],
    ['0001', 'Carrera de prueba', 'Sede B', 'Unidad de prueba'],
  ]);

  assert.throws(
    () => parseAcademicWorkbook(buffer),
    (error) => error instanceof AcademicWorkbookValidationError
      && /sedes distintas/.test(error.message),
  );
});

test('rechaza ING y N Ing informados con valores diferentes', () => {
  const buffer = createAcademicWorkbook({
    reporteriaHeaders: [...REQUIRED_REPORT_HEADERS, 'ING_2022', 'N Ing_2022'],
    reporteriaRows: [[
      '0001', 'Carrera de prueba', 'Sede de prueba', 'Unidad de prueba', 10, 11,
    ]],
  });

  assert.throws(() => parseAcademicWorkbook(buffer), /ING y N Ing deben coincidir/);
});

test('rechaza una distribución de eficiencia que no reconcilia con N Alum Reg', () => {
  const buffer = createAcademicWorkbook({
    reporteriaHeaders: [
      ...REQUIRED_REPORT_HEADERS,
      'BAJA_2025', 'MEDIA_2025', 'ALTA_2025', 'EFICIENTE_2025', 'N Alum Reg 2025',
    ],
    reporteriaRows: [[
      '0001', 'Carrera de prueba', 'Sede de prueba', 'Unidad de prueba',
      1, 2, 3, 4, 11,
    ]],
  });

  assert.throws(() => parseAcademicWorkbook(buffer), /debe ser igual a N Alum Reg/);
});

test('conserva marcadores parciales de avance curricular sin inventar ceros', () => {
  const buffer = createAcademicWorkbook({
    reporteriaHeaders: [
      ...REQUIRED_REPORT_HEADERS,
      'Bachillerato_2025', 'Lic_Asig_Pen_Bachi_2025', 'Licenciatura_2025',
      'T_Asign_Pen_BachLic_2025', 'T\uFFFDtulo_2025',
    ],
    reporteriaRows: [[
      '0001', 'Carrera de prueba', 'Sede de prueba', 'Unidad de prueba',
      50, '-', 25, null, 25,
    ]],
  });

  const parsed = parseAcademicWorkbook(buffer);
  const avance = parsed.avancesCurriculares[0];
  assert.equal(avance.porcentaje_licenciatura_con_bachillerato_pendiente, null);
  assert.equal(
    avance.estados_datos.porcentaje_licenciatura_con_bachillerato_pendiente,
    ESTADOS_DATO.GUION_ORIGEN,
  );
  assert.equal(
    avance.porcentaje_titulo_con_bachillerato_licenciatura_pendiente,
    null,
  );
  assert.equal(
    avance.estados_datos
      .porcentaje_titulo_con_bachillerato_licenciatura_pendiente,
    ESTADOS_DATO.VACIO_ORIGEN,
  );
});

test('rechaza ciclos completos fuera de la tolerancia 100 ± 1', () => {
  const buffer = createAcademicWorkbook({
    reporteriaHeaders: [
      ...REQUIRED_REPORT_HEADERS,
      'Bachillerato_2025', 'Lic_Asig_Pen_Bachi_2025', 'Licenciatura_2025',
      'T_Asign_Pen_BachLic_2025', 'T\uFFFDtulo_2025',
    ],
    reporteriaRows: [[
      '0001', 'Carrera de prueba', 'Sede de prueba', 'Unidad de prueba',
      20, 20, 20, 20, 10,
    ]],
  });

  assert.throws(() => parseAcademicWorkbook(buffer), /deben sumar 100/);
});

test('valida la fracción y el semestre de asignaturas críticas', () => {
  const invalidFraction = buildMinimalWorkbook([
    ['0001', 'Carrera de prueba', 'Sede de prueba', 'Unidad de prueba'],
  ], {
    asignaturasRows: [[
      '0001', 'Unidad de prueba', 'ASIG001', 'ASIG001-24', 1, 1.2, 3,
    ]],
  });
  assert.throws(() => parseAcademicWorkbook(invalidFraction), /fracción porcentual/);

  const invalidSemester = buildMinimalWorkbook([
    ['0001', 'Carrera de prueba', 'Sede de prueba', 'Unidad de prueba'],
  ], {
    asignaturasRows: [[
      '0001', 'Unidad de prueba', 'ASIG001', 'ASIG001-24', 4, 0.3, 3,
    ]],
  });
  assert.throws(() => parseAcademicWorkbook(invalidSemester), /Semestre debe ser 1, 2 o 3/);

  const invalidBaseCode = buildMinimalWorkbook([
    ['0001', 'Carrera de prueba', 'Sede de prueba', 'Unidad de prueba'],
  ], {
    asignaturasRows: [[
      '0001', 'Unidad de prueba', 'OTRA001', 'ASIG001-24', 1, 0.3, 3,
    ]],
  });
  assert.throws(
    () => parseAcademicWorkbook(invalidBaseCode),
    /no corresponde al Extraecod/,
  );
});
