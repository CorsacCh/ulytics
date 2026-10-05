import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

// Usa Vite y React ya instalados para cargar TypeScript/TSX sin añadir un
// framework. No abre puertos, no consulta la API ni se conecta a PostgreSQL.
let vite;
let helpers;
let HomeCurricularDecano;
before(async () => {
  vite = await createServer({
    root: fileURLToPath(new URL('../', import.meta.url)),
    configFile: false,
    server: { middlewareMode: true, hmr: false, watch: null },
    appType: 'custom',
    optimizeDeps: { noDiscovery: true, include: [] },
  });
  helpers = await vite.ssrLoadModule('/src/features/dashboards/decano/homeCurricular.ts');
  ({ HomeCurricularDecano } = await vite.ssrLoadModule('/src/features/dashboards/decano/components/HomeCurricularDecano.tsx'));
});
after(async () => { await vite?.close(); });

function carrera(codigo, nombre = codigo) {
  return {
    carrera: { car_codigo: codigo, nombre, sede: 'Sede ficticia', id_macrounidad: 'FAC-PRUEBA' },
    matriculas: [], ingresos: [], progresion: [], eficiencia: [], avance: [], asignaturas: [],
  };
}

function asignatura(overrides = {}) {
  return {
    asig_codigo_base: 'TEST101', asig_codigo: 'TEST101-1', semestre: 1,
    anio_medicion: 2024, tasa_reprobacion: 0.5, estado_dato: 'INFORMADO',
    ...overrides,
  };
}

function datosPrueba() {
  const primera = carrera('CAR-A', 'Carrera de prueba A');
  primera.eficiencia = [
    { cohorte: 2022, total_alumnos_regulares: 200, nivel_baja: 0, nivel_media: 10, nivel_alta: null, nivel_eficiente: 45 },
    { cohorte: 2023, total_alumnos_regulares: 75, nivel_baja: 15, nivel_media: 20, nivel_alta: 20, nivel_eficiente: 20 },
  ];
  primera.avance = [{
    cohorte: 2022,
    porcentaje_bachillerato: 0.5,
    porcentaje_licenciatura_con_bachillerato_pendiente: 20,
    porcentaje_licenciatura: 25,
    porcentaje_titulo_con_bachillerato_licenciatura_pendiente: null,
    porcentaje_titulo: 0,
  }];
  primera.matriculas = [{ anio_medicion: 2023 }, { anio_medicion: 2024 }];
  primera.asignaturas = [
    asignatura(),
    asignatura({ semestre: 2, tasa_reprobacion: 0 }),
    asignatura({ asig_codigo: 'TEST101-2', tasa_reprobacion: null, estado_dato: 'GUION_ORIGEN' }),
    asignatura({ asig_codigo: 'TEST202-1', asig_codigo_base: 'TEST202', tasa_reprobacion: null, estado_dato: 'VACIO_ORIGEN' }),
    asignatura({ anio_medicion: 2025, tasa_reprobacion: 75 }),
  ];
  const segunda = carrera('CAR-B', 'Carrera de prueba B');
  segunda.asignaturas = [asignatura()];
  return [segunda, primera];
}

test('Los años incluyen asignaturas sin matrícula y no confunden cohortes con años de medición', () => {
  assert.deepEqual(helpers.obtenerAniosMedicionHome(datosPrueba()), [2023, 2024, 2025]);
  assert.deepEqual(helpers.obtenerAniosMedicionHome([]), []);
});

test('Eficiencia selecciona solo la cohorte indicada y conserva el total informado, ceros y null', () => {
  const filas = helpers.seleccionarCurricularHome(datosPrueba(), 2022);
  assert.deepEqual(filas.map((fila) => fila.carrera.car_codigo), ['CAR-A', 'CAR-B']);
  assert.equal(filas[0].eficiencia.total_alumnos_regulares, 200);
  assert.equal(filas[0].eficiencia.nivel_baja, 0);
  assert.equal(filas[0].eficiencia.nivel_alta, null);
  assert.equal(filas[1].eficiencia, null);
  assert.equal(helpers.seleccionarCurricularHome(datosPrueba(), 2023)[0].eficiencia.total_alumnos_regulares, 75);
});

test('Avance conserva las cinco categorías y porcentajes sin normalizarlos ni promediarlos', () => {
  const filas = helpers.seleccionarCurricularHome(datosPrueba(), 2022);
  assert.equal(helpers.COLUMNAS_AVANCE.length, 5);
  assert.deepEqual(helpers.COLUMNAS_AVANCE.map(({ llave }) => filas[0].avance[llave]), [0.5, 20, 25, null, 0]);
  assert.equal(filas[1].avance, null);
  assert.equal(helpers.seleccionarCurricularHome(datosPrueba(), 2023)[0].avance, null);
});

