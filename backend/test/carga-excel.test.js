import test from 'node:test';
import assert from 'node:assert/strict';
import * as xlsx from 'xlsx';

import {
  normalizeKeys,
  parseAsignaturasWorksheet,
  parseExcelPercentageOrNull,
} from '../src/controllers/carga.controller.js';

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
  assert.equal(parseExcelPercentageOrNull(0.628), 62.8);
  assert.equal(parseExcelPercentageOrNull(1), 100);
  assert.equal(parseExcelPercentageOrNull('35,5%'), 35.5);
  assert.equal(parseExcelPercentageOrNull('-'), null);
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
