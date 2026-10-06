import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import directorRoutes from '../src/routes/director-home.routes.js';
import { errorHandler } from '../src/middlewares/error.middleware.js';
import { SESSION_COOKIE_NAME } from '../src/config/auth.js';
import {
  Carrera, Usuario, FactIngreso, FactMatricula, FactProgresion, FactAsignaturaCritica
} from '../src/persistence/models/index.js';

// Todas las consultas son sustituidas por datos ficticios: no conecta a PostgreSQL.
const TEST_SECRET = 'clave-exclusiva-de-pruebas-director-home-sin-uso-real';
let previousSecret;
let server;
let baseUrl;
let cookie;

before(async () => {
  previousSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = TEST_SECRET;
  const app = express();
  app.use(cookieParser());
  app.use('/api/director', directorRoutes);
  app.use(errorHandler);
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  baseUrl = `http://127.0.0.1:${server.address().port}/api/director/home`;
  cookie = `${SESSION_COOKIE_NAME}=${jwt.sign({ sub: '1' }, TEST_SECRET, { expiresIn: '5m' })}`;
});

after(async () => {
  if (previousSecret === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = previousSecret;
  if (server) {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
});

// Pares del ranking de retención para la cohorte 2022: la carrera de la sesión
// lidera, por lo que ocupa el Top 25 % entre las cuatro carreras informadas.
const RANKING_RETENCION = [
  { car_codigo: 'CAR-01', cohorte: 2022, retencion_a1: '90.25' },
  { car_codigo: 'CAR-02', cohorte: 2022, retencion_a1: '85' },
  { car_codigo: 'CAR-03', cohorte: 2022, retencion_a1: '80' },
  { car_codigo: 'CAR-04', cohorte: 2022, retencion_a1: '75' }
];

function fixture(context, { role = 'DIRECTOR', scope = 'PROGRAMA', permission = true, temporary = false, empty = false } = {}) {
  const user = {
    id_usuario: 1,
    activo: true,
    debe_cambiar_password: temporary,
    rol: {
      codigo: role,
      activo: true,
      permisos: permission ? [{ codigo: 'DASHBOARD_DIRECTOR_VER' }] : []
    },
    ambito: { codigo: 'CAR-01', tipo: scope, activo: true },
    get() { return this; }
  };
  context.mock.method(Usuario, 'findByPk', async () => user);
  const careerQuery = context.mock.method(Carrera, 'findByPk', async (code) => {
    assert.equal(code, 'CAR-01');
    return { car_codigo: code, nombre: 'Carrera ficticia', id_macrounidad: 'FAC-01' };
  });
  const modelData = [
    [FactIngreso, [
      { cohorte: 2018, ingresos_totales: '12' },
      { cohorte: 2022, ingresos_totales: '83' },
      { cohorte: 2023, ingresos_totales: '0' }
    ]],
    [FactMatricula, [
      { anio_medicion: 2024, matricula_total: '315' },
      { anio_medicion: 2025, matricula_total: null },
      { anio_medicion: 2026, matricula_total: '0' }
    ]],
    [FactProgresion, [
      { cohorte: 2017, retencion_a1: null },
      { cohorte: 2022, retencion_a1: '90.25', tasa_titulacion_oportuna: '0', duracion_real_semestres: '11.5' }
    ]],
    [FactAsignaturaCritica, [
      { anio_medicion: 2024, tasa_reprobacion: '0.5', estado_dato: 'INFORMADO' },
      { anio_medicion: 2024, tasa_reprobacion: '0', estado_dato: 'INFORMADO' },
      { anio_medicion: 2024, tasa_reprobacion: '40', estado_dato: 'INFORMADO' },
      { anio_medicion: 2024, tasa_reprobacion: null, estado_dato: 'INFORMADO' },
      { anio_medicion: 2024, tasa_reprobacion: null, estado_dato: 'GUION_ORIGEN' },
      { anio_medicion: 2024, tasa_reprobacion: '45', estado_dato: 'NO_DISPONIBLE' },
      { anio_medicion: 2025, tasa_reprobacion: null, estado_dato: 'GUION_ORIGEN' }
    ]]
  ];
  const queries = modelData.map(([model, rows]) => context.mock.method(model, 'findAll', async (options) => {
    if (model === FactProgresion && options.where && 'cohorte' in options.where && !('car_codigo' in options.where)) {
      // Ranking institucional: única consulta entre carreras, limitada a la cohorte.
      assert.equal(typeof options.where.cohorte, 'number', 'el ranking se limita a la cohorte seleccionada');
      return empty ? [] : RANKING_RETENCION;
    }
    assert.deepEqual(options.where, { car_codigo: 'CAR-01' }, 'cada consulta debe restringirse a la carrera autorizada');
    return empty ? [] : rows;
  }));
  return { queries, careerQuery };
}

async function request(query = '', authenticated = true) {
  const response = await fetch(`${baseUrl}${query}`, {
    headers: authenticated ? { Cookie: cookie } : {}
  });
  return { status: response.status, body: await response.json() };
}

test('Home director exige sesión', async (context) => {
  const { queries } = fixture(context);
  assert.equal((await request('', false)).status, 401);
  queries.forEach((query) => assert.equal(query.mock.callCount(), 0));
});

for (const [label, options] of [
  ['contraseña temporal', { temporary: true }],
  ['rol de decano', { role: 'DECANO' }],
  ['falta de permiso', { permission: false }],
  ['ámbito incompatible', { scope: 'FACULTAD' }]
]) {
  test(`Home director rechaza ${label}`, async (context) => {
    const { queries } = fixture(context, options);
    assert.equal((await request()).status, 403);
    queries.forEach((query) => assert.equal(query.mock.callCount(), 0));
  });
}

for (const query of ['?car_codigo=CAR-02', '?car_codigo=CAR-01&car_codigo=CAR-02', '?car_codigo[x]=CAR-01']) {
  test(`Home director rechaza manipular el ámbito: ${query}`, async (context) => {
    const { queries, careerQuery } = fixture(context);
    const response = await request(query);
    assert.equal(response.status, 403);
    assert.equal(response.body.error.code, 'ACADEMIC_SCOPE_FORBIDDEN');
    assert.equal(careerQuery.mock.callCount(), 0);
    queries.forEach((item) => assert.equal(item.mock.callCount(), 0));
  });
}

test('Home usa carrera de sesión y separa cohorte, ingresos y matrícula anual', async (context) => {
  fixture(context);
  const { status, body } = await request('?cohorte=2022&anio_medicion=2024');
  assert.equal(status, 200);
  assert.deepEqual(body.carrera, { codigo: 'CAR-01', nombre: 'Carrera ficticia' });
  assert.deepEqual(body.seleccion, { cohorte: 2022, anio_medicion: 2024 });
  assert.deepEqual(body.kpis, {
    ingresos_totales: 83,
    matricula_total: 315,
    retencion_1er_ano: 90.25,
    titulacion_oportuna: 0,
    tiempo_promedio: 11.5
  });
  assert.deepEqual(body.resumen, {
    registros_asignaturas_informadas: 3,
    total_asignaturas_criticas: 3,
    top_percentil_retencion: 25
  });
});

test('Home deriva períodos históricos y selección inicial desde las tablas autorizadas', async (context) => {
  fixture(context);
  const { body } = await request('?car_codigo=CAR-01');
  assert.deepEqual(body.periodos, { cohortes: [2017, 2018, 2022, 2023], anios_medicion: [2024, 2025, 2026] });
  assert.deepEqual(body.seleccion, { cohorte: 2023, anio_medicion: 2026 });
  assert.equal(body.kpis.ingresos_totales, 0);
  assert.equal(body.kpis.matricula_total, 0);
  assert.equal(body.kpis.retencion_1er_ano, null);
});

test('Home conserva null cuando no hay datos y no transforma ausencias en matrícula cero', async (context) => {
  fixture(context);
  const { body } = await request('?cohorte=2020&anio_medicion=2025');
  assert.equal(body.kpis.ingresos_totales, null);
  assert.equal(body.kpis.matricula_total, null);
  assert.equal(body.kpis.titulacion_oportuna, null);
  assert.equal(body.resumen.registros_asignaturas_informadas, 0);
  // Sin tasa ≥ 30 % en el año 2025 no hay alertas; sin retención propia en la
  // cohorte 2020 no se calcula ranking.
  assert.equal(body.resumen.total_asignaturas_criticas, 0);
  assert.equal(body.resumen.top_percentil_retencion, null);
});

test('Home sin cargas devuelve catálogos vacíos y selección nula', async (context) => {
  fixture(context, { empty: true });
  const { status, body } = await request();
  assert.equal(status, 200);
  assert.deepEqual(body.periodos, { cohortes: [], anios_medicion: [] });
  assert.deepEqual(body.seleccion, { cohorte: null, anio_medicion: null });
  assert.ok(Object.values(body.kpis).every((value) => value === null));
  assert.equal(body.resumen.registros_asignaturas_informadas, null);
  assert.equal(body.resumen.total_asignaturas_criticas, null);
  assert.equal(body.resumen.top_percentil_retencion, null);
});

for (const query of ['?cohorte=abc', '?cohorte=2022.5', '?cohorte=2022&cohorte=2023', '?anio_medicion[x]=2024', '?anio_medicion=', '?anio_medicion=Infinity']) {
  test(`Home valida el período: ${query}`, async (context) => {
    const { queries } = fixture(context);
    const { status, body } = await request(query);
    assert.equal(status, 400);
    assert.equal(body.error.code, 'VALIDATION_ERROR');
    queries.forEach((item) => assert.equal(item.mock.callCount(), 0));
  });
}

test('Home rechaza un ámbito cuya carrera ya no existe', async (context) => {
  const { queries } = fixture(context);
  context.mock.method(Carrera, 'findByPk', async () => null);
  assert.equal((await request()).status, 404);
  queries.forEach((query) => assert.equal(query.mock.callCount(), 0));
});