test('Períodos sin información no toman silenciosamente los valores de otra cohorte o año', () => {
  for (const periodo of [null, 1990]) {
    assert.ok(helpers.seleccionarCurricularHome(datosPrueba(), periodo).every((fila) => fila.eficiencia === null && fila.avance === null));
    assert.deepEqual(helpers.seleccionarAsignaturasHome(datosPrueba(), periodo), []);
  }
});

test('Asignaturas filtra por año y carrera sin aplicar un umbral y conserva guiones y vacíos', () => {
  const filas = helpers.seleccionarAsignaturasHome(datosPrueba(), 2024, 'CAR-A');
  assert.equal(filas.length, 4);
  assert.ok(filas.every((fila) => fila.carrera.car_codigo === 'CAR-A' && fila.asignatura.anio_medicion === 2024));
  assert.deepEqual(filas.map(({ asignatura: fila }) => fila.tasa_reprobacion), [0.5, 0, null, null]);
  assert.deepEqual(filas.map(({ asignatura: fila }) => fila.estado_dato), ['INFORMADO', 'INFORMADO', 'GUION_ORIGEN', 'VACIO_ORIGEN']);
  assert.deepEqual(helpers.seleccionarAsignaturasHome(datosPrueba(), 2024, 'OTRA-CARRERA'), []);
});

test('No fusiona códigos base iguales entre carreras, códigos completos o semestres distintos', () => {
  const filas = helpers.seleccionarAsignaturasHome(datosPrueba(), 2024);
  const claves = filas.map(({ carrera, asignatura: fila }) => JSON.stringify([carrera.car_codigo, fila.asig_codigo, fila.semestre, fila.anio_medicion]));
  assert.equal(filas.length, 5);
  assert.equal(new Set(claves).size, 5);
});

test('Selección y ordenación no modifican los datos recibidos', () => {
  const datos = datosPrueba();
  const copia = structuredClone(datos);
  helpers.obtenerAniosMedicionHome(datos);
  helpers.seleccionarCurricularHome(datos, 2022);
  helpers.seleccionarAsignaturasHome(datos, 2024);
  assert.deepEqual(datos, copia);
});

test('Formato distingue cero de ausencia, conserva decimales pequeños y describe estados de origen', () => {
  assert.equal(helpers.formatearValorCurricular(0), '0');
  assert.equal(helpers.formatearValorCurricular(0, true), '0%');
  assert.equal(helpers.formatearValorCurricular(0.5, true), '0,5%');
  assert.equal(helpers.formatearValorCurricular(null, true), 'Sin datos');
  assert.equal(helpers.formatearValorCurricular(undefined), 'Sin datos');
  assert.equal(helpers.describirEstadoAsignatura('GUION_ORIGEN'), 'Guion en el Excel');
  assert.equal(helpers.describirEstadoAsignatura('VACIO_ORIGEN'), 'Celda vacía en el Excel');
  assert.equal(helpers.describirEstadoAsignatura(null), 'Estado no disponible');
});

test('El componente presenta los tres apartados, carreras, semestres y estados sin datos ficticios internos', () => {
  const html = renderToStaticMarkup(createElement(HomeCurricularDecano, {
    datos: datosPrueba(), cohorte: 2022, anioMedicion: 2024,
  }));
  for (const texto of [
    'Resumen de eficiencia curricular', 'Avance curricular por carrera', 'Asignaturas informadas',
    'Cohorte 2022', 'Año de medición 2024', 'CAR-A', 'CAR-B', 'Semestre',
    '0,5%', '0%', 'Sin datos', 'Guion en el Excel', 'Celda vacía en el Excel',
    'Código completo', 'Código base', '5 registros',
  ]) assert.ok(html.includes(texto), `Falta ${texto}`);
  assert.equal((html.match(/<table /g) ?? []).length, 3);
  assert.ok(!html.includes('75%'), 'No debe mostrarse la asignatura de 2025');
});

test('El componente tiene estados vacíos claros y no presenta filas de otros períodos', () => {
  const html = renderToStaticMarkup(createElement(HomeCurricularDecano, {
    datos: datosPrueba(), cohorte: 1990, anioMedicion: 1991,
  }));
  assert.ok(html.includes('No hay valores informados para la cohorte seleccionada.'));
  assert.ok(html.includes('No hay registros de asignaturas para el año y la carrera seleccionados.'));
  assert.ok(!html.includes('TEST101'));
  assert.ok(!html.includes('0,5%'));
  assert.equal((html.match(/<table /g) ?? []).length, 2);
});

test('El componente admite una facultad sin carreras', () => {
  const html = renderToStaticMarkup(createElement(HomeCurricularDecano, { datos: [], cohorte: null, anioMedicion: null }));
  assert.ok(html.includes('sin seleccionar'));
  assert.ok(html.includes('0 registros'));
  assert.ok(!html.includes('<table'));
});
